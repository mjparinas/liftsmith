import type { PartKind, StretchEvent } from "./types";

// Workouts with parts (Melvin, 2026-11-13; docs/decisions/sessions-with-parts.md). A workout is its sessionId;
// its parts are read from the events every time, never stored, so older data needs no migration:
// - a workout with no `parts` on its sessionEnd is one lifting part;
// - a stretch logged with a sessionId belongs to that workout;
// - an older stretch, or a warm-up done before Start, joins the workout it was done next to by time
//   (a warm-up that ended up to 30 minutes before the start, a cool-down that started up to an hour after the end),
//   and otherwise stands alone (a rest-day or library stretch).

export const WARM_BEFORE_MS = 30 * 60_000;
export const COOL_AFTER_MS = 60 * 60_000;
/** A warm-up logged a little after Start (the clocks of two devices, a slow tap) still counts as before it. */
const WARM_GRACE_MS = 5 * 60_000;

export interface WorkoutSpan {
  sessionId: string;
  start: number;
  seconds: number;
}

export interface StretchParts {
  warm: StretchEvent[];
  cool: StretchEvent[];
}

export interface JoinedStretches {
  bySession: Map<string, StretchParts>;
  /** Stretches done on their own, oldest first. */
  loose: StretchEvent[];
}

export interface PartView {
  kind: PartKind;
  seconds: number;
  /** Stretch ids done in a warm-up or cool-down part. */
  stretchIds?: string[];
}

const isWarm = (s: StretchEvent) => s.moment === "warm";
const endOf = (w: WorkoutSpan) => w.start + w.seconds * 1000;

/** Ties every stretch to the workout it was done with, or leaves it loose. */
export function joinStretches(stretches: readonly StretchEvent[], workouts: readonly WorkoutSpan[]): JoinedStretches {
  const ids = new Set(workouts.map((w) => w.sessionId));
  const byStart = [...workouts].sort((a, b) => a.start - b.start);
  const bySession = new Map<string, StretchParts>();
  const loose: StretchEvent[] = [];
  const add = (id: string, s: StretchEvent) => {
    const parts = bySession.get(id) ?? { warm: [], cool: [] };
    (isWarm(s) ? parts.warm : parts.cool).push(s);
    bySession.set(id, parts);
  };
  for (const s of [...stretches].sort((a, b) => a.at - b.at)) {
    if (s.sessionId && ids.has(s.sessionId)) {
      add(s.sessionId, s);
      continue;
    }
    let home: WorkoutSpan | undefined;
    if (isWarm(s)) {
      // The first workout that starts after the warm-up ended (or just before, within the grace).
      home = byStart.find((w) => s.at <= w.start + WARM_GRACE_MS && w.start - s.at <= WARM_BEFORE_MS);
    } else if (s.moment === "cool") {
      const began = s.at - s.seconds * 1000;
      // The last workout that ended before the cool-down began, within the hour.
      for (const w of byStart) if (endOf(w) <= began + WARM_GRACE_MS && began - endOf(w) <= COOL_AFTER_MS) home = w;
    }
    if (home) add(home.sessionId, s);
    else loose.push(s);
  }
  return { bySession, loose };
}

const sum = (list: readonly StretchEvent[]) => list.reduce((a, s) => a + s.seconds, 0);
const idsOf = (list: readonly StretchEvent[]) => list.flatMap((s) => s.ids);

/** A workout's parts in order: the warm-up, the lifting, the cool-down. Parts with nothing in them are left out. */
export function partsOf(workout: WorkoutSpan, stretches: StretchParts | undefined): PartView[] {
  const parts: PartView[] = [];
  if (stretches?.warm.length) parts.push({ kind: "warm", seconds: sum(stretches.warm), stretchIds: idsOf(stretches.warm) });
  parts.push({ kind: "lift", seconds: workout.seconds });
  if (stretches?.cool.length) parts.push({ kind: "cool", seconds: sum(stretches.cool), stretchIds: idsOf(stretches.cool) });
  return parts;
}

/** The workout a cool-down being logged now belongs to: the latest one that ended within the hour. */
export function coolDownHome(workouts: readonly WorkoutSpan[], now: number, seconds: number): string | undefined {
  const began = now - seconds * 1000;
  let best: WorkoutSpan | undefined;
  for (const w of workouts) {
    const gap = began - endOf(w);
    if (gap >= -WARM_GRACE_MS && gap <= COOL_AFTER_MS && (!best || endOf(w) > endOf(best))) best = w;
  }
  return best?.sessionId;
}
