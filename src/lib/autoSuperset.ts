import { EXERCISE_BY_ID } from "./exercises";
import type { PlanItem } from "./generator";
import { TIMED } from "./progression";
import { SWITCH_REST } from "./superset";
import type { Exercise, Goal, Muscle } from "./types";

// Automatic supersets (Melvin, 2026-11-17: "for adaptive workout … create superset automatically. This should
// be a toggle"). With Settings › Training › Adaptive workouts › Supersets on, the adaptive plan pairs exercises
// that don't work the same muscles, so one rests while the other works: opposite muscles first (a press with a
// row), then upper with lower body, then core with anything. Each pair's rest is shorter, because each muscle
// already rested through the other exercise's set. Pairs are two exercises; the lifter can still split or link
// any pair on Today. Details in docs/decisions/adaptive-options.md.

/** Where a muscle sits for pairing: opposite sides pair best. */
type Side = "push" | "pull" | "legs" | "core";
const SIDE: Record<Muscle, Side> = {
  chest: "push",
  frontDelts: "push",
  sideDelts: "push",
  triceps: "push",
  rearDelts: "pull",
  biceps: "pull",
  forearms: "pull",
  traps: "pull",
  upperBack: "pull",
  lats: "pull",
  lowerBack: "core",
  abs: "core",
  obliques: "core",
  glutes: "legs",
  quads: "legs",
  hamstrings: "legs",
  adductors: "legs",
  calves: "legs",
};

/** The rest a paired exercise never goes below (or its own rest, when that's already shorter). */
export const PAIR_REST_FLOOR = 60;

export interface PairOptions {
  /** Keep heavy barbell squats and hinges (and every barbell compound on a strength goal) on their own. Missing means on. */
  bigAlone?: boolean;
  goal: Goal;
  /** Exercises whose rest the lifter set themselves: their rest is kept as it is. */
  ownRest?: (id: string) => boolean;
}

/** A heavy lift that's better done fresh and on its own: barbell squats and hinges, or any barbell compound for strength. */
export function isBigLift(ex: Exercise, goal: Goal): boolean {
  return ex.load === "barbell" && ex.compound && (goal === "strength" || ex.pattern === "squat" || ex.pattern === "hinge");
}

/**
 * True when the two exercises work any of the same muscles: one's main muscle is either a main or a helping muscle
 * of the other, or both lean on the lower back.
 */
export function clashes(a: Exercise, b: Exercise): boolean {
  const aAll = new Set<Muscle>([...a.primary, ...a.secondary]);
  if (b.primary.some((m) => aAll.has(m)) || a.primary.some((m) => b.secondary.includes(m))) return true;
  // The lower back holds the spine in both: a hinge and a bent-over row back to back tire it twice over.
  return aAll.has("lowerBack") && b.secondary.includes("lowerBack");
}

const sideOf = (ex: Exercise): Side => SIDE[ex.primary[0] ?? "abs"];

/**
 * How well two exercises that don't clash pair up: opposite muscles (push with pull) 3, upper with lower body 2,
 * anything with core 1. Two barbell lifts lose a point, because they need two bars or a change of plates.
 */
export function pairScore(a: Exercise, b: Exercise): number {
  const sa = sideOf(a);
  const sb = sideOf(b);
  const base =
    (sa === "push" && sb === "pull") || (sa === "pull" && sb === "push")
      ? 3
      : (sa === "legs") !== (sb === "legs") && sa !== "core" && sb !== "core"
        ? 2
        : 1;
  return base - (a.load === "barbell" && b.load === "barbell" ? 1 : 0);
}

/** Can this planned exercise go in an automatic superset? */
export function pairable(item: PlanItem, opts: PairOptions): boolean {
  const ex = EXERCISE_BY_ID.get(item.exerciseId);
  if (!ex || ex.cardio || item.part || item.group || item.challenge || item.injuryPct) return false;
  if (TIMED.has(ex.id) && ex.pattern === "carry") return false; // a carry needs the floor, not a station
  return !(opts.bigAlone !== false && isBigLift(ex, opts.goal));
}

/**
 * The shorter rest after a round: the usual rest less the time the muscle already rested during the other
 * exercise's set and the switch, in 15 s steps, never below a minute (or the exercise's own shorter rest).
 */
export function pairedRest(rest: number, partnerSetSec: number): number {
  const cut = Math.round((rest - partnerSetSec - SWITCH_REST) / 15) * 15;
  return Math.max(Math.min(rest, PAIR_REST_FLOOR), cut);
}

const setSec = (ex: Exercise, reps: number) => (TIMED.has(ex.id) ? reps + 15 : 25 + reps * 3.5);

/**
 * Pairs the plan's exercises into supersets, keeping the plan's order: each exercise that can be paired takes
 * the best partner after it (highest `pairScore`, nearest on a tie), which moves up to sit right after it.
 * Paired exercises get a shared `group` (`ss-<first id>`, as superset.ts makes them), a shorter rest and
 * `soloRest`, the rest they go back to if the lifter splits the pair.
 */
export function autoPair(items: readonly PlanItem[], opts: PairOptions): PlanItem[] {
  const list = items.map((x) => ({ ...x }));
  const out: PlanItem[] = [];
  while (list.length) {
    const a = list.shift()!;
    out.push(a);
    const exA = EXERCISE_BY_ID.get(a.exerciseId);
    if (!exA || !pairable(a, opts)) continue;
    let best = -1;
    let bestScore = 0;
    list.forEach((b, k) => {
      const exB = EXERCISE_BY_ID.get(b.exerciseId);
      if (!exB || !pairable(b, opts) || clashes(exA, exB)) return;
      const s = pairScore(exA, exB);
      if (s > bestScore) {
        best = k;
        bestScore = s;
      }
    });
    if (best < 0) continue;
    const b = list.splice(best, 1)[0]!;
    const exB = EXERCISE_BY_ID.get(b.exerciseId)!;
    const group = `ss-${a.exerciseId}`;
    const shorten = (x: PlanItem, partner: Exercise, partnerReps: number): PlanItem => {
      if (opts.ownRest?.(x.exerciseId)) return { ...x, group };
      const rest = pairedRest(x.restSec, setSec(partner, partnerReps));
      return rest < x.restSec ? { ...x, group, restSec: rest, soloRest: x.restSec } : { ...x, group };
    };
    out[out.length - 1] = shorten(a, exB, b.target.reps);
    out.push(shorten(b, exA, a.target.reps));
  }
  return out;
}
