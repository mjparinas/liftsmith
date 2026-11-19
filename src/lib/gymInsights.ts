// Insights for the owner of a claimed gym (Melvin, 2026-11-19, gap item 8; docs/decisions/gyms.md "Owner insights"):
// how many lifters train there, the busy and quiet hours, which equipment gets used, and the open problem reports,
// then one thing to do. Shared by the server (src/server/gymInsights.ts) and the app (GymInsights.tsx).
//
// Privacy: built only from anonymous visits (place, weekday, hour, length and the kinds of equipment used; never a
// weight, a rep, an exercise or who), from lifters who left Settings › Your data and privacy › Count my visits on.
// The owner sees nothing but totals and shares until MIN_LIFTERS different lifters trained there in the window.
import { EQUIPMENT, type Equipment } from "./types";

/** The window the insights cover (four whole weeks, so each weekday counts four times) and the one before it. */
export const WINDOW_DAYS = 28;
/** Different lifters a gym needs in the window before hours and equipment show, so no one lifter stands out. */
export const MIN_LIFTERS = 5;
/** A busy cell needs at least this many visits before it's named. */
export const PEAK_MIN = 3;
/** Workouts in the window before equipment nobody used is worth pointing at, and a drop worth naming. */
export const UNUSED_MIN_WORKOUTS = 20;
export const DROP_MIN_BEFORE = 10;
export const DROP_SHARE = 0.2;
/** Visits kept, for the window and the one before it plus a little. */
export const KEEP_DAYS = 70;

export interface GymInsights {
  /** True once MIN_LIFTERS lifters trained here in the window; until then only `lifters` and `issues` are filled. */
  ready: boolean;
  /** Different lifters with a counted workout here in the last 28 days, and in the 28 days before. */
  lifters: number;
  liftersBefore: number;
  workouts: number;
  workoutsBefore: number;
  /** The typical (median) workout length in minutes. */
  minutes: number;
  /** Share of workouts (whole percent) starting in each hour of the day (24) and on each weekday (7, Sunday first). */
  hours: number[];
  days: number[];
  /** The busiest weekday and hour, when one has PEAK_MIN visits or more. */
  peak: { day: number; hour: number } | null;
  /** Share of workouts (whole percent) that used each kind of equipment, most used first. */
  gear: { equipment: Equipment; share: number }[];
  /** Open equipment problem reports and how many days the oldest has been open. */
  issues: number;
  oldestIssueDays: number;
}

/** One anonymous visit as the app sends it (gymVisits.ts). */
export interface GymVisit {
  /** The workout's id, so a retry never counts twice. Hashed on the server, never stored as sent. */
  session: string;
  place: string;
  /** When the workout started, on the lifter's own clock: weekday (Sunday 0) and hour. */
  day: number;
  hour: number;
  /** When it ended (ms), for the window. */
  at: number;
  minutes: number;
  gear: Equipment[];
}

const isEq = (x: unknown): x is Equipment => typeof x === "string" && (EQUIPMENT as readonly string[]).includes(x);

/** A visit from the app, checked: anything malformed is dropped (null). */
export function cleanVisit(x: unknown, now: number): GymVisit | null {
  if (!x || typeof x !== "object") return null;
  const v = x as Record<string, unknown>;
  const int = (k: string, lo: number, hi: number) => {
    const n = v[k];
    return typeof n === "number" && Number.isInteger(n) && n >= lo && n <= hi ? n : null;
  };
  const day = int("day", 0, 6);
  const hour = int("hour", 0, 23);
  const minutes = int("minutes", 1, 600);
  const at = typeof v.at === "number" && v.at <= now + 3_600_000 && v.at > now - 14 * 86_400_000 ? v.at : null;
  if (typeof v.session !== "string" || !/^[\w-]{6,64}$/.test(v.session)) return null;
  if (typeof v.place !== "string" || day === null || hour === null || minutes === null || at === null) return null;
  const gear = Array.isArray(v.gear) ? [...new Set(v.gear.filter(isEq))].slice(0, EQUIPMENT.length) : [];
  return { session: v.session, place: v.place, day, hour, at, minutes, gear };
}

/** A visit row as stored: the weekday, hour, length and equipment, with who it was as a one-way code. */
export interface VisitRow {
  who: string;
  day: number;
  hour: number;
  minutes: number;
  gear: string;
  /** Days since 1970 (UTC) of the visit. */
  date: number;
}

const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

