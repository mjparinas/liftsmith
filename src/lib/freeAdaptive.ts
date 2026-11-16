import { weekOf } from "./derive";
import { dayKey } from "./random";
import type { AppEvent, BonusDayEvent } from "./types";

// One free adaptive workout a week (Melvin, 2026-11-12; docs/decisions/money.md). Without Pro, Today follows a
// free fixed program, and once a week the lifter can swap that day for the adaptive plan, so the main thing Pro
// does is something they've felt, not just read about. Counted from the event log like everything else: a
// workout counts when it was planned adaptively (no program, no saved routine, not logged by hand afterwards).
// The week starts on the lifter's own first day (Settings › Workout preferences), like streaks and quests.
//
// Bonus days (Melvin, 2026-11-16, an easter egg): seven quick taps on the streak flame on Today give a free lifter
// a whole extra day of adaptive workouts, at most one a day and three a week. Adaptive workouts on a bonus day
// don't use up the week's free one. Kept as `bonusDay` events, so they sync and survive a reinstall.

/** Most bonus days in one week. */
export const BONUS_WEEK_MAX = 3;

/** Whether a session start was an adaptive workout. */
export function wasAdaptive(e: AppEvent): boolean {
  return e.type === "sessionStart" && !e.program && !e.routine && e.source !== "manual";
}

/** The local days that are bonus days. */
function bonusDays(events: readonly AppEvent[]): Set<string> {
  const days = new Set<string>();
  for (const e of events) if (e.type === "bonusDay") days.add(e.day);
  return days;
}

/** Whether today is a bonus day. */
export function bonusToday(events: readonly AppEvent[], now: number): boolean {
  return bonusDays(events).has(dayKey(now));
}

/** Whether this week's free adaptive workout is still unused, or today is a bonus day. */
export function freeAdaptiveLeft(events: readonly AppEvent[], now: number): boolean {
  const bonus = bonusDays(events);
  if (bonus.has(dayKey(now))) return true;
  const from = weekOf(now);
  return !events.some((e) => e.at >= from && e.at <= now && wasAdaptive(e) && !bonus.has(dayKey(e.at)));
}

/** What seven taps on the flame would do now: unlock today, or why not (already today, or three this week). */
export function bonusDayCheck(events: readonly AppEvent[], now: number): "ok" | "today" | "week" {
  const today = dayKey(now);
  const from = weekOf(now);
  let week = 0;
  for (const e of events) {
    if (e.type !== "bonusDay") continue;
    if (e.day === today) return "today";
    if (e.at >= from && e.at <= now) week++;
  }
  return week >= BONUS_WEEK_MAX ? "week" : "ok";
}

/** The event that makes today a bonus day. Its id is the day, so a second device's unlock merges into one. */
export function bonusDayEvent(now: number): BonusDayEvent {
  const day = dayKey(now);
  return { type: "bonusDay", id: `bonus-day-${day}`, at: now, day };
}
