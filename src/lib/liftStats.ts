import type { LiftSession } from "./liftPage";
import { latestBodyweight, oneRm, type OneRm } from "./onerm";
import { TIMED } from "./progression";
import { setVolume, totalReps } from "./sides";
import { ageOf, liftStanding, type AgeSex } from "./strength";
import type { AppEvent, Exercise, Profile } from "./types";

// Rich stats on every exercise page (Melvin, 2026-11-13: "if you click on an exercise ... how many sets you've
// had, any lifetime amount of weight ... rich graphs over time ... estimated one rep max ... what do other
// people ... lift relative to your group"). Pure views over the event log on the device, never stored, so
// they work offline on Android, iOS and the web alike. The comparison is with published strength standards
// (strength.ts), not other lifters' data, and the page says so.

const DAY = 86_400_000;

/** The chart's time ranges, shortest first. Three months is the default. */
export const STAT_RANGES = ["1w", "1m", "3m", "6m", "1y"] as const;
export type StatRange = (typeof STAT_RANGES)[number];
export const DEFAULT_RANGE: StatRange = "3m";
export const RANGE_DAYS: Record<StatRange, number> = { "1w": 7, "1m": 30, "3m": 91, "6m": 182, "1y": 365 };

/**
 * What the chart can show for a lift: the estimated max, each session's volume and its heaviest set for loaded
 * lifts; the most reps in a set for bodyweight lifts; the longest hold or the time spent for timed work and cardio.
 */
export type StatMetric = "e1rm" | "volume" | "top" | "reps" | "time";

export type LiftKind = "loaded" | "bodyweight" | "timed";

export function liftKind(ex: Pick<Exercise, "id" | "load" | "cardio">): LiftKind {
  if (ex.cardio || TIMED.has(ex.id)) return "timed";
  return ex.load === "bodyweight" ? "bodyweight" : "loaded";
}

export function metricsFor(ex: Pick<Exercise, "id" | "load" | "cardio">): StatMetric[] {
  switch (liftKind(ex)) {
    case "loaded":
      return ["e1rm", "volume", "top"];
    case "bodyweight":
      return ["reps", "volume"];
    case "timed":
      return ["time"];
  }
}

export interface LiftTotals {
  sessions: number;
  sets: number;
  reps: number;
  /** Weight × reps over every set, both hands counted (sides.ts). Kilograms. Zero for bodyweight-only work. */
  volumeKg: number;
  /** Seconds, for timed work and cardio. */
  seconds: number;
  firstAt: number | null;
}

export function liftTotals(sessions: readonly LiftSession[], ex: Pick<Exercise, "id" | "load" | "cardio">): LiftTotals {
  const timed = liftKind(ex) === "timed";
  let sets = 0,
    reps = 0,
    volumeKg = 0,
    seconds = 0;
  let firstAt: number | null = null;
  for (const s of sessions) {
    if (firstAt === null || s.at < firstAt) firstAt = s.at;
    for (const x of s.sets) {
      sets++;
      if (timed) seconds += x.reps;
      else {
        reps += totalReps(x);
        if (x.weight > 0) volumeKg += setVolume(x);
      }
    }
  }
  return { sessions: sessions.length, sets, reps, volumeKg, seconds, firstAt };
}

export interface StatPoint {
  at: number;
  value: number;
}

/** One point per session inside the range, oldest first. The estimated max uses the 1RM estimator's own session points. */
export function liftSeries(
  sessions: readonly LiftSession[],
  metric: StatMetric,
  range: StatRange,
  now: number,
  max?: Pick<OneRm, "trend"> | null,
): StatPoint[] {
  const from = now - RANGE_DAYS[range] * DAY;
  const out: StatPoint[] = [];
  if (metric === "e1rm") {
    for (const p of max?.trend ?? []) if (p.at >= from && p.at <= now && p.e1rm > 0) out.push({ at: p.at, value: p.e1rm });
    return out.sort((a, b) => a.at - b.at);
  }
  for (const s of sessions) {
    if (s.at < from || s.at > now) continue;
    let value = 0;
    for (const x of s.sets) {
      if (metric === "volume") value += x.weight > 0 ? setVolume(x) : 0;
      else if (metric === "top") value = Math.max(value, x.weight);
      else if (metric === "reps") value = Math.max(value, x.reps);
      else value = Math.max(value, x.reps);
    }
    // Bodyweight lifts with no added load have no volume: show reps instead of a flat zero line.
    if (metric === "volume" && value === 0) continue;
    if (value > 0) out.push({ at: s.at, value });
  }
  return out.sort((a, b) => a.at - b.at);
}

/**
 * How much the line moved across the range, in whole percent: the mean of the last three points against the
 * first three (fewer when the range has fewer), so one odd session doesn't swing it. Null under four points.
 */
export function seriesChange(points: readonly StatPoint[]): number | null {
  if (points.length < 4) return null;
  const n = Math.min(3, Math.floor(points.length / 2));
  const mean = (xs: readonly StatPoint[]) => xs.reduce((s, p) => s + p.value, 0) / xs.length;
  const a = mean(points.slice(0, n));
  const b = mean(points.slice(-n));
  if (a <= 0) return null;
  return Math.round(((b - a) / a) * 100);
}

export interface LiftComparison {
  /** Share of trained lifters of the same body weight (and age and sex, when known) this max beats. */
  percentile: number;
  /** Estimated max ÷ body weight. */
  ratio: number;
  bodyweightKg: number;
  /** A typical intermediate's estimated max for this lifter (kg). */
  typical: number;
  /** The standard's ladder for this lifter: estimated max at the 25th, 50th, 75th, 90th and 95th percentile (kg). */
  steps: { pct: number; e1rm: number }[];
  /** The next rung up, and how many kilograms more on the estimated max reach it. Null at the top. */
  next: { pct: number; moreKg: number } | null;
  age: number | null;
  sex: AgeSex["sex"];
}

/**
 * This lift against published strength standards for the lifter's body weight, age and sex (strength.ts). Only
 * loaded lifts with a standard (`start` > 0) and a max estimated from logged sets: a max typed at setup isn't
 * the lifter's own lifting yet.
 */
export function liftComparison(
  ex: Exercise,
  max: Pick<OneRm, "e1rm" | "source"> | null,
  events: readonly AppEvent[],
  profile: Pick<Profile, "bodyweight"> & AgeSex,
  now: number,
): LiftComparison | null {
  if (!max || max.source !== "logged" || liftKind(ex) !== "loaded" || !(ex.start > 0)) return null;
  const bw = latestBodyweight(events, profile);
  if (!(bw > 0)) return null;
  const age = ageOf(profile, now);
  const s = liftStanding(ex, max.e1rm, bw, age, profile.sex);
  const step = s.steps.find((x) => x.pct > s.percentile && x.e1rm > max.e1rm);
  return {
    percentile: s.percentile,
    ratio: max.e1rm / bw,
    bodyweightKg: bw,
    typical: s.standard,
    steps: s.steps,
    next: step ? { pct: step.pct, moreKg: step.e1rm - max.e1rm } : null,
    age,
    sex: profile.sex,
  };
}

/** The estimate behind the page: oneRm() over the log, the same number the Progress list and the calculator show. */
export function liftMax(events: readonly AppEvent[], ex: Exercise, now: number, profile?: Pick<Profile, "knownMaxes">): OneRm | null {
  return liftKind(ex) === "loaded" ? oneRm(events, ex.id, now, profile) : null;
}
