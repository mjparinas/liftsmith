import { available, EXERCISE_BY_ID } from "./exercises";
import { restFor, type PlanItem } from "./generator";
import { t as tr } from "./i18n";
import { activeInjuries } from "./injury";
import { target, type Target } from "./progression";
import type { AppEvent, Gym, Profile, Routine, RoutinePart, SetEvent } from "./types";

// Workouts with parts, stage 5 (sessions-with-parts.md): the physio's rehab done beside the lifting in the same
// workout, and cardio after the lifting. Both are parts made of exercises, added to the end of the plan at Start
// (PlanItem.part) and logged like any set, with the part on the set (SetEvent.partId). Nothing here is stored: what
// was done last time is read from the events every time.

const DAY = 86_400_000;

/** Rehab beside the lifting is due again once a day has passed without it (every other day: about 3 times a week). */
export const REHAB_GAP_DAYS = 2;

/** Cardio exercises offered as the cardio part, most common first. Only those the gym can do are shown. */
export const CARDIO_PICKS = [
  "stationary-bike",
  "rowing-machine",
  "treadmill-walk",
  "incline-walk",
  "elliptical",
  "treadmill-run",
  "air-bike",
  "ski-erg",
  "stair-climber",
  "recumbent-bike",
  "jump-rope",
  "brisk-walk",
  "outdoor-run",
  "jog-in-place",
] as const;

/** Minutes the cardio part offers; the first time it's 15 (a finisher after lifting, not a whole session). */
export const CARDIO_MINUTES = [10, 15, 20, 30] as const;
export const CARDIO_FIRST_MIN = 15;
const MAX_CARDIO_CHOICES = 6;

/** The lifter's rehab routine from their physio (the newest one), when they have one with exercises. */
export function rehabRoutine(profile: Pick<Profile, "routines">): Routine | undefined {
  let best: Routine | undefined;
  for (const r of profile.routines ?? []) if (r.rehab && r.items.length && (!best || r.updatedAt > best.updatedAt)) best = r;
  return best;
}

/** When the rehab routine was last done: as a whole workout, or as a part beside the lifting. */
export function lastRehab(events: readonly AppEvent[], routineId: string): number | undefined {
  let last: number | undefined;
  const later = (at: number) => {
    if (last === undefined || at > last) last = at;
  };
  for (const e of events) {
    if (e.type === "sessionStart" && e.routine === routineId) later(e.at);
    else if (e.type === "sessionEnd") for (const p of e.parts ?? []) if (p.kind === "rehab" && p.ref === routineId) later(p.start);
  }
  return last;
}

const dayStart = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export interface RehabDue {
  /** Whether Today switches it on: an active injury, and not done today or yesterday. */
  due: boolean;
  /** Whole days since it was last done (0 today), or undefined when never. */
  days?: number;
}

/** Whether the physio's rehab is due today, so Today switches it on beside the lifting. */
export function rehabDue(events: readonly AppEvent[], routine: Pick<Routine, "id">, now: number): RehabDue {
  const last = lastRehab(events, routine.id);
  const days = last === undefined ? undefined : Math.max(0, Math.round((dayStart(now) - dayStart(last)) / DAY));
  const injured = activeInjuries(events, now).length > 0;
  return { due: injured && (days === undefined || days >= REHAB_GAP_DAYS), ...(days !== undefined ? { days } : {}) };
}

/** The last set of this exercise done in a part of this kind, or undefined. */
function lastInPart(events: readonly AppEvent[], part: "rehab" | "cardio", exerciseId?: string): SetEvent | undefined {
  let last: SetEvent | undefined;
  for (const e of events)
    if (e.type === "set" && e.partId === part && (!exerciseId || e.exerciseId === exerciseId) && (!last || e.at > last.at)) last = e;
  return last;
}

/**
 * The rehab routine's exercises as the workout's rehab part: as the physio wrote them (sets, and the reps and weight
 * done in the last rehab part, else the usual first target), never changed by injury mode. Exercises the gym can't do
 * are left out.
 */
export function rehabItems(routine: Routine, gym: Gym, events: readonly AppEvent[], profile: Profile, now: number): PlanItem[] {
  const can = new Set(available(gym.equipment).map((e) => e.id));
  return routine.items.flatMap((i) => {
    const ex = EXERCISE_BY_ID.get(i.exerciseId);
    if (!ex || !can.has(ex.id)) return [];
    const base = target(ex, events, profile, gym, now);
    const last = lastInPart(events, "rehab", ex.id);
    const t: Target = last
      ? { ...base, weight: last.targetWeight ?? last.weight, reps: last.targetReps, note: tr("note.rehabAgain") }
      : { ...base, note: tr("note.rehabFirst") };
    return [
      {
        exerciseId: ex.id,
        sets: i.sets,
        restSec: restFor(ex, profile.goal, profile.training),
        focus: ex.primary[0]!,
        target: t,
        part: "rehab" as const,
      },
    ];
  });
}

