"use client";

import { useSyncExternalStore } from "react";

// The app is "away" when its page is hidden: the phone is locked, another app is in front, or the browser
// tab is in the background. Timers, cameras and refreshes stop then and pick up again on return, so a
// backgrounded app doesn't keep waking the phone (docs/decisions/battery.md).

/** True while the app is on screen (always true outside a browser). */
export function isVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState !== "hidden";
}

/** Calls `cb` with the new state each time the app goes to the background or comes back. Returns an unsubscribe function. */
export function onVisibility(cb: (visible: boolean) => void): () => void {
  if (typeof document === "undefined") return () => {};
  const on = () => cb(isVisible());
  document.addEventListener("visibilitychange", on);
  return () => document.removeEventListener("visibilitychange", on);
}

/** `isVisible()` as React state. */
export function useVisible(): boolean {
  return useSyncExternalStore(onVisibility, isVisible, () => true);
}
