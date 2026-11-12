"use client";

// Sonos (a lab, `labSonos`; Melvin, 2026-11-12: "I use sonos at home, would be cool to have the app adjust my
// music, switch songs, adjust volume"; docs/decisions/sonos.md). The lifter connects Sonos once in Connected
// apps (OAuth through our server, connect.ts; the tokens stay there), picks a speaker, and then:
// - the workout screen shows what's playing with previous, play or pause, next and volume − / +;
// - "Follow my workout" sets the set volume when a set starts, the rest volume when rest starts, can start a
//   Sonos favourite with the workout, and pauses when it ends.
// Every command goes phone → our server → Sonos's cloud Control API → the speaker, so it works on Android, iOS
// and the web alike and needs no native code. Nothing here runs on a timer except one timeout for the end of
// each rest, set only during a workout (docs/decisions/battery.md).
import { create } from "zustand";

import { api, AuthError, readAccount } from "./auth";
import type { SonosCommand, SonosGroup, SonosNow, SonosState } from "./cloud";
import { refreshCloud, useCloud } from "./connections";
import { labOn } from "./labs";
import type { Active } from "./store/workout";

export interface SonosPrefs {
  /** The chosen group's id; Sonos changes it when speakers are regrouped, so the name is kept to find it again. */
  group: string | null;
  groupName: string | null;
  /** Follow my workout: set and rest volumes, the start favourite and the pause at the end. */
  follow: boolean;
  setVolume: number;
  restVolume: number;
  /** A Sonos favourite to start with each workout; null keeps whatever is playing. */
  startFavourite: string | null;
  pauseAtEnd: boolean;
}

export const SONOS_DEFAULTS: SonosPrefs = {
  group: null,
  groupName: null,
  follow: true,
  setVolume: 40,
  restVolume: 25,
  startFavourite: null,
  pauseAtEnd: true,
};

// On this device only: the speakers are in one home, and a second phone may want its own.
const KEY = "ls.sonos";

function readPrefs(): SonosPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<SonosPrefs> | null;
    return { ...SONOS_DEFAULTS, ...(raw ?? {}) };
  } catch {
    return SONOS_DEFAULTS;
  }
}

interface SonosStore {
  prefs: SonosPrefs;
  state: SonosState | null;
  loading: boolean;
  /** "unlinked", "failed" or "offline" from the last call; null when it worked. */
  error: "unlinked" | "failed" | "offline" | null;
}

export const useSonos = create<SonosStore>(() => ({
  prefs: typeof window === "undefined" ? SONOS_DEFAULTS : readPrefs(),
  state: null,
  loading: false,
  error: null,
}));

export function setSonosPrefs(p: Partial<SonosPrefs>): void {
  const prefs = { ...useSonos.getState().prefs, ...p };
  // Rest is never louder than sets.
  prefs.setVolume = clampVol(prefs.setVolume);
  prefs.restVolume = Math.min(clampVol(prefs.restVolume), prefs.setVolume);
  useSonos.setState({ prefs });
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {}
}

export const clampVol = (v: number) => Math.round(Math.min(100, Math.max(0, Number.isFinite(v) ? v : 0)));

/** Lab on, signed in and Sonos connected. */
export function sonosOn(): boolean {
  return labOn("labSonos") && !!readAccount() && !!useCloud.getState().status?.linked.sonos;
}

/**
 * The group to use: the saved one if it still exists, else one with the same name (regrouped), else the one
 * playing, else the first. Exported for tests.
 */
export function pickGroup(groups: readonly SonosGroup[], prefs: Pick<SonosPrefs, "group" | "groupName">): SonosGroup | null {
  return (
    groups.find((g) => g.id === prefs.group) ??
    groups.find((g) => !!prefs.groupName && g.name === prefs.groupName) ??
    groups.find((g) => g.playing) ??
    groups[0] ??
    null
  );
}

function fail(e: unknown): SonosStore["error"] {
  if (e instanceof AuthError && e.message === "offline") return "offline";
  if (e instanceof AuthError && e.status === 409) {
    void refreshCloud();
    return "unlinked";
  }
  return "failed";
}

/** Reads the speakers, favourites and what the chosen one is playing. */
export async function refreshSonos(): Promise<void> {
  const account = readAccount();
  if (!account) return;
  useSonos.setState({ loading: true });
  try {
    const { prefs } = useSonos.getState();
    const ask = (g: string | null) =>
      api<SonosState>(`/api/connect/sonos/player/${g ? `?group=${encodeURIComponent(g)}` : ""}`, { token: account.token });
    let state = await ask(prefs.group);
    const g = pickGroup(state.groups, prefs);
    if (g && g.id !== prefs.group) {
      setSonosPrefs({ group: g.id, groupName: g.name });
      state = await ask(g.id);
    }
    useSonos.setState({ state, error: null });
  } catch (e) {
    useSonos.setState({ error: fail(e) });
  } finally {
    useSonos.setState({ loading: false });
  }
}

