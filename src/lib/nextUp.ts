import { nextStart, trainingDays } from "./calendar";
import { EXERCISE_BY_ID } from "./exercises";
import { recovery } from "./recovery";
import { LARGE_MUSCLES, MUSCLES, type AppEvent, type Muscle, type Profile } from "./types";

// "What's next" on the workout summary (polish pass, Melvin 2026-11-10): the next training day from the
// lifter's own schedule, which of today's muscles will be ready by then, and which need longer, using
// the same recovery model as the recovery map, run forward in time. Derived from events, never stored.

/** A muscle counts as ready again at this recovery (the "ready" band). */
export const READY_AT = 70;
const HOUR = 3_600_000;

export interface NextUp {
  /** When the next workout is due (local time from the schedule). */
  at: number;
  /** Muscles trained today that will be ready by then. */
  ready: Muscle[];
  /** Muscles trained today that won't be, with the hours from now until they are. */
  waiting: { muscle: Muscle; hours: number }[];
  /** Big muscles not trained today that will be fresh then: what the next plan is likely to lean on. */
  fresh: Muscle[];
}

/** Hours from `now` until `m` reaches READY_AT, checked hourly up to four days. */
export function hoursUntilReady(events: readonly AppEvent[], m: Muscle, now: number): number {
  for (let h = 0; h <= 96; h++) if (recovery(events, now + h * HOUR)[m] >= READY_AT) return h;
  return 96;
}

export function nextUp(
  events: readonly AppEvent[],
  sessionId: string,
  profile: Pick<Profile, "calendar" | "daysPerWeek">,
  now: number,
): NextUp | null {
  // The next session is on another day: today's is done.
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  const at = nextStart(trainingDays(profile), profile.calendar?.time ?? "18:00", tomorrow.getTime());
  if (at === null) return null;
  const trained = new Set<Muscle>();
  for (const e of events) {
    if (e.type !== "set" || e.sessionId !== sessionId) continue;
    for (const m of EXERCISE_BY_ID.get(e.exerciseId)?.primary ?? []) trained.add(m);
  }
  if (!trained.size) return null;
  const then = recovery(events, at);
  const ready: Muscle[] = [];
  const waiting: { muscle: Muscle; hours: number }[] = [];
  for (const m of MUSCLES) {
    if (!trained.has(m)) continue;
    if (then[m] >= READY_AT) ready.push(m);
    else waiting.push({ muscle: m, hours: hoursUntilReady(events, m, now) });
  }
  waiting.sort((a, b) => b.hours - a.hours);
  const fresh = MUSCLES.filter((m) => LARGE_MUSCLES.has(m) && !trained.has(m) && then[m] >= 90)
    .sort((a, b) => then[b] - then[a])
    .slice(0, 2);
  return { at, ready, waiting, fresh };
}
