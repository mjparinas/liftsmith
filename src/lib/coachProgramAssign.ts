// Client side of season program assigns (server: src/server/coachProgramAssign.ts).
import { api, AuthError, readAccount } from "./auth";
import { decodeRoutine } from "./routineShare";
import type { PlanSource, Routine } from "./types";

export type AssignStatus = "pending" | "active" | "ended";
export type AttendanceState = "done" | "notYet" | "scheduled" | "off";

export interface AssignDay {
  name: string;
  code: string;
  weekdays: number[];
}

export interface ProgramAssign {
  id: string;
  coachId: string;
  clientId: string;
  programId: string;
  teamId: string | null;
  title: string;
  weeks: number;
  days: AssignDay[];
  status: AssignStatus;
  createdAt: number;
  acceptedAt: number | null;
  startedAt: number | null;
  endedAt: number | null;
}

export interface CalendarPerson {
  id: string;
  name: string;
  state: AttendanceState;
}

export interface CalendarDay {
  date: string;
  dayName: string;
  dayIndex: number;
  people: CalendarPerson[];
}

export type AssignScope = { type: "clients"; ids: string[] } | { type: "allClients" } | { type: "team"; teamId: string };

export interface AssignResult {
  assigned: ProgramAssign[];
  skipped: { clientId: string; reason: string }[];
}

export interface CalendarMonth {
  title: string;
  weeks: number;
  days: CalendarDay[];
  assigns: ProgramAssign[];
}

const token = () => readAccount()?.token;
const mustToken = () => {
  const t = token();
  if (!t) throw new AuthError("signedOut", 401);
  return t;
};
const post = <T>(body: Record<string, unknown>) => api<T>("/api/coach/", { token: mustToken(), body });

export const assignProgram = (programId: string, scope: AssignScope, weekdays?: number[][]) =>
  post<AssignResult>({ action: "assignProgram", programId, scope, weekdays });

export const acceptProgramAssign = (id: string) => post<{ assign: ProgramAssign }>({ action: "acceptProgram", id }).then((r) => r.assign);

export const endProgramAssign = (id: string) => post<{ assign: ProgramAssign }>({ action: "endProgram", id }).then((r) => r.assign);

export const endProgramAssigns = (opts: { programId?: string; teamId?: string }) =>
  post<{ ended: number }>({ action: "endPrograms", ...opts });

export async function loadProgramCalendar(opts: {
  programId?: string;
  teamId?: string;
  year: number;
  month: number;
}): Promise<CalendarMonth> {
  const q = new URLSearchParams({ year: String(opts.year), month: String(opts.month) });
  if (opts.teamId) q.set("teamCalendar", opts.teamId);
  else if (opts.programId) q.set("programCalendar", opts.programId);
  return api<CalendarMonth>(`/api/coach/?${q}`, { token: mustToken() });
}

const newId = (): string => {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  const b = new Uint8Array(16);
  c.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
};

/** Saves each assign day as a local routine and builds the standing planSource. */
export function followAssign(
  assign: ProgramAssign,
  now = Date.now(),
): { routines: Routine[]; planSource: Extract<PlanSource, { kind: "coachProgram" }> } {
  const dayIds: string[] = [];
  const weekdays: number[][] = [];
  const routines: Routine[] = assign.days.flatMap((d, dayIndex) => {
    const decoded = decodeRoutine(d.code);
    if (!decoded) return [];
    const id = newId();
    dayIds.push(id);
    weekdays.push([...d.weekdays]);
    return [
      {
        id,
        name: decoded.name || d.name,
        items: decoded.items,
        createdAt: now,
        updatedAt: now,
        ...(decoded.parts ? { parts: decoded.parts } : {}),
        assignedProgram: { assignId: assign.id, coachId: assign.coachId, dayIndex },
      },
    ];
  });
  return {
    routines,
    planSource: {
      kind: "coachProgram",
      assignId: assign.id,
      coachId: assign.coachId,
      programId: assign.programId,
      title: assign.title,
      startedAt: now,
      weeks: assign.weeks,
      dayIds,
      weekdays,
    },
  };
}

/** End instant of a coach program standing plan (startedAt + weeks × 7 days). */
export const coachProgramEndAt = (src: Extract<PlanSource, { kind: "coachProgram" }>) => src.startedAt + src.weeks * 7 * 86_400_000;

/** Which day index runs on this local calendar day, or null if none / outside the window. */
export function coachProgramDayIndex(src: Extract<PlanSource, { kind: "coachProgram" }>, now = Date.now()): number | null {
  if (now < src.startedAt || now >= coachProgramEndAt(src)) return null;
  const wd = new Date(now).getDay();
  for (let i = 0; i < src.weekdays.length; i++) {
    if (src.weekdays[i]?.includes(wd)) return i;
  }
  return null;
}

/** Week number 1…weeks within the standing plan. */
export function coachProgramWeek(src: Extract<PlanSource, { kind: "coachProgram" }>, now = Date.now()): number {
  const ms = Math.max(0, now - src.startedAt);
  return Math.min(src.weeks, Math.floor(ms / (7 * 86_400_000)) + 1);
}
