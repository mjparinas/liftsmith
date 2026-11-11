"use client";

// Sync with the lifter's account (AGENTS.md "Sync"). Push what this device wrote since the last sync (the
// outbox in syncOutbox.ts), pull what the account's other devices wrote, by cursor, from POST /api/sync/.
// Runs on open, when the app comes back to the foreground or online, and a few seconds after a change.
// Events merge by id, so order and repeats don't matter; the profile and gyms are last write wins.
import { api, AuthError, forgetAccount, readAccount, setAccountPro, useAccount } from "./auth";
import { useApp } from "./store";
import { noteChanged, onOutbox, readSync, writeSync, type SyncState } from "./syncOutbox";
import type { AppEvent, Gym, Profile } from "./types";

const BATCH = 500;
const MAX_BYTES = 3_000_000;
const DEBOUNCE_MS = 4000;

interface Rec {
  key: string;
  value: unknown | null;
  updatedAt: number;
}

interface Reply {
  cursor: number;
  events: AppEvent[];
  deleted: string[];
  records: Rec[];
  more: boolean;
  /** Pro that comes with the account (the store review account). */
  pro?: boolean;
}

export interface Pulled {
  events: AppEvent[];
  deleted: string[];
  profile: Profile | null;
  gyms: Gym[] | null;
}

/** The records this device sends: its profile, each gym, and a removal for each gym it no longer has. */
export function localRecords(profile: Profile, gyms: Gym[], known: string[], now: number): Rec[] {
  // A profile that hasn't been through setup isn't sent: signing in on the welcome screen of a new install must never
  // replace the account's real profile, or put a half-made one on an account that has none yet.
  const recs: Rec[] = [
    ...(profile.onboarded ? [{ key: "profile", value: profile, updatedAt: profile.updatedAt }] : []),
    ...gyms.map((g) => ({ key: `gym:${g.id}`, value: g, updatedAt: g.updatedAt })),
  ];
  for (const id of known) if (!gyms.some((g) => g.id === id)) recs.push({ key: `gym:${id}`, value: null, updatedAt: now });
  return recs;
}

/** Applies the account's records to this device's profile and gyms (newer wins; on a first sync the account's profile wins). */
export function mergeRecords(
  profile: Profile,
  gyms: Gym[],
  recs: Rec[],
  first: boolean,
  now = Date.now(),
): { profile: Profile | null; gyms: Gym[] | null; known: string[]; fixed: boolean } {
  let nextProfile: Profile | null = null;
  const p = recs.find((r) => r.key === "profile");
  // An account profile that never finished setup (pushed by an older version) never replaces a set-up one here.
  const usable = !!p?.value && ((p.value as Profile).onboarded || !profile.onboarded);
  if (p && usable && (p.updatedAt > profile.updatedAt || (first && p.updatedAt !== profile.updatedAt))) nextProfile = p.value as Profile;
  let list = [...gyms];
  let changed = false;
  const known: string[] = [];
  for (const r of recs) {
    if (!r.key.startsWith("gym:")) continue;
    const id = r.key.slice(4);
    const i = list.findIndex((g) => g.id === id);
    if (r.value === null) {
      if (i >= 0) {
        list = list.filter((g) => g.id !== id);
        changed = true;
      }
      continue;
    }
    known.push(id);
    const g = r.value as Gym;
    if (i < 0) {
      list.push(g);
      changed = true;
    } else if (list[i].updatedAt < r.updatedAt) {
      list[i] = g;
      changed = true;
    }
  }
  // The active gym must still exist.
  const prof = nextProfile ?? profile;
  const fixed = list.length > 0 && !list.some((g) => g.id === prof.activeGymId);
  if (fixed) nextProfile = { ...prof, activeGymId: list[0].id, updatedAt: Math.max(prof.updatedAt + 1, now) };
  return { profile: nextProfile, gyms: changed ? list : null, known, fixed };
}

