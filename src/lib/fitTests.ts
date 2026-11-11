// Fitness tests (Melvin asked, 2026-11-11: "research that uses how long someone can hang from a pull up bar to
// measure a person's overall health"; docs/decisions/fitness-tests.md). Three short tests a lifter can do
// alone, each compared with a published reference where one exists and always with their own past results:
//
// - Dead hang: seconds hanging from a bar. No population norms for adults exist; the only published adult
//   numbers we found are one small study (Stepan et al., Appl Sci 2026;16(19):9926, 38 adults aged 24 to 62:
//   men 77.7 ± 37.4 s, women 44.4 ± 23.2 s, all 61.1 ± 35.0 s). The health link is through grip strength
//   (Leong et al., Lancet 2015, PURE), which hang time follows only loosely, so the card says so.
// - One-leg stand: seconds on one leg, arms crossed, best of up to three tries, stopped at 45 s, eyes open
//   or closed. Reference: Springer et al., J Geriatr Phys Ther 2007;30(1), Table 1 (549 adults aged 18 to
//   99, best of three, mean and SD by sex and age group).
// - 30-second chair stand: full stands from a chair in 30 s, arms crossed. References: Lein et al.,
//   Int J Sports Phys Ther 2022;17(5):907-914 (81 adults aged 18 to 35, 33.0 ± 5.4, both sexes) and Rikli and
//   Jones, J Aging Phys Act 1999;7(2):162-181 (normal ranges, the middle half, ages 60 to 94; their lower ends
//   match CDC STEADI's below-average cut-offs). Ages 36 to 59 have no published reference we could check.
//
// General wellness only, like fitness age: no percentiles we can't back, no disease or lifespan claims, no
// warning colours, never a notification; a typical range, its source, and what to do next. Pure, so it runs
// the same on Android, iOS and the web.
import type { AppEvent, FitTest, FitTestEvent, Profile } from "./types";

type Sex = "male" | "female";

export const FIT_TESTS = ["hang", "balance", "chair"] as const satisfies readonly FitTest[];

/** Retest every four weeks: fitness changes slowly, and sooner adds noise rather than news. */
export const RETEST_DAYS = 28;
/** The one-leg stand stops here (Springer et al. 2007). */
export const BALANCE_CAP = 45;
/** The chair stand lasts this long. */
export const CHAIR_SECONDS = 30;
/** Plausible results, so a slip of the thumb isn't saved. */
export const FIT_RANGE: Record<FitTest, readonly [number, number]> = { hang: [1, 600], balance: [0, BALANCE_CAP], chair: [0, 60] };
/** Where the − / + box starts when there's no result yet. */
export const FIT_START: Record<FitTest, number> = { hang: 30, balance: 20, chair: 12 };

const DAY = 86_400_000;

/** Mean and SD from a study; "typical" is within half an SD of the mean. */
interface MeanSd {
  mean: number;
  sd: number;
}

/** Stepan et al. 2026, barehanded straight-arm hang, seconds. */
export const HANG_REF: Record<Sex | "all", MeanSd> = {
  male: { mean: 77.7, sd: 37.4 },
  female: { mean: 44.4, sd: 23.2 },
  all: { mean: 61.1, sd: 35.0 },
};
/** The study's ages; outside them we still show the numbers, but don't compare. */
export const HANG_AGES: readonly [number, number] = [18, 65];

