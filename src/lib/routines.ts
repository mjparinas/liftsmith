import { available, EXERCISE_BY_ID } from "./exercises";
import { planSeconds, restFor, type Plan, type PlanItem } from "./generator";
import { t } from "./i18n";
import { target } from "./progression";
import { stretch } from "./stretches";
import { linksOf, withLinks } from "./superset";
import { BODY_PARTS, type AppEvent, type Gym, type Profile, type Routine, type RoutineItem, type RoutinePart } from "./types";
import { withWarmups } from "./warmup";

// Saved routines (table stakes, Melvin, 2026-11-09): the lifter's own list of exercises and set
// counts, with supersets, to use instead of the adaptive plan on any day. Weights and reps still come
// from progression, so a routine keeps moving forward. Routines live on the profile, so they sync
// with it and go in the backup.

export const MAX_ROUTINES = 50;
export const MAX_ITEMS = 20;
export const NAME_MAX = 40;

export const clampSets = (n: number) => Math.min(10, Math.max(1, Math.round(n) || 1));
/** A physio's prescribed reps or seconds (routine builder, 2026-11-22). */
export const REPS_MAX = 120;
/** A physio's cue, kept short enough to sit under the target. */
export const CUE_MAX = 80;

/** 1 to 120, or undefined when it isn't a number. Out-of-range values clamp. */
export function cleanReps(n: unknown): number | undefined {
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return Math.min(REPS_MAX, Math.max(1, Math.round(n)));
}

/** A cue with control characters removed, trimmed, and cut to CUE_MAX. Undefined when nothing is left. */
export function cleanCue(s: unknown): string | undefined {
  if (typeof s !== "string") return undefined;
  const cue = s
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, CUE_MAX);
  return cue || undefined;
}

/** Times a week, 1 to 7, or undefined. Kept here so a saved routine doesn't depend on the share code. */
function cleanWeek(n: unknown): number | undefined {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 7 ? n : undefined;
}

function cleanAssigned(a: Routine["assignedPlan"]): Routine["assignedPlan"] | undefined {
  if (!a || typeof a.id !== "string" || typeof a.coachId !== "string") return undefined;
  const id = a.id.trim().slice(0, 80);
  const coachId = a.coachId.trim().slice(0, 80);
  if (!id || !coachId) return undefined;
  return { id, coachId };
}
/** The most stretches a routine's warm-up or cool-down holds. */
export const MAX_PART_STRETCHES = 12;

/**
 * Tidies a routine's parts (sessions-with-parts.md, stages 3 and 5): at most one warm-up, one cardio and one
 * cool-down, in that order; a warm-up or cool-down with known stretches of its own kind only, cardio with a known
 * cardio exercise (or none) and 1 to 120 minutes (or none). Undefined when there are none, so a routine without
 * parts stays as it was.
 */
export function cleanParts(parts: readonly RoutinePart[] | undefined): RoutinePart[] | undefined {
  const out: RoutinePart[] = [];
  for (const kind of ["warm", "cardio", "cool"] as const) {
    const p = parts?.find((x) => x.kind === kind);
    if (!p) continue;
    if (kind === "cardio") {
      const id = p.exerciseId && EXERCISE_BY_ID.get(p.exerciseId)?.cardio ? p.exerciseId : undefined;
      const min =
        typeof p.minutes === "number" && Number.isFinite(p.minutes) ? Math.min(120, Math.max(1, Math.round(p.minutes))) : undefined;
      out.push({ kind, ...(id ? { exerciseId: id } : {}), ...(min ? { minutes: min } : {}) });
      continue;
    }
    const ids = [...new Set(p.stretches ?? [])].filter((id) => stretch(id)?.kind === kind).slice(0, MAX_PART_STRETCHES);
    out.push(ids.length ? { kind, stretches: ids } : { kind });
  }
  return out.length ? out : undefined;
}

/**
 * Whether the next workout runs a warm-up and a cool-down, before the lifter flips either on Today: a routine with
 * parts says so itself; otherwise the warm-up follows Settings › Workout and the cool-down part starts off (Done
 * offers a cool-down card instead).
 */
export function partDefaults(
  routine: Pick<Routine, "parts"> | undefined,
  warmFirst: boolean | undefined,
): { warm: boolean; cool: boolean } {
  if (routine?.parts?.length) return { warm: !!routinePart(routine, "warm"), cool: !!routinePart(routine, "cool") };
  return { warm: warmFirst === true, cool: false };
}

/** The routine's warm-up or cool-down part, if it has one. */
export const routinePart = (r: Pick<Routine, "parts"> | undefined, kind: RoutinePart["kind"]) => r?.parts?.find((p) => p.kind === kind);

/** One exercise row: sane sets, and a physio's reps and cue only on a rehab program. */
function tidyItem(i: RoutineItem, rehab: boolean): RoutineItem {
  const reps = rehab ? cleanReps(i.reps) : undefined;
  const cue = rehab ? cleanCue(i.cue) : undefined;
  return {
    exerciseId: i.exerciseId,
    sets: clampSets(i.sets),
    ...(i.group ? { group: i.group } : {}),
    ...(reps ? { reps } : {}),
    ...(cue ? { cue } : {}),
  };
}

