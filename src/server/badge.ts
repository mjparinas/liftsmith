// The number a push puts on the app icon (Melvin, 2026-11-19: "add app icon notifications"; src/lib/iconBadge.ts):
// what's waiting in Friends plus unread coaching messages, the same counts the app shows in red on the Friends tab and
// Today's coach badge, so the icon and the app agree. Two indexed reads, once per push recipient.
import { badgeCount } from "@/lib/badgeCount";

import { unreadFrom } from "./coach";
import { friendsWaiting } from "./social";

/** What's waiting for this account, capped as phones cap it. Never throws: a failed count sends no number. */
export async function badgeFor(accountId: string): Promise<number | undefined> {
  try {
    const [friends, coach] = await Promise.all([friendsWaiting(accountId), unreadFrom(accountId)]);
    return badgeCount({ friends, coach: Object.values(coach).reduce((a, b) => a + b, 0) });
  } catch {
    return undefined;
  }
}
