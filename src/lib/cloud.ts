// What the app and the server share about connected cloud services (AGENTS.md "Connected apps",
// docs/decisions/connected-apps.md): Strava gets finished workouts; Oura, Whoop, Withings and Polar send sleep,
// HRV, resting heart rate, steps and weigh-ins in; Concept2 sends rows, ski and bike sessions in as cardio; Sonos takes play, skip and volume commands (a lab, docs/decisions/sonos.md). The server holds the OAuth tokens (src/server/connect.ts); the app holds everything else.
import type { HealthMetric } from "./types";

export const CLOUD = ["strava", "oura", "whoop", "withings", "polar", "concept2", "sonos"] as const;
export type Cloud = (typeof CLOUD)[number];

export const CLOUD_NAME: Record<Cloud, string> = {
  strava: "Strava",
  oura: "Oura",
  whoop: "WHOOP",
  withings: "Withings",
  polar: "Polar",
  concept2: "Concept2",
  sonos: "Sonos",
};

export const isCloud = (p: unknown): p is Cloud => typeof p === "string" && (CLOUD as readonly string[]).includes(p);

/** Services that send health readings in (GET /api/connect/<service>/daily/). */
export const READS = ["oura", "whoop", "withings", "polar"] as const;
export type ReadingCloud = (typeof READS)[number];
export const isReadingCloud = (p: unknown): p is ReadingCloud => typeof p === "string" && (READS as readonly string[]).includes(p);

/** GET /api/connect/: which services this server has keys for, and which this account has connected. */
export interface CloudStatus {
  /** False when the server has no client id and secret for it yet (the row says "Coming soon"). */
  ready: Record<Cloud, boolean>;
  linked: Partial<Record<Cloud, { since: number; who?: string }>>;
}

/**
 * One day's reading from a cloud service, in the same shape as Health's (health.ts DailyReading). A scale
 * (Withings) also sends `weight` (kg) and `bodyFat` (%), which the app saves as a weigh-in, not a health reading.
 */
export interface CloudReading {
  metric: HealthMetric | "weight" | "bodyFat";
  day: string;
  value: number;
  at: number;
}

/** GET /api/connect/concept2/results/: one Concept2 Logbook session (a row, ski or bike piece). */
export interface CloudCardio {
  /** The Logbook's own id, so an import is never doubled. */
  id: string;
  kind: "rower" | "skierg" | "bike";
  /** Start, ms. */
  start: number;
  seconds: number;
  distanceM: number;
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

// --- Sonos (a lab, docs/decisions/sonos.md): GET and POST /api/connect/sonos/player/ ---

/** One Sonos group: a speaker, or speakers grouped to play together. Group ids change when the lifter regroups. */
export interface SonosGroup {
  id: string;
  name: string;
  household: string;
  playing: boolean;
}

/** A Sonos favourite (a playlist, station or album the lifter saved in the Sonos app). */
export interface SonosFavourite {
  id: string;
  name: string;
  household: string;
}

/** What one group is playing now. */
export interface SonosNow {
  group: string;
  playing: boolean;
  /** 0 to 100; null when the speaker has fixed volume (a line out to an amplifier). */
  volume: number | null;
  track: string | null;
  artist: string | null;
  /** Album art from the music service, https only. */
  image: string | null;
}

/** GET /api/connect/sonos/player/?group=<id> */
export interface SonosState {
  groups: SonosGroup[];
  favourites: SonosFavourite[];
  /** Only when a group was asked for and still exists. */
  now: SonosNow | null;
}

export type SonosCommand =
  | { do: "play" }
  | { do: "pause" }
  | { do: "next" }
  | { do: "previous" }
  | { do: "volume"; level: number }
  | { do: "nudge"; delta: number }
  | { do: "favourite"; id: string };

/** Sonos ids are short and plain (RINCON_…:12, household ids, favourite numbers). */
export const isSonosId = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_:.\-]{1,120}$/.test(v);

/** A command from the app, checked; null when it's anything else. */
export function checkSonosCommand(raw: unknown): SonosCommand | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  switch (c.do) {
    case "play":
    case "pause":
    case "next":
    case "previous":
      return { do: c.do };
    case "volume":
      return typeof c.level === "number" && Number.isFinite(c.level)
        ? { do: "volume", level: Math.round(Math.min(100, Math.max(0, c.level))) }
        : null;
    case "nudge":
      return typeof c.delta === "number" && Number.isFinite(c.delta) && c.delta !== 0
        ? { do: "nudge", delta: Math.round(Math.min(100, Math.max(-100, c.delta))) }
        : null;
    case "favourite":
      return isSonosId(c.id) ? { do: "favourite", id: c.id } : null;
    default:
      return null;
  }
}
