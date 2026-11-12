// The set timer: holds, carries and hangs are planned in seconds (TIMED in progression.ts), so the workout
// offers a timer for them (Melvin, 2026-11-12: "for some exercises that require a length of time, can you
// add a timer"). One tap starts a short lead-in to get into position, then the set counts down; a hold done
// on each side counts the first side, gives a few seconds to switch, then counts the second. Cardio counts
// up instead, because its target is only last time's, to repeat or beat. Pure, so it's tested without a clock.

/** Seconds to get into position before the clock starts, and to switch sides between the two. */
export const LEAD_SEC = 5;
export const SWITCH_SEC = 5;

export interface TimerSpec {
  /** Planned seconds (each side, for a hold done on each side). */
  target: number;
  /** 2 for a hold done on each side, one after the other. */
  sides: 1 | 2;
  /** Count up from zero (cardio) instead of down to zero. */
  up: boolean;
}

export type TimerState =
  /** Getting into position: `left` whole seconds until the clock starts. */
  | { phase: "lead"; left: number }
  /** Between the two sides. */
  | { phase: "switch"; left: number }
  /**
   * The clock is running on `side`. `held` is whole seconds done on this side, `left` whole seconds to the
   * target (below zero once a count-up passes it), and `over` says the target has been reached.
   */
  | { phase: "work"; side: 1 | 2; held: number; left: number; over: boolean }
  /** A countdown that ran out; `at` is how long after the start it did. */
  | { phase: "done"; at: number };

const SEC = 1000;

/** Where a timer started `ms` ago is now. */
export function timerAt(spec: TimerSpec, ms: number): TimerState {
  const target = Math.max(1, Math.round(spec.target));
  const lead = LEAD_SEC * SEC;
  if (ms < lead) return { phase: "lead", left: Math.ceil((lead - ms) / SEC) };
  const t = ms - lead;
  if (spec.up) {
    const held = Math.floor(t / SEC);
    return { phase: "work", side: 1, held, left: target - held, over: held >= target };
  }
  const work = target * SEC;
  if (t < work) return { phase: "work", side: 1, held: Math.floor(t / SEC), left: Math.ceil((work - t) / SEC), over: false };
  if (spec.sides === 1) return { phase: "done", at: lead + work };
  const sw = SWITCH_SEC * SEC;
  if (t < work + sw) return { phase: "switch", left: Math.ceil((work + sw - t) / SEC) };
  const t2 = t - work - sw;
  if (t2 < work) return { phase: "work", side: 2, held: Math.floor(t2 / SEC), left: Math.ceil((work - t2) / SEC), over: false };
  return { phase: "done", at: lead + 2 * work + sw };
}

/** How long a timer takes to run out (null for a count-up, which runs until the set is logged). */
export function timerLength(spec: TimerSpec): number | null {
  if (spec.up) return null;
  const work = Math.max(1, Math.round(spec.target)) * SEC;
  return LEAD_SEC * SEC + work + (spec.sides === 2 ? SWITCH_SEC * SEC + work : 0);
}

/**
 * What Log set saves when it's tapped with the timer at `state`: the seconds actually held. Null keeps what's
 * dialled in (Log set during the lead-in logs the set as planned). A hold stopped on the second side keeps the
 * first side's full time and the second side's own (`repsR`, the store's right side).
 */
export function timerHeld(spec: TimerSpec, state: TimerState): { reps: number; repsR?: number } | null {
  const target = Math.max(1, Math.round(spec.target));
  switch (state.phase) {
    case "lead":
      return null;
    case "done":
    case "switch":
      return { reps: target };
    case "work":
      if (state.side === 2) return { reps: target, repsR: Math.max(0, state.held) };
      return { reps: Math.max(1, state.held) };
  }
}

/** A stable key for a beep or cue, so each one plays once however often the screen redraws. */
export function cueKey(state: TimerState): string {
  switch (state.phase) {
    case "lead":
    case "switch":
      return `${state.phase}:${state.left}`;
    case "work":
      return `work:${state.side}:${state.left}`;
    case "done":
      return "done";
  }
}

/** One stretch of a running timer, as the lock screen and the watches show it: counts down to `to`, or up from `from`. */
export interface TimerPhase {
  phase: "lead" | "switch" | "work";
  side?: 1 | 2;
  from: number;
  /** Absent for a count-up, which runs until the set is logged. */
  to?: number;
}

/**
 * The whole timer started at `startAt`, phase by phase in wall-clock time, so the live notification, the Live
 * Activity and the watches can step through it on their own clocks while the app is asleep (sessionNotify.ts).
 */
export function timerPhases(spec: TimerSpec, startAt: number): TimerPhase[] {
  const target = Math.max(1, Math.round(spec.target)) * SEC;
  const lead = startAt + LEAD_SEC * SEC;
  const out: TimerPhase[] = [{ phase: "lead", from: startAt, to: lead }];
  if (spec.up) return [...out, { phase: "work", side: 1, from: lead }];
  out.push({ phase: "work", side: 1, from: lead, to: lead + target });
  if (spec.sides === 1) return out;
  const sw = lead + target + SWITCH_SEC * SEC;
  out.push({ phase: "switch", from: lead + target, to: sw }, { phase: "work", side: 2, from: sw, to: sw + target });
  return out;
}
