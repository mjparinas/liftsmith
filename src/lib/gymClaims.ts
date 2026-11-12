"use client";

// Claiming a gym and keeping its details, the app side (server: src/server/gymClaims.ts; docs/decisions/gyms.md
// step 3). Everything here needs an account.
import { api, AuthError, readAccount } from "./auth";

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

export async function editGym(place: string, change: Partial<Omit<OwnedGym, "id" | "name" | "citySlug" | "slug">>): Promise<true | string> {
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

/** The gym's website domain ("ironworks.ca"), to tell the owner which address gets a code straight away. */
export function siteDomain(website: string): string | null {
  try {
    return new URL(website).hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}
