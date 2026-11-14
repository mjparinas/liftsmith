// The reminder subscription tables, in the server's one libSQL database (db.ts: Turso in production, a
// local file in development, memory in tests). Kept in their own tables so accounts can adopt them:
// account_id is nullable.
import { query, run, type Row } from "./db";
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

let ready: Promise<void> | null = null;

async function init() {
  ready ??= (async () => {
    for (const sql of SCHEMA) await run(sql);
  })().catch((e) => {
    ready = null;
    throw e;
  });
  await ready;
}

/** For tests, after resetDb(): the tables are made again on next use. */
export function resetRemindersDb() {
  ready = null;
}

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
      const rows = await query("SELECT * FROM reminder_subs WHERE id = ?", [id]);
      return rows[0] ? toSub(rows[0]) : null;
    },
    async put(s) {
      await init();
      await run(
        `INSERT INTO reminder_subs (id, account_id, email, token_hash, confirm_hash, status, kinds, plan, consent_at, created_at, updated_at, confirmed_at, confirm_sends)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT (id) DO UPDATE SET account_id = excluded.account_id, email = excluded.email, token_hash = excluded.token_hash,
                confirm_hash = excluded.confirm_hash, status = excluded.status, kinds = excluded.kinds, plan = excluded.plan,
                consent_at = excluded.consent_at, updated_at = excluded.updated_at, confirmed_at = excluded.confirmed_at, confirm_sends = excluded.confirm_sends`,
        [
          s.id,
          s.accountId,
          s.email,
          s.tokenHash,
          s.confirmHash,
          s.status,
          JSON.stringify(s.kinds),
          JSON.stringify(s.plan),
          s.consentAt,
          s.createdAt,
          s.updatedAt,
          s.confirmedAt,
          JSON.stringify(s.confirmSends),
        ],
      );
    },
    async remove(id) {
      await init();
      await run("DELETE FROM reminder_subs WHERE id = ?", [id]);
    },
    async confirmed() {
      await init();
      return (await query("SELECT * FROM reminder_subs WHERE status = 'confirmed'")).map(toSub);
    },
    async sends(subId, since) {
      await init();
      return (await query("SELECT * FROM reminder_sends WHERE sub_id = ? AND send_at >= ?", [subId, since])).map(toSend);
    },
    async putSend(s) {
      await init();
      await run(
        `INSERT INTO reminder_sends (sub_id, key, kind, send_at, resend_id, status) VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT (sub_id, key) DO UPDATE SET kind = excluded.kind, send_at = excluded.send_at, resend_id = excluded.resend_id, status = excluded.status`,
        [s.subId, s.key, s.kind, s.sendAt, s.resendId, s.status],
      );
    },
    async removeSends(subId) {
      await init();
      await run("DELETE FROM reminder_sends WHERE sub_id = ?", [subId]);
    },
    async friendActivity(accountId, since) {
      // People this account follows (accepted), not blocked either way and not suspended, with the workouts each
      // posted to Friends since `since` (hidden posts left out). The Friends tables live in db.ts's schema.
      const rows = await query(
        `SELECT p.name AS name, COUNT(*) AS workouts
           FROM follows f
           JOIN social_profiles p ON p.account_id = f.followee_id AND p.suspended = 0
           JOIN posts x ON x.account_id = f.followee_id AND x.at >= ? AND x.hidden = 0
          WHERE f.follower_id = ? AND f.accepted = 1
            AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = f.follower_id AND b.blocked_id = f.followee_id)
                                                     OR (b.blocker_id = f.followee_id AND b.blocked_id = f.follower_id))
          GROUP BY f.followee_id, p.name
          ORDER BY workouts DESC, p.name
          LIMIT 20`,
        [since, accountId],
      ).catch(() => []);
      return rows.map((r) => ({ name: String(r.name), workouts: Number(r.workouts) }));
    },
  };
}
