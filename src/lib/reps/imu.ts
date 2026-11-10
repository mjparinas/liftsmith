import type { Pattern } from "../types";
import { RepTracker, type TrackerEvent, type TrackerOptions } from "./tracker";
import type { MotionProfile, SetSummary } from "./types";

// Rep counting from a motion sensor: a watch on the wrist (Wear OS, watchOS) or the phone itself
// (in a pocket, strapped on, or on the bar). The accelerometer is turned into an estimate of vertical
// wrist position (gravity removed, double integration with leaks and zero-velocity resets to stop
// drift) and handed to the same rep tracker the camera uses, in metres.

/** Which way the wrist moves first, for the motion counter. Undefined when the wrist barely moves (pull-ups, dips on bars). */
export function imuProfile(id: string, pattern: Pattern): MotionProfile | undefined {
  const p = (down: boolean, concentricFirst: boolean, minRom = 0.15): MotionProfile => ({
    signal: "elbow",
    restHigh: down,
    concentricFirst,
    minRom,
    bar: "wrists",
  });
  if (/pull-up|chin-up|dip|plank|carry|hang|push-up/.test(id) && !/pushdown/.test(id)) return undefined; // the hands don't move
  if (/pushdown|pulldown|pullover/.test(id)) return p(true, true);
  if (/curl|raise|fly|face-pull|pull-apart|shrug/.test(id)) return p(false, true, 0.12);
  switch (pattern) {
    case "squat":
    case "lunge":
    case "hinge":
      return p(true, false, 0.18);
    case "hpush":
      return p(true, false, 0.15);
    case "vpush":
      return p(false, true, 0.2);
    case "hpull":
      return p(false, true, 0.15);
    case "vpull":
      return p(true, true, 0.2);
    default:
      return undefined;
  }
}

export class ImuRepCounter {
  readonly tracker: RepTracker;
  private gMag = 9.81;
  private v = 0;
  /** Height relative to where the set started (metres), carried across still moments. */
  private h = 0;
  private stillFor = 0;
  private settled = false;
  private noise = 0.15;
  private lastT?: number;
  private mags: { t: number; m: number }[] = [];
  /** Readings since the wrist was last still: re-integrated with drift removed when it stops again. */
  private seg: { t: number; a: number }[] = [];
  /** Height right now, integrated as readings arrive (no drift removal yet), for a figure that follows along. */
  private live = 0;

  private minRom: number;

  constructor(profile: MotionProfile, opts: TrackerOptions = {}) {
    this.tracker = new RepTracker(profile, opts);
    this.minRom = profile.minRom;
  }

  /**
   * One raw accelerometer reading including gravity, in m/s², device axes (any sign convention). The
   * fallback when the platform has no sensor fusion: vertical acceleration comes from |a| - g.
   */
  push(t: number, ax: number, ay: number, az: number): TrackerEvent[] {
    const m = Math.hypot(ax, ay, az);
    const w = this.window(t, m);
    if (!w) return [];
    // |g + a| is g + a_up when the movement is mostly vertical, whatever way the wrist is turned, so
    // tilting during a curl doesn't leak gravity in.
    const still = w.maxDev < Math.max(0.45, 3 * this.noise) && Math.abs(w.mean - this.gMag) < Math.max(0.12, 0.5 * this.noise);
    return this.step(t, w.dt, m - this.gMag, still, () => (this.gMag += 0.1 * (w.mean - this.gMag)));
  }

  /**
   * One fused reading: vertical linear acceleration (m/s², up positive, gravity removed by the platform:
   * CMDeviceMotion on watchOS and iOS, the linear-acceleration and gravity sensors on Wear OS and Android,
   * DeviceMotionEvent.acceleration on the web) and the rotation rate's size (rad/s). The gyroscope makes
   * "still" far more reliable than acceleration alone.
   */
  pushFused(t: number, up: number, rot: number): TrackerEvent[] {
    const w = this.window(t, up, rot);
    if (!w) return [];
    const still = w.maxRot < 0.12 && w.maxDev < Math.max(0.35, 3 * this.noise);
    return this.step(t, w.dt, up - this.bias, still, () => (this.bias += 0.05 * (w.mean - this.bias)));
  }

  private bias = 0;
  private rots: number[] = [];

