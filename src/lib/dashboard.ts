import { dedupe, mondayOf, type Stats } from "./derive";
import { EXERCISE_BY_ID } from "./exercises";
import { game, levelOf } from "./game";
import { shareIds, shareName } from "./achievements";
import { epley } from "./progression";
import type { AppEvent, Profile, SessionEndEvent, SessionStartEvent, SetEvent, Unit } from "./types";

// The web dashboard (/me/): pure views over the event log, plus the two things it writes: a past
// workout logged by hand, and a share link. Everything here is derived, never stored (AGENTS.md).

const DAY = 86400_000;

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface DayTotals {
  sessions: number;
  sets: number;
  volume: number;
  seconds: number;
  prs: number;
}

/** Workouts per local day. */
export function trainingDays(stats: Pick<Stats, "sessions">): Map<string, DayTotals> {
  const out = new Map<string, DayTotals>();
  for (const s of stats.sessions) {
    const k = dayKey(s.start);
    const t = out.get(k) ?? { sessions: 0, sets: 0, volume: 0, seconds: 0, prs: 0 };
    out.set(k, { sessions: t.sessions + 1, sets: t.sets + s.sets, volume: t.volume + s.volume, seconds: t.seconds + s.seconds, prs: t.prs + s.prs });
  }
  return out;
}

export interface GridDay {
  key: string;
  ms: number;
  future: boolean;
}

/** The last `weeks` weeks as columns of seven days, Monday first, ending with the current week. */
export function yearGrid(now: number, weeks = 53): GridDay[][] {
  const today = startOfDay(now);
  const first = mondayOf(today) - (weeks - 1) * 7 * DAY;
  const cols: GridDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: GridDay[] = [];
    for (let d = 0; d < 7; d++) {
      // Step by calendar day, not 24 h, so daylight saving changes don't skip or repeat a day.
      const dt = new Date(first);
      dt.setDate(dt.getDate() + w * 7 + d);
      const ms = dt.getTime();
      col.push({ key: dayKey(ms), ms, future: ms > today });
    }
    cols.push(col);
  }
  return cols;
}

/** A month as rows of seven cells, Monday first; cells outside the month are null. */
export function monthGrid(year: number, month: number): (GridDay | null)[][] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (GridDay | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) {
    const ms = new Date(year, month, d).getTime();
    cells.push({ key: dayKey(ms), ms, future: false });
  }
  while (cells.length % 7) cells.push(null);
  const rows: (GridDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

/** Heat level 0 to 4 for a day, from its hard sets. */
export function heat(t: DayTotals | undefined): 0 | 1 | 2 | 3 | 4 {
  if (!t || !t.sets) return 0;
  if (t.sets < 8) return 1;
  if (t.sets < 16) return 2;
  if (t.sets < 24) return 3;
  return 4;
}

export interface LiftBest {
  exerciseId: string;
  sessions: number;
  sets: number;
  /** Best estimated one-rep max (kg) and the set it came from. */
  e1rm: number;
  e1rmSet: { weight: number; reps: number; at: number };
  heaviest: number;
  mostReps: number;
  lastAt: number;
}

/** Bests for every exercise ever logged, most trained first. */
export function liftBests(events: readonly AppEvent[]): LiftBest[] {
  const by = new Map<string, SetEvent[]>();
  for (const e of dedupe(events)) if (e.type === "set") by.set(e.exerciseId, [...(by.get(e.exerciseId) ?? []), e]);
  const out: LiftBest[] = [];
  for (const [exerciseId, sets] of by) {
    let best = sets[0];
    for (const s of sets) if (epley(s.weight, s.reps) > epley(best.weight, best.reps)) best = s;
    out.push({
      exerciseId,
      sessions: new Set(sets.map((s) => s.sessionId)).size,
      sets: sets.length,
      e1rm: Math.round(epley(best.weight, best.reps) * 10) / 10,
      e1rmSet: { weight: best.weight, reps: best.reps, at: best.at },
      heaviest: Math.max(...sets.map((s) => s.weight)),
      mostReps: Math.max(...sets.map((s) => s.reps)),
      lastAt: sets.at(-1)!.at,
    });
  }
  return out.sort((a, b) => b.sessions - a.sessions || b.sets - a.sets || a.exerciseId.localeCompare(b.exerciseId));
}

export interface SessionDetail {
  sessionId: string;
  start: number;
  manual: boolean;
  exercises: { exerciseId: string; sets: SetEvent[] }[];
}

/** Every set of one workout, grouped by exercise in the order they were done. */
export function sessionDetail(events: readonly AppEvent[], sessionId: string): SessionDetail | null {
  const all = dedupe(events).filter((e) => "sessionId" in e && e.sessionId === sessionId);
  const sets = all.filter((e): e is SetEvent => e.type === "set");
  if (!sets.length) return null;
  const start = all.find((e): e is SessionStartEvent => e.type === "sessionStart");
  const groups: SessionDetail["exercises"] = [];
  for (const s of sets) {
    const g = groups.at(-1);
    if (g && g.exerciseId === s.exerciseId) g.sets.push(s);
    else groups.push({ exerciseId: s.exerciseId, sets: [s] });
  }
  return { sessionId, start: start?.at ?? sets[0].at, manual: start?.source === "manual", exercises: groups };
}

/** Workouts, sets and volume for each of the last `weeks` weeks, oldest first. */
export function weeklyTotals(stats: Pick<Stats, "sessions">, now: number, weeks = 12): { weekStart: number; sessions: number; sets: number; volume: number }[] {
  const out = [];
  const thisWeek = mondayOf(now);
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = mondayOf(thisWeek - i * 7 * DAY + 12 * 3600_000);
    const list = stats.sessions.filter((s) => mondayOf(s.start) === ws);
    out.push({ weekStart: ws, sessions: list.length, sets: list.reduce((n, s) => n + s.sets, 0), volume: list.reduce((n, s) => n + s.volume, 0) });
  }
  return out;
}

