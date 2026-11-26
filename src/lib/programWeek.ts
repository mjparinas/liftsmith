// The coach program builder's week (docs/decisions/coach-programs.md "The program builder", 2026-11-25): a program's
// days laid out on the seven weekdays, rest days included, plus Auto-arrange, which spreads a coach's routines over the
// week and puts rest where the same big muscles would otherwise train two days running. Pure functions, no state.
import { EXERCISE_BY_ID } from "./exercises";
import { encodeRoutine } from "./routineShare";
import { LARGE_MUSCLES, type Muscle, type PhaseKind, type ProgramPhase, type Routine } from "./types";

/** One routine id (or null for rest) per weekday, indexed like JS getDay(): 0 = Sunday … 6 = Saturday. */
export type Week = (string | null)[];

export const emptyWeek = (): Week => [null, null, null, null, null, null, null];

/** The weekdays in the lifter's calendar order (Monday or Sunday first). */
export const weekOrder = (firstDay: 0 | 1): number[] => Array.from({ length: 7 }, (_, i) => (i + firstDay) % 7);

/** The draft fields a week saves as: each routine once, in the order it first runs, with the weekdays it runs on. */
export function draftFromWeek(week: Week, firstDay: 0 | 1): { routineIds: string[]; weekdays: number[][] } {
  const routineIds: string[] = [];
  const weekdays: number[][] = [];
  for (const wd of weekOrder(firstDay)) {
    const id = week[wd];
    if (!id) continue;
    const at = routineIds.indexOf(id);
    if (at >= 0) weekdays[at]!.push(wd);
    else {
      routineIds.push(id);
      weekdays.push([wd]);
    }
  }
  return { routineIds, weekdays };
}

/** The week a draft describes. Days without weekdays (older programs) go on the usual pattern for that many days. */
export function weekFromDraft(routineIds: readonly string[], weekdays: readonly (readonly number[] | undefined)[] | undefined): Week {
  const week = emptyWeek();
  const fallback = PATTERN[Math.min(7, Math.max(1, routineIds.length))] ?? [];
  routineIds.forEach((id, i) => {
    const days = weekdays?.[i]?.length ? weekdays[i]! : fallback[i] !== undefined ? [fallback[i]!] : [];
    for (const wd of days) if (wd >= 0 && wd <= 6 && !week[wd]) week[wd] = id;
  });
  return week;
}

/**
 * A saved program's days as a week of the coach's own routines, when every day is one of them unchanged (same share
 * code); otherwise null, and the editor keeps the saved days until the coach lays out a new week.
 */
export function weekFromProgram(days: readonly { code?: string; weekdays?: number[] }[], routines: readonly Routine[]): Week | null {
  if (!days.length) return null;
  const ids: string[] = [];
  for (const d of days) {
    const r = routines.find((x) => encodeRoutine(x) === d.code);
    if (!r) return null;
    ids.push(r.id);
  }
  return weekFromDraft(
    ids,
    days.map((d) => d.weekdays),
  );
}

/** Training days for 1 to 7 workouts a week, spread so rest falls between them (Monday-based weekdays). */
export const PATTERN: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 0],
};

/** The big muscles a routine trains first (primary muscles that take longer to recover). */
export function bigMuscles(r: Pick<Routine, "items">): Set<Muscle> {
  const out = new Set<Muscle>();
  for (const i of r.items) for (const m of EXERCISE_BY_ID.get(i.exerciseId)?.primary ?? []) if (LARGE_MUSCLES.has(m)) out.add(m);
  return out;
}

const overlap = (a: Set<Muscle>, b: Set<Muscle>): number => [...a].filter((m) => b.has(m)).length;

/** Why a rest day sits where it does, for the line under it. */
export type RestWhy = { kind: "same"; before: string; after: string } | { kind: "after"; before: string };

export interface Arranged {
  week: Week;
  /** Reasons for rest days that sit between two workouts, by weekday. */
  why: Partial<Record<number, RestWhy>>;
}

/**
 * Spreads the routines (in the coach's order, repeated when there are more days than routines) over `days` workouts a
 * week. Each day takes the next routine that shares the fewest big muscles with yesterday's, so legs don't train two
 * days running when another routine could go there instead.
 */
export function autoArrange(routines: readonly Routine[], days: number): Arranged {
  const week = emptyWeek();
  const why: Arranged["why"] = {};
  if (!routines.length) return { week, why };
  const slots = PATTERN[Math.min(7, Math.max(1, Math.round(days)))]!;
  const muscles = new Map(routines.map((r) => [r.id, bigMuscles(r)]));
  // The routines to place, in order, cycling through the list.
  const queue: Routine[] = slots.map((_, i) => routines[i % routines.length]!);
  let prev: { id: string; wd: number } | null = null;
  for (const wd of slots) {
    let pick = 0;
    if (prev && (prev.wd + 1) % 7 === wd) {
      const before = muscles.get(prev.id)!;
      let best = Infinity;
      queue.forEach((r, i) => {
        const score = r.id === prev!.id ? 99 : overlap(before, muscles.get(r.id)!);
        if (score < best) {
          best = score;
          pick = i;
        }
      });
    }
    const [r] = queue.splice(pick, 1);
    week[wd] = r!.id;
    prev = { id: r!.id, wd };
  }
  const name = new Map(routines.map((r) => [r.id, r.name]));
  // Reasons for each rest day that has a workout on both sides of it this week (Monday to Sunday).
  for (let wd = 1; wd <= 7; wd++) {
    const d = wd % 7;
    if (week[d]) continue;
    let b = wd - 1;
    while (b >= 1 && !week[b % 7]) b--;
    let a = wd + 1;
    while (a <= 7 && !week[a % 7]) a++;
    const before = b >= 1 ? week[b % 7] : null;
    const after = a <= 7 ? week[a % 7] : null;
    if (!before) continue;
    if (after && overlap(muscles.get(before)!, muscles.get(after)!) > 0)
      why[d] = { kind: "same", before: name.get(before)!, after: name.get(after)! };
    else if (b === wd - 1) why[d] = { kind: "after", before: name.get(before)! };
  }
  return { week, why };
}

