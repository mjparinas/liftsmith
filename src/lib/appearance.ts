import { useSyncExternalStore } from "react";

import { isNative } from "./juice";

// Appearance (Melvin, 2026-11-09): dark (the default, and the brand), light, or match the system.
// Sets data-theme on <html>; globals.css holds the light token values. (Earned colour themes are
// a separate thing, in themes.ts.) Remembered in localStorage
// too, so the next launch paints the right theme before the profile loads.

export type Appearance = "dark" | "light" | "system";
const KEY = "liftsmith.theme";

export function savedAppearance(): Appearance {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "light" || t === "system" || t === "dark") return t;
  } catch {}
  return "dark";
}

/** Whether the screen is light right now, after resolving "system". */
export function isLight(theme: Appearance): boolean {
  if (theme === "light") return true;
  if (theme === "dark") return false;
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: light)").matches;
}

export function applyAppearance(theme: Appearance = "dark"): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {}
  const light = isLight(theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", light ? "#f4f6f9" : "#0a0d12");
  if (isNative()) {
    void import("@capacitor/status-bar")
      .then(({ StatusBar, Style }) => StatusBar.setStyle({ style: light ? Style.Light : Style.Dark }))
      .catch(() => {});
  }
}

const QUERY = "(prefers-color-scheme: light)";
function subscribe(on: () => void): () => void {
  if (typeof matchMedia === "undefined") return () => {};
  const mq = matchMedia(QUERY);
  mq.addEventListener("change", on);
  return () => mq.removeEventListener("change", on);
}

/** Whether the screen is light, following the phone live when the choice is "Match system". */
export function useLight(theme: Appearance): boolean {
  const system = useSyncExternalStore(
    subscribe,
    () => typeof matchMedia !== "undefined" && matchMedia(QUERY).matches,
    () => false,
  );
  return theme === "light" || (theme === "system" && system);
}
