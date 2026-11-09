// The server's one database (as in Gradelings): SQLite-compatible libSQL. A local file in development,
// a hosted Turso database in production (DATABASE_URL + DATABASE_AUTH_TOKEN, or the TURSO_DATABASE_URL +
// TURSO_AUTH_TOKEN pair the Vercel Marketplace integration creates), and memory in tests.
import { createClient, type Client, type InValue } from "@libsql/client";

const SCHEMA = [
  // One row per install (a random id made on first open; not an advertising id). Latest device details win.
  `CREATE TABLE IF NOT EXISTS installs (
    id TEXT PRIMARY KEY,
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    platform TEXT NOT NULL,
    app_version TEXT,
    first_version TEXT,
    build TEXT,
    os TEXT,
    os_version TEXT,
    manufacturer TEXT,
    model TEXT,
    form_factor TEXT,
    locale TEXT,
    time_zone TEXT,
    screen TEXT,
    country TEXT,
    region TEXT,
    store TEXT,
    source TEXT,
    medium TEXT,
    campaign TEXT,
    content TEXT,
    term TEXT,
    referrer TEXT,
    landing TEXT,
    asa_campaign TEXT,
    reduced_motion INTEGER,
    test INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS installs_first ON installs (first_seen)`,
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    install_id TEXT NOT NULL,
    name TEXT NOT NULL,
    at INTEGER NOT NULL,
    received_at INTEGER NOT NULL,
    platform TEXT NOT NULL,
    app_version TEXT,
    props TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS events_name_at ON events (name, at)`,
  `CREATE INDEX IF NOT EXISTS events_install_at ON events (install_id, at)`,
  // Website page views and call-to-action clicks: cookieless. `visitor` is a hash of a daily salt, the
  // address and the browser, so a visitor counts once a day and can't be followed from one day to the next.
  `CREATE TABLE IF NOT EXISTS page_views (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    at INTEGER NOT NULL,
    day INTEGER NOT NULL,
    visitor TEXT NOT NULL,
    path TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'view',
    cta TEXT,
    referrer TEXT,
    source TEXT,
    medium TEXT,
    campaign TEXT,
    country TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    bot INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS page_views_day ON page_views (day)`,
  // Subscription changes. Written from the app's purchase events now; the store server notifications
  // (App Store Server Notifications v2, Google Play RTDN) write here when billing lands.
  `CREATE TABLE IF NOT EXISTS subscription_events (
    id TEXT PRIMARY KEY,
    at INTEGER NOT NULL,
    install_id TEXT,
    subscription TEXT,
    store TEXT NOT NULL,
    kind TEXT NOT NULL,
    plan TEXT,
    price_micros INTEGER,
    currency TEXT,
    usd_micros INTEGER,
    country TEXT,
    reason TEXT,
    source TEXT NOT NULL DEFAULT 'app'
  )`,
  `CREATE INDEX IF NOT EXISTS subscription_events_at ON subscription_events (at)`,
  // The store entitlement per RevenueCat user (the app's install id), kept up to date by the webhook, so
  // accounts and sync can read Pro from the server later (revenuecat.ts).
  `CREATE TABLE IF NOT EXISTS entitlements (
    app_user_id TEXT PRIMARY KEY,
    active INTEGER NOT NULL,
    plan TEXT,
    period TEXT,
    store TEXT,
    expires_at INTEGER,
    family INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`,
  // Creator program (src/server/creators.ts). A creator's code, their terms, and which installs came with it.
  `CREATE TABLE IF NOT EXISTS creators (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT,
    rate REAL NOT NULL DEFAULT 0.3,
    months INTEGER NOT NULL DEFAULT 12,
    active INTEGER NOT NULL DEFAULT 1,
    note TEXT,
    created_at INTEGER NOT NULL
  )`,
  // One row per install: the code it came with. Fixed once the install starts a trial or buys.
  `CREATE TABLE IF NOT EXISTS creator_installs (
    install_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    at INTEGER NOT NULL,
    source TEXT NOT NULL,
    platform TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS creator_installs_code ON creator_installs (code)`,
  // Commission paid out, recorded by an admin after paying (PayPal or Wise, outside the app).
  `CREATE TABLE IF NOT EXISTS creator_payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    usd_micros INTEGER NOT NULL,
    paid_at INTEGER NOT NULL,
    admin TEXT NOT NULL,
    note TEXT
  )`,
  // Accounts (src/server/accounts.ts): optional, for sync. One account per person; each sign-in method
  // (Google, Apple, an emailed code) is an identity on it. Accounts with the same verified email are one account.
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    email TEXT,
    created_at INTEGER NOT NULL,
    last_seen INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS accounts_email ON accounts (email)`,
  `CREATE TABLE IF NOT EXISTS account_identities (
    provider TEXT NOT NULL,
    subject TEXT NOT NULL,
    account_id TEXT NOT NULL,
    email TEXT,
    created_at INTEGER NOT NULL,
    apple_refresh TEXT,
    PRIMARY KEY (provider, subject)
  )`,
  `CREATE INDEX IF NOT EXISTS account_identities_account ON account_identities (account_id)`,
  // Sessions: only a hash of the token is stored. The token lives on the device.
  `CREATE TABLE IF NOT EXISTS account_sessions (
    token_hash TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    platform TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS account_sessions_account ON account_sessions (account_id)`,
  // Email sign-in codes: a hash of the code, tries left, and how many were sent today.
  `CREATE TABLE IF NOT EXISTS account_codes (
    email TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    tries INTEGER NOT NULL DEFAULT 0,
    sent INTEGER NOT NULL DEFAULT 0,
    window_start INTEGER NOT NULL
  )`,
  // Sync (src/server/sync.ts): every event the lifter's devices wrote, in arrival order (seq is the cursor).
  // A deleted event stays as a tombstone (body NULL) so other devices delete it too.
  `CREATE TABLE IF NOT EXISTS sync_events (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    id TEXT NOT NULL,
    at INTEGER NOT NULL,
    body TEXT,
    session TEXT,
    UNIQUE (account_id, id)
  )`,
  `CREATE INDEX IF NOT EXISTS sync_events_account_seq ON sync_events (account_id, seq)`,
  // The profile and each gym, last write wins on updated_at. A removed gym keeps a row with body NULL.
  `CREATE TABLE IF NOT EXISTS sync_records (
    account_id TEXT NOT NULL,
    key TEXT NOT NULL,
    body TEXT,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (account_id, key)
  )`,
  // Admin sign-in: one-time email links and sessions. Only hashes of the tokens are stored.
  `CREATE TABLE IF NOT EXISTS admin_links (
    token_hash TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS admin_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at INTEGER NOT NULL,
    admin TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT,
    detail TEXT
  )`,
  // Admin inbox (src/server/inbox.ts): mail is read live from Resend, so only what the admin did with each
  // message is kept here, never its body.
  `CREATE TABLE IF NOT EXISTS inbox_state (
    email_id TEXT PRIMARY KEY,
    handled_at INTEGER,
    replied_at INTEGER,
    replied_by TEXT,
    archived_at INTEGER
  )`,
  // Admin to-do list (src/server/adminTodo.ts): items worked out from the data that were snoozed or dismissed,
  // and the admins' own tasks.
  `CREATE TABLE IF NOT EXISTS admin_todo_hidden (
    key TEXT PRIMARY KEY,
    until INTEGER NOT NULL,
    at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS admin_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    note TEXT,
    due INTEGER,
    created_at INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    done_at INTEGER,
    done_by TEXT
  )`,
  // When scheduled jobs ran and how they went, for the System page (src/server/monitor.ts). Kept 60 days.
  `CREATE TABLE IF NOT EXISTS job_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    ok INTEGER,
    detail TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS job_runs_job ON job_runs (job, started_at)`,
  // Shared across serverless instances, unlike an in-memory counter.
  `CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
  )`,
];

let client: Client | null = null;
let ready: Promise<void> | null = null;

function url(): { url: string; authToken?: string } {
  const env = process.env;
  const remote = env.DATABASE_URL || env.TURSO_DATABASE_URL;
  if (remote) return { url: remote, authToken: env.DATABASE_AUTH_TOKEN || env.TURSO_AUTH_TOKEN || undefined };
  if (env.VITEST) return { url: ":memory:" };
  return { url: "file:.data/liftsmith.db" };
}

async function db(): Promise<Client> {
  if (!client) {
    const cfg = url();
    if (cfg.url.startsWith("file:")) {
      const { mkdirSync } = await import("node:fs");
      mkdirSync(".data", { recursive: true });
    }
    client = createClient(cfg);
  }
  const c = client;
  ready ??= (async () => {
    for (const s of SCHEMA) await c.execute(s);
  })();
  await ready;
  return c;
}

export type Row = Record<string, unknown>;

export async function query<T = Row>(sql: string, args: InValue[] = []): Promise<T[]> {
  const r = await (await db()).execute({ sql, args });
  return r.rows as unknown as T[];
}

export async function run(sql: string, args: InValue[] = []): Promise<number> {
  const r = await (await db()).execute({ sql, args });
  return r.rowsAffected;
}

export async function batch(stmts: { sql: string; args: InValue[] }[]): Promise<void> {
  if (!stmts.length) return;
  await (await db()).batch(stmts, "write");
}

/** Counts a hit against `key` and says whether it's within `limit` per `windowMs`. */
export async function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): Promise<boolean> {
  const rows = await query<{ count: number; reset_at: number }>("SELECT count, reset_at FROM rate_limits WHERE key = ?", [key]);
  const r = rows[0];
  if (!r || Number(r.reset_at) <= now) {
    await run("INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at", [key, now + windowMs]);
    return true;
  }
  if (Number(r.count) >= limit) return false;
  await run("UPDATE rate_limits SET count = count + 1 WHERE key = ?", [key]);
  return true;
}

/** For tests: a fresh in-memory database. */
export async function resetDb() {
  client?.close();
  client = null;
  ready = null;
}
