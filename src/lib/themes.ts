import type { MessageKey } from "@/locales/en";

import type { Stats } from "./derive";
import { t } from "./i18n";
import { anniversaryYears } from "./moments";

// Earned themes and app icons. A theme is a full palette (background tint plus accent) unlocked by
// training milestones derived from stats, never bought and never stored as "earned" (like game.ts).
// Seasonal themes are open to everyone during their season. A cosmetic accent picked in the
// gamification work (profile.cosmetics.accent) wins over the theme's accent.
// Icons are drawn by scripts/make-icons.mjs; Android switches launcher aliases and iOS uses
// alternate app icons (AppIconPlugin), so each earned icon exists on both.

export interface ThemePalette {
  bg: string;
  surface: string;
  raised: string;
  line: string;
  accent: string;
  accentInk: string;
}

export interface Theme {
  id: string;
  /** In the app's language (theme.<id> in src/locales/text/theme.ts). */
  readonly name: string;
  palette: ThemePalette;
  /** How it's earned, shown on the locked tile (theme.<id>.how). */
  readonly how: string;
  /** Which app icon goes with it (null: none). */
  icon: string | null;
  earned(ctx: UnlockContext): boolean;
  /** Months (0-11) when a seasonal theme is open to everyone. */
  season?: number[];
}

export interface UnlockContext {
  stats: Stats;
  /** Weeks in a row meeting the weekly goal (game.ts goalStreak). */
  goalWeeks: number;
  now: number;
}

const BASE = { surface: "#11161d", raised: "#18202a", line: "#232d3a" };

const DATA: Omit<Theme, "name" | "how">[] = [
  {
    id: "midnight",
    icon: "default",
    palette: { bg: "#0a0d12", ...BASE, accent: "#4c8dff", accentInk: "#06122a" },
    earned: () => true,
  },
  {
    id: "forge",
    icon: "forge",
    palette: { bg: "#100b09", surface: "#19120f", raised: "#231a15", line: "#33261f", accent: "#ff7a3d", accentInk: "#2a0e02" },
    earned: (c) => c.stats.totalVolume >= 12_000,
  },
  {
    id: "glacier",
    icon: "glacier",
    palette: { bg: "#081016", surface: "#0e1922", raised: "#15232e", line: "#1f3240", accent: "#5fd4ff", accentInk: "#022230" },
    earned: (c) => c.stats.sessions.length >= 25,
  },
  {
    id: "volt",
    icon: null,
    palette: { bg: "#0b0e0a", surface: "#121810", raised: "#1a2217", line: "#263221", accent: "#b6f23a", accentInk: "#182400" },
    earned: (c) => c.stats.prs.length >= 10,
  },
  {
    id: "aurora",
    icon: "aurora",
    palette: { bg: "#0a0c14", surface: "#11141f", raised: "#181c2b", line: "#252a3d", accent: "#3ee0a8", accentInk: "#032419" },
    earned: (c) => c.goalWeeks >= 8,
  },
  {
    id: "rose",
    icon: null,
    palette: { bg: "#120a0e", surface: "#1b1016", raised: "#25171e", line: "#36222c", accent: "#ff6fa5", accentInk: "#2c0616" },
    earned: (c) => c.stats.sessions.length >= 50,
  },
  {
    id: "abyss",
    icon: null,
    palette: { bg: "#06100f", surface: "#0b1918", raised: "#112322", line: "#1a3331", accent: "#2ed3c6", accentInk: "#012320" },
    earned: (c) => c.stats.totalVolume >= 150_000,
  },
  {
    id: "royal",
    icon: "royal",
    palette: { bg: "#0e0a14", surface: "#160f1f", raised: "#1f162b", line: "#2e2240", accent: "#f2c14e", accentInk: "#2a1d00" },
    earned: (c) => {
      const first = c.stats.sessions.at(-1);
      return !!first && (c.now - first.start >= 365 * 86400_000 || anniversaryYears(first.start, c.now) > 0);
    },
  },
  {
    id: "pumpkin",
    icon: null,
    season: [9],
    palette: { bg: "#0f0b08", surface: "#18120d", raised: "#221a13", line: "#33271c", accent: "#ff9a1f", accentInk: "#2a1500" },
    earned: () => false,
  },
  {
    id: "frost",
    icon: null,
    season: [11],
    palette: { bg: "#090d14", surface: "#0f1520", raised: "#161e2c", line: "#222d40", accent: "#9ec9ff", accentInk: "#0a1a33" },
    earned: () => false,
  },
];

export const THEMES: Theme[] = DATA.map((d) => ({
  ...d,
  get name() {
    return t(`theme.${d.id}` as MessageKey);
  },
  get how() {
    return t(`theme.${d.id}.how` as MessageKey);
  },
}));

export const THEME_BY_ID = new Map(THEMES.map((t) => [t.id, t]));

export function unlocked(t: Theme, c: UnlockContext): boolean {
  if (t.season) return t.season.includes(new Date(c.now).getMonth()) || t.earned(c);
  return t.earned(c);
}

/** The theme to show: the picked one if it's still open (seasons end), otherwise Midnight. */
export function activeTheme(picked: string | undefined, c: UnlockContext): Theme {
  const t = picked ? THEME_BY_ID.get(picked) : undefined;
  return t && unlocked(t, c) ? t : THEMES[0];
}

/** Themes earned since the lifter last looked, for the "new theme unlocked" moment. */
export function newlyUnlocked(seen: readonly string[], c: UnlockContext): Theme[] {
  return THEMES.filter((t) => !t.season && t.id !== "midnight" && unlocked(t, c) && !seen.includes(t.id));
}

export const APP_ICONS = THEMES.filter((t) => t.icon).map((t) => ({ id: t.icon!, theme: t }));

/**
 * Sets the palette on the page. Call applyAccent (cosmetics) after this so a picked accent wins.
 * Earned palettes are dark. On a light screen (Settings › Appearance) only the accent carries over,
 * darkened so text in it keeps its contrast, and the light surfaces from globals.css stay.
 */
export function applyTheme(t: Theme, light = false) {
  if (typeof document === "undefined") return;
  const s = document.documentElement.style;
  const p = t.palette;
  if (light) {
    for (const k of ["--color-bg", "--color-surface", "--color-raised", "--color-line", "--color-accent-ink"]) s.removeProperty(k);
    if (t.id === "midnight") s.removeProperty("--color-accent");
    else s.setProperty("--color-accent", `color-mix(in srgb, ${p.accent} 60%, #000)`);
    return;
  }
  s.setProperty("--color-bg", p.bg);
  s.setProperty("--color-surface", p.surface);
  s.setProperty("--color-raised", p.raised);
  s.setProperty("--color-line", p.line);
  s.setProperty("--color-accent", p.accent);
  s.setProperty("--color-accent-ink", p.accentInk);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", p.bg);
}

// --- App icon (native only) -------------------------------------------------------------------

type IconPlugin = { set(o: { name: string }): Promise<void>; get(): Promise<{ name: string }> };
const iconPlugin = (): IconPlugin | undefined => {
  if (typeof window === "undefined") return undefined;
  const c = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { AppIcon?: IconPlugin } } }).Capacitor;
  return c?.isNativePlatform?.() ? c.Plugins?.AppIcon : undefined;
};

export function appIconSupported(): boolean {
  return !!iconPlugin();
}

export async function setAppIcon(id: string): Promise<boolean> {
  const p = iconPlugin();
  if (!p) return false;
  try {
    await p.set({ name: id });
    return true;
  } catch {
    return false;
  }
}
