import type { MessageKey } from "@/locales/en";

import { achievements, achName, context, TIER_LABEL, tierNames, type Achievement, type Tier } from "./achievements";
import type { Stats } from "./derive";
import { goalStreak } from "./game";
import { t } from "./i18n";
import { anniversaryYears } from "./moments";
import type { AppEvent, Profile } from "./types";

// Earned themes and app icons. A theme is a full palette (background tint plus accent) unlocked by
// a badge (one tier of an achievement, achievements.ts; Melvin, 2026-11-11: one set of goals, themes
// are their rewards), derived from events, never bought and never stored as "earned" (like game.ts).
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
  /** How it's earned, shown on the locked tile: the badge that unlocks it, or theme.<id>.how. */
  readonly how: string;
  /** The badge that unlocks it: an achievement and one of its tiers. */
  badge?: { id: string; tier: Tier };
  /** Which app icon goes with it (null: none). */
  icon: string | null;
  /** Unlocked another way than its badge (always open, an anniversary, or kept from an older rule). */
  earned?(ctx: UnlockContext): boolean;
  /** Months (0-11) when a seasonal theme is open to everyone. */
  season?: number[];
}

export interface UnlockContext {
  stats: Stats;
  /** Tiers reached per achievement id (Achievement.level). */
  badges: ReadonlyMap<string, number>;
  now: number;
}

/** Everything unlocked() needs, from the event log. */
export function unlockContext(events: readonly AppEvent[], stats: Stats, profile: Profile, now: number): UnlockContext {
  return unlockFrom(achievements(context(events, stats, profile, goalStreak(stats, profile, now).best)), stats, now);
}

/** The same, from achievements already worked out (`game().achievements`), so the app doesn't count them twice. */
export function unlockFrom(list: readonly Achievement[], stats: Stats, now: number): UnlockContext {
  return { stats, badges: new Map(list.map((a) => [a.id, a.level])), now };
}

/** Has the lifter reached this tier of this achievement? */
export function hasBadge(c: UnlockContext, id: string, tier: Tier): boolean {
  return (c.badges.get(id) ?? 0) >= tierNames(id).indexOf(tier) + 1;
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
    badge: { id: "tonnes", tier: "bronze" },
  },
  {
    id: "glacier",
    icon: "glacier",
    palette: { bg: "#081016", surface: "#0e1922", raised: "#15232e", line: "#1f3240", accent: "#5fd4ff", accentInk: "#022230" },
    badge: { id: "workouts", tier: "silver" },
  },
  {
    id: "volt",
    icon: null,
    palette: { bg: "#0b0e0a", surface: "#121810", raised: "#1a2217", line: "#263221", accent: "#b6f23a", accentInk: "#182400" },
    badge: { id: "prs", tier: "silver" },
  },
  {
    id: "aurora",
    icon: "aurora",
    palette: { bg: "#0a0c14", surface: "#11141f", raised: "#181c2b", line: "#252a3d", accent: "#3ee0a8", accentInk: "#032419" },
    badge: { id: "goal-streak", tier: "silver" },
  },
  {
    id: "rose",
    icon: null,
    palette: { bg: "#120a0e", surface: "#1b1016", raised: "#25171e", line: "#36222c", accent: "#ff6fa5", accentInk: "#2c0616" },
    badge: { id: "sets", tier: "silver" },
    // Rose was 50 workouts before themes moved onto badges; anyone who had it keeps it.
    earned: (c) => c.stats.sessions.length >= 50,
  },
  {
    id: "abyss",
    icon: null,
    palette: { bg: "#06100f", surface: "#0b1918", raised: "#112322", line: "#1a3331", accent: "#2ed3c6", accentInk: "#012320" },
    badge: { id: "tonnes", tier: "silver" },
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
    // Pro members' own theme (Melvin, 2026-11-11), from the Pro achievement's first badge, kept once earned.
    id: "pro",
    icon: null,
    palette: { bg: "#0d0a16", surface: "#151021", raised: "#1e172e", line: "#2d2342", accent: "#c4a5ff", accentInk: "#1c0c3a" },
    badge: { id: "pro", tier: "bronze" },
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
    return d.badge
      ? t("theme.badge", { badge: achName(d.badge.id), tier: TIER_LABEL[d.badge.tier] })
      : t(`theme.${d.id}.how` as MessageKey);
  },
}));

export const THEME_BY_ID = new Map(THEMES.map((t) => [t.id, t]));

export function unlocked(t: Theme, c: UnlockContext): boolean {
  if (t.season?.includes(new Date(c.now).getMonth())) return true;
  return (t.badge !== undefined && hasBadge(c, t.badge.id, t.badge.tier)) || (t.earned?.(c) ?? false);
}

/** Themes a badge unlocks, for the badge's row on Awards. */
export function themesForBadge(id: string): { tier: Tier; theme: Theme }[] {
  return THEMES.filter((t) => t.badge?.id === id).map((t) => ({ tier: t.badge!.tier, theme: t }));
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
