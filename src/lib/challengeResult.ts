// Challenge results (Friends gap list 3, item 5; docs/decisions/friends.md "Challenge results"). When a friend
// challenge the lifter joined is over: where they finished, a once-only results moment on Friends › Board, a share
// card that carries only the lifter's own place and total (never a friend's name or score), a coach's note for a
// few days after, and a one-tap rematch with the same friends, measure and length.
import { standings } from "./challenge";
import { CHALLENGE_DAYS, type Challenge, type ChallengeDays } from "./socialTypes";

export { RESULT_NOTE_DAYS } from "./socialTypes";

const DAY = 86_400_000;
const SEEN = "liftsmith.challengeResults";

export interface ChallengeResult {
  place: number;
  /** Joined members ranked. */
  of: number;
  score: number;
  /** First, with a score above zero. */
  won: boolean;
  /** Won, sharing first place. */
  tie: boolean;
  /** Everyone sharing first place (names), when anyone scored. */
  winners: string[];
}

/** The lifter's result in a finished challenge they joined, or null (not over, not joined, or not on the list). */
export function challengeResult(c: Challenge, now: number): ChallengeResult | null {
  if (c.status !== "joined" || now < c.endsAt) return null;
  const ranked = standings(c);
  const me = ranked.find((r) => r.me);
  if (!me) return null;
  const score = me[c.metric];
  const top = ranked.filter((r) => r.place === 1 && r[c.metric] > 0);
  const won = me.place === 1 && score > 0;
  return { place: me.place, of: ranked.length, score, won, tie: won && top.length > 1, winners: top.map((r) => r.name) };
}

/** The challenge's length in days, rounded to one of the lengths a new one can have (for a rematch). */
export function challengeDays(c: Challenge): ChallengeDays {
  const d = Math.round((c.endsAt - c.startsAt) / DAY);
  return CHALLENGE_DAYS.reduce((best, x) => (Math.abs(x - d) < Math.abs(best - d) ? x : best), CHALLENGE_DAYS[0]);
}

/** The friends to invite to a rematch: everyone else who joined. */
export const rematchHandles = (c: Challenge) => c.members.filter((m) => m.joined && !m.me).map((m) => m.handle);

function seen(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(SEEN) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** The first finished challenge whose results moment the lifter hasn't seen on this device. */
export function unseenResult(list: readonly Challenge[], now: number): Challenge | null {
  const done = new Set(seen());
  return list.find((c) => !done.has(c.id) && challengeResult(c, now)) ?? null;
}

export function markResultSeen(id: string) {
  try {
    localStorage.setItem(SEEN, JSON.stringify([...seen().filter((x) => x !== id), id].slice(-50)));
  } catch {
    // private mode: the moment may show again, which is harmless
  }
}
