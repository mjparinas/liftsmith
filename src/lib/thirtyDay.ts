// 30-day challenges (Melvin, 2026-11-27, traffic idea 2: "30-day challenge pages … printable calendar … Join in the app";
// docs/decisions/thirty-day-challenges.md). One bodyweight move a day for 30 days, a little more each day, with a rest
// day every fourth day. The same plan draws the website's page and printable calendar (/challenges/<slug>/,
// ChallengeView.tsx) and the app's challenge screen (#/challenge/<id>, ThirtyDay.tsx), so the paper and the phone
// never disagree.
//
// In the app, joining, each day done and leaving are events (types.ts ThirtyJoinEvent and friends), so they sync and
// everything here is derived from them, never stored. Days are steps, not dates: day N is the next day not yet done,
// one a calendar day, and a rest day takes one calendar day of its own. A missed day never fails the challenge; it
// just waits. Challenge days are not Liftsmith workouts: no sets, bests, XP, streak or weekly goal.
import type { AppEvent } from "./types";

export type ThirtyLevel = "beginner" | "intermediate" | "advanced";
export const THIRTY_LEVELS: readonly ThirtyLevel[] = ["beginner", "intermediate", "advanced"];

/** Reps, or seconds held (plank, wall sit, dead hang). */
export type ThirtyUnit = "reps" | "seconds";

export interface ThirtyChallenge {
  /** The challenge's id: its words are `c30.<id>.*` in src/locales/text/c30.ts, and its page is `/challenges/<slug>/`. */
  id: string;
  /** The page's address: the words people search, "30-day-squat-challenge". */
  slug: string;
  unit: ThirtyUnit;
  /** Counted on each side (lunges): the amount is per leg. */
  perSide?: true;
  /** The exercise at each level (exercises.ts ids), with day 1's and day 30's amounts. */
  levels: Record<ThirtyLevel, { exercise: string; start: number; end: number }>;
}

const lv = (exercise: string, start: number, end: number) => ({ exercise, start, end });
const same = (exercise: string, b: [number, number], i: [number, number], a: [number, number]) => ({
  beginner: lv(exercise, ...b),
  intermediate: lv(exercise, ...i),
  advanced: lv(exercise, ...a),
});

/**
 * Every challenge, in the order the index lists them: the moves people search a 30-day challenge for most first.
 * Day 1 is something a lifter at that level can do today; day 30 roughly five to eight times it.
 */
export const THIRTY_CHALLENGES: readonly ThirtyChallenge[] = [
  { id: "squat", slug: "30-day-squat-challenge", unit: "reps", levels: same("bodyweight-squat", [15, 100], [30, 150], [50, 250]) },
  {
    id: "pushup",
    slug: "30-day-push-up-challenge",
    unit: "reps",
    levels: { beginner: lv("knee-push-up", 5, 40), intermediate: lv("push-up", 10, 60), advanced: lv("push-up", 20, 100) },
  },
  { id: "plank", slug: "30-day-plank-challenge", unit: "seconds", levels: same("plank", [20, 120], [45, 240], [60, 300]) },
  {
    id: "pullup",
    slug: "30-day-pull-up-challenge",
    unit: "reps",
    levels: { beginner: lv("negative-pull-up", 2, 12), intermediate: lv("pull-up", 3, 20), advanced: lv("pull-up", 8, 50) },
  },
  { id: "abs", slug: "30-day-sit-up-challenge", unit: "reps", levels: same("sit-up", [10, 60], [20, 100], [30, 150]) },
  { id: "glute", slug: "30-day-glute-bridge-challenge", unit: "reps", levels: same("glute-bridge", [15, 100], [25, 150], [40, 200]) },
  { id: "lunge", slug: "30-day-lunge-challenge", unit: "reps", perSide: true, levels: same("reverse-lunge", [5, 30], [10, 50], [20, 80]) },
  { id: "wallsit", slug: "30-day-wall-sit-challenge", unit: "seconds", levels: same("wall-sit", [20, 120], [45, 180], [60, 300]) },
  { id: "burpee", slug: "30-day-burpee-challenge", unit: "reps", levels: same("burpee", [5, 30], [10, 60], [20, 100]) },
  { id: "hang", slug: "30-day-dead-hang-challenge", unit: "seconds", levels: same("dead-hang", [10, 60], [20, 90], [30, 150]) },
  { id: "calf", slug: "30-day-calf-raise-challenge", unit: "reps", levels: same("bw-calf-raise", [20, 120], [30, 200], [50, 300]) },
  {
    id: "climber",
    slug: "30-day-mountain-climber-challenge",
    unit: "reps",
    levels: same("mountain-climber", [20, 100], [40, 200], [60, 300]),
  },
];

