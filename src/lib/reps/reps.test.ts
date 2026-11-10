import { describe, expect, it } from "vitest";
import { EXERCISES } from "../exercises";
import { describe as describeScore, evaluate } from "./evaluate";
import { ImuRepCounter, imuProfile } from "./imu";
import { angle, BLAZEPOSE, COCO17, PoseSignal, type Keypoint } from "./pose";
import { profileFor } from "./profiles";
import { imuSamples, simulateSet } from "./simulate";
import { OneEuro, RepTracker, rirFromVelocityLoss, summarise } from "./tracker";
import type { MotionProfile, Rep } from "./types";

const SQUAT = profileFor("back-squat", "squat")!;

function feed(tr: RepTracker, pts: [t: number, deg: number][]) {
  const evs = [];
  for (const [t, pos] of pts) evs.push(...tr.push({ t, pos, conf: 1 }));
  return evs;
}

/** A clean squat signal: rest at 170°, down to 170 - depth and back, one rep every 3 s. */
function squats(depths: number[], restMs = 800) {
  const pts: [number, number][] = [];
  let t = 0;
  for (let i = 0; i < 30; i++) pts.push([(t += 33), 170]);
  for (const d of depths) {
    for (let i = 0; i <= 60; i++) pts.push([(t += 33), 170 - d * Math.sin((Math.PI * i) / 60)]);
    for (let i = 0; i < restMs / 33; i++) pts.push([(t += 33), 170]);
  }
  for (let i = 0; i < 400; i++) pts.push([(t += 33), 170]);
  return pts;
}

describe("rep tracker", () => {
  it("counts clean reps and ends the set after it goes idle", () => {
    const tr = new RepTracker(SQUAT);
    const evs = feed(tr, squats([90, 90, 90, 90, 90]));
    expect(evs.filter((e) => e.type === "rep")).toHaveLength(5);
    expect(evs.some((e) => e.type === "setOver")).toBe(true);
    const s = tr.summary();
    expect(s.full).toBe(5);
    expect(s.durationMs).toBeGreaterThan(5 * 1900);
    expect(s.durationMs).toBeLessThan(5 * 2900);
  });

  it("ignores setup fidgets well short of a rep", () => {
    const tr = new RepTracker(SQUAT);
    feed(tr, squats([12, 15, 90, 10]));
    expect(tr.summary().reps).toHaveLength(1);
  });

  it("grades a shallow rep as partial against the set's deepest", () => {
    const tr = new RepTracker(SQUAT);
    feed(tr, squats([90, 45, 90]));
    const s = tr.finish();
    expect(s.reps.map((r) => r.kind)).toEqual(["full", "partial", "full"]);
    expect(s.reps[1].depth).toBeCloseTo(0.5, 1);
  });

  it("calls a rep that never comes back a miss, and re-arms only after the lifter is back at rest", () => {
    const tr = new RepTracker(SQUAT, { failMs: 3000 });
    const pts = squats([90]);
    let t = pts[pts.length - 1][0];
    for (let i = 0; i <= 30; i++) pts.push([(t += 33), 170 - 90 * Math.sin((Math.PI / 2) * (i / 30))]);
    for (let i = 0; i < 150; i++) pts.push([(t += 33), 80]); // stuck in the hole for 5 s
    for (let i = 0; i < 30; i++) pts.push([(t += 33), 80 + 3 * i]); // climbs out without the bar
    for (let i = 0; i < 60; i++) pts.push([(t += 33), 170]);
    const evs = feed(tr, pts);
    expect(evs.filter((e) => e.type === "failed")).toHaveLength(1);
    const s = tr.finish();
    expect(s.full).toBe(1);
    expect(s.failed).toBe(1);
  });

  it("treats lost tracking while away from rest as a miss", () => {
    const tr = new RepTracker(SQUAT);
    let t = 0;
    for (let i = 0; i < 30; i++) tr.push({ t: (t += 33), pos: 170, conf: 1 });
    for (let i = 0; i < 20; i++) tr.push({ t: (t += 33), pos: 170 - 4 * i, conf: 1 });
    for (let i = 0; i < 60; i++) tr.push({ t: (t += 33), pos: NaN, conf: 0 });
    expect(tr.summary().failed).toBe(1);
  });

  it("flags slow reps as grinders and estimates reps in reserve from slowdown", () => {
    const mk = (speed: number, i: number): Rep => ({ index: i, kind: "full", start: i, turn: i, end: i + 1, rom: 90, depth: 1, concentricMs: 1, eccentricMs: 1, speed, speedIsMetres: true, velocityLoss: 0, grinder: false, sticking: false });
    const s = summarise([mk(0.6, 0), mk(0.55, 1), mk(0.45, 2), mk(0.28, 3)]);
    expect(s.reps.map((r) => r.grinder)).toEqual([false, false, false, true]);
    expect(s.velocityLoss).toBeCloseTo(0.53, 2);
    expect(s.estRir).toBe(0);
    expect(rirFromVelocityLoss(0.05)).toBe(4);
    expect(rirFromVelocityLoss(0.25)).toBe(2);
  });

  it("smooths jitter with the One Euro filter", () => {
    const f = new OneEuro();
    let worst = 0;
    for (let i = 0; i < 300; i++) {
      const y = f.filter(100 + (i % 2 ? 3 : -3), i * 33);
      if (i > 10) worst = Math.max(worst, Math.abs(y - 100));
    }
    expect(worst).toBeLessThan(1.5);
  });
});

