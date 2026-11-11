import { dayKey } from "./dashboard";
import { dedupe, type Pr, type SessionSummary } from "./derive";
import { programDayLabel } from "./programs";
import type { AppEvent, Exercise, Muscle, Routine } from "./types";

// Progress › History: the month calendar of past workouts (Melvin, 2026-11-11: "a calendar view of past
// workouts … where we can review what we did"). Pure views over the event log, never stored (AGENTS.md).

export interface YearMonth {
  y: number;
  /** 0 to 11, as in Date. */
  m: number;
}

export const monthOf = (ms: number): YearMonth => {
  const d = new Date(ms);
  return { y: d.getFullYear(), m: d.getMonth() };
};

/** The month `by` months from `ym` (negative goes back), rolling over the year. */
export function shiftMonth(ym: YearMonth, by: number): YearMonth {
  const i = ym.y * 12 + ym.m + by;
  return { y: Math.floor(i / 12), m: ((i % 12) + 12) % 12 };
}

/** Months from `a` to `b` (positive when `b` is later). */
export const monthsBetween = (a: YearMonth, b: YearMonth): number => b.y * 12 + b.m - (a.y * 12 + a.m);

export const inMonth = (ms: number, ym: YearMonth): boolean => monthsBetween(monthOf(ms), ym) === 0;

/** The month's workouts, newest first (the order stats.sessions keeps). */
export function monthSessions(sessions: readonly SessionSummary[], ym: YearMonth): SessionSummary[] {
  return sessions.filter((s) => inMonth(s.start, ym));
}

/**
 * The muscles each day's workouts trained (primary muscles of every logged set), keyed by local day.
 * Only sets from workouts in `sessions` count, so a discarded workout leaves no mark.
 */
export function musclesByDay(
  events: readonly AppEvent[],
  sessions: readonly SessionSummary[],
  lookup: (id: string) => Exercise | undefined,
): Map<string, Set<Muscle>> {
  const dayOf = new Map(sessions.map((s) => [s.sessionId, dayKey(s.start)]));
  const out = new Map<string, Set<Muscle>>();
  for (const e of events) {
    if (e.type !== "set") continue;
    const day = dayOf.get(e.sessionId);
    const ex = lookup(e.exerciseId);
    if (!day || !ex) continue;
    const set = out.get(day) ?? new Set<Muscle>();
    for (const m of ex.primary) set.add(m);
    out.set(day, set);
  }
  return out;
}

/** Ids of the sets that set a personal record (the set behind each entry in stats.prs). */
export function prSetIds(events: readonly AppEvent[], prs: readonly Pr[]): Set<string> {
  const keys = new Set(prs.map((p) => `${p.exerciseId}@${p.at}`));
  const out = new Set<string>();
  for (const e of dedupe(events)) {
    if (e.type === "set" && keys.has(`${e.exerciseId}@${e.at}`)) out.add(e.id);
  }
  return out;
}

/**
 * What a past workout was called, from what was recorded when it started: the saved routine's name, or the
 * program and its day ("Classic 5×5 · Workout A", "Push/pull/legs · Pull day"). Null for an adaptive
 * workout, or when the routine or program has since been removed.
 */
export function workoutName(
  start: { program?: { id: string; day: number }; routine?: string },
  routines: readonly Routine[] | undefined,
): string | null {
  if (start.routine) {
    const r = routines?.find((x) => x.id === start.routine);
    if (r) return r.name;
  }
  if (start.program) {
    const p = programDayLabel(start.program.id, start.program.day);
    if (p) return `${p.program} · ${p.day}`;
  }
  return null;
}
