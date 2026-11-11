"use client";

// Health Connect (Android) and Apple Health (iOS) through one plugin, @capgo/capacitor-health.
// Reads prefill the setup wizard (weight, height, resting heart rate), bring in weigh-ins with body
// fat for the coach's notes (insights.ts), and feed the health twin (readDaily, twin.ts). Finished workouts are
// written back as active calories and heart rate samples, because the plugin can't write
// workout sessions yet. On the web every call is a no-op. Live heart rate never comes from
// here: Health Connect is batched, so live HR uses Bluetooth (heartRate.ts).
import { isNative } from "./juice";
import type { HealthMetric } from "./types";

type HealthModule = typeof import("@capgo/capacitor-health");
let mod: Promise<HealthModule> | null = null;
const health = () => (mod ??= import("@capgo/capacitor-health"));

// Only what a feature uses today: Play's Health Connect review rejects any permission the app doesn't
// visibly use, so keep this list, the manifest's health permissions and the privacy pages in step.
// Weight, height, body fat and resting HR: setup, weigh-ins, TDEE and the health twin. Sleep, HRV, steps,
// VO2 max and breathing rate: the health twin (twin.ts), the readiness call (sleep, HRV, resting HR,
// breathing rate) and TDEE's activity level (steps).
export const READ = [
  "weight",
  "height",
  "bodyFat",
  "restingHeartRate",
  "sleep",
  "heartRateVariability",
  "steps",
  "vo2Max",
  "respiratoryRate",
] as const;
export const WRITE = ["calories", "heartRate"] as const;

export async function healthAvailable(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    return (await (await health()).Health.isAvailable()).available;
  } catch {
    return false;
  }
}

/** Opens the Health Connect or Apple Health permission sheet. True when any read was granted. */
export async function connectHealth(): Promise<boolean> {
  if (!(await healthAvailable())) return false;
  try {
    const r = await (await health()).Health.requestAuthorization({ read: [...READ], write: [...WRITE] });
    // Then saving workouts, which our own plugin asks for (the health plugin can't write them).
    await allowWorkouts();
    // HealthKit never says whether reads were allowed, so an empty denied list counts as yes.
    return r.readAuthorized.length > 0 || r.readDenied.length < READ.length;
  } catch {
    return false;
  }
}

export interface HealthHints {
  /** Kilograms. */
  bodyweight?: number;
  /** Centimetres. */
  height?: number;
  restingHr?: number;
}

async function latest(dataType: (typeof READ)[number], days: number): Promise<number | undefined> {
  const { Health } = await health();
  const startDate = new Date(Date.now() - days * 86_400_000).toISOString();
  const { samples } = await Health.readSamples({ dataType, startDate, limit: 1, ascending: false });
  return samples[0]?.value;
}

/** The newest weight, height and resting heart rate, for the wizard. Missing values stay undefined. */
export async function readHints(): Promise<HealthHints> {
  if (!(await healthAvailable())) return {};
  const safe = (p: Promise<number | undefined>) => p.catch(() => undefined);
  const [bodyweight, height, restingHr] = await Promise.all([
    safe(latest("weight", 365)),
    safe(latest("height", 3650)),
    safe(latest("restingHeartRate", 30)),
  ]);
  return { bodyweight, height: height !== undefined && height < 3 ? height * 100 : height, restingHr };
}

export interface BodyReading {
  /** Local day key (YYYY-MM-DD), one reading per day. */
  day: string;
  at: number;
  kg: number;
  /** Percent. */
  bodyFat?: number;
}

/**
 * Weigh-ins and body fat over the last `days`, one per day (the latest that day), for the body
 * composition insights (insights.ts). Smart scales and the Hume Body Pod write here. Empty on the
 * web, without permission, or when nothing was found.
 */
export async function readBody(days: number): Promise<BodyReading[]> {
  if (!(await healthAvailable())) return [];
  const { Health } = await health();
  const startDate = new Date(Date.now() - days * 86_400_000).toISOString();
  const read = async (dataType: "weight" | "bodyFat") => {
    try {
      return (await Health.readSamples({ dataType, startDate, limit: 500, ascending: true })).samples;
    } catch {
      return [];
    }
  };
  const [weights, fats] = await Promise.all([read("weight"), read("bodyFat")]);
  return pairBody(weights, fats);
}

