import type { AppEvent } from "./types";

// Food from a food app (MyFitnessPal, Cronometer and friends write it to Health Connect and Apple Health; Melvin,
// 2026-11-11). Liftsmith never logs food itself: it reads each finished day's calories, protein, carbs and fat
// (health.ts readNutrition, `health` events `kcalIn`, `protein`, `carbs` and `fat`) and the coach's notes
// (insights.ts) turn them into one thing to do. A day's calories only count when it looks fully logged (LOGGED_KCAL),
// because a half-logged day would read as a huge deficit; a day logged for protein alone still counts for protein
// (2026-11-15). With two weeks of food and weigh-ins, the lifter's real maintenance comes from what they ate and how
// their weight moved (measuredTdee). Derived from events every time, never stored.

const DAY = 86_400_000;
/** A day with fewer calories than this is taken as partly logged, and its calories are left out. */
export const LOGGED_KCAL = 1000;
/**
 * A day under LOGGED_KCAL still counts for protein when protein is at least this share of its calories: someone
 * logging only their protein foods and shakes. A half-logged ordinary day (about a fifth protein) doesn't pass.
 */
export const PROTEIN_ONLY_SHARE = 0.4;
/** ...and has at least this many grams. */
export const PROTEIN_ONLY_MIN = 20;
/** Short means under this share of the target, so a near miss isn't nagged about. */
export const PROTEIN_SHORT = 0.85;
/** Logged days in a row, all short, before the protein note shows. */
export const PROTEIN_RUN = 3;
/** Logged days in the last week before a calorie note shows. */
export const KCAL_DAYS = 4;
/** Calories in a kilogram of body weight change, the usual round number (fat and some water and muscle). */
export const KCAL_PER_KG = 7700;
/** What measured maintenance needs: this many days with calories logged... */
export const MEASURE_DAYS = 14;
/** ...over this window... */
export const MEASURE_WINDOW = 28;
/** ...and weigh-ins at least this many days apart, at least MEASURE_WEIGH_INS of them. */
export const MEASURE_SPAN = 14;
export const MEASURE_WEIGH_INS = 4;
/** Under this share of maintenance on the two newest logged days reads as under-fuelled for readiness. */
export const UNDER_FUELLED = 0.7;

export interface FoodDay {
  /** Local day, YYYY-MM-DD. */
  day: string;
  /** Calories, only when the day looks fully logged. */
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type FoodMetric = "kcalIn" | "protein" | "carbs" | "fat";
const FOOD: readonly FoodMetric[] = ["kcalIn", "protein", "carbs", "fat"];

/** Whether a day under LOGGED_KCAL was logged for protein on purpose. Exported for tests. */
export function proteinOnly(kcal: number | undefined, protein: number | undefined): boolean {
  if (protein === undefined || protein < PROTEIN_ONLY_MIN) return false;
  return kcal === undefined || protein * 4 >= kcal * PROTEIN_ONLY_SHARE;
}

/**
 * Finished days of the last `days` that count, oldest first: fully logged days (calories, protein, carbs and fat),
 * and days logged for protein alone (protein only). A re-read day keeps its newest number.
 */
export function foodDays(events: readonly AppEvent[], now: number, days = 21): FoodDay[] {
  const today = dayKey(now);
  const from = dayKey(now - days * DAY);
  const by = new Map<string, Partial<Record<FoodMetric, { at: number; v: number }>>>();
  for (const e of events) {
    if (e.type !== "health" || !FOOD.includes(e.metric as FoodMetric)) continue;
    if (e.day >= today || e.day < from) continue;
    const d = by.get(e.day) ?? {};
    const m = e.metric as FoodMetric;
    const cur = d[m];
    if (!cur || e.at >= cur.at) d[m] = { at: e.at, v: e.value };
    by.set(e.day, d);
  }
  const out: FoodDay[] = [];
  for (const [day, d] of by) {
    const kcal = d.kcalIn?.v;
    const protein = d.protein?.v;
    if (kcal !== undefined && kcal >= LOGGED_KCAL) {
      const x: FoodDay = { day, kcal };
      if (protein !== undefined) x.protein = protein;
      if (d.carbs) x.carbs = d.carbs.v;
      if (d.fat) x.fat = d.fat.v;
      out.push(x);
    } else if (proteinOnly(kcal, protein)) out.push({ day, protein });
  }
  return out.sort((a, b) => (a.day < b.day ? -1 : 1));
}

export interface ProteinShort {
  /** Logged days in a row under the target. */
  days: number;
  /** Their average, grams. */
  avg: number;
  /** Grams a day. */
  target: number;
  /** The newest of them, for a note id that changes with the finding. */
  last: string;
}

/**
 * Protein well short of the target (the lifter's own from foodTargets.ts, or a coach's) on the last few logged days
 * in a row (PROTEIN_RUN or more, the newest within the last three days, so an old run doesn't linger after the lifter
 * stops logging).
 */
export function proteinShort(days: readonly FoodDay[], target: number, now: number): ProteinShort | null {
  if (!(target > 0)) return null;
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
  /** Average protein, carbs and fat on the days that have them, grams. */
  protein?: number;
  carbs?: number;
  fat?: number;
  /** The newest of them. */
  last: string;
}

const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : undefined);

