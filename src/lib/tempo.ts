// Tempo coach (a lab, Settings › Labs, `labTempo`): on tempo and paused lifts it counts each rep's
// phases out loud in sound and haptics, so the lifter can keep their eyes off the screen. The engine
// here is pure: which lifts have a tempo, and the timeline of beats for a set. The component that
// plays it is `workout/TempoCoach.tsx`.
//
// A tempo is a list of phases, each one second or more: lowering ("down", the eccentric), holding
// still ("hold") and lifting ("up", the concentric), in the order the lift does them, so a paused
// deadlift (pull, hold below the knee, finish, lower) works as well as a tempo squat. The seconds come
// from each exercise's own cues ("Take three slow seconds on the way down"), so the coach counts what
// the how-to says. A lift whose cues give no seconds for a phase gets one second (a controlled rep).

export type TempoPhase = "down" | "hold" | "up";

export interface Tempo {
  phases: readonly { phase: TempoPhase; s: number }[];
  /** A pulling lift: the words are "Pull" and "Return" instead of "Lift" and "Lower". */
  pull?: boolean;
}

const p = (phase: TempoPhase, s: number) => ({ phase, s });

/** The lifts that have a tempo, by exercise id, read from their cues in exercises.ts. */
export const TEMPOS: Readonly<Record<string, Tempo>> = {
  "tempo-squat": { phases: [p("down", 3), p("up", 1)] },
  "tempo-goblet-squat": { phases: [p("down", 4), p("hold", 1), p("up", 1)] },
  "tempo-bench-press": { phases: [p("down", 3), p("up", 1)] },
  "tempo-push-up": { phases: [p("down", 4), p("up", 1)] },
  "tempo-split-squat": { phases: [p("down", 3), p("hold", 1), p("up", 1)] },
  "tempo-rdl": { phases: [p("down", 4), p("up", 1)] },
  "pause-squat": { phases: [p("down", 2), p("hold", 2), p("up", 1)] },
  "paused-front-squat": { phases: [p("down", 2), p("hold", 2), p("up", 1)] },
  "paused-bench": { phases: [p("down", 2), p("hold", 1), p("up", 1)] },
  "paused-push-up": { phases: [p("down", 2), p("hold", 2), p("up", 1)] },
  "paused-hack-squat": { phases: [p("down", 2), p("hold", 2), p("up", 1)] },
  "paused-leg-press": { phases: [p("down", 2), p("hold", 2), p("up", 1)] },
  "paused-rdl": { phases: [p("down", 2), p("hold", 2), p("up", 1)] },
  "paused-deadlift": { phases: [p("up", 1), p("hold", 2), p("up", 1), p("down", 2)] },
  "paused-barbell-row": { phases: [p("up", 1), p("hold", 1), p("down", 2)], pull: true },
  "paused-lat-pulldown": { phases: [p("up", 1), p("hold", 1), p("down", 3)], pull: true },
};

/** The tempo of a lift, or undefined when it has none (the coach doesn't show). */
export function tempoOf(exerciseId: string): Tempo | undefined {
  return TEMPOS[exerciseId];
}

/** Seconds of "Get set" before the first rep, counted 3, 2, 1. */
export const LEAD_IN = 3;

/** Seconds one rep takes. */
export const repSeconds = (tempo: Tempo): number => tempo.phases.reduce((n, x) => n + x.s, 0);

export interface Beat {
  /** When it sounds, in ms from the start. */
  at: number;
  /** 0 during the lead-in, then the rep, from 1. */
  rep: number;
  /** "lead" for the lead-in. */
  phase: TempoPhase | "lead";
  /** True on a phase's first second (a new phase gets its own sound and a stronger buzz). */
  start: boolean;
  /** Whole seconds left in this phase, this one included: 3, 2, 1. */
  left: number;
}

/** Every beat of a set of `reps` reps, one a second, then the time the set's count ends. */
export function timeline(tempo: Tempo, reps: number): { beats: Beat[]; end: number } {
  const beats: Beat[] = [];
  let t = 0;
  for (let i = 0; i < LEAD_IN; i++, t++) beats.push({ at: t * 1000, rep: 0, phase: "lead", start: i === 0, left: LEAD_IN - i });
  for (let rep = 1; rep <= Math.max(0, Math.floor(reps)); rep++)
    for (const { phase, s } of tempo.phases)
      for (let i = 0; i < s; i++, t++) beats.push({ at: t * 1000, rep, phase, start: i === 0, left: s - i });
  return { beats, end: t * 1000 };
}

/** The beat in progress `ms` after the start, or undefined once the count has ended (or before it starts). */
export function beatAt(beats: readonly Beat[], end: number, ms: number): Beat | undefined {
  if (ms < 0 || ms >= end) return undefined;
  let found: Beat | undefined;
  for (const b of beats) {
    if (b.at > ms) break;
    found = b;
  }
  return found;
}

/** The word for a phase, as a catalogue key suffix (`tempo.<word>`, and `tempo.s.<word>` for the summary): Lower, Hold, Lift, or Return and Pull on a pulling lift; "lead" is Get set. */
export type PhaseWord = "lead" | "down" | "hold" | "up" | "pull" | "return";

export function phaseWord(tempo: Tempo, phase: Beat["phase"]): PhaseWord {
  if (phase === "lead" || phase === "hold") return phase;
  if (tempo.pull) return phase === "up" ? "pull" : "return";
  return phase;
}