export const THIRTY_DAYS = 30;
export const THIRTY_BY_ID: ReadonlyMap<string, ThirtyChallenge> = new Map(THIRTY_CHALLENGES.map((c) => [c.id, c]));
export const THIRTY_BY_SLUG: ReadonlyMap<string, ThirtyChallenge> = new Map(THIRTY_CHALLENGES.map((c) => [c.slug, c]));

export const thirtyPath = (c: Pick<ThirtyChallenge, "slug">) => `/challenges/${c.slug}/`;
export const isThirtyLevel = (s: unknown): s is ThirtyLevel => (THIRTY_LEVELS as readonly unknown[]).includes(s);

/** A rest day: every fourth day (4, 8, … 28), so day 30 is the biggest day of all. */
export const isRestDay = (day: number) => day % 4 === 0;

export interface ThirtyDayPlan {
  /** 1 to 30. */
  day: number;
  rest: boolean;
  /** Reps or seconds; 0 on a rest day. */
  amount: number;
}

/** Rounds to a step that reads well on a calendar: ones while small, then fives, then tens. */
function niceStep(end: number, unit: ThirtyUnit): number {
  if (unit === "seconds") return end > 120 ? 10 : 5;
  return end <= 30 ? 1 : end <= 60 ? 2 : end <= 150 ? 5 : 10;
}

/**
 * The 30 days of a challenge at a level: day 1 is the level's start, day 30 its end, and the days between climb
 * evenly over the training days (never down), rounded to a step that reads well. Rest days are 0.
 */
export function thirtyPlan(c: ThirtyChallenge, level: ThirtyLevel): ThirtyDayPlan[] {
  const { start, end } = c.levels[level];
  const train = Array.from({ length: THIRTY_DAYS }, (_, i) => i + 1).filter((d) => !isRestDay(d));
  const step = niceStep(end, c.unit);
  const amountAt = new Map<number, number>();
  let prev = 0;
  train.forEach((d, i) => {
    const raw = start + ((end - start) * i) / (train.length - 1);
    let n = i === 0 ? start : i === train.length - 1 ? end : Math.round(raw / step) * step;
    n = Math.max(n, prev, 1);
    amountAt.set(d, n);
    prev = n;
  });
  return Array.from({ length: THIRTY_DAYS }, (_, i) => {
    const day = i + 1;
    const rest = isRestDay(day);
    return { day, rest, amount: rest ? 0 : (amountAt.get(day) ?? end) };
  });
}

/** The amount for one day (0 on a rest day). */
export const thirtyAmount = (c: ThirtyChallenge, level: ThirtyLevel, day: number) => thirtyPlan(c, level)[day - 1]?.amount ?? 0;

/** The whole challenge's total at a level: what the calendar adds up to. */
export const thirtyTotal = (c: ThirtyChallenge, level: ThirtyLevel) => thirtyPlan(c, level).reduce((s, d) => s + d.amount, 0);

// ——— In the app: runs derived from events ———