/** Springer et al. 2007, Table 1, best of three trials: [first age, last age, female, male, all]. */
type BalanceRow = readonly [number, number, MeanSd, MeanSd, MeanSd];
const ms = (mean: number, sd: number): MeanSd => ({ mean, sd });
export const BALANCE_REF: Record<"open" | "closed", readonly BalanceRow[]> = {
  open: [
    [18, 39, ms(45.1, 0.1), ms(44.4, 4.1), ms(44.7, 3.1)],
    [40, 49, ms(42.1, 9.5), ms(41.6, 10.2), ms(41.9, 9.9)],
    [50, 59, ms(40.9, 10.0), ms(41.5, 10.5), ms(41.2, 10.2)],
    [60, 69, ms(30.4, 16.4), ms(33.8, 16.0), ms(32.1, 16.2)],
    [70, 79, ms(16.7, 15.0), ms(25.9, 18.1), ms(21.5, 17.3)],
    [80, 99, ms(10.6, 13.2), ms(8.7, 12.6), ms(9.4, 12.8)],
  ],
  closed: [
    [18, 39, ms(13.1, 12.3), ms(16.9, 13.9), ms(15.2, 13.3)],
    [40, 49, ms(13.5, 12.4), ms(12.0, 13.5), ms(12.7, 12.9)],
    [50, 59, ms(7.9, 8.0), ms(8.6, 8.8), ms(8.3, 8.4)],
    [60, 69, ms(3.6, 2.3), ms(5.1, 6.8), ms(4.4, 5.1)],
    [70, 79, ms(3.7, 6.2), ms(2.6, 1.7), ms(3.1, 4.5)],
    [80, 99, ms(2.1, 1.1), ms(1.8, 0.9), ms(1.9, 1.0)],
  ],
};

/** Lein et al. 2022: ages 18 to 35, both sexes, 30-second chair stand. */
export const CHAIR_YOUNG: MeanSd & { ages: readonly [number, number] } = { mean: 33.0, sd: 5.4, ages: [18, 35] };
/** Rikli and Jones 1999 normal ranges (25th to 75th percentile): [first age, last age, women, men]. */
export const CHAIR_OLDER: readonly (readonly [number, number, readonly [number, number], readonly [number, number]])[] = [
  [60, 64, [12, 17], [14, 19]],
  [65, 69, [11, 16], [12, 18]],
  [70, 74, [10, 15], [12, 17]],
  [75, 79, [10, 15], [11, 17]],
  [80, 84, [9, 14], [10, 15]],
  [85, 89, [8, 13], [8, 14]],
  [90, 94, [4, 11], [7, 12]],
];

export type FitSource = "stepan" | "springer" | "lein" | "rikli";

/** What a result is compared with: a typical range for people like the lifter, and where it comes from. */
export interface FitReference {
  source: FitSource;
  /** The study's average, when it gives one. */
  mean?: number;
  /** Typical: half an SD either side of the mean, or the published middle half. */
  low: number;
  high: number;
  /** The age group compared with. */
  ages: readonly [number, number];
  /** The sex compared with, or both. */
  sex?: Sex;
}

/**
 * Where a result sits against the reference. "topped" is the one-leg stand's 45-second limit: nothing above
 * it to measure, so the next step is eyes closed.
 */
export type FitVerdict = "above" | "typical" | "below" | "topped";

export function ageOf(profile: Pick<Profile, "birthYear">, now: number): number | null {
  if (!profile.birthYear) return null;
  const age = new Date(now).getFullYear() - profile.birthYear;
  return age >= 13 && age <= 110 ? age : null;
}

const band = (m: MeanSd, cap = Infinity) => ({
  mean: m.mean,
  low: Math.max(0, Math.round((m.mean - m.sd / 2) * 10) / 10),
  high: Math.min(cap, Math.round((m.mean + m.sd / 2) * 10) / 10),
});