/** The insights from the visits of the last two windows (`today` in days since 1970). */
export function summarize(rows: VisitRow[], today: number, issues: { at: number }[], now: number): GymInsights {
  const from = today - WINDOW_DAYS;
  const cur = rows.filter((r) => r.date > from);
  const before = rows.filter((r) => r.date <= from && r.date > from - WINDOW_DAYS);
  const lifters = new Set(cur.map((r) => r.who)).size;
  const oldest = issues.reduce((m, i) => Math.min(m, i.at), now);
  const base: GymInsights = {
    ready: lifters >= MIN_LIFTERS,
    lifters,
    liftersBefore: 0,
    workouts: 0,
    workoutsBefore: 0,
    minutes: 0,
    hours: [],
    days: [],
    peak: null,
    gear: [],
    issues: issues.length,
    oldestIssueDays: issues.length ? Math.floor((now - oldest) / 86_400_000) : 0,
  };
  if (!base.ready) return base;
  const hours = Array.from({ length: 24 }, () => 0);
  const days = Array.from({ length: 7 }, () => 0);
  const cells = new Map<number, number>();
  const gear = new Map<Equipment, number>();
  for (const r of cur) {
    hours[r.hour]! += 1;
    days[r.day]! += 1;
    cells.set(r.day * 24 + r.hour, (cells.get(r.day * 24 + r.hour) ?? 0) + 1);
    for (const g of r.gear.split(",")) if (isEq(g)) gear.set(g, (gear.get(g) ?? 0) + 1);
  }
  let peak: GymInsights["peak"] = null;
  let most = PEAK_MIN - 1;
  for (const [cell, n] of [...cells].sort((a, b) => a[0] - b[0]))
    if (n > most) {
      most = n;
      peak = { day: Math.floor(cell / 24), hour: cell % 24 };
    }
  const lengths = cur.map((r) => r.minutes).sort((a, b) => a - b);
  return {
    ...base,
    liftersBefore: new Set(before.map((r) => r.who)).size,
    workouts: cur.length,
    workoutsBefore: before.length,
    minutes: lengths[Math.floor(lengths.length / 2)] ?? 0,
    hours: hours.map((n) => pct(n, cur.length)),
    days: days.map((n) => pct(n, cur.length)),
    peak,
    gear: [...gear]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([equipment, n]) => ({ equipment, share: pct(n, cur.length) })),
  };
}

/** Hours of the day worth suggesting as quiet: open on most weekdays, and between 6 AM and 9 PM. */
export function openHours(week: string[][] | null): number[] {
  const out: number[] = [];
  for (let h = 6; h < 21; h++) {
    if (!week) {
      out.push(h);
      continue;
    }
    // Monday to Friday in OpenStreetMap's week (Monday first).
    const open = week.slice(0, 5).filter((ranges) =>
      ranges.some((r) => {
        const [a, b] = r.split("-");
        const from = Number(a!.slice(0, 2));
        const to = Number(b!.slice(0, 2)) + (b!.slice(3) === "00" ? 0 : 1);
        return h >= from && h + 1 <= to;
      }),
    ).length;
    if (open >= 3) out.push(h);
  }
  return out;
}

/** The quietest of those hours by share of workouts, the earliest on a tie; null when the gym has none. */
export function quietHour(ins: Pick<GymInsights, "hours">, open: number[]): number | null {
  let best: number | null = null;
  for (const h of open) if (best === null || (ins.hours[h] ?? 0) < (ins.hours[best] ?? 0)) best = h;
  return best;
}

export type InsightStep =
  | { kind: "issues"; count: number; days: number }
  | { kind: "unused"; equipment: Equipment }
  | { kind: "down"; pct: number }
  | { kind: "quiet"; hour: number; peak: GymInsights["peak"] }
  | { kind: "wait"; more: number }
  | { kind: "keep" };

/**
 * The one thing to do (AGENTS.md "Action over stats"), the first that applies: fix the open problem reports (lifters'
 * plans are avoiding that equipment), check equipment in the gym's setup nobody used in four weeks, act on a drop in
 * workouts, tell members the quiet hour, else keep going. Before the gym has enough lifters, how many more it needs.
 */
export function insightStep(ins: GymInsights, kit: Equipment[], open: number[]): InsightStep {
  if (ins.issues > 0) return { kind: "issues", count: ins.issues, days: ins.oldestIssueDays };
  if (!ins.ready) return { kind: "wait", more: MIN_LIFTERS - ins.lifters };
  if (ins.workouts >= UNUSED_MIN_WORKOUTS) {
    const used = new Set(ins.gear.map((g) => g.equipment));
    const unused = kit.find((e) => !used.has(e) && e !== "bands");
    if (unused) return { kind: "unused", equipment: unused };
  }
  if (ins.workoutsBefore >= DROP_MIN_BEFORE && ins.workouts < ins.workoutsBefore * (1 - DROP_SHARE))
    return { kind: "down", pct: Math.round((1 - ins.workouts / ins.workoutsBefore) * 100) };
  const hour = quietHour(ins, open);
  if (hour !== null) return { kind: "quiet", hour, peak: ins.peak };
  return { kind: "keep" };
}