/** One reading per local day: that day's latest weight, with that day's latest body fat. Exported for tests. */
export function pairBody(
  weights: readonly { value: number; startDate: string }[],
  fats: readonly { value: number; startDate: string }[],
): BodyReading[] {
  const key = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const fatBy = new Map<string, number>();
  // HealthKit gives a fraction (0.18), Health Connect a percentage (18).
  for (const f of fats) if (f.value > 0) fatBy.set(key(f.startDate), f.value <= 1 ? f.value * 100 : f.value);
  const by = new Map<string, BodyReading>();
  for (const w of weights) {
    if (!(w.value > 0)) continue;
    const day = key(w.startDate);
    const at = Date.parse(w.startDate);
    const prev = by.get(day);
    if (!prev || at >= prev.at) by.set(day, { day, at, kg: w.value, bodyFat: fatBy.get(day) });
  }
  return [...by.values()].sort((a, b) => a.at - b.at);
}

export interface HealthValue {
  value: number;
  /** When it was measured (ms). */
  at: number;
}

/**
 * Your stats from health data (tdee.ts bodyUpdates): the newest height (cm) from Health Connect or Apple
 * Health, plus sex and birth year from Apple Health (our HealthWorkout plugin's `characteristics`; Health
 * Connect stores neither, so on Android they're entered in Your stats). `ask` shows Apple Health's sheet for
 * sex and date of birth the first time; without it, only what's already allowed is read. Weigh-ins and body
 * fat come in through readBody instead, as bodyweight events, so there is one import path for them.
 */
export async function readBodyStats(ask = false): Promise<{ height?: HealthValue; sex?: "male" | "female"; birthYear?: number }> {
  if (!(await healthAvailable())) return {};
  const out: { height?: HealthValue; sex?: "male" | "female"; birthYear?: number } = {};
  try {
    const { Health } = await health();
    const startDate = new Date(Date.now() - 3650 * 86_400_000).toISOString();
    const s = (await Health.readSamples({ dataType: "height", startDate, limit: 1, ascending: false })).samples[0];
    const at = s ? Date.parse(s.endDate || s.startDate) : NaN;
    // Height can arrive in metres.
    if (s && Number.isFinite(s.value) && Number.isFinite(at)) out.height = { value: s.value < 3 ? s.value * 100 : s.value, at };
  } catch {
    // Not allowed yet, or the store is unavailable.
  }
  try {
    const c = await workoutPlugin()?.characteristics?.({ ask });
    if (c?.sex === "male" || c?.sex === "female") out.sex = c.sex;
    if (typeof c?.birthYear === "number" && Number.isFinite(c.birthYear)) out.birthYear = c.birthYear;
  } catch {
    // Android, or an app build from before characteristics existed.
  }
  return out;
}

/** Rough active calories for resistance training: about 5 METs. */
export function strengthKcal(seconds: number, bodyweightKg: number): number {
  return Math.round(5 * bodyweightKg * (seconds / 3600));
}

// Our own small plugin (HealthWorkoutPlugin.kt / .swift): workouts as real workout sessions, which the health
// plugin can't write. Missing on the web and on app builds from before it existed.
interface WorkoutPlugin {
  status(): Promise<{ granted: boolean }>;
  request(): Promise<{ granted: boolean }>;
  save(o: {
    id: string;
    start: number;
    end: number;
    title?: string;
    notes?: string;
    kcal?: number;
    avgHr?: number;
  }): Promise<{ saved: boolean }>;
  /** Apple Health's sex and birth year (iOS). Android answers with nothing: Health Connect has no such records. */
  characteristics?(o: { ask: boolean }): Promise<{ sex?: string; birthYear?: number }>;
}
const workoutPlugin = (): WorkoutPlugin | undefined =>
  isNative()
    ? (window as unknown as { Capacitor?: { Plugins?: { HealthWorkout?: WorkoutPlugin } } }).Capacitor?.Plugins?.HealthWorkout
    : undefined;

/** Whether finished workouts may be saved as workouts (Health Connect's exercise permission, Apple Health's workouts). */
export async function workoutsAllowed(): Promise<boolean> {
  try {
    return (await workoutPlugin()?.status())?.granted ?? false;
  } catch {
    return false;
  }
}

/** Asks to save workouts (one more Health Connect or Apple Health sheet). */
export async function allowWorkouts(): Promise<boolean> {
  if (!(await healthAvailable())) return false;
  try {
    return (await workoutPlugin()?.request())?.granted ?? false;
  } catch {
    return false;
  }
}

