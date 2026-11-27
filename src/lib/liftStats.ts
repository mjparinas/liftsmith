import type { LiftSession } from "./liftPage";
import { oneRm, type OneRm } from "./onerm";
import { TIMED } from "./progression";
import { setVolume, totalReps } from "./sides";
import { ageOf, liftStanding, type AgeSex } from "./strength";
import { currentKg } from "./tdee";
import type { AppEvent, Exercise, Profile } from "./types";

// Rich stats on every exercise page (Melvin, 2026-11-13: "if you click on an exercise ... how many sets you've
// had, any lifetime amount of weight ... rich graphs over time ... estimated one rep max ... what do other
// people ... lift relative to your group"). Pure views over the event log on the device, never stored, so
// they work offline on Android, iOS and the web alike. The comparison is with published strength standards
// (strength.ts), not other lifters' data, and the page says so.

const DAY = 86_400_000;

/** The chart's time ranges, shortest first, then all time (Melvin, 2026-11-26). Three months is the default. */
export const STAT_RANGES = ["1w", "1m", "3m", "6m", "1y", "all"] as const;
export type StatRange = (typeof STAT_RANGES)[number];
export const DEFAULT_RANGE: StatRange = "3m";
/** Days each range covers. All time has no limit: it starts at the lifter's first session of the lift (`rangeStart`). */
export const RANGE_DAYS: Record<StatRange, number> = { "1w": 7, "1m": 30, "3m": 91, "6m": 182, "1y": 365, all: Infinity };

/**
 * Where a range's x axis starts: `now` minus its days, or for all time the first session of the lift (a week back
 * when there's none, or the only one is today, so a lone point doesn't sit on the axis's edge).
 */
export function rangeStart(sessions: readonly Pick<LiftSession, "at">[], range: StatRange, now: number): number {
  if (range !== "all") return now - RANGE_DAYS[range] * DAY;
  let first = Infinity;
  for (const s of sessions) if (s.at <= now && s.at < first) first = s.at;
  return Number.isFinite(first) ? Math.min(first, now - 7 * DAY) : now - 7 * DAY;
}

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
  /**
   * A new best for this metric at the time: higher than every earlier session of the lift, the ones before the
   * range included. The very first session is never one (there was nothing to beat). Volume is a per-session
   * number, so its bests are the biggest sessions so far.
   */
  best?: boolean;
}

/**
 * One point per session inside the range, oldest first. The estimated max is each session's 1RM estimator point
 * (liftPage.ts liftSessions), the same number as the page's best and trend line, and it covers the whole range, not
 * only the estimator's last 180 days.
 */
export function liftSeries(sessions: readonly LiftSession[], metric: StatMetric, range: StatRange, now: number): StatPoint[] {
  const from = range === "all" ? -Infinity : now - RANGE_DAYS[range] * DAY;
  const out: StatPoint[] = [];
  // Oldest first over every session up to now, so a best inside the range is judged against the whole history.
  const ordered = [...sessions].filter((s) => s.at <= now).sort((a, b) => a.at - b.at);
  let top = 0;
  let seen = false;
  for (const s of ordered) {
    const value = sessionValue(s, metric);
    if (!(value > 0)) continue;
    const best = seen && value > top + 1e-9;
    if (value > top) top = value;
    seen = true;
    if (s.at < from) continue;
    out.push(best ? { at: s.at, value, best } : { at: s.at, value });
  }
  return out;
}

/** One session's number for a metric; 0 when it has none (no load for volume, no estimate for a bodyweight lift). */
function sessionValue(s: LiftSession, metric: StatMetric): number {
  if (metric === "e1rm") return s.e1rm;
  let value = 0;
  for (const x of s.sets) {
    // Bodyweight lifts with no added load have no volume: they show reps instead of a flat zero line.
    if (metric === "volume") value += x.weight > 0 ? setVolume(x) : 0;
    else if (metric === "top") value = Math.max(value, x.weight);
    else value = Math.max(value, x.reps);
  }
  return value;
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
  const bw = currentKg(events, profile);
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
