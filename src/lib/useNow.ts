"use client";

import { useEffect, useState } from "react";

import { isVisible, onVisibility } from "./visibility";

/**
 * The current time, refreshed every `ms` (or once a minute), so render stays pure.
 *
 * The clock stops while the app is in the background, so a hidden app never wakes the phone just to redraw a
 * screen nobody can see, and it jumps to the right time the moment the app comes back. `wakeAt` asks for one
 * tick at that moment even while hidden (the web's rest-over alert); nothing else runs in the background.
 */
export function useNow(ms = 60_000, wakeAt?: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let wake: ReturnType<typeof setTimeout> | undefined;
    const run = (visible: boolean) => {
      clearInterval(interval);
      clearTimeout(wake);
      interval = wake = undefined;
      if (visible) {
        setNow(Date.now());
        interval = setInterval(() => setNow(Date.now()), ms);
      } else if (wakeAt && wakeAt > Date.now()) {
        wake = setTimeout(() => setNow(Date.now()), wakeAt - Date.now());
      }
    };
    run(isVisible());
    const off = onVisibility(run);
    return () => {
      off();
      clearInterval(interval);
      clearTimeout(wake);
    };
  }, [ms, wakeAt]);
  return now;
}
