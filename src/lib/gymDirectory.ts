"use client";

// Find a gym near you, the app side (server: src/server/gymDirectory.ts; docs/decisions/gym-sharing.md).
// Positions are rounded to 0.01° (about 1 km) here, before anything is sent, so the precise position never
// leaves the phone. Listing a gym needs an account; finding, adding and reporting don't.
import { api, AuthError, readAccount } from "./auth";
import { makeGym } from "./defaults";
import { locate } from "./geo";
import type { Amenity, GymIssue, GymNews, GymTrainer, Prices } from "./gymExtras";
import { decodeGym, encodeGym, kitOf, type GymKit } from "./gymShare";
import { keepRead, readKept } from "./liveRead";
import { track } from "./net";
import type { Gym, Unit } from "./types";

export interface Listing {
  id: string;
  name: string;
  code: string;
  unit: "kg" | "lb";
  km: number;
  adds: number;
}

/** A real gym (server: gymPlaces.ts). Official means its owner claimed it. */
export interface Place {
  id: string;
  citySlug: string;
  slug: string;
  name: string;
  kind: "gym" | "studio";
  address: string;
  city: string;
  region: string;
  lat: number;
  lon: number;
  km: number;
  hours: string;
  website: string;
  phone?: string;
  updatedAt?: number;
  official: boolean;
  lifters: number;
  /** The setup it offers (gymShare.ts code), empty when nobody has set one up yet. */
  code: string;
  source: "osm" | "staff" | "owner" | "lifter";
  /** The code of the gym's own club and weekly leaderboard (#/club/<code>); missing or '' when it has none. */
  club?: string;
  /** Our address for its map picture (a path on the website), '' while maps are off. */
  map?: string;
  /** Its logo's and photos' ids, pictures at /api/gyms/photo/?id=. */
  logo?: string;
  photos?: string[];
  /** The owner's amenities and prices, and (one gym's own lookups) announcements, open equipment problems and trainers. */
  amenities?: Amenity[];
  prices?: Prices | null;
  news?: GymNews[];
  issues?: GymIssue[];
  trainers?: GymTrainer[];
}

export interface MyListing {
  id: string;
  localId: string;
  name: string;
  hidden: boolean;
}

export const REPORT_REASONS = ["wrong", "private", "spam", "offensive"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

const cell = (x: number) => Math.round(x * 100) / 100;
const token = () => readAccount()?.token;

/** Pins the map of nearby gyms carries, the list's first ones (the server's AREA_PINS in gymMedia.ts). */
export const AREA_PINS = 20;

export type Found = {
  gyms: Listing[];
  places: Place[];
  /** A map picture of the places' numbered pins, '' while maps are off (the draggable map shows only when it isn't). */
  map: string;
  /** The spot searched, rounded to about 1 km. */
  at?: { lat: number; lon: number };
};
export type FindResult = Found | { error: "location" | "offline" | "slow" | "failed" };

// The last search, kept on the device (2026-11-13, "Find a gym near me feels slow"): its spot, already rounded to
// about 1 km like everything sent, and what came back. A new search shows it at once and asks the server for that spot
// while the phone is still working out where it is, so the wait is the slower of the two rather than both in a row.
const LAST_KEY = "liftsmith.gymsNear";
/** How long the last answer is shown while a new one loads. */
export const LAST_FRESH_MS = 7 * 86_400_000;
interface Last {
  lat: number;
  lon: number;
  at: number;
  found: Found;
}

export function lastNearby(now = Date.now()): Last | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    const l = raw ? (JSON.parse(raw) as Last) : null;
    return l && Array.isArray(l.found?.places) && Array.isArray(l.found?.gyms) && now - l.at < LAST_FRESH_MS ? l : null;
  } catch {
    return null;
  }
}

function keepLast(lat: number, lon: number, found: Found, now = Date.now()): void {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ lat, lon, at: now, found } satisfies Last));
  } catch {
    // Storage full or off: the next search just waits as before.
  }
}

async function searchAt(lat: number, lon: number): Promise<FindResult> {
  try {
    const r = await api<{ gyms: Listing[]; places?: Place[]; map?: string }>(`/api/gyms/?lat=${lat}&lon=${lon}`);
    return { gyms: r.gyms, places: r.places ?? [], map: r.map ?? "", at: { lat, lon } };
  } catch (e) {
    return { error: problem(e) };
  }
}

/**
 * Real gyms and listed setups near where the lifter is now (one approximate position, asked for the first time).
 * `early` gets the last search's answer straight away, when there is one, while this one runs.
 */
