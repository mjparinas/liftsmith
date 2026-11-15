// Estimated one-rep max for one set: the 1RM calculator's blend of formulas (onerm.ts explains the choice).
// One formula for every per-set number the app shows (number audit, Melvin 2026-11-15): new bests, Progress,
// exercise pages, goals, the plateau detective, share cards, Friends and the public calculators all read
// `estimate()`, so the same set never shows two different estimated maxes. "Your max today" (oneRm in
// onerm.ts) builds on it, adding reps in reserve, recency and the best three sessions.

export type FormulaId = "epley" | "brzycki" | "lombardi" | "mayhew" | "oconner" | "wathan" | "lander" | "marzagao";

export interface Formula {
  id: FormulaId;
  name: string;
  year: number;
  /** Estimated 1RM from weight (kg) and reps to failure. */
  fn: (w: number, r: number) => number;
}

/** Marzagao 2026: k(w) = −2.55 + 4.58 ln(w), in kilograms; floored at 0.5 as in the paper. */
export function marzagao(w: number, r: number): number {
  if (r <= 1 || w <= 0) return w;
  const k = Math.max(0.5, -2.55 + 4.58 * Math.log(w));
  return w * (1 + Math.pow(r - 1, 0.85) / k);
}

export const FORMULAS: readonly Formula[] = [
  { id: "epley", name: "Epley", year: 1985, fn: (w, r) => (r <= 1 ? w : w * (1 + r / 30)) },
  // Brzycki breaks down past 36 reps; the caller never goes past MAX_RTF.
  { id: "brzycki", name: "Brzycki", year: 1993, fn: (w, r) => (r <= 1 ? w : (w * 36) / (37 - Math.min(r, 30))) },
  { id: "lombardi", name: "Lombardi", year: 1989, fn: (w, r) => w * Math.pow(r, 0.1) },
  { id: "mayhew", name: "Mayhew", year: 1992, fn: (w, r) => (r <= 1 ? w : (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r))) },
  { id: "oconner", name: "O'Conner", year: 1989, fn: (w, r) => (r <= 1 ? w : w * (1 + r / 40)) },
  { id: "wathan", name: "Wathan", year: 1994, fn: (w, r) => (r <= 1 ? w : (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r))) },
  { id: "lander", name: "Lander", year: 1985, fn: (w, r) => (r <= 1 ? w : (100 * w) / (101.3 - 2.67123 * r)) },
  { id: "marzagao", name: "Marzagao", year: 2026, fn: marzagao },
];
const BY_ID = new Map(FORMULAS.map((f) => [f.id, f]));

/** The formulas the best estimate averages for a given number of reps to failure. */
export function formulasFor(rtf: number): FormulaId[] {
  return rtf <= 10 ? ["brzycki", "epley", "marzagao"] : ["mayhew", "wathan", "marzagao"];
}

/** Best estimate for one set: weight (kg) and reps to failure. */
export function estimate(weight: number, rtf: number): number {
  if (!(weight > 0) || !(rtf >= 1)) return 0;
  if (rtf <= 1) return weight;
  const ids = formulasFor(rtf);
  return ids.reduce((s, id) => s + BY_ID.get(id)!.fn(weight, rtf), 0) / ids.length;
}

/** Every formula's answer for a set, for the calculator's "how each formula sees it" list. */
export function allFormulas(weight: number, rtf: number): { id: FormulaId; name: string; year: number; e1rm: number; used: boolean }[] {
  const used = new Set(rtf <= 1 ? [] : formulasFor(rtf));
  return FORMULAS.map((f) => ({
    id: f.id,
    name: f.name,
    year: f.year,
    e1rm: weight > 0 && rtf >= 1 ? f.fn(weight, rtf) : 0,
    used: used.has(f.id),
  }));
}

/** Weight (kg) for `reps` with `rir` in reserve, from a 1RM: the best estimate turned around by bisection. */
export function weightForReps(e1rm: number, reps: number, rir = 0): number {
  const rtf = reps + rir;
  if (!(e1rm > 0)) return 0;
  if (rtf <= 1) return e1rm;
  let lo = 0;
  let hi = e1rm;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (estimate(mid, rtf) > e1rm) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Fewest reps at `weight` (kg) whose estimate beats `best` (kg) by more than 0.01 kg, up to 30. Null when the weight
 * alone already beats it (any set does, so there's nothing to aim for) or when even 30 reps wouldn't.
 */
export function repsToBeat(best: number, weight: number): number | null {
  if (!(weight > 0) || weight > best + 0.01) return null;
  for (let r = 2; r <= 30; r++) if (estimate(weight, r) > best + 0.01) return r;
  return null;
}
