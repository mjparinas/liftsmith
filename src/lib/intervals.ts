// The interval timer (Tools › Interval timer and /tools/interval-timer/): EMOM, Tabata and custom work and rest
// rounds. Pure: where a plan is at a given moment, so the screen can work it out from the start time on every
// tick, and a phone that slept or a tab in the background never drifts.

export type IntervalMode = "emom" | "tabata" | "custom";
export const INTERVAL_MODES: readonly IntervalMode[] = ["emom", "tabata", "custom"];

export interface IntervalPlan {
  /** Seconds of work in each round. */
  work: number;
  /** Seconds of rest after each round but the last (0 for EMOM, where what's left of the minute is the rest). */
  rest: number;
  rounds: number;
}

/** Seconds of "get ready" before the first round. */
export const LEAD_IN = 5;

export const PRESETS: Record<IntervalMode, IntervalPlan> = {
  emom: { work: 60, rest: 0, rounds: 10 },
  tabata: { work: 20, rest: 10, rounds: 8 },
  custom: { work: 40, rest: 20, rounds: 6 },
};

export const LIMITS = { work: [5, 600], rest: [0, 600], rounds: [1, 99] } as const;

export function clampPlan(p: IntervalPlan): IntervalPlan {
  const c = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, Math.round(v) || lo));
  return { work: c(p.work, LIMITS.work), rest: c(p.rest, LIMITS.rest), rounds: c(p.rounds, LIMITS.rounds) };
}

/** Whole plan in seconds, lead-in included. */
export function totalSeconds(p: IntervalPlan): number {
  return LEAD_IN + p.rounds * p.work + Math.max(0, p.rounds - 1) * p.rest;
}

export type Phase = "ready" | "work" | "rest" | "done";

export interface IntervalState {
  phase: Phase;
  /** 1-based; 0 during the lead-in. */
  round: number;
  /** Milliseconds left in this phase. */
  left: number;
  /** Milliseconds this phase lasts. */
  length: number;
}

/** Where a plan is `ms` after it started. */
export function stateAt(p: IntervalPlan, ms: number): IntervalState {
  let t = Math.max(0, ms);
  const lead = LEAD_IN * 1000;
  if (t < lead) return { phase: "ready", round: 0, left: lead - t, length: lead };
  t -= lead;
  const work = p.work * 1000;
  const rest = p.rest * 1000;
  const cycle = work + rest;
  for (let round = 1; round <= p.rounds; round++) {
    if (t < work) return { phase: "work", round, left: work - t, length: work };
    t -= work;
    if (round === p.rounds) break;
    if (t < rest) return { phase: "rest", round, left: rest - t, length: rest };
    t -= rest;
    if (cycle <= 0) break;
  }
  return { phase: "done", round: p.rounds, left: 0, length: 0 };
}

/** True when the timer has crossed into a new phase between two moments: the cue for a sound and a buzz. */
export function changed(a: IntervalState, b: IntervalState): boolean {
  return a.phase !== b.phase || a.round !== b.round;
}