export async function findNearby(
  early?: (f: Found) => void,
  where: () => Promise<{ lat: number; lon: number } | null> = locate,
): Promise<FindResult> {
  const last = lastNearby();
  if (last) early?.(last.found);
  // Ask for the last spot now; most searches are from the same place as the one before.
  const guess = last ? searchAt(last.lat, last.lon) : null;
  const fix = await where();
  if (!fix) return { error: "location" };
  const lat = cell(fix.lat);
  const lon = cell(fix.lon);
  const r = await (guess && last && last.lat === lat && last.lon === lon ? guess : searchAt(lat, lon));
  if ("gyms" in r) keepLast(lat, lon, r);
  return r;
}

/** One real gym by id (its page in the app, and the QR code's target). */
export async function fetchPlace(id: string): Promise<Place | "gone" | "offline"> {
  try {
    return (await api<{ place: Place }>(`/api/gyms/?place=${encodeURIComponent(id)}`)).place;
  } catch (e) {
    return e instanceof AuthError && e.status === 404 ? "gone" : "offline";
  }
}

const problem = (e: unknown): "offline" | "slow" | "failed" =>
  e instanceof AuthError && e.message === "offline" ? "offline" : e instanceof AuthError && e.status === 429 ? "slow" : "failed";

export type ListError = "signedOut" | "location" | "offline" | "slow" | "full" | "link" | "words" | "empty" | "failed";

/** Lists a gym at its saved place, else where the lifter is now. */
export async function listGym(gym: Gym): Promise<{ id: string } | { error: ListError }> {
  const t = token();
  if (!t) return { error: "signedOut" };
  const at = gym.place ?? (await locate());
  if (!at) return { error: "location" };
  try {
    const r = await api<{ id: string }>("/api/gyms/", {
      token: t,
      body: {
        op: "publish",
        localId: gym.id,
        name: gym.name,
        code: encodeGym(kitOf(gym)),
        lat: cell(at.lat),
        lon: cell(at.lon),
        ...(gym.placeId ? { placeId: gym.placeId } : {}),
      },
    });
    return { id: r.id };
  } catch (e) {
    const m = e instanceof AuthError ? e.message : "";
    if (m === "full" || m === "link" || m === "words" || m === "empty") return { error: m };
    return { error: problem(e) };
  }
}

export async function unlistGym(localId: string): Promise<boolean> {
  const t = token();
  if (!t) return false;
  try {
    await api("/api/gyms/", { token: t, body: { op: "unpublish", localId } });
    return true;
  } catch {
    return false;
  }
}

export async function myListings(): Promise<MyListing[] | null> {
  const t = token();
  if (!t) return null;
  try {
    const gyms = (await track(api<{ gyms: MyListing[] }>("/api/gyms/", { token: t, body: { op: "mine" } }))).gyms;
    keepRead("gyms.mine", gyms);
    return gyms;
  } catch {
    // Offline: what was listed last time (liveRead.ts).
    return readKept<MyListing[]>("gyms.mine") ?? null;
  }
}

export async function reportGym(id: string, reason: ReportReason): Promise<boolean> {
  try {
    await api("/api/gyms/", { token: token(), body: { op: "report", id, reason } });
    return true;
  } catch {
    return false;
  }
}

// The listing or real gym a gym link was opened from, so adding it counts toward it, the new gym remembers which
// real gym it is, and the preview can offer a report (listings only).
let picked: { id: string | null; place: Place | null; code: string } | null = null;
export const pickListing = (l: Pick<Listing, "id" | "code">) => void (picked = { id: l.id, place: null, code: l.code });
export const pickPlace = (p: Place, code: string) => void (picked = { id: null, place: p, code });
export const listingFor = (code: string | undefined) => (code && picked?.code === code ? picked.id : null);
export const placeFor = (code: string | undefined) => (code && picked?.code === code ? picked.place : null);

/** Counts an add toward a listing, a real gym, or both. */
export function markAdded(id: string | null, place?: string | null): void {
  if (!id && !place) return;
  void api("/api/gyms/", { token: token(), body: { op: "added", ...(id ? { id } : {}), ...(place ? { place } : {}) } }).catch(() => null);
}

/**
 * The setup a real gym brings: the one it offers, else a typical commercial gym under its name, so picking a gym
 * nobody has set up still gives a sensible start the lifter can change.
 */
export function placeKit(p: Place, unit: Unit): { kit: GymKit; typical: boolean } {
  const offered = p.code ? decodeGym(p.code) : null;
  if (offered) return { kit: { ...offered, name: p.name }, typical: false };
  return { kit: { ...kitOf(makeGym("commercial", unit)), name: p.name }, typical: true };
}

/** "20236 Fraser Highway, Langley, BC" */
export const placeLine = (p: Pick<Place, "address" | "city" | "region">) => [p.address, p.city, p.region].filter(Boolean).join(", ");
