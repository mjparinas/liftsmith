// Monthly challenges for everyone (Melvin, 2026-11-12, Friends gap list 2: item 7; docs/decisions/friends.md). One
// challenge a month, the same for every lifter, so friends chase the same thing without anyone setting it up: a
// number of workouts, sets or minutes in the calendar month. Progress comes from the lifter's own workouts on the
// device (offline, every device agrees), and finishing earns the month's medal plus the "Monthly challenger" badge
// (achievements.ts). Nothing is stored: a month counts as finished whenever its sessions reach the goal.
import type { SessionSummary } from "./derive";
import type { BoardMetric } from "./socialTypes";

export type MonthMetric = Extract<BoardMetric, "workouts" | "sets" | "minutes">;

export interface MonthChallenge {
  /** "2026-11": the month, in the lifter's time zone. */
  key: string;
  start: number;
  end: number;
  metric: MonthMetric;
  goal: number;
}

/**
 * The goal for each month, picked so a lifter training about three times a week finishes with a little to spare,
 * rotating so each kind of training gets its turn: workouts, then sets, then minutes.
 */
const GOALS: { metric: MonthMetric; goal: number }[] = [
  { metric: "workouts", goal: 12 },
  { metric: "sets", goal: 200 },
  { metric: "minutes", goal: 600 },
];

const keyOf = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, "0")}`;

/** The challenge for the month containing `at`. */
export function monthChallenge(at: number): MonthChallenge {
  const d = new Date(at);
  const y = d.getFullYear();
  const m = d.getMonth();
  const g = GOALS[(y * 12 + m) % GOALS.length]!;
  return { key: keyOf(y, m), start: new Date(y, m, 1).getTime(), end: new Date(y, m + 1, 1).getTime(), ...g };
}

/** How far the lifter is on a month's challenge, from their finished workouts. */
export function monthValue(sessions: readonly Pick<SessionSummary, "start" | "sets" | "seconds">[], ch: MonthChallenge): number {
  let v = 0;
  for (const s of sessions) {
    if (s.start < ch.start || s.start >= ch.end) continue;
    v += ch.metric === "workouts" ? 1 : ch.metric === "sets" ? s.sets : s.seconds / 60;
  }
  return Math.floor(v);
}

export interface MonthProgress extends MonthChallenge {
  value: number;
  done: boolean;
}

/** Every month with a workout, oldest first, and whether its challenge was finished. */
export function monthHistory(sessions: readonly Pick<SessionSummary, "start" | "sets" | "seconds">[]): MonthProgress[] {
  const months = new Map<string, MonthChallenge>();
  for (const s of sessions) {
    const ch = monthChallenge(s.start);
    months.set(ch.key, ch);
  }
  return [...months.values()]
    .sort((a, b) => a.start - b.start)
    .map((ch) => {
      const value = monthValue(sessions, ch);
      return { ...ch, value, done: value >= ch.goal };
    });
}

/** How many monthly challenges the lifter has finished (the badge's count). */
export const monthsFinished = (sessions: readonly Pick<SessionSummary, "start" | "sets" | "seconds">[]) =>
  monthHistory(sessions).filter((m) => m.done).length;

/** This month's challenge with the lifter's progress and the whole days left. */
export function thisMonth(
  sessions: readonly Pick<SessionSummary, "start" | "sets" | "seconds">[],
  now: number,
): MonthProgress & { daysLeft: number } {
  const ch = monthChallenge(now);
  const value = monthValue(sessions, ch);
  return { ...ch, value, done: value >= ch.goal, daysLeft: Math.max(0, Math.ceil((ch.end - now) / 86_400_000)) };
}
