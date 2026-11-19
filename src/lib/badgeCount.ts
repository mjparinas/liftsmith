// The app icon badge's numbers, kept free of the store so any screen can show a count (iconBadge.ts has the rest).

/** Where waiting things come from, for the icon and the red counts on screen. */
export interface Waiting {
  /** New likes, comments and follows, plus follow requests. */
  friends: number;
  /** Unread coaching messages, from a coach or from clients. */
  coach: number;
}

/** The icon's number caps here, as phones do; the red counts show "99+". */
export const BADGE_MAX = 99;

/** The number on the icon: everything waiting, or 0 when the lifter turned it off. */
export function badgeCount(w: Waiting, on = true): number {
  if (!on) return 0;
  const n = Math.max(0, Math.floor(w.friends || 0)) + Math.max(0, Math.floor(w.coach || 0));
  return Math.min(BADGE_MAX, n);
}

/** A red count's words: "3", or "99+" past the cap. */
export const countText = (n: number) => (n > BADGE_MAX ? `${BADGE_MAX}+` : String(Math.max(0, Math.floor(n))));

/** Whether the lifter wants the number on the icon (on unless turned off). */
export const badgeOn = (p: { messages?: { badge?: boolean } }) => p.messages?.badge !== false;
