// The reminder subscription tables in the server's libSQL database (Turso in production, a local file
// in development). Uses the same environment variables as the rest of the server (DATABASE_URL and
// DATABASE_AUTH_TOKEN, or the TURSO_* pair the Vercel integration creates), so it shares one database
// with analytics. Kept in its own file and tables so accounts can adopt it: account_id is nullable.
import { createClient, type Client } from "@libsql/client";
import type { Send, Store, Sub } from "./reminders";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS reminder_subs (
    id TEXT PRIMARY KEY,
    account_id TEXT,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    confirm_hash TEXT,
    status TEXT NOT NULL,
    kinds TEXT NOT NULL,
    plan TEXT NOT NULL,
    consent_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    confirmed_at INTEGER,
    confirm_sends TEXT NOT NULL DEFAULT '[]'
  )`,
  `CREATE INDEX IF NOT EXISTS reminder_subs_status ON reminder_subs (status)`,
  `CREATE INDEX IF NOT EXISTS reminder_subs_account ON reminder_subs (account_id)`,
  `CREATE TABLE IF NOT EXISTS reminder_sends (
    sub_id TEXT NOT NULL,
    key TEXT NOT NULL,
    kind TEXT NOT NULL,
    send_at INTEGER NOT NULL,
    resend_id TEXT,
    status TEXT NOT NULL,
    PRIMARY KEY (sub_id, key)
  )`,
  `CREATE INDEX IF NOT EXISTS reminder_sends_at ON reminder_sends (sub_id, send_at)`,
];

let client: Client | null = null;
let ready: Promise<void> | null = null;

function db(): Client {
  if (!client) {
    const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:local.db";
    client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN });
  }
  return client;
}

async function init() {
  ready ??= db().batch(SCHEMA, "write").then(() => undefined);
  await ready;
}

type Row = Record<string, unknown>;

const toSub = (r: Row): Sub => ({
  id: String(r.id),
  accountId: r.account_id == null ? null : String(r.account_id),
  email: String(r.email),
  tokenHash: String(r.token_hash),
  confirmHash: r.confirm_hash == null ? null : String(r.confirm_hash),
  status: String(r.status) as Sub["status"],
  kinds: JSON.parse(String(r.kinds)),
  plan: JSON.parse(String(r.plan)),
  consentAt: Number(r.consent_at),
  createdAt: Number(r.created_at),
  updatedAt: Number(r.updated_at),
  confirmedAt: r.confirmed_at == null ? null : Number(r.confirmed_at),
  confirmSends: JSON.parse(String(r.confirm_sends ?? "[]")),
});

const toSend = (r: Row): Send => ({
  subId: String(r.sub_id),
  key: String(r.key),
  kind: String(r.kind) as Send["kind"],
  sendAt: Number(r.send_at),
  resendId: r.resend_id == null ? null : String(r.resend_id),
  status: String(r.status) as Send["status"],
});

export function dbStore(): Store {
  return {
    async get(id) {
      await init();
      const r = await db().execute({ sql: "SELECT * FROM reminder_subs WHERE id = ?", args: [id] });
      return r.rows[0] ? toSub(r.rows[0] as Row) : null;
    },
    async put(s) {
      await init();
      await db().execute({
        sql: `INSERT INTO reminder_subs (id, account_id, email, token_hash, confirm_hash, status, kinds, plan, consent_at, created_at, updated_at, confirmed_at, confirm_sends)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT (id) DO UPDATE SET account_id = excluded.account_id, email = excluded.email, token_hash = excluded.token_hash,
                confirm_hash = excluded.confirm_hash, status = excluded.status, kinds = excluded.kinds, plan = excluded.plan,
                consent_at = excluded.consent_at, updated_at = excluded.updated_at, confirmed_at = excluded.confirmed_at, confirm_sends = excluded.confirm_sends`,
        args: [s.id, s.accountId, s.email, s.tokenHash, s.confirmHash, s.status, JSON.stringify(s.kinds), JSON.stringify(s.plan), s.consentAt, s.createdAt, s.updatedAt, s.confirmedAt, JSON.stringify(s.confirmSends)],
      });
    },
    async remove(id) {
      await init();
      await db().execute({ sql: "DELETE FROM reminder_subs WHERE id = ?", args: [id] });
    },
    async confirmed() {
      await init();
      const r = await db().execute("SELECT * FROM reminder_subs WHERE status = 'confirmed'");
      return r.rows.map((x) => toSub(x as Row));
    },
    async sends(subId, since) {
      await init();
      const r = await db().execute({ sql: "SELECT * FROM reminder_sends WHERE sub_id = ? AND send_at >= ?", args: [subId, since] });
      return r.rows.map((x) => toSend(x as Row));
    },
    async putSend(s) {
      await init();
      await db().execute({
        sql: `INSERT INTO reminder_sends (sub_id, key, kind, send_at, resend_id, status) VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT (sub_id, key) DO UPDATE SET kind = excluded.kind, send_at = excluded.send_at, resend_id = excluded.resend_id, status = excluded.status`,
        args: [s.subId, s.key, s.kind, s.sendAt, s.resendId, s.status],
      });
    },
    async removeSends(subId) {
      await init();
      await db().execute({ sql: "DELETE FROM reminder_sends WHERE sub_id = ?", args: [subId] });
    },
  };
}
