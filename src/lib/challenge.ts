// Friend challenges, the app side (Melvin, 2026-11-11, from the social gaps list; decision record
// docs/decisions/friends.md "Challenges and training partners"). The server scores each joined member from the
// workouts they posted in the window; this file ranks them and says the one thing to do about it, the same way
// the friends board does (AGENTS.md "Action over stats").
import { boardNudge, rankBoard } from "./invite";
import type { BoardRow, Challenge } from "./socialTypes";

const DAY = 86_400_000;

/** A challenge's joined members as board rows, so the board's ranking and nudge apply as they are. */
function rows(c: Challenge): BoardRow[] {
  return c.members
    .filter((m) => m.joined)
    .map((m) => ({
      handle: m.handle,
      name: m.name,
      avatar: m.avatar,
      me: m.me,
      workouts: 0,
      sets: 0,
      minutes: 0,
      volume: 0,
      prs: 0,
      [c.metric]: m.value,
    }));
}

/** Joined members, highest score first; ties share a place. */
export const standings = (c: Challenge) => rankBoard(rows(c), c.metric);

/** Whole days left, rounded up (0 once it's over). */
export const daysLeft = (c: Challenge, now: number) => Math.max(0, Math.ceil((c.endsAt - now) / DAY));

export const isOver = (c: Challenge, now: number) => now >= c.endsAt;

/** Who won a finished challenge: everyone sharing first place with a score above zero. */
export function winners(c: Challenge): string[] {
  const s = standings(c);
  const top = s[0];
  if (!top || top[c.metric] <= 0) return [];
  return s.filter((r) => r.place === 1).map((r) => r.name);
}

/** What to do about a running challenge the lifter has joined: catch the person above, or keep the lead. */
export const challengeNudge = (c: Challenge) => (c.status === "joined" ? boardNudge(rows(c), c.metric) : null);
