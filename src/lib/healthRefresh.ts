"use client";

// Health Connect and Apple Health are read when the app opens (store.ts) and again each time it comes back
// to the screen, at most every 15 minutes, so an app left in memory overnight still sees last night's sleep,
// HRV and resting heart rate, and this morning's weigh-in, before Today makes its readiness call.
// Nothing runs while the app is away (docs/decisions/battery.md): the read is started by returning, never by a clock.
import { onVisibility } from "./visibility";

export const HEALTH_REFRESH_MS = 15 * 60 * 1000;

interface Importer {
  importHealthBody(): Promise<number>;
  importHealthDaily(): Promise<number>;
}

/** Re-reads Health on each return to the app once `HEALTH_REFRESH_MS` has passed since the last read. Returns an unsubscribe function. */
export function startHealthRefresh(store: () => Importer, now: () => number = Date.now): () => void {
  // The store reads Health as it loads, so the first return within 15 minutes of opening reads nothing.
  let last = now();
  let busy = false;
  return onVisibility((visible) => {
    if (!visible || busy || now() - last < HEALTH_REFRESH_MS) return;
    busy = true;
    last = now();
    const s = store();
    void Promise.all([s.importHealthBody().catch(() => 0), s.importHealthDaily().catch(() => 0)]).finally(() => {
      busy = false;
    });
  });
}
