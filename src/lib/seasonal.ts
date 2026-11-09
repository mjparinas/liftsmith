import { dedupe } from "./derive";
import type { AppEvent, SetEvent } from "./types";

// Holiday and seasonal challenges. Dated windows in the lifter's local time, each with a goal counted
// from workouts, sets or tonnage (never from a single muscle, so nothing rewards training a muscle that's
// Fatigued). Derived from events, never stored. Rewards (XP, badges) belong to the gamification code,
// which can read seasonalChallenges(); this file only tracks progress.

export interface SeasonalDef {
  id: string;
  name: string;
  emoji: string;
  detail: string;
  /** Month (0-11) and day the window opens and closes (inclusive). */
  from: [number, number];
  to: [number, number];
  goal: number;
  /** What counts toward the goal. */
  measure: "workouts" | "sets" | "kg" | "days";
}

export const SEASONAL: SeasonalDef[] = [
  { id: "new-year", name: "Fresh start week", emoji: "🎆", detail: "Three workouts in the first week of the year.", from: [0, 1], to: [0, 7], goal: 3, measure: "workouts" },
  { id: "valentine", name: "Heart pumping", emoji: "💘", detail: "60 hard sets between 10 and 16 February. Any muscles, your plan picks.", from: [1, 10], to: [1, 16], goal: 60, measure: "sets" },
  { id: "spring", name: "Spring into it", emoji: "🌱", detail: "Six workouts in the two weeks after the spring equinox.", from: [2, 20], to: [3, 2], goal: 6, measure: "workouts" },
  { id: "solstice", name: "Longest day", emoji: "☀️", detail: "Train on four different days around the June solstice (18 to 24 June).", from: [5, 18], to: [5, 24], goal: 4, measure: "days" },
  { id: "back-to-it", name: "Back to it", emoji: "🍂", detail: "Eight workouts from 1 to 21 September.", from: [8, 1], to: [8, 21], goal: 8, measure: "workouts" },
  { id: "halloween", name: "Spooky strong", emoji: "🎃", detail: "Lift 6,660 kg (6.66 t) between 25 and 31 October.", from: [9, 25], to: [9, 31], goal: 6660, measure: "kg" },
  { id: "twelve-days", name: "Twelve days of lifting", emoji: "🎄", detail: "Six workouts from 13 to 24 December.", from: [11, 13], to: [11, 24], goal: 6, measure: "workouts" },
  { id: "last-rep", name: "Last rep of the year", emoji: "🥂", detail: "One workout between Boxing Day and New Year's Eve.", from: [11, 26], to: [11, 31], goal: 1, measure: "workouts" },
];

export interface SeasonalChallenge extends SeasonalDef {
  start: number;
  /** Exclusive: the day after the last day. */
  end: number;
  progress: number;
  done: boolean;
  daysLeft: number;
}

function window(def: SeasonalDef, year: number) {
  const start = new Date(year, def.from[0], def.from[1]).getTime();
  const end = new Date(year, def.to[0], def.to[1] + 1).getTime();
  return { start, end };
}

function progressOf(def: SeasonalDef, events: readonly AppEvent[], start: number, end: number): number {
  const sets = events.filter((e): e is SetEvent => e.type === "set" && e.at >= start && e.at < end);
  switch (def.measure) {
    case "sets":
      return sets.length;
    case "kg":
      return Math.round(sets.reduce((v, s) => v + s.weight * s.reps, 0));
    case "days":
      return new Set(sets.map((s) => new Date(s.at).toDateString())).size;
    case "workouts":
      return new Set(sets.map((s) => s.sessionId)).size;
  }
}

/** Challenges open now (and any that ended in the last 3 days, so the result is seen). */
export function seasonalChallenges(events: readonly AppEvent[], now: number): SeasonalChallenge[] {
  const evs = dedupe(events);
  const y = new Date(now).getFullYear();
  const out: SeasonalChallenge[] = [];
  for (const def of SEASONAL) {
    const { start, end } = window(def, y);
    if (now < start || now >= end + 3 * 86400_000) continue;
    const progress = progressOf(def, evs, start, end);
    out.push({ ...def, start, end, progress: Math.min(progress, def.goal), done: progress >= def.goal, daysLeft: Math.max(0, Math.ceil((end - now) / 86400_000)) });
  }
  return out;
}

/** The next challenge to open, for a teaser when none is running. */
export function nextSeasonal(now: number): { def: SeasonalDef; start: number } | null {
  const y = new Date(now).getFullYear();
  const upcoming = [y, y + 1].flatMap((yy) => SEASONAL.map((def) => ({ def, start: window(def, yy).start }))).filter((x) => x.start > now);
  upcoming.sort((a, b) => a.start - b.start);
  return upcoming[0] ?? null;
}
