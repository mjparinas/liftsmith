import { registerCustom } from "./exercises";
import { noteChanged, noteDeleted, noteEvents } from "./syncOutbox";
import type { AppEvent, Gym, Profile } from "./types";

// Offline storage: events in IndexedDB (append-only), profile and gyms as last-write-wins records.
// Falls back to memory when IndexedDB is missing (tests, private windows).

const DB = "liftsmith";
const VERSION = 1;

export interface Snapshot {
  events: AppEvent[];
  profile: Profile | null;
  gyms: Gym[];
}

let dbp: Promise<IDBDatabase | null> | null = null;
const memory: Snapshot = { events: [], profile: null, gyms: [] };

function open(): Promise<IDBDatabase | null> {
  if (dbp) return dbp;
  dbp = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("events")) db.createObjectStore("events", { keyPath: "id" });
      if (!db.objectStoreNames.contains("records")) db.createObjectStore("records");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
  return dbp;
}

function tx<T>(db: IDBDatabase, store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const r = fn(t.objectStore(store));
    t.oncomplete = () => resolve(r ? r.result : undefined);
    t.onerror = () => reject(t.error);
  });
}

export async function load(): Promise<Snapshot> {
  const db = await open();
  if (!db) {
    registerCustom(memory.events);
    return { ...memory, events: [...memory.events] };
  }
  const [events, profile, gyms] = await Promise.all([
    tx<AppEvent[]>(db, "events", "readonly", (s) => s.getAll() as IDBRequest<AppEvent[]>),
    tx<Profile>(db, "records", "readonly", (s) => s.get("profile") as IDBRequest<Profile>),
    tx<Gym[]>(db, "records", "readonly", (s) => s.get("gyms") as IDBRequest<Gym[]>),
  ]);
  const sorted = (events ?? []).sort((a, b) => a.at - b.at);
  registerCustom(sorted);
  return { events: sorted, profile: profile ?? null, gyms: gyms ?? [] };
}

/** `remote`: the events came from sync, so they aren't queued to be pushed back. */
export async function appendEvents(events: AppEvent[], opts: { remote?: boolean } = {}): Promise<void> {
  if (!opts.remote) noteEvents(events.map((e) => e.id));
  const db = await open();
  if (!db) {
    const have = new Set(events.map((e) => e.id));
    memory.events = [...memory.events.filter((e) => !have.has(e.id)), ...events];
    return;
  }
  await tx(db, "events", "readwrite", (s) => {
    for (const e of events) s.put(e);
  });
}

export async function deleteEvents(ids: string[], opts: { remote?: boolean } = {}): Promise<void> {
  if (!opts.remote) noteDeleted(ids);
  const db = await open();
  if (!db) {
    memory.events = memory.events.filter((e) => !ids.includes(e.id));
    return;
  }
  await tx(db, "events", "readwrite", (s) => {
    for (const id of ids) s.delete(id);
  });
}

export async function saveRecord(key: "profile" | "gyms", value: unknown, opts: { remote?: boolean } = {}): Promise<void> {
  if (!opts.remote) noteChanged();
  const db = await open();
  if (!db) {
    (memory as unknown as Record<string, unknown>)[key] = value;
    return;
  }
  await tx(db, "records", "readwrite", (s) => s.put(value, key));
}

export async function eraseAll(): Promise<void> {
  const db = await open();
  memory.events = [];
  memory.profile = null;
  memory.gyms = [];
  if (!db) return;
  await tx(db, "events", "readwrite", (s) => s.clear());
  await tx(db, "records", "readwrite", (s) => s.clear());
}