describe("pose signal", () => {
  it("measures joint angles in pixel space", () => {
    expect(angle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })).toBeCloseTo(90);
    // On a 16:9 frame a 45° line in normalised units is not 45° on screen.
    expect(angle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, 16 / 9)).toBeCloseTo(90);
    expect(angle({ x: 0.5, y: 0 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 1 })).toBeCloseTo(180);
  });

  it("uses the better-seen side and reports lost tracking", () => {
    const kps: Keypoint[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.1 }));
    // Right leg visible and bent 90°: hip above knee, ankle in front of it.
    kps[BLAZEPOSE.Rhip] = { x: 0.5, y: 0.3, visibility: 0.95 };
    kps[BLAZEPOSE.Rknee] = { x: 0.5, y: 0.6, visibility: 0.95 };
    kps[BLAZEPOSE.Rankle] = { x: 0.8, y: 0.6, visibility: 0.95 };
    const sig = new PoseSignal(SQUAT);
    const s = sig.sample(0, kps, 1);
    expect(s.pos).toBeCloseTo(90);
    expect(s.conf).toBeGreaterThan(0.9);
    expect(sig.sample(33, undefined, 1).conf).toBe(0);
  });

  it("maps both BlazePose and COCO layouts", () => {
    expect(BLAZEPOSE.Lknee).toBe(25);
    expect(COCO17.Lknee).toBe(13);
  });

  it("gives bar height in metres once it knows the lifter's height", () => {
    const sig = new PoseSignal(SQUAT, BLAZEPOSE, 1.8);
    // Arms out of view, so the scale comes from the legs.
    const kps: Keypoint[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0 }));
    // Straight legs 0.491 of standing height long: hip 0.2 → knee 0.45 → ankle 0.7 of frame height.
    for (const s of ["L", "R"] as const) {
      kps[BLAZEPOSE[`${s}hip`]] = { x: 0.5, y: 0.2, visibility: 1 };
      kps[BLAZEPOSE[`${s}knee`]] = { x: 0.5, y: 0.45, visibility: 1 };
      kps[BLAZEPOSE[`${s}ankle`]] = { x: 0.5, y: 0.7, visibility: 1 };
      kps[BLAZEPOSE[`${s}shoulder`]] = { x: 0.5, y: 0.0, visibility: 1 };
    }
    const a = sig.sample(0, kps, 1).bar!;
    for (const s of ["L", "R"] as const) kps[BLAZEPOSE[`${s}shoulder`]] = { x: 0.5, y: 0.1, visibility: 1 };
    const b = sig.sample(33, kps, 1).bar!;
    // Shoulders dropped 0.1 frame heights; 0.5 frame heights of leg is 0.491 × 1.8 m.
    expect(a - b).toBeCloseTo((0.1 / (0.5 / 0.491)) * 1.8, 2);
  });
});

describe("profiles", () => {
  it("has a camera profile for every exercise with reps, and none for holds and carries", () => {
    for (const e of EXERCISES) {
      const p = profileFor(e.id, e.pattern);
      if (e.pattern === "carry" || /plank/.test(e.id)) expect(p, e.id).toBeUndefined();
    }
    expect(profileFor("barbell-curl", "isolation")?.concentricFirst).toBe(true);
    expect(profileFor("overhead-press", "vpush")?.restHigh).toBe(false);
    expect(profileFor("dip", "vpush")?.restHigh).toBe(true);
    expect(EXERCISES.filter((e) => profileFor(e.id, e.pattern)).length).toBeGreaterThan(60);
  });

  it("skips motion counting where the hands don't move", () => {
    expect(imuProfile("pull-up", "vpull")).toBeUndefined();
    expect(imuProfile("back-squat", "squat")?.restHigh).toBe(true);
    expect(imuProfile("barbell-curl", "isolation")?.restHigh).toBe(false);
  });
});

