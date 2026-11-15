import { goalCalories, macros, PROTEIN_PER_KG, type MacroGoal } from "./calculators";
import type { SessionSummary } from "./derive";
import type { Measured } from "./nutrition";
import { currentKg, currentTdee, type CurrentTdee } from "./tdee";
import { isTeen } from "./teen";
import type { AppEvent, Profile } from "./types";

// One set of daily food targets for everything that judges what a lifter eats (Melvin picked it, 2026-11-15): the
// coach's notes, the Food card on Body, Tools › Macros and Tools › TDEE all read these, so they can't disagree.
// The goal is the one picked in Macros (Lose fat, Maintain, Build muscle), or the training goal until one is picked;
// maintenance is the measured one (nutrition.ts measuredTdee) once there's enough food and weigh-ins, else the
// formula's. A coach's numbers win, each on its own. Under-18s never get a fat-loss goal or a calorie target:
// only protein (docs/decisions/food-from-health.md "Teens").

/** A coach's daily targets as the client's device keeps them (trainer.ts). Training-day calories, rest-day optional. */
export interface CoachFood {
  kcal: number | null;
  protein: number | null;
  carbs?: number | null;
  fat?: number | null;
  /** Calories on days without a workout; empty means the same as training days. */
  kcalRest?: number | null;
  coach: string;
}

/** The food goal: the one picked in Macros, else the training goal's (build muscle eats a little over). */
export function foodGoal(profile: Pick<Profile, "tdee" | "goal" | "birthYear">, now = Date.now()): MacroGoal {
  const g: MacroGoal = profile.tdee?.goal ?? (profile.goal === "muscle" ? "bulk" : "maintain");
  return g === "cut" && isTeen(profile, now) ? "maintain" : g;
}

/** Grams of protein a day for a body weight and goal (calculators.ts PROTEIN_PER_KG). */
export const proteinFor = (kg: number, goal: MacroGoal) => (kg > 0 ? Math.round(kg * PROTEIN_PER_KG[goal]) : 0);

export interface FoodTargets {
  goal: MacroGoal;
  teen: boolean;
  /** Calories a day (training days when the coach set a rest-day number). Never for under-18s. */
  kcal?: number;
  /** Calories on rest days, from a coach. */
  kcalRest?: number;
  protein: number;
  carbs?: number;
  fat?: number;
  /** Maintenance, measured or from the formula. */
  maintenance?: number;
  measured?: Measured;
  /** Which numbers came from a coach. */
  coach?: { name: string; kcal: boolean; protein: boolean; carbs: boolean; fat: boolean };
  tdee: CurrentTdee;
}

export function foodTargets(
  events: readonly AppEvent[],
  sessions: Pick<SessionSummary, "start">[],
  profile: Profile,
  now: number,
  coach?: CoachFood | null,
): FoodTargets {
  const teen = isTeen(profile, now);
  const goal = foodGoal(profile, now);
  const tdee = currentTdee(events as AppEvent[], sessions, profile, now);
  const kg = currentKg(events, profile);
  const r = tdee.result;
  const own = r ? macros(goalCalories(r.tdee, r.bmr, goal), kg, goal) : null;
  const c = coach ?? null;
  const out: FoodTargets = { goal, teen, protein: c?.protein || own?.protein || proteinFor(kg, goal), tdee };
  if (r) out.maintenance = r.tdee;
  if (tdee.measured) out.measured = tdee.measured;
  if (!teen) {
    const kcal = c?.kcal || own?.kcal;
    if (kcal) out.kcal = kcal;
    if (c?.kcal && c.kcalRest) out.kcalRest = c.kcalRest;
    const carbs = c?.carbs || own?.carbs;
    const fat = c?.fat || own?.fat;
    if (carbs) out.carbs = carbs;
    if (fat) out.fat = fat;
  }
  if (c && (c.kcal || c.protein || c.carbs || c.fat))
    out.coach = { name: c.coach, kcal: !teen && !!c.kcal, protein: !!c.protein, carbs: !teen && !!c.carbs, fat: !teen && !!c.fat };
  return out;
}

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * The calorie target for a set of logged days, averaged: the training-day number on days with a workout and the
 * rest-day number on the others (or one number for every day).
 */
export function targetFor(days: readonly { day: string }[], trained: ReadonlySet<string>, kcal: number, kcalRest?: number): number {
  if (!kcalRest || !days.length) return kcal;
  return Math.round(days.reduce((s, d) => s + (trained.has(d.day) ? kcal : kcalRest), 0) / days.length);
}

/** Local days with a workout, for training-day and rest-day targets. */
export const trainedDays = (sessions: readonly Pick<SessionSummary, "start">[]) => new Set(sessions.map((s) => dayKey(s.start)));
