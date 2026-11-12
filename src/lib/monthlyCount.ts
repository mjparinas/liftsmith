"use client";

// The app-wide count on this month's challenge (Friends gap list 3, item 10; docs/decisions/friends.md "Monthly
// finishers"). Once the lifter finishes the month's challenge, this device reports it once (a random id made for
// this alone, kept in localStorage), and the Awards card reads how many lifters finished so far. Reads happen only
// while the card is on screen, at most every 10 minutes; offline, the card simply leaves the line out.
import { useEffect, useState } from "react";

import { canSend } from "./analytics";
import { apiUrl } from "./auth";

const DEVICE = "liftsmith.monthDevice";
const REPORTED = "liftsmith.monthReported";
const FRESH_MS = 10 * 60_000;
const cache = new Map<string, { at: number; n: number }>();

function deviceId(): string {
  try {
    const had = localStorage.getItem(DEVICE);
    if (had && /^[A-Za-z0-9_-]{16,64}$/.test(had)) return had;
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(DEVICE, id);
    return id;
  } catch {
    return "";
  }
}

const reported = (month: string) => {
  try {
    return localStorage.getItem(REPORTED) === month;
  } catch {
    return true;
  }
};

/** Reports this month as finished (once per device), then returns the count; null when it can't be reached. */
export async function finishMonth(month: string): Promise<number | null> {
  const device = deviceId();
  if (!device) return null;
  const r = await fetch(apiUrl("/api/monthly/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ month, device }),
  });
  if (!r.ok) return null;
  try {
    localStorage.setItem(REPORTED, month);
  } catch {}
  const j = (await r.json()) as { finished?: number };
  return typeof j.finished === "number" ? j.finished : null;
}

export async function monthFinishers(month: string): Promise<number | null> {
  const r = await fetch(apiUrl(`/api/monthly/?month=${month}`));
  if (!r.ok) return null;
  const j = (await r.json()) as { finished?: number };
  return typeof j.finished === "number" ? j.finished : null;
}

/** How many lifters finished `month` so far, reporting this device first once it's `done`. */
export function useMonthFinishers(month: string, done: boolean): number | null {
  const hit = cache.get(month);
  const [n, setN] = useState<number | null>(hit?.n ?? null);
  const mustReport = done && !reported(month);
  useEffect(() => {
    // The static web export has no API (only the server build and the native apps do).
    if (!canSend()) return;
    const had = cache.get(month);
    if (had && Date.now() - had.at <= FRESH_MS && !mustReport) return;
    let live = true;
    (mustReport ? finishMonth(month) : monthFinishers(month))
      .then((v) => {
        if (v === null) return;
        cache.set(month, { at: Date.now(), n: v });
        if (live) setN(v);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [month, mustReport]);
  return hit?.n ?? n;
}

/** For tests. */
export function resetMonthFinishers() {
  cache.clear();
}