describe("motion counter", () => {
  it("counts squats from fused vertical acceleration and rotation rate", () => {
    const sim = simulateSet(["full", "full", "full", "full", "full"], 11);
    const c = new ImuRepCounter(imuProfile("back-squat", "squat")!);
    for (const x of imuSamples(sim, 12, { romM: 0.5, downFirst: true })) c.pushFused(x.t, x.up, x.rot);
    const s = c.finish();
    expect(s.full).toBe(5);
    // Bar speed in m/s, in the range a squat moves (0.3 to 1 m/s).
    expect(s.bestSpeed).toBeGreaterThan(0.3);
    expect(s.bestSpeed).toBeLessThan(1);
  });
});

// Accuracy on simulated sets. Pass marks sit a little under what the trackers score today, so a change
// that makes counting worse fails here. Run the full report with REP_ACCURACY=1 npx vitest run src/lib/reps.
describe("accuracy on simulated sets", () => {
  const cam = (p: MotionProfile, opts = {}) => evaluate("camera", 60, p, opts);
  it("camera, side view", () => {
    for (const [id, pat] of [["back-squat", "squat"], ["bench-press", "hpush"], ["barbell-curl", "isolation"]] as const) {
      const s = cam(profileFor(id, pat)!);
      expect(s.exactReps / s.sets, id).toBeGreaterThanOrEqual(0.95);
      expect(s.failed.hit / Math.max(1, s.failed.truth), id).toBeGreaterThanOrEqual(0.8);
      expect(s.durationMaeMs, id).toBeLessThan(2000);
    }
  });
  it("camera, poor conditions (15 fps, jitter, dropouts)", () => {
    const s = cam(SQUAT, { jitterDeg: 5, outliers: 0.04, dropouts: 0.08, fps: 15 });
    expect(s.exactReps / s.sets).toBeGreaterThanOrEqual(0.8);
  });
  it("motion, fused sensors at 50 Hz", () => {
    const s = evaluate("fused", 60, imuProfile("back-squat", "squat")!, { romM: 0.5 });
    expect(s.exactReps / s.sets).toBeGreaterThanOrEqual(0.9);
    expect(s.speedCorr).toBeGreaterThan(0.9);
  });
});

describe.runIf(process.env.REP_ACCURACY)("accuracy report", () => {
  it("prints", { timeout: 300000 }, () => {
    const w = (x: string) => process.stdout.write(`\n${x}`);
    for (const [id, pat] of [["back-squat", "squat"], ["bench-press", "hpush"], ["deadlift", "hinge"], ["overhead-press", "vpush"], ["barbell-row", "hpull"], ["barbell-curl", "isolation"]] as const) {
      const p = profileFor(id, pat)!;
      w(describeScore(`camera ${id} side`, evaluate("camera", 300, p)));
      w(describeScore(`camera ${id} angled`, evaluate("camera", 300, p, { romDeg: 55 })));
      w(describeScore(`camera ${id} poor`, evaluate("camera", 300, p, { jitterDeg: 5, outliers: 0.04, dropouts: 0.08, fps: 15 })));
    }
    for (const [id, pat, rom] of [["back-squat", "squat", 0.5], ["bench-press", "hpush", 0.35], ["barbell-curl", "isolation", 0.4], ["overhead-press", "vpush", 0.45]] as const) {
      const p = imuProfile(id, pat)!;
      w(describeScore(`fused ${id} 50Hz`, evaluate("fused", 300, p, { romM: rom })));
      w(describeScore(`fused ${id} 25Hz noisy`, evaluate("fused", 300, p, { romM: rom, imuNoise: 0.3, hz: 25 })));
      w(describeScore(`raw accel ${id} 50Hz`, evaluate("imu", 300, p, { romM: rom })));
    }
  });
});

describe("live progress for a figure that follows the lifter", () => {
  it("tracks the camera rep from rest to the bottom and back", () => {
    const tr = new RepTracker(SQUAT);
    let peak = 0;
    let after = 1;
    for (const [t, pos] of squats([90, 90])) {
      tr.push({ t, pos, conf: 1 });
      if (t < 6000) peak = Math.max(peak, tr.progress);
      after = tr.progress;
    }
    expect(peak).toBeGreaterThan(0.85);
    expect(peak).toBeLessThanOrEqual(1);
    expect(after).toBeLessThan(0.05);
  });

  it("moves with the bar during a motion rep, before the rep is counted", () => {
    const p = imuProfile("bench-press", "hpush")!;
    const c = new ImuRepCounter(p);
    const sim = simulateSet(["full", "full", "full"], 3);
    let mid = 0;
    let last = 0;
    for (const x of imuSamples(sim, 12, { romM: 0.4, downFirst: true })) {
      c.pushFused(x.t, x.up, x.rot);
      const truth = sim.pos(x.t);
      if (truth > 0.8) mid = Math.max(mid, c.progress);
      last = c.progress;
    }
    expect(mid).toBeGreaterThan(0.5);
    expect(last).toBeLessThan(0.2);
  });
});
