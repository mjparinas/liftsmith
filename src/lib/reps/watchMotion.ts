import type { Pattern } from "../types";
import { imuProfile, ImuRepCounter } from "./imu";
import type { MotionProfile } from "./types";

// Watch rep counting (Labs, `labWatchReps`; docs/decisions/watch-apps.md). While a set is on, the phone asks the
// watch app for its motion (`motion` in the workout state); the watch streams its fused vertical acceleration and
// rotation rate in small batches, and the phone counts them here with the same motion counter phone motion uses
// (imu.ts). One counter on the phone means Wear OS and Apple Watch count exactly alike and the rule is tested once.

/** The most readings one batch may carry: 4 s at 50 Hz (the watch sends about every 250 ms). */
export const MAX_BATCH = 200;

/** One reading: when (ms, the watch's clock), vertical linear acceleration (m/s², up positive) and rotation rate (rad/s). */
export interface WatchSample {
  t: number;
  up: number;
  rot: number;
}

/**
 * A batch as the watch sends it: `t` is the first reading's time and `s` holds three numbers per reading (ms after
 * `t`, up, rot). Anything that doesn't look like a real reading drops the whole batch, so junk never reaches the count.
 */
export function parseWatchMotion(raw: unknown): WatchSample[] {
  if (!raw || typeof raw !== "object") return [];
  const { t, s } = raw as { t?: unknown; s?: unknown };
  if (typeof t !== "number" || !Number.isFinite(t) || !Array.isArray(s) || s.length % 3 !== 0 || s.length > MAX_BATCH * 3) return [];
  const out: WatchSample[] = [];
  for (let i = 0; i < s.length; i += 3) {
    const [dt, up, rot] = [s[i] as unknown, s[i + 1] as unknown, s[i + 2] as unknown];
    if (typeof dt !== "number" || typeof up !== "number" || typeof rot !== "number") return [];
    if (!(dt >= 0 && dt <= 10_000 && Math.abs(up) <= 100 && rot >= 0 && rot <= 50)) return [];
    out.push({ t: t + dt, up, rot });
  }
  return out;
}

/** Whether the wrist moves enough in this lift to count it (not pull-ups, dips, planks or carries). */
export function watchCountable(id: string, pattern: Pattern): boolean {
  return !!imuProfile(id, pattern);
}

/** Counts one set from the watch's batches. Make a new one for each set. */
export class WatchRepCount {
  private counter: ImuRepCounter;
  private base = 0;
  private lastT = -Infinity;

  constructor(private readonly profile: MotionProfile) {
    this.counter = new ImuRepCounter(profile);
  }

  /** Adds a batch and returns the reps counted so far. A reading sent twice, or older than the last, is skipped. */
  push(samples: readonly WatchSample[]): number {
    for (const x of samples) {
      // A clock that jumped back a long way (the watch app restarted) starts a fresh stream instead of stalling.
      if (x.t <= this.lastT && this.lastT - x.t < 5000) continue;
      this.lastT = x.t;
      this.counter.pushFused(x.t, x.up, x.rot);
      // A long pause ends the counter's set by itself: keep its reps and carry on, like phone motion does.
      if (this.counter.tracker.over) {
        this.base += this.counter.summary().full;
        this.counter = new ImuRepCounter(this.profile);
      }
    }
    return this.reps;
  }

  get reps(): number {
    return this.base + this.counter.summary().full;
  }
}
