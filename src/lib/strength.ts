import { EXERCISE_BY_ID } from "./exercises";
import { t } from "./i18n";
import { estimate, oneRm } from "./onerm";
import { LARGE_MUSCLES, MUSCLES, type AppEvent, type Exercise, type Muscle, type Profile } from "./types";

// Strength score and "strength twins". Each exercise's current estimated one-rep max (onerm.ts) is compared
// with what a typical intermediate lifter of the same body weight manages (Exercise.start is that
// lifter's working load as a share of body weight), optionally adjusted for age and sex. It's an
// estimate from typical standards, not a ranking of real users: that needs accounts and sync, and the
// copy in the app says so.

const DAY = 86400_000;
/** Only lifts from the last 6 months count, so the score shows current strength. */
export const WINDOW_DAYS = 180;

export type AgeSex = { birthYear?: number; sex?: "male" | "female" };

/**
 * Age coefficient: multiplies a lift to compare it with a lifter in their prime (23 to 40). Rounded from
 * the shape of published masters coefficients: small for juniors, about 1.2% a year after 40, steeper
 * after 60.
 */
export function ageFactor(age: number | null): number {
  if (age === null || !Number.isFinite(age)) return 1;
  if (age < 23) return 1 + 0.01 * Math.min(6, 23 - Math.max(age, 14));
  if (age <= 40) return 1;
  if (age <= 60) return 1 + 0.012 * (age - 40);
  return 1.24 + 0.025 * Math.min(30, age - 60);
}

const LOWER = new Set(["squat", "hinge", "lunge"]);
/** Typical women's strength against men's at the same body weight, upper and lower body. */
export function sexFactor(ex: Exercise, sex: AgeSex["sex"]): number {
  if (sex !== "female") return 1;
  return LOWER.has(ex.pattern) || ex.primary.some((m) => m === "glutes" || m === "quads" || m === "hamstrings") ? 1 / 0.75 : 1 / 0.62;
}

export function ageOf(p: AgeSex, now: number): number | null {
  return p.birthYear ? new Date(now).getFullYear() - p.birthYear : null;
}

/** Score 0 to 100: 50 is a typical intermediate, 75 twice as strong, about 88 three times. */
export function scoreOf(ratio: number): number {
  return Math.round(100 * (1 - Math.pow(2, -Math.max(0, ratio))));
}

/** The spread of trained lifters around the standard: the log-normal width percentileOf uses. */
const SPREAD = 0.35;

/** Rough share of trained lifters a ratio beats: log-normal around the intermediate standard. */
export function percentileOf(ratio: number): number {
  if (ratio <= 0) return 0;
  const z = Math.log(ratio) / SPREAD;
  // Abramowitz and Stegun normal CDF.
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return Math.round(100 * (z > 0 ? 1 - p : p));
}

/** A typical intermediate's estimated max at this body weight: their working load is `start` × body weight
 * for about 10 reps with 2 in reserve. */
export const standardMax = (ex: Exercise, bodyweightKg: number) => estimate(ex.start * bodyweightKg, 12);

/** Percentiles the public tool shows, with each one's z-score. */
export const PERCENTILE_STEPS: readonly (readonly [pct: number, z: number])[] = [
  [25, -0.6745],
  [50, 0],
  [75, 0.6745],
  [90, 1.2816],
  [95, 1.6449],
];

/**
 * One lift against the standards, for the public strength standards tool: the score, the share of trained
 * lifters it beats, and the estimated max at each of PERCENTILE_STEPS for this lifter (age and sex adjusted).
 */
export function liftStanding(ex: Exercise, e1rm: number, bodyweightKg: number, age: number | null, sex: AgeSex["sex"]) {
  const adjust = ageFactor(age) * sexFactor(ex, sex);
  const standard = standardMax(ex, Math.max(30, bodyweightKg));
  const ratio = (e1rm * adjust) / standard;
  return {
    ratio,
    score: scoreOf(ratio),
    percentile: percentileOf(ratio),
    standard: standard / adjust,
    steps: PERCENTILE_STEPS.map(([pct, z]) => ({ pct, e1rm: (Math.exp(SPREAD * z) * standard) / adjust })),
  };
}

export interface LiftScore {
  exerciseId: string;
  name: string;
  e1rm: number;
  ratio: number;
  score: number;
  percentile: number;
}

export interface StrengthReport {
  overall: number | null;
  muscles: Partial<Record<Muscle, number>>;
  lifts: LiftScore[];
  adjusted: { age: boolean; sex: boolean };
}

export function strength(
  events: readonly AppEvent[],
  profile: Pick<Profile, "bodyweight"> & AgeSex,
  now: number,
  opts: { adjustAge?: boolean } = {},
): StrengthReport {
  const bw = Math.max(30, profile.bodyweight || 75);
  const age = opts.adjustAge === false ? null : ageOf(profile, now);
  const af = ageFactor(age);
  // Today's estimated max per lift, from the same estimator as the one-rep max calculator (onerm.ts), so
  // the two cards on Progress never disagree.
  const best = new Map<string, number>();
  const ids = new Set<string>();
  for (const e of events) {
    if (e.type !== "set" || e.at < now - WINDOW_DAYS * DAY) continue;
    const ex = EXERCISE_BY_ID.get(e.exerciseId);
    if (ex && ex.load !== "bodyweight" && ex.start > 0) ids.add(ex.id);
  }
  for (const id of ids) {
    const r = oneRm(events, id, now);
    if (r && r.source === "logged") best.set(id, r.e1rm);
  }
  const lifts: LiftScore[] = [];
  for (const [id, e1] of best) {
    const ex = EXERCISE_BY_ID.get(id)!;
    const ratio = (e1 * af * sexFactor(ex, profile.sex)) / standardMax(ex, bw);
    lifts.push({ exerciseId: id, name: ex.name, e1rm: e1, ratio, score: scoreOf(ratio), percentile: percentileOf(ratio) });
  }
  lifts.sort((a, b) => b.score - a.score);
  const muscles: Partial<Record<Muscle, number>> = {};
  for (const m of MUSCLES) {
    const xs = lifts.filter((l) => EXERCISE_BY_ID.get(l.exerciseId)!.primary.includes(m));
    if (xs.length) muscles[m] = Math.max(...xs.map((l) => l.score));
  }
  const entries = Object.entries(muscles) as [Muscle, number][];
  const w = (m: Muscle) => (LARGE_MUSCLES.has(m) ? 2 : 1);
  const overall = entries.length
    ? Math.round(entries.reduce((s, [m, v]) => s + v * w(m), 0) / entries.reduce((s, [m]) => s + w(m), 0))
    : null;
  return { overall, muscles, lifts, adjusted: { age: age !== null, sex: profile.sex === "female" } };
}

/** The big lifts the twins card compares, when the lifter has done them. */
export const TWIN_LIFTS = ["bench-press", "back-squat", "deadlift", "overhead-press", "barbell-row", "trap-bar-deadlift", "front-squat"];

export function twins(report: StrengthReport): LiftScore[] {
  const by = new Map(report.lifts.map((l) => [l.exerciseId, l]));
  const main = TWIN_LIFTS.map((id) => by.get(id)).filter((x): x is LiftScore => !!x);
  return (main.length ? main : report.lifts).slice(0, 4);
}

export function scoreBand(score: number): string {
  if (score >= 88) return t("sband.elite");
  if (score >= 75) return t("sband.advanced");
  if (score >= 50) return t("sband.intermediate");
  if (score >= 30) return t("sband.novice");
  return t("sband.start");
}