// --- Logging a past workout by hand (like adding a past workout on a big screen). ---

export interface PastSet {
  /** Kilograms (per hand for dumbbells, extra load for bodyweight). */
  weight: number;
  reps: number;
}

export interface PastWorkout {
  /** When it started (ms). */
  start: number;
  minutes: number;
  gymId: string;
  exercises: { exerciseId: string; sets: PastSet[] }[];
}

export type PastResult = { ok: true; events: AppEvent[] } | { ok: false; error: string };

/** Reps in reserve assumed for a hand-logged set, which recovery and readiness read. */
export const MANUAL_RIR = 2;

/**
 * Turns a hand-logged workout into the same events a live workout writes: a sessionStart marked
 * `source: "manual"`, one set event per set spread over the workout, and a sessionEnd. What was lifted
 * is taken as the target, so it counts as hit for progression.
 */
export function pastWorkoutEvents(w: PastWorkout, now: number, newId: () => string = () => crypto.randomUUID()): PastResult {
  if (!Number.isFinite(w.start) || w.start > now) return { ok: false, error: "Pick a time that has already happened." };
  if (w.start < new Date(2000, 0, 1).getTime()) return { ok: false, error: "That date is too far back." };
  if (!Number.isInteger(w.minutes) || w.minutes < 1 || w.minutes > 600) return { ok: false, error: "Length must be 1 to 600 minutes." };
  const sets: { exerciseId: string; set: PastSet }[] = [];
  for (const ex of w.exercises) {
    if (!EXERCISE_BY_ID.has(ex.exerciseId)) return { ok: false, error: "Pick an exercise from the list." };
    for (const s of ex.sets) {
      if (!Number.isInteger(s.reps) || s.reps < 1 || s.reps > 1000) return { ok: false, error: "Reps must be a whole number from 1 to 1000." };
      if (!Number.isFinite(s.weight) || s.weight < 0 || s.weight > 1000) return { ok: false, error: "Weight must be 0 to 1000 kg." };
      sets.push({ exerciseId: ex.exerciseId, set: s });
    }
  }
  if (!sets.length) return { ok: false, error: "Add at least one set." };
  if (sets.length > 200) return { ok: false, error: "That's more than 200 sets." };

  const sessionId = newId();
  const seconds = w.minutes * 60;
  const end = Math.min(now, w.start + seconds * 1000);
  const span = end - w.start;
  const started: SessionStartEvent = { id: newId(), at: w.start, type: "sessionStart", sessionId, gymId: w.gymId, minutes: w.minutes, source: "manual" };
  const setEvents: SetEvent[] = sets.map(({ exerciseId, set }, i) => ({
    id: newId(),
    // Spread across the workout, the last set a little before the end.
    at: Math.round(w.start + (span * (i + 1)) / (sets.length + 1)),
    type: "set",
    sessionId,
    exerciseId,
    weight: Math.round(set.weight * 1000) / 1000,
    reps: set.reps,
    targetReps: set.reps,
    targetWeight: Math.round(set.weight * 1000) / 1000,
    rir: MANUAL_RIR,
  }));
  const ended: SessionEndEvent = { id: newId(), at: end, type: "sessionEnd", sessionId, seconds: Math.round(span / 1000) };
  return { ok: true, events: [started, ...setEvents, ended] };
}

