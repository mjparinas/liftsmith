import { t } from "./i18n";
import type { Experience, Profile } from "./types";

// Periodized blocks: a few build weeks with reps in reserve stepping down, then a deload week.

const WEEK = 7 * 24 * 3600_000;

export interface BlockWeek {
  /** 0-based week within the block. */
  week: number;
  /** Total weeks including the deload. */
  length: number;
  deload: boolean;
  /** Reps in reserve to aim for this week. */
  rir: number;
  /** Weekly hard sets to aim for per muscle. */
  setsPerMuscle: number;
  /** Multiplier on the planned sets (0.5 on a deload). */
  volume: number;
  label: string;
}

const RIR_STEPS = [3, 2, 2, 1, 1, 0];
const BASE_SETS: Record<Experience, [number, number]> = { new: [8, 12], intermediate: [10, 16], advanced: [12, 20] };

export function blockWeek(profile: Pick<Profile, "blockStart" | "blockWeeks" | "experience">, now: number): BlockWeek {
  const build = Math.min(6, Math.max(3, profile.blockWeeks));
  const length = build + 1;
  const week = Math.max(0, Math.floor((now - profile.blockStart) / WEEK)) % length;
  const [lo, hi] = BASE_SETS[profile.experience];
  if (week === build) {
    return { week, length, deload: true, rir: 4, setsPerMuscle: Math.round(lo / 2), volume: 0.5, label: t("block.deload") };
  }
  // Spread the RIR steps over however many build weeks there are.
  const step = RIR_STEPS[Math.round((week / Math.max(1, build - 1)) * (RIR_STEPS.length - 1))];
  const sets = Math.round(lo + ((hi - lo) * week) / Math.max(1, build - 1));
  return {
    week,
    length,
    deload: false,
    rir: step,
    setsPerMuscle: sets,
    volume: 1,
    label: t("block.week", { week: week + 1, count: build }),
  };
}

/** Start of the current block week (for counting this week's sets). */
export function weekStart(profile: Pick<Profile, "blockStart">, now: number): number {
  const n = Math.max(0, Math.floor((now - profile.blockStart) / WEEK));
  return profile.blockStart + n * WEEK;
}
