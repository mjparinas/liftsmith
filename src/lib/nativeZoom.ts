/**
 * The Android and iOS apps fill the screen and don't pinch or double-tap zoom (Melvin, 2026-11-14:
 * "When you're in the mobile app, don't let users pinch and zoom, just use the full viewport").
 * Text size follows the phone's own setting instead (a11y.ts, Settings › Accessibility), and maps, the
 * 3D figures and charts handle their own gestures, so nothing needs the page zoom. The website and the
 * web app keep zoom (WCAG 1.4.4), so this only runs inside the native shells, which also turn zoom
 * off in the WebView itself (MainActivity.java, MainViewController in WorkoutSessionPlugin.swift).
 */

/** The viewport the native shells use: the full screen under the bars (safe areas), at a fixed scale. */
export const NATIVE_VIEWPORT =
  "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

type Cap = { isNativePlatform?: () => boolean };

/** Locks the page's scale in the Android and iOS apps; does nothing on the web. Returns whether it did. */
export function lockNativeZoom(doc: Document = document): boolean {
  const cap = (globalThis as { Capacitor?: Cap }).Capacitor;
  if (!cap?.isNativePlatform?.()) return false;
  let meta = doc.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) {
    meta = doc.createElement("meta");
    meta.name = "viewport";
    doc.head.appendChild(meta);
  }
  meta.content = NATIVE_VIEWPORT;
  doc.documentElement.dataset.native = "";
  return true;
}
