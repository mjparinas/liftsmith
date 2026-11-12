"use client";

import { unlisten, type ListenerHandle } from "./nativeListen";

// Volume up logs a set (a lab, `labVolumeLog`; Melvin picked it on 2026-11-12 over the earbuds' play/pause,
// which belongs to the music app and would pause the music). While it's on, a press of volume up on the
// phone or on Bluetooth earbuds logs the set as planned and the volume goes back where it was; volume down
// still turns it down. The VolumeKeys plugin does the listening on each phone:
//
// - Android (VolumeKeysPlugin.java, MainActivity.dispatchKeyEvent): takes the phone's volume up key, and
//   watches the music volume for earbuds, putting it back after a rise. Only while the app is on screen.
// - iOS (VolumeKeysPlugin.swift): watches the audio session's volume (phone and earbuds alike) and puts it
//   back through a hidden system volume slider, so no volume pop-up shows. Only while the app is in front.
// - Web: browsers don't hand volume keys to pages, so the lab is phone-only (`native: true`).

/** Presses closer together than this are one press: a held key, or the volume rising twice over Bluetooth. */
export const PRESS_GAP_MS = 700;

type Plugin = {
  enable(): Promise<void>;
  disable(): Promise<void>;
  addListener(event: "press", cb: (d: { from?: string }) => void): ListenerHandle | Promise<ListenerHandle>;
};
type Cap = { isNativePlatform?: () => boolean; Plugins?: { VolumeKeys?: Plugin } };

const plugin = (): Plugin | undefined => {
  if (typeof window === "undefined") return undefined;
  const c = (window as unknown as { Capacitor?: Cap }).Capacitor;
  return c?.isNativePlatform?.() ? c.Plugins?.VolumeKeys : undefined;
};

/** Whether this phone can listen for volume presses (the Android and iOS apps). */
export function volumeKeysSupported(): boolean {
  return !!plugin();
}

/** Whether a press at `at` counts, given the last one that did. */
export function takePress(at: number, last: number | null, gap = PRESS_GAP_MS): boolean {
  return last === null || at - last >= gap;
}

/**
 * Listens for volume up presses until the returned function is called, which hands the volume key back.
 * Does nothing (and returns a no-op) where there's no plugin.
 */
export function onVolumePress(cb: () => void, clock: () => number = Date.now): () => void {
  const p = plugin();
  if (!p) return () => {};
  let last: number | null = null;
  const off = unlisten(
    p.addListener("press", () => {
      const at = clock();
      if (!takePress(at, last)) return;
      last = at;
      cb();
    }),
  );
  p.enable().catch(() => {});
  return () => {
    off();
    p.disable().catch(() => {});
  };
}
