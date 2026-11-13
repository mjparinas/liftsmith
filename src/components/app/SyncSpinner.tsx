"use client";

import { useEffect, useState } from "react";

import { useNet } from "@/lib/net";

/** Background work shorter than this never shows the ring, so a quick answer doesn't flicker. */
export const SHOW_AFTER_MS = 300;
/** Once shown, the ring stays at least this long, so it reads as a ring and not a blink. */
export const MIN_SHOW_MS = 700;

/**
 * The small syncing ring (Melvin, 2026-11-13: "a small white circle outline with a gradient that spins"): top right,
 * under the status bar, while background sync or a screen's background refresh is on its way (net.ts `track`). It's
 * decoration only (screen readers aren't told every time the app syncs) and never takes a tap. It isn't drawn at all
 * while nothing runs, so it costs nothing then, and not during a workout, where nothing moves that the lifter didn't
 * touch. Shared web code, so Android, iOS and the web get it together.
 */
export function SyncSpinner({ hidden = false }: { hidden?: boolean }) {
  const busy = useNet((s) => s.busy > 0);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (busy) {
      const id = setTimeout(() => setShown(true), SHOW_AFTER_MS);
      return () => clearTimeout(id);
    }
    if (!shown) return;
    const id = setTimeout(() => setShown(false), MIN_SHOW_MS);
    return () => clearTimeout(id);
  }, [busy, shown]);
  if (!shown || hidden) return null;
  return <div aria-hidden className="sync-spinner" data-testid="sync-spinner" />;
}
