"use client";

// Signing out leaves nothing of the lifter on the device (Melvin, 2026-11-13: "when you log out ... it shouldn't
// show data from whomever logged out, it should wipe out the data"). Docs: docs/decisions/accounts-and-sign-in.md
// "Signing out wipes the device". This file knows which saved keys belong to the person and which to the device.

/** Whose data is on this device: the account id it was last signed in as. Signing in as someone else wipes first. */
export const OWNER_KEY = "liftsmith.owner";

/** Set when the server ended the session while changes on the device hadn't reached the account: how many. The data
 *  stays until the lifter signs in again (it's pushed), saves a backup or erases it (Account.tsx). */
export const ENDED_KEY = "liftsmith.ended";

export function readEnded(): number {
  return Number(safe(() => localStorage.getItem(ENDED_KEY)) ?? 0) || 0;
}

export function writeEnded(waiting: number) {
  try {
    if (waiting > 0) localStorage.setItem(ENDED_KEY, String(waiting));
    else localStorage.removeItem(ENDED_KEY);
  } catch {}
}

/** Keys every saved setting of ours starts with. */
const PREFIXES = ["liftsmith.", "ls."];

/** Device settings that say nothing about the person, so they survive a sign-out: the look, accessibility, the
 *  cached feature flags and admin's own switch, and the random install id (the phone's store purchase is filed under
 *  it in RevenueCat, so changing it would hide a subscription the phone's store account paid for). */
export const KEEP = new Set([
  "liftsmith.theme",
  "liftsmith.a11y",
  "liftsmith.flags",
  "liftsmith.flags.local",
  "liftsmith.admin.autoRefresh",
  "liftsmith.installId",
  "liftsmith.firstOpenAt",
]);

/** Whether a saved key holds the person's data (and goes on sign-out). */
export const personal = (key: string) => PREFIXES.some((p) => key.startsWith(p)) && !KEEP.has(key);

/** Removes every personal key from localStorage and sessionStorage. Returns the keys removed. */
export function clearPersonalKeys(): string[] {
  const gone: string[] = [];
  for (const store of [safe(() => localStorage), safe(() => sessionStorage)]) {
    if (!store) continue;
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && personal(k)) keys.push(k);
    }
    for (const k of keys) {
      try {
        store.removeItem(k);
        gone.push(k);
      } catch {}
    }
  }
  return gone;
}

function safe<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

export function readOwner(): string | null {
  return safe(() => localStorage.getItem(OWNER_KEY));
}

export function writeOwner(id: string | null) {
  try {
    if (id) localStorage.setItem(OWNER_KEY, id);
    else localStorage.removeItem(OWNER_KEY);
  } catch {}
}

/** Starts the app again on Today, so nothing from before stays in memory (the screens, Friends, a coach's clients). */
export function restartApp() {
  if (typeof location === "undefined") return;
  try {
    history.replaceState(null, "", `${location.pathname}${location.search}#/today`);
  } catch {}
  location.reload();
}
