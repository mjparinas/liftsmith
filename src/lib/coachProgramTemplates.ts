// Starter templates for coach season programs (docs/decisions/coach-programs.md): Upper/Lower and Push/Pull/Legs
// with default weekdays. Creates local routines the coach can tweak before saving as a CoachProgram.
import { encodeRoutine } from "./routineShare";
import type { Routine, RoutineItem } from "./types";

/** JS getDay(): 0=Sun … 6=Sat (same as calendar.ts). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TemplateDay {
  name: string;
  items: RoutineItem[];
  weekdays: Weekday[];
}

export interface ProgramTemplate {
  id: "upper-lower" | "ppl";
  title: string;
  about: string;
  weeks: number;
  goal: "strength" | "muscle" | "sport";
  days: TemplateDay[];
}

const sets = (exerciseId: string, n: number): RoutineItem => ({ exerciseId, sets: n });

/** Upper Mon/Thu variants and Lower Tue/Fri — four days, one weekday each. */
export const UPPER_LOWER: ProgramTemplate = {
  id: "upper-lower",
  title: "Upper / Lower",
  about: "Four days a week: upper and lower twice each. Weights come from each athlete's own history.",
  weeks: 12,
  goal: "strength",
  days: [
    {
      name: "Upper A",
      weekdays: [1],
      items: [sets("bench-press", 4), sets("barbell-row", 4), sets("overhead-press", 3), sets("pull-up", 3), sets("skull-crusher", 3)],
    },
    {
      name: "Lower A",
      weekdays: [2],
      items: [sets("back-squat", 4), sets("romanian-deadlift", 3), sets("leg-press", 3), sets("lying-leg-curl", 3), sets("plank", 3)],
    },
    {
      name: "Upper B",
      weekdays: [4],
      items: [
        sets("incline-bench-press", 4),
        sets("db-row", 4),
        sets("lateral-raise", 3),
        sets("lat-pulldown", 3),
        sets("barbell-curl", 3),
      ],
    },
    {
      name: "Lower B",
      weekdays: [5],
      items: [sets("deadlift", 3), sets("front-squat", 3), sets("walking-lunge", 3), sets("hip-thrust", 3), sets("leg-extension", 3)],
    },
  ],
};

/** Push / Pull / Legs six days a week. */
export const PPL: ProgramTemplate = {
  id: "ppl",
  title: "Push / Pull / Legs",
  about: "Six days a week: push, pull and legs, each twice. Weights come from each athlete's own history.",
  weeks: 12,
  goal: "muscle",
  days: [
    {
      name: "Push A",
      weekdays: [1],
      items: [
        sets("bench-press", 4),
        sets("overhead-press", 3),
        sets("incline-bench-press", 3),
        sets("lateral-raise", 3),
        sets("skull-crusher", 3),
      ],
    },
    {
      name: "Pull A",
      weekdays: [2],
      items: [sets("deadlift", 3), sets("barbell-row", 4), sets("pull-up", 3), sets("face-pull", 3), sets("barbell-curl", 3)],
    },
    {
      name: "Legs A",
      weekdays: [3],
      items: [sets("back-squat", 4), sets("romanian-deadlift", 3), sets("leg-press", 3), sets("lying-leg-curl", 3), sets("plank", 3)],
    },
    {
      name: "Push B",
      weekdays: [4],
      items: [sets("overhead-press", 4), sets("bench-press", 3), sets("lateral-raise", 3), sets("skull-crusher", 3), sets("db-curl", 3)],
    },
    {
      name: "Pull B",
      weekdays: [5],
      items: [sets("lat-pulldown", 4), sets("db-row", 4), sets("chin-up", 3), sets("face-pull", 3), sets("barbell-curl", 3)],
    },
    {
      name: "Legs B",
      weekdays: [6],
      items: [sets("front-squat", 4), sets("hip-thrust", 3), sets("walking-lunge", 3), sets("leg-extension", 3), sets("plank", 3)],
    },
  ],
};

export const PROGRAM_TEMPLATES: readonly ProgramTemplate[] = [UPPER_LOWER, PPL];

/**
 * What makes two routines the same program day: the share code a day travels as (name, exercises, sets, parts), plus
 * the coach assignment a routine belongs to, if any, so a client's assigned day is never mixed up with a plain copy.
 */
