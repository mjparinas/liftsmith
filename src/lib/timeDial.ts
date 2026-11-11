import { currentTag } from "@/lib/i18n";

// The clock dial's math (TimeDial.tsx): where a number sits on the face, and which number a touch is
// nearest. Pure, so it's tested without a screen. 0 rad is 12 o'clock and angles run clockwise.

/** "18:30" → [18, 30]; anything unreadable is 18:00, the default training time. */
export function parseTime(s: string): [number, number] {
  const m = /^(\d{1,2}):(\d{2})/.exec(s);
  const h = m ? Number(m[1]) : NaN;
  const min = m ? Number(m[2]) : NaN;
  return h >= 0 && h < 24 && min >= 0 && min < 60 ? [h, min] : [18, 0];
}

/** [18, 5] → "18:05", the stored form. */
export const formatTime = (h: number, m: number) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

/** Whether the lifter's language and region write times with AM and PM (en-US, en-CA) or as 0 to 23 (fr, de, ja). */
export function uses12h(tag: string = currentTag()): boolean {
  const cycle = new Intl.DateTimeFormat(tag, { hour: "numeric" }).resolvedOptions().hourCycle;
  return cycle === "h12" || cycle === "h11";
}

/** The clockwise angle (rad, 0 at the top) of a point `dx`, `dy` from the centre (screen y grows down). */
export function angleOf(dx: number, dy: number): number {
  const a = Math.atan2(dx, -dy);
  return a < 0 ? a + 2 * Math.PI : a;
}

/** The nearest of 12 positions round the face (0 at the top) for an angle. */
export const slotOf = (angle: number) => Math.round(angle / (Math.PI / 6)) % 12;

/**
 * The hour a touch picks. A 12-hour face shows 12, 1 … 11 and keeps the half of the day already
 * picked (AM or PM). A 24-hour face, like Android's, has 00 to 11 on the outer ring and 12 to 23 on
 * the inner one; `inner` says which ring the touch is on.
 */
export function hourAt(slot: number, twelve: boolean, pm: boolean, inner: boolean): number {
  if (twelve) return (slot % 12) + (pm ? 12 : 0);
  return inner ? slot + 12 : slot;
}

/** The minute a touch picks, to the nearest 5: training times don't need single minutes. */
export const minuteAt = (slot: number) => slot * 5;

/** Where on the face `slot` sits, as a fraction of the radius from the centre (x right, y down). */
export function slotPoint(slot: number, r: number): { x: number; y: number } {
  const a = (slot * Math.PI) / 6;
  return { x: Math.sin(a) * r, y: -Math.cos(a) * r };
}