// --- Share links: a summary carried in the URL fragment, so no server ever sees it. ---
// Kept out on purpose (health data stays private): heart rate, body weight, cycle, gyms and locations,
// notes and set-by-set history. The name is only included when the lifter ticks it.

export interface ShareCard {
  v: 1;
  /** Display name, if the lifter chose to include it. */
  n?: string;
  /** Unit the lifts are shown in. */
  u: Unit;
  xp: number;
  /** Workouts finished. */
  w: number;
  /** Weeks in a row meeting the weekly goal. */
  s: number;
  /** Badges earned: "<achievement>.<tier>" for the highest tier of each (older links hold trophy ids). */
  t: string[];
  /** Top lifts: [exercise id, best estimated one-rep max in kg]. */
  l: [string, number][];
  /** Days trained in the 12 weeks up to `d0`, as day offsets back from it (0 is that day). */
  d: number[];
  /** Local midnight of the day the card was made (ms). */
  d0: number;
}

export const SHARE_DAYS = 84;

export function shareCard(events: readonly AppEvent[], stats: Stats, profile: Profile, now: number, opts: { name: boolean }): ShareCard {
  const d0 = startOfDay(now);
  const days = new Set<number>();
  for (const s of stats.sessions) {
    const back = Math.round((d0 - startOfDay(s.start)) / DAY);
    if (back >= 0 && back < SHARE_DAYS) days.add(back);
  }
  const lifts = liftBests(events)
    .filter((b) => b.e1rm > 0)
    .sort((a, b) => b.e1rm - a.e1rm)
    .slice(0, 5)
    .map((b): [string, number] => [b.exerciseId, Math.round(b.e1rm)]);
  const name = profile.name.trim().slice(0, 40);
  const g = game(events, stats, profile, now);
  return {
    v: 1,
    ...(opts.name && name ? { n: name } : {}),
    u: profile.unit,
    xp: g.xp,
    w: stats.sessions.length,
    s: g.streak.weeks,
    t: shareIds(g.achievements),
    l: lifts,
    d: [...days].sort((a, b) => a - b),
    d0,
  };
}

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeShare(card: ShareCard): string {
  return toBase64Url(JSON.stringify(card));
}

/** Trophy ids from links made before achievements (2026-11-09). */
export const KNOWN_TROPHIES = new Set(["first", "ten", "fifty", "first-pr", "plate-ohp", "plate-bench", "two-plate-bench", "bw-bench", "three-plate-squat", "four-plate-dead", "ten-pullups", "explorer", "streak-4", "volume-100k"]);
const int = (x: unknown, lo: number, hi: number): x is number => typeof x === "number" && Number.isInteger(x) && x >= lo && x <= hi;

/** Reads a share link. Anything malformed or unexpected gives null; nothing in it is trusted. */
export function decodeShare(fragment: string): ShareCard | null {
  if (!fragment || fragment.length > 4000) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(fromBase64Url(fragment.replace(/^#/, "")));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  if (c.v !== 1) return null;
  if (c.n !== undefined && (typeof c.n !== "string" || c.n.length > 40)) return null;
  if (c.u !== "kg" && c.u !== "lb") return null;
  if (!int(c.xp, 0, 10_000_000) || !int(c.w, 0, 100_000) || !int(c.s, 0, 10_000) || !int(c.d0, 0, 8.64e15)) return null;
  if (!Array.isArray(c.t) || c.t.length > 100 || !c.t.every((t) => typeof t === "string" && (KNOWN_TROPHIES.has(t) || shareName(t) !== null))) return null;
  if (!Array.isArray(c.l) || c.l.length > 5 || !c.l.every((x) => Array.isArray(x) && x.length === 2 && typeof x[0] === "string" && EXERCISE_BY_ID.has(x[0]) && int(x[1], 0, 2000))) return null;
  if (!Array.isArray(c.d) || c.d.length > SHARE_DAYS || !c.d.every((x) => int(x, 0, SHARE_DAYS - 1))) return null;
  const n = typeof c.n === "string" ? c.n.trim() : "";
  return { v: 1, ...(n ? { n } : {}), u: c.u, xp: c.xp, w: c.w, s: c.s, t: [...new Set(c.t as string[])], l: c.l as [string, number][], d: [...new Set(c.d as number[])], d0: c.d0 };
}

export function shareLevel(card: Pick<ShareCard, "xp">) {
  return levelOf(card.xp);
}