/** How many workouts the week holds. */
export const workoutsIn = (week: Week): number => week.filter(Boolean).length;

/**
 * The month view's cells: every day of the month the program starts in and the next, from the first day of the week
 * the program starts in, with the routine (or rest) for that day and whether it falls inside the program's weeks.
 */
export interface MonthCell {
  /** Local midnight of the day. */
  at: number;
  /** Week of the program, from 1, or 0 before it starts. Past the last week means after it ends. */
  week: number;
  routineId: string | null;
  inside: boolean;
  /** Index of the program's phase this week falls in (0 without phases). */
  phase: number;
}

export function monthCells(
  week: Week,
  start: number,
  weeks: number,
  firstDay: 0 | 1,
  count = 42,
  phases?: readonly Pick<PhaseDraft, "weeks" | "week">[],
): MonthCell[] {
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const back = (s.getDay() - firstDay + 7) % 7;
  const begin = new Date(s.getFullYear(), s.getMonth(), s.getDate() - back);
  // With phases, each program week takes its phase's week; the program ends after the last phase.
  const total = phases && phases.length > 1 ? phases.reduce((n, p) => n + p.weeks, 0) : weeks;
  const phaseOf = (w: number): number => {
    if (!phases || phases.length < 2) return 0;
    let end = 0;
    for (let i = 0; i < phases.length; i++) {
      end += phases[i]!.weeks;
      if (w <= end) return i;
    }
    return phases.length - 1;
  };
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(begin.getFullYear(), begin.getMonth(), begin.getDate() + i);
    const w = Math.floor(i / 7) + 1;
    const inside = w <= total;
    const phase = phaseOf(w);
    const days = phases && phases.length > 1 ? phases[phase]!.week : week;
    return { at: d.getTime(), week: w, routineId: inside ? (days[d.getDay()] ?? null) : null, inside, phase };
  });
}

/** One phase as the builder edits it: a kind, how many weeks, and its week (stage 2, 2026-11-26). */
export interface PhaseDraft {
  kind: PhaseKind;
  weeks: number;
  week: Week;
}

/**
 * What a builder with phases saves: every routine once, in the order it first runs (phase by phase, in calendar
 * order), the first phase's weekdays as the days' own (so older apps and Assign still work), and the phases with
 * their weekdays parallel to the routines when there is more than one.
 */
export function draftFromPhases(
  phases: readonly PhaseDraft[],
  firstDay: 0 | 1,
): { routineIds: string[]; weekdays: number[][]; phases?: ProgramPhase[] } {
  const routineIds: string[] = [];
  for (const p of phases) for (const id of draftFromWeek(p.week, firstDay).routineIds) if (!routineIds.includes(id)) routineIds.push(id);
  const weekdaysIn = (week: Week) => routineIds.map((id) => weekOrder(firstDay).filter((wd) => week[wd] === id));
  const first = phases[0];
  const weekdays = first ? weekdaysIn(first.week) : routineIds.map(() => []);
  if (phases.length < 2) return { routineIds, weekdays };
  return { routineIds, weekdays, phases: phases.map((p) => ({ kind: p.kind, weeks: p.weeks, weekdays: weekdaysIn(p.week) })) };
}

/** The builder's phases from a saved draft: one phase with the program's weeks, or its saved phases. */
export function phasesFromDraft(
  routineIds: readonly string[],
  weekdays: readonly (readonly number[] | undefined)[] | undefined,
  weeks: number,
  phases?: readonly ProgramPhase[],
): PhaseDraft[] {
  if (!phases || phases.length < 2) return [{ kind: "build", weeks, week: weekFromDraft(routineIds, weekdays) }];
  return phases.map((p) => {
    const week = emptyWeek();
    routineIds.forEach((id, i) => {
      for (const wd of p.weekdays[i] ?? []) if (wd >= 0 && wd <= 6 && !week[wd]) week[wd] = id;
    });
    return { kind: p.kind, weeks: p.weeks, week };
  });
}

/** Phases for a saved program when every day is one of the coach's routines unchanged; otherwise null (see weekFromProgram). */
export function phasesFromProgram(
  days: readonly { code?: string; weekdays?: number[] }[],
  phases: readonly ProgramPhase[] | undefined,
  weeks: number,
  routines: readonly Routine[],
): PhaseDraft[] | null {
  if (!days.length) return null;
  const ids: string[] = [];
  for (const d of days) {
    const r = routines.find((x) => encodeRoutine(x) === d.code);
    if (!r) return null;
    ids.push(r.id);
  }
  return phasesFromDraft(
    ids,
    days.map((d) => d.weekdays),
    weeks,
    phases,
  );
}