/** The days with calories logged in the last seven finished days. */
export function loggedWeek(days: readonly FoodDay[], now: number): FoodDay[] {
  const from = dayKey(now - 7 * DAY);
  return days.filter((d) => d.day >= from && d.kcal !== undefined);
}

/** The average of the logged days in the last seven finished days, once there are KCAL_DAYS of them. */
export function weekIntake(days: readonly FoodDay[], now: number): Intake | null {
  const week = loggedWeek(days, now);
  if (week.length < KCAL_DAYS) return null;
  const out: Intake = { days: week.length, avg: mean(week.map((d) => d.kcal!))!, last: week.at(-1)!.day };
  for (const k of ["protein", "carbs", "fat"] as const) {
    const v = mean(week.flatMap((d) => (d[k] === undefined ? [] : [d[k]!])));
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/** Average protein over the last seven finished days that have it (protein-only days included). */
export function weekProtein(days: readonly FoodDay[], now: number): { days: number; avg: number } | null {
  const from = dayKey(now - 7 * DAY);
  const ps = days.filter((d) => d.day >= from && d.protein !== undefined).map((d) => d.protein!);
  return ps.length >= KCAL_DAYS ? { days: ps.length, avg: mean(ps)! } : null;
}

export interface Measured {
  /** Calories a day that hold this lifter's weight, from what they ate and how their weight moved. */
  kcal: number;
  /** Days with calories logged in the window. */
  days: number;
  /** Weight change a week over the window, kg (negative is losing). */
  kgPerWeek: number;
}

/**
 * Real maintenance (2026-11-15): average calories eaten over the last four weeks, plus what the weight trend says
 * about the gap (each kg gained or lost is about KCAL_PER_KG). The trend is a least-squares line through the
 * weigh-ins, so one heavy morning doesn't swing it. Needs MEASURE_DAYS logged days and MEASURE_WEIGH_INS weigh-ins
 * spread over MEASURE_SPAN days; an answer outside 1,200 to 6,000 kcal is taken as a logging gap and dropped.
 */
export function measuredTdee(events: readonly AppEvent[], now: number): Measured | null {
  const days = foodDays(events, now, MEASURE_WINDOW).filter((d) => d.kcal !== undefined);
  if (days.length < MEASURE_DAYS) return null;
  const from = now - MEASURE_WINDOW * DAY;
  const w = events.flatMap((e) => (e.type === "bodyweight" && e.at >= from && e.at <= now ? [{ x: e.at / DAY, y: e.kg }] : []));
  if (w.length < MEASURE_WEIGH_INS) return null;
  const xs = w.map((p) => p.x);
  if (Math.max(...xs) - Math.min(...xs) < MEASURE_SPAN) return null;
  const mx = xs.reduce((s, x) => s + x, 0) / w.length;
  const my = w.reduce((s, p) => s + p.y, 0) / w.length;
  const slope = w.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / w.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const avg = days.reduce((s, d) => s + d.kcal!, 0) / days.length;
  const kcal = Math.round((avg - slope * KCAL_PER_KG) / 10) * 10;
  if (kcal < 1200 || kcal > 6000) return null;
  return { kcal, days: days.length, kgPerWeek: Math.round(slope * 7 * 100) / 100 };
}

/**
 * Under-fuelled (2026-11-15): the two newest days with calories logged, the newer one yesterday or the day before,
 * were both under UNDER_FUELLED of maintenance. Readiness takes it as a reason to go a little easier.
 */
export function underFuelled(days: readonly FoodDay[], maintenance: number | undefined, now: number): boolean {
  if (!(maintenance && maintenance > 0)) return false;
  const logged = days.filter((d) => d.kcal !== undefined);
  const [a, b] = [logged.at(-2), logged.at(-1)];
  if (!a || !b || b.day < dayKey(now - 2 * DAY)) return false;
  return a.kcal! < maintenance * UNDER_FUELLED && b.kcal! < maintenance * UNDER_FUELLED;
}
