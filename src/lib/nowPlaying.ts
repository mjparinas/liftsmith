"use client";

import { useEffect } from "react";
import { create } from "zustand";

import { unlisten, type ListenerHandle } from "./nativeListen";
import type { Profile } from "./types";
import { useVisible } from "./visibility";

// Now playing (Melvin, 2026-11-13, in place of the mood playlists; docs/decisions/now-playing.md): a small
// control on Today and the workout screen that plays, pauses and skips whatever music app is playing. On by
// default, with a switch in Settings › Workout. The NowPlaying plugin does the work on each phone:
//
// - Android (NowPlayingPlugin.java): the phone's media keys, which reach any music app with no permission;
//   with notification access (MediaListener) it also reads the song, the artist and the app.
// - iOS (NowPlayingPlugin.swift): Apple Music only, after the lifter allows it. Apple gives apps no way to
//   read or control Spotify or other music apps.
// - Web: a page can't see or control other apps' music, so there's no control and no switch.
//
// It listens only while the control is on screen and the app is in front (docs/decisions/battery.md).

export type NowCommand = "play" | "pause" | "next" | "previous";

export interface NowPlaying {
  playing: boolean;
  title?: string;
  artist?: string;
  /** The app playing ("Spotify"), when the phone says. */
  app?: string;
}

interface Snapshot {
  now: NowPlaying | null;
  granted?: boolean;
}

export interface NowAccess {
  granted: boolean;
  /** Whether asking can still show the phone's prompt or page (iOS asks once, then only Settings can). */
  canAsk: boolean;
}

type Plugin = {
  state(): Promise<Snapshot>;
  watch(): Promise<Snapshot>;
  unwatch(): Promise<void>;
  control(o: { do: NowCommand }): Promise<void>;
  access(): Promise<NowAccess>;
  askAccess(): Promise<NowAccess>;
  addListener(event: "change", cb: (d: Snapshot) => void): ListenerHandle | Promise<ListenerHandle>;
};
type Cap = { isNativePlatform?: () => boolean; getPlatform?: () => string; Plugins?: { NowPlaying?: Plugin } };

const plugin = (): Plugin | undefined => {
  if (typeof window === "undefined") return undefined;
  const c = (window as unknown as { Capacitor?: Cap }).Capacitor;
  return c?.isNativePlatform?.() ? c.Plugins?.NowPlaying : undefined;
};

/** Whether this phone has the control (the Android and iOS apps). */
export function nowPlayingSupported(): boolean {
  return !!plugin();
}

/** Whether to show the control: a phone that has it, and the switch not turned off (missing means on). */
export function nowPlayingOn(profile: Pick<Profile, "training">): boolean {
  return nowPlayingSupported() && profile.training?.nowPlaying !== false;
}

interface NowState {
  now: NowPlaying | null;
  set(now: NowPlaying | null): void;
  clear(): void;
}

/**
 * The next thing to show. Without song names (Android before notification access) the phone only says
 * whether music is playing, so once music has shown up the control stays, paused, until the screen closes:
 * that way Pause doesn't make Play disappear.
 */
export function nextNow(prev: NowPlaying | null, next: NowPlaying | null): NowPlaying | null {
  if (next) return next;
  if (prev && !prev.title) return { ...prev, playing: false };
  return null;
}

export const useNowPlaying = create<NowState>((set) => ({
  now: null,
  set: (now) => set((s) => ({ now: nextNow(s.now, now) })),
  clear: () => set({ now: null }),
}));

/** Plays, pauses or skips. Shows the change at once (play and pause), and the phone confirms with its next update. */
export async function nowSend(what: NowCommand): Promise<void> {
  const p = plugin();
  if (!p) return;
  const cur = useNowPlaying.getState().now;
  if (cur && (what === "play" || what === "pause")) useNowPlaying.setState({ now: { ...cur, playing: what === "play" } });
  try {
    await p.control({ do: what });
  } catch {
    // The music app went away; the next update says so.
  }
}

export async function nowAccess(): Promise<NowAccess | null> {
  const p = plugin();
  if (!p) return null;
  try {
    return await p.access();
  } catch {
    return null;
  }
}

/** Asks for song names: Android's notification access page, or iOS's Apple Music prompt. */
export async function askNowAccess(): Promise<NowAccess | null> {
  const p = plugin();
  if (!p) return null;
  try {
    return await p.askAccess();
  } catch {
    return null;
  }
}

/** Listens while `on` and the app is in front; stops and forgets when it closes or goes to the background. */
export function useNowPlayingWatch(on: boolean): void {
  const visible = useVisible();
  useEffect(() => {
    const p = plugin();
    if (!p || !on || !visible) return;
    const put = (d: Snapshot | undefined) => useNowPlaying.getState().set(d?.now ?? null);
    const off = unlisten(p.addListener("change", put));
    p.watch().then(put, () => {});
    return () => {
      off();
      p.unwatch().catch(() => {});
      useNowPlaying.getState().clear();
    };
  }, [on, visible]);
}