/**
 * A finished workout into Health Connect or Apple Health: a strength training session (titled, with the sets as
 * notes on Android), its active calories and its average heart rate. On iOS the calories and heart rate go
 * inside the workout, so they count toward the rings once; on Android they're separate records over the same time,
 * which is how Health Connect links them. Without the workout permission only the calories and heart rate are
 * written, as before.
 */
export async function saveWorkout(w: {
  id?: string;
  start: number;
  end: number;
  bodyweightKg: number;
  avgHr?: number;
  title?: string;
  notes?: string;
}): Promise<void> {
  if (!(await healthAvailable())) return;
  const kcal = strengthKcal((w.end - w.start) / 1000, w.bodyweightKg);
  let inWorkout = false;
  const plugin = workoutPlugin();
  if (plugin && w.id) {
    try {
      const saved = (await plugin.save({ id: w.id, start: w.start, end: w.end, title: w.title, notes: w.notes, kcal, avgHr: w.avgHr }))
        .saved;
      const ios = (await import("@capacitor/core")).Capacitor.getPlatform() === "ios";
      inWorkout = saved && ios;
    } catch {
      // Fall through to the separate samples.
    }
  }
  if (inWorkout) return;
  const { Health } = await health();
  const startDate = new Date(w.start).toISOString();
  const endDate = new Date(w.end).toISOString();
  const metadata = { source: "Liftsmith", activity: "strengthTraining" };
  try {
    await Health.saveSample({ dataType: "calories", value: kcal, startDate, endDate, metadata });
    if (w.avgHr) await Health.saveSample({ dataType: "heartRate", value: w.avgHr, startDate, endDate, metadata });
  } catch {
    // Permission was revoked or the store is unavailable; the workout is still in the local log.
  }
}

// --- The health twin's daily readings (twin.ts) ---

/** Local day key, YYYY-MM-DD. */
export function localDayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface DailyReading {
  metric: HealthMetric;
  day: string;
  value: number;
  /** The newest sample behind it (ms). */
  at: number;
}

interface Sample {
  value: number;
  startDate: string;
  endDate: string;
  sleepState?: string;
  stages?: { startDate: string; endDate: string; stage: string }[];
}

const ASLEEP = new Set(["asleep", "light", "deep", "rem"]);

/**
 * Hours asleep per night, keyed by the day the night ended. Health Connect gives sessions with stages;
 * Apple Health gives one segment per stage, often from two sources (watch and phone) at once, so asleep
 * time is the union of every asleep interval, never a sum. A session without stages counts in full;
 * in-bed and awake time never counts. Exported for tests.
 */
export function sleepNights(samples: readonly Sample[]): DailyReading[] {
  const spans: [number, number][] = [];
  for (const s of samples) {
    const staged = s.stages?.filter((x) => ASLEEP.has(x.stage)) ?? [];
    if (s.stages?.length) for (const x of staged) spans.push([Date.parse(x.startDate), Date.parse(x.endDate)]);
    else if (!s.sleepState || ASLEEP.has(s.sleepState)) spans.push([Date.parse(s.startDate), Date.parse(s.endDate)]);
  }
  const ok = spans.filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a).sort((x, y) => x[0] - y[0]);
  // Merge overlaps, then group by the day each stretch ends (a nap that day counts toward it too).
  const merged: [number, number][] = [];
  for (const sp of ok) {
    const last = merged[merged.length - 1];
    if (last && sp[0] <= last[1]) last[1] = Math.max(last[1], sp[1]);
    else merged.push([...sp]);
  }
  const by = new Map<string, { ms: number; at: number }>();
  for (const [a, b] of merged) {
    const day = localDayKey(b);
    const cur = by.get(day) ?? { ms: 0, at: 0 };
    by.set(day, { ms: cur.ms + (b - a), at: Math.max(cur.at, b) });
  }
  return [...by.entries()]
    .map(([day, v]) => ({ metric: "sleep" as const, day, value: Math.round((v.ms / 3_600_000) * 100) / 100, at: v.at }))
    .filter((r) => r.value >= 1 && r.value <= 16)
    .sort((a, b) => a.at - b.at);
}

