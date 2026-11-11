import { dedupe } from "./derive";
import { epley, TIMED } from "./progression";
import type { AppEvent, SetEvent } from "./types";

// One page per exercise (Melvin, 2026-11-11: table stakes). Every past session of the lift, the best
// weight for each rep count, and which way the estimated max is going, turned into one line on what to
// do about it (AGENTS.md: action over stats). Pure views over the event log, never stored.

const DAY = 86_400_000;
const WEEK = 7 * DAY;
/** How far back the trend compares: the last six weeks against the six before. */
export const TREND_WEEKS = 6;
/** No new best for this many weeks counts as stalled (the same line coach's notes use for a stall). */
export const STALL_WEEKS = 3;
/** Rep counts shown in the bests table. */
export const REP_COUNTS = [1, 2, 3, 5, 8, 10, 12, 15] as const;

export interface LiftSession {
  sessionId: string;
  at: number;
  /** Every set, bonus sets included, in the order done. */
  sets: SetEvent[];
  /** Best estimated one-rep max of the session (kg), 0 for bodyweight and timed work. */
  e1rm: number;
}

/** Every session of one exercise, newest first. */
export function liftSessions(events: readonly AppEvent[], exerciseId: string): LiftSession[] {
  const by = new Map<string, SetEvent[]>();
  for (const e of dedupe(events)) {
    if (e.type !== "set" || e.exerciseId !== exerciseId) continue;
    const list = by.get(e.sessionId) ?? [];
    list.push(e);
    by.set(e.sessionId, list);
  }
  const timed = TIMED.has(exerciseId);
  const out: LiftSession[] = [];
  for (const [sessionId, sets] of by) {
    const first = sets[0];
    if (!first) continue;
    const e1rm = timed ? 0 : Math.max(0, ...sets.filter((s) => s.weight > 0).map((s) => epley(s.weight, s.reps)));
    out.push({ sessionId, at: first.at, sets, e1rm: Math.round(e1rm * 10) / 10 });
  }
  return out.sort((a, b) => b.at - a.at);
}

export interface RepBest {
  reps: number;
  /** Heaviest weight (kg) lifted for at least this many reps. */
  weight: number;
  at: number;
}

/**
 * The heaviest weight lifted for at least each rep count (rep records), for loaded lifts. A row shows only
 * when it says something new: a heavier weight than the row for more reps.
 */
export function repBests(sessions: readonly LiftSession[], exerciseId: string): RepBest[] {
  if (TIMED.has(exerciseId)) return [];
  const sets = sessions.flatMap((s) => s.sets).filter((s) => s.weight > 0);
  const rows: RepBest[] = [];
  for (const reps of REP_COUNTS) {
    let best: SetEvent | undefined;
    for (const s of sets) if (s.reps >= reps && (!best || s.weight > best.weight || (s.weight === best.weight && s.at < best.at))) best = s;
    if (best) rows.push({ reps, weight: best.weight, at: best.at });
  }
  // Keep a row only when it's heavier than the next one down the table (more reps).
  return rows.filter((r, i) => {
    const next = rows[i + 1];
    return !next || r.weight > next.weight + 1e-9;
  });
}

export type LiftTrend =
  { kind: "new" } | { kind: "up"; pct: number } | { kind: "stalled"; weeks: number } | { kind: "down"; pct: number } | { kind: "steady" };

/**
 * Which way the lift is going, from each session's best estimated max: up or down by at least 1% (last six
 * weeks against the six before), stalled when the best is three weeks old or more, else steady. "new" until
 * there are sessions in both windows to compare.
 */
export function liftTrend(sessions: readonly LiftSession[], now: number): LiftTrend {
  const loaded = sessions.filter((s) => s.e1rm > 0);
  if (loaded.length < 2) return { kind: "new" };
  const cut = now - TREND_WEEKS * WEEK;
  const recent = loaded.filter((s) => s.at >= cut);
  const before = loaded.filter((s) => s.at < cut && s.at >= cut - TREND_WEEKS * WEEK);
  const best = loaded.reduce((a, b) => (b.e1rm > a.e1rm || (b.e1rm === a.e1rm && b.at < a.at) ? b : a));
  const weeks = Math.floor((now - best.at) / WEEK);
  if (!recent.length || !before.length) return weeks >= STALL_WEEKS && recent.length ? { kind: "stalled", weeks } : { kind: "new" };
  const r = Math.max(...recent.map((s) => s.e1rm));
  const b = Math.max(...before.map((s) => s.e1rm));
  const pct = Math.round(((r - b) / b) * 100);
  if (pct >= 1) return { kind: "up", pct };
  if (pct <= -1) return { kind: "down", pct: -pct };
  if (weeks >= STALL_WEEKS) return { kind: "stalled", weeks };
  return { kind: "steady" };
}
