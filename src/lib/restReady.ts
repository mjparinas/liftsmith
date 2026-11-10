// Heart-rate-ready rest (polish pass, Melvin 2026-11-10). With a heart rate monitor connected, the
// rest card says when the lifter's heart rate is back near where it was when the last set started, so
// they can go early or know the rest is doing its job. It never ends the rest by itself.

/** Rest this long at least before "ready" is said, so a short set's small spike doesn't count. */
export const READY_MIN_REST_S = 45;
/** Back within this many beats of the heart rate at the start of the set. */
export const READY_MARGIN = 5;
/** The set has to have raised the heart rate this much, or there's nothing to recover from. */
export const READY_MIN_RISE = 10;

interface HrLog {
  startedAt: number;
  hr: readonly number[];
  hrAt: readonly number[];
}

/** The reading nearest before `at` (within 20 s), or null. */
function readingAt(a: HrLog, at: number): number | null {
  let best: number | null = null;
  for (let i = 0; i < a.hr.length; i++) {
    const t = a.startedAt + a.hrAt[i]!;
    if (t <= at && at - t <= 20_000) best = a.hr[i]!;
  }
  return best;
}

/**
 * Heart rate is back down: the bpm at the start of the set, the peak during it and the latest reading.
 * Null when there's no monitor, the rest is too young, or the heart rate is still up.
 */
export function hrReady(a: HrLog, setStart: number, restStart: number, now: number): { start: number; peak: number; bpm: number } | null {
  if (!a.hr.length || now - restStart < READY_MIN_REST_S * 1000) return null;
  const start = readingAt(a, setStart);
  const bpm = readingAt(a, now);
  if (start === null || bpm === null) return null;
  let peak = 0;
  for (let i = 0; i < a.hr.length; i++) {
    const t = a.startedAt + a.hrAt[i]!;
    if (t >= setStart && t <= restStart + 30_000) peak = Math.max(peak, a.hr[i]!);
  }
  if (peak - start < READY_MIN_RISE) return null;
  return bpm <= start + READY_MARGIN ? { start, peak, bpm } : null;
}
