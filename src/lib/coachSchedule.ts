// The phone side of a coach's calendar (server: src/server/coachSchedule.ts). Today reads the cache.
import { api, AuthError, readAccount } from "./auth";
import { dayKey } from "./dashboard";
import { pickCell, routineFromSchedule, type ScheduleCell, type ScheduleKind } from "./scheduleDays";

export type { ScheduleCell, ScheduleKind } from "./scheduleDays";
const KEY = "liftsmith.coachSchedule";

let memory: ScheduleCell[] | null = null;

function readCache(): ScheduleCell[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]") as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((c): c is ScheduleCell => !!c && typeof c === "object" && typeof (c as ScheduleCell).date === "string");
  } catch {
    return [];
  }
}

export function scheduleCells(): readonly ScheduleCell[] {
  if (!memory) memory = readCache();
  return memory;
}

export function scheduleOn(date: string): ScheduleCell | null {
  return pickCell(scheduleCells(), date);
}

export function scheduledRoutine(id: string | null | undefined, now = Date.now()) {
  if (!id?.startsWith("coach-schedule-")) return undefined;
  const cell = scheduleOn(dayKey(now));
  const routine = cell && routineFromSchedule(cell);
  return routine && routine.id === id ? routine : undefined;
}

export function setScheduleCache(days: readonly ScheduleCell[]): void {
  memory = [...days];
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // private mode: Today still sees it until the page closes
  }
}

export function clearScheduleCache(): void {
  memory = [];
  try {
    localStorage.removeItem(KEY);
  } catch {
    // already gone
  }
}

function token(): string {
  const a = readAccount();
  if (!a) throw new AuthError("signedOut", 401);
  return a.token;
}

export interface ScheduleMonth {
  scope: string;
  days: ScheduleCell[];
}

export const loadScheduleMonth = async (scope: string, year: number, month: number, access?: string) =>
  api<ScheduleMonth>(
    `/api/coach/?schedule=${encodeURIComponent(scope)}&year=${year}&month=${month}${access ? `&access=${encodeURIComponent(access)}` : ""}`,
    { token: token() },
  );

export const setScheduleDay = (body: { scope: string; date: string; kind: ScheduleKind; name?: string; code?: string; access?: string }) =>
  api<{ day: ScheduleCell }>("/api/coach/", { token: token(), body: { action: "scheduleDay", ...body } }).then((r) => r.day);

export const clearScheduleDay = (scope: string, date: string, access?: string) =>
  api<{ ok: true }>("/api/coach/", { token: token(), body: { action: "scheduleClear", scope, date, access } });

export interface CalendarAccess {
  id: string;
  own: boolean;
  scope: string;
  name: string | null;
}
export const listCalendarAccess = async () =>
  (await api<{ access: CalendarAccess[] }>("/api/coach/?calendarAccess=1", { token: token() })).access;

export const inviteCalendarAssistant = async (scope: string) =>
  (await api<{ code: string }>("/api/coach/", { token: token(), body: { action: "inviteCalendarAssistant", scope } })).code;

export const acceptCalendarInvite = async (code: string) =>
  api("/api/coach/", { token: token(), body: { action: "acceptCalendarInvite", code } });

export const revokeCalendarAccess = async (id: string) =>
  api("/api/coach/", { token: token(), body: { action: "revokeCalendarAccess", id } });

export interface AthleteActivity {
  id: string;
  name: string;
  workouts: number;
  lastAt: number | null;
}
export const loadTrainingActivity = async () =>
  (await api<{ athletes: AthleteActivity[] }>("/api/coach/?trainingActivity=1", { token: token() })).athletes;
