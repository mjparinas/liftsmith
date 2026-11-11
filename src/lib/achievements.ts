import type { MessageKey } from "@/locales/en";

import { weekOf, type Stats } from "./derive";
import { EXERCISE_BY_ID } from "./exercises";
import { num, t, translated } from "./i18n";
import { gradedSet, TIMED } from "./progression";
import { MUSCLES, type AppEvent, type Muscle, type Profile, type SessionStartEvent, type SetEvent } from "./types";
import { fromKg } from "./units";

// Achievements: tiered badges with progress toward the next tier, plus secret ones whose name and goal
// stay hidden until earned. Everything is derived from the event log (never stored), so every device
// agrees and merging events can't double count. Requested by Melvin, 2026-11-09.

export type Tier = "bronze" | "silver" | "gold" | "platinum";
export const TIERS: Tier[] = ["bronze", "silver", "gold", "platinum"];
export const TIER_LABEL: Record<Tier, string> = translated(["bronze", "silver", "gold", "platinum"], (k) => `tier.${k}`);
export const TIER_XP: Record<Tier, number> = { bronze: 25, silver: 75, gold: 150, platinum: 300 };

export type Category = "consistency" | "strength" | "volume" | "records" | "explore" | "smart" | "secret";
export const CATEGORY_LABEL: Record<Category, string> = translated(
  ["consistency", "strength", "volume", "records", "explore", "smart", "secret"],
  (k) => `category.${k}`,
);

/** Everything an achievement can measure, computed once from the events. */
export interface Ctx {
  sets: SetEvent[];
  starts: SessionStartEvent[];
  stats: Stats;
  profile: Profile;
  events: readonly AppEvent[];
  /** Per session: start time, its sets, and its start event if any. */
  sessions: { id: string; at: number; sets: SetEvent[]; start?: SessionStartEvent }[];
  /** Longest run of weeks meeting the weekly goal, freezes included. */
  bestStreak: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  /** What to do, with {n} for the tier's threshold. */
  detail: string;
  icon: string;
  category: Category;
  /** Thresholds for bronze, silver, gold, platinum (1 to 4 of them). */
  tiers: number[];
  /** Hidden until earned. */
  secret?: boolean;
  /** Units for the progress text. */
  unit?: string;
  value(c: Ctx): number;
}

const lb = (kg: number) => fromKg(kg, "lb");
const bw = (c: Ctx) => Math.max(1, c.profile.bodyweight);
const DAY = 86400_000;

function best(c: Ctx, ids: string[], minReps = 1): number {
  let m = 0;
  for (const s of c.sets) if (s.reps >= minReps && ids.includes(s.exerciseId) && s.weight > m) m = s.weight;
  return m;
}
function maxReps(c: Ctx, ids: string[]): number {
  let m = 0;
  for (const s of c.sets) if (ids.includes(s.exerciseId) && s.weight === 0 && s.reps > m) m = s.reps;
  return m;
}
const countSessions = (c: Ctx, f: (s: Ctx["sessions"][number]) => boolean) => c.sessions.filter(f).length;
const hourOf = (ms: number) => new Date(ms).getHours();
const repsOf = (s: SetEvent) => (TIMED.has(s.exerciseId) ? 0 : s.reps);

const BENCH = ["bench-press"];
const SQUAT = ["back-squat", "front-squat", "box-squat"];
const DEAD = ["deadlift", "trap-bar-deadlift"];
const OHP = ["overhead-press"];
const PULL = ["pull-up", "chin-up"];
const PUSH = ["push-up", "diamond-push-up", "decline-push-up", "ring-push-up"];

/**
 * Plates a side: a 45 lb bar with 45 lb plates, or a 20 kg bar with 20 kg plates, whichever is kinder,
 * so lifters on kilo plates aren't short-changed (1 plate = 135 lb or 60 kg).
 */
const plates = (kg: number) => Math.max(Math.floor((lb(kg) + 0.1 - 45) / 90), Math.floor((kg + 0.05 - 20) / 40));

