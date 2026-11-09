import { dedupe, derive, weekOf } from "./derive";
import { EXERCISE_BY_ID } from "./exercises";
import { tonnage } from "./moments";
import { type AppEvent, type Muscle, type SetEvent } from "./types";

// The monthly and yearly recap ("your year in lifting"). Derived from events for a period, never
// stored, so every device shows the same recap. Shown on Progress and shareable as an image.

export type Period = { kind: "month" | "year"; start: number; end: number };

export function monthOf(ms: number): Period {
  const d = new Date(ms);
  return { kind: "month", start: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), end: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() };
}

export function yearOf(ms: number): Period {
  const y = new Date(ms).getFullYear();
  return { kind: "year", start: new Date(y, 0, 1).getTime(), end: new Date(y + 1, 0, 1).getTime() };
}

export function periodLabel(p: Period): string {
  const d = new Date(p.start);
  return p.kind === "year" ? String(d.getFullYear()) : d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/**
 * The recap to offer now: last month's in the first 7 days of a month, last year's from 26 December to
 * 7 January (year in review season), otherwise the month so far.
 */
export function suggestedPeriod(now: number): Period {
  const d = new Date(now);
  if ((d.getMonth() === 11 && d.getDate() >= 26)) return yearOf(now);
  if (d.getMonth() === 0 && d.getDate() <= 7) return yearOf(new Date(d.getFullYear() - 1, 6, 1).getTime());
  if (d.getDate() <= 7) return monthOf(new Date(d.getFullYear(), d.getMonth() - 1, 15).getTime());
  return monthOf(now);
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface Recap {
  period: Period;
  label: string;
  workouts: number;
  sets: number;
  reps: number;
  volumeKg: number;
  seconds: number;
  prs: { exerciseId: string; name: string; weight: number; reps: number }[];
  topExercise: { id: string; name: string; sets: number } | null;
  topMuscle: { muscle: Muscle; sets: number } | null;
  favouriteDay: string | null;
  timeOfDay: "early bird" | "lunchtime lifter" | "after-work lifter" | "night owl" | null;
  heaviest: { exerciseId: string; name: string; weight: number } | null;
  /** Distinct weeks with a workout, against the weeks in the period so far. */
  activeWeeks: number;
  weeks: number;
  /** Change in volume against the period before, as a fraction (0.12 = 12% more). Null with no data then. */
  volumeChange: number | null;
  /** The biggest tonnage comparison the period's volume beats. */
  likeA: string | null;
  avgHr: number | null;
}

function shift(p: Period, by: number): Period {
  const d = new Date(p.start);
  const s = p.kind === "year" ? new Date(d.getFullYear() + by, 0, 1) : new Date(d.getFullYear(), d.getMonth() + by, 1);
  const e = p.kind === "year" ? new Date(d.getFullYear() + by + 1, 0, 1) : new Date(d.getFullYear(), d.getMonth() + by + 1, 1);
  return { kind: p.kind, start: s.getTime(), end: e.getTime() };
}

function topOf<K>(m: Map<K, number>): [K, number] | null {
  let best: [K, number] | null = null;
  for (const [k, v] of m) if (!best || v > best[1]) best = [k, v];
  return best;
}

export function recap(events: readonly AppEvent[], period: Period, now: number): Recap {
  const all = dedupe(events);
  const inP = (at: number) => at >= period.start && at < period.end;
  const sets = all.filter((e): e is SetEvent => e.type === "set" && inP(e.at));
  // PRs need the history before the period too, so derive over everything up to its end.
  const stats = derive(all.filter((e) => e.at < period.end), Math.min(now, period.end - 1));
  const sessions = stats.sessions.filter((s) => inP(s.start));
  const prs = stats.prs.filter((p) => inP(p.at));
  const bestPr = new Map<string, (typeof prs)[number]>();
  for (const p of prs) if (!bestPr.has(p.exerciseId) || p.e1rm > bestPr.get(p.exerciseId)!.e1rm) bestPr.set(p.exerciseId, p);

  const byEx = new Map<string, number>();
  const byMuscle = new Map<Muscle, number>();
  let heaviest: Recap["heaviest"] = null;
  for (const s of sets) {
    byEx.set(s.exerciseId, (byEx.get(s.exerciseId) ?? 0) + 1);
    const ex = EXERCISE_BY_ID.get(s.exerciseId);
    for (const m of ex?.primary ?? []) byMuscle.set(m, (byMuscle.get(m) ?? 0) + 1);
    if (ex && ex.load === "barbell" && (!heaviest || s.weight > heaviest.weight)) heaviest = { exerciseId: s.exerciseId, name: ex.name, weight: s.weight };
  }
  const topEx = topOf(byEx);
  const topM = topOf(byMuscle);

  const days = new Map<number, number>();
  const hours = { early: 0, lunch: 0, evening: 0, night: 0 };
  for (const s of sessions) {
    const d = new Date(s.start);
    days.set(d.getDay(), (days.get(d.getDay()) ?? 0) + 1);
    const h = d.getHours();
    if (h >= 4 && h < 10) hours.early++;
    else if (h >= 10 && h < 15) hours.lunch++;
    else if (h >= 15 && h < 21) hours.evening++;
    else hours.night++;
  }
  const favDay = topOf(days);
  const tod = topOf(new Map(Object.entries(hours)));
  const todLabel = { early: "early bird", lunch: "lunchtime lifter", evening: "after-work lifter", night: "night owl" } as const;

  const until = Math.min(now, period.end);
  const weeks = Math.max(1, Math.ceil((until - weekOf(period.start)) / (7 * 86400_000)));
  const activeWeeks = new Set(sessions.map((s) => weekOf(s.start))).size;

  const prev = shift(period, -1);
  const prevVol = all.filter((e): e is SetEvent => e.type === "set" && e.at >= prev.start && e.at < prev.end).reduce((v, s) => v + s.weight * s.reps, 0);
  const volumeKg = sets.reduce((v, s) => v + s.weight * s.reps, 0);
  const hrs = sessions.map((s) => s.avgHr).filter((x): x is number => !!x);

  return {
    period,
    label: periodLabel(period),
    workouts: sessions.length,
    sets: sets.length,
    reps: sets.reduce((r, s) => r + s.reps, 0),
    volumeKg,
    seconds: sessions.reduce((t, s) => t + s.seconds, 0),
    prs: [...bestPr.values()].sort((a, b) => b.e1rm - a.e1rm).map((p) => ({ exerciseId: p.exerciseId, name: EXERCISE_BY_ID.get(p.exerciseId)?.name ?? p.exerciseId, weight: p.weight, reps: p.reps })),
    topExercise: topEx ? { id: topEx[0], name: EXERCISE_BY_ID.get(topEx[0])?.name ?? topEx[0], sets: topEx[1] } : null,
    topMuscle: topM ? { muscle: topM[0], sets: topM[1] } : null,
    favouriteDay: favDay && sessions.length >= 2 ? WEEKDAYS[favDay[0]] : null,
    timeOfDay: tod && tod[1] > 0 && sessions.length >= 2 ? todLabel[tod[0] as keyof typeof todLabel] : null,
    heaviest,
    activeWeeks,
    weeks: Math.min(weeks, period.kind === "year" ? 53 : 6),
    volumeChange: prevVol > 0 ? volumeKg / prevVol - 1 : null,
    likeA: tonnage(volumeKg).last?.name ?? null,
    avgHr: hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null,
  };
}

/** Months with at least one workout, newest first, for the recap picker. */
export function recapMonths(events: readonly AppEvent[]): Period[] {
  const seen = new Map<number, Period>();
  for (const e of events) if (e.type === "set") {
    const p = monthOf(e.at);
    seen.set(p.start, p);
  }
  return [...seen.values()].sort((a, b) => b.start - a.start);
}