/** Picks the outbox events to send, up to the batch and byte limits. */
export function pickBatch(out: string[], events: AppEvent[]): { send: AppEvent[]; ids: string[] } {
  const byId = new Map(events.map((e) => [e.id, e]));
  const send: AppEvent[] = [];
  const ids: string[] = [];
  let bytes = 0;
  for (const id of out) {
    if (send.length >= BATCH) break;
    ids.push(id);
    const e = byId.get(id);
    if (!e) continue; // deleted since (its tombstone goes separately)
    bytes += JSON.stringify(e).length;
    if (bytes > MAX_BYTES && send.length) {
      ids.pop();
      break;
    }
    send.push(e);
  }
  return { send, ids };
}

let running: Promise<void> | null = null;

export const useSync = { lastSync: () => readSync().lastSync, pending: () => readSync().out.length + readSync().del.length };

/** Syncs now (or joins a sync already running). Quietly does nothing when signed out or offline. */
export function syncNow(): Promise<void> {
  if (!readAccount()) return Promise.resolve();
  running ??= run().finally(() => {
    running = null;
  });
  return running;
}

async function run(): Promise<void> {
  const account = readAccount();
  if (!account) return;
  const store = useApp.getState();
  if (!store.ready) return;
  useAccount.setState({ busy: true });
  try {
    for (let round = 0; round < 100; round++) {
      const s: SyncState = readSync();
      const { profile, gyms, events } = useApp.getState();
      const { send, ids } = pickBatch(s.out, events);
      const del = s.del.slice(0, BATCH);
      const now = Date.now();
      const reply = await api<Reply>("/api/sync/", {
        token: account.token,
        body: {
          cursor: s.cursor,
          events: send,
          deleted: del,
          records: s.rev !== s.sentRev || s.first ? localRecords(profile, gyms, s.gyms, now) : [],
          first: s.first,
        },
      });
      setAccountPro(!!reply.pro);
      const merged = mergeRecords(useApp.getState().profile, useApp.getState().gyms, reply.records, s.first);
      useApp.getState().applySynced({ events: reply.events, deleted: reply.deleted, profile: merged.profile, gyms: merged.gyms });
      // Re-read: the lifter may have logged more while the request was out.
      const after = readSync();
      const sentIds = new Set(ids);
      const sentDel = new Set(del);
      writeSync({
        ...after,
        cursor: reply.cursor,
        out: after.out.filter((id) => !sentIds.has(id)),
        del: after.del.filter((id) => !sentDel.has(id)),
        gyms: merged.known,
        first: false,
        sentRev: s.rev,
        lastSync: Date.now(),
        lastError: undefined,
      });
      // A fix made here (the active gym went away) goes back up on the next round.
      if (merged.fixed) noteChanged();
      const left = readSync();
      if (!reply.more && !left.out.length && !left.del.length && left.rev === left.sentRev) break;
    }
  } catch (e) {
    if (e instanceof AuthError && e.status === 401) {
      // The session ended (signed out elsewhere, or the account was deleted). Data stays on the device.
      forgetAccount();
      useAccount.setState({ error: "signedOut" });
    } else {
      const s = readSync();
      writeSync({ ...s, lastError: e instanceof Error ? e.message : String(e) });
    }
  } finally {
    useAccount.setState({ busy: false });
  }
}

let timer: ReturnType<typeof setTimeout> | undefined;

/** Starts background sync for the app: now, on return to the foreground, when back online, and after changes. */
export function startSync(): () => void {
  void syncNow();
  const soon = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void syncNow(), DEBOUNCE_MS);
  };
  const visible = () => {
    if (document.visibilityState === "visible") void syncNow();
    // Going to the background: push what's waiting now, while the app may still run.
    else if (readSync().out.length || readSync().rev !== readSync().sentRev) void syncNow();
  };
  const off = onOutbox(soon);
  document.addEventListener("visibilitychange", visible);
  window.addEventListener("online", soon);
  return () => {
    off();
    clearTimeout(timer);
    document.removeEventListener("visibilitychange", visible);
    window.removeEventListener("online", soon);
  };
}
