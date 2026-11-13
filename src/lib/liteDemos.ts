"use client";

import { useSyncExternalStore } from "react";

// Battery saver for the 3D figures (Settings › Look and feel; Melvin, 2026-11-13: "lowers the resolution and lowers
// the fps of the 3d demo"). The exercise demos and the recovery map draw at screen resolution, up to twice the CSS
// pixels, at 30 frames a second (60 where you can turn the figure). With it on they draw at one device pixel per CSS
// pixel and half the frame rate, which is easier on older phones and the battery. docs/decisions/speed.md.

/** The frame rate and pixel ratio cap with battery saver on. */
export const LITE = { fps: 15, controlsFps: 30, maxDpr: 1 } as const;

let on = false;
const subs = new Set<() => void>();

/** Turned on and off from the profile (App.tsx). */
export function setLiteDemos(v: boolean): void {
  if (v === on) return;
  on = v;
  for (const f of subs) f();
}

export const liteDemos = () => on;

function subscribe(f: () => void) {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
}

/** Whether the figures draw in battery saver, for a demo component. False on the public site. */
export function useLiteDemos(): boolean {
  return useSyncExternalStore(subscribe, liteDemos, () => false);
}
