// Civil dates for a coach's calendar (docs/decisions/trainer-mode.md "Assign workouts by date"). No account or storage:
// the server and the phone share these so a painted day is the same date on both.
import { decodeRoutine } from "./routineShare";
import type { Routine } from "./types";

export type ScheduleKind = "workout" | "rest";

export interface ScheduleCell {
  date: string;
  kind: ScheduleKind;
  name: string;
  code: string;
  coachId: string;
  /** `all`, `team:<id>` or `client:<id>`. */
  scope: string;
  updatedAt: number;
}

/** How far ahead a coach can paint, about nine months. */
export const SCHEDULE_HORIZON_DAYS = 280;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function utcDay(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Moves a civil date by whole days. The weekday of the calendar date does not depend on a time zone. */
export function shiftDay(key: string, by: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, (d ?? 1) + by));
  return utcDay(dt.getTime());
}

/** A date the coach may set: from yesterday (time zones) through the horizon. */
export function dateAllowed(date: string, now = Date.now()): boolean {
  if (!DATE.test(date) || shiftDay(date, 0) !== date) return false;
  const today = utcDay(now);
  return date >= shiftDay(today, -1) && date <= shiftDay(today, SCHEDULE_HORIZON_DAYS);
}

/** Client-specific beats a team day, which beats the coach-wide day. Newest write wins a tie. */
export function pickCell(cells: readonly ScheduleCell[], date: string): ScheduleCell | null {
  const day = cells.filter((c) => c.date === date);
  if (!day.length) return null;
  const rank = (scope: string) => (scope.startsWith("client:") ? 0 : scope.startsWith("team:") ? 1 : 2);
  return [...day].sort((a, b) => rank(a.scope) - rank(b.scope) || b.updatedAt - a.updatedAt)[0] ?? null;
}

export const scheduleRoutineId = (cell: ScheduleCell): string => `coach-schedule-${cell.date}-${cell.coachId}-${cell.updatedAt}`;

/** A routine Today can run from a painted day. Null when the code has nothing this app knows. */
export function routineFromSchedule(cell: ScheduleCell): Routine | null {
  if (cell.kind !== "workout") return null;
  const d = decodeRoutine(cell.code);
  if (!d || !d.items.length) return null;
  return {
    id: scheduleRoutineId(cell),
    name: cell.name || d.name,
    items: d.items,
    createdAt: cell.updatedAt,
    updatedAt: cell.updatedAt,
    ...(d.rehab ? { rehab: true } : {}),
    ...(d.rehabPart ? { rehabPart: d.rehabPart } : {}),
    ...(d.perWeek ? { perWeek: d.perWeek } : {}),
    ...(d.rehabPlan ? { rehabPlan: d.rehabPlan } : {}),
    ...(d.parts ? { parts: d.parts } : {}),
  };
}
