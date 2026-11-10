import type { CSSProperties } from "react";

/**
 * Makes a pulsing heart icon (`animate-beat`) beat at the live heart rate rather than the CSS default
 * of once a second, so the icon beside the number keeps time with the number and with the heart on the
 * 3D figure. Readings outside 30 to 240 bpm are clamped, so a bad sensor reading can't make it flicker.
 */
export function beatStyle(bpm: number | null | undefined): CSSProperties | undefined {
  if (!bpm || !Number.isFinite(bpm)) return undefined;
  const rate = Math.min(240, Math.max(30, bpm));
  return { animationDuration: `${(60 / rate).toFixed(3)}s` };
}
