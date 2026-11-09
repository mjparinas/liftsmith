import type { Stats } from "./derive";
import type { Unit } from "./types";
import { fromKg } from "./units";

// Lifetime tonnage, anniversaries, workout-count milestones and comebacks: small moments derived from
// the event log, never stored (like game.ts). Celebrations only; the badges for tonnage and comebacks
// live in the gamification work (achievements "tonnes" and "comeback"), so nothing here awards one.

const DAY = 86400_000;

/** Rough masses, rounded and labelled "about" in the app. Kilograms. */
export const TONNAGE: { kg: number; name: string; emoji: string }[] = [
  { kg: 500, name: "a grand piano", emoji: "🎹" },
  { kg: 1_500, name: "a family car", emoji: "🚗" },
  { kg: 6_000, name: "an African elephant", emoji: "🐘" },
  { kg: 8_000, name: "a T. rex", emoji: "🦖" },
  { kg: 12_000, name: "a double-decker bus", emoji: "🚌" },
  { kg: 30_000, name: "a humpback whale", emoji: "🐋" },
  { kg: 60_000, name: "a battle tank", emoji: "🛡️" },
  { kg: 150_000, name: "a blue whale", emoji: "🐳" },
  { kg: 225_000, name: "the Statue of Liberty", emoji: "🗽" },
  { kg: 420_000, name: "the International Space Station", emoji: "🛰️" },
  { kg: 1_000_000, name: "a million kilograms", emoji: "🏔️" },
  { kg: 7_300_000, name: "the Eiffel Tower's iron", emoji: "🗼" },
];

export type Milestone = (typeof TONNAGE)[number];

/** The biggest thing the lifter has out-lifted so far, and the next one. */
export function tonnage(totalKg: number): { last: Milestone | null; next: Milestone | null; progress: number } {
  let i = -1;
  while (i + 1 < TONNAGE.length && totalKg >= TONNAGE[i + 1].kg) i++;
  const last = i >= 0 ? TONNAGE[i] : null;
  const next = TONNAGE[i + 1] ?? null;
  const from = last?.kg ?? 0;
  return { last, next, progress: next ? Math.min(1, Math.max(0, (totalKg - from) / (next.kg - from))) : 1 };
}

/** The milestone a workout pushed the lifetime total past, if any (the biggest one when several). */
export function crossed(beforeKg: number, afterKg: number): Milestone | null {
  let hit: Milestone | null = null;
  for (const m of TONNAGE) if (beforeKg < m.kg && afterKg >= m.kg) hit = m;
  return hit;
}

/** "152 t" in kilograms, "335,100 lb" in pounds. */
export function fmtTonnage(kg: number, unit: Unit): string {
  if (unit === "lb") return `${Math.round(fromKg(kg, "lb")).toLocaleString("en-US")} lb`;
  if (kg >= 1000) return `${(kg / 1000).toLocaleString("en-US", { maximumFractionDigits: kg >= 100_000 ? 0 : 1 })} t`;
  return `${Math.round(kg).toLocaleString("en-US")} kg`;
}

export const COUNT_MILESTONES = [10, 25, 50, 100, 150, 200, 250, 300, 365, 400, 500, 750, 1000];

export interface Moment {
  id: string;
  kind: "anniversary" | "count" | "comeback" | "tonnage";
  emoji: string;
  title: string;
  detail: string;
}

function sameDay(a: number, b: number): boolean {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

/** Whole years from `first` to `now` when today is the anniversary of the first workout, else 0. */
export function anniversaryYears(first: number, now: number): number {
  const f = new Date(first);
  const n = new Date(now);
  const years = n.getFullYear() - f.getFullYear();
  if (years < 1) return 0;
  // A first workout on 29 February is celebrated on 28 February in other years.
  const day = f.getMonth() === 1 && f.getDate() === 29 && new Date(n.getFullYear(), 1, 29).getMonth() !== 1 ? 28 : f.getDate();
  return n.getMonth() === f.getMonth() && n.getDate() === day ? years : 0;
}

/** Days since the last workout. */
export function daysAway(stats: Stats, now: number): number | null {
  const last = stats.sessions[0];
  return last ? Math.floor((now - last.start) / DAY) : null;
}

/** A break this long gets a welcome back (readiness.ts already eases the plan after 10 days). */
export const COMEBACK_DAYS = 14;

function weeksText(days: number): string {
  if (days < 21) return `${days} days`;
  if (days < 60) return `${Math.round(days / 7)} weeks`;
  return `${Math.round(days / 30)} months`;
}

/** Moments for the Today screen (before a workout). */
export function todayMoments(stats: Stats, now: number): Moment[] {
  const out: Moment[] = [];
  const first = stats.sessions.at(-1);
  if (first) {
    const y = anniversaryYears(first.start, now);
    if (y > 0 && !stats.sessions.some((s) => sameDay(s.start, now) && s !== first)) {
      out.push({ id: `anniversary-${y}`, kind: "anniversary", emoji: "🎂", title: `${y} year${y > 1 ? "s" : ""} since your first workout`, detail: `${stats.sessions.length} workouts and ${stats.totalSets.toLocaleString("en-US")} sets since then. Happy liftiversary.` });
    }
  }
  const away = daysAway(stats, now);
  if (away !== null && away >= COMEBACK_DAYS) {
    out.push({ id: "comeback", kind: "comeback", emoji: "👋", title: "Welcome back", detail: `It's been ${weeksText(away)}. Today's plan eases you back in, and your streak starts fresh this week. No catching up needed.` });
  }
  return out;
}

/**
 * Moments for the summary after a workout: a count milestone, a tonnage milestone crossed, a comeback
 * finished, and the anniversary when the workout lands on it. `stats` already includes the workout.
 */
export function doneMoments(stats: Stats): Moment[] {
  const out: Moment[] = [];
  const s = stats.sessions[0];
  if (!s) return out;
  const n = stats.sessions.length;
  if (COUNT_MILESTONES.includes(n)) out.push({ id: `count-${n}`, kind: "count", emoji: "🎉", title: `Workout number ${n}`, detail: n >= 100 ? "Triple digits. That's a habit for life." : "Every one of them counted." });
  const hit = crossed(stats.totalVolume - s.volume, stats.totalVolume);
  if (hit) out.push({ id: `tonnage-${hit.kg}`, kind: "tonnage", emoji: hit.emoji, title: `You've now lifted ${hit.name}`, detail: `About ${fmtTonnage(hit.kg, "kg")} in total, one set at a time.` });
  const prev = stats.sessions[1];
  if (prev) {
    const gap = Math.floor((s.start - prev.start) / DAY);
    if (gap >= COMEBACK_DAYS) out.push({ id: "comeback-done", kind: "comeback", emoji: "💪", title: "Comeback complete", detail: `First workout in ${weeksText(gap)}. The hardest one is done.` });
    const first = stats.sessions.at(-1)!;
    const y = anniversaryYears(first.start, s.start);
    if (y > 0) out.push({ id: `anniversary-${y}`, kind: "anniversary", emoji: "🎂", title: `${y} year${y > 1 ? "s" : ""} of lifting`, detail: "You trained on your liftiversary. Fitting." });
  }
  return out;
}
