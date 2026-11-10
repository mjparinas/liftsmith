"use client";

// Gym by location (Melvin, 2026-11-09). Opt-in per gym. When the app opens or comes back to the
// foreground, it asks the phone for an approximate position (Android coarse location, iOS "when in
// use", no background tracking) and switches the active gym if exactly one saved gym is nearby. The
// position is never sent anywhere and gyms only keep a rounded point.
import { isNative } from "./juice";
import type { Gym } from "./types";

export interface Fix {
  lat: number;
  lon: number;
  /** Metres, as reported by the phone. */
  accuracy: number;
}

export const DEFAULT_RADIUS_M = 300;
/** Coarse fixes can be off by a couple of kilometres; past this we don't guess. */
export const MAX_ACCURACY_M = 2_000;

/** Great-circle distance in metres. */
export function distanceM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** About 100 m of precision: enough to tell gyms apart, not enough to pinpoint a home. */
export const roundPlace = (x: number) => Math.round(x * 1000) / 1000;

/**
 * The gym the lifter is at, or null when it's unclear: no fix, a fix too rough to trust, no gym in
 * range, or two gyms both plausibly in range (we never guess between them).
 */
export function gymAt(gyms: readonly Gym[], fix: Fix | null): Gym | null {
  if (!fix || fix.accuracy > MAX_ACCURACY_M) return null;
  const inRange = gyms
    .filter((g) => g.place)
    .map((g) => ({ g, d: distanceM(fix, g.place!) }))
    .filter(({ g, d }) => d - Math.min(fix.accuracy, 500) <= g.place!.radiusM)
    .sort((a, b) => a.d - b.d);
  if (!inRange.length) return null;
  if (inRange.length > 1 && inRange[1].d - inRange[0].d < Math.max(200, fix.accuracy / 2)) return null;
  return inRange[0].g;
}

/** One approximate position, asking for permission the first time. Null when refused or unavailable. */
export async function locate(): Promise<Fix | null> {
  try {
    if (isNative()) {
      const { Geolocation } = await import("@capacitor/geolocation");
      const perm = await Geolocation.checkPermissions();
      if (perm.coarseLocation !== "granted" && perm.location !== "granted") {
        const asked = await Geolocation.requestPermissions({ permissions: ["coarseLocation"] });
        if (asked.coarseLocation !== "granted" && asked.location !== "granted") return null;
      }
      const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: 15_000 });
      return { lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy };
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) return null;
    return await new Promise<Fix | null>((resolve) =>
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy }),
        () => resolve(null),
        { enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: 15_000 },
      ),
    );
  } catch {
    return null;
  }
}

/** Only checks when some gym opted in, so people who never use this are never asked for location. */
export const wantsLocation = (gyms: readonly Gym[]) => gyms.some((g) => g.place);