export const ACHIEVEMENTS: AchievementDef[] = [
  // ---- Consistency
  {
    id: "workouts",
    name: "Showing up",
    detail: "Finish {n} workout(s)",
    icon: "🏋️",
    category: "consistency",
    tiers: [1, 25, 100, 365],
    value: (c) => c.stats.sessions.length,
  },
  {
    id: "goal-streak",
    name: "Unbroken",
    detail: "Meet your weekly goal {n} weeks running",
    icon: "🔥",
    category: "consistency",
    tiers: [2, 8, 26, 52],
    unit: "weeks",
    value: (c) => c.bestStreak,
  },
  {
    id: "training-weeks",
    name: "Seasons",
    detail: "Train in {n} different weeks",
    icon: "📅",
    category: "consistency",
    tiers: [4, 26, 52, 156],
    unit: "weeks",
    value: (c) => new Set(c.sessions.map((s) => weekOf(s.at))).size,
  },
  {
    id: "hours",
    name: "Time under the bar",
    detail: "Spend {n} hours lifting",
    icon: "⏱️",
    category: "consistency",
    tiers: [10, 50, 200, 500],
    unit: "h",
    value: (c) => Math.floor(c.stats.totalSeconds / 3600),
  },
  {
    id: "early",
    name: "Early bird",
    detail: "Finish {n} workouts that start before 8 am",
    icon: "🌅",
    category: "consistency",
    tiers: [1, 10, 50],
    value: (c) => countSessions(c, (s) => hourOf(s.at) < 8 && hourOf(s.at) >= 4),
  },
  {
    id: "weekend",
    name: "Weekend warrior",
    detail: "Train on {n} weekends",
    icon: "🗓️",
    category: "consistency",
    tiers: [4, 20, 52],
    value: (c) => new Set(c.sessions.filter((s) => [0, 6].includes(new Date(s.at).getDay())).map((s) => weekOf(s.at))).size,
  },
  {
    id: "lunch",
    name: "Lunch break lifter",
    detail: "Finish {n} workouts started between 11 am and 2 pm",
    icon: "🥪",
    category: "consistency",
    tiers: [5, 25],
    value: (c) => countSessions(c, (s) => hourOf(s.at) >= 11 && hourOf(s.at) < 14),
  },
  {
    // Pro members (Melvin, 2026-11-11: "that should unlock some kind of badge or achievement or reward"). Counts the
    // months logged as Pro (ProEvent, store.notePro), so it's kept after a subscription ends. Its bronze badge
    // unlocks the Pro theme (themes.ts) and its silver badge the Pro accent in the Locker (game.ts BADGE_ITEMS).
    id: "pro",
    name: "Pro member",
    detail: "Have Liftsmith Pro for {n} month(s)",
    icon: "💎",
    category: "consistency",
    tiers: [1, 3, 6, 12],
    unit: "months",
    value: (c) => proMonths(c.events),
  },

  // ---- Strength: plate clubs (45 lb plates a side) and body-weight ratios
  {
    id: "bench-plates",
    name: "Bench plate club",
    detail: "Bench {n} plate(s) a side",
    icon: "🛡️",
    category: "strength",
    tiers: [1, 2, 3, 4],
    unit: "plates",
    value: (c) => Math.max(0, plates(best(c, BENCH))),
  },
  {
    id: "squat-plates",
    name: "Squat plate club",
    detail: "Squat {n} plate(s) a side",
    icon: "🦵",
    category: "strength",
    tiers: [1, 2, 3, 4],
    unit: "plates",
    value: (c) => Math.max(0, plates(best(c, SQUAT))),
  },
  {
    id: "dead-plates",
    name: "Deadlift plate club",
    detail: "Deadlift {n} plate(s) a side",
    icon: "⛓️",
    category: "strength",
    tiers: [2, 3, 4, 5],
    unit: "plates",
    value: (c) => Math.max(0, plates(best(c, DEAD))),
  },
  {
    id: "ohp-plates",
    name: "Press plate club",
    detail: "Overhead press {n} plate(s) a side",
    icon: "🙌",
    category: "strength",
    tiers: [1, 2],
    unit: "plates",
    value: (c) => Math.max(0, plates(best(c, OHP))),
  },
  {
    id: "bench-bw",
    name: "Bench vs body weight",
    detail: "Bench {n}× your body weight",
    icon: "⚖️",
    category: "strength",
    tiers: [0.75, 1, 1.25, 1.5],
    unit: "×",
    value: (c) => Math.floor((best(c, BENCH) / bw(c)) * 100) / 100,
  },
  {
    id: "squat-bw",
    name: "Squat vs body weight",
    detail: "Squat {n}× your body weight",
    icon: "⚖️",
    category: "strength",
    tiers: [1, 1.5, 2, 2.5],
    unit: "×",
    value: (c) => Math.floor((best(c, SQUAT) / bw(c)) * 100) / 100,
  },
  {
    id: "dead-bw",
    name: "Deadlift vs body weight",
    detail: "Deadlift {n}× your body weight",
    icon: "⚖️",
    category: "strength",
    tiers: [1.25, 2, 2.5, 3],
    unit: "×",
    value: (c) => Math.floor((best(c, DEAD) / bw(c)) * 100) / 100,
  },
  {
    id: "thousand",
    name: "Thousand-pound club",
    detail: "Squat, bench and deadlift bests add up to {n} lb",
    icon: "👑",
    category: "strength",
    tiers: [500, 750, 1000, 1200],
    unit: "lb",
    value: (c) => Math.floor(lb(best(c, SQUAT) + best(c, BENCH) + best(c, DEAD))),
  },
  {
    id: "pullups",
    name: "Pull-up power",
    detail: "{n} strict pull-ups or chin-ups in one set",
    icon: "🧗",
    category: "strength",
    tiers: [1, 5, 10, 20],
    unit: "reps",
    value: (c) => maxReps(c, PULL),
  },
  {
    id: "pushups",
    name: "Push-up engine",
    detail: "{n} push-ups in one set",
    icon: "🤲",
    category: "strength",
    tiers: [10, 25, 40, 60],
    unit: "reps",
    value: (c) => maxReps(c, PUSH),
  },
  {
    id: "dips",
    name: "Dip station",
    detail: "{n} dips in one set",
    icon: "🪜",
    category: "strength",
    tiers: [5, 15, 25],
    unit: "reps",
    value: (c) => maxReps(c, ["dip", "bench-dip"]),
  },
  {
    id: "plank",
    name: "Plank of steel",
    detail: "Hold a plank for {n} seconds",
    icon: "🧱",
    category: "strength",
    tiers: [60, 120, 180, 300],
    unit: "s",
    value: (c) => c.sets.filter((s) => s.exerciseId === "plank").reduce((m, s) => Math.max(m, s.reps), 0),
  },

  // ---- Volume
  {
    id: "tonnes",
    name: "Tonnage",
    detail: "Lift {n} tonnes in total",
    icon: "🏗️",
    category: "volume",
    tiers: [10, 100, 500, 1000],
    unit: "t",
    value: (c) => Math.floor(c.stats.totalVolume / 1000),
  },
  {
    id: "sets",
    name: "Set collector",
    detail: "Log {n} sets",
    icon: "✅",
    category: "volume",
    tiers: [100, 1000, 5000, 10000],
    value: (c) => c.stats.totalSets,
  },
  {
    id: "reps",
    name: "Rep machine",
    detail: "Do {n} reps",
    icon: "🔁",
    category: "volume",
    tiers: [1000, 10000, 50000, 100000],
    value: (c) => c.sets.reduce((t, s) => t + repsOf(s), 0),
  },
  {
    id: "big-session",
    name: "Big day",
    detail: "Lift {n} tonnes in one workout",
    icon: "📦",
    category: "volume",
    tiers: [5, 10, 20],
    unit: "t",
    value: (c) => Math.floor(Math.max(0, ...c.stats.sessions.map((s) => s.volume)) / 1000),
  },
  {
    id: "leg-days",
    name: "Never skips leg day",
    detail: "Train legs in {n} workouts",
    icon: "🍗",
    category: "volume",
    tiers: [10, 50, 150],
    value: (c) =>
      countSessions(c, (s) =>
        s.sets.some((x) => EXERCISE_BY_ID.get(x.exerciseId)?.primary.some((m) => m === "quads" || m === "hamstrings" || m === "glutes")),
      ),
  },

  // ---- Records
  {
    id: "prs",
    name: "Personal bests",
    detail: "Set {n} PRs",
    icon: "🏆",
    category: "records",
    tiers: [1, 10, 50, 150],
    value: (c) => c.stats.prs.length,
  },
  {
    id: "pr-day",
    name: "Record day",
    detail: "Set {n} PRs in one workout",
    icon: "🎯",
    category: "records",
    tiers: [2, 3, 5],
    value: (c) => Math.max(0, ...c.stats.sessions.map((s) => s.prs)),
  },
  {
    id: "pr-lifts",
    name: "All-round strong",
    detail: "Hold PRs on {n} different exercises",
    icon: "🌟",
    category: "records",
    tiers: [3, 10, 25],
    value: (c) => new Set(c.stats.prs.map((p) => p.exerciseId)).size,
  },
  {
    id: "pr-streak",
    name: "On a roll",
    detail: "Set a PR in {n} workouts in a row",
    icon: "📈",
    category: "records",
    tiers: [2, 3, 5],
    value: (c) => runOf([...c.stats.sessions].reverse().map((s) => s.prs > 0)),
  },
  {
    id: "amrap",
    name: "Challenge accepted",
    detail: "Finish {n} challenge sets",
    icon: "⚡",
    category: "records",
    tiers: [1, 5, 20],
    value: (c) => c.sets.filter((s) => s.challenge).length,
  },

  // ---- Exploring
  {
    id: "exercises",
    name: "Explorer",
    detail: "Try {n} different exercises",
    icon: "🧭",
    category: "explore",
    tiers: [10, 25, 50, 75],
    value: (c) => new Set(c.sets.map((s) => s.exerciseId)).size,
  },
  {
    id: "muscles",
    name: "Head to toe",
    detail: "Train {n} different muscles",
    icon: "🫀",
    category: "explore",
    tiers: [8, 14, MUSCLES.length],
    value: (c) => musclesHit(c.sets).size,
  },
  {
    id: "full-week",
    name: "Complete week",
    detail: "Hit every major muscle in one week",
    icon: "🗺️",
    category: "explore",
    tiers: [1],
    value: (c) => (fullWeek(c) ? 1 : 0),
  },
  {
    id: "gyms",
    name: "Gym hopper",
    detail: "Train at {n} different gyms",
    icon: "📍",
    category: "explore",
    tiers: [2, 3, 5],
    value: (c) => new Set(c.starts.map((s) => s.gymId)).size,
  },
  {
    id: "bodyweight",
    name: "No gym, no problem",
    detail: "Finish {n} workouts with no equipment",
    icon: "🌳",
    category: "explore",
    tiers: [1, 10, 30],
    value: (c) =>
      countSessions(c, (s) => s.sets.length > 0 && s.sets.every((x) => (EXERCISE_BY_ID.get(x.exerciseId)?.needs.length ?? 1) === 0)),
  },
  {
    id: "swaps",
    name: "Adaptable",
    detail: "Swap {n} exercises",
    icon: "🔀",
    category: "explore",
    tiers: [1, 10, 50],
    value: (c) => c.events.filter((e) => e.type === "swap").length,
  },

  // ---- Training smart: rewards recovery and data, never grinding through fatigue
  {
    id: "easy-days",
    name: "Listens to the body",
    detail: "Take {n} easy days when readiness was low",
    icon: "🧘",
    category: "smart",
    tiers: [1, 5, 20],
    value: (c) => c.starts.filter((s) => s.call === "recover").length,
  },
  {
    id: "push-days",
    name: "Seize the day",
    detail: "Train on {n} push days",
    icon: "🚀",
    category: "smart",
    tiers: [1, 10, 40],
    value: (c) => c.starts.filter((s) => s.call === "push").length,
  },
  {
    id: "heart-rate",
    name: "Heart smart",
    detail: "Finish {n} workouts with heart rate",
    icon: "❤️",
    category: "smart",
    tiers: [1, 10, 50, 150],
    value: (c) => c.stats.sessions.filter((s) => s.avgHr).length,
  },
  {
    id: "feedback",
    name: "Coachable",
    detail: "Rate {n} exercises after doing them",
    icon: "💬",
    category: "smart",
    tiers: [10, 50, 200],
    value: (c) => c.events.filter((e) => e.type === "feedback").length,
  },
  {
    id: "on-target",
    name: "Sharpshooter",
    detail: "Hit every target rep in {n} workouts",
    icon: "🎯",
    category: "smart",
    tiers: [1, 10, 50, 150],
    value: (c) =>
      countSessions(c, (s) => s.sets.filter(gradedSet).length >= 6 && s.sets.every((x) => !gradedSet(x) || x.reps >= x.targetReps)),
  },
  {
    id: "rested",
    name: "Patient",
    detail: "Take the full rest before {n} sets",
    icon: "⏳",
    category: "smart",
    tiers: [50, 500, 2500],
    value: (c) => c.sets.filter((s) => (s.restSec ?? 0) >= 60).length,
  },

  // ---- Secret: hidden until earned
  {
    id: "comeback",
    name: "The comeback",
    detail: "Train again after 30 days or more away",
    icon: "🦅",
    category: "secret",
    secret: true,
    tiers: [1],
    value: (c) => (gapReturn(c, 30) ? 1 : 0),
  },
  {
    id: "new-year",
    name: "New year, same me",
    detail: "Train on 1 January",
    icon: "🎆",
    category: "secret",
    secret: true,
    tiers: [1],
    value: (c) => (c.sessions.some((s) => dm(s.at) === "0-1") ? 1 : 0),
  },
  {
    id: "leap",
    name: "Leap lifter",
    detail: "Train on 29 February",
    icon: "🐸",
    category: "secret",
    secret: true,
    tiers: [1],
    value: (c) => (c.sessions.some((s) => dm(s.at) === "1-29") ? 1 : 0),
  },
  {
    id: "spooky",
    name: "Skeleton crew",
    detail: "Train on Halloween",
    icon: "💀",
    category: "secret",
    secret: true,
    tiers: [1],
    value: (c) => (c.sessions.some((s) => dm(s.at) === "9-31") ? 1 : 0),
  },
  {
    id: "pi",
    name: "Iron pi",
    detail: "Train on 14 March",
    icon: "🥧",
    category: "secret",
    secret: true,
    tiers: [1],
    value: (c) => (c.sessions.some((s) => dm(s.at) === "2-14") ? 1 : 0),
  },
  {
    id: "century",
    name: "Century",
    detail: "Lift exactly 100 kg (or 100 lb) for a set",
    icon: "💯",
    category: "secret",
    secret: true,
    tiers: [1],
    value: (c) => (c.sets.some((s) => Math.abs(s.weight - 100) < 0.05 || Math.abs(lb(s.weight) - 100) < 0.05) ? 1 : 0),
  },
  {
    id: "lucky",
    name: "Lucky sevens",
    detail: "Do 7 sets of 7 reps in one workout",
    icon: "🎰",
    category: "secret",
    secret: true,
    tiers: [1],
    value: (c) => (c.sessions.some((s) => s.sets.filter((x) => x.reps === 7).length >= 7) ? 1 : 0),
  },
  {
    id: "dawn",
    name: "Before the sun",
    detail: "Start a workout before 6 am",
    icon: "🌌",
    category: "secret",
    secret: true,
    tiers: [1],
    value: (c) => (c.sessions.some((s) => hourOf(s.at) >= 4 && hourOf(s.at) < 6) ? 1 : 0),
  },
  {
    id: "own-call",
    name: "I know my body",
    detail: "Change the day's call before starting",
    icon: "🧠",
    category: "secret",
    secret: true,
    tiers: [1],
    value: (c) => (c.starts.some((s) => s.callOverridden) ? 1 : 0),
  },
  {
    id: "marathon",
    name: "Marathon",
    detail: "Log 30 sets in one workout",
    icon: "🏃",
    category: "secret",
    secret: true,
    tiers: [1],
    value: (c) => (Math.max(0, ...c.stats.sessions.map((s) => s.sets)) >= 30 ? 1 : 0),
  },
  {
    id: "bodyweight-bench",
    name: "Lift yourself",
    detail: "Bench your own body weight for 5 reps",
    icon: "🪞",
    category: "secret",
    secret: true,
    tiers: [1],
    value: (c) => (best(c, BENCH, 5) >= c.profile.bodyweight && c.profile.bodyweight > 0 ? 1 : 0),
  },
  {
    id: "double-dead",
    name: "Twice yourself",
    detail: "Deadlift double your body weight for 3 reps",
    icon: "🪨",
    category: "secret",
    secret: true,
    tiers: [1],
    value: (c) => (best(c, DEAD, 3) >= 2 * c.profile.bodyweight && c.profile.bodyweight > 0 ? 1 : 0),
  },
  {
    id: "first-gym-bw",
    name: "Hotel room hero",
    detail: "Finish a bodyweight workout while away from your usual gym",
    icon: "🛎️",
    category: "secret",
    secret: true,
    tiers: [1],
    value: (c) =>
      c.sessions.some(
        (s) =>
          s.start &&
          s.start.gymId !== c.starts[0]?.gymId &&
          s.sets.length > 0 &&
          s.sets.every((x) => (EXERCISE_BY_ID.get(x.exerciseId)?.needs.length ?? 1) === 0),
      )
        ? 1
        : 0,
  },
];

