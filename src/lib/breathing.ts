// The breathing guide on the rest card (Melvin, 2026-11-12: "make it box breathing, maybe even
// customizable"). A pattern is a list of steps, each a few seconds long; `breathAt` says where in
// the cycle a moment falls, so the screen, the cues and the tests read the same numbers.

export type BreathStep = "in" | "sip" | "hold" | "out" | "holdOut";
export type BreathPatternId = "box" | "relax" | "sigh" | "slow" | "custom";

/** The lifter's own pattern: seconds for each of the four sides of the box. */
export interface BreathCustom {
  in: number;
  hold: number;
  out: number;
  holdOut: number;
}

export interface BreathPhase {
  step: BreathStep;
  secs: number;
}

export const BREATH_PATTERNS: readonly BreathPatternId[] = ["box", "relax", "sigh", "slow", "custom"];

/** Box breathing first: it's the default. */
export const DEFAULT_PATTERN: BreathPatternId = "box";

export const DEFAULT_CUSTOM: BreathCustom = { in: 4, hold: 4, out: 4, holdOut: 4 };

/** Limits for the custom steppers: in and out need at least a second, holds can be left out. */
export const CUSTOM_LIMITS: Record<keyof BreathCustom, { min: number; max: number }> = {
  in: { min: 1, max: 12 },
  hold: { min: 0, max: 12 },
  out: { min: 1, max: 12 },
  holdOut: { min: 0, max: 12 },
};

export function clampCustom(c: Partial<BreathCustom> | undefined): BreathCustom {
  const out = { ...DEFAULT_CUSTOM };
  for (const k of Object.keys(CUSTOM_LIMITS) as (keyof BreathCustom)[]) {
    const v = c?.[k];
    const { min, max } = CUSTOM_LIMITS[k];
    if (typeof v === "number" && Number.isFinite(v)) out[k] = Math.min(max, Math.max(min, Math.round(v)));
  }
  return out;
}

/** The steps of a pattern, leaving out holds of 0 s. */
export function breathPattern(id: BreathPatternId, custom?: Partial<BreathCustom>): BreathPhase[] {
  switch (id) {
    case "box":
      return box(DEFAULT_CUSTOM);
    // 4-7-8: in for 4, hold for 7, out for 8.
    case "relax":
      return box({ in: 4, hold: 7, out: 8, holdOut: 0 });
    // The physiological sigh: a breath in, a short second sip on top, then a long breath out.
    case "sigh":
      return [
        { step: "in", secs: 2 },
        { step: "sip", secs: 1 },
        { step: "out", secs: 6 },
      ];
    // The guide's old pattern: in 4, out 6.
    case "slow":
      return box({ in: 4, hold: 0, out: 6, holdOut: 0 });
    case "custom":
      return box(clampCustom(custom));
  }
}

function box(c: BreathCustom): BreathPhase[] {
  const steps: BreathPhase[] = [
    { step: "in", secs: c.in },
    { step: "hold", secs: c.hold },
    { step: "out", secs: c.out },
    { step: "holdOut", secs: c.holdOut },
  ];
  return steps.filter((s) => s.secs > 0);
}

/** "4-4-4-4", "4-7-8", "2-1-6". */
export function patternCounts(phases: readonly BreathPhase[]): string {
  return phases.map((p) => p.secs).join("-");
}

export interface BreathMoment {
  step: BreathStep;
  /** Which step of the pattern, from 0. */
  index: number;
  /** How far through this step, 0 to 1. */
  p: number;
  /** Whole seconds left in this step, counting down to 1. */
  left: number;
  /** How full the lungs are, 0 to 1: rises breathing in, stays on a hold, falls breathing out. */
  size: number;
  /** How far through the whole cycle, 0 to 1. */
  cycle: number;
}

/** Where `secs` into the guide falls in the pattern, cycle after cycle. */
export function breathAt(phases: readonly BreathPhase[], secs: number): BreathMoment {
  const total = phases.reduce((s, p) => s + p.secs, 0);
  if (!phases.length || total <= 0) return { step: "in", index: 0, p: 0, left: 0, size: 0, cycle: 0 };
  const x = ((secs % total) + total) % total;
  let start = 0;
  let size = 0;
  for (let i = 0; i < phases.length; i++) {
    const ph = phases[i]!;
    const after = fullAfter(phases, i, size);
    if (x < start + ph.secs || i === phases.length - 1) {
      const p = Math.min(1, (x - start) / ph.secs);
      return {
        step: ph.step,
        index: i,
        p,
        left: Math.max(1, Math.ceil(ph.secs - (x - start) - 1e-9)),
        size: size + (after - size) * p,
        cycle: x / total,
      };
    }
    size = after;
    start += ph.secs;
  }
  // Unreachable: the loop returns on the last step.
  return { step: "in", index: 0, p: 0, left: 0, size: 0, cycle: 0 };
}

/** Lungs after step i: a breath in fills them (most of the way when a sip follows), out empties them. */
function fullAfter(phases: readonly BreathPhase[], i: number, before: number): number {
  const step = phases[i]!.step;
  if (step === "in") return phases[i + 1]?.step === "sip" ? 0.75 : 1;
  if (step === "sip") return 1;
  if (step === "out") return 0;
  return before;
}
