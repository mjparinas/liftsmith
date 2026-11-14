// Workout length covers the whole workout (Melvin, 2026-11-14): the slider on Today sets the total time, and each
// part that's on (warm-up, rehab, cardio, cool-down) takes its minutes out of the lifting. Lifting keeps a floor;
// when the parts would squeeze it below that, the cardio shrinks first, then the workout runs over the slider.
// Pure and derived every time: nothing here is stored (sessions-with-parts.md, "Workout length").

/** Lifting never gets less than this when other parts are on (minutes). */
export const LIFT_FLOOR = 15;
/** The cardio part is never cut below this (minutes). */
export const CARDIO_FLOOR = 5;
/** What a warm-up or cool-down part takes from the total (the stretch suggestion aims for 5 minutes). */
export const STRETCH_PART_MIN = 5;

export type SplitPart = "warm" | "lift" | "rehab" | "cardio" | "cool";

/** Minutes for each part that's on (0 or missing when off) and the slider's total. */
export interface SplitInput {
  total: number;
  /** False when the lifter switched lifting off for today (cardio and stretches only); on when missing. */
  lift?: boolean;
  warm?: number;
  rehab?: number;
  cardio?: number;
  cool?: number;
}

export interface SessionSplit {
  /** What the workout adds up to: the slider's total, or more when lifting's floor was kept (`over`). */
  total: number;
  warm: number;
  lift: number;
  rehab: number;
  cardio: number;
  cool: number;
  /** Minutes taken off the cardio part so lifting keeps its floor. */
  cardioCut: number;
  /** Minutes the workout runs over the slider because lifting kept its floor after the cardio was cut. */
  over: number;
  /** Lifting is off today: the cardio takes the lifting's time, or the workout is just its parts. */
  noLift: boolean;
}

const whole = (n: number | undefined) => Math.max(0, Math.round(n ?? 0) || 0);

/**
 * Splits the slider's total between the parts: every part that's on keeps its own minutes and lifting gets the
 * rest. Lifting keeps at least LIFT_FLOOR (or the whole total when that's less and nothing else is on); the cardio
 * shrinks first, never below CARDIO_FLOOR, and whatever is still missing makes the workout run over.
 */
export function splitSession(input: SplitInput): SessionSplit {
  const total = whole(input.total);
  const warm = whole(input.warm);
  const rehab = whole(input.rehab);
  const cool = whole(input.cool);
  let cardio = whole(input.cardio);
  // Lifting off (Melvin, 2026-11-14: "some days i might want to only do cardio and stretch"): the cardio fills what
  // the slider leaves, never below its floor; without cardio the workout is as long as its parts.
  if (input.lift === false) {
    const fixed = warm + rehab + cool;
    if (cardio > 0) cardio = Math.max(CARDIO_FLOOR, total - fixed);
    const sum = fixed + cardio;
    return { total: sum, warm, lift: 0, rehab, cardio, cool, cardioCut: 0, over: Math.max(0, sum - total), noLift: true };
  }
  const others = warm + rehab + cardio + cool;
  const floor = others > 0 ? LIFT_FLOOR : Math.min(LIFT_FLOOR, total);
  let lift = total - others;
  let cardioCut = 0;
  if (lift < floor) {
    cardioCut = Math.min(floor - lift, Math.max(0, cardio - CARDIO_FLOOR));
    cardio -= cardioCut;
    lift += cardioCut;
  }
  const over = Math.max(0, floor - lift);
  lift += over;
  return { total: warm + lift + rehab + cardio + cool, warm, lift, rehab, cardio, cool, cardioCut, over, noLift: false };
}

/** The parts with minutes, in the order they run, for the split bar under the slider. */
export function splitParts(s: SessionSplit): { kind: SplitPart; minutes: number }[] {
  return (["warm", "lift", "rehab", "cardio", "cool"] as const).filter((k) => s[k] > 0).map((kind) => ({ kind, minutes: s[kind] }));
}

/** Whether anything besides lifting is on, so the split bar is worth showing. */
export const hasOtherParts = (s: SessionSplit | null | undefined): s is SessionSplit => !!s && s.warm + s.rehab + s.cardio + s.cool > 0;
