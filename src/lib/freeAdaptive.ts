import { weekOf } from "./derive";
import type { AppEvent } from "./types";

// One free adaptive workout a week (Melvin, 2026-11-12; docs/decisions/money.md). Without Pro, Today follows a
// free fixed program, and once a week the lifter can swap that day for the adaptive plan, so the main thing Pro
// does is something they've felt, not just read about. Counted from the event log like everything else: a
// workout counts when it was planned adaptively (no program, no saved routine, not logged by hand afterwards).
// The week starts on the lifter's own first day (Settings › Workout preferences), like streaks and quests.

/** Whether a session start was an adaptive workout. */
export function wasAdaptive(e: AppEvent): boolean {
  return e.type === "sessionStart" && !e.program && !e.routine && e.source !== "manual";
}

/** Whether this week's free adaptive workout is still unused. */
export function freeAdaptiveLeft(events: readonly AppEvent[], now: number): boolean {
  const from = weekOf(now);
  return !events.some((e) => e.at >= from && e.at <= now && wasAdaptive(e));
}
