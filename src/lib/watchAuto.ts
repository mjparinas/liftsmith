// Hands-free watch sets (Labs, `labWatchAuto`, Melvin picked it 2026-11-26: "Can liftsmith automatically track
// workouts on the wear os app? Not using the button presses??"). On top of watch rep counting: the watch keeps
// streaming its motion through rest, so the phone sees the lifter start the next set early and ends rest by itself;
// the set then logs itself once the reps stop (handsFree.ts), and the watch buzzes at each of those steps (`cue`).
// No tap from the first rep of the workout to the last. Pure rules, so they're tested without a watch.

/** Reps counted during rest before it counts as the next set starting. One or two can be a sip of water. */
export const START_REPS = 3;
/** The first part of rest is ignored: racking the bar, walking away and shaking out the arms. */
export const SETTLE_MS = 15_000;

/** Whether to watch for an early start: the lab is on and rest has run long enough to have settled. */
export function watchingRest(restStart: number | undefined, now: number): boolean {
  return restStart !== undefined && now - restStart >= SETTLE_MS;
}

/** Whether reps counted during rest mean the lifter has started the next set. */
export function startsEarly(n: number): boolean {
  return n >= START_REPS;
}

/** Reps counted during rest that carry into the set they started, so the set's count starts where they left off. */
export interface Carry {
  key: string;
  n: number;
}

/** The set's reps: what the watch counted since rest ended, plus what it counted during rest for this set. */
export function withCarry(carry: Carry | null, key: string, n: number): number {
  return carry && carry.key === key ? carry.n + n : n;
}

/**
 * What the watch buzzes for: the set started by itself, the set logged itself, or the bar has slowed enough to end
 * the set (wrist bar speed, Labs). Each cue's id is new.
 */
export type CueKind = "go" | "logged" | "slow";

/** A cue id the watches buzz on once when it changes (sessionNotify.ts `cue`): its kind and a count that only rises. */
export function cueId(kind: CueKind, n: number): string {
  return `${kind}:${n}`;
}
