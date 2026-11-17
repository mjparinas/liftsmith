// Crew sessions and club chat on the phone (docs/decisions/friends.md "Club chat and crew sessions"): the words for a
// session's time, the days and times the planner offers (chips and a − / + time, no typing), and merging the chat's
// pages. The server is src/server/clubChat.ts.
import { date, t } from "./i18n";
import type { ClubMessage } from "./socialTypes";

const DAY = 86_400_000;
/** The time picker steps a quarter of an hour. */
export const CREW_STEP_MIN = 15;
/** Days the planner offers as chips: today and the next 13. Further ahead (up to 30) is rarely what a crew wants. */
export const CREW_DAY_CHIPS = 14;

/** Midnight at the start of the day `ms` falls in, on this device's clock. */
export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** The days on the planner's chips: midnights, today first. */
export function crewDays(now: number, count = CREW_DAY_CHIPS): number[] {
  const out: number[] = [];
  const first = new Date(startOfDay(now));
  for (let i = 0; i < count; i++) out.push(new Date(first.getFullYear(), first.getMonth(), first.getDate() + i).getTime());
  return out;
}

/** "Today", "Tomorrow", else "Sat, Nov 21" in the app's language. */
export function dayLabel(day: number, now: number): string {
  const today = startOfDay(now);
  const d = startOfDay(day);
  if (d === today) return t("crew.today");
  if (Math.round((d - today) / DAY) === 1) return t("crew.tomorrow");
  return date(d, { weekday: "short", month: "short", day: "numeric" });
}

/** "Today, 6:00 PM" or "Sat, Nov 21, 9:00 AM". */
export function crewWhen(at: number, now: number): string {
  return t("crew.when", { day: dayLabel(at, now), time: date(at, { hour: "numeric", minute: "2-digit" }) });
}

/**
 * The planner's first time: the next whole hour from now, at least 30 minutes away, so a crew has time to see it.
 * Returned as minutes after midnight of `day`; on a later day it's 6 PM, the busiest time at most gyms.
 */
export function defaultMinutes(day: number, now: number): number {
  if (startOfDay(day) !== startOfDay(now)) return 18 * 60;
  // Counted from today's midnight, so late at night it stays today's last quarter hour rather than wrapping to 00:00.
  const m = (now - startOfDay(now)) / 60_000 + 30;
  return Math.max(minMinutes(day, now), Math.min(24 * 60 - CREW_STEP_MIN, Math.ceil(m / 60) * 60));
}

/** The session's time from a planner day and minutes after its midnight (summer time changes included). */
export function atOf(day: number, minutes: number): number {
  const d = new Date(day);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(minutes / 60), minutes % 60).getTime();
}

/** The earliest time the picker offers on `day`: midnight, or today the next quarter hour from now. */
export function minMinutes(day: number, now: number): number {
  return startOfDay(day) === startOfDay(now) ? Math.ceil((now - startOfDay(now)) / 60_000 / CREW_STEP_MIN) * CREW_STEP_MIN : 0;
}

/** One step of the time picker, kept inside the day and, today, from now on. Null when it can't move. */
export function stepMinutes(minutes: number, dir: 1 | -1, size: number, day: number, now: number): number | null {
  const lo = minMinutes(day, now);
  const next = Math.max(lo, Math.min(24 * 60 - CREW_STEP_MIN, minutes + dir * size * CREW_STEP_MIN));
  return next === minutes ? null : next;
}

/**
 * Adds messages to the chat in time order with no repeats: a page of earlier ones, new ones from the next look, or the
 * lifter's own just sent (which the next look brings back too).
 */
export function mergeMessages(have: readonly ClubMessage[], more: readonly ClubMessage[]): ClubMessage[] {
  const byId = new Map(have.map((m) => [m.id, m]));
  for (const m of more) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
}
