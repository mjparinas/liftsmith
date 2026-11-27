"use client";

import { useEffect, useState } from "react";

import { isVisible, onVisibility } from "./visibility";

/**
 * The current time, refreshed every `ms` (or once a minute), so render stays pure.
 *
 * The clock stops while the app is in the background, so a hidden app never wakes the phone just to redraw a
 * screen nobody can see, and it jumps to the right time the moment the app comes back. `wakeAt` asks for one
 * tick at that moment even while hidden (the web's rest-over alert); nothing else runs in the background.
 *
 * `alignTo` (a countdown's end or a timer's start) also ticks a few ms after each of its whole seconds, so a
 * countdown on screen turns over on the same moment as the lock screen and the watches, which count to the same
 * time (watch-apps.md "Same second as the phone"), rather than up to `ms` later.
 */
export function useNow(ms = 60_000, wakeAt?: number, alignTo?: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let interval: ReturnType<typeof setTimeout> | undefined;
    let wake: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      interval = setTimeout(tick, nextTickDelay(t, ms, alignTo));
    };
    const run = (visible: boolean) => {
      clearTimeout(interval);
      clearTimeout(wake);
      interval = wake = undefined;
      if (visible) {
        tick();
      } else if (wakeAt && wakeAt > Date.now()) {
        wake = setTimeout(() => setNow(Date.now()), wakeAt - Date.now());
      }
    };
    run(isVisible());
    const off = onVisibility(run);
    return () => {
      off();
      clearTimeout(interval);
      clearTimeout(wake);
    };
  }, [ms, wakeAt, alignTo]);
  return now;
}

/** Ms to the next tick: `ms`, or sooner when one of `alignTo`'s whole seconds comes first (landing 5 ms after it). */
export function nextTickDelay(now: number, ms: number, alignTo?: number): number {
  if (!alignTo) return ms;
  const toSecond = (((alignTo - now) % 1000) + 1000) % 1000 || 1000;
  return Math.min(ms, toSecond + 5);
}