/** The cardio exercises this gym can do for the cardio part: last time's first, then the common ones. */
export function cardioChoices(gym: Pick<Gym, "equipment">, events: readonly AppEvent[]): string[] {
  const can = new Set(available(gym.equipment).map((e) => e.id));
  const last = lastInPart(events, "cardio")?.exerciseId;
  const ids = [...(last ? [last] : []), ...CARDIO_PICKS].filter((id) => can.has(id) && !!EXERCISE_BY_ID.get(id)?.cardio);
  return [...new Set(ids)].slice(0, MAX_CARDIO_CHOICES);
}

export interface CardioPick {
  exerciseId: string;
  minutes: number;
}

/**
 * The cardio part before the lifter changes it: the routine's own when it has one the gym can do, else last time's,
 * else the first the gym can do; minutes from the routine, else last time's, else 15.
 */
export function cardioDefault(
  part: Pick<RoutinePart, "exerciseId" | "minutes"> | undefined,
  gym: Pick<Gym, "equipment">,
  events: readonly AppEvent[],
): CardioPick | undefined {
  const choices = cardioChoices(gym, events);
  const can = new Set(available(gym.equipment).map((e) => e.id));
  const own = part?.exerciseId && can.has(part.exerciseId) && EXERCISE_BY_ID.get(part.exerciseId)?.cardio ? part.exerciseId : undefined;
  const exerciseId = own ?? choices[0];
  if (!exerciseId) return undefined;
  const last = lastInPart(events, "cardio", exerciseId);
  const minutes = part?.minutes ?? (last ? Math.max(1, Math.round(last.reps / 60)) : CARDIO_FIRST_MIN);
  return { exerciseId, minutes: clampMinutes(minutes) };
}

export const clampMinutes = (n: number) => Math.min(120, Math.max(1, Math.round(n) || CARDIO_FIRST_MIN));

/** The cardio part as one timed set, logged like any cardio set (time, and distance where it means something). */
export function cardioItem(pick: CardioPick, gym: Gym, events: readonly AppEvent[], profile: Profile, now: number): PlanItem | null {
  const ex = EXERCISE_BY_ID.get(pick.exerciseId);
  if (!ex?.cardio) return null;
  const base = target(ex, events, profile, gym, now);
  return {
    exerciseId: ex.id,
    sets: 1,
    restSec: 0,
    focus: ex.primary[0]!,
    target: { ...base, reps: clampMinutes(pick.minutes) * 60, note: tr("note.cardioPart", { count: clampMinutes(pick.minutes) }) },
    part: "cardio",
  };
}

export interface ExtraOffer {
  /** The physio's rehab routine Today offers beside the lifting, and whether it's due. */
  rehab?: { routine: Routine; due: RehabDue };
  /** The cardio part Today offers, and whether it starts on (a routine with a cardio part). */
  cardio?: CardioPick;
  cardioOn: boolean;
}

/**
 * What Today offers beside the plan: the physio's rehab (not when the whole workout is that rehab already) and a
 * cardio part. The rehab starts on when it's due; cardio starts on only when the day's routine has a cardio part.
 */
export function extraOffer(
  profile: Pick<Profile, "routines">,
  routine: Pick<Routine, "id" | "parts"> | undefined,
  plan: { rehab?: boolean },
  gym: Pick<Gym, "equipment">,
  events: readonly AppEvent[],
  now: number,
): ExtraOffer {
  const rr = plan.rehab ? undefined : rehabRoutine(profile);
  const can = new Set(available(gym.equipment).map((e) => e.id));
  const rehab =
    rr && rr.id !== routine?.id && rr.items.some((i) => can.has(i.exerciseId))
      ? { routine: rr, due: rehabDue(events, rr, now) }
      : undefined;
  const own = routine?.parts?.find((p) => p.kind === "cardio");
  const cardio = cardioDefault(own, gym, events);
  return { ...(rehab ? { rehab } : {}), ...(cardio ? { cardio } : {}), cardioOn: !!own && !!cardio };
}

/** What a cardio part was, for Health Connect's segment and Apple Health's workout activity type. */
export type CardioActivity = "bike" | "row" | "run" | "walk" | "elliptical" | "stairs" | "ski" | "other";

const ACTIVITY: Record<string, CardioActivity> = {
  "stationary-bike": "bike",
  "recumbent-bike": "bike",
  "air-bike": "bike",
  "bike-sprint": "bike",
  "outdoor-cycling": "bike",
  "rowing-machine": "row",
  "rower-intervals": "row",
  "rower-sprint": "row",
  "treadmill-run": "run",
  "treadmill-intervals": "run",
  "treadmill-sprint": "run",
  "incline-treadmill-run": "run",
  "outdoor-run": "run",
  "jog-in-place": "run",
  "treadmill-walk": "walk",
  "incline-walk": "walk",
  "brisk-walk": "walk",
  "backward-treadmill-walk": "walk",
  hiking: "walk",
  rucking: "walk",
  elliptical: "elliptical",
  "elliptical-intervals": "elliptical",
  "elliptical-backward": "elliptical",
  "stair-climber": "stairs",
  "stair-climber-intervals": "stairs",
  "stair-climber-side-step": "stairs",
  "ski-erg": "ski",
  "ski-erg-intervals": "ski",
  "ski-erg-sprint": "ski",
};

export const cardioActivity = (exerciseId: string | undefined): CardioActivity => (exerciseId && ACTIVITY[exerciseId]) || "other";
