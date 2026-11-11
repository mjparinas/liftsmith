import { EXERCISE_BY_ID } from "./exercises";
import type { Exercise, SetEvent } from "./types";

// One dumbbell or a pair, one side at a time or both (competitor audit, Melvin 2026-11-09: Hevy's
// most-raised request, which it calls "genuinely tricky" to add under years of logged data).
//
// A set's `weight` is always the load of ONE implement for dumbbells and kettlebells (per hand),
// and the whole load for barbells and machines. How many implements were held, and whether the
// reps were done one side at a time, decide what the set adds to volume.

/** Dumbbell exercises done with a single dumbbell. Kettlebell exercises default to one bell. */
const ONE_DUMBBELL: ReadonlySet<string> = new Set([
  "db-single-arm-bench",
  "lean-away-lateral-raise",
  "db-two-hand-front-raise",
  "db-single-arm-press",
  "db-single-arm-extension",
  "goblet-box-squat",
  "db-lying-leg-curl",
  "db-swing",
  "db-crunch",
  "db-side-bend",
  "db-row",
  "db-overhead-extension",
  "goblet-squat",
  "db-calf-raise",
]);
/** Exercises done one side at a time, with reps logged per side. */
const PER_SIDE: ReadonlySet<string> = new Set([
  "db-single-arm-bench",
  "single-arm-cable-fly",
  "staggered-push-up",
  "lean-away-lateral-raise",
  "kb-arnold-press",
  "half-kneeling-landmine-press",
  "db-single-arm-press",
  "kb-bent-press",
  "db-single-arm-extension",
  "cable-single-pushdown",
  "band-kickback",
  "landmine-one-arm-row",
  "one-arm-cable-pulldown",
  "kneeling-one-arm-row",
  "band-one-arm-row",
  "kb-dead-stop-row",
  "behind-body-cable-curl",
  "band-concentration-curl",
  "db-wrist-rotation",
  "kb-hammer-curl",
  "db-split-squat",
  "front-foot-elevated-split-squat",
  "barbell-split-squat",
  "barbell-bulgarian-split-squat",
  "bw-bulgarian-split-squat",
  "db-reverse-lunge",
  "forward-lunge",
  "deficit-reverse-lunge",
  "db-lateral-step-up",
  "box-step-down",
  "skater-squat",
  "single-leg-extension",
  "smith-reverse-lunge",
  "kb-single-leg-rdl",
  "kickstand-rdl",
  "cable-standing-leg-curl",
  "single-leg-curl",
  "staggered-hip-thrust",
  "cable-hip-abduction",
  "side-lying-leg-raise",
  "fire-hydrant",
  "clamshell",
  "hip-airplane",
  "db-curtsy-lunge",
  "side-lying-adduction",
  "cable-hip-adduction",
  "single-leg-calf-raise",
  "side-plank-reach",
  "side-plank-hip-drop",
  "cable-side-bend",
  "db-side-bend",
  "cable-lift",
  "half-kneeling-pallof",
  "oblique-crunch",
  "db-row",
  "kb-row",
  "bulgarian-split-squat",
  "walking-lunge",
  "db-calf-raise",
]);

/** How many dumbbells or kettlebells are held at once: 1 or 2. Barbells, machines and bodyweight count as 1. */
export function implementsFor(ex: Pick<Exercise, "id" | "load">): 1 | 2 {
  if (ex.load === "dumbbell") return ONE_DUMBBELL.has(ex.id) ? 1 : 2;
  return 1;
}

/** Reps are done one side, then the other, and logged per side. */
export function perSide(exerciseId: string): boolean {
  return PER_SIDE.has(exerciseId);
}

/** Reps of a set across both sides (left plus right, or twice the per-side reps). */
export function totalReps(s: Pick<SetEvent, "exerciseId" | "reps" | "repsL" | "repsR">): number {
  if (!perSide(s.exerciseId)) return s.reps;
  if (s.repsL !== undefined && s.repsR !== undefined) return s.repsL + s.repsR;
  return s.reps * 2;
}

/** Kilograms moved in a set: load per implement × implements held × reps on every side. */
export function setVolume(s: Pick<SetEvent, "exerciseId" | "weight" | "reps" | "repsL" | "repsR" | "implements">): number {
  const ex = EXERCISE_BY_ID.get(s.exerciseId);
  const n = s.implements ?? (ex ? implementsFor(ex) : 1);
  return s.weight * n * totalReps(s);
}

/** The reps progression should judge: the weaker side when the two differ. */
export function workingReps(s: Pick<SetEvent, "reps" | "repsL" | "repsR">): number {
  if (s.repsL !== undefined && s.repsR !== undefined) return Math.min(s.repsL, s.repsR);
  return s.reps;
}