/** What a command changes on screen straight away, before Sonos confirms. Exported for tests. */
export function optimistic(now: SonosNow, c: SonosCommand): SonosNow {
  switch (c.do) {
    case "play":
    case "favourite":
      return { ...now, playing: true };
    case "pause":
      return { ...now, playing: false };
    case "volume":
      return now.volume === null ? now : { ...now, volume: clampVol(c.level) };
    case "nudge":
      return now.volume === null ? now : { ...now, volume: clampVol(now.volume + c.delta) };
    case "next":
    case "previous":
      return now;
  }
}

let after: ReturnType<typeof setTimeout> | undefined;

/** Sends one command to the chosen speaker. A regrouped speaker is found again and the command retried once. */
export async function sonosSend(c: SonosCommand, retry = true): Promise<boolean> {
  const account = readAccount();
  const { prefs, state } = useSonos.getState();
  if (!account || !prefs.group) return false;
  if (state?.now && state.now.group === prefs.group) useSonos.setState({ state: { ...state, now: optimistic(state.now, c) } });
  try {
    await api("/api/connect/sonos/player/", { token: account.token, body: { group: prefs.group, command: c } });
    useSonos.setState({ error: null });
    // A new track or favourite takes a moment to show its name.
    if (c.do === "next" || c.do === "previous" || c.do === "favourite") {
      clearTimeout(after);
      after = setTimeout(() => void refreshSonos(), 1200);
    }
    return true;
  } catch (e) {
    if (retry && e instanceof AuthError && e.status === 410) {
      await refreshSonos();
      return useSonos.getState().prefs.group !== prefs.group ? sonosSend(c, false) : false;
    }
    useSonos.setState({ error: fail(e) });
    return false;
  }
}

// --- Follow my workout ---

/** A workout that started this long ago or less is new (not one coming back from storage on a reload). */
const FRESH_MS = 60_000;

const resting = (a: Active | null, now: number) => !!a?.restUntil && a.restUntil > now;

/**
 * The commands one change to the workout calls for. Pure, so the rules are tested: a new workout starts the
 * favourite (or plays) at the set volume; rest starting turns it down; rest ended early turns it back up;
 * the end of the workout pauses. The natural end of rest is a timer (`followWorkout`).
 */
export function musicSteps(prev: Active | null, next: Active | null, prefs: SonosPrefs, now: number): SonosCommand[] {
  if (!prefs.follow) return [];
  if (!prev && next) {
    if (now - next.startedAt > FRESH_MS) return [];
    return [
      prefs.startFavourite ? { do: "favourite", id: prefs.startFavourite } : { do: "play" },
      { do: "volume", level: prefs.setVolume },
    ];
  }
  if (prev && !next) return prefs.pauseAtEnd ? [{ do: "pause" }] : [];
  if (!prev || !next || prev.sessionId !== next.sessionId) return [];
  const was = resting(prev, now);
  const is = resting(next, now);
  if (!was && is) return [{ do: "volume", level: prefs.restVolume }];
  if (was && !is) return [{ do: "volume", level: prefs.setVolume }];
  return [];
}

type Store = {
  getState(): { active: Active | null };
  subscribe(l: (s: { active: Active | null }, p: { active: Active | null }) => void): () => void;
};

/** Watches the workout and moves the music with it while Sonos is on. Returns the unsubscribe. */
export function followWorkout(store: Store, clock: () => number = Date.now): () => void {
  let restEnd: ReturnType<typeof setTimeout> | undefined;
  const send = async (steps: SonosCommand[]) => {
    for (const c of steps) await sonosSend(c);
  };
  const armRest = (a: Active | null) => {
    clearTimeout(restEnd);
    restEnd = undefined;
    const until = a?.restUntil;
    if (!until || until <= clock()) return;
    restEnd = setTimeout(() => {
      restEnd = undefined;
      const cur = store.getState().active;
      const { prefs } = useSonos.getState();
      // Still the same rest, now run out: the set is about to start.
      if (cur?.restUntil === until && prefs.follow && sonosOn()) void sonosSend({ do: "volume", level: prefs.setVolume });
    }, until - clock());
  };
  const off = store.subscribe((s, p) => {
    if (s.active === p.active) return;
    if (s.active?.restUntil !== p.active?.restUntil || !s.active) armRest(s.active);
    if (!sonosOn()) return;
    const steps = musicSteps(p.active, s.active, useSonos.getState().prefs, clock());
    if (steps.length) void send(steps);
  });
  return () => {
    off();
    clearTimeout(restEnd);
  };
}
