"use client";

// Claiming a gym and keeping its details, the app side (server: src/server/gymClaims.ts; docs/decisions/gyms.md
// step 3). Everything here needs an account.
import { api, AuthError, readAccount } from "./auth";
import type { Amenity, Prices } from "./gymExtras";
import { SITE_URL } from "./site";

export type Role = "owner" | "manager" | "staff";
export const ROLES: readonly Role[] = ["owner", "manager", "staff"];

export interface OwnedGym {
  id: string;
  name: string;
  citySlug: string;
  slug: string;
  hours: string;
  website: string;
  phone: string;
  description: string;
  code: string;
  address: string;
  lifters: number;
  /** The owner's results: lifters who added the gym in the last 30 days, and poster or stand scans (all time, 30 days). */
  newLifters: number;
  scans: number;
  scans30: number;
  /** The gym's own club's code (social.ts gymClubStart), '' before the owner starts it. */
  club: string;
  /** The logo's and photos' ids (gymMedia.ts). */
  logo: string;
  photos: string[];
  /** What it has besides equipment and what a visit costs (gymExtras.ts); the country picks the starting currency. */
  amenities: Amenity[];
  prices: Prices | null;
  country: string;
}

/** A claimed gym earns a mailed table stand at this many lifters (src/server/gymPosters.ts). */
export const STAND_MIN_LIFTERS = 20;

export interface StandOrder {
  status: "requested" | "printed" | "shipped" | "cancelled";
  createdAt: number;
}

const token = () => readAccount()?.token;
const err = (e: unknown) => (e instanceof AuthError ? (e.message === "offline" ? "offline" : e.message) : "failed");

export type StartResult = { claim: string; method: "email" | "review"; devCode?: string } | { error: string };

export async function startClaim(body: {
  place: string;
  email: string;
  role: Role;
  name: string;
  phone?: string;
  note?: string;
}): Promise<StartResult> {
  const t = token();
  if (!t) return { error: "signedOut" };
  try {
    return await api<{ claim: string; method: "email" | "review"; devCode?: string }>("/api/gyms/", {
      token: t,
      body: { op: "claimStart", ...body },
    });
  } catch (e) {
    return { error: err(e) };
  }
}

export async function verifyClaim(claim: string, code: string): Promise<{ place: string } | { error: string }> {
  try {
    return await api<{ place: string }>("/api/gyms/", { token: token(), body: { op: "claimVerify", claim, code } });
  } catch (e) {
    return { error: err(e) };
  }
}

export async function claimWithPosterCode(place: string, code: string): Promise<{ place: string } | { error: string }> {
  try {
    return await api<{ place: string }>("/api/gyms/", { token: token(), body: { op: "claimPoster", place, code } });
  } catch (e) {
    return { error: err(e) };
  }
}

let owned: Promise<OwnedGym[] | null> | null = null;

/** The gyms this account manages (cached until a claim or edit changes them). Null when signed out or offline. */
export function ownedGyms(fresh = false): Promise<OwnedGym[] | null> {
  const t = token();
  if (!t) return Promise.resolve(null);
  if (!owned || fresh)
    owned = api<{ gyms: OwnedGym[] }>("/api/gyms/", { token: t, body: { op: "owned" } })
      .then((r) => r.gyms)
      .catch(() => {
        owned = null;
        return null;
      });
  return owned;
}

export async function editGym(
  place: string,
  change: Partial<Omit<OwnedGym, "id" | "name" | "citySlug" | "slug" | "address" | "lifters" | "country">>,
): Promise<true | string> {
  try {
    await api("/api/gyms/", { token: token(), body: { op: "edit", place, ...change } });
    owned = null;
    return true;
  } catch (e) {
    return err(e);
  }
}

export async function releaseGym(place: string): Promise<boolean> {
  try {
    await api("/api/gyms/", { token: token(), body: { op: "release", place } });
    owned = null;
    return true;
  } catch {
    return false;
  }
}

/** The gym's latest stand order, if any. */
export async function standOrder(place: string): Promise<StandOrder | null> {
  try {
    return (await api<{ order: StandOrder | null }>("/api/gyms/", { token: token(), body: { op: "posterStatus", place } })).order;
  } catch {
    return null;
  }
}

/** Asks us to mail the gym a table stand (claimed gyms with STAND_MIN_LIFTERS lifters). */
export async function askForStand(place: string, address: string, lang: string): Promise<true | string> {
  try {
    await api("/api/gyms/", { token: token(), body: { op: "posters", place, items: "stand", address, lang } });
    return true;
  } catch (e) {
    return err(e);
  }
}

/** The gym's website domain ("ironworks.ca"), to tell the owner which address gets a code straight away. */
export function siteDomain(website: string): string | null {
  try {
    return new URL(website).hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/**
 * Adds a gym the map doesn't have (server: suggestPlace in gymPlaces.ts). Staff check it before it shows. Errors:
 * name, address, where (not found on the map), exists, slow, words, link, offline, signedOut, failed.
 */
export async function suggestGym(body: { name: string; address: string; city: string }): Promise<{ place: string } | { error: string }> {
  const t = token();
  if (!t) return { error: "signedOut" };
  try {
    return await api<{ place: string }>("/api/gyms/", { token: t, body: { op: "suggest", ...body } });
  } catch (e) {
    return { error: err(e) };
  }
}

/** The owner starts their gym's club, or gets its code if it has one (server: gymClubStart in social.ts). */
export async function startGymClub(place: string): Promise<{ code: string } | { error: string }> {
  const t = token();
  if (!t) return { error: "signedOut" };
  try {
    return await api<{ code: string }>("/api/gyms/", { token: t, body: { op: "gymClub", place } });
  } catch (e) {
    return { error: err(e) };
  }
}

/** A picture's address on the website (server: /api/gyms/photo/). */
export const gymPictureUrl = (id: string) => `${SITE_URL}/api/gyms/photo/?id=${id}`;

/**
 * Turns a picked picture into the JPEG the server keeps (gymMedia.ts): a logo at most 512 px and 150 KB, a photo at most
 * 1600 px and 450 KB, on white so a see-through logo doesn't turn black. Lower quality until it fits.
 */
async function gymJpeg(file: File, kind: "logo" | "photo"): Promise<string | null> {
  const [max, bytes] = kind === "logo" ? [512, 150_000] : [1600, 450_000];
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const g = canvas.getContext("2d");
    if (!g) return null;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const q of [0.85, 0.75, 0.65, 0.5]) {
      const url = canvas.toDataURL("image/jpeg", q);
      if (((url.length - 23) * 3) / 4 <= bytes) return url;
    }
    return null;
  } catch {
    return null;
  }
}

/** The owner adds the gym's logo (replacing the old one) or a photo. Errors: image, big, full, slow, owner, offline. */
export async function addGymPicture(place: string, kind: "logo" | "photo", file: File): Promise<{ id: string } | { error: string }> {
  const t = token();
  if (!t) return { error: "signedOut" };
  const image = await gymJpeg(file, kind);
  if (!image) return { error: "image" };
  try {
    return await api<{ id: string }>("/api/gyms/photo/", { token: t, body: { op: "add", place, kind, image } });
  } catch (e) {
    return { error: err(e) };
  }
}

export async function removeGymPicture(place: string, id: string): Promise<boolean> {
  try {
    await api("/api/gyms/photo/", { token: token(), body: { op: "remove", place, id } });
    return true;
  } catch {
    return false;
  }
}
