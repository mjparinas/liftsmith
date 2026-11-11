import { epley } from "../progression";
import type { Pattern } from "../types";
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
 * warm-ups were too light to say. `round` turns a wanted weight into one the gym can make.
 */
export function speedMax(
  warmups: readonly WarmupSpeed[],
  lift: { pattern: Pattern; weight: number; reps: number; rir: number },
  round: (kg: number) => number,
): SpeedMax | undefined {
  const mvt = MVT[lift.pattern];
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
