import { epley } from "../progression";
import type { AppEvent, Pattern } from "../types";
import type { SetSummary } from "./types";

// Today's max from warm-up bar speed (Labs, `labSpeedMax`, builds on camera bar speed; Melvin, 2026-11-11).
// Every lift has a speed at which a rep is about as heavy as the lifter can go (the minimum velocity
// threshold). Warm-ups give a few weights and their fastest rep's speed; the straight line through them
// (the load-velocity profile) reaches that speed at today's estimated max. When that's well above or below
// what today's plan expects (Epley from the working weight, reps and reps in reserve), the first hard set
// gets a small nudge, at most 5% up or 10% down, to a weight the gym can make. Pure: no state, no clock.

/** Mean concentric speed (m/s) of a rep that's about a one-rep max, by movement (González-Badillo, Sánchez-Medina, Helms). */
export const MVT: Partial<Record<Pattern, number>> = {
  squat: 0.3,
  lunge: 0.3,
  hinge: 0.15,
  hpush: 0.17,
  vpush: 0.19,
  hpull: 0.5,
  vpull: 0.23,
};
/** Differences smaller than this are noise: the plan stands. */
export const DEADBAND = 0.05;
/** The largest nudge either way. Down goes further, because a slow day is the one to be careful on. */
export const MAX_UP = 0.05;
export const MAX_DOWN = 0.1;
/** The heaviest warm-up must be at least this share of the planned max, so the line isn't stretched too far. */
export const MIN_SHARE = 0.5;
/** With three or more warm-ups, the line has to fit them this well (r²). */
export const MIN_FIT = 0.6;

// Each lifter's own threshold (Melvin, 2026-11-11, Labs idea 6: "calibrate from near-max sets"). The
// textbook speeds are averages, people differ around them, and the camera measures a body point rather
// than the bar, so its speeds can sit a little off for one lifter. The last full rep of a set taken to
// about failure moves at close to that lifter's one-rep-max speed (Izquierdo 2006, Helms), so working sets
// that ended there teach the lab where this lifter's threshold really is, measured the same way as the
// warm-ups it's compared with.

/** Hard sets needed before the lifter's own threshold is used. */
export const MIN_HARD_SETS = 3;
/** The most recent hard sets used. */
export const MAX_HARD_SETS = 8;
/** Hard sets older than this are left out: technique and the camera set-up change. */
export const HARD_SET_DAYS = 180;
/** The textbook value counts as this many hard sets, so a few odd ones can't swing the threshold far. */
export const PRIOR_WEIGHT = 2;
/** The lifter's threshold stays within this share of the textbook one either way (a bad camera angle). */
export const MVT_RANGE = { low: 0.5, high: 1.8 } as const;

export interface PersonalMvt {
  /** The threshold to use (m/s). */
  mvt: number;
  /** The textbook value for the movement. */
  book: number;
  /** Hard sets it was learned from; 0 means the textbook value. */
  sets: number;
  /** Hard sets still needed before it's the lifter's own, 0 once it is. */
  needed: number;
}

/**
 * Why a set counts as taken to about failure: the camera saw a rep that didn't make it, the lifter said
 * they had no reps left, a program's as-many-as-you-can set, or fewer reps than planned (they ran out).
 * Lighter injury sets never count.
 */
function nearMax(e: Extract<AppEvent, { type: "set" }>, noneLeft: ReadonlySet<string>): boolean {
  if (e.injuryPct !== undefined) return false;
  return !!e.failedRep || noneLeft.has(e.id) || !!e.amrap || e.reps < e.targetReps;
}

/**
 * The lifter's own threshold for a movement, from the end speeds of their hard working sets of it, or the
 * textbook value until there are MIN_HARD_SETS of them. The median of the latest MAX_HARD_SETS, pulled
 * towards the textbook by PRIOR_WEIGHT, and kept within MVT_RANGE of it. Derived from events, never stored.
 */
export function personalMvt(
  events: readonly AppEvent[],
  pattern: Pattern,
  patternOf: (exerciseId: string) => Pattern | undefined,
  now: number,
): PersonalMvt | undefined {
  const book = MVT[pattern];
  if (book === undefined) return undefined;
  const noneLeft = new Set<string>();
  for (const e of events) if (e.type === "effort" && e.rir === 0) noneLeft.add(e.setId);
  const since = now - HARD_SET_DAYS * 86_400_000;
  const speeds = events
    .filter(
      (e): e is Extract<AppEvent, { type: "set" }> =>
        e.type === "set" &&
        e.endSpeed !== undefined &&
        e.endSpeed > 0.05 &&
        e.endSpeed < 3 &&
        e.at >= since &&
        e.at <= now &&
        patternOf(e.exerciseId) === pattern,
    )
    .filter((e) => nearMax(e, noneLeft))
    .sort((a, b) => b.at - a.at)
    .slice(0, MAX_HARD_SETS)
    .map((e) => e.endSpeed!);
  if (speeds.length < MIN_HARD_SETS) return { mvt: book, book, sets: 0, needed: MIN_HARD_SETS - speeds.length };
  const sorted = [...speeds].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  const median = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  const blended = (median * speeds.length + book * PRIOR_WEIGHT) / (speeds.length + PRIOR_WEIGHT);
  const mvt = Math.min(book * MVT_RANGE.high, Math.max(book * MVT_RANGE.low, blended));
  return { mvt: Math.round(mvt * 100) / 100, book, sets: speeds.length, needed: 0 };
}

