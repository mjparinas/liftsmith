// Hands-free sets (Labs, `labHandsFree`, Melvin picked it 2026-11-11). While a rep counter is counting (camera,
// phone motion or the watch), the set logs itself once the reps stop: a short wait once the planned reps are
// in, a longer one when the lifter is still short of them (a grind, a breath at lockout), and always the
// longer one on "as many as you can" sets. The counter can't see the bar go back in the rack, so the time
// since the last counted rep stands in for it. Undo then works as it does after a tap.

/** Wait after the last rep once the planned reps are in. */
export const DONE_MS = 4000;
/** Wait after the last rep while short of the planned reps, and on sets for as many reps as possible. */
export const PAUSE_MS = 8000;
/** The countdown shows over the last this long of the wait. */
export const WARN_MS = 3000;

/** The count so far this set: reps and when the last one was counted. `key` is the set it belongs to. */
export interface Counted {
  key: string;
  n: number;
  at: number;
}

/** How long to wait after the last rep before logging. `target` is undefined for "as many as you can". */
export function waitFor(n: number, target: number | undefined): number {
  return target !== undefined && target > 0 && n >= target ? DONE_MS : PAUSE_MS;
}

/** Milliseconds until the set logs itself, or null while nothing has been counted. Zero or less: log it now. */
export function msLeft(c: Counted | null, key: string, target: number | undefined, now: number): number | null {
  if (!c || c.key !== key || c.n < 1) return null;
  return c.at + waitFor(c.n, target) - now;
}

/** A new count for the set `key`: kept only when it moves, so the wait runs from the last real rep. */
export function nextCount(c: Counted | null, key: string, n: number, now: number): Counted | null {
  if (n < 1) return c?.key === key ? c : null;
  if (c && c.key === key && c.n === n) return c;
  return { key, n, at: now };
}
