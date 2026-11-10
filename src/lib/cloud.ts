// What the app and the server share about connected cloud services (AGENTS.md "Connected apps",
// docs/decisions/connected-apps.md): Strava gets finished workouts, Oura and Whoop send sleep, HRV and resting
// heart rate in. The server holds the OAuth tokens (src/server/connect.ts); the app holds everything else.
import type { HealthMetric } from "./types";

export const CLOUD = ["strava", "oura", "whoop"] as const;
export type Cloud = (typeof CLOUD)[number];

export const isCloud = (p: unknown): p is Cloud => typeof p === "string" && (CLOUD as readonly string[]).includes(p);

/** Services that send health readings in (the others only receive). */
export const READS: readonly Cloud[] = ["oura", "whoop"];

/** GET /api/connect/: which services this server has keys for, and which this account has connected. */
export interface CloudStatus {
  /** False when the server has no client id and secret for it yet (the row says "Coming soon"). */
  ready: Record<Cloud, boolean>;
  linked: Partial<Record<Cloud, { since: number; who?: string }>>;
}

/** One day's reading from a cloud service, in the same shape as Health's (health.ts DailyReading). */
export interface CloudReading {
  metric: HealthMetric;
  day: string;
  value: number;
  at: number;
}

/** POST /api/connect/strava/upload/: one finished workout. */
export interface CloudWorkout {
  sessionId: string;
  name: string;
  description: string;
  /** Start, as the lifter's local wall-clock time without a zone (Strava's start_date_local). */
  startLocal: string;
  seconds: number;
}

/** Local wall-clock time without a zone, YYYY-MM-DDTHH:MM:SS, for Strava's start_date_local. */
export function localIso(t: number): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
