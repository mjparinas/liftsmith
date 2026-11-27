// "Best exercises for <muscle>" (the muscle pages, /muscles/<muscle>/; docs/decisions/public-pages-and-seo.md "Best
// exercises for each muscle"). A ranking from the same library and the same popularity the adaptive plan picks by
// (pickWeights.ts): lifts most gyms have and most lifters know come first, then how squarely the lift aims at the muscle,
// then whether it has a full guide. Each pick carries the reasons it ranked, so the page says why, not just what.
import { EXERCISE_GUIDES } from "@/content/exerciseGuides";

import { popularity, type Popularity } from "./pickWeights";
import type { Equipment, Exercise, Muscle } from "./types";
import { SITE_EXERCISES as EXERCISES } from "./webTwins";

export interface BestPick {
  e: Exercise;
  popularity: Popularity;
  /** The muscle is the lift's first main mover (it aims squarely at it), or one of several. */
  focus: "main" | "shared";
  score: number;
}

const POP: Record<Popularity, number> = { staple: 30, common: 20, niche: 10 };

export function scoreFor(e: Exercise, m: Muscle): BestPick | null {
  if (e.cardio || e.custom || !e.primary.includes(m)) return null;
  const pop = popularity(e.id);
  const focus = e.primary[0] === m ? "main" : "shared";
  const score =
    POP[pop] + (focus === "main" ? 6 : 0) + (e.primary.length <= 2 ? 2 : 0) + (e.compound ? 2 : 0) + (e.id in EXERCISE_GUIDES ? 3 : 0);
  return { e, popularity: pop, focus, score };
}

/** Every lift that works the muscle as a main mover, best first (ties by name, so the order never shifts). */
export function bestFor(m: Muscle): BestPick[] {
  return EXERCISES.flatMap((e) => scoreFor(e, m) ?? []).sort((a, b) => b.score - a.score || a.e.name.localeCompare(b.e.name));
}

/** The setups a lifter searches by. Each is a test on what the lift needs. */
export const SETUPS = ["none", "dumbbells", "barbell", "machine"] as const;
export type Setup = (typeof SETUPS)[number];

const MACHINES: ReadonlySet<Equipment> = new Set([
  "cable",
  "latPulldown",
  "seatedRow",
  "legPress",
  "legExtension",
  "legCurl",
  "chestPress",
  "pecDeck",
  "shoulderPress",
  "smith",
  "hackSquat",
  "calfMachine",
  "hipMachine",
  "assistedPullup",
]);

const FITS: Record<Setup, (e: Exercise) => boolean> = {
  none: (e) => e.needs.length === 0,
  dumbbells: (e) => e.needs.includes("dumbbells") && e.needs.every((n) => n === "dumbbells" || n === "bench" || n === "inclineBench"),
  barbell: (e) => e.needs.includes("barbell"),
  machine: (e) => e.needs.some((n) => MACHINES.has(n)),
};

/** The best lift for the muscle with each setup, where there is one. */
export function bestBySetup(m: Muscle): { setup: Setup; pick: BestPick }[] {
  const ranked = bestFor(m);
  return SETUPS.flatMap((setup) => {
    const pick = ranked.find((p) => FITS[setup](p.e));
    return pick ? [{ setup, pick }] : [];
  });
}
