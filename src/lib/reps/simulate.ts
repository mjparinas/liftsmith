import { rng } from "../random";
import { BLAZEPOSE, type Keypoint } from "./pose";

// Synthetic sets for testing and tuning the rep trackers. Each set is a list of planned attempts with
// realistic tempo, depth and noise: camera keypoint jitter, outlier frames and dropouts, or IMU noise,
// bias and a wrist that tilts as it moves. Real recordings should replace these as soon as we have them.

export type TruthKind = "full" | "partial" | "failed" | "grinder";

export interface SimSet {
  kinds: TruthKind[];
  /** Position in [0, 1] (0 at rest, 1 at full depth), sampled densely, and the truth for every attempt. */
  pos: (t: number) => number;
  lengthMs: number;
  /** First movement and end of the last attempt. */
  startMs: number;
  endMs: number;
  /** Planned mean concentric speed for each attempt, as a share of full depth a second. */
  concSpeed: number[];
}

const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));

interface Seg {
  t0: number;
  t1: number;
  a: number;
  b: number;
}

/**
 * Builds a set's trajectory. Depth 1 is always "away from rest". For eccentric-first lifts (squat, bench)
 * the way back is the lifting half; for concentric-first lifts (curl, row, overhead press) it's the way out,
 * so grinds and misses happen going out.
 */
export function simulateSet(kinds: TruthKind[], seed: number, concentricFirst = false): SimSet {
  const r = rng(seed);
  const segs: Seg[] = [];
  let t = 1500 + r() * 1500;
  const add = (dur: number, a: number, b: number) => {
    segs.push({ t0: t, t1: t + dur, a, b });
    t += dur;
  };
  // Setup fidgeting: unrack, walk out, brace (small movements well short of a rep).
  for (let i = 0; i < 2; i++) {
    const d = 0.08 + r() * 0.1;
    add(400 + r() * 300, 0, d);
    add(400 + r() * 300, d, 0);
    add(300 + r() * 500, 0, 0);
  }
  const startMs = t;
  const s_last = () => segs[segs.length - 1].b;
  const concSpeed: number[] = [];
  let fatigue = 1;
  for (let i = 0; i < kinds.length; i++) {
    const k = kinds[i];
    const depth = k === "partial" ? 0.4 + r() * 0.2 : 0.93 + r() * 0.07;
    const ecc = 1100 + r() * 700;
    let conc = (700 + r() * 300) * fatigue;
    fatigue *= 1.04;
    if (concentricFirst) {
      if (k === "grinder") {
        conc *= 2.2;
        const stick = 0.45 + r() * 0.2;
        add(conc * 0.4, 0, depth * stick);
        add(500 + r() * 400, depth * stick, depth * (stick + 0.04));
        add(conc * 0.6, depth * (stick + 0.04), depth);
        concSpeed.push(depth / ((conc + 700) / 1000));
      } else if (k === "failed") {
        add(900, 0, depth * 0.55);
        add(1800 + r() * 800, depth * 0.55, depth * 0.58);
        concSpeed.push(0);
      } else {
        add(conc, 0, depth);
        concSpeed.push(depth / (conc / 1000));
      }
      add(80 + r() * 200, s_last(), s_last());
      add(ecc, s_last(), 0);
    } else {
      add(ecc, 0, depth);
      add(80 + r() * 200, depth, depth);
      if (k === "grinder") {
        conc *= 2.2;
        const stick = 0.45 + r() * 0.2;
        add(conc * 0.4, depth, depth * stick);
        add(500 + r() * 400, depth * stick, depth * (stick - 0.04));
        add(conc * 0.6, depth * (stick - 0.04), 0);
        concSpeed.push(depth / ((conc + 700) / 1000));
      } else if (k === "failed") {
        add(900, depth, depth * 0.65);
        add(1800 + r() * 800, depth * 0.65, depth * 0.62);
        add(900, depth * 0.62, depth);
        // Bar on the safeties, then the lifter climbs out and stands up.
        add(1200 + r() * 1000, depth, depth);
        add(1000, depth, 0);
        concSpeed.push(0);
      } else {
        add(conc, depth, 0);
        concSpeed.push(depth / (conc / 1000));
      }
    }
    if (k !== "failed") add(300 + r() * 900, 0, 0);
  }
  const endMs = segs[segs.length - 1].t1;
  // Rack the bar.
  add(500, 0, 0.1);
  add(500, 0.1, 0);
  add(9000, 0, 0);
  const lengthMs = t;
  const pos = (x: number) => {
    for (const s of segs) if (x >= s.t0 && x < s.t1) return s.a + (s.b - s.a) * ease((x - s.t0) / (s.t1 - s.t0));
    return 0;
  };
  return { kinds, pos, lengthMs, startMs, endMs, concSpeed };
}

