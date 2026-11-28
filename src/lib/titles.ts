import { EXERCISE_BY_ID } from "./exercises";

// Profile titles (lift mastery, 2026-11-27): a locker item the lifter picks, shown under their name on their Friends
// profile and its public page. Titles come from badges or from mastery stars (game.ts BADGE_ITEMS, MASTERY_ITEMS);
// three of them carry the lift that earned them ("Squat devotee"), saved as "title-devotee:back-squat". The server only
// checks that a title is one of these shapes, because unlocks are worked out from the lifter's own events on the
// device, like avatars. Fixed words, never typed, so there's nothing to moderate.

/** Every title a profile can carry ("title-none" is no title). */
export const TITLE_IDS = [
  "title-early",
  "title-regular",
  "title-weekend",
  "title-comeback",
  "title-explorer",
  "title-centurion",
  "title-streak",
  "title-records",
  "title-devotee",
  "title-specialist",
  "title-master",
] as const;
export type TitleId = (typeof TITLE_IDS)[number];

/** Titles that name a lift, with the mastery stars that lift needs. */
export const LIFT_TITLES: Readonly<Partial<Record<TitleId, number>>> = { "title-devotee": 2, "title-specialist": 3, "title-master": 4 };

export interface Title {
  id: TitleId;
  /** The exercise a lift title names. */
  lift?: string;
}

/** A saved title ("title-early", "title-master:back-squat"), or null for none or anything that isn't one. */
export function parseTitle(v: unknown): Title | null {
  if (typeof v !== "string" || v.length > 80) return null;
  const [id, lift, extra] = v.split(":");
  if (extra !== undefined || !(TITLE_IDS as readonly string[]).includes(id ?? "")) return null;
  const t = id as TitleId;
  if (LIFT_TITLES[t] === undefined) return lift === undefined ? { id: t } : null;
  return lift && EXERCISE_BY_ID.has(lift) ? { id: t, lift } : null;
}

/** The saved form of a title. */
export const titleCode = (x: Title) => (x.lift ? `${x.id}:${x.lift}` : x.id);