/** Months logged as Pro (one ProEvent per month; a repeat id counts once). */
export function proMonths(events: readonly AppEvent[]): number {
  const months = new Set<string>();
  for (const e of events) if (e.type === "pro") months.add(e.month);
  return months.size;
}

function dm(ms: number) {
  const d = new Date(ms);
  return `${d.getMonth()}-${d.getDate()}`;
}

function runOf(xs: boolean[]): number {
  let bestRun = 0;
  let run = 0;
  for (const x of xs) {
    run = x ? run + 1 : 0;
    bestRun = Math.max(bestRun, run);
  }
  return bestRun;
}

function musclesHit(sets: SetEvent[]): Set<Muscle> {
  const out = new Set<Muscle>();
  for (const s of sets) for (const m of EXERCISE_BY_ID.get(s.exerciseId)?.primary ?? []) out.add(m);
  return out;
}

const MAJOR: Muscle[] = ["chest", "upperBack", "lats", "quads", "hamstrings", "glutes", "frontDelts", "biceps", "triceps", "abs"];
function fullWeek(c: Ctx): boolean {
  const byWeek = new Map<number, SetEvent[]>();
  for (const s of c.sets) byWeek.set(weekOf(s.at), [...(byWeek.get(weekOf(s.at)) ?? []), s]);
  for (const sets of byWeek.values()) {
    const hit = musclesHit(sets);
    if (MAJOR.every((m) => hit.has(m))) return true;
  }
  return false;
}

