import { blockWeek } from "./block";
import { roundLoad, stepLoad } from "./loads";
import type { AppEvent, Exercise, Goal, Gym, Profile, SetEvent } from "./types";

// What weight and reps to suggest for an exercise today.
//
// Double progression on top of the block's RIR target: when every set last time hit its target,
// add a rep; at the top of the rep range, add weight and go back to the bottom. A miss by two or
// more reps on any set drops the weight a step. Post-exercise feedback nudges it one step more.

/** Holds and carries are counted in seconds. */
export const TIMED = new Set(["plank", "side-plank", "superman", "copenhagen-plank", "farmers-carry", "kb-suitcase-carry", "dead-bug"]);

export function repRange(ex: Exercise, goal: Goal): [number, number] {
  if (TIMED.has(ex.id)) return [20, 45];
  if (ex.load === "bodyweight") return ex.compound ? [6, 15] : [10, 20];
  if (!ex.compound) return goal === "strength" ? [8, 12] : [10, 15];
  return goal === "strength" ? [4, 6] : goal === "muscle" ? [6, 10] : [8, 12];
}

export function epley(weight: number, reps: number, rir = 0): number {
  return weight * (1 + (reps + rir) / 30);
}

export function weightFor(e1rm: number, reps: number, rir: number): number {
  return e1rm / (1 + (reps + rir) / 30);
}

export interface Target {
  /** Kilograms (per hand for dumbbells). */
  weight: number;
  reps: number;
  rir: number;
  /** Why it changed, for the small note under the numbers. */
  note: string;
}

/** Sets of one exercise grouped by session, newest first. */
export function sessionsOf(events: readonly AppEvent[], exerciseId: string): SetEvent[][] {
  const by = new Map<string, SetEvent[]>();
  for (const e of events) {
    if (e.type !== "set" || e.exerciseId !== exerciseId) continue;
    const list = by.get(e.sessionId) ?? [];
    list.push(e);
    by.set(e.sessionId, list);
  }
  return [...by.values()].sort((a, b) => b[0].at - a[0].at);
}

function lastFeedback(events: readonly AppEvent[], exerciseId: string, sessionId: string): number {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.type === "feedback" && e.exerciseId === exerciseId && e.sessionId === sessionId) return e.rating;
  }
  return 0;
}

const LEVEL = { new: 0.7, intermediate: 1, advanced: 1.25 } as const;

export function target(ex: Exercise, events: readonly AppEvent[], profile: Profile, gym: Gym, now: number): Target {
  const wk = blockWeek(profile, now);
  const [lo, hi] = repRange(ex, profile.goal);
  const rir = wk.rir;
  const past = sessionsOf(events, ex.id);
  const last = past[0];

  if (ex.load === "bodyweight") {
    if (!last) return { weight: 0, reps: lo, rir, note: "First time: find your level" };
    const best = Math.max(...last.map((s) => s.reps));
    const hit = last.every((s) => s.reps >= s.targetReps);
    const fb = lastFeedback(events, ex.id, last[0].sessionId);
    let reps = hit ? last[0].targetReps + 1 : last[0].targetReps;
    if (fb > 0) reps += 1;
    if (fb < 0) reps = Math.max(lo, reps - 2);
    reps = Math.min(Math.max(lo, reps), Math.max(hi, best + 1));
    if (wk.deload) return { weight: 0, reps: lo, rir, note: "Deload: easy reps" };
    return { weight: 0, reps, rir, note: hit ? "Hit every set last time: one more rep" : "Same as last time" };
  }

  if (!last) {
    const start = ex.start * profile.bodyweight * LEVEL[profile.experience];
    const e1 = epley(start, 8, 2);
    const reps = lo;
    return { weight: roundLoad(weightFor(e1, reps, rir), ex, gym).kg, reps, rir, note: "First time: a cautious start" };
  }

  const lastWeight = Math.max(...last.map((s) => s.weight));
  const lastTarget = last[0].targetReps;
  const allHit = last.every((s) => s.reps >= s.targetReps);
  const bigMiss = last.some((s) => s.reps <= s.targetReps - 2);
  const fb = lastFeedback(events, ex.id, last[0].sessionId);

  if (wk.deload) {
    const w = roundLoad(lastWeight * 0.9, ex, gym).kg;
    return { weight: w, reps: lo, rir, note: "Deload: lighter, fewer sets" };
  }

  let weight = lastWeight;
  let reps = Math.min(hi, Math.max(lo, lastTarget));
  let note = "Same as last time";
  if (bigMiss || fb < 0) {
    weight = stepLoad(lastWeight, -1, ex, gym);
    reps = lo;
    note = fb < 0 ? "Felt too hard: a step lighter" : "Missed reps: a step lighter";
  } else if (allHit && (lastTarget >= hi || fb > 0)) {
    weight = stepLoad(lastWeight, 1, ex, gym);
    reps = lo;
    note = fb > 0 && lastTarget < hi ? "Felt easy: weight up" : "Top of the range: weight up";
  } else if (allHit) {
    reps = Math.min(hi, lastTarget + 1);
    note = "Hit every set: one more rep";
  }
  return { weight: roundLoad(weight, ex, gym).kg, reps, rir, note };
}