  /** Keeps 300 ms of readings and learns the resting level and noise from the first of them. */
  private window(t: number, m: number, rot = 0) {
    if (this.lastT === undefined) {
      this.lastT = t;
      this.gMag = m;
      return;
    }
    const dt = Math.min(0.1, Math.max(1e-3, (t - this.lastT) / 1000));
    this.lastT = t;
    this.mags.push({ t, m });
    this.rots.push(rot);
    while (this.mags.length && t - this.mags[0].t > 300) {
      this.mags.shift();
      this.rots.shift();
    }
    const mean = this.mags.reduce((s, x) => s + x.m, 0) / this.mags.length;
    if (!this.settled) {
      // Until the first still moment, learn the resting level from the first 300 ms. Sensor noise sets
      // the still thresholds, so a noisy phone and a clean watch both work.
      this.gMag = mean;
      this.bias = mean;
      if (this.mags.length >= 8) {
        this.settled = true;
        this.noise = Math.max(0.05, Math.sqrt(this.mags.reduce((s, x) => s + (x.m - mean) ** 2, 0) / this.mags.length));
      }
      return;
    }
    if (this.mags.length < 5) return { dt, mean, maxDev: Infinity, maxRot: Infinity };
    const ref = this.rots.some((r) => r > 0) ? this.bias : this.gMag;
    return { dt, mean, maxDev: Math.max(...this.mags.map((x) => Math.abs(x.m - ref))), maxRot: Math.max(...this.rots) };
  }

  private step(t: number, dt: number, vert: number, stillish: boolean, relearn: () => void): TrackerEvent[] {
    // Speed since the wrist was last still (short enough that drift stays small), to tell a slow, smooth
    // movement or a held position apart from standing still, allowing for drift on long segments.
    this.v += vert * dt;
    this.live += this.v * dt;
    const still = stillish && Math.abs(this.v) < 0.12 + 0.03 * ((t - (this.seg[0]?.t ?? t)) / 1000);
    if (!still) {
      this.stillFor = 0;
      this.seg.push({ t, a: vert });
      // Never still for 12 s (fidgeting, walking): close the segment anyway and assume it ended at rest.
      if (this.seg.length && t - this.seg[0].t > 12000) return this.flush(true);
      return [];
    }
    // Still: re-learn the resting level (removes sensor scale error and bias) and close the moving segment.
    relearn();
    this.v = 0;
    // Still for 3 s means the lifter is at rest whatever the height says (nobody holds mid-rep that long).
    this.stillFor = this.stillFor || t;
    if (t - this.stillFor > 3000) this.h = 0;
    const out = this.seg.length ? this.flush(true) : [];
    this.live = this.h;
    out.push(...this.tracker.push({ t, pos: this.h, bar: this.h, conf: 1 }));
    return out;
  }

  /**
   * Integrates the moving segment twice. Speed is zero at both ends (the wrist was still: at lockout, at
   * a sticking point, or on the safeties), so any speed left at the end is drift and is removed linearly.
   * Height carries on from where the last segment stopped, so a stall mid-rep stays mid-rep.
   */
  private flush(endsStill: boolean): TrackerEvent[] {
    const seg = this.seg;
    this.seg = [];
    if (seg.length < 2) return [];
    const t0 = seg[0].t;
    const T = seg[seg.length - 1].t - t0 || 1;
    const v: number[] = [0];
    for (let i = 1; i < seg.length; i++) v.push(v[i - 1] + ((seg[i].a + seg[i - 1].a) / 2) * ((seg[i].t - seg[i - 1].t) / 1000));
    const vEnd = v[v.length - 1];
    const p: number[] = [0];
    for (let i = 0; i < seg.length; i++) {
      v[i] -= endsStill ? (vEnd * (seg[i].t - t0)) / T : 0;
      if (i > 0) p.push(p[i - 1] + ((v[i] + v[i - 1]) / 2) * ((seg[i].t - seg[i - 1].t) / 1000));
    }
    // Stopping close to the starting height means back at rest (lockout): snap to it and spread the
    // leftover over the segment, so height drift never builds up from rep to rep. Stopping far from it
    // (a sticking point, the bottom of a miss) keeps the measured height.
    const h0 = this.h;
    const hEnd = h0 + p[p.length - 1];
    const roms = this.tracker.summary().reps.map((r) => r.rom).sort((a, b) => a - b);
    const typical = roms.length ? roms[roms.length >> 1] : this.minRom * 2.5;
    // A height well past any rep in the set is drift, not movement: reset it too.
    const snap = (endsStill && Math.abs(hEnd) < Math.max(0.6 * this.minRom, 0.35 * typical)) || Math.abs(hEnd) > 1.6 * typical;
    const out: TrackerEvent[] = [];
    for (let i = 0; i < seg.length; i++) {
      const pos = h0 + p[i] - (snap ? (hEnd * (seg[i].t - t0)) / T : 0);
      out.push(...this.tracker.push({ t: seg[i].t, pos, bar: pos, conf: 1 }));
    }
    this.h = snap ? 0 : hEnd;
    this.live = this.h;
    return out;
  }

  /** How far through the rep the lifter is right now (0 at rest, 1 at the set's deepest point). */
  get progress(): number {
    return this.tracker.progressAt(this.live);
  }

  summary(): SetSummary {
    return this.tracker.summary();
  }

  finish(): SetSummary {
    if (this.seg.length) this.flush(true);
    return this.tracker.finish();
  }
}

