// A friend's posted workout opened in full (Friends gap list 2, item 3; docs/decisions/friends.md): every set, the
// new bests, and how each exercise compares with the reader's own last time on it, from the reader's own log.
import { estimate } from "./onerm";
import type { PostExercise } from "./socialTypes";
import type { AppEvent } from "./types";

/** The reader's best set from the last workout they did this exercise in, or null when they never have. */
export interface LastTime {
  at: number;
  w: number;
  r: number;
}

export function lastTimes(events: readonly AppEvent[], ids: readonly string[]): Map<string, LastTime> {
  const want = new Set(ids);
  // The most recent workout per exercise, then the best set in it.
  const latest = new Map<string, { session: string; at: number }>();
  for (const e of events) {
    if (e.type !== "set" || !want.has(e.exerciseId)) continue;
    const had = latest.get(e.exerciseId);
    if (!had || e.at > had.at) latest.set(e.exerciseId, { session: e.sessionId, at: e.at });
  }
  const out = new Map<string, LastTime & { score: number }>();
  for (const e of events) {
    if (e.type !== "set" || latest.get(e.exerciseId)?.session !== e.sessionId) continue;
    const score = e.weight > 0 ? estimate(e.weight, e.reps) : e.reps;
    const had = out.get(e.exerciseId);
    if (!had || score > had.score) out.set(e.exerciseId, { at: e.at, w: e.weight, r: e.reps, score });
  }
  return new Map([...out].map(([id, { at, w, r }]) => [id, { at, w, r }]));
}

/**
 * How the friend's best set compares with the reader's last time, as a whole percentage of estimated one-rep
 * max (positive: the friend's is higher), or null when either has no weight to compare.
 */
export function compareBest(e: Pick<PostExercise, "w" | "r">, mine: LastTime | undefined): number | null {
  if (!mine || !e.w || e.w <= 0 || mine.w <= 0) return null;
  return Math.round((estimate(e.w, e.r) / estimate(mine.w, mine.r) - 1) * 100);
}