function gapReturn(c: Ctx, days: number): boolean {
  const starts = c.sessions.map((s) => s.at).sort((a, b) => a - b);
  for (let i = 1; i < starts.length; i++) if (starts[i]! - starts[i - 1]! >= days * DAY) return true;
  return false;
}

export function context(events: readonly AppEvent[], stats: Stats, profile: Profile, bestStreak: number): Ctx {
  const sets: SetEvent[] = [];
  const starts: SessionStartEvent[] = [];
  const seen = new Set<string>();
  for (const e of events) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    if (e.type === "set") sets.push(e);
    else if (e.type === "sessionStart") starts.push(e);
  }
  starts.sort((a, b) => a.at - b.at);
  const startBy = new Map(starts.map((s) => [s.sessionId, s]));
  const bySession = new Map<string, SetEvent[]>();
  for (const s of sets) bySession.set(s.sessionId, [...(bySession.get(s.sessionId) ?? []), s]);
  const sessions = [...bySession]
    .map(([id, list]) => ({ id, at: Math.min(...list.map((s) => s.at)), sets: list, start: startBy.get(id) }))
    .sort((a, b) => a.at - b.at);
  return { sets, starts, stats, profile, events, sessions, bestStreak };
}

export interface Achievement {
  id: string;
  name: string;
  detail: string;
  icon: string;
  category: Category;
  secret: boolean;
  value: number;
  unit?: string;
  /** Highest tier reached, or null. */
  tier: Tier | null;
  /** Tiers reached so far (0 to tiers.length). */
  level: number;
  /** How many tiers this achievement has. */
  levels: number;
  /** The next goal, or null when every tier is done. */
  next: { tier: Tier; at: number; detail: string } | null;
  /** 0 to 1 toward the next tier (1 when complete). */
  progress: number;
  /** Shown as "???" until earned. */
  hidden: boolean;
}

