import { available, EXERCISE_BY_ID } from "./exercises";
import { planSeconds, restFor, type Plan, type PlanItem } from "./generator";
import { t } from "./i18n";
import { target } from "./progression";
import { linksOf, withLinks } from "./superset";
import type { AppEvent, Gym, Profile, Routine, RoutineItem } from "./types";
import { withWarmups } from "./warmup";

// Saved routines (table stakes, Melvin, 2026-11-09): the lifter's own list of exercises and set
// counts, with supersets, to use instead of the adaptive plan on any day. Weights and reps still come
// from progression, so a routine keeps moving forward. Routines live on the profile, so they sync
// with it and go in the backup.

export const MAX_ROUTINES = 50;
export const MAX_ITEMS = 20;
export const NAME_MAX = 40;

const clampSets = (n: number) => Math.min(10, Math.max(1, Math.round(n) || 1));

/** Tidies a routine: a trimmed name, known exercises only, sane set counts, valid supersets. */
export function cleanRoutine(r: Routine): Routine {
  const kept = r.items.filter((i) => EXERCISE_BY_ID.has(i.exerciseId)).slice(0, MAX_ITEMS);
  const items = withLinks(
    kept.map((i) => ({ ...i, sets: clampSets(i.sets) })),
    linksOf(kept),
  );
  return { ...r, name: r.name.trim().slice(0, NAME_MAX) || t("rt.defaultName"), items };
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
    return {
      exerciseId: ex.id,
      sets: i.sets,
      restSec: restFor(ex, profile.goal, profile.training),
      focus: ex.primary[0],
      target: target(ex, events, profile, gym, now),
    };
  });
  // A superset only holds where both exercises are still here and next to each other.
  const linked = withLinks(
    plain,
    kept.slice(0, -1).map((k, i) => !!k.group && k.group === kept[i + 1].group),
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
  [out[i], out[j]] = [out[j], out[i]];
  // Moving breaks the links around the two that swapped; the rest stay.
  const lo = Math.min(i, j);
  const links = linksOf(items).map((on, k) => on && k !== lo - 1 && k !== lo && k !== lo + 1);
  return withLinks(out, links);
}
