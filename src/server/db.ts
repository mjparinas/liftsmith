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
  // Lifetime codes (src/server/creators.ts): one row per account that redeemed one. The row is the account's Pro,
  // and the rows for a code are its uses. Kept when the account is deleted, so a deleted account's use stays spent.
  `CREATE TABLE IF NOT EXISTS pro_grants (
    account_id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS pro_grants_code ON pro_grants (code)`,
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
  // Two-step sign-in for staff (src/server/twoFactor.ts): the authenticator secret (sealed with TWO_FACTOR_KEY),
  // one-time recovery codes (hashes only) and the sessions that have passed the second step.
  `CREATE TABLE IF NOT EXISTS admin_two_factor (
    email TEXT PRIMARY KEY,
    secret TEXT,
    pending TEXT,
    enabled_at INTEGER,
    last_step INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS admin_backup_codes (
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    used_at INTEGER,
    PRIMARY KEY (email, code_hash)
  )`,
  `CREATE TABLE IF NOT EXISTS admin_session_steps (
    token_hash TEXT PRIMARY KEY,
    at INTEGER NOT NULL
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
  // Private staff notes on an account (Users tab, src/server/adminUsers.ts). Never shown to the lifter; deleted
  // with the account.
  `CREATE TABLE IF NOT EXISTS account_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    at INTEGER NOT NULL,
    author TEXT NOT NULL,
    text TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS account_notes_account ON account_notes (account_id)`,
  // Feature flags and A/B tests (src/server/flags.ts). A flag's row appears once an admin changes it; until then
  // its default in src/lib/flags.ts applies. Values are stored as JSON (14, true).
  `CREATE TABLE IF NOT EXISTS feature_flags (
    name TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    rollout INTEGER NOT NULL DEFAULT 100,
    updated_at INTEGER NOT NULL,
    updated_by TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS experiments (
    flag TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    variants TEXT NOT NULL,
    winner TEXT,
    created_at INTEGER NOT NULL,
    started_at INTEGER,
    stopped_at INTEGER
  )`,
  // Which variant each install was shown, recorded the first time it asks during a running test.
  `CREATE TABLE IF NOT EXISTS experiment_assignments (
    flag TEXT NOT NULL,
    install_id TEXT NOT NULL,
    variant TEXT NOT NULL,
    at INTEGER NOT NULL,
    PRIMARY KEY (flag, install_id)
  )`,
  // Small admin settings (src/server/settings.ts): maintenance mode, alert switches, running costs, saved replies,
  // the last restore practice, and when each alert last went out.
  `CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  // Failed sign-ins to a staff address (ADMIN_EMAILS, SUPPORT_EMAILS) only, kept 30 days, for the System tab's
  // Admin security card and the repeated-failures alert. The address and which step failed, nothing else.
  `CREATE TABLE IF NOT EXISTS staff_sign_in_failures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    step TEXT NOT NULL,
    at INTEGER NOT NULL
  )`,
  // One database size sample a day, kept 90 days, for the System tab's Capacity card.
  `CREATE TABLE IF NOT EXISTS db_size_samples (
    day INTEGER PRIMARY KEY,
    bytes INTEGER NOT NULL
  )`,
  // Connected apps (src/server/connect.ts): one row per account and cloud service (Strava, Oura, Whoop). The
  // tokens are encrypted with a key made from that service's client secret, so a copy of the database alone
  // can't use them. Deleted with the account, and on Disconnect (after revoking the token at the service).
  `CREATE TABLE IF NOT EXISTS connections (
    account_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at INTEGER NOT NULL,
    who TEXT,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (account_id, provider)
  )`,
  // One-time OAuth states: the app asks for one while signed in, the service sends it back to the callback.
  `CREATE TABLE IF NOT EXISTS connect_states (
    state TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    platform TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  // Workouts already posted to Strava, so a retry from a second device or a flaky network never posts twice.
  `CREATE TABLE IF NOT EXISTS connect_uploads (
    account_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    session_id TEXT NOT NULL,
    remote_id TEXT,
    at INTEGER NOT NULL,
    PRIMARY KEY (account_id, provider, session_id)
  )`,
  // Public pages already sent to IndexNow, and as what (src/server/indexnow.ts).
  `CREATE TABLE IF NOT EXISTS indexnow_sent (
    url TEXT PRIMARY KEY,
    sig TEXT NOT NULL,
    sent_at INTEGER NOT NULL
  )`,
  // Shared across serverless instances, unlike an in-memory counter.
  // Public share links (shareLinks.ts): the card image the lifter chose to publish, deleted with the account.
  `CREATE TABLE IF NOT EXISTS share_links (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    lang TEXT NOT NULL DEFAULT 'en',
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    image BLOB NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS share_links_account ON share_links (account_id, created_at)`,
  // Trainer mode (src/server/coach.ts): a coach's invite code, and each coach and client pair the client agreed to.
  `CREATE TABLE IF NOT EXISTS coach_invites (
    code TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS coach_invites_coach ON coach_invites (coach_id)`,
  `CREATE TABLE IF NOT EXISTS coach_links (
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (coach_id, client_id)
  )`,
  `CREATE INDEX IF NOT EXISTS coach_links_client ON coach_links (client_id)`,
  // Routines a coach assigned to a client (stage 2), as routine share codes (routineShare.ts).
  `CREATE TABLE IF NOT EXISTS coach_plans (
    id TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS coach_plans_pair ON coach_plans (coach_id, client_id)`,
  `CREATE INDEX IF NOT EXISTS coach_plans_client ON coach_plans (client_id)`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
  )`,
];

/**
 * Columns added to a table after it first shipped: CREATE TABLE IF NOT EXISTS leaves an existing table alone,
 * so each one is added here if it's missing. Only ever append; a column is never renamed or dropped.
 */
const COLUMNS: [table: string, column: string, def: string][] = [
  // Codes of our own, not only creators' (Melvin, 2026-11-10): see src/server/creators.ts.
  ["creators", "kind", "TEXT NOT NULL DEFAULT 'creator'"],
  ["creators", "trial_days", "INTEGER"],
  ["creators", "offering", "TEXT"],
  ["creators", "ends_at", "INTEGER"],
  ["creators", "max_uses", "INTEGER"],
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
    for (const [table, column, def] of COLUMNS) {
      const have = await c.execute(`PRAGMA table_info(${table})`);
      if (!have.rows.some((r) => r.name === column)) await c.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
    }
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
  // One atomic statement, so parallel requests can't all read the same count and slip past the limit.
  const rows = await query<{ count: number }>(
    `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN rate_limits.reset_at <= ? THEN 1 ELSE rate_limits.count + 1 END,
       reset_at = CASE WHEN rate_limits.reset_at <= ? THEN excluded.reset_at ELSE rate_limits.reset_at END
     RETURNING count`,
    [key, now + windowMs, now, now],
  );
  return Number(rows[0]?.count ?? 1) <= limit;
}

/** For tests: a fresh in-memory database. */
export async function resetDb() {
  client?.close();
  client = null;
  ready = null;
}
