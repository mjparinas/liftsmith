"use client";

import { unlisten, type ListenerHandle } from "./nativeListen";

// Share cards when the lifter takes a screenshot (Melvin, 2026-11-15: "when I take a screenshot on any page, the app
// takes over and does this instead"; docs/decisions/sharing.md "Share cards when you take a screenshot"). The
// screenshot is always taken as usual; the app only hears about it and offers branded cards over the top.
//
// - Android 14+ (ScreenshotsPlugin.java): Activity.ScreenCaptureCallback, only for screenshots of our own window.
//   Older Android can't tell without reading the photo library, so nothing shows there.
// - iOS (ScreenshotsPlugin in DelightPlugins.swift): UIApplication.userDidTakeScreenshotNotification.
// - Web: browsers don't say when a screenshot is taken, so the web app has no sheet (Platform deltas). The same
//   cards are one tap away on Progress there and everywhere (StatsShare.tsx).

type Plugin = {
  isSupported(): Promise<{ supported: boolean }>;
  addListener(event: "screenshot", cb: () => void): ListenerHandle | Promise<ListenerHandle>;
};
type Cap = { isNativePlatform?: () => boolean; Plugins?: { Screenshots?: Plugin } };

const plugin = (): Plugin | undefined => {
  if (typeof window === "undefined") return undefined;
  const c = (window as unknown as { Capacitor?: Cap }).Capacitor;
  return c?.isNativePlatform?.() ? c.Plugins?.Screenshots : undefined;
};

/** Whether this phone can tell the app about screenshots (iOS, Android 14+). */
export async function screenshotsSupported(): Promise<boolean> {
  const p = plugin();
  if (!p) return false;
  try {
    return (await p.isSupported()).supported;
  } catch {
    return false;
  }
}

/** A second screenshot this soon after the sheet opened doesn't open it again (someone saving several pages). */
export const SHOT_GAP_MS = 20_000;

/** Whether a screenshot at `at` should open the sheet, given when it last opened. */
export function takeShot(at: number, last: number | null, gap = SHOT_GAP_MS): boolean {
  return last === null || at - last >= gap;
}

/** Calls `cb` for each screenshot the lifter takes of the app until the returned function is called. */
export function onScreenshot(cb: () => void): () => void {
  const p = plugin();
  if (!p) return () => {};
  return unlisten(p.addListener("screenshot", cb));
}
