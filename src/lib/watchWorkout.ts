"use client";

import type { Plan } from "./generator";
import { isNative } from "./juice";
import { unlisten, type ListenerHandle } from "./nativeListen";
import { afterLog, loadItem, type Active } from "./store/workout";
import type { AppEvent, Rating } from "./types";

// Phone-free workouts on the watch (docs/decisions/watch-apps.md "Phone-free workouts"). The phone sends the watches
// today's plan worked out set by set (a `Carry`, built by workout/watchCarry.ts) and keeps the plan itself (a
// `CarryRecord`). A watch that runs it on its own keeps each Log set with its time, weight and reps, and hands the
// workout back (a `WatchResult`) whenever the phone is near again, days later if need be. The phone then replays the
// sets through the same code as Log set (afterLog), so the workout it saves is the one the phone would have saved.
// Every event id comes from the watch's own id for the workout, so a result that arrives twice is saved once.

/** One exercise as the watch shows it: its name, the rest title, "How was …?", its weight ladder and the reps word. */
export interface CarryItem {
  n: string;
  rt: string;
  q: string;
  /** Weights in kg, lightest first, and the words for each ("102.5 lb"); empty for a bodyweight move or a hold. */
  kg: number[];
  w: string[];
  rs: string;
}

/**
 * One Log set ahead: which exercise, its label, the planned set in words, where its weight sits on the ladder, the
 * reps (or seconds), the rest after it, whether to ask how the exercise felt after it (`f`), whether it can be changed
 * (`a`), and whether it keeps the weight and reps changed on the set before (`c`, the next set of the same exercise).
 */
export interface CarryStep {
  e: number;
  l: string;
  t: string;
  i: number;
  r: number;
  s: number;
  f?: 1;
  a?: 1;
  c?: 1;
  /**
   * A timed hold or carry (set-timer.md "Started from the watch"): 1, or 2 for a hold done on each side, with `tt` the
   * Start timer button's words. The watch counts it on its own clock and logs the seconds held.
   */
  m?: 1 | 2;
  tt?: string;
}

/** Today's plan as a watch carries it. Everything a lifter reads on it is already in the app's language. */
export interface Carry {
  v: 1;
  id: string;
  day: string;
  title: string;
  why: string;
  vib: boolean;
  warn: boolean;
  /** The three answers to "How was …?"; their ratings are 1, 0 and -1. */
  o: string[];
  done: string;
  fin: string;
  /** The set timer's words for timed steps: get set, time left, first side, switch sides, second side, time's up. */
  tl?: [string, string, string, string, string, string];
  ex: CarryItem[];
  st: CarryStep[];
}

/** What the phone keeps of a carried plan, to replay a watch workout against it. */
export interface CarryRecord {
  id: string;
  day: string;
  at: number;
  plan: Plan;
  readiness?: number;
}

/** A workout run on the watch, as the watch hands it back. */
export interface WatchResult {
  id: string;
  /** The carried plan's id. */
  c: string;
  start: number;
  end: number;
  /**
   * Each Log set in order: its step, when it was logged, the kg (-1: as planned), the reps (seconds for a hold), when
   * the set started, and a hold's second side when it was stopped short there (`repsR`, as on the phone).
   */
  sets: { k: number; at: number; kg: number | null; reps: number; from: number; repsR?: number }[];
  /** "How did it feel?" answers: the step logged just before, and the rating. */
  rates: { k: number; v: Rating }[];
  hr?: { avg: number; max: number; min: number };
}

/** The most sets one watch workout may hand back. */
export const RESULT_SETS = 120;
/** How long the phone keeps a carried plan: a watch left on a trip for a week still brings its workouts home. */
export const KEEP_DAYS = 14;
const DAY = 86_400_000;
const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : null);

/**
 * A watch's result, read field by field: an object (iOS, Garmin through the phone) or JSON text (Wear OS). Times must
 * be real (start before end, inside two weeks, not in the future) and the sets in order. Null when it isn't one.
 */
