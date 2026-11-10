// Fitness age (Melvin picked it, 2026-11-09; docs/FITNESS_AGE.md, AGENTS.md "Fitness age"). The age at
// which a typical healthy person of the lifter's sex has the lifter's VO2 max, after the HUNT Fitness
// Study's idea of fitness age (Nes et al., Med Sci Sports Exerc 2014). The reference values are the HUNT 3
// Fitness Study's treadmill-measured VO2 max in 3,816 healthy Norwegian adults (Loe et al., PLoS ONE
// 2013;8(5):e64319, Table 2, mean by sex and ten-year age group), placed at each group's middle and
// joined with straight lines.
//
// General wellness only: it's a fitness estimate, never a health verdict. The card shows a range (watch
// VO2 max readings are estimates), its source and what raises it; it never sends a notification. Pure,
// so it runs the same on Android, iOS and the web.
import { readings } from "./twin";
import type { AppEvent, Profile } from "./types";

type Sex = "male" | "female";

/** [age, mean VO2 max in mL/kg/min]: Loe et al. 2013, Table 2, at each age group's middle (70+ at 75). */
export const HUNT_REFERENCE: Record<Sex, readonly (readonly [number, number])[]> = {
  male: [
    [25, 54.4],
    [35, 49.1],
    [45, 47.2],
    [55, 42.6],
    [65, 39.2],
    [75, 35.3],
  ],
  female: [
    [25, 43.0],
    [35, 40.0],
    [45, 38.4],
    [55, 34.4],
    [65, 31.1],
    [75, 28.3],
  ],
};

/** Ages the answer is kept within: a little past the study's youngest and oldest groups. */
export const MIN_AGE = 20;
export const MAX_AGE = 80;
/** Watch VO2 max estimates are typically 5 to 15% off a lab test; the range uses the middle of that. */
export const READING_SPREAD = 0.08;
/** Readings older than this don't count. */
export const MAX_READING_DAYS = 120;
/** "About your age" when within this many years. */
export const TYPICAL_YEARS = 3;

const DAY = 86_400_000;

/** The typical healthy VO2 max at an age, interpolated (and extended at the ends) along the reference. */
export function expectedVo2(sex: Sex, age: number): number {
  const ref = HUNT_REFERENCE[sex];
  const a = Math.min(MAX_AGE, Math.max(MIN_AGE, age));
  let i = 0;
  while (i < ref.length - 2 && a > ref[i + 1][0]) i++;
  const [x0, y0] = ref[i],
    [x1, y1] = ref[i + 1];
  return y0 + ((a - x0) / (x1 - x0)) * (y1 - y0);
}

/** The age whose typical VO2 max equals `vo2`, within MIN_AGE to MAX_AGE. */
export function ageForVo2(sex: Sex, vo2: number): number {
  let lo = MIN_AGE,
    hi = MAX_AGE;
  if (vo2 >= expectedVo2(sex, lo)) return lo;
  if (vo2 <= expectedVo2(sex, hi)) return hi;
  // The reference falls with age, so a binary search finds the crossing.
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (expectedVo2(sex, mid) > vo2) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export type FitnessAgeMissing = "vo2" | "age" | "sex";

export interface FitnessAge {
  /** The VO2 max used: the median of the newest readings (up to 5) in the last 120 days. */
  vo2: number;
  /** Day of the newest reading. */
  day: string;
  readings: number;
  age: number;
  sex: Sex;
  /** Typical VO2 max for a healthy person of this age and sex. */
  expected: number;
  /** Fitness age, whole years, and its likely range. */
  fitnessAge: number;
  low: number;
  high: number;
  /** At the ends of the reference: "20 or younger", "80 or older". */
  atFloor: boolean;
  atCeiling: boolean;
  /** Fitness age minus age. */
  diff: number;
  verdict: "younger" | "typical" | "older";
}

export type FitnessAgeResult = { ok: true; value: FitnessAge } | { ok: false; missing: FitnessAgeMissing[] };

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b),
    m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fitnessAge(events: readonly AppEvent[], profile: Pick<Profile, "birthYear" | "sex">, now: number): FitnessAgeResult {
  const from = dayKey(now - MAX_READING_DAYS * DAY);
  const recent = readings(events, "vo2max").filter((p) => p.day >= from && p.value >= 10 && p.value <= 95);
  const age = profile.birthYear ? new Date(now).getFullYear() - profile.birthYear : null;
  const missing: FitnessAgeMissing[] = [];
  if (!recent.length) missing.push("vo2");
  if (age === null || age < 13 || age > 110) missing.push("age");
  if (!profile.sex) missing.push("sex");
  if (missing.length) return { ok: false, missing };
  const sex = profile.sex!;
  const used = recent.slice(-5);
  const vo2 = median(used.map((p) => p.value));
  const exact = ageForVo2(sex, vo2);
  const fit = Math.round(exact);
  // A higher reading means a younger fitness age, so the low end comes from the high reading.
  const low = Math.round(ageForVo2(sex, vo2 * (1 + READING_SPREAD)));
  const high = Math.round(ageForVo2(sex, vo2 * (1 - READING_SPREAD)));
  const diff = fit - age!;
  return {
    ok: true,
    value: {
      vo2,
      day: used[used.length - 1].day,
      readings: used.length,
      age: age!,
      sex,
      expected: expectedVo2(sex, age!),
      fitnessAge: fit,
      low,
      high,
      atFloor: exact <= MIN_AGE,
      atCeiling: exact >= MAX_AGE,
      diff,
      verdict: diff <= -TYPICAL_YEARS ? "younger" : diff >= TYPICAL_YEARS ? "older" : "typical",
    },
  };
}

/** Strength-training days and minutes in the last 7 days, from the lifter's workouts. */
export function strengthWeek(sessions: readonly { start: number; seconds: number }[], now: number): { days: number; minutes: number } {
  const recent = sessions.filter((s) => s.start > now - 7 * DAY && s.start <= now);
  return { days: new Set(recent.map((s) => dayKey(s.start))).size, minutes: Math.round(recent.reduce((t, s) => t + s.seconds, 0) / 60) };
}
