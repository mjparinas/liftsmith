import { isTeen } from "./teen";
import type { Profile } from "./types";
import { fromKg } from "./units";

// Easter eggs (Melvin, 2026-11-14; docs/decisions/delightful-extras.md "Easter eggs"). Three small secrets that
// sit beside the dance (five quick taps on the 3D figure, lib/demo/dance.ts) and the secret awards:
// - Night owl: a secret award for finishing a workout between midnight and 4 am (achievements.ts `nightOwl`).
// - Seven taps on the app logo (Settings' footer, the desktop sidebar) open a card with the lifetime total in
//   elephants and friends. Seven, on the logo, so it never clashes with the figure's five.
// - Plate math: logging exactly 420 or 1,337 (kg or lb) shows a joke toast once on the device. Never the 420
//   one to anyone under 18, or to anyone whose age the app doesn't know.
// Pure functions here; LogoEgg.tsx and the workout slice call them.

// ---------- Logo taps ----------

/** Taps on the logo that open the card, and the most time allowed between two of them. */
export const LOGO_TAPS = 7;
export const LOGO_TAP_GAP_MS = 900;

/** Counts quick taps on the logo: the streak so far after `now`, and whether it reached LOGO_TAPS (the streak then starts again). */
export function logoTaps(taps: readonly number[], now: number): { taps: number[]; open: boolean } {
  const last = taps[taps.length - 1];
  const next = last !== undefined && now - last >= 0 && now - last <= LOGO_TAP_GAP_MS ? [...taps, now] : [now];
  if (next.length >= LOGO_TAPS) return { taps: [], open: true };
  return { taps: next, open: false };
}

/** Rough masses in kilograms, for fun ("about" in the app). Text is `egg.unit.<id>`, a plural with {n}. */
export const UNITS = [
  { id: "elephant", kg: 6_000, emoji: "🐘" },
  { id: "trex", kg: 8_000, emoji: "🦖" },
  { id: "bus", kg: 12_000, emoji: "🚌" },
  { id: "car", kg: 1_500, emoji: "🚗" },
  { id: "piano", kg: 500, emoji: "🎹" },
  { id: "retriever", kg: 30, emoji: "🐕" },
  { id: "bluewhale", kg: 150_000, emoji: "🐳" },
] as const;

export type UnitId = (typeof UNITS)[number]["id"];

/** How many of each the lifetime total comes to: one decimal under 10, whole numbers from there. */
export function inUnits(totalKg: number): { id: UnitId; emoji: string; n: number }[] {
  const kg = Math.max(0, Number.isFinite(totalKg) ? totalKg : 0);
  return UNITS.map((u) => {
    const raw = kg / u.kg;
    return { id: u.id, emoji: u.emoji, n: raw < 10 ? Math.round(raw * 10) / 10 : Math.round(raw) };
  });
}

// ---------- Plate math ----------

export type PlateJoke = "420" | "1337";

const NEAR = 0.05;
const near = (a: number, b: number) => Math.abs(a - b) < NEAR;

/** The number a set's weight (kilograms) is exactly, in kilograms or in pounds, if it's one of the jokes. */
export function jokeNumber(weightKg: number): PlateJoke | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;
  const lb = fromKg(weightKg, "lb");
  for (const j of [420, 1337] as const) if (near(weightKg, j) || near(lb, j)) return String(j) as PlateJoke;
  return null;
}

/**
 * The joke to show for a logged set, or null: each one once on the device (`seen`), and the 420 one only for
 * someone the app knows is 18 or older.
 */
export function plateJoke(
  weightKg: number,
  profile: Pick<Profile, "birthYear">,
  seen: readonly string[],
  now = Date.now(),
): PlateJoke | null {
  const j = jokeNumber(weightKg);
  if (!j || seen.includes(j)) return null;
  if (j === "420" && (!profile.birthYear || isTeen(profile, now))) return null;
  return j;
}

const SEEN_KEY = "liftsmith.eggs";

/** The jokes this device has shown. */
export function seenJokes(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function markJoke(j: PlateJoke): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...seenJokes(), j])]));
  } catch {
    // Storage off (a private window): the joke may show again, which is fine.
  }
}
