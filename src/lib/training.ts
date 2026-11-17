import { t } from "./i18n";
import { TIMED } from "./progression";
import { dayKey } from "./random";
import type { Exercise, ExercisePrefs, Muscle, Profile, RestAlert, TrainingPrefs } from "./types";

// Workout preferences (Melvin, 2026-11-09): rest times, rep ranges and set counts, RIR or RPE, the
// rest timer, favourite exercises, muscle priorities, the default workout length and the first day of
// the week. The engine reads them in generator.ts (rest, sets, favourites, priorities) and
// progression.ts (rep ranges); this file holds the options and the small helpers the screens share.
// Every field is optional and missing means the automatic choice, so nothing changes until the lifter
// picks something.

export const REST_OPTIONS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300] as const;
export const REP_RANGES: readonly [number, number][] = [
  [3, 5],
  [4, 6],
  [5, 8],
  [6, 10],
  [8, 12],
  [10, 15],
  [12, 20],
  [15, 25],
];
export const SET_OPTIONS = [2, 3, 4, 5, 6] as const;
export const LENGTH_OPTIONS = [20, 30, 45, 60, 75, 90] as const;
/** More than three priorities stops being a priority. */
export const MAX_PRIORITIES = 3;
/** Extra weekly sets for a priority muscle, as a share of the block's target. */
export const PRIORITY_VOLUME = 1.33;

export function prefsFor(profile: Pick<Profile, "training">, exerciseId: string): ExercisePrefs {
  return profile.training?.exercises?.[exerciseId] ?? {};
}

/** Sets one exercise's overrides; an empty patch removes them. */
export function withExercisePrefs(t: TrainingPrefs | undefined, exerciseId: string, patch: ExercisePrefs): TrainingPrefs {
  const cur = { ...(t?.exercises?.[exerciseId] ?? {}), ...patch };
  const clean = Object.fromEntries(Object.entries(cur).filter(([, v]) => v !== undefined)) as ExercisePrefs;
  const exercises = { ...(t?.exercises ?? {}) };
  if (Object.keys(clean).length) exercises[exerciseId] = clean;
  else delete exercises[exerciseId];
  return { ...t, exercises };
}

export function isFavourite(profile: Pick<Profile, "training">, exerciseId: string): boolean {
  return !!profile.training?.favourites?.includes(exerciseId);
}

export function toggleFavourite(t: TrainingPrefs | undefined, exerciseId: string): TrainingPrefs {
  const list = t?.favourites ?? [];
  return { ...t, favourites: list.includes(exerciseId) ? list.filter((x) => x !== exerciseId) : [...list, exerciseId] };
}

/** Forgets the swaps that lowered an exercise's pick weight (pickWeights.ts): only swaps after `now` count again. */
export function resetPick(t: TrainingPrefs | undefined, exerciseId: string, now: number): TrainingPrefs {
  return { ...t, pickResets: { ...t?.pickResets, [exerciseId]: now } };
}

/** Adds or removes a priority muscle. At the cap, the oldest one makes room. */
export function togglePriority(t: TrainingPrefs | undefined, m: Muscle): TrainingPrefs {
  const list = t?.priorities ?? [];
  if (list.includes(m)) return { ...t, priorities: list.filter((x) => x !== m) };
  return { ...t, priorities: [...list, m].slice(-MAX_PRIORITIES) };
}

/** What the rest-over alert does. Without a choice it follows the app's Sounds and Vibration settings. */
export function restAlertOf(profile: Pick<Profile, "training" | "restSounds" | "haptics">): { sound: boolean; vibrate: boolean } {
  const a: RestAlert | undefined = profile.training?.restAlert;
  if (!a) return { sound: profile.restSounds, vibrate: profile.haptics !== false };
  return { sound: a === "both" || a === "sound", vibrate: a === "both" || a === "vibrate" };
}

/** Seconds before the end of rest for the heads-up buzz. Every platform uses the same number. */
export const REST_WARN_S = 10;

/** Whether the heads-up buzz before rest ends is on: its own switch, and only when the rest-over alert vibrates. */
export function restWarnOn(profile: Pick<Profile, "training" | "restSounds" | "haptics">): boolean {
  return profile.training?.restWarn !== false && restAlertOf(profile).vibrate;
}

/** RPE is 10 minus reps in reserve; RIR 4 or more is RPE 6 or less. */
export const rpeOf = (rir: number) => Math.max(1, 10 - rir);

/** A short label: "RIR 2" or "RPE 8". */
export function effortLabel(rir: number, scale: TrainingPrefs["effort"]): string {
  return scale === "rpe" ? `RPE ${rpeOf(rir)}` : `RIR ${rir}`;
}

/** How a set is measured: reps, a time (holds, carries, intervals) or cardio (minutes at a pace). */
export type EffortKind = "reps" | "time" | "cardio";

export function effortKind(ex: Pick<Exercise, "id" | "cardio">): EffortKind {
  if (ex.cardio) return "cardio";
  return TIMED.has(ex.id) ? "time" : "reps";
}

/**
 * The aim under the numbers on the workout screen. Reps in reserve only make sense for sets counted in reps:
 * a timed set stops a few seconds before form slips, and cardio is a pace you could talk at.
 */
export function effortAim(rir: number, scale: TrainingPrefs["effort"], kind: EffortKind = "reps"): string {
  if (kind === "cardio") return t("train.aimCardio");
  if (scale === "rpe") return t("train.aimRpe", { rpe: rpeOf(rir) });
  if (kind === "time") return t(rir > 0 ? "train.aimTimed" : "train.aimTimedMax");
  return t("train.aimRir", { count: rir });
}

/** The choices on the optional "how hard was that set" row, stored as reps in reserve. */
export function effortChoices(scale: TrainingPrefs["effort"]): { rir: number; label: string }[] {
  return [0, 1, 2, 3, 4].map((rir) => ({
    rir,
    label: scale === "rpe" ? (rir === 4 ? "≤6" : String(rpeOf(rir))) : rir === 4 ? "4+" : String(rir),
  }));
}

/**
 * The length the slider should show today: the lifter's default on a new day, or undefined to keep
 * whatever it was left at (no default set, or the slider was already moved today).
 */
export function minutesForToday(profile: Pick<Profile, "training" | "minutes" | "minutesDay">, now: number): number | undefined {
  const def = profile.training?.minutes;
  if (!def || profile.minutesDay === dayKey(now) || profile.minutes === def) return undefined;
  return def;
}

export function restLabel(sec: number): string {
  if (sec < 60) return `${sec} s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}:${String(s).padStart(2, "0")}` : `${m} min`;
}
