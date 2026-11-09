// What this device still has to push to the lifter's account (sync.ts). Kept in localStorage, so a change
// made offline, or on a screen that never loads the sync code (the web dashboard's past-workout log), is
// pushed on the next sync. Nothing is queued while signed out: signing in queues everything once.

export const ACCOUNT_KEY = "liftsmith.account";
export const SYNC_KEY = "liftsmith.sync";

export interface SyncState {
  /** The server's cursor: everything up to it has been pulled. */
  cursor: number;
  /** Event ids to push. */
  out: string[];
  /** Deleted event ids to push as tombstones. */
  del: string[];
  /** Gym ids the account has, so a gym removed here is removed there too. */
  gyms: string[];
  /** True until the first sync on this device: the account's profile wins over this device's. */
  first: boolean;
  /** Counts changes to the profile and gyms; records are sent while it differs from `sentRev`. */
  rev: number;
  sentRev: number;
  lastSync?: number;
  lastError?: string;
}

export const emptySync = (): SyncState => ({ cursor: 0, out: [], del: [], gyms: [], first: true, rev: 1, sentRev: 0 });

const listeners = new Set<() => void>();
/** sync.ts listens, to sync a few seconds after a change. */
export const onOutbox = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function signedIn(): boolean {
  try {
    return !!localStorage.getItem(ACCOUNT_KEY);
  } catch {
    return false;
  }
}

export function readSync(): SyncState {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    return raw ? { ...emptySync(), ...(JSON.parse(raw) as Partial<SyncState>) } : emptySync();
  } catch {
    return emptySync();
  }
}

export function writeSync(s: SyncState) {
  try {
    localStorage.setItem(SYNC_KEY, JSON.stringify(s));
  } catch {}
}

function update(fn: (s: SyncState) => void) {
  if (!signedIn()) return;
  const s = readSync();
  fn(s);
  writeSync(s);
  for (const l of listeners) l();
}

export function noteEvents(ids: string[]) {
  if (!ids.length) return;
  update((s) => {
    const have = new Set(s.out);
    for (const id of ids) if (!have.has(id)) s.out.push(id);
  });
}

export function noteDeleted(ids: string[]) {
  if (!ids.length) return;
  update((s) => {
    const gone = new Set(ids);
    s.out = s.out.filter((id) => !gone.has(id));
    for (const id of ids) if (!s.del.includes(id)) s.del.push(id);
  });
}

export function noteChanged() {
  update((s) => {
    s.rev += 1;
  });
}
