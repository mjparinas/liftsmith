// Client side of season program assigns (server: src/server/coachProgramAssign.ts).
import { api, AuthError, readAccount } from "./auth";
import { phaseAt } from "./programPhases";
import { decodeRoutine } from "./routineShare";
import type { PlanSource, ProgramPhase, Routine } from "./types";

export type AssignStatus = "pending" | "active" | "ended";
export type AttendanceState = "done" | "notYet" | "scheduled" | "off";

export interface AssignDay {
  name: string;
  code: string;
  weekdays: number[];
}

export interface ProgramAssign {
  id: string;
  /** The program's phases, when it has more than one week laid out (weekdays parallel to days). */
  phases?: ProgramPhase[];
  coachId: string;
  clientId: string;
  programId: string;
  teamId: string | null;
  title: string;
  weeks: number;
  days: AssignDay[];
  /** Days the coach changed for this client only (indexes into days). */
  tweaked?: number[];
  /** Last change from the coach; older servers leave it out. */
  updatedAt?: number;
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

/** The coach changes one day for this client only, or with null puts the program's day back. */
export const tweakProgramDay = (id: string, day: number, routine: { name: string; code: string } | null) =>
  post<{ assign: ProgramAssign }>({ action: "tweakProgramDay", id, day, code: routine?.code ?? null, name: routine?.name }).then(
    (r) => r.assign,
  );

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

/**
 * Saves each assign day as a local routine and builds the standing planSource. `reuse` maps a day index to the id of
 * the routine that already holds it, so catching up with a coach's change keeps the same routines (and their history).
 */
export function followAssign(
  assign: ProgramAssign,
  now = Date.now(),
  reuse?: ReadonlyMap<number, string>,
  startedAt = now,
): { routines: Routine[]; planSource: Extract<PlanSource, { kind: "coachProgram" }> } {
  const dayIds: string[] = [];
  const weekdays: number[][] = [];
  const kept: number[] = [];
  const routines: Routine[] = assign.days.flatMap((d, dayIndex) => {
    const decoded = decodeRoutine(d.code);
    if (!decoded) return [];
    const id = reuse?.get(dayIndex) ?? newId();
    dayIds.push(id);
    kept.push(dayIndex);
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
      startedAt,
      weeks: assign.weeks,
      dayIds,
      weekdays,
      // Phase weekdays stay parallel to dayIds, skipping any day this app couldn't read.
      ...(assign.phases?.length
        ? { phases: assign.phases.map((p) => ({ ...p, weekdays: kept.map((i) => [...(p.weekdays[i] ?? [])]) })) }
        : {}),
      ...(assign.updatedAt ? { syncedAt: assign.updatedAt } : {}),
    },
  };
}

/**
 * Catches a followed program up with the coach (stage 3, 2026-11-26): when the assign changed since these days were
 * saved, its routines are rebuilt from it in place (same ids, so history stays) and the plan keeps its start day.
 * Null when there's nothing to do.
 */
export function catchUpAssign(
  routines: readonly Routine[],
  src: PlanSource | undefined,
  assign: ProgramAssign | undefined,
  now = Date.now(),
): { routines: Routine[]; planSource: Extract<PlanSource, { kind: "coachProgram" }> } | null {
  if (src?.kind !== "coachProgram" || !assign || assign.id !== src.assignId || assign.status !== "active") return null;
  if (!assign.updatedAt || assign.updatedAt <= (src.syncedAt ?? 0)) return null;
  const reuse = new Map<number, string>();
  const created = new Map<string, number>();
  for (const r of routines)
    if (r.assignedProgram?.assignId === assign.id) {
      reuse.set(r.assignedProgram.dayIndex, r.id);
      created.set(r.id, r.createdAt);
    }
  const next = followAssign(assign, now, reuse, src.startedAt);
  const fresh = next.routines.map((r) => ({ ...r, createdAt: created.get(r.id) ?? now }));
  const ids = new Set(fresh.map((r) => r.id));
  const others = routines.filter((r) => r.assignedProgram?.assignId !== assign.id && !ids.has(r.id));
  return { routines: [...fresh, ...others], planSource: next.planSource };
}

type CoachSource = Extract<PlanSource, { kind: "coachProgram" }>;

/** Where a standing coach program is this week: its phase (or the one week), the week inside it, and the weekdays. */
export const coachProgramPhase = (src: Pick<CoachSource, "startedAt" | "weeks" | "weekdays" | "phases">, now = Date.now()) =>
  phaseAt(src, now);

/** End instant of a coach program standing plan (startedAt + weeks × 7 days). */
export const coachProgramEndAt = (src: Extract<PlanSource, { kind: "coachProgram" }>) => src.startedAt + src.weeks * 7 * 86_400_000;

/** Which day index runs on this local calendar day, or null if none / outside the window. */
export function coachProgramDayIndex(src: Extract<PlanSource, { kind: "coachProgram" }>, now = Date.now()): number | null {
  if (now < src.startedAt || now >= coachProgramEndAt(src)) return null;
  const wd = new Date(now).getDay();
  const { weekdays } = coachProgramPhase(src, now);
  for (let i = 0; i < weekdays.length; i++) {
    if (weekdays[i]?.includes(wd)) return i;
  }
  return null;
}

/** Week number 1…weeks within the standing plan. */
export function coachProgramWeek(src: Extract<PlanSource, { kind: "coachProgram" }>, now = Date.now()): number {
  const ms = Math.max(0, now - src.startedAt);
  return Math.min(src.weeks, Math.floor(ms / (7 * 86_400_000)) + 1);
}

/**
 * The next day of a standing coach program after today (athlete views, stage 4): its day index and local noon of that
 * day, looking up to two weeks ahead. Null when the program has no more days before it ends.
 */
export function coachProgramNext(src: CoachSource, now = Date.now()): { dayIndex: number; at: number } | null {
  const today = new Date(now);
  for (let ahead = 1; ahead <= 14; ahead++) {
    const at = new Date(today.getFullYear(), today.getMonth(), today.getDate() + ahead, 12).getTime();
    if (at >= coachProgramEndAt(src)) return null;
    const dayIndex = coachProgramDayIndex(src, at);
    if (dayIndex !== null) return { dayIndex, at };
  }
  return null;
}