/** An achievement's name in the current language (the English one in the table is the source). */
export const achName = (id: string) => t(`ach.${id}` as MessageKey);
/** What a tier asks for, with its threshold, in the current language. */
const fill = (id: string, n: number) => t(`ach.${id}.d` as MessageKey, { count: n, n: num(n) });

export function evaluate(def: AchievementDef, c: Ctx): Achievement {
  const value = def.value(c);
  const level = def.tiers.filter((t) => value >= t).length;
  // Tier names run from the top for short ladders: a one-step badge is gold, two steps are silver and gold.
  const names = TIERS.slice(def.tiers.length === 1 ? 2 : def.tiers.length === 2 ? 1 : 0);
  const tier = level ? names[level - 1]! : null;
  const nextAt = def.tiers[level]; // undefined at the top tier
  const prevAt = level ? def.tiers[level - 1]! : 0;
  const progress = nextAt === undefined ? 1 : Math.max(0, Math.min(1, (value - prevAt) / (nextAt - prevAt)));
  const hidden = !!def.secret && level === 0;
  return {
    id: def.id,
    name: hidden ? t("ach.secret") : achName(def.id),
    /** What the highest tier reached asked for (or the first tier, before any). */
    detail: hidden ? t("ach.secretHint") : fill(def.id, def.tiers[Math.max(0, level - 1)]!),
    icon: hidden ? "❔" : def.icon,
    category: def.category,
    secret: !!def.secret,
    value,
    unit: def.unit,
    tier,
    level,
    levels: def.tiers.length,
    next: nextAt === undefined ? null : { tier: names[level]!, at: nextAt, detail: hidden ? "???" : fill(def.id, nextAt) },
    progress,
    hidden,
  };
}

