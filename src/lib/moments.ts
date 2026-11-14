import type { Stats } from "./derive";
import { num, t } from "./i18n";
import { epley, TIMED } from "./progression";
import type { AppEvent, SetEvent, Unit } from "./types";
import { fromKg } from "./units";

// Lifetime tonnage, anniversaries, workout-count milestones and comebacks: small moments derived from
// the event log, never stored (like game.ts). Celebrations only; the badges for tonnage and comebacks
// live in the gamification work (achievements "tonnes" and "comeback"), so nothing here awards one.

const DAY = 86400_000;

/** Rough masses, rounded and labelled "about" in the app. Kilograms. The name is read from the language catalogue (`ton.<id>`). */
const TONNAGE_ROWS = [
  { kg: 500, id: "piano", emoji: "🎹" },
  { kg: 1_500, id: "car", emoji: "🚗" },
  { kg: 6_000, id: "elephant", emoji: "🐘" },
  { kg: 8_000, id: "trex", emoji: "🦖" },
  { kg: 12_000, id: "bus", emoji: "🚌" },
  { kg: 30_000, id: "humpback", emoji: "🐋" },
  { kg: 60_000, id: "tank", emoji: "🛡️" },
  { kg: 150_000, id: "bluewhale", emoji: "🐳" },
  { kg: 225_000, id: "liberty", emoji: "🗽" },
  { kg: 420_000, id: "iss", emoji: "🛰️" },
  { kg: 1_000_000, id: "million", emoji: "🏔️" },
  { kg: 7_300_000, id: "eiffel", emoji: "🗼" },
] as const;
export const TONNAGE: { kg: number; id: (typeof TONNAGE_ROWS)[number]["id"]; name: string; emoji: string }[] = TONNAGE_ROWS.map((r) => ({
  ...r,
  get name() {
    return t(`ton.${r.id}`);
  },
}));

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
  if (unit === "lb") return `${num(Math.round(fromKg(kg, "lb")))} lb`;
  if (kg >= 1000) return `${num(kg / 1000, { maximumFractionDigits: kg >= 100_000 ? 0 : 1 })} t`;
  return `${num(Math.round(kg))} kg`;
}

export const COUNT_MILESTONES = [10, 25, 50, 100, 150, 200, 250, 300, 365, 400, 500, 750, 1000];

