import { mondayOf, type Stats } from "./derive";
import { EXERCISE_BY_ID } from "./exercises";
import type { AppEvent, Profile, SetEvent } from "./types";
import { fromKg } from "./units";

// XP, levels, the training-week streak and trophies. All derived from events, like Gradelings.

export const XP = { set: 10, pr: 50, session: 40, fullSession: 30 } as const;

export const LEVELS = [
  { at: 0, title: "Rookie" },
  { at: 500, title: "Regular" },
  { at: 1500, title: "Grinder" },
  { at: 3500, title: "Iron" },
  { at: 7000, title: "Steel" },
  { at: 12000, title: "Titan" },
  { at: 20000, title: "Legend" },
];

export function xpTotal(stats: Stats): number {
  return stats.totalSets * XP.set + stats.prs.length * XP.pr + stats.sessions.length * XP.session + stats.sessions.filter((s) => s.sets >= 12).length * XP.fullSession;
}

export function levelOf(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].at) i++;
  const next = LEVELS[i + 1];
  return {
    level: i + 1,
    title: LEVELS[i].title,
    into: xp - LEVELS[i].at,
    span: next ? next.at - LEVELS[i].at : 1,
    next: next?.title ?? null,
  };
}

/** Weeks in a row meeting the days-per-week goal. The current week counts once met. */
export function goalStreak(stats: Stats, profile: Pick<Profile, "daysPerWeek">, now: number): { weeks: number; thisWeek: number; needed: number } {
  const days = new Map<number, Set<string>>();
  for (const s of stats.sessions) {
    const w = mondayOf(s.start);
    const d = new Date(s.start).toDateString();
    days.set(w, (days.get(w) ?? new Set()).add(d));
  }
  const goal = Math.max(1, profile.daysPerWeek);
  const thisMonday = mondayOf(now);
  const thisWeek = days.get(thisMonday)?.size ?? 0;
  let weeks = thisWeek >= goal ? 1 : 0;
  let w = mondayOf(thisMonday - 86400_000);
  while ((days.get(w)?.size ?? 0) >= goal) {
    weeks++;
    w = mondayOf(w - 86400_000);
  }
  return { weeks, thisWeek, needed: Math.max(0, goal - thisWeek) };
}

export interface Trophy {
  id: string;
  name: string;
  detail: string;
  tier: "bronze" | "silver" | "gold";
  earned: boolean;
}

function bestKg(sets: SetEvent[], ids: string[]): number {
  return sets.filter((s) => ids.includes(s.exerciseId) && s.reps >= 1).reduce((m, s) => Math.max(m, s.weight), 0);
}

export function trophies(events: readonly AppEvent[], stats: Stats, profile: Profile): Trophy[] {
  const sets = events.filter((e): e is SetEvent => e.type === "set");
  const lb = (kg: number) => fromKg(kg, "lb");
  const bench = lb(bestKg(sets, ["bench-press"]));
  const squat = lb(bestKg(sets, ["back-squat", "front-squat", "box-squat"]));
  const dead = lb(bestKg(sets, ["deadlift", "trap-bar-deadlift"]));
  const ohp = lb(bestKg(sets, ["overhead-press"]));
  const bwBench = bestKg(sets, ["bench-press"]) >= profile.bodyweight;
  const exercisesTried = new Set(sets.map((s) => s.exerciseId)).size;
  const pullups = sets.filter((s) => s.exerciseId === "pull-up").reduce((m, s) => Math.max(m, s.reps), 0);
  const t = (id: string, name: string, detail: string, tier: Trophy["tier"], earned: boolean): Trophy => ({ id, name, detail, tier, earned });
  return [
    t("first", "First rep", "Finish your first workout", "bronze", stats.sessions.length >= 1),
    t("ten", "Habit", "Finish 10 workouts", "bronze", stats.sessions.length >= 10),
    t("fifty", "Lifer", "Finish 50 workouts", "silver", stats.sessions.length >= 50),
    t("first-pr", "Personal best", "Set your first PR", "bronze", stats.prs.length >= 1),
    t("plate-ohp", "One-plate press", "Overhead press 135 lb (61 kg)", "silver", ohp >= 134.9),
    t("plate-bench", "One-plate bench", "Bench 135 lb (61 kg)", "bronze", bench >= 134.9),
    t("two-plate-bench", "Two-plate bench", "Bench 225 lb (102 kg)", "silver", bench >= 224.9),
    t("bw-bench", "Bodyweight bench", "Bench your own body weight", "silver", bwBench),
    t("three-plate-squat", "Three-plate squat", "Squat 315 lb (143 kg)", "gold", squat >= 314.9),
    t("four-plate-dead", "Four-plate deadlift", "Deadlift 405 lb (184 kg)", "gold", dead >= 404.9),
    t("ten-pullups", "Ten clean pull-ups", "10 pull-ups in one set", "silver", pullups >= 10),
    t("explorer", "Explorer", "Try 25 different exercises", "silver", exercisesTried >= 25),
    t("streak-4", "Month strong", "Meet your weekly goal 4 weeks running", "silver", stats.weekStreak >= 4),
    t("volume-100k", "100 tonnes", "Lift 100,000 kg in total", "gold", stats.totalVolume >= 100_000),
  ].map((x) => ({ ...x, detail: x.detail }));
}

export function exerciseName(id: string): string {
  return EXERCISE_BY_ID.get(id)?.name ?? id;
}
