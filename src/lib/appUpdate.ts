"use client";

// "A new version is ready" (Melvin, 2026-11-14: "on start up (in the background) … see if there is a newer version
// of the app and if there is, take them to the download page"; docs/decisions/app-updates.md).
//
// On start, and on return to the app at most every 12 hours, the phone asks its store in the background whether a
// newer version is out: Google Play's In-App Updates on Android (AppUpdatePlugin.java), the App Store's public
// lookup on iOS (AppUpdatePlugin in DelightPlugins.swift). Nothing waits for it and nothing shows offline. When
// there is one, a small note sits at the top of every screen but the workout (UpdateToast.tsx). Update starts
// Play's own flexible update on Android (it downloads while the lifter keeps using the app, then the note says
// Restart), or opens the store page when Play's flow can't run, and on iOS opens the App Store page. Closing the
// note hides it for that version for a week, so it never nags. Settings › Help › Version also has Check for
// updates (WhatsNew.tsx): a tap asks the store at once and, when one is found, Install (or Restart when Play has
// already downloaded it). The web app needs none of this: every open loads the newest page (public/sw.js is
// network first).
import { create } from "zustand";

import { isNative } from "./juice";
import { unlisten, type ListenerHandle } from "./nativeListen";
import { onVisibility } from "./visibility";

const KEY = "liftsmith.appUpdate";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Checks on return to the app are at least this far apart (the start-up check always runs). */
export const CHECK_GAP = 12 * HOUR;
/** Closing the note hides that version for this long. */
export const DISMISS_DAYS = 7;
/** The start-up check waits this long, so it never competes with the first screen. */
const START_DELAY = 4000;

export interface UpdateInfo {
  available: boolean;
  /** The store's version: a version code on Android, "1.2.0" on iOS. */
  version?: string;
  /** Android: Play already downloaded it and it only needs a restart. */
  downloaded?: boolean;
}

interface Saved {
  checkedAt?: number;
  dismissed?: { version: string; at: number };
}

export type UpdatePhase = "none" | "available" | "downloading" | "ready";

/** What a check found, for Settings' Check for updates. */
export type CheckResult = "upToDate" | "available" | "ready" | "busy" | "error" | "skipped";

export const useAppUpdate = create<{ phase: UpdatePhase; version: string }>(() => ({ phase: "none", version: "" }));

/** Whether to show the note for what the store said, given what the lifter closed before. */
export function offerUpdate(info: UpdateInfo, dismissed: Saved["dismissed"] | undefined, now: number): boolean {
  if (!info.available) return false;
  if (info.downloaded) return true;
  const v = info.version ?? "";
  if (dismissed && dismissed.version === v && now - dismissed.at < DISMISS_DAYS * DAY) return false;
  return true;
}

/** Whether a return to the app should ask the store again. */
export function dueCheck(checkedAt: number | undefined, now: number): boolean {
  return checkedAt == null || now - checkedAt >= CHECK_GAP;
}

type Plugin = {
  check(): Promise<UpdateInfo>;
  start(): Promise<{ started: boolean; downloaded?: boolean }>;
  complete(): Promise<void>;
  open(): Promise<void>;
  addListener?(event: string, cb: () => void): ListenerHandle | Promise<ListenerHandle>;
};

const plugin = (): Plugin | undefined =>
  typeof window !== "undefined"
    ? (window as unknown as { Capacitor?: { Plugins?: { AppUpdate?: Plugin } } }).Capacitor?.Plugins?.AppUpdate
    : undefined;

function read(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : {};
  } catch {
    return {};
  }
}

function write(s: Saved): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Without storage the note may come back next time; that's all.
  }
}

let checking = false;

/**
 * Asks the store once. Never throws, never blocks. Background checks honour a closed note; a Settings tap
 * passes `{ force: true }` so a version the lifter closed still shows Install.
 */
export async function checkForUpdate(now = Date.now(), opts?: { force?: boolean }): Promise<CheckResult> {
  const p = plugin();
  if (!p || !isNative()) return "skipped";
  if (checking) return "busy";
  checking = true;
  try {
    const info = await p.check();
    const saved = read();
    const force = !!opts?.force;
    write({
      checkedAt: now,
      // A deliberate check clears a closed note for that version, so Install and the toast agree.
      dismissed: force && info.available && saved.dismissed?.version === (info.version ?? "") ? undefined : saved.dismissed,
    });
    if (useAppUpdate.getState().phase === "downloading" && !info.downloaded) return "busy";
    if (info.downloaded) {
      useAppUpdate.setState({ phase: "ready", version: info.version ?? "" });
      return "ready";
    }
    if (info.available && (force || offerUpdate(info, saved.dismissed, now))) {
      useAppUpdate.setState({ phase: "available", version: info.version ?? "" });
      return "available";
    }
    if (!info.available) {
      useAppUpdate.setState({ phase: "none", version: "" });
      return "upToDate";
    }
    // Still available in the store, but the note was closed for this version.
    return "upToDate";
  } catch {
    // Offline or no store: try again next time.
    return "error";
  } finally {
    checking = false;
  }
}

/** Starts checking: once shortly after start, then on return to the app at most every 12 hours. Returns a stop function. */
export function startAppUpdates(): () => void {
  const p = plugin();
  if (!p || !isNative()) return () => {};
  const timer = setTimeout(() => void checkForUpdate(), START_DELAY);
  const off = onVisibility((visible) => {
    if (visible && dueCheck(read().checkedAt, Date.now())) void checkForUpdate();
  });
  let stopDownloaded = () => {};
  let stopFailed = () => {};
  try {
    stopDownloaded = unlisten(p.addListener?.("downloaded", () => useAppUpdate.setState({ phase: "ready" })));
    stopFailed = unlisten(p.addListener?.("failed", () => useAppUpdate.setState({ phase: "available" })));
  } catch {
    // No events (iOS has no download step): nothing to listen for.
  }
  return () => {
    clearTimeout(timer);
    off();
    stopDownloaded();
    stopFailed();
  };
}

/** The note's Update / Settings' Install: Play's own update on Android, else the store page. */
export async function updateNow(): Promise<void> {
  const p = plugin();
  if (!p) return;
  try {
    const r = await p.start();
    if (r.downloaded) {
      useAppUpdate.setState({ phase: "ready" });
      return;
    }
    if (r.started) {
      useAppUpdate.setState({ phase: "downloading" });
      return;
    }
  } catch {
    // Fall through to the store page.
  }
  try {
    await p.open();
  } catch {
    // Nothing to open.
  }
}

/** The note's Restart: installs the downloaded update (Android). The workout in progress is saved, so nothing is lost. */
export async function restartNow(): Promise<void> {
  try {
    await plugin()?.complete();
  } catch {
    // Play will install it next time the app starts.
  }
}

/** The note's ✕: hides this version for a week. */
export function dismissUpdate(now = Date.now()): void {
  const { version } = useAppUpdate.getState();
  write({ ...read(), dismissed: { version, at: now } });
  useAppUpdate.setState({ phase: "none" });
}