export interface WarmupSpeed {
  /** The warm-up's weight in kg. */
  kg: number;
  /** Its fastest full rep's mean concentric speed, m/s. */
  speed: number;
}

export type SpeedCall = "up" | "down" | "hold";

export interface SpeedMax {
  /** Today's estimated one-rep max (kg). */
  max: number;
  /** The max the plan expects from its working weight, reps and reps in reserve (kg). */
  planned: number;
  /** Today's max against the planned one, minus one: 0.08 is 8% above. */
  diff: number;
  call: SpeedCall;
  /** The working weight to use (kg): the planned one when the call is hold. */
  weight: number;
}

/** A set's fastest full rep in m/s, or nothing when the camera had no scale (no height) or no full rep. */
export function fastestMetres(s: SetSummary): number | undefined {
  const xs = s.reps.filter((r) => r.kind === "full" && r.speedIsMetres && r.speed > 0).map((r) => r.speed);
  return xs.length ? Math.max(...xs) : undefined;
}

/**
 * A working set's last full rep in m/s, and whether an attempt after it failed (the set went to failure).
 * Nothing without a scale or a full rep.
 */
export function lastFullMetres(s: SetSummary): { speed: number; failedAfter: boolean } | undefined {
  const full = s.reps.filter((r) => r.kind === "full");
  const last = full[full.length - 1];
  if (!last || !last.speedIsMetres || !(last.speed > 0)) return undefined;
  return { speed: last.speed, failedAfter: s.reps.some((r) => r.kind === "failed" && r.index > last.index) };
}

/** Least squares line speed = a + b·kg, and how well it fits (r²). */
function fit(points: readonly WarmupSpeed[]): { a: number; b: number; r2: number } {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p.kg, 0) / n;
  const my = points.reduce((s, p) => s + p.speed, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const p of points) {
    sxy += (p.kg - mx) * (p.speed - my);
    sxx += (p.kg - mx) ** 2;
    syy += (p.speed - my) ** 2;
  }
  const b = sxx > 0 ? sxy / sxx : 0;
  return { a: my - b * mx, b, r2: sxx > 0 && syy > 0 ? (sxy * sxy) / (sxx * syy) : 1 };
}

/**
 * Today's max from the warm-ups, and the working weight to use. Undefined when the lift has no known
 * threshold, there are fewer than two warm-up weights, the line doesn't slope down, it fits badly, or the
 * warm-ups were too light to say. `lift.mvt` is the lifter's own threshold (personalMvt), else the
 * textbook one. `round` turns a wanted weight into one the gym can make.
 */
export function speedMax(
  warmups: readonly WarmupSpeed[],
  lift: { pattern: Pattern; weight: number; reps: number; rir: number; mvt?: number },
  round: (kg: number) => number,
): SpeedMax | undefined {
  const mvt = lift.mvt ?? MVT[lift.pattern];
  if (mvt === undefined || !(lift.weight > 0) || lift.reps < 1) return undefined;
  // One point per weight (the fastest, if a weight was warmed up twice), within believable speeds.
  const byKg = new Map<number, number>();
  for (const w of warmups) {
    if (!(w.kg > 0) || !(w.speed > 0.05 && w.speed < 3)) continue;
    byKg.set(w.kg, Math.max(byKg.get(w.kg) ?? 0, w.speed));
  }
  const points = [...byKg].map(([kg, speed]) => ({ kg, speed }));
  if (points.length < 2) return undefined;
  const { a, b, r2 } = fit(points);
  if (!(b < 0) || (points.length >= 3 && r2 < MIN_FIT)) return undefined;
  const planned = epley(lift.weight, lift.reps, lift.rir);
  const heaviest = Math.max(...points.map((p) => p.kg));
  if (heaviest < planned * MIN_SHARE) return undefined;
  const max = (mvt - a) / b;
  if (!(max > heaviest)) return undefined;
  const diff = max / planned - 1;
  const hold: SpeedMax = { max, planned, diff, call: "hold", weight: lift.weight };
  if (Math.abs(diff) < DEADBAND) return hold;
  const change = Math.max(-MAX_DOWN, Math.min(MAX_UP, diff));
  const weight = round(lift.weight * (1 + change));
  // The gym's steps may be too coarse for a small nudge (a 20 kg dumbbell to 22.5): then the plan stands.
  const moved = weight / lift.weight - 1;
  if (diff > 0 ? !(moved > 1e-6 && moved <= MAX_UP * 1.5) : !(moved < -1e-6 && moved >= -MAX_DOWN * 1.5)) return hold;
  return { max, planned, diff, call: diff > 0 ? "up" : "down", weight };
}
