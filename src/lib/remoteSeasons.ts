// Reads the season schedule (GET /api/seasons/, src/server/seasons.ts) and keeps it on the device (seasons.ts
// rememberSchedule), on open and on coming back to the foreground, like the feature flags. Offline, or in the
// static web export with no API, the last answer (or the built-in season 1) stays.
import { canSend } from "./analytics";
import { isNative } from "./juice";
import { rememberSchedule, type ScheduleRow } from "./seasons";
import { SITE_URL } from "./site";

export const seasonsUrl = () => `${isNative() || typeof location === "undefined" ? SITE_URL : ""}/api/seasons/`;

/** Fetches the schedule once. Returns whether it changed. */
export async function refreshSeasons(get: typeof fetch = fetch): Promise<boolean> {
  if (!canSend()) return false;
  try {
    const r = await get(seasonsUrl(), { cache: "no-store" });
    if (!r.ok) return false;
    const j = (await r.json()) as { seasons?: unknown };
    return Array.isArray(j.seasons) && rememberSchedule(j.seasons as ScheduleRow[]);
  } catch {
    return false;
  }
}

let started = false;
/** Called once when the app starts, with what to do when the schedule changed (redraw). */
export function startSeasons(changed: () => void) {
  if (started || typeof window === "undefined") return;
  started = true;
  const look = () => void refreshSeasons().then((c) => c && changed());
  look();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") look();
  });
}