/** A local calendar day as a number of days, so two days compare by subtraction. */
export function calendarDay(ms: number): number {
  const d = new Date(ms);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

export interface ThirtyLogged {
  id: string;
  day: number;
  amount: number;
  at: number;
}

export interface ThirtyRun {
  /** The join event's id: day events point at it. */
  id: string;
  challenge: ThirtyChallenge;
  level: ThirtyLevel;
  joinedAt: number;
  /** Training days done, by day number. */
  done: ThirtyLogged[];
  /** Ended by Leave (not finished). */
  leftAt?: number;
  /** Day 30 done. */
  finishedAt?: number;
}

type ThirtyEvent = Extract<AppEvent, { type: "thirtyJoin" | "thirtyDay" | "thirtyLeave" }>;
const RANK: Record<ThirtyEvent["type"], number> = { thirtyJoin: 0, thirtyDay: 1, thirtyLeave: 2 };

/** Every challenge run the lifter started, oldest first, from their events. */
export function thirtyRuns(events: readonly AppEvent[]): ThirtyRun[] {
  const runs: ThirtyRun[] = [];
  const byId = new Map<string, ThirtyRun>();
  const sorted = events
    .filter((e): e is ThirtyEvent => e.type === "thirtyJoin" || e.type === "thirtyDay" || e.type === "thirtyLeave")
    // At the same moment a join comes before its days, and a leave after them.
    .sort((a, b) => a.at - b.at || RANK[a.type] - RANK[b.type] || a.id.localeCompare(b.id));
  for (const e of sorted) {
    if (e.type === "thirtyJoin") {
      const c = THIRTY_BY_ID.get(e.challenge);
      if (!c || !isThirtyLevel(e.level)) continue;
      // Joining a challenge that's already running changes its level and keeps the days done.
      const running = runs.find((r) => r.challenge.id === c.id && !r.leftAt && !r.finishedAt);
      if (running) {
        running.level = e.level;
        continue;
      }
      const run: ThirtyRun = { id: e.id, challenge: c, level: e.level, joinedAt: e.at, done: [] };
      runs.push(run);
      byId.set(e.id, run);
    } else if (e.type === "thirtyLeave") {
      const run = byId.get(e.joinId);
      if (run && !run.leftAt && !run.finishedAt) run.leftAt = e.at;
    } else {
      const run = byId.get(e.joinId);
      if (!run || run.leftAt || run.finishedAt) continue;
      // The next training day only, so two devices logging the same day count it once.
      const next = nextTrainingDay(run.done.length ? run.done[run.done.length - 1]!.day : 0);
      if (e.day !== next) continue;
      run.done.push({ id: e.id, day: e.day, amount: e.amount, at: e.at });
      if (e.day === THIRTY_DAYS) run.finishedAt = e.at;
    }
  }
  return runs;
}

/** The training day after `day` (rest days skipped), or 31 past the end. */
export function nextTrainingDay(day: number): number {
  let d = day + 1;
  while (d <= THIRTY_DAYS && isRestDay(d)) d++;
  return d;
}

export type ThirtyToday =
  /** Today's training day is waiting. */
  | { state: "due"; day: number; amount: number }
  /** Today is a rest day (the day number it is). */
  | { state: "rest"; day: number; nextDay: number; nextAmount: number }
  /** Today's day is done; the next one is tomorrow (or after a rest day). */
  | { state: "doneToday"; day: number; logged: ThirtyLogged; nextDay: number; nextAmount: number; restFirst: boolean }
  | { state: "finished" }
  | { state: "left" };

/** Where a run stands today. */
export function thirtyToday(run: ThirtyRun, now: number): ThirtyToday {
  if (run.finishedAt) return { state: "finished" };
  if (run.leftAt) return { state: "left" };
  const last = run.done[run.done.length - 1];
  const lastDay = last?.day ?? 0;
  const next = nextTrainingDay(lastDay);
  const restBetween = next - lastDay - 1;
  const nextAmount = thirtyAmount(run.challenge, run.level, next);
  const today = calendarDay(now);
  if (!last) return { state: "due", day: next, amount: nextAmount };
  const since = today - calendarDay(last.at);
  if (since <= 0) return { state: "doneToday", day: last.day, logged: last, nextDay: next, nextAmount, restFirst: restBetween > 0 };
  // Each rest day takes one calendar day; past them (or after a missed day) the next training day is due.
  if (since <= restBetween) return { state: "rest", day: lastDay + since, nextDay: next, nextAmount };
  return { state: "due", day: next, amount: nextAmount };
}

/** The runs still going (joined, not left or finished), newest first. */
export const activeThirty = (events: readonly AppEvent[]) =>
  thirtyRuns(events)
    .filter((r) => !r.leftAt && !r.finishedAt)
    .reverse();

/** At most this many challenges at once, so Today stays short. */
export const THIRTY_MAX_ACTIVE = 3;
