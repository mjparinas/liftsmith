"use client";

// What the Friends tab showed last, so it opens instantly and refreshes behind it (thread "Speed up the Friends
// screen", 2026-11-12; docs/decisions/friends.md "Loading"). Each part (the lifter's own state, the first page of the
// feed, training now, suggestions) is kept in memory under a key; `me`, the feed and suggestions are also kept on the
// device for the next launch, for the signed-in account only, and dropped on sign-out (forgetAccount in auth.ts).
// A load that's already on its way is shared, so the one "home" request feeds every part of the tab at once.

/** The one localStorage entry: the account it belongs to and its parts. */
export const FRIENDS_CACHE_KEY = "liftsmith.friendsCache";
/** The parts kept on the device. Training now is live, so it's memory only. */
const KEEP = new Set(["me", "feed", "suggest"]);
/** A part this fresh isn't asked for again when a screen opens. */
export const FRESH_MS = 15_000;

type Entry = { data: unknown; at: number };
const mem = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();
let owner: string | null = null;

function load(account: string) {
  if (owner === account) return;
  mem.clear();
  inflight.clear();
  owner = account;
  try {
    const raw = localStorage.getItem(FRIENDS_CACHE_KEY);
    const saved = raw ? (JSON.parse(raw) as { account?: string; parts?: Record<string, Entry> }) : null;
    if (saved?.account !== account || !saved.parts) return;
    // Kept from an earlier launch: shown at once, but always asked for again.
    for (const [k, v] of Object.entries(saved.parts)) if (KEEP.has(k)) mem.set(k, { data: v.data, at: 0 });
  } catch {
    // Unreadable or blocked storage: start empty.
  }
}

function save() {
  if (!owner) return;
  const parts: Record<string, Entry> = {};
  for (const [k, v] of mem) if (KEEP.has(k)) parts[k] = v;
  try {
    localStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify({ account: owner, parts }));
  } catch {
    // Full or blocked storage: it just isn't kept for the next launch.
  }
}

/** The last copy of a part for this account, if there is one. */
export function cached<T>(account: string, key: string): T | undefined {
  load(account);
  return mem.get(key)?.data as T | undefined;
}

/** Whether a part was fetched within FRESH_MS. */
export function fresh(account: string, key: string, now = Date.now()): boolean {
  load(account);
  const e = mem.get(key);
  return !!e && now - e.at < FRESH_MS;
}

/** Keeps a new copy of a part (a fetch, or a change the lifter made, like a like). */
export function remember(account: string, key: string, data: unknown, now = Date.now()) {
  load(account);
  mem.set(key, { data, at: now });
  if (KEEP.has(key)) save();
}

/** Keeps a changed copy of a part without making it count as freshly fetched (a like, an edited setting). */
export function keep(account: string, key: string, data: unknown) {
  load(account);
  mem.set(key, { data, at: mem.get(key)?.at ?? 0 });
  if (KEEP.has(key)) save();
}

/**
 * Fetches a part, or joins the fetch already on its way for it. When that shared fetch fails (an older server
 * without "home", say), the part fetches itself.
 */
export function fetchPart<T>(account: string, key: string, fetch: () => Promise<T>): Promise<T> {
  load(account);
  const going = inflight.get(key) as Promise<T> | undefined;
  if (going) return going.catch(() => own(account, key, fetch));
  return own(account, key, fetch);
}

function own<T>(account: string, key: string, fetch: () => Promise<T>): Promise<T> {
  const p: Promise<T> = fetch()
    .then((data) => {
      if (owner === account) remember(account, key, data);
      return data;
    })
    .finally(() => {
      if (inflight.get(key) === p) inflight.delete(key);
    });
  inflight.set(key, p);
  return p;
}

/**
 * One fetch that answers several parts (the "home" request): each part's own fetch joins it while it's on its way.
 * `split` turns the answer into parts, or null when it can't (not joined yet), and each part then fetches itself.
 */
export function fetchParts<T>(
  account: string,
  keys: string[],
  fetch: () => Promise<T>,
  split: (r: T) => Record<string, unknown> | null,
): Promise<Record<string, unknown> | null> {
  load(account);
  const all = fetch().then(split);
  for (const k of keys) {
    const p: Promise<unknown> = all
      .then((r) => {
        if (!r || !(k in r)) throw new Error("part");
        if (owner === account) remember(account, k, r[k]);
        return r[k];
      })
      .finally(() => {
        if (inflight.get(k) === p) inflight.delete(k);
      });
    // A part nobody waits for (its screen isn't open) mustn't be an unhandled rejection.
    p.catch(() => undefined);
    inflight.set(k, p);
  }
  return all;
}

/** Drops everything (sign-out, erase, tests). */
export function forgetFriends() {
  mem.clear();
  inflight.clear();
  owner = null;
  try {
    localStorage.removeItem(FRIENDS_CACHE_KEY);
  } catch {}
}
