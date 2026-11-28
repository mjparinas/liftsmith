import { familyOf, type Family } from "@/components/app/theme";

import { EXERCISE_BY_ID } from "./exercises";
import type { AppEvent } from "./types";

// Lift mastery (Melvin, 2026-11-27: "add more things that the user can unlock through exercises"; he picked mastery,
// figure colours, share card frames and profile titles). Every exercise earns up to four mastery stars from the sets
// logged of it, and stars and the sets for each muscle family unlock locker items (game.ts MASTERY_ITEMS).
// Derived from the event log every time, never stored, like XP and badges (docs/decisions/lift-mastery.md).

/** Sets of one exercise for each star: 25, 100, 300 and 1,000. */
export const MASTERY_SETS = [25, 100, 300, 1000] as const;
export const MAX_STARS = MASTERY_SETS.length;

/** Every logged set counts once (`only` counts one exercise) (bonus drop and rest-pause sets too); a rehab part's sets don't, they're not training a lift. */
export function setCounts(events: readonly AppEvent[], only?: string): Map<string, number> {
  const seen = new Set<string>();
  const out = new Map<string, number>();
  for (const e of events) {
    if (e.type !== "set" || (only !== undefined && e.exerciseId !== only) || seen.has(e.id) || e.partId === "rehab") continue;
    seen.add(e.id);
    out.set(e.exerciseId, (out.get(e.exerciseId) ?? 0) + 1);
  }
  return out;
}

/** Stars (0 to 4) for this many sets. */
export function starsFor(sets: number): number {
  let n = 0;
  for (const at of MASTERY_SETS) if (sets >= at) n++;
  return n;
}

export interface Mastery {
  exerciseId: string;
  sets: number;
  stars: number;
  /** Sets the next star needs in all (null at four stars). */
  next: number | null;
  /** The set count the current star started at (0 before the first). */
  from: number;
}

export function masteryOf(counts: ReadonlyMap<string, number>, exerciseId: string): Mastery {
  const sets = counts.get(exerciseId) ?? 0;
  const stars = starsFor(sets);
  return { exerciseId, sets, stars, next: MASTERY_SETS[stars] ?? null, from: stars ? MASTERY_SETS[stars - 1]! : 0 };
}

/** Lifts with at least one star, most stars first, then most sets. */
export function mastered(counts: ReadonlyMap<string, number>): Mastery[] {
  return [...counts.keys()]
    .map((id) => masteryOf(counts, id))
    .filter((m) => m.stars > 0)
    .sort((a, b) => b.stars - a.stars || b.sets - a.sets || a.exerciseId.localeCompare(b.exerciseId));
}

/** How many lifts have at least this many stars. */
export const liftsWith = (counts: ReadonlyMap<string, number>, stars: number) =>
  [...counts.values()].filter((n) => starsFor(n) >= stars).length;

/** Sets per muscle family, each set counted once for the family of its exercise's first main muscle (cardio counts for none). */
export function familySets(counts: ReadonlyMap<string, number>): Record<Family, number> {
  const out: Record<Family, number> = { push: 0, pull: 0, legs: 0, core: 0 };
  for (const [id, n] of counts) {
    const ex = EXERCISE_BY_ID.get(id);
    const m = ex?.primary[0];
    if (!ex || !m || ex.cardio) continue;
    out[familyOf(m)] += n;
  }
  return out;
}

/** Lifts whose stars went up between two counts (this workout's, on Done), most stars first. */
export function starsGained(before: ReadonlyMap<string, number>, after: ReadonlyMap<string, number>): Mastery[] {
  return mastered(after).filter((m) => m.stars > starsFor(before.get(m.exerciseId) ?? 0));
}
