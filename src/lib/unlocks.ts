import type { Profile } from "./types";

// Features that appear as a new lifter gets used to the app (Melvin, 2026-11-18: "slowly unlock things as time
// goes on, like seasons shouldn't be available right away for new users"; docs/decisions/unlocks.md).
//
// Each unlock opens at a number of finished workouts. Imported history counts, because it is workouts in the event
// log. Nothing is taken away: the highest count ever reached is kept on the profile (`peak`), so deleting a
// workout never hides something again. A profile from before unlocks has no `reveal` and keeps everything.
// Unlocks depend on experience, never on Pro: a Pro item that appears carries its Pro tag as usual, and the
// paywall lists every Pro feature whatever is unlocked. Links (a season push, a shared routine, a coach invite)
// open their screen either way; only the entry points on Today, the tab bar, Awards, Done and Settings wait.

export type UnlockId = "awards" | "quests" | "friends" | "seasons" | "more";

export interface Reveal {
  /** Show everything now (Settings › Look and feel). */
  all?: boolean;
  /** Workouts counted on top of the log: an experienced lifter's setup starts at `HEAD_START`. */
  head?: number;
  /** The highest count reached so far, so nothing hides again. */
  peak?: number;
}

/** In order, each at the finished workout that opens it. */
export const UNLOCKS: readonly { id: UnlockId; at: number }[] = [
  // XP, level and badges: the Awards tab and This week's XP line.
  { id: "awards", at: 1 },
  // Weekly quests and the weekly league.
  { id: "quests", at: 2 },
  // The Friends tab, posting a workout and the screenshot share cards.
  { id: "friends", at: 3 },
  // Training seasons, crates and the locker.
  { id: "seasons", at: 5 },
  // The monthly challenge, Settings › Labs and Adaptive workout options.
  { id: "more", at: 8 },
];

/** Where an experienced lifter starts (setup's experience is not "new"). */
export const HEAD_START = 3;

/** What the first setup saves: a fresh start, or a head start for an experienced lifter. */
export function firstReveal(experience: Profile["experience"]): Reveal {
  return { head: experience === "new" ? 0 : HEAD_START };
}

/** The workouts that count toward unlocks, given how many are finished in the log. */
export function unlockCount(reveal: Reveal, workouts: number): number {
  return Math.max(reveal.peak ?? 0, workouts + (reveal.head ?? 0));
}

const atOf = (id: UnlockId) => UNLOCKS.find((u) => u.id === id)!.at;

export function isUnlocked(id: UnlockId, profile: Pick<Profile, "reveal">, workouts: number): boolean {
  const r = profile.reveal;
  if (!r || r.all) return true;
  return unlockCount(r, workouts) >= atOf(id);
}

/** Whether anything is still waiting (the Show everything switch only shows then, or while it's on). */
export function anyLocked(profile: Pick<Profile, "reveal">, workouts: number): boolean {
  return UNLOCKS.some((u) => !isUnlocked(u.id, profile, workouts));
}

/**
 * What a workout just opened: the unlocks between the count before it and after it. The count before includes
 * the peak, so an import or a head start opens things quietly and only a finished workout gets a moment on Done.
 */
export function justUnlocked(profile: Pick<Profile, "reveal">, workoutsAfter: number): UnlockId[] {
  const r = profile.reveal;
  if (!r || r.all) return [];
  const before = unlockCount(r, workoutsAfter - 1);
  const after = unlockCount(r, workoutsAfter);
  return UNLOCKS.filter((u) => u.at > before && u.at <= after).map((u) => u.id);
}

/** The next unlock and how many workouts away it is, or null when everything is open. */
export function nextUnlock(profile: Pick<Profile, "reveal">, workouts: number): { id: UnlockId; left: number } | null {
  const r = profile.reveal;
  if (!r || r.all) return null;
  const n = unlockCount(r, workouts);
  const u = UNLOCKS.find((x) => x.at > n);
  return u ? { id: u.id, left: u.at - n } : null;
}