export interface CameraNoise {
  fps?: number;
  /** Joint angle jitter (degrees, one standard deviation). */
  jitterDeg?: number;
  /** Share of frames that are wild outliers. */
  outliers?: number;
  /** Share of frames with no pose. */
  dropouts?: number;
}

/** Camera samples (joint angle and bar height) for a simulated set, as the pose layer would produce them. */
export function cameraSamples(
  sim: SimSet,
  seed: number,
  opts: { restDeg: number; romDeg: number; restHigh: boolean; barRomM: number } & CameraNoise,
) {
  const r = rng(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
  const fps = opts.fps ?? 30;
  const out: { t: number; pos: number; bar: number; conf: number }[] = [];
  let burst = 0;
  for (let t = 0; t < sim.lengthMs; t += 1000 / fps + (r() - 0.5) * 6) {
    const f = sim.pos(t);
    if (burst <= 0 && r() < 0.002) burst = 6 + Math.floor(r() * 12);
    if (burst > 0 || r() < (opts.dropouts ?? 0.02)) {
      burst--;
      out.push({ t, pos: NaN, bar: NaN, conf: 0 });
      continue;
    }
    let ang = opts.restHigh ? opts.restDeg - f * opts.romDeg : opts.restDeg + f * opts.romDeg;
    ang += gauss() * (opts.jitterDeg ?? 2.5);
    if (r() < (opts.outliers ?? 0.01)) ang += (r() - 0.5) * 60;
    const bar = 1.4 - f * opts.barRomM + gauss() * 0.012;
    out.push({ t, pos: ang, bar, conf: 0.6 + r() * 0.4 });
  }
  return out;
}

/** Accelerometer readings (including gravity) for a simulated set, as a watch or phone would report. */
export function imuSamples(
  sim: SimSet,
  seed: number,
  opts: { romM: number; downFirst: boolean; hz?: number; noise?: number; tiltDeg?: number },
) {
  const r = rng(seed);
  const gauss = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
  const hz = opts.hz ?? 50;
  const sign = opts.downFirst ? -1 : 1;
  const z = (t: number) => sign * sim.pos(t) * opts.romM;
  const h = 5;
  const bias = [gauss() * 0.05, gauss() * 0.05, gauss() * 0.05];
  const tilt0 = ((10 + r() * 30) * Math.PI) / 180;
  const roll = r() * Math.PI * 2;
  // x, y, z: raw accelerometer with gravity. up and rot: what the platform's sensor fusion reports
  // (vertical linear acceleration from CMDeviceMotion / Android's linear-acceleration and gravity
  // sensors, and rotation rate), with their own smaller noise.
  const out: { t: number; x: number; y: number; z: number; up: number; rot: number }[] = [];
  let lastTilt = tilt0;
  let lastT = 0;
  for (let t = 0; t < sim.lengthMs; t += 1000 / hz + (r() - 0.5) * 2) {
    const acc = (z(t + h) - 2 * z(t) + z(t - h)) / (h / 1000) ** 2;
    // The wrist tilts as it moves (a curl turns it the most), so gravity shifts between axes.
    const tilt = tilt0 + (((opts.tiltDeg ?? 20) * Math.PI) / 180) * sim.pos(t);
    const up = 9.81 + acc; // the reading along "up" when accelerating upward
    const n = opts.noise ?? 0.15;
    // Up vector in device axes, tilted by `tilt` around an axis set by `roll`.
    const ux = Math.sin(tilt) * Math.cos(roll);
    const uy = Math.sin(tilt) * Math.sin(roll);
    const uz = Math.cos(tilt);
    const rot = Math.abs(tilt - lastTilt) / Math.max(1e-3, (t - lastT) / 1000) + Math.abs(gauss()) * 0.02;
    lastTilt = tilt;
    lastT = t;
    out.push({
      t,
      x: up * ux + bias[0] + gauss() * n,
      y: up * uy + bias[1] + gauss() * n,
      z: up * uz + bias[2] + gauss() * n,
      up: acc + gauss() * n * 0.5 + bias[2] * 0.3,
      rot,
    });
  }
  return out;
}

/** A random but plausible set: mostly full reps, sometimes partials, grinders near the end, sometimes a miss last. */
export function randomKinds(seed: number): TruthKind[] {
  const r = rng(seed);
  const n = 3 + Math.floor(r() * 10);
  const kinds: TruthKind[] = [];
  for (let i = 0; i < n; i++) {
    const late = i >= n - 2;
    const x = r();
    kinds.push(x < 0.1 ? "partial" : late && x < 0.4 ? "grinder" : "full");
  }
  if (r() < 0.25) kinds.push("failed");
  return kinds;
}

const rad = (d: number) => (d * Math.PI) / 180;

/** A 33-point pose with only the joints form check reads, all clearly seen unless `far` hides one side. */
export function posePoints(pts: Partial<Record<keyof typeof BLAZEPOSE, [number, number]>>, far?: "L" | "R"): Keypoint[] {
  const kps: Keypoint[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0 }));
  for (const [k, p] of Object.entries(pts)) {
    if (!p) continue;
    kps[BLAZEPOSE[k as keyof typeof BLAZEPOSE]] = { x: p[0], y: p[1], visibility: far && k.startsWith(far) ? 0.2 : 0.95 };
  }
  return kps;
}

