// Phases of a coach's program (docs/decisions/coach-programs.md "The program builder", stage 2, 2026-11-26): the
// program runs one week at a time, and each phase (Build, Deload, Peak) repeats its own week for a few weeks. Pure
// functions with no app imports, so the server and the app read phases the same way.
import { PHASE_KINDS, type PhaseKind, type ProgramPhase } from "./types";

/** At most four phases, 1 to 16 weeks each, and the program as a whole stays within 16 weeks. */
export const PHASE_LIMITS = { phases: 4, weeks: [1, 16] as const, total: 16 } as const;

const WEEK_MS = 7 * 86_400_000;

function cleanDays(x: unknown): number[] {
  if (!Array.isArray(x)) return [];
  const out: number[] = [];
  for (const v of x) if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 6 && !out.includes(v)) out.push(v);
  return out.sort((a, b) => a - b);
}

/**
 * A program's phases, checked: 2 to 4 of them, each a known kind with 1 to 16 weeks, a weekday list for each of the
 * program's `dayCount` days, at least one workout, and no weekday used twice. Null when there aren't phases (one
 * phase is just the program's week) or when anything is wrong.
 */
export function cleanPhases(raw: unknown, dayCount: number): ProgramPhase[] | null {
  if (!Array.isArray(raw) || raw.length < 2 || raw.length > PHASE_LIMITS.phases) return null;
  const out: ProgramPhase[] = [];
  let total = 0;
  for (const p of raw) {
    if (!p || typeof p !== "object") return null;
    const row = p as { kind?: unknown; weeks?: unknown; weekdays?: unknown };
    if (!(PHASE_KINDS as readonly unknown[]).includes(row.kind)) return null;
    const weeks = row.weeks;
    if (typeof weeks !== "number" || !Number.isInteger(weeks) || weeks < PHASE_LIMITS.weeks[0] || weeks > PHASE_LIMITS.weeks[1])
      return null;
    if (!Array.isArray(row.weekdays) || row.weekdays.length !== dayCount) return null;
    const weekdays = row.weekdays.map(cleanDays);
    const all = weekdays.flat();
    if (!all.length || new Set(all).size !== all.length) return null;
    total += weeks;
    out.push({ kind: row.kind as PhaseKind, weeks, weekdays });
  }
  return total <= PHASE_LIMITS.total ? out : null;
}

/** Weeks in a program with phases. */
export const phaseWeeks = (phases: readonly Pick<ProgramPhase, "weeks">[]) => phases.reduce((n, p) => n + p.weeks, 0);

/**
 * Where a program that started at `startedAt` is on `now`: its phase (or the program's one week when it has none), the
 * week inside that phase, and the weekdays each day runs this week. Past the end it stays on the last week.
 */
export function phaseAt(
  src: { startedAt: number; weeks: number; weekdays: number[][]; phases?: readonly ProgramPhase[] },
  now: number,
): { index: number; kind: PhaseKind; week: number; weeks: number; weekdays: number[][] } {
  const at = Math.min(src.weeks, Math.floor(Math.max(0, now - src.startedAt) / WEEK_MS) + 1);
  const phases = src.phases?.length ? src.phases : [{ kind: "build" as const, weeks: src.weeks, weekdays: src.weekdays }];
  let first = 1;
  for (let i = 0; i < phases.length; i++) {
    const p = phases[i]!;
    if (at < first + p.weeks || i === phases.length - 1)
      return { index: i, kind: p.kind, week: Math.max(1, at - first + 1), weeks: p.weeks, weekdays: p.weekdays };
    first += p.weeks;
  }
  return { index: 0, kind: "build", week: at, weeks: src.weeks, weekdays: src.weekdays };
}
