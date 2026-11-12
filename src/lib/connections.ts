"use client";

// Connected apps (Settings › Connected apps, Connections.tsx; docs/decisions/connected-apps.md).
// - Health Connect / Apple Health: health.ts, on the device.
// - Strava, Oura, Whoop, Withings, Polar and Concept2: through our server (src/server/connect.ts), which keeps
//   the OAuth tokens, so they need a Liftsmith account. Strava gets each finished workout (an outbox here, so a
//   workout finished offline goes up later); Oura, Whoop, Withings and Polar readings come in as health events
//   and weigh-ins, like Health's; Concept2 sessions come in as cardio workouts.
// - Music: a curated playlist for the day's call, opened in the lifter's music app. No account, no API.
import { create } from "zustand";

import { api, AuthError, platform, readAccount } from "./auth";
import { localIso, READS, type Cloud, type CloudCardio, type CloudReading, type CloudStatus, type CloudWorkout } from "./cloud";
import { can } from "./entitlements";
import { exerciseName } from "./game";
import { t } from "./i18n";
import { isNative } from "./juice";
import type { Call } from "./readiness";
import { useApp } from "./store";
import type { AppEvent, MusicApp, Unit } from "./types";
import { fmtNum, fromKg } from "./units";

export { CLOUD_NAME } from "./cloud";

// --- Opening links outside the app ---

/**
 * Opens a page outside the app. In the Android and iOS apps a top-level navigation to another site is handed
 * to the phone (Capacitor opens the browser, or the music app for its links); on the web it's a new tab, or
 * this tab for a sign-in page that comes back here.
 */
export function openOutside(url: string, sameTab = false): void {
  if (isNative() || sameTab) location.assign(url);
  else window.open(url, "_blank", "noopener");
}

// --- Cloud services: status, connect, disconnect ---

interface CloudState {
  status: CloudStatus | null;
  busy: Cloud | null;
  error: string | null;
  /** Last time each service sent readings in, on this device. */
  pulled: Partial<Record<Cloud, number>>;
}

