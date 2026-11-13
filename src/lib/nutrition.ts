import type { AppEvent } from "./types";

// Food from a food app (MyFitnessPal, Cronometer and friends write it to Health Connect and Apple Health; Melvin,
// 2026-11-11). Liftsmith never logs food itself: it reads each finished day's calories and protein (health.ts
// readNutrition, `health` events `kcalIn` and `protein`) and the coach's notes (insights.ts) turn them into one
// thing to do. A day only counts when it looks fully logged (LOGGED_KCAL), because a half-logged day would read
// as a huge deficit. Derived from events every time, never stored.

const DAY = 86_400_000;
/** A day with fewer calories than this is taken as partly logged and left out. */
export const LOGGED_KCAL = 1000;
/** Grams of protein a day per kg of body weight: the low end of the 1.6 to 2.2 g range TDEE shows. */
export const PROTEIN_PER_KG = 1.6;
/** Short means under this share of the low end, so a near miss isn't nagged about. */
export const PROTEIN_SHORT = 0.85;
/** Logged days in a row, all short, before the protein note shows. */
export const PROTEIN_RUN = 3;
/** Logged days in the last week before a calorie note shows. */
export const KCAL_DAYS = 4;

export interface FoodDay {
  /** Local day, YYYY-MM-DD. */
  day: string;
  kcal: number;
  protein?: number;
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Fully logged finished days of the last `days`, oldest first. A re-read day keeps its newest number. */
export function foodDays(events: readonly AppEvent[], now: number, days = 21): FoodDay[] {
  const today = dayKey(now);
  const from = dayKey(now - days * DAY);
  const kcal = new Map<string, { at: number; v: number }>();
  const protein = new Map<string, { at: number; v: number }>();
  for (const e of events) {
    if (e.type !== "health" || (e.metric !== "kcalIn" && e.metric !== "protein")) continue;
    if (e.day >= today || e.day < from) continue;
    const by = e.metric === "kcalIn" ? kcal : protein;
    const cur = by.get(e.day);
    if (!cur || e.at >= cur.at) by.set(e.day, { at: e.at, v: e.value });
  }
  return [...kcal.entries()]
    .filter(([, k]) => k.v >= LOGGED_KCAL)
    .map(([day, k]) => ({ day, kcal: k.v, protein: protein.get(day)?.v }))
    .sort((a, b) => (a.day < b.day ? -1 : 1));
}

export interface ProteinShort {
  /** Logged days in a row under the target. */
  days: number;
  /** Their average, grams. */
  avg: number;
  /** Grams a day: the low end for this body weight. */
  target: number;
  /** The newest of them, for a note id that changes with the finding. */
  last: string;
}

/**
 * Protein well short (of the body-weight rule, or a coach's target) on the last few logged days in a row (PROTEIN_RUN or more, the newest within the last three
 * days, so an old run doesn't linger after the lifter stops logging).
 */
export function proteinShort(days: readonly FoodDay[], kg: number, now: number, coachTarget?: number | null): ProteinShort | null {
  // A coach's own target wins over the body-weight rule (trainer mode, 2026-11-13).
  if (!coachTarget && !(kg > 0)) return null;
  const target = coachTarget || Math.round(kg * PROTEIN_PER_KG);
  const withProtein = days.filter((d) => d.protein !== undefined);
  const newest = withProtein.at(-1);
  if (!newest || newest.day < dayKey(now - 3 * DAY)) return null;
  let run = 0;
  let sum = 0;
  for (let i = withProtein.length - 1; i >= 0; i--) {
    const p = withProtein[i]!.protein!;
    if (p >= target * PROTEIN_SHORT) break;
    run += 1;
    sum += p;
  }
  return run >= PROTEIN_RUN ? { days: run, avg: Math.round(sum / run), target, last: newest.day } : null;
}

export interface Intake {
  /** Logged days in the last week. */
  days: number;
  /** Their average, calories. */
  avg: number;
  /** The newest of them. */
  last: string;
}

/** The average of the logged days in the last seven finished days, once there are KCAL_DAYS of them. */
export function weekIntake(days: readonly FoodDay[], now: number): Intake | null {
  const from = dayKey(now - 7 * DAY);
  const week = days.filter((d) => d.day >= from);
  if (week.length < KCAL_DAYS) return null;
  return { days: week.length, avg: Math.round(week.reduce((s, d) => s + d.kcal, 0) / week.length), last: week.at(-1)!.day };
}
