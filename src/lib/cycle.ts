// Cycle-aware readiness (Melvin, 2026-11-09). Opt-in. The lifter logs the day a period starts; the app
// estimates the phase from their own typical cycle length and turns it into a small, overridable nudge
// to the day's readiness. Evidence that cycle phase changes strength is mixed and individual, so the
// effect is deliberately small and worded as "go by feel", never as a rule. Nothing here leaves the device.
import type { AppEvent, CycleEvent } from "./types";
import { t } from "./i18n";

const DAY = 86_400_000;
export const DEFAULT_CYCLE = 28;

export type Phase = "period" | "follicular" | "ovulation" | "luteal" | "late-luteal";

export interface CycleState {
  /** Day of the cycle, 1 = first day of the last logged period. */
  day: number;
  length: number;
  phase: Phase;
  /** Estimated start of the next period (ms, local midnight). */
  next: number;
}

export const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Period starts, oldest first, one per day. */
export function periodStarts(events: readonly AppEvent[]): number[] {
  return [...new Set(events.filter((e): e is CycleEvent => e.type === "cycle").map((e) => e.day))].sort((a, b) => a - b);
}

/** The lifter's typical cycle length: the median of their last six gaps between 21 and 45 days. */
export function cycleLength(starts: readonly number[]): number {
  const gaps = starts
    .slice(1)
    .map((s, i) => Math.round((s - starts[i]) / DAY))
    .filter((g) => g >= 21 && g <= 45)
    .slice(-6)
    .sort((a, b) => a - b);
  if (!gaps.length) return DEFAULT_CYCLE;
  const m = gaps.length >> 1;
  return gaps.length % 2 ? gaps[m] : Math.round((gaps[m - 1] + gaps[m]) / 2);
}

export function cycleState(events: readonly AppEvent[], now: number): CycleState | null {
  const starts = periodStarts(events);
  const last = starts.at(-1);
  if (last === undefined) return null;
  const length = cycleLength(starts);
  const day = Math.floor((startOfDay(now) - last) / DAY) + 1;
  // Past two cycles with nothing logged, the estimate is a guess; say nothing rather than mislead.
  if (day < 1 || day > length * 2) return null;
  const d = ((day - 1) % length) + 1;
  const ovulation = length - 14;
  const phase: Phase = d <= 4 ? "period" : d < ovulation - 1 ? "follicular" : d <= ovulation + 1 ? "ovulation" : d > length - 5 ? "late-luteal" : "luteal";
  return { day: d, length, phase, next: last + Math.ceil(day / length) * length * DAY };
}

/** Readiness points and the line shown on Today. Small on purpose; the lifter can always override the call. */
export function cycleSignal(state: CycleState | null): { points: number; text: string } | null {
  if (!state) return null;
  switch (state.phase) {
    case "period":
      return { points: -5, text: t("sig.cycle.period", { day: state.day }) };
    case "late-luteal":
      return { points: -4, text: t("sig.cycle.late", { day: state.day }) };
    case "follicular":
      return { points: 3, text: t("sig.cycle.follicular", { day: state.day }) };
    default:
      return { points: 0, text: t("sig.cycle.day", { day: state.day }) };
  }
}