const PULLED_KEY = "ls.cloud.pulled";
// The last status, so a workout finished offline still knows Strava is connected.
const STATUS_KEY = "ls.cloud.status";
function readJson<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? "null") as T | null) ?? fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, v: unknown): void {
  try {
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

export const useCloud = create<CloudState>(() => ({
  status: typeof window === "undefined" ? null : readJson<CloudStatus | null>(STATUS_KEY, null),
  busy: null,
  error: null,
  pulled: typeof window === "undefined" ? {} : readJson<CloudState["pulled"]>(PULLED_KEY, {}),
}));

useCloud.subscribe((s, prev) => {
  if (s.status !== prev.status) writeJson(STATUS_KEY, s.status);
});

const linked = (p: Cloud) => !!useCloud.getState().status?.linked[p];

export async function refreshCloud(): Promise<void> {
  const account = readAccount();
  if (!account) return useCloud.setState({ status: null });
  try {
    useCloud.setState({ status: await api<CloudStatus>("/api/connect/", { token: account.token }) });
  } catch (e) {
    // Offline, or the server isn't set up: keep what we knew.
    if (e instanceof AuthError && e.status === 401) useCloud.setState({ status: null });
  }
}

function errorText(e: unknown): string {
  if (e instanceof AuthError && e.message === "offline") return t("conn.offline");
  if (e instanceof AuthError && (e.status === 503 || e.message === "notReady")) return t("conn.notReady");
  return t("conn.failed");
}

/** Opens the service's own page to allow Liftsmith. The lifter comes back to Connected apps. */
export async function connectCloud(p: Cloud): Promise<void> {
  const account = readAccount();
  // The cloud connections are Pro (Melvin, 2026-11-12): Connections.tsx sends free lifters to the paywall instead.
  if (!account || !can("cloudConnections")) return;
  useCloud.setState({ busy: p, error: null });
  try {
    const { url } = await api<{ url: string }>(`/api/connect/${p}/`, { token: account.token, body: { platform: platform() } });
    openOutside(url, true);
  } catch (e) {
    useCloud.setState({ error: errorText(e) });
  } finally {
    useCloud.setState({ busy: null });
  }
}

export async function disconnectCloud(p: Cloud): Promise<void> {
  const account = readAccount();
  if (!account) return;
  useCloud.setState({ busy: p, error: null });
  try {
    await api(`/api/connect/${p}/`, { token: account.token, method: "DELETE" });
    if (p === "strava") writeOutbox([]);
    await refreshCloud();
  } catch (e) {
    useCloud.setState({ error: errorText(e) });
  } finally {
    useCloud.setState({ busy: null });
  }
}

// --- Oura, Whoop, Withings and Polar: readings in; Concept2: sessions in ---

/** Pulls the last 45 days from each connected service that sends readings, and Concept2 sessions. Returns how many were new. */
export async function pullCloud(force = false, now = Date.now()): Promise<number> {
  const account = readAccount();
  // Without Pro a connection stays linked but pauses; it picks up the missed days (45 back) when Pro returns.
  if (!account || !can("cloudConnections")) return 0;
  let added = 0;
  for (const p of READS) {
    if (!linked(p)) continue;
    // Every three hours is plenty: both services score a night once.
    if (!force && now - (useCloud.getState().pulled[p] ?? 0) < 3 * 3_600_000) continue;
    try {
      const tz = -new Date(now).getTimezoneOffset();
      const r = await api<{ readings: CloudReading[] }>(`/api/connect/${p}/daily/?days=45&tz=${tz}`, { token: account.token });
      added += useApp.getState().importCloudReadings(p, r.readings);
      const pulled = { ...useCloud.getState().pulled, [p]: now };
      useCloud.setState({ pulled });
      writeJson(PULLED_KEY, pulled);
    } catch (e) {
      // 409: the lifter removed Liftsmith at the service's end. Show it as not connected.
      if (e instanceof AuthError && e.status === 409) await refreshCloud();
    }
  }
  if (linked("concept2") && (force || now - (useCloud.getState().pulled.concept2 ?? 0) >= 3 * 3_600_000)) {
    try {
      const tz = -new Date(now).getTimezoneOffset();
      // The first pull brings the last year of sessions; later ones the last 30 days.
      const days = useCloud.getState().pulled.concept2 ? 30 : 365;
      const r = await api<{ sessions: CloudCardio[] }>(`/api/connect/concept2/results/?days=${days}&tz=${tz}`, { token: account.token });
      added += useApp.getState().importCloudCardio(r.sessions, now);
      const pulled = { ...useCloud.getState().pulled, concept2: now };
      useCloud.setState({ pulled });
      writeJson(PULLED_KEY, pulled);
    } catch (e) {
      if (e instanceof AuthError && e.status === 409) await refreshCloud();
    }
  }
  return added;
}

// --- Strava: finished workouts out ---

/** A finished workout as a Strava activity: a name, and the sets, one line per exercise. Exported for tests. */
export function stravaWorkout(events: readonly AppEvent[], sessionId: string, unit: Unit): CloudWorkout | null {
  const start = events.find((e) => e.type === "sessionStart" && e.sessionId === sessionId);
  const end = events.find((e) => e.type === "sessionEnd" && e.sessionId === sessionId);
  if (!start || !end || end.type !== "sessionEnd") return null;
  const byEx = new Map<string, string[]>();
  let total = 0;
  for (const e of events) {
    if (e.type !== "set" || e.sessionId !== sessionId) continue;
    total += 1;
    const w = e.weight > 0 ? t("conn.strava.set", { weight: fmtNum(fromKg(e.weight, unit)), unit, reps: e.reps }) : String(e.reps);
    byEx.set(e.exerciseId, [...(byEx.get(e.exerciseId) ?? []), w]);
  }
  if (!total) return null;
  const lines = [...byEx.entries()].map(([id, sets]) => t("conn.strava.line", { name: exerciseName(id), sets: sets.join(", ") }));
  return {
    sessionId,
    name: t("conn.strava.title"),
    description: [...lines, "", t("conn.strava.footer")].join("\n"),
    startLocal: localIso(start.at),
    seconds: Math.max(60, Math.round(end.seconds)),
  };
}

const OUT_KEY = "ls.strava.out";

function readOutbox(): CloudWorkout[] {
  try {
    const v = JSON.parse(localStorage.getItem(OUT_KEY) ?? "[]") as unknown;
    return Array.isArray(v) ? (v as CloudWorkout[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(list: CloudWorkout[]): void {
  try {
    localStorage.setItem(OUT_KEY, JSON.stringify(list.slice(-50)));
  } catch {}
}

/** Called when a workout ends: queues it for Strava when Strava is connected and posting is on, then sends. */
export function queueStrava(sessionId: string): void {
  const { events, profile } = useApp.getState();
  if (!readAccount() || !can("cloudConnections") || !linked("strava") || profile.connections?.stravaPost === false) return;
  const w = stravaWorkout(events, sessionId, profile.unit);
  if (!w) return;
  writeOutbox([...readOutbox().filter((x) => x.sessionId !== w.sessionId), w]);
  void flushStrava();
}

let flushing: Promise<void> | null = null;

/** Sends waiting workouts. A failure keeps them for next time; "unlinked" drops them (Strava was removed). */
export function flushStrava(): Promise<void> {
  flushing ??= (async () => {
    const account = readAccount();
    if (!account) return;
    for (const w of readOutbox()) {
      try {
        await api("/api/connect/strava/upload/", { token: account.token, body: w });
        writeOutbox(readOutbox().filter((x) => x.sessionId !== w.sessionId));
      } catch (e) {
        if (e instanceof AuthError && (e.status === 409 || e.status === 400)) {
          writeOutbox(readOutbox().filter((x) => x.sessionId !== w.sessionId));
          if (e.status === 409) await refreshCloud();
        } else break; // Offline or Strava is down: try again later.
      }
    }
  })().finally(() => {
    flushing = null;
  });
  return flushing;
}

export const stravaWaiting = () => readOutbox().length;

/** Keeps connected services fresh while the app runs: on start and each time it comes to the front. */
export function startConnections(): () => void {
  const tick = async () => {
    await refreshCloud();
    await pullCloud();
    await flushStrava();
  };
  void tick();
  const visible = () => {
    if (document.visibilityState === "visible") void tick();
  };
  document.addEventListener("visibilitychange", visible);
  window.addEventListener("online", visible);
  return () => {
    document.removeEventListener("visibilitychange", visible);
    window.removeEventListener("online", visible);
  };
}

// --- Music: a curated playlist for the day's call ---

export const MUSIC_APPS: readonly MusicApp[] = ["spotify", "apple", "youtube"];
export const MUSIC_NAME: Record<MusicApp, string> = { spotify: "Spotify", apple: "Apple Music", youtube: "YouTube Music" };

/**
 * Public playlists we picked (Melvin, 2026-11-09: curated public playlists for now, no Spotify API). Spotify's
 * are fixed editorial playlists, checked by hand; Apple Music and YouTube Music open their search for the same
 * kind of playlist, because their playlist links change by country.
 */
export const PLAYLISTS: Record<Call, { spotify: string; search: string }> = {
  push: { spotify: "37i9dQZF1DX76Wlfdnj7AP", search: "beast mode workout" },
  normal: { spotify: "37i9dQZF1DWUVpAXiEPK8P", search: "power workout" },
  recover: { spotify: "37i9dQZF1DX3rxVfibe1L0", search: "feel good workout" },
};

export function musicLink(app: MusicApp, call: Call): string {
  const p = PLAYLISTS[call];
  const q = encodeURIComponent(p.search);
  if (app === "spotify") return `https://open.spotify.com/playlist/${p.spotify}`;
  if (app === "apple") return `https://music.apple.com/search?term=${q}`;
  return `https://music.youtube.com/search?q=${q}`;
}