/** One value per local day: the mean of that day's samples (HRV, breathing rate) or the latest (resting HR, VO2 max). Exported for tests. */
export function perDay(
  metric: HealthMetric,
  samples: readonly Sample[],
  how: "mean" | "latest",
  ok: (v: number) => boolean,
): DailyReading[] {
  const by = new Map<string, { sum: number; n: number; latest: number; at: number }>();
  for (const s of samples) {
    const at = Date.parse(s.endDate || s.startDate);
    if (!Number.isFinite(at) || !ok(s.value)) continue;
    const day = localDayKey(at);
    const cur = by.get(day) ?? { sum: 0, n: 0, latest: s.value, at: 0 };
    cur.sum += s.value;
    cur.n += 1;
    if (at >= cur.at) {
      cur.at = at;
      cur.latest = s.value;
    }
    by.set(day, cur);
  }
  return [...by.entries()]
    .map(([day, v]) => ({ metric, day, value: Math.round((how === "mean" ? v.sum / v.n : v.latest) * 10) / 10, at: v.at }))
    .sort((a, b) => a.at - b.at);
}

/**
 * The last `days` of sleep, HRV, resting heart rate, steps, VO2 max and overnight breathing rate, one
 * reading per metric per day. Steps only for finished days (today's count is still growing). Empty on
 * the web, and a metric the lifter didn't allow is simply missing.
 */
export async function readDaily(days: number, now = Date.now()): Promise<DailyReading[]> {
  if (!(await healthAvailable())) return [];
  const { Health } = await health();
  const startDate = new Date(now - days * 86_400_000).toISOString();
  const read = async (dataType: (typeof READ)[number]): Promise<Sample[]> => {
    try {
      return (await Health.readSamples({ dataType, startDate, limit: 2000, ascending: true })).samples as Sample[];
    } catch {
      return [];
    }
  };
  const steps = async (): Promise<DailyReading[]> => {
    try {
      const midnight = new Date(now);
      midnight.setHours(0, 0, 0, 0);
      const r = await Health.queryAggregated({
        dataType: "steps",
        startDate,
        endDate: midnight.toISOString(),
        bucket: "day",
        aggregation: "sum",
      });
      return r.samples
        .filter((s) => s.value > 0 && s.value < 100_000)
        .map((s) => ({
          metric: "steps" as const,
          day: localDayKey(Date.parse(s.startDate) + 12 * 3_600_000),
          value: Math.round(s.value),
          at: Date.parse(s.endDate) - 1,
        }));
    } catch {
      return [];
    }
  };
  const [sleep, hrv, rhr, vo2, breath, st] = await Promise.all([
    read("sleep"),
    read("heartRateVariability"),
    read("restingHeartRate"),
    read("vo2Max"),
    read("respiratoryRate"),
    steps(),
  ]);
  return [
    ...sleepNights(sleep),
    ...perDay("hrv", hrv, "mean", (v) => v > 5 && v < 300),
    ...perDay("restingHr", rhr, "latest", (v) => v > 25 && v < 130),
    ...perDay("vo2max", vo2, "latest", (v) => v > 10 && v < 95),
    ...perDay("breathing", breath, "mean", (v) => v > 4 && v < 40),
    ...st,
  ];
}

// --- Connected apps (Connections.tsx): status, permissions and Sync now ---

export type HealthPerm = (typeof READ)[number] | (typeof WRITE)[number];

/**
 * What the lifter allowed. Health Connect says which reads and writes were allowed; Apple Health never
 * tells an app about reads (privacy), so on iOS `reads` is null and only writes are known.
 */
export async function healthPermissions(): Promise<{ reads: HealthPerm[] | null; writes: HealthPerm[] } | null> {
  if (!(await healthAvailable())) return null;
  try {
    const r = await (await health()).Health.checkAuthorization({ read: [...READ], write: [...WRITE] });
    const ios = (await import("@capacitor/core")).Capacitor.getPlatform() === "ios";
    return { reads: ios ? null : (r.readAuthorized as HealthPerm[]), writes: r.writeAuthorized as HealthPerm[] };
  } catch {
    return null;
  }
}

/** Health Connect's own settings for Liftsmith (Android): change permissions, or install Health Connect. */
export async function openHealthSettings(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    await (await health()).Health.openHealthConnectSettings();
    return true;
  } catch {
    return false;
  }
}

const LAST_KEY = "ls.health.last";

/** When Health was last read (ms), on this device. */
export function healthLastSync(): number | null {
  try {
    const v = Number(localStorage.getItem(LAST_KEY));
    return v > 0 ? v : null;
  } catch {
    return null;
  }
}

export function noteHealthSync(at = Date.now()): void {
  try {
    localStorage.setItem(LAST_KEY, String(at));
  } catch {}
}
