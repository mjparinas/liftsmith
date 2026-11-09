import { isNative } from "./juice";

// Accessibility settings (Melvin, 2026-11-09): text size, colour-blind safe colours and higher
// contrast. They set attributes on <html> that globals.css reads, and are remembered in localStorage
// as well as on the profile, so the next launch paints right before the profile loads.
//
// - Text size scales the root font size; every size in the app is in rem, so all text follows.
//   "Match my phone" is the default: on Android and iOS the phone's own text size (Android font
//   scale, iOS Dynamic Type) is read through @capacitor/text-zoom and applied here, the same way on
//   both. In a browser, the browser's own text size and zoom already apply.
// - Colour-blind safe swaps the status, recovery and heart-rate colours for a palette that stays
//   distinct with red-green and blue-yellow colour blindness (checked by a11y.test.ts).
// - Contrast "More" raises secondary text and borders and drops the decorative glows. "Match my
//   phone" follows the system's increase-contrast setting (prefers-contrast: more).
// - One-handed controls move the weight and rep bumps on the workout screen down beside Log set,
//   with Log set under the thumb of the hand that holds the phone.

export type TextSize = "system" | "100" | "115" | "130" | "150";
export type Colours = "standard" | "cvd";
export type Contrast = "system" | "standard" | "more";
/** One-handed workout controls: off, or docked at the bottom with Log set under that thumb. */
export type Hand = "off" | "right" | "left";
export type A11y = { text?: TextSize; colours?: Colours; contrast?: Contrast; hand?: Hand };

export const TEXT_SIZES: [TextSize, string][] = [["system", "Match my phone"], ["100", "Default"], ["115", "Large"], ["130", "Larger"], ["150", "Largest"]];

const KEY = "liftsmith.a11y";
const TEXT = new Set<TextSize>(["system", "100", "115", "130", "150"]);

/** Tidies a stored value: anything unknown falls back to the default. */
export function cleanA11y(a: unknown): Required<A11y> {
  const o = (a && typeof a === "object" ? a : {}) as Record<string, unknown>;
  return {
    text: TEXT.has(o.text as TextSize) ? (o.text as TextSize) : "system",
    colours: o.colours === "cvd" ? "cvd" : "standard",
    contrast: o.contrast === "more" || o.contrast === "standard" ? o.contrast : "system",
    hand: o.hand === "right" || o.hand === "left" ? o.hand : "off",
  };
}

export function savedA11y(): Required<A11y> {
  try {
    return cleanA11y(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    return cleanA11y(null);
  }
}

/** The root font size in percent for a choice. `phone` is the phone's own text scale (1 = 100%). */
export function textPercent(text: TextSize, phone = 1): number {
  if (text === "system") return Math.round(Math.min(2, Math.max(0.8, phone)) * 100);
  return Number(text);
}

let phoneScale = 1;

export function applyA11y(a: A11y | undefined): void {
  if (typeof document === "undefined") return;
  const c = cleanA11y(a);
  const root = document.documentElement;
  const pct = textPercent(c.text, phoneScale);
  root.style.fontSize = pct === 100 ? "" : `${pct}%`;
  root.dataset.text = String(pct);
  if (c.colours === "cvd") root.dataset.cvd = "on";
  else delete root.dataset.cvd;
  root.dataset.contrast = c.contrast;
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {}
}

/**
 * Reads the phone's text size (Android font scale, iOS Dynamic Type). WKWebView ignores Dynamic Type,
 * and Android's WebView may zoom text by itself; so the WebView's own zoom is pinned at 100% and the
 * phone's size is applied through the root font size instead, one path on both platforms with no
 * double scaling. Called on launch and when the app comes back to the foreground.
 */
export async function readPhoneTextScale(): Promise<number> {
  if (!isNative()) return 1;
  try {
    const { TextZoom } = await import("@capacitor/text-zoom");
    await TextZoom.set({ value: 1 });
    const { value } = await TextZoom.getPreferred();
    phoneScale = value > 0 ? value : 1;
  } catch {
    phoneScale = 1;
  }
  return phoneScale;
}
