"use client";

import { create } from "zustand";

// Background network work and whether the device can reach us (Melvin, 2026-11-13: "data should always sync in the
// background … gyms can have bad reception"; docs/decisions/background-sync.md). Screens read from the device first;
// anything that then goes to the network behind them is wrapped in `track`, which drives the small syncing ring
// (SyncSpinner.tsx). `api()` in auth.ts reports each answer or failure here, so `offline` follows real requests, not
// only the browser's own guess. No imports from auth.ts, so auth.ts can import this.

export type NetState = {
  /** Background requests on their way right now (sync, a screen refreshing what it showed from the device). */
  busy: number;
  /** The last request couldn't reach the server, or the phone says it has no connection. */
  offline: boolean;
};

const browserOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

export const useNet = create<NetState>(() => ({ busy: 0, offline: browserOffline() }));

/** A request reached the server (any answer, even an error, means the network works). */
export function noteOnline() {
  if (useNet.getState().offline) useNet.setState({ offline: false });
}

/** A request couldn't reach the server. */
export function noteOffline() {
  if (!useNet.getState().offline) useNet.setState({ offline: true });
}

/** Whether a failure means "couldn't reach the server" (api()'s offline error, or a server that's down). */
export function unreachable(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  if (e.message === "offline") return true;
  const status = (e as Error & { status?: number }).status;
  return typeof status === "number" && status >= 500;
}

/** Counts a background request while it's on its way, for the syncing ring. Returns the same promise. */
export function track<T>(p: Promise<T>): Promise<T> {
  useNet.setState((s) => ({ busy: s.busy + 1 }));
  const done = () => useNet.setState((s) => ({ busy: Math.max(0, s.busy - 1) }));
  p.then(done, done);
  return p;
}

/** Follows the phone's own online and offline events. Returns the cleanup. */
export function watchNet(): () => void {
  const on = () => noteOnline();
  const off = () => noteOffline();
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  if (browserOffline()) noteOffline();
  return () => {
    window.removeEventListener("online", on);
    window.removeEventListener("offline", off);
  };
}
