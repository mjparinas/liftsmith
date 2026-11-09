"use client";
// Health Connect (Android) and Apple Health (iOS) through one plugin, @capgo/capacitor-health.
// Reads prefill the setup wizard (weight, height, resting heart rate). Finished workouts are
// written back as active calories and heart rate samples, because the plugin can't write
// workout sessions yet. On the web every call is a no-op. Live heart rate never comes from
// here: Health Connect is batched, so live HR uses Bluetooth (heartRate.ts).
import { isNative } from "./juice";

type HealthModule = typeof import("@capgo/capacitor-health");
let mod: Promise<HealthModule> | null = null;
const health = () => (mod ??= import("@capgo/capacitor-health"));

const READ = ["weight", "height", "bodyFat", "restingHeartRate", "heartRateVariability", "sleep", "heartRate"] as const;
const WRITE = ["calories", "heartRate"] as const;

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
