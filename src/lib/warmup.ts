import { barFor, roundLoad } from "./loads";
import { TIMED } from "./progression";
import type { Exercise, Gym, Muscle } from "./types";
import { toKg } from "./units";

// Warm-up sets (Melvin, 2026-11-09: "exercise length should include warm up sets and resting").
// The first loaded lift for a muscle gets a short ramp up to the working weight; a later compound
// for muscles that are already warm gets one feeler set on the barbell, and nothing otherwise.
// Every weight is one the gym can make, and each step is heavier than the last and lighter than
// the working weight. Warm-ups are logged as their own `warmup` events, so stats, recovery,
// progression and streaks never count them.

export interface WarmupSet {
  /** Kilograms, the same basis as the working weight (per hand for dumbbells). */
  weight: number;
  reps: number;
}

/** Rest after each warm-up set, in seconds. Short: warm-ups aren't hard. */
export const WARMUP_REST = 60;

type Step = [share: number, reps: number];

function ramp(ex: Exercise, kg: number, warm: boolean): Step[] {
  if (!ex.compound) return warm ? [] : [[0.5, 10]];
  if (warm) return ex.load === "barbell" ? [[0.7, 3]] : [];
  if (ex.load === "barbell")
    return kg >= 100
      ? [
          [0.5, 5],
          [0.7, 3],
          [0.85, 1],
        ]
      : kg >= 50
        ? [
            [0.55, 5],
            [0.8, 2],
          ]
        : [[0.6, 5]];
  return [
    [0.5, 8],
    [0.75, 4],
  ];
}

/**
 * Warm-up sets for one exercise at `kg` working weight. `warmMuscles` holds the muscles that
 * earlier exercises in the same workout already worked.
 */
export function warmupFor(ex: Exercise, kg: number, gym: Gym, warmMuscles: ReadonlySet<Muscle>): WarmupSet[] {
  if (ex.load === "bodyweight" || TIMED.has(ex.id) || kg <= 0) return [];
  const warm = ex.primary.every((m) => warmMuscles.has(m));
  const out: WarmupSet[] = [];
  if (ex.load === "barbell" && !warm) {
    const bar = toKg(barFor(ex, gym).weight, gym.unit);
    // The empty bar first, unless the working weight is barely more than the bar.
    if (bar < kg * 0.6) out.push({ weight: bar, reps: 10 });
  }
  for (const [share, reps] of ramp(ex, kg, warm)) {
    const w = roundLoad(kg * share, ex, gym).kg;
    const prev = out.at(-1)?.weight ?? 0;
    if (w > prev + 1e-6 && w < kg - 1e-6) out.push({ weight: w, reps });
  }
  return out;
}

/** Adds warm-ups to a workout in order: each exercise warms its primary muscles for the ones after it. */
export function withWarmups<T extends { exerciseId: string; target: { weight: number }; warmup?: WarmupSet[] }>(
  items: T[],
  gym: Gym,
  byId: (id: string) => Exercise,
): T[] {
  const warmed = new Set<Muscle>();
  return items.map((item) => {
    const ex = byId(item.exerciseId);
    const warmup = warmupFor(ex, item.target.weight, gym, warmed);
    for (const m of ex.primary) warmed.add(m);
    return { ...item, warmup: warmup.length ? warmup : undefined };
  });
}
