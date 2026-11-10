import { EXERCISE_BY_ID } from "./exercises";
import { epley } from "./progression";
import { setVolume } from "./sides";
import { MUSCLES, type AppEvent, type Muscle, type SetEvent } from "./types";

// Every stat is recomputed from the event log, never stored (as in Gradelings' derive.ts), so
// merging events from another device can't double count or lose anything.

export interface SessionSummary {
  sessionId: string;
  start: number;
  seconds: number;
  sets: number;
  volume: number;
  exercises: string[];
  avgHr?: number;
  maxHr?: number;
  prs: number;
}

export interface Pr {
  exerciseId: string;
  at: number;
  e1rm: number;
  weight: number;
  reps: number;
}

export interface Stats {
  sessions: SessionSummary[];
  totalSets: number;
  totalVolume: number;
  totalSeconds: number;
  /** Consecutive weeks (from the lifter's first day of the week) with at least one workout, up to this week. */
  weekStreak: number;
  /** Best estimated one-rep max per exercise per session, oldest first. */
  e1rmSeries: Map<string, { at: number; e1rm: number }[]>;
  prs: Pr[];
  /** Hard sets per muscle for each of the last 8 weeks, oldest first. */
  weeklyMuscleSets: { weekStart: number; sets: Record<Muscle, number> }[];
}

export function dedupe(events: readonly AppEvent[]): AppEvent[] {
  const seen = new Set<string>();
  const out: AppEvent[] = [];
  for (const e of [...events].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

/**
 * The first day of the week for streaks, quests, recaps and weekly stats: 1 Monday (default) or 0
 * Sunday (Settings › Workout preferences). Set once from the profile by the store, like `feel` in
 * juice.ts, so every weekly calculation agrees without threading the profile through each one.
 */
let firstDay: 0 | 1 = 1;
export function setWeekStart(day: 0 | 1 | undefined) {
  firstDay = day === 0 ? 0 : 1;
}
export function weekStartDay(): 0 | 1 {
  return firstDay;
}

/** Local midnight at the start of the week holding `ms`. */
export function weekOf(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 7 - firstDay) % 7));
  return d.getTime();
}

export function derive(events: readonly AppEvent[], now: number): Stats {
  const sorted = dedupe(events);
  const sets = sorted.filter((e): e is SetEvent => e.type === "set");
  const bySession = new Map<string, SetEvent[]>();
  for (const s of sets) bySession.set(s.sessionId, [...(bySession.get(s.sessionId) ?? []), s]);
  const ends = new Map(sorted.filter((e) => e.type === "sessionEnd").map((e) => [e.sessionId, e]));

  const best = new Map<string, number>();
  const e1rmSeries = new Map<string, { at: number; e1rm: number }[]>();
  const prs: Pr[] = [];
  const sessions: SessionSummary[] = [];

  for (const [sessionId, list] of bySession) {
    const perEx = new Map<string, SetEvent>();
    for (const s of list) {
      if (s.weight <= 0) continue;
      const cur = perEx.get(s.exerciseId);
      if (!cur || epley(s.weight, s.reps) > epley(cur.weight, cur.reps)) perEx.set(s.exerciseId, s);
    }
    let prCount = 0;
    for (const [exId, s] of perEx) {
      const e1 = epley(s.weight, s.reps);
      e1rmSeries.set(exId, [...(e1rmSeries.get(exId) ?? []), { at: s.at, e1rm: Math.round(e1 * 10) / 10 }]);
      const prev = best.get(exId);
      if (prev !== undefined && e1 > prev + 0.01) {
        prs.push({ exerciseId: exId, at: s.at, e1rm: e1, weight: s.weight, reps: s.reps });
        prCount++;
      }
      if (prev === undefined || e1 > prev) best.set(exId, e1);
    }
    const end = ends.get(sessionId);
    const start = list[0].at;
    sessions.push({
      sessionId,
      start,
      seconds: end?.type === "sessionEnd" ? end.seconds : Math.round((list.at(-1)!.at - start) / 1000),
      sets: list.length,
      volume: list.reduce((v, s) => v + setVolume(s), 0),
      exercises: [...new Set(list.map((s) => s.exerciseId))],
      avgHr: end?.type === "sessionEnd" ? end.avgHr : undefined,
      maxHr: end?.type === "sessionEnd" ? end.maxHr : undefined,
      prs: prCount,
    });
  }
  sessions.sort((a, b) => b.start - a.start);

  const thisWeek = weekOf(now);
  const weeks = new Set(sessions.map((s) => weekOf(s.start)));
  let weekStreak = 0;
  // A week in progress without a workout yet doesn't break the streak.
  let w = weeks.has(thisWeek) ? thisWeek : weekOf(thisWeek - 86400_000);
  while (weeks.has(w)) {
    weekStreak++;
    w = weekOf(w - 86400_000);
  }

  const weeklyMuscleSets: Stats["weeklyMuscleSets"] = [];
  for (let i = 7; i >= 0; i--) {
    const ws = weekOf(thisWeek - i * 7 * 86400_000 + 3600_000 * 12);
    const we = ws + 7 * 86400_000;
    const counts = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
    for (const s of sets) {
      if (s.at < ws || s.at >= we) continue;
      const ex = EXERCISE_BY_ID.get(s.exerciseId);
      if (!ex) continue;
      for (const m of ex.primary) counts[m] += 1;
      for (const m of ex.secondary) counts[m] += 0.5;
    }
    weeklyMuscleSets.push({ weekStart: ws, sets: counts });
  }

  return {
    sessions,
    totalSets: sets.length,
    totalVolume: sets.reduce((v, s) => v + setVolume(s), 0),
    totalSeconds: sessions.reduce((t, s) => t + s.seconds, 0),
    weekStreak,
    e1rmSeries,
    prs: prs.sort((a, b) => b.at - a.at),
    weeklyMuscleSets,
  };
}
