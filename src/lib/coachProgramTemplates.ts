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
      items: [sets("incline-bench-press", 4), sets("db-row", 4), sets("lateral-raise", 3), sets("lat-pulldown", 3), sets("barbell-curl", 3)],
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
      items: [sets("bench-press", 4), sets("overhead-press", 3), sets("incline-bench-press", 3), sets("lateral-raise", 3), sets("skull-crusher", 3)],
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

/** Builds local routines + draft fields from a template (new ids each call). */
export function routinesFromTemplate(
  template: ProgramTemplate,
  now: number,
  newId: () => string,
): { routines: Routine[]; routineIds: string[]; weekdays: number[][] } {
  const routines: Routine[] = [];
  const routineIds: string[] = [];
  const weekdays: number[][] = [];
  for (const d of template.days) {
    const id = newId();
    routines.push({
      id,
      name: d.name,
      items: d.items,
      createdAt: now,
      updatedAt: now,
    });
    routineIds.push(id);
    weekdays.push([...d.weekdays]);
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
