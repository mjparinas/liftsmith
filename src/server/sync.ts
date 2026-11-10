// Event sync (AGENTS.md "Sync"). Each device pushes what it wrote since its last sync and pulls what other
// devices wrote, by cursor. Events are immutable and keyed by id, so pushing twice adds nothing and the order
// of arrival doesn't matter; a deleted event becomes a tombstone that every device applies. The profile and
// each gym are records, last write wins on updatedAt.
import { batch, query } from "./db";

export const MAX_EVENTS = 1000;
export const PAGE = 500;
export const MAX_BODY = 3_500_000;

export interface Rec {
  key: string;
  /** null for a removed gym. */
  value: unknown | null;
  updatedAt: number;
}

export interface SyncRequest {
  cursor: number;
  events: { id: string; at: number }[];
  deleted: string[];
  records: Rec[];
  /** The device's first sync for this account: the account's profile wins over the device's. */
  first: boolean;
}

export interface SyncResponse {
  cursor: number;
  events: unknown[];
  deleted: string[];
  records: Rec[];
  more: boolean;
}

const KEY_RE = /^(profile|gym:[\w-]{1,80})$/;
const ID_RE = /^[\w.:-]{1,120}$/;

export function checkSync(raw: unknown): { ok: true; body: SyncRequest } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Bad request" };
  const r = raw as Record<string, unknown>;
  const cursor = Number(r.cursor ?? 0);
  if (!Number.isInteger(cursor) || cursor < 0) return { ok: false, error: "Bad cursor" };
  const events = Array.isArray(r.events) ? r.events : [];
  const deleted = Array.isArray(r.deleted) ? r.deleted : [];
  const records = Array.isArray(r.records) ? r.records : [];
  if (events.length > MAX_EVENTS || deleted.length > MAX_EVENTS || records.length > 100) return { ok: false, error: "Too many" };
  for (const e of events) {
    const ev = e as { id?: unknown; at?: unknown; type?: unknown };
    if (
      !ev ||
      typeof ev !== "object" ||
      typeof ev.id !== "string" ||
      !ID_RE.test(ev.id) ||
      typeof ev.at !== "number" ||
      typeof ev.type !== "string"
    )
      return { ok: false, error: "Bad event" };
  }
  if (deleted.some((d) => typeof d !== "string" || !ID_RE.test(d))) return { ok: false, error: "Bad delete" };
  for (const x of records) {
    const rec = x as Partial<Rec>;
    if (!rec || typeof rec.key !== "string" || !KEY_RE.test(rec.key) || typeof rec.updatedAt !== "number" || rec.value === undefined)
      return { ok: false, error: "Bad record" };
    if (rec.key === "profile" && rec.value === null) return { ok: false, error: "Bad record" };
  }
  return {
    ok: true,
    body: {
      cursor,
      events: events as SyncRequest["events"],
      deleted: deleted as string[],
      records: records as Rec[],
      first: r.first === true,
    },
  };
}

export async function sync(accountId: string, session: string, req: SyncRequest): Promise<SyncResponse> {
  const stmts: { sql: string; args: (string | number | null)[] }[] = [];
  // New events. An id the account already has (or deleted) is left alone, so a tombstone is never undone.
  for (const e of req.events) {
    stmts.push({
      sql: "INSERT OR IGNORE INTO sync_events (account_id, id, at, body, session) VALUES (?, ?, ?, ?, ?)",
      args: [accountId, e.id, e.at, JSON.stringify(e), session],
    });
  }
  // Deletes: a tombstone gets a new seq, so devices that already pulled the event see the delete.
  for (const id of req.deleted) {
    stmts.push({ sql: "DELETE FROM sync_events WHERE account_id = ? AND id = ?", args: [accountId, id] });
    stmts.push({
      sql: "INSERT INTO sync_events (account_id, id, at, body, session) VALUES (?, ?, 0, NULL, ?)",
      args: [accountId, id, session],
    });
  }
  if (stmts.length) await batch(stmts);

  // Records: keep whichever is newer. On a device's first sync the account's profile wins.
  const have = new Map(
    (
      await query<{ key: string; body: string | null; updated_at: number }>(
        "SELECT key, body, updated_at FROM sync_records WHERE account_id = ?",
        [accountId],
      )
    ).map((r) => [String(r.key), r]),
  );
  const writes = [];
  for (const r of req.records) {
    const cur = have.get(r.key);
    if (cur && (Number(cur.updated_at) >= r.updatedAt || (req.first && r.key === "profile"))) continue;
    const body = r.value === null ? null : JSON.stringify(r.value);
    writes.push({
      sql: "INSERT INTO sync_records (account_id, key, body, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(account_id, key) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at",
      args: [accountId, r.key, body, r.updatedAt],
    });
    have.set(r.key, { key: r.key, body, updated_at: r.updatedAt });
  }
  if (writes.length) await batch(writes);

  // Pull: what this account has past the cursor, less what this session wrote itself.
  const rows = await query<{ seq: number; id: string; body: string | null; session: string | null }>(
    "SELECT seq, id, body, session FROM sync_events WHERE account_id = ? AND seq > ? ORDER BY seq LIMIT ?",
    [accountId, req.cursor, PAGE],
  );
  const events: unknown[] = [];
  const deleted: string[] = [];
  for (const r of rows) {
    if (r.session === session) continue;
    if (r.body == null) deleted.push(String(r.id));
    else events.push(JSON.parse(String(r.body)));
  }
  const cursor = rows.length ? Number(rows[rows.length - 1].seq) : req.cursor;
  const records: Rec[] = [...have.values()].map((r) => ({
    key: String(r.key),
    value: r.body == null ? null : JSON.parse(String(r.body)),
    updatedAt: Number(r.updated_at),
  }));
  return { cursor, events, deleted, records, more: rows.length === PAGE };
}
