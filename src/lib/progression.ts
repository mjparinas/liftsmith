import { blockWeek } from "./block";
import { EXERCISE_BY_ID } from "./exercises";
import { roundLoad, stepLoad } from "./loads";
import type { AppEvent, Exercise, Goal, Gym, Profile, SetEvent, TrainingPrefs } from "./types";

// What weight and reps to suggest for an exercise today.
//
// Double progression on top of the block's RIR target: when every set last time hit its target,
// add a rep; at the top of the rep range, add weight and go back to the bottom. A miss by two or
// more reps on any set drops the weight a step. Post-exercise feedback nudges it one step more.

/** Holds and carries are counted in seconds. */
export const TIMED = new Set(["plank", "side-plank", "superman", "copenhagen-plank", "farmers-carry", "kb-suitcase-carry", "dead-bug"]);

/**
 * The rep range for double progression. The lifter's own range for this exercise wins, then their
 * range for compound or isolation lifts (loaded exercises only: bodyweight work keeps adding reps),
 * then the default for their goal. Holds stay in seconds and ignore both.
 */
export function repRange(ex: Exercise, goal: Goal, training?: TrainingPrefs): [number, number] {
  if (TIMED.has(ex.id)) return [20, 45];
  const own = training?.exercises?.[ex.id]?.reps;
  if (own) return own;
  const kind = ex.compound ? training?.reps?.compound : training?.reps?.isolation;
  if (kind && ex.load !== "bodyweight") return kind;
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

/**
 * Reps-left ratings on last session's sets, against what the plan aimed for: two or more reps
 * easier on average counts as "too easy", one or more harder (closer to failure) as "too hard".
 */
export function effortSignal(events: readonly AppEvent[], sets: readonly SetEvent[]): number {
  const ids = new Map(sets.map((s) => [s.id, s.rir]));
  const diffs: number[] = [];
  for (const e of events) if (e.type === "effort" && ids.has(e.setId)) diffs.push(e.rir - ids.get(e.setId)!);
  if (!diffs.length) return 0;
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  return mean >= 2 ? 1 : mean <= -1 ? -1 : 0;
}

function lastFeedback(events: readonly AppEvent[], exerciseId: string, sessionId: string): number {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.type === "feedback" && e.exerciseId === exerciseId && e.sessionId === sessionId) return e.rating;
  }
  return 0;
}

// ---- First-session starting weights (Melvin, 2026-11-09: a 145 lb "experienced" lifter was offered
// a 175 lb squat). An exercise's `start` is a share of body weight the lifter can do for about 10
// reps; that gives an estimated one-rep max, scaled down by experience, sex and age, and the first
// session aims two reps further from failure than the block asks. Known maxes from setup replace the
// estimate for that lift and its close relatives. The first logged session then recalibrates.

/** Share of the table estimate by experience. Conservative: self-reported experience runs high. */
export const LEVEL = { new: 0.55, intermediate: 0.8, advanced: 1 } as const;
/** Extra reps in reserve for a first session. */
export const FIRST_RIR = 2;
/** Lifts that can be entered in setup, by the movement pattern they stand in for. */
export const KNOWN_LIFTS = { squat: "back-squat", hpush: "bench-press", hinge: "deadlift", vpush: "overhead-press" } as const;

const UPPER = new Set(["chest", "frontDelts", "sideDelts", "rearDelts", "biceps", "triceps", "forearms", "lats", "upperBack", "traps"]);

/** Strength relative to the table, by sex: unknown sits between the two. */
export function sexFactor(ex: Exercise, sex: Profile["sex"]): number {
  const upper = ex.primary.some((m) => UPPER.has(m));
  if (sex === "male") return 1;
  if (sex === "female") return upper ? 0.6 : 0.75;
  return upper ? 0.8 : 0.88;
}

export function ageFactor(birthYear: number | undefined, now: number): number {
  if (!birthYear) return 1;
  const age = new Date(now).getFullYear() - birthYear;
  if (age < 18) return 0.8;
  if (age < 40) return 1;
  if (age < 50) return 0.92;
  if (age < 60) return 0.84;
  if (age < 70) return 0.75;
  return 0.65;
}

/** Estimated one-rep max (kg, per hand for dumbbells) for a lift the lifter has never logged. */
export function startE1rm(ex: Exercise, profile: Profile, now: number): number {
  const ref = KNOWN_LIFTS[ex.pattern as keyof typeof KNOWN_LIFTS];
  const known = ref ? profile.knownMaxes?.[ref] : undefined;
  if (known && known > 0) {
    if (ex.id === ref) return known;
    const refEx = EXERCISE_BY_ID.get(ref);
    // A relative of an entered lift (front squat from back squat, dumbbell press from bench):
    // scale by the two `start` shares, with a margin because the ratio is rough.
    if (refEx && refEx.start > 0) return known * (ex.start / refEx.start) * 0.85;
  }
  const tenRm = ex.start * profile.bodyweight;
  return epley(tenRm, 10) * LEVEL[profile.experience] * sexFactor(ex, profile.sex) * ageFactor(profile.birthYear, now);
}