export function routineKey(r: Routine): string {
  const tie = r.assignedProgram
    ? `|p:${r.assignedProgram.assignId}:${r.assignedProgram.dayIndex}`
    : r.assignedPlan
      ? `|c:${r.assignedPlan.id}`
      : "";
  return encodeRoutine(r) + tie;
}

export interface DayChoice {
  routine: Routine;
  /** Its place in the program (0 is Day 1), or -1 when it isn't picked. */
  at: number;
  /** How many exercises it has, shown when another routine has the same name, so the two can be told apart. */
  exercises?: number;
}

/**
 * The program editor's day chips (coach-programs.md "Picking the days", 2026-11-25): the picked days first, in the order
 * they run, then the rest A to Z. Identical copies (same routineKey) show once, and routines that share a name but
 * differ say how many exercises each has.
 */
export function dayChoices(routines: readonly Routine[], picked: readonly string[]): DayChoice[] {
  const byId = new Map(routines.map((r) => [r.id, r]));
  const seen = new Set<string>();
  const first: Routine[] = [];
  for (const id of picked) {
    const r = byId.get(id);
    if (!r) continue;
    first.push(r);
    seen.add(routineKey(r));
  }
  const rest: Routine[] = [];
  for (const r of routines) {
    if (picked.includes(r.id)) continue;
    const k = routineKey(r);
    if (seen.has(k)) continue;
    seen.add(k);
    rest.push(r);
  }
  rest.sort((a, b) => a.name.localeCompare(b.name) || b.updatedAt - a.updatedAt);
  const all = [...first, ...rest];
  const names = new Map<string, number>();
  for (const r of all) names.set(r.name.trim().toLowerCase(), (names.get(r.name.trim().toLowerCase()) ?? 0) + 1);
  return all.map((r) => ({
    routine: r,
    at: picked.indexOf(r.id),
    exercises: (names.get(r.name.trim().toLowerCase()) ?? 0) > 1 ? r.items.length : undefined,
  }));
}

/**
 * Routines that are identical copies of another one (same routineKey), to tidy up. In each group it keeps a picked or
 * protected routine (today's routine, say) if there is one, otherwise the newest; the list is kept newest first.
 */
export function extraCopies(routines: readonly Routine[], keep: readonly string[]): string[] {
  const groups = new Map<string, Routine[]>();
  for (const r of routines) {
    const k = routineKey(r);
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const out: string[] = [];
  for (const g of groups.values()) {
    if (g.length < 2) continue;
    const kept = g.filter((r) => keep.includes(r.id));
    const stay = kept.length ? kept : [g.reduce((a, b) => (b.updatedAt > a.updatedAt ? b : a))];
    for (const r of g) if (!stay.includes(r)) out.push(r.id);
  }
  return out;
}

/**
 * Builds local routines + draft fields from a template. A template day the coach already has as a routine, unchanged,
 * reuses it rather than making another copy (2026-11-25: every tap on a template used to add four or six more).
 */
export function routinesFromTemplate(
  template: ProgramTemplate,
  now: number,
  newId: () => string,
  existing: readonly Routine[] = [],
): { routines: Routine[]; routineIds: string[]; weekdays: number[][] } {
  const routines: Routine[] = [];
  const routineIds: string[] = [];
  const weekdays: number[][] = [];
  const have = new Map<string, string>();
  for (const r of existing) if (!have.has(routineKey(r))) have.set(routineKey(r), r.id);
  for (const d of template.days) {
    weekdays.push([...d.weekdays]);
    const same = have.get(routineKey({ id: "", name: d.name, items: d.items, createdAt: now, updatedAt: now }));
    if (same) {
      routineIds.push(same);
      continue;
    }
    const id = newId();
    routines.push({
      id,
      name: d.name,
      items: d.items,
      createdAt: now,
      updatedAt: now,
    });
    routineIds.push(id);
  }
  return { routines, routineIds, weekdays };
}

/** Sanity: every template day encodes and weekdays don't overlap. */
export function templateOk(template: ProgramTemplate): boolean {
  const seen = new Set<number>();
  for (const d of template.days) {
    if (!d.items.length || !d.weekdays.length) return false;
    if (!encodeRoutine({ name: d.name, items: d.items }).startsWith("r1~")) return false;
    for (const w of d.weekdays) {
      if (seen.has(w)) return false;
      seen.add(w);
    }
  }
  return true;
}
