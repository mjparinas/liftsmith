import { EXERCISE_BY_ID } from "./exercises";
import type { AppEvent, Exercise, SetEvent } from "./types";

// Starting lighter after a break (competitor audit, Melvin 2026-11-09; StrongLifts does this and
// lifters praise it). When the muscles an exercise trains haven't been worked for BREAK_DAYS or more,
// the first session back is about 10% lighter for each week missed (at most 30%), and the next two
// sessions close the gap a third at a time. Derived from events every time, never stored.

const DAY = 86400_000;
/** Days without training a muscle that count as a break. */
export const BREAK_DAYS = 10;
/** Share taken off per week missed, and the most taken off. */
export const CUT_PER_WEEK = 0.1;
export const MAX_CUT = 0.3;
/** Sessions to build back: the first back is the full cut, then two-thirds, then a third. */
export const RAMP_SESSIONS = 3;

export interface Layoff {
  /** Whole weeks away (at least 1). */
  weeks: number;
  /** Share taken off on the first session back (0.1 to 0.3). */
  cut: number;
  /** Sessions of this exercise already done since coming back (0 = this is the first). */
  done: number;
  /** Heaviest working weight of this exercise before the break, kg (per implement). */
  before: number;
  /** Share to take off today: the cut, shrinking a third each session back. */
  today: number;
}

function sharesMuscle(a: Exercise, b: Exercise | undefined): boolean {
  return !!b && b.primary.some((m) => a.primary.includes(m));
}

/**
 * The break this exercise is coming back from, or null when there is none (or it's over). A break is
 * a gap of BREAK_DAYS+ between sets for any exercise sharing a primary muscle, ending in the last
 * three weeks. Only sessions of this exercise from before the break set the weight to come back to.
 */
export function layoff(ex: Exercise, events: readonly AppEvent[], now: number): Layoff | null {
  if (ex.load === "bodyweight") return null;
  const muscle: number[] = [];
  const own: SetEvent[] = [];
  for (const e of events) {
    if (e.type !== "set" || e.at > now) continue;
    if (e.exerciseId === ex.id) own.push(e);
    if (e.exerciseId === ex.id || sharesMuscle(ex, EXERCISE_BY_ID.get(e.exerciseId))) muscle.push(e.at);
  }
  if (!own.length) return null;
  muscle.sort((a, b) => b - a);
  // The most recent gap, counting the one up to now.
  let back = now;
  let away = now - muscle[0];
  if (away < BREAK_DAYS * DAY) {
    away = 0;
    for (let i = 0; i + 1 < muscle.length; i++) {
      if (muscle[i] - muscle[i + 1] >= BREAK_DAYS * DAY) {
        back = muscle[i];
        away = muscle[i] - muscle[i + 1];
        break;
      }
    }
    if (!away || now - back > 21 * DAY) return null;
  }
  const breakStart = back - away;
  const before = own.filter((s) => s.at <= breakStart && !s.injuryPct);
  if (!before.length) return null;
  const lastBefore = Math.max(...before.map((s) => s.at));
  const prev = before.filter((s) => s.sessionId === before.find((x) => x.at === lastBefore)!.sessionId);
  const sessionsSince = new Set(own.filter((s) => s.at >= back && back < now).map((s) => s.sessionId)).size;
  if (sessionsSince >= RAMP_SESSIONS) return null;
  const weeks = Math.max(1, Math.floor(away / (7 * DAY)));
  const cut = Math.min(MAX_CUT, CUT_PER_WEEK * weeks);
  return { weeks, cut, done: sessionsSince, before: Math.max(...prev.map((s) => s.weight)), today: cut * (1 - sessionsSince / RAMP_SESSIONS) };
}
