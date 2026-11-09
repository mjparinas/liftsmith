"use client";
// Health Connect (Android) and Apple Health (iOS) through one plugin, @capgo/capacitor-health.
// Reads prefill the setup wizard (weight, height, resting heart rate) and bring in weigh-ins with body
// fat for the coach's notes (insights.ts). Finished workouts are
// written back as active calories and heart rate samples, because the plugin can't write
// workout sessions yet. On the web every call is a no-op. Live heart rate never comes from
// here: Health Connect is batched, so live HR uses Bluetooth (heartRate.ts).
import { isNative } from "./juice";

type HealthModule = typeof import("@capgo/capacitor-health");
let mod: Promise<HealthModule> | null = null;
const health = () => (mod ??= import("@capgo/capacitor-health"));

// Only what a feature uses today: Play's Health Connect review rejects any permission the app doesn't
// visibly use, so keep this list, the manifest's health permissions and the privacy pages in step.
// Sleep and HRV join when readiness reads them (integrations roadmap, step 2).
export const READ = ["weight", "height", "bodyFat", "restingHeartRate"] as const;
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
  const [bodyweight, height, restingHr] = await Promise.all([safe(latest("weight", 365)), safe(latest("height", 3650)), safe(latest("restingHeartRate", 30))]);
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
export function pairBody(weights: readonly { value: number; startDate: string }[], fats: readonly { value: number; startDate: string }[]): BodyReading[] {
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
 * The newest height (cm), for TDEE autofill (tdee.ts bodyUpdates). Weigh-ins and body fat come in
 * through readBody instead, as bodyweight events, so there is one import path for them.
 */
export async function readHeight(): Promise<{ height?: HealthValue }> {
  if (!(await healthAvailable())) return {};
  try {
    const { Health } = await health();
    const startDate = new Date(Date.now() - 3650 * 86_400_000).toISOString();
    const s = (await Health.readSamples({ dataType: "height", startDate, limit: 1, ascending: false })).samples[0];
    const at = s ? Date.parse(s.endDate || s.startDate) : NaN;
    if (!s || !Number.isFinite(s.value) || !Number.isFinite(at)) return {};
    // Height can arrive in metres.
    return { height: { value: s.value < 3 ? s.value * 100 : s.value, at } };
  } catch {
    return {}; // Not allowed yet, or the store is unavailable.
  }
}

/** Rough active calories for resistance training: about 5 METs. */
export function strengthKcal(seconds: number, bodyweightKg: number): number {
  return Math.round(5 * bodyweightKg * (seconds / 3600));
}

export async function saveWorkout(w: { start: number; end: number; bodyweightKg: number; avgHr?: number }): Promise<void> {
  if (!(await healthAvailable())) return;
  const { Health } = await health();
  const startDate = new Date(w.start).toISOString();
  const endDate = new Date(w.end).toISOString();
  const metadata = { source: "Liftsmith", activity: "strengthTraining" };
  try {
    await Health.saveSample({ dataType: "calories", value: strengthKcal((w.end - w.start) / 1000, w.bodyweightKg), startDate, endDate, metadata });
    if (w.avgHr) await Health.saveSample({ dataType: "heartRate", value: w.avgHr, startDate, endDate, metadata });
  } catch {
    // Permission was revoked or the store is unavailable; the workout is still in the local log.
  }
}