export function parseWatchResult(raw: unknown, now = Date.now()): WatchResult | null {
  let o: unknown = raw;
  if (typeof raw === "string") {
    if (raw.length > 64_000) return null;
    try {
      o = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!o || typeof o !== "object") return null;
  const r = o as Record<string, unknown>;
  const id = typeof r.id === "string" && /^[A-Za-z0-9_-]{4,64}$/.test(r.id) ? r.id : null;
  const c = typeof r.c === "string" && r.c.length <= 64 ? r.c : null;
  const start = num(r.start);
  const end = num(r.end);
  if (!id || !c || start === null || end === null || end < start || end > now + 60_000 || start < now - KEEP_DAYS * DAY) return null;
  if (end - start > 6 * 3600_000) return null;
  const sets: WatchResult["sets"] = [];
  const list = Array.isArray(r.sets) ? r.sets.slice(0, RESULT_SETS) : [];
  let prev = start;
  for (const x of list) {
    if (!Array.isArray(x)) return null;
    const [k, at, kg, reps, from, right] = x.map(num);
    if (k !== sets.length || at === null || at < prev || at > end + 1000) return null;
    if (reps === null || !Number.isInteger(reps) || reps < 1 || reps > 600) return null;
    const w = kg === null || kg < 0 ? null : kg <= 1000 ? Math.round(kg * 1000) / 1000 : undefined;
    if (w === undefined) return null;
    sets.push({
      k,
      at: Math.round(at),
      kg: w,
      reps,
      from: from !== null && from >= prev && from <= at ? Math.round(from) : Math.round(prev),
      ...(right !== null && right !== undefined && Number.isInteger(right) && right >= 0 && right <= 600 ? { repsR: right } : {}),
    });
    prev = at;
  }
  const rates: WatchResult["rates"] = [];
  for (const x of Array.isArray(r.rates) ? r.rates.slice(0, RESULT_SETS) : []) {
    if (!Array.isArray(x)) continue;
    const [k, v] = x.map(num);
    if (k !== null && k >= 0 && k < sets.length && (v === 1 || v === 0 || v === -1)) rates.push({ k, v });
  }
  const h = Array.isArray(r.hr) ? r.hr.map(num) : [];
  const ok = (b: number | null | undefined): b is number => b != null && b >= 30 && b <= 240;
  const hr = ok(h[0]) && ok(h[1]) && ok(h[2]) ? { avg: Math.round(h[0]), max: Math.round(h[1]), min: Math.round(h[2]) } : undefined;
  return { id, c, start: Math.round(start), end: Math.round(end), sets, rates, ...(hr ? { hr } : {}) };
}

/** The workout's first exercise, loaded as Start loads it: where the watch's look-ahead and the replay both begin. */
export function carryStart(plan: Plan, sessionId: string, start: number): Active {
  return loadItem(
    [],
    {
      sessionId,
      startedAt: start,
      plan,
      index: 0,
      weight: 0,
      reps: 0,
      restUntil: null,
      restTotal: 0,
      askFeedback: null,
      hr: [],
      hrAt: [],
      setStart: start,
      lastAt: start,
    },
    0,
    start,
  );
}

/** The session id a watch workout is saved under. */
export const watchSessionId = (r: Pick<WatchResult, "id">) => `watch-${r.id}`;

/**
 * The events a watch workout becomes: a sessionStart marked `source: "watch"`, each Log set replayed through afterLog
 * at its own time with the weight and reps the watch logged (warm-ups and sets alike), the answers to "How did it
 * feel?", and a sessionEnd with the watch's heart rate. Null when nothing but warm-ups was logged.
 */
export function watchEvents(rec: CarryRecord, r: WatchResult): AppEvent[] | null {
  const sessionId = watchSessionId(r);
  let cur = carryStart(rec.plan, sessionId, r.start);
  let evs: AppEvent[] = [];
  const rated = new Map(r.rates.map((x) => [x.k, x.v]));
  for (const s of r.sets) {
    if (cur.index >= rec.plan.items.length) break;
    const step: Active = {
      ...cur,
      askFeedback: null,
      weight: s.kg ?? cur.weight,
      reps: s.reps,
      setStart: s.from,
      ...(s.repsR !== undefined ? { repsR: s.repsR } : {}),
    };
    const done = afterLog(step, evs, true, s.at, () => `${sessionId}-${s.k}`);
    if (!done) break;
    evs = [...evs, ...done.evs];
    const v = rated.get(s.k);
    if (done.next.askFeedback && v !== undefined)
      evs.push({ type: "feedback", id: `${sessionId}-f${s.k}`, at: s.at + 1, sessionId, exerciseId: done.next.askFeedback, rating: v });
    cur = done.next;
  }
  const sets = evs.filter((e) => e.type === "set");
  if (!sets.length) return null;
  const sum = (k: "durationSec" | "restSec") => sets.reduce((n, e) => n + ((e.type === "set" && e[k]) || 0), 0);
  const plan = rec.plan;
  return [
    {
      type: "sessionStart",
      id: `${sessionId}-start`,
      at: r.start,
      sessionId,
      gymId: plan.gymId,
      minutes: plan.minutes,
      call: plan.call,
      ...(rec.readiness !== undefined ? { readiness: rec.readiness } : {}),
      challenge: plan.challenge,
      ...(plan.program ? { program: { id: plan.program.id, day: plan.program.day } } : {}),
      ...(plan.routineId ? { routine: plan.routineId } : {}),
      source: "watch",
    },
    ...evs,
    {
      type: "sessionEnd",
      id: `${sessionId}-end`,
      at: r.end,
      sessionId,
      seconds: Math.max(0, Math.round((r.end - r.start) / 1000)),
      ...(r.hr ? { avgHr: r.hr.avg, maxHr: r.hr.max, minHr: r.hr.min } : {}),
      workSec: sum("durationSec"),
      restSec: sum("restSec"),
    },
  ];
}

// ---------- The carried plans the phone keeps (this device only; the events it saves sync as usual).

export const CARRY_KEY = "liftsmith.watchCarry";

export function readCarries(): CarryRecord[] {
  try {
    const list = JSON.parse(localStorage.getItem(CARRY_KEY) ?? "[]") as unknown;
    return Array.isArray(list) ? (list as CarryRecord[]).filter((x) => x && typeof x.id === "string" && x.plan) : [];
  } catch {
    return [];
  }
}

/** Keeps a carried plan (newest first), dropping ones older than KEEP_DAYS. */
export function keepCarry(rec: CarryRecord, now = Date.now()): void {
  const list = [rec, ...readCarries().filter((x) => x.id !== rec.id && now - x.at < KEEP_DAYS * DAY)].slice(0, 30);
  try {
    localStorage.setItem(CARRY_KEY, JSON.stringify(list));
  } catch {
    // Storage full: the watch workout is then kept on the watch until the phone can keep its plan again.
  }
}

// ---------- The native side: sending the carry, and the watch workouts waiting on the phone.

type Plugin = {
  setCarry?(o: { json: string }): Promise<void>;
  watchWorkouts?(): Promise<{ list: unknown[] }>;
  doneWatchWorkout?(o: { id: string }): Promise<void>;
  addListener(event: "watchWorkout", cb: () => void): ListenerHandle | Promise<ListenerHandle>;
};
const plugin = (): Plugin | undefined =>
  typeof window !== "undefined"
    ? (window as unknown as { Capacitor?: { Plugins?: { WorkoutSession?: Plugin } } }).Capacitor?.Plugins?.WorkoutSession
    : undefined;

let lastCarry = "";

/** Hands today's carried plan to the watches, only when it changed. Empty text takes it off them. */
export async function pushCarry(json: string): Promise<boolean> {
  const p = plugin();
  if (!p?.setCarry || !isNative() || json === lastCarry) return false;
  lastCarry = json;
  try {
    await p.setCarry({ json });
    return true;
  } catch {
    lastCarry = "";
    return false;
  }
}

/** Watch workouts that reached the phone, each as the watch sent it (parseWatchResult reads them). */
export async function waitingWatchWorkouts(): Promise<unknown[]> {
  const p = plugin();
  if (!p?.watchWorkouts || !isNative()) return [];
  try {
    return (await p.watchWorkouts()).list ?? [];
  } catch {
    return [];
  }
}

/** Saved (or seen before): the phone forgets its copy. */
export async function doneWatchWorkout(id: string): Promise<void> {
  await plugin()
    ?.doneWatchWorkout?.({ id })
    .catch(() => undefined);
}

/** A watch workout arrived while the app is open. Returns an unsubscribe function. */
export function onWatchWorkout(cb: () => void): () => void {
  const p = plugin();
  if (!p || !isNative()) return () => {};
  return unlisten(p.addListener("watchWorkout", cb));
}

/** Tests only. */
export function resetCarryCache() {
  lastCarry = "";
}
