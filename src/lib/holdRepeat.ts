/**
 * Hold-to-repeat timing for every − / + bump button (Melvin, 2026-11-11: "if you hold it down it auto
 * adds … hold it down for a bit before this happens to avoid accidental touches … speed should start
 * slow and ramp up"). Pure numbers, so the feel is tested here and the hook in `ui.tsx` only wires
 * pointer and key events to it.
 *
 * - A tap steps once, when the finger lifts (so a scroll that starts on the button never steps).
 * - Held still for `HOLD_DELAY`, it steps, then keeps stepping: slow at first, faster each step, down
 *   to `FASTEST` (about 16 a second) after about two seconds.
 * - Held longer still, each step grows (`repeatSize`) for boxes whose number can jump: 2 steps at a
 *   time after 20 repeats, 5 after 40, so 60 to 100 kg of body weight in 0.1s doesn't take a minute.
 * - Haptics and the tick sound follow every step while it's slow and are thinned out once it's fast
 *   (`HAPTIC_GAP`, `SOUND_GAP`), so the phone never buzzes non-stop; a change of step size gets its
 *   own tick so the lifter feels the gear change.
 */

/** How long a press is held before it starts repeating, in ms: long enough that a tap never repeats. */
export const HOLD_DELAY = 450;
/** The first gap between repeats, in ms. */
export const SLOWEST = 200;
/** The fastest gap between repeats, in ms. */
export const FASTEST = 60;
/** Each gap is this much of the one before, so the speed eases up rather than jumping. */
export const RAMP = 0.86;
/** A finger that slides this far (px) from where it pressed is scrolling or changing its mind: stop. */
export const MOVE_SLOP = 12;
/** At most one haptic per this many ms while repeating. */
export const HAPTIC_GAP = 110;
/** At most one tick sound per this many ms while repeating. */
export const SOUND_GAP = 85;

/** The gap in ms after the `n`th repeat (1-based) before the next one. */
export function repeatGap(n: number): number {
  return Math.max(FASTEST, Math.round(SLOWEST * RAMP ** Math.max(0, n - 1)));
}

/** How many steps the `n`th repeat (1-based) moves at once; 1 for a tap. */
export function repeatSize(n: number): 1 | 2 | 5 {
  return n > 40 ? 5 : n > 20 ? 2 : 1;
}

/** Whether feedback last given at `last` (ms, or null for never) is due again at `now`. */
export function due(last: number | null, now: number, gap: number): boolean {
  return last === null || now - last >= gap;
}