export function achievements(c: Ctx): Achievement[] {
  return ACHIEVEMENTS.map((d) => evaluate(d, c));
}

/** Total badges: one per tier of every achievement. */
export const BADGE_COUNT = ACHIEVEMENTS.reduce((n, d) => n + d.tiers.length, 0);

/** Tier names for an achievement's ladder (see evaluate). */
export function tierNames(id: string): Tier[] {
  const d = ACHIEVEMENTS.find((x) => x.id === id);
  const n = d?.tiers.length ?? 4;
  return TIERS.slice(n === 1 ? 2 : n === 2 ? 1 : 0);
}

/** Tiers newly reached between two evaluations, e.g. before and after a workout. */
export function unlocked(before: Achievement[], after: Achievement[]): { a: Achievement; tier: Tier }[] {
  const prev = new Map(before.map((a) => [a.id, a.level]));
  const out: { a: Achievement; tier: Tier }[] = [];
  for (const a of after) {
    const was = prev.get(a.id) ?? 0;
    if (a.level > was) out.push({ a, tier: a.tier! });
  }
  return out;
}

/** XP from achievement tiers reached. */
export function achievementXp(list: Achievement[]): number {
  let xp = 0;
  for (const a of list) {
    const names = tierNames(a.id);
    for (let i = 0; i < a.level; i++) xp += TIER_XP[names[i]!];
  }
  return xp;
}

/** Share-link ids: "<achievement>.<tier>" for the highest tier reached. */
export function shareIds(list: Achievement[]): string[] {
  return list.filter((a) => a.tier).map((a) => `${a.id}.${a.tier}`);
}

export function shareName(id: string): string | null {
  const [aid, tier] = id.split(".");
  const d = ACHIEVEMENTS.find((x) => x.id === aid);
  if (!d || !TIERS.includes(tier as Tier)) return null;
  return `${d.icon} ${achName(d.id)} · ${TIER_LABEL[tier as Tier]}`;
}

/** Closest unearned goals, for "almost there" nudges. Secret ones are left out. */
export function nearest(list: Achievement[], n = 3): Achievement[] {
  return list
    .filter((a) => a.next && !a.hidden && a.progress > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, n);
}
