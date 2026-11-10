// Reads the feature flags' server values (GET /api/flags/, src/server/flags.ts) and keeps the answer on the
// device (flags.ts), on open and on coming back to the foreground. The install id goes with the request only
// while usage stats are on, so a lifter who turned them off gets the defaults and every test's control.
import { analyticsOn, canSend, installId } from "./analytics";
import { replaceServerFlags } from "./flags";
import { isNative } from "./juice";
import { SITE_URL } from "./site";

export const flagsUrl = (id: string | null) => {
  const base = isNative() || typeof location === "undefined" ? SITE_URL : "";
  return `${base}/api/flags/${id ? `?install=${encodeURIComponent(id)}` : ""}`;
};

/** Fetches the flags once. Offline, or with no server, the last answer stays. Returns whether it updated. */
export async function refreshFlags(get: typeof fetch = fetch): Promise<boolean> {
  // The static web export has no API (only the server build and the native apps do).
  if (!canSend()) return false;
  try {
    const r = await get(flagsUrl(analyticsOn() ? installId() : null), { cache: "no-store" });
    if (!r.ok) return false;
    const j = (await r.json()) as { flags?: unknown };
    if (!j.flags || typeof j.flags !== "object") return false;
    replaceServerFlags(j.flags as Record<string, unknown>);
    return true;
  } catch {
    return false;
  }
}

let started = false;
/** Called once when the app starts. */
export function startFlags() {
  if (started || typeof window === "undefined") return;
  started = true;
  void refreshFlags();
  window.addEventListener("online", () => void refreshFlags());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshFlags();
  });
}