/**
 * A side-on squat at `f` (0 standing, 1 the bottom): the shin tips forward, the knee bends by `romDeg` at the
 * bottom and the torso leans in. Both legs are drawn in the same place, with the far one barely seen.
 */
export function sideSquat(f: number, romDeg: number): Keypoint[] {
  const ankle: [number, number] = [0.5, 0.9];
  const shin = rad(f * 30);
  const knee: [number, number] = [ankle[0] + 0.2 * Math.sin(shin), ankle[1] - 0.2 * Math.cos(shin)];
  // The thigh leaves the knee at the knee angle from the shin (knee to ankle), turned backwards.
  const bend = rad(175 - f * romDeg);
  const down = Math.atan2(ankle[1] - knee[1], ankle[0] - knee[0]);
  const dir = down + bend;
  const hip: [number, number] = [knee[0] + 0.2 * Math.cos(dir), knee[1] + 0.2 * Math.sin(dir)];
  const torso = rad(f * 40);
  const sh: [number, number] = [hip[0] + 0.3 * Math.sin(torso), hip[1] - 0.3 * Math.cos(torso)];
  const wr: [number, number] = [sh[0], sh[1] + 0.02];
  const el: [number, number] = [sh[0] - 0.05, sh[1] + 0.05];
  return posePoints(
    {
      Lankle: ankle,
      Rankle: ankle,
      Lknee: knee,
      Rknee: knee,
      Lhip: hip,
      Rhip: hip,
      Lshoulder: sh,
      Rshoulder: sh,
      Lelbow: el,
      Relbow: el,
      Lwrist: wr,
      Rwrist: wr,
    },
    "R",
  );
}
