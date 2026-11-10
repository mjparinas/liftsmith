// Which heart rate the workout uses. A Bluetooth monitor (a chest strap, a watch sharing its heart rate) wins,
// because it's the lifter's own pick and reads every second. Otherwise the reading from our own watch app
// (Wear OS or Apple Watch, about every 2 s) counts while it's fresh, so a watch taken off doesn't leave an old
// number on screen. See docs/decisions/watch-apps.md.

/** A watch reading older than this is dropped. */
export const WATCH_HR_FRESH_MS = 10_000;

export interface WatchReading {
  bpm: number;
  at: number;
}

export function pickBpm(monitor: number | null, watch: WatchReading | null, now: number): number | null {
  if (monitor) return monitor;
  if (!watch || now - watch.at > WATCH_HR_FRESH_MS) return null;
  return watch.bpm;
}
