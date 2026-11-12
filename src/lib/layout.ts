// The desktop layout (docs/decisions/desktop-layout.md, Melvin 2026-11-12): on a laptop or desktop
// browser the app gets a sidebar instead of the bottom tab bar, wider pages and centred dialogs instead
// of bottom sheets. Phones, tablets and the Android and iOS apps keep the phone layout ("tablets keep
// the phone layout for now"), so it needs all three: the web (not the native shells), a wide window,
// and a mouse or trackpad as the main pointer (touch tablets report a coarse pointer).
//
// The layout is one attribute on <html>, data-layout="desktop", which the `desk:` Tailwind variant
// (globals.css) reads, so a screen only adds `desk:` classes and never checks the width itself.
import { useSyncExternalStore } from "react";

import { isNative } from "./juice";

/** Wide enough for the sidebar plus a comfortable page, with a fine pointer that can hover. */
export const DESKTOP_QUERY = "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

/** Whether this window should use the desktop layout right now. */
export function isDesktop(): boolean {
  if (isNative() || typeof matchMedia === "undefined") return false;
  return matchMedia(DESKTOP_QUERY).matches;
}

function subscribe(on: () => void): () => void {
  if (typeof matchMedia === "undefined") return () => {};
  const mq = matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", on);
  return () => mq.removeEventListener("change", on);
}

/** The desktop layout, following the window live (a window dragged narrower goes back to the phone layout). */
export function useDesktop(): boolean {
  return useSyncExternalStore(subscribe, isDesktop, () => false);
}

/** Sets the attribute the `desk:` variant reads. */
export function applyLayout(desktop: boolean): void {
  if (typeof document === "undefined") return;
  if (desktop) document.documentElement.dataset.layout = "desktop";
  else delete document.documentElement.dataset.layout;
}