/** The reference for a test, or null when no published one fits the lifter's age (or age is unknown where it matters). */
export function reference(test: FitTest, age: number | null, sex: Sex | undefined, eyes: "open" | "closed" = "open"): FitReference | null {
  if (test === "hang") {
    if (age !== null && (age < HANG_AGES[0] || age > HANG_AGES[1])) return null;
    return { source: "stepan", ...band(HANG_REF[sex ?? "all"]), ages: [24, 62], sex };
  }
  if (age === null) return null;
  if (test === "balance") {
    const row = BALANCE_REF[eyes].find(([a, b]) => age >= a && age <= b);
    if (!row) return null;
    const [a, b, f, m, all] = row;
    return { source: "springer", ...band(sex === "female" ? f : sex === "male" ? m : all, BALANCE_CAP), ages: [a, b], sex };
  }
  if (age >= CHAIR_YOUNG.ages[0] && age <= CHAIR_YOUNG.ages[1]) {
    return { source: "lein", ...band(CHAIR_YOUNG), ages: CHAIR_YOUNG.ages };
  }
  const row = CHAIR_OLDER.find(([a, b]) => age >= a && age <= b);
  if (!row || !sex) return null;
  const [a, b, women, men] = row;
  const [low, high] = sex === "female" ? women : men;
  return { source: "rikli", low, high, ages: [a, b], sex };
}

export function verdict(test: FitTest, value: number, ref: FitReference): FitVerdict {
  if (test === "balance" && value >= BALANCE_CAP) return "topped";
  if (value > ref.high) return "above";
  if (value >= ref.low) return "typical";
  return "below";
}

/** Every result of one test (and one-leg stand eye setting), oldest first. */
export function resultsOf(events: readonly AppEvent[], test: FitTest, eyes?: "open" | "closed"): FitTestEvent[] {
  return events
    .filter(
      (e): e is FitTestEvent => e.type === "fitTest" && e.test === test && (test !== "balance" || (e.eyes ?? "open") === (eyes ?? "open")),
    )
    .sort((a, b) => a.at - b.at);
}

export interface FitSummary {
  test: FitTest;
  eyes?: "open" | "closed";
  last: FitTestEvent;
  best: number;
  /** Change since the result before the last one. */
  change?: number;
  /** Days until a retest is worth it; 0 or less means it's due. */
  dueIn: number;
  ref: FitReference | null;
  verdict: FitVerdict | null;
  /** Something to aim for next time. */
  goal: number | null;
  count: number;
}

/** The goal for next time: a little past the best, so it's within reach in four weeks. */
export function nextGoal(test: FitTest, best: number): number | null {
  if (test === "hang") return Math.min(FIT_RANGE.hang[1], Math.ceil((best + 10) / 5) * 5);
  if (test === "chair") return best + 2;
  return best >= BALANCE_CAP ? null : Math.min(BALANCE_CAP, Math.ceil((best + 5) / 5) * 5);
}

export function summarize(
  events: readonly AppEvent[],
  test: FitTest,
  profile: Pick<Profile, "birthYear" | "sex">,
  now: number,
  eyes?: "open" | "closed",
): FitSummary | null {
  // The one-leg stand shows the eye setting used most recently, unless asked for one.
  const all = events.filter((e): e is FitTestEvent => e.type === "fitTest" && e.test === test);
  if (!all.length) return null;
  const pick = test === "balance" ? (eyes ?? all.reduce((a, b) => (b.at > a.at ? b : a)).eyes ?? "open") : undefined;
  const list = resultsOf(events, test, pick);
  const last = list.at(-1);
  if (!last) return null;
  const prev = list.at(-2);
  const best = Math.max(...list.map((e) => e.value));
  const ref = reference(test, ageOf(profile, now), profile.sex, pick);
  return {
    test,
    eyes: pick,
    last,
    best,
    change: prev ? last.value - prev.value : undefined,
    // The clock may lag a just-saved result by up to a minute, so count from whichever is later.
    dueIn: Math.ceil((last.at + RETEST_DAYS * DAY - Math.max(now, last.at)) / DAY),
    ref,
    verdict: ref ? verdict(test, last.value, ref) : null,
    goal: nextGoal(test, best),
    count: list.length,
  };
}

/** A result is kept only when it's in range; times round to whole seconds, stands to whole reps. */
export function cleanResult(test: FitTest, value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const v = Math.round(value);
  const [lo, hi] = FIT_RANGE[test];
  return v >= lo && v <= hi ? v : null;
}
