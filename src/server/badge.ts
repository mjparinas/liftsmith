// The number a push puts on the app icon (Melvin, 2026-11-19: "add app icon notifications"; src/lib/iconBadge.ts):
// what's waiting in Friends plus unread coaching messages, the same counts the app shows in red on the Friends tab and
// Today's coach badge (form videos and their notes count with the messages), so the icon and the app agree. Four indexed reads, once per push recipient.
import { badgeCount } from "@/lib/badgeCount";

import { unreadFrom } from "./coach";
import { videosWaiting } from "./formVideos";
import { friendsWaiting } from "./social";
import { teamChatWaiting } from "./teamChat";

/** What's waiting for this account, capped as phones cap it. Never throws: a failed count sends no number. */
export async function badgeFor(accountId: string): Promise<number | undefined> {
  try {
    const [friends, coach, videos, team] = await Promise.all([
      friendsWaiting(accountId),
      unreadFrom(accountId),
      videosWaiting(accountId),
      teamChatWaiting(accountId),
    ]);
    return badgeCount({ friends, coach: Object.values(coach).reduce((a, b) => a + b, 0) + videos + team });
  } catch {
    return undefined;
  }
}
