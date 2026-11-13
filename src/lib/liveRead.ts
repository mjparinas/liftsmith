"use client";

import { track, unreachable } from "./net";
import { ACCOUNT_KEY } from "./syncOutbox";

// Screens that show something from our server (coaching, teams, share links, gyms the lifter runs) show the last copy
// kept on the device at once, then ask the server behind it and swap in the answer (docs/decisions/background-sync.md).
// With bad reception the screen still opens with what it showed last, instead of a skeleton or an error. Copies are
// kept per account in one localStorage entry (cleared with the account by forgetReads, and by the device wipe, since
// the key starts "liftsmith."). Friends keeps its own copy (socialCache.ts); the event log never needs one.

export const READS_KEY = "liftsmith.reads";
/** At most this many copies are kept; the oldest go first. */
export const MAX_READS = 40;
/** A copy bigger than this (characters of JSON) isn't kept on the device, only in memory. */
const MAX_CHARS = 300_000;

type Entry = { data: unknown; at: number };
let owner: string | null = null;

/** The signed-in account's id, read the way auth.ts keeps it (no import of auth.ts, which imports this file). */
function accountId(): string | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? ((JSON.parse(raw) as { id?: string }).id ?? null) : null;
  } catch {
    return null;
  }
}
const mem = new Map<string, Entry>();

function load(account: string) {
  if (owner === account) return;
  owner = account;
  mem.clear();
  try {
    const raw = localStorage.getItem(READS_KEY);
    const saved = raw ? (JSON.parse(raw) as { account?: string; parts?: Record<string, Entry> }) : null;
    if (saved?.account === account && saved.parts) for (const [k, v] of Object.entries(saved.parts)) mem.set(k, v);
  } catch {
    // Unreadable or blocked storage: start empty.
  }
}

function save() {
  if (!owner) return;
  const parts = [...mem.entries()]
    .filter(([, v]) => JSON.stringify(v.data ?? null).length <= MAX_CHARS)
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, MAX_READS);
  try {
    localStorage.setItem(READS_KEY, JSON.stringify({ account: owner, parts: Object.fromEntries(parts) }));
  } catch {
    // Full or blocked storage: the copy just isn't kept for the next launch.
  }
}

/** The copy kept for this account, if there is one. */
export function readKept<T>(key: string): T | undefined {
  const account = accountId();
  if (!account) return undefined;
  load(account);
  return mem.get(key)?.data as T | undefined;
}

/** Keeps a copy (an answer, or a change the lifter made that the screen already shows). */
export function keepRead(key: string, data: unknown, now = Date.now()) {
  const account = accountId();
  if (!account) return;
  load(account);
  mem.set(key, { data, at: now });
  save();
}

/**
 * Shows the kept copy now (`fresh` false), then loads in the background and shows the answer (`fresh` true). When the
 * load fails because the server can't be reached and a copy was shown, the screen keeps it and nothing is thrown;
 * any other failure (signed out, not allowed, gone) is thrown, so the screen can say so.
 */
export function liveRead<T>(key: string, fetch: () => Promise<T>, show: (data: T, fresh: boolean) => void): Promise<void> {
  const account = accountId();
  const had = account ? readKept<T>(key) : undefined;
  if (had !== undefined) show(had, false);
  return track(fetch()).then(
    (data) => {
      // Signed out or switched accounts while it was out: show it, but don't keep it for the wrong person.
      if (account && accountId() === account) keepRead(key, data);
      show(data, true);
    },
    (e: unknown) => {
      if (had !== undefined && unreachable(e)) return;
      throw e;
    },
  );
}

/** Drops every copy (sign-out, erase, tests). */
export function forgetReads() {
  mem.clear();
  owner = null;
  try {
    localStorage.removeItem(READS_KEY);
  } catch {}
}