export interface Moment {
  id: string;
  kind: "anniversary" | "count" | "comeback" | "tonnage";
  emoji: string;
  title: string;
  detail: string;
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

/** Days the anniversary card stays on Today after the day itself, for lifters who don't open the app that day. */
export const ANNIVERSARY_DAYS = 7;

/**
 * The anniversary of the first workout showing now: whole years and the day it fell on, from the day itself through
 * the next ANNIVERSARY_DAYS - 1 days, else null.
 */
export function anniversaryNear(first: number, now: number): { years: number; day: number } | null {
  for (let back = 0; back < ANNIVERSARY_DAYS; back++) {
    const d = new Date(now);
    d.setDate(d.getDate() - back);
    const years = anniversaryYears(first, d.getTime());
    if (years > 0) {
      d.setHours(0, 0, 0, 0);
      return { years, day: d.getTime() };
    }
  }
  return null;
}

/** A best set on one lift: weight in kg and reps. */
export interface LiftSet {
  weight: number;
  reps: number;
}

/** Day one against today, for the anniversary card and its share card. Weights in kg. */
export interface AnniversaryLook {
  years: number;
  /** The day the anniversary fell on (local midnight), which keys its dismissal. */
  day: number;
  firstAt: number;
  dayOne: { sets: number; volume: number };
  today: { workouts: number; sets: number; volume: number };
  /** The lift from the first workout that went up the most, by estimated one-rep max, if any went up. */
  lift?: { exerciseId: string; then: LiftSet; best: LiftSet; pct: number };
}

/**
 * The anniversary of the first workout, compared: what day one was (sets, volume) and what's been done since
 * (workouts, sets, total lifted), plus the lift from that first workout that has grown most. Null when no
 * anniversary is showing. Derived from the event log, like every other moment.
 */
export function anniversaryLook(events: readonly AppEvent[], stats: Stats, now: number): AnniversaryLook | null {
  const first = stats.sessions.at(-1);
  if (!first || stats.sessions.length < 2) return null;
  const near = anniversaryNear(first.start, now);
  if (!near) return null;
  const best = (sets: { weight: number; reps: number }[]) => {
    let b: LiftSet | null = null;
    for (const s of sets)
      if (s.weight > 0 && (!b || epley(s.weight, s.reps) > epley(b.weight, b.reps))) b = { weight: s.weight, reps: s.reps };
    return b;
  };
  let lift: AnniversaryLook["lift"];
  for (const id of new Set(first.exercises)) {
    if (TIMED.has(id)) continue;
    const all = events.filter((e): e is SetEvent => e.type === "set" && e.exerciseId === id);
    const then = best(all.filter((s) => s.sessionId === first.sessionId));
    const top = best(all);
    if (!then || !top) continue;
    const pct = (epley(top.weight, top.reps) / epley(then.weight, then.reps) - 1) * 100;
    if (pct >= 1 && (!lift || pct > lift.pct)) lift = { exerciseId: id, then, best: top, pct };
  }
  return {
    years: near.years,
    day: near.day,
    firstAt: first.start,
    dayOne: { sets: first.sets, volume: first.volume },
    today: { workouts: stats.sessions.length, sets: stats.totalSets, volume: stats.totalVolume },
    lift,
  };
}

/** Days since the last workout. */
export function daysAway(stats: Stats, now: number): number | null {
  const last = stats.sessions[0];
  return last ? Math.floor((now - last.start) / DAY) : null;
}

/** A break this long gets a welcome back (readiness.ts already eases the plan after 10 days). */
export const COMEBACK_DAYS = 14;

function weeksText(days: number): string {
  if (days < 21) return t("mom.days", { count: days });
  if (days < 60) return t("mom.weeks", { count: Math.round(days / 7) });
  return t("mom.months", { count: Math.round(days / 30) });
}

/** Moments for the Today screen (before a workout). */
export function todayMoments(stats: Stats, now: number): Moment[] {
  const out: Moment[] = [];
  // The anniversary has its own card now (anniversaryLook, AnniversaryCard in Extras.tsx).
  const away = daysAway(stats, now);
  if (away !== null && away >= COMEBACK_DAYS) {
    out.push({ id: "comeback", kind: "comeback", emoji: "👋", title: t("mom.back"), detail: t("mom.backBody", { time: weeksText(away) }) });
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
  if (COUNT_MILESTONES.includes(n))
    out.push({
      id: `count-${n}`,
      kind: "count",
      emoji: "🎉",
      title: t("mom.count", { n }),
      detail: n >= 100 ? t("mom.count100") : t("mom.countBody"),
    });
  const hit = crossed(stats.totalVolume - s.volume, stats.totalVolume);
  if (hit)
    out.push({
      id: `tonnage-${hit.kg}`,
      kind: "tonnage",
      emoji: hit.emoji,
      title: t("mom.ton", { name: hit.name }),
      detail: t("mom.tonBody", { kg: fmtTonnage(hit.kg, "kg") }),
    });
  const prev = stats.sessions[1];
  if (prev) {
    const gap = Math.floor((s.start - prev.start) / DAY);
    if (gap >= COMEBACK_DAYS)
      out.push({
        id: "comeback-done",
        kind: "comeback",
        emoji: "💪",
        title: t("mom.comeback"),
        detail: t("mom.comebackBody", { time: weeksText(gap) }),
      });
    const first = stats.sessions.at(-1)!;
    const y = anniversaryYears(first.start, s.start);
    if (y > 0)
      out.push({
        id: `anniversary-${y}`,
        kind: "anniversary",
        emoji: "🎂",
        title: t("mom.years", { count: y }),
        detail: t("mom.yearsBody"),
      });
  }
  return out;
}