/** Tidies a routine: a trimmed name, known exercises only, sane set counts, valid supersets. */
export function cleanRoutine(r: Routine): Routine {
  const rehab = !!r.rehab;
  const kept = r.items
    .filter((i) => EXERCISE_BY_ID.has(i.exerciseId))
    .slice(0, MAX_ITEMS)
    .map((i) => tidyItem(i, rehab));
  const items = withLinks(kept, linksOf(kept));
  const out: Routine = { ...r, name: r.name.trim().slice(0, NAME_MAX) || t("rt.defaultName"), items };
  const parts = cleanParts(r.parts);
  if (parts) out.parts = parts;
  else delete out.parts;
  const assigned = cleanAssigned(r.assignedPlan);
  if (assigned) out.assignedPlan = assigned;
  else delete out.assignedPlan;
  if (!rehab) {
    delete out.rehab;
    delete out.rehabPart;
    delete out.perWeek;
    delete out.rehabPlan;
  } else {
    out.rehab = true;
    if (!r.rehabPart || !(BODY_PARTS as readonly string[]).includes(r.rehabPart)) delete out.rehabPart;
    const week = cleanWeek(r.perWeek);
    if (week) out.perWeek = week;
    else delete out.perWeek;
  }
  return out;
}

/** A routine from a plan or from what was done: exercises, set counts and supersets. */
export function routineFrom(
  items: readonly Pick<PlanItem, "exerciseId" | "sets" | "group">[],
  name: string,
  id: string,
  now: number,
): Routine {
  return cleanRoutine({
    id,
    name,
    items: items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets, ...(i.group ? { group: i.group } : {}) })),
    createdAt: now,
    updatedAt: now,
  });
}

/** The exercises and set counts actually done in a session, in order, with their supersets. */
export function doneItems(events: readonly AppEvent[], sessionId: string): RoutineItem[] {
  const order: string[] = [];
  const count = new Map<string, number>();
  const group = new Map<string, string>();
  for (const e of events) {
    if (e.type !== "set" || e.sessionId !== sessionId) continue;
    if (!count.has(e.exerciseId)) order.push(e.exerciseId);
    count.set(e.exerciseId, (count.get(e.exerciseId) ?? 0) + 1);
    if (e.superset) group.set(e.exerciseId, e.superset);
  }
  return order.map((exerciseId) => ({
    exerciseId,
    sets: count.get(exerciseId)!,
    ...(group.has(exerciseId) ? { group: group.get(exerciseId) } : {}),
  }));
}

/**
 * Today's plan from a routine at this gym: progression targets, warm-ups and supersets. Exercises
 * the gym can't do are left out (`dropped` names them). Null when nothing in it can be done here.
 */
export function planFromRoutine(
  base: Plan,
  routine: Routine,
  events: readonly AppEvent[],
  profile: Profile,
  gym: Gym,
  now: number,
): { plan: Plan; dropped: string[] } | null {
  const can = new Set(available(gym.equipment).map((e) => e.id));
  const kept = routine.items.filter((i) => can.has(i.exerciseId));
  const dropped = routine.items.filter((i) => !can.has(i.exerciseId)).map((i) => i.exerciseId);
  if (!kept.length) return null;
  const plain: PlanItem[] = kept.map((i) => {
    const ex = EXERCISE_BY_ID.get(i.exerciseId)!;
    const base = target(ex, events, profile, gym, now);
    const reps = routine.rehab ? cleanReps(i.reps) : undefined;
    const cue = routine.rehab ? cleanCue(i.cue) : undefined;
    return {
      exerciseId: ex.id,
      sets: i.sets,
      restSec: restFor(ex, profile.goal, profile.training),
      focus: ex.primary[0]!,
      target: { ...base, ...(reps ? { reps } : {}), ...(cue ? { note: cue } : {}) },
    };
  });
  // A superset only holds where both exercises are still here and next to each other.
  const linked = withLinks(
    plain,
    kept.slice(0, -1).map((k, i) => !!k.group && k.group === kept[i + 1]!.group),
  );
  const items = withWarmups(linked, gym, (id) => EXERCISE_BY_ID.get(id)!);
  return {
    plan: { ...base, gymId: gym.id, challenge: false, items, estMinutes: Math.round(planSeconds(items) / 60), routineId: routine.id },
    dropped,
  };
}

/** Adds or replaces a routine (by id), newest first, at most MAX_ROUTINES. */
export function upsertRoutine(list: readonly Routine[], r: Routine, now: number): Routine[] {
  const clean = { ...cleanRoutine(r), updatedAt: now };
  return [clean, ...list.filter((x) => x.id !== r.id)].slice(0, MAX_ROUTINES);
}

/** Moves item i up (-1) or down (+1), keeping supersets whole where they can stay together. */
export function moveItem(items: readonly RoutineItem[], i: number, dir: -1 | 1): RoutineItem[] {
  const j = i + dir;
  if (j < 0 || j >= items.length) return [...items];
  const out = items.map(({ group: _g, ...x }) => x as RoutineItem); // eslint-disable-line @typescript-eslint/no-unused-vars
  [out[i], out[j]] = [out[j]!, out[i]!];
  // Moving breaks the links around the two that swapped; the rest stay.
  const lo = Math.min(i, j);
  const links = linksOf(items).map((on, k) => on && k !== lo - 1 && k !== lo && k !== lo + 1);
  return withLinks(out, links);
}
