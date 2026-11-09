import { isNative } from "./juice";

// Appearance (Melvin, 2026-11-09): dark (the default, and the brand), light, or match the system.
// Sets data-theme on <html>; globals.css holds the light token values. Remembered in localStorage
// too, so the next launch paints the right theme before the profile loads.

export type Theme = "dark" | "light" | "system";
const KEY = "liftsmith.theme";

export function savedTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "light" || t === "system" || t === "dark") return t;
  } catch {}
  return "dark";
}

/** Whether the screen is light right now, after resolving "system". */
export function isLight(theme: Theme): boolean {
  if (theme === "light") return true;
  if (theme === "dark") return false;
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: light)").matches;
}

export function applyTheme(theme: Theme = "dark"): void {
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