export function target(ex: Exercise, events: readonly AppEvent[], profile: Profile, gym: Gym, now: number): Target {
  const wk = blockWeek(profile, now);
  const [lo, hi] = repRange(ex, profile.goal, profile.training);
  const rir = wk.rir;
  // Sessions done lighter for an injury don't count: the plan picks up from before it.
  const past = sessionsOf(events, ex.id).filter((ss) => !ss.every((x) => x.injuryPct));
  const last = past[0];

  if (ex.load === "bodyweight") {
    if (!last) return { weight: 0, reps: lo, rir, note: "First time: find your level" };
    const best = Math.max(...last.map((s) => s.reps));
    const hit = last.every((s) => s.reps >= s.targetReps);
    const fb = lastFeedback(events, ex.id, last[0].sessionId) || effortSignal(events, last);
    let reps = hit ? last[0].targetReps + 1 : last[0].targetReps;
    if (fb > 0) reps += 1;
    if (fb < 0) reps = Math.max(lo, reps - 2);
    reps = Math.min(Math.max(lo, reps), Math.max(hi, best + 1));
    if (wk.deload) return { weight: 0, reps: lo, rir, note: "Deload: easy reps" };
    return { weight: 0, reps, rir, note: hit ? "Hit every set last time: one more rep" : "A set came up short last time: same again until they all hit" };
  }

  if (!last) {
    const e1 = startE1rm(ex, profile, now);
    const reps = lo;
    const known = !!profile.knownMaxes?.[KNOWN_LIFTS[ex.pattern as keyof typeof KNOWN_LIFTS]];
    return { weight: roundLoad(weightFor(e1, reps, rir + FIRST_RIR), ex, gym).kg, reps, rir, note: known ? "First time: from the numbers you entered" : "First time: a cautious start, adjust if it's light" };
  }

  const lastWeight = Math.max(...last.map((s) => s.weight));
  const lastTarget = last[0].targetReps;
  const allHit = last.every((s) => s.reps >= s.targetReps);
  const bigMiss = last.some((s) => s.reps <= s.targetReps - 2);
  const fb = lastFeedback(events, ex.id, last[0].sessionId) || effortSignal(events, last);

  // After the first session, if it showed the cautious start was light (felt too easy, two or more
  // reps over target, or the lifter raised the weight), jump to what the logged sets show instead of
  // one step at a time. Capped at +25% to stay safe.
  const light = fb > 0 || last.some((s) => s.reps >= s.targetReps + 2 || (s.targetWeight !== undefined && s.weight > s.targetWeight + 1e-6));
  if (past.length === 1 && light && !wk.deload && !bigMiss && fb >= 0) {
    // The first session aimed FIRST_RIR further from failure: "too easy" means that margin was real.
    const extra = fb > 0 ? FIRST_RIR : 0;
    const shown = Math.max(...last.map((s) => epley(s.weight, s.reps, s.rir + extra)));
    const w = roundLoad(Math.min(weightFor(shown, lo, rir), lastWeight * 1.25), ex, gym).kg;
    if (w > stepLoad(lastWeight, 1, ex, gym) + 1e-6) return { weight: w, reps: lo, rir, note: "Calibrated from your first session" };
  }

  if (wk.deload) {
    const w = roundLoad(lastWeight * 0.9, ex, gym).kg;
    return { weight: w, reps: lo, rir, note: "Deload week: 10% lighter so you recover" };
  }

  let weight = lastWeight;
  let reps = Math.min(hi, Math.max(lo, lastTarget));
  let note = "A set came up short last time: same again until they all hit";
  if (bigMiss || fb < 0) {
    weight = stepLoad(lastWeight, -1, ex, gym);
    reps = lo;
    note = fb < 0 ? "You said it felt too hard: a step lighter" : "Missed 2+ reps last time: a step lighter";
  } else if (allHit && (lastTarget >= hi || fb > 0)) {
    weight = stepLoad(lastWeight, 1, ex, gym);
    reps = lo;
    note = fb > 0 && lastTarget < hi ? "You said it felt easy: weight up" : "Hit the top of your rep range: weight up";
  } else if (allHit) {
    reps = Math.min(hi, lastTarget + 1);
    note = "Hit every set last time: one more rep";
  }
  return { weight: roundLoad(weight, ex, gym).kg, reps, rir, note };
}
