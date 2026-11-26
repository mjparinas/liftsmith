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
  // The admin panel's date-range counts ("events WHERE at > ?") read only the days asked for, not the whole table.
  `CREATE INDEX IF NOT EXISTS events_at ON events (at)`,
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
  // Pro on the web (src/server/stripe.ts): the account's Stripe customer, and each subscription's latest state from the
  // webhook. A row in a Pro status (trialing, active, past_due) whose period hasn't ended is the account's web Pro.
  `CREATE TABLE IF NOT EXISTS stripe_customers (
    account_id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL UNIQUE,
    at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS stripe_subscriptions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    status TEXT NOT NULL,
    plan TEXT,
    period_end INTEGER,
    trial_end INTEGER,
    cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
    install_id TEXT,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS stripe_subscriptions_account ON stripe_subscriptions (account_id)`,
  `CREATE INDEX IF NOT EXISTS stripe_subscriptions_customer ON stripe_subscriptions (customer_id)`,
  // Which installs synced under which account (src/server/access.ts), so a phone's store subscription (the
  // `entitlements` row RevenueCat keeps for that install) gives the account Pro on the web too.
  `CREATE TABLE IF NOT EXISTS account_installs (
    account_id TEXT NOT NULL,
    install_id TEXT NOT NULL,
    at INTEGER NOT NULL,
    PRIMARY KEY (account_id, install_id)
  )`,
  `CREATE INDEX IF NOT EXISTS account_installs_install ON account_installs (install_id)`,
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
  // How many events (tombstones included) and bytes of bodies an account has synced, kept so a push needn't count them
  // all (sync.ts checkQuota). Runs high, never low, and is counted afresh daily and near the quota.
  `CREATE TABLE IF NOT EXISTS sync_usage (
    account_id TEXT PRIMARY KEY,
    events INTEGER NOT NULL,
    bytes INTEGER NOT NULL,
    at INTEGER NOT NULL
  )`,
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
  // Feature flags (src/server/flags.ts; A/B tests and their tables were removed on 2026-11-15). A flag's row appears once an admin changes it; until then
  // its default in src/lib/flags.ts applies. Values are stored as JSON (14, true).
  `CREATE TABLE IF NOT EXISTS feature_flags (
    name TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    rollout INTEGER NOT NULL DEFAULT 100,
    updated_at INTEGER NOT NULL,
    updated_by TEXT NOT NULL
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
  // Garmin Connect pushes data to us instead of answering when asked (src/server/connect.ts, docs/decisions/connected-apps.md),
  // so its readings and cardio sessions wait here until the lifter's app pulls them: one row per metric and day, and per
  // session. Readings go after 100 days and sessions after a year; Disconnect, Garmin's deregistration and deleting the
  // account remove them at once.
  `CREATE TABLE IF NOT EXISTS cloud_readings (
    account_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    metric TEXT NOT NULL,
    day TEXT NOT NULL,
    value REAL NOT NULL,
    at INTEGER NOT NULL,
    PRIMARY KEY (account_id, provider, metric, day)
  )`,
  `CREATE TABLE IF NOT EXISTS cloud_sessions (
    account_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    id TEXT NOT NULL,
    kind TEXT NOT NULL,
    start INTEGER NOT NULL,
    seconds INTEGER NOT NULL,
    distance_m INTEGER NOT NULL,
    PRIMARY KEY (account_id, provider, id)
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
  // Gyms lifters chose to list so others nearby can add their setup (gymDirectory.ts). Position kept at 0.01°
  // (about 1 km) only. Deleted with the account.
  `CREATE TABLE IF NOT EXISTS public_gyms (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    local_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    unit TEXT NOT NULL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    adds INTEGER NOT NULL DEFAULT 0,
    hidden INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE (account_id, local_id)
  )`,
  `CREATE INDEX IF NOT EXISTS public_gyms_place ON public_gyms (lat, lon)`,
  `CREATE TABLE IF NOT EXISTS gym_reports (
    reporter TEXT NOT NULL,
    gym_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    PRIMARY KEY (reporter, gym_id)
  )`,
  // Real gyms (gymPlaces.ts, docs/decisions/gyms.md): seeded from OpenStreetMap by staff, official once an owner
  // claims one. Business places, not lifter data, so the position is kept as the map has it.
  `CREATE TABLE IF NOT EXISTS gym_places (
    id TEXT PRIMARY KEY,
    city_slug TEXT NOT NULL,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'gym',
    address TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    region TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    hours TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL,
    source_ref TEXT NOT NULL DEFAULT '',
    code TEXT NOT NULL DEFAULT '',
    claimed_by TEXT NOT NULL DEFAULT '',
    claimed_at INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    lifters INTEGER NOT NULL DEFAULT 0,
    hidden INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE (city_slug, slug)
  )`,
  `CREATE INDEX IF NOT EXISTS gym_places_at ON gym_places (lat, lon)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS gym_places_ref ON gym_places (source_ref) WHERE source_ref <> ''`,
  // Gyms staff deleted from Admin › Reports (gymPlaceReports.ts, Melvin 2026-11-19: "these gyms need to be deleted not
  // edited"): the map's id of each, so no import or daily refresh brings it back (savePlaces skips them). The name and
  // city are for staff reading the table later. Public map data and a staff address only.
  `CREATE TABLE IF NOT EXISTS gym_places_deleted (
    source_ref TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    deleted_by TEXT NOT NULL DEFAULT '',
    at INTEGER NOT NULL
  )`,
  // One row per city import from OpenStreetMap (gymImport.ts, 2026-11-14): what happened, how long each step took and
  // which map server answered, for Admin › Gyms' recent imports and its debug log. `scope` keeps the area Nominatim
  // found, so a re-import skips that lookup. Staff work on public map data, nothing about a lifter; kept 90 days.
  `CREATE TABLE IF NOT EXISTS gym_imports (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT '',
    scope TEXT NOT NULL DEFAULT '',
    ok INTEGER NOT NULL,
    error TEXT NOT NULL DEFAULT '',
    found INTEGER NOT NULL DEFAULT 0,
    added INTEGER NOT NULL DEFAULT 0,
    updated INTEGER NOT NULL DEFAULT 0,
    unchanged INTEGER NOT NULL DEFAULT 0,
    kept INTEGER NOT NULL DEFAULT 0,
    server TEXT NOT NULL DEFAULT '',
    ms INTEGER NOT NULL DEFAULT 0,
    log TEXT NOT NULL DEFAULT '',
    at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS gym_imports_query ON gym_imports (query, at)`,
  `CREATE INDEX IF NOT EXISTS gym_imports_at ON gym_imports (at)`,
  // A gym page's old address after its city was fixed (gymPlaces.ts moveToCity, 2026-11-15): a postcode or house number
  // had been taken for the city ("80145, Campania"), so the page moved and the old one redirects. Public pages only.
  `CREATE TABLE IF NOT EXISTS gym_moves (
    old_city_slug TEXT NOT NULL,
    old_slug TEXT NOT NULL,
    place_id TEXT NOT NULL,
    at INTEGER NOT NULL,
    PRIMARY KEY (old_city_slug, old_slug)
  )`,
  // Country and every-country imports as a server job (gymImportJobs.ts, 2026-11-15): the job, and one row per city
  // with its state (pending, running, waiting to retry, ok, failed) and result. One worker holds a job at a time
  // (`lease_until`). Public map data and timings, plus the staff address that started it; kept 90 days.
  `CREATE TABLE IF NOT EXISTS gym_import_jobs (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    state TEXT NOT NULL,
    total INTEGER NOT NULL DEFAULT 0,
    skipped INTEGER NOT NULL DEFAULT 0,
    started_by TEXT NOT NULL DEFAULT '',
    notify INTEGER NOT NULL DEFAULT 0,
    emailed INTEGER NOT NULL DEFAULT 0,
    dismissed INTEGER NOT NULL DEFAULT 0,
    started_at INTEGER NOT NULL,
    ended_at INTEGER NOT NULL DEFAULT 0,
    active_at INTEGER NOT NULL DEFAULT 0,
    lease_until INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS gym_import_jobs_state ON gym_import_jobs (state, started_at)`,
  // The AI fix-up pass (gymAiFix.ts, docs/decisions/gyms.md "AI fix-up pass"): one job at a time, paused until midnight
  // Pacific when the day's AI cap is reached, and every change it made to a gym with the value before, so staff can undo
  // it. Public map and website data plus the staff address that started it.
  `CREATE TABLE IF NOT EXISTS gym_ai_fix_jobs (
    id TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    total INTEGER NOT NULL DEFAULT 0,
    done INTEGER NOT NULL DEFAULT 0,
    filled INTEGER NOT NULL DEFAULT 0,
    fixed INTEGER NOT NULL DEFAULT 0,
    flagged INTEGER NOT NULL DEFAULT 0,
    skipped INTEGER NOT NULL DEFAULT 0,
    note TEXT NOT NULL DEFAULT '',
    started_by TEXT NOT NULL DEFAULT '',
    started_at INTEGER NOT NULL,
    ended_at INTEGER NOT NULL DEFAULT 0,
    active_at INTEGER NOT NULL DEFAULT 0,
    lease_until INTEGER NOT NULL DEFAULT 0,
    paused_until INTEGER NOT NULL DEFAULT 0,
    dismissed INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS gym_ai_fix_jobs_state ON gym_ai_fix_jobs (state, started_at)`,
  `CREATE TABLE IF NOT EXISTS gym_ai_fixes (
    id TEXT PRIMARY KEY,
    job TEXT NOT NULL,
    place_id TEXT NOT NULL,
    field TEXT NOT NULL,
    before TEXT NOT NULL DEFAULT '',
    after TEXT NOT NULL DEFAULT '',
    at INTEGER NOT NULL,
    undone INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS gym_ai_fixes_job ON gym_ai_fixes (job, at)`,
  `CREATE TABLE IF NOT EXISTS gym_import_items (
    job TEXT NOT NULL,
    idx INTEGER NOT NULL,
    place TEXT NOT NULL,
    state TEXT NOT NULL,
    tries INTEGER NOT NULL DEFAULT 0,
    not_before INTEGER NOT NULL DEFAULT 0,
    at INTEGER NOT NULL DEFAULT 0,
    result TEXT NOT NULL DEFAULT '',
    retried TEXT NOT NULL DEFAULT '',
    found INTEGER NOT NULL DEFAULT 0,
    added INTEGER NOT NULL DEFAULT 0,
    updated INTEGER NOT NULL DEFAULT 0,
    unchanged INTEGER NOT NULL DEFAULT 0,
    kept INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (job, idx)
  )`,
  `CREATE INDEX IF NOT EXISTS gym_import_items_state ON gym_import_items (job, state)`,
  // Owners claiming a gym (gymClaims.ts): an emailed code, the poster's code, or staff review. Deleted with the account.
  `CREATE TABLE IF NOT EXISTS gym_claims (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    method TEXT NOT NULL,
    status TEXT NOT NULL,
    code_hash TEXT NOT NULL DEFAULT '',
    expires_at INTEGER NOT NULL DEFAULT 0,
    tries INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    decided_at INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS gym_claims_status ON gym_claims (status, created_at)`,
  // Posters and table stands to print and mail to gyms (gymPosters.ts). The claim code is kept as written until the
  // order ships, so a reprint shows the same one; the gym itself keeps only its hash.
  `CREATE TABLE IF NOT EXISTS gym_posters (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    items TEXT NOT NULL,
    ship_to TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL,
    lang TEXT NOT NULL DEFAULT 'en',
    status TEXT NOT NULL,
    claim_code TEXT NOT NULL DEFAULT '',
    requested_by TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    printed_at INTEGER NOT NULL DEFAULT 0,
    shipped_at INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS gym_posters_status ON gym_posters (status, created_at)`,
  // Lifters who added a real gym, counted once each (account, else a one-way code from the address).
  // Poster and stand QR visits per gym and day (gymPosters.ts countScan), for the owner's last 30 days.
  `CREATE TABLE IF NOT EXISTS gym_scan_days (
    place_id TEXT NOT NULL,
    day INTEGER NOT NULL,
    n INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (place_id, day)
  )`,
  // A claimed gym's logo and photos (gymMedia.ts): JPEGs the app made, one logo and six photos a gym.
  `CREATE TABLE IF NOT EXISTS gym_photos (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    image BLOB NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS gym_photos_place ON gym_photos (place_id)`,
  // Gym chains (gymChains.ts, Melvin 2026-11-19): one row per chain the map names (its brand tag) or whose name
  // repeats in three cities or more. `logo` is a copy of the sharpest website icon among its branches (gym_photos kind
  // 'chain', `logo_from` the icon it was copied from), shown on every unclaimed branch; `places` and `cities` count
  // its visible branches, so a page needs no count of its own.
  `CREATE TABLE IF NOT EXISTS gym_chains (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    website TEXT NOT NULL DEFAULT '',
    logo TEXT NOT NULL DEFAULT '',
    logo_from TEXT NOT NULL DEFAULT '',
    places INTEGER NOT NULL DEFAULT 0,
    cities INTEGER NOT NULL DEFAULT 0,
    countries INTEGER NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'brand',
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS gym_chains_places ON gym_chains (places)`,
  `CREATE TABLE IF NOT EXISTS gym_place_lifters (
    place_id TEXT NOT NULL,
    who TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (place_id, who)
  )`,
  // Round 3 (gymExtras.ts, 2026-11-13): the owner's announcements, equipment lifters reported broken or missing
  // (`who` is the account or the one-way address code, like gym_place_lifters), and trainers listed at a gym.
  `CREATE TABLE IF NOT EXISTS gym_news (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS gym_news_place ON gym_news (place_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS gym_issues (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    equipment TEXT NOT NULL,
    kind TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    who TEXT NOT NULL DEFAULT '',
    reports INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    last_at INTEGER NOT NULL,
    fixed_at INTEGER NOT NULL DEFAULT 0,
    fixed_by TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE INDEX IF NOT EXISTS gym_issues_place ON gym_issues (place_id, fixed_at)`,
  // Owner insights (gymInsights.ts, 2026-11-19): one anonymous visit per workout at a real gym. `who` is a one-way code
  // (account or install), `date` days since 1970, `day` and `hour` the lifter's own weekday and hour, `gear` the kinds of
  // equipment used. Kept KEEP_DAYS (70), cleared per gym as new visits come in.
  `CREATE TABLE IF NOT EXISTS gym_visits (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    who TEXT NOT NULL,
    date INTEGER NOT NULL,
    day INTEGER NOT NULL,
    hour INTEGER NOT NULL,
    minutes INTEGER NOT NULL,
    gear TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE INDEX IF NOT EXISTS gym_visits_place ON gym_visits (place_id, date)`,
  `CREATE INDEX IF NOT EXISTS gym_visits_who ON gym_visits (who)`,
  `CREATE TABLE IF NOT EXISTS gym_trainers (
    place_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    bio TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (place_id, account_id)
  )`,
  `CREATE INDEX IF NOT EXISTS gym_trainers_account ON gym_trainers (account_id)`,
  // A gym's weekly class schedule (gymClasses.ts, 2026-11-17): `days` is the weekdays it runs ("1,3", Sunday = 0),
  // `start` the gym's own clock ("18:30") and `off` the dates it won't run ("2026-12-24,2026-12-31").
  `CREATE TABLE IF NOT EXISTS gym_classes (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    account_id TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    days TEXT NOT NULL,
    start TEXT NOT NULL,
    minutes INTEGER NOT NULL,
    coach TEXT NOT NULL DEFAULT '',
    room TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    off TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS gym_classes_place ON gym_classes (place_id)`,
  `CREATE INDEX IF NOT EXISTS gym_classes_account ON gym_classes (account_id)`,
  // Strength standards from lifters who count their lifts (standards.ts, 2026-11-15): one row per lift, sex and body
  // weight group with at least MIN_CELL lifters, rebuilt each morning. Only percentiles and counts, never an account.
  `CREATE TABLE IF NOT EXISTS strength_standards (
    lift TEXT NOT NULL,
    sex TEXT NOT NULL,
    band INTEGER NOT NULL,
    n INTEGER NOT NULL,
    p25 REAL NOT NULL,
    p50 REAL NOT NULL,
    p75 REAL NOT NULL,
    p90 REAL NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (lift, sex, band)
  )`,
  // Staff accounts for an official gym (gymStaff.ts, 2026-11-13): who besides the owner manages it, and the one-time
  // invite links the owner made. `name` is what the person typed when joining, shown to the owner.
  `CREATE TABLE IF NOT EXISTS gym_staff (
    place_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    invited_by TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    PRIMARY KEY (place_id, account_id)
  )`,
  `CREATE INDEX IF NOT EXISTS gym_staff_account ON gym_staff (account_id)`,
  `CREATE TABLE IF NOT EXISTS gym_staff_invites (
    code TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS gym_staff_invites_place ON gym_staff_invites (place_id)`,
  // Problems lifters and visitors report with a real gym's page (gymPlaceReports.ts, docs/decisions/gyms.md
  // "Reporting a gym page"): wrong details, closed, listed twice, not a gym. `who` is the account or a one-way address key.
  `CREATE TABLE IF NOT EXISTS gym_place_reports (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    who TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    decided_at INTEGER NOT NULL DEFAULT 0,
    decided_by TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE INDEX IF NOT EXISTS gym_place_reports_open ON gym_place_reports (status, place_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS gym_place_reports_once ON gym_place_reports (place_id, who) WHERE status = 'open'`,
  // Friends and the workout feed (social.ts, docs/decisions/friends.md). All deleted with the account.
  `CREATE TABLE IF NOT EXISTS social_profiles (
    account_id TEXT PRIMARY KEY,
    handle TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    open INTEGER NOT NULL DEFAULT 0,
    auto_post INTEGER NOT NULL DEFAULT 0,
    weights INTEGER NOT NULL DEFAULT 1,
    agreed_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    seen_at INTEGER NOT NULL DEFAULT 0,
    suspended INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL,
    followee_id TEXT NOT NULL,
    accepted INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (follower_id, followee_id)
  )`,
  `CREATE INDEX IF NOT EXISTS follows_followee ON follows (followee_id, accepted)`,
  `CREATE TABLE IF NOT EXISTS blocks (
    blocker_id TEXT NOT NULL,
    blocked_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (blocker_id, blocked_id)
  )`,
  `CREATE INDEX IF NOT EXISTS blocks_blocked ON blocks (blocked_id)`,
  `CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    workout_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    at INTEGER NOT NULL,
    body TEXT NOT NULL,
    hidden INTEGER NOT NULL DEFAULT 0,
    UNIQUE (account_id, workout_id)
  )`,
  `CREATE INDEX IF NOT EXISTS posts_account_at ON posts (account_id, at)`,
  // Discover reads the newest public posts from everyone, by time (Friends speed pass, 2026-11-12).
  `CREATE INDEX IF NOT EXISTS posts_at ON posts (at)`,
  `CREATE TABLE IF NOT EXISTS post_likes (
    post_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (post_id, account_id)
  )`,
  `CREATE TABLE IF NOT EXISTS post_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    body TEXT NOT NULL,
    hidden INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS post_comments_post ON post_comments (post_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    UNIQUE (reporter_id, kind, target_id)
  )`,
  `CREATE INDEX IF NOT EXISTS reports_status ON reports (status, kind, target_id)`,
  // Every report on one profile or thing, open or decided, for the admin Users tab (moderation.md).
  `CREATE INDEX IF NOT EXISTS reports_target ON reports (kind, target_id)`,
  // A banned account's email, as a hash, so deleting the account and signing up again can't undo a Friends ban
  // (socialModeration.ts). Kept after the account is deleted; nothing else about the person is.
  `CREATE TABLE IF NOT EXISTS social_bans (
    email_hash TEXT PRIMARY KEY,
    at INTEGER NOT NULL
  )`,
  // A workout sent to a friend (social.ts `send`): a routine code and its name, shown in their Activity.
  `CREATE TABLE IF NOT EXISTS sent_workouts (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sent_workouts_to ON sent_workouts (to_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS sent_workouts_from ON sent_workouts (from_id)`,
  // Invite links (social.ts `invite`): accepting one makes the two lifters follow each other. One live code each.
  `CREATE TABLE IF NOT EXISTS social_invites (
    code TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    uses INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS social_invites_account ON social_invites (account_id)`,
  // Friend challenges (social.ts `challengeCreate`): a few friends race on one measure for 1, 2 or 4 weeks, scored
  // from what each joined member posts in that window. Members are invited, then joined; declining deletes the row.
  `CREATE TABLE IF NOT EXISTS challenges (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    metric TEXT NOT NULL,
    starts_at INTEGER NOT NULL,
    ends_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS challenges_owner ON challenges (owner_id)`,
  `CREATE TABLE IF NOT EXISTS challenge_members (
    challenge_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (challenge_id, account_id)
  )`,
  `CREATE INDEX IF NOT EXISTS challenge_members_account ON challenge_members (account_id)`,
  // Training partners tagged on a post (social.ts `post`): mutual friends only, and a tagged lifter can remove themselves.
  `CREATE TABLE IF NOT EXISTS post_partners (
    post_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (post_id, account_id)
  )`,
  `CREATE INDEX IF NOT EXISTS post_partners_account ON post_partners (account_id)`,
  // Clubs and gym crews (social.ts `clubCreate`): a named group anyone with its code can join, with a weekly board
  // of what its members posted. The starter runs it (can remove members, change the code, delete it).
  `CREATE TABLE IF NOT EXISTS clubs (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS clubs_owner ON clubs (owner_id)`,
  `CREATE TABLE IF NOT EXISTS club_members (
    club_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (club_id, account_id)
  )`,
  `CREATE INDEX IF NOT EXISTS club_members_account ON club_members (account_id)`,
  // Club chat and crew sessions (clubChat.ts, Melvin 2026-11-17): a club's messages, the times its members post to
  // train together, and who's in for each (trained = they posted a workout around its time).
  `CREATE TABLE IF NOT EXISTS club_messages (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    body TEXT NOT NULL,
    hidden INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS club_messages_club ON club_messages (club_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS club_messages_account ON club_messages (account_id)`,
  `CREATE TABLE IF NOT EXISTS crew_sessions (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    starts_at INTEGER NOT NULL,
    title TEXT NOT NULL,
    place TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    reminded INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS crew_sessions_club ON crew_sessions (club_id, starts_at)`,
  `CREATE INDEX IF NOT EXISTS crew_sessions_account ON crew_sessions (account_id)`,
  `CREATE INDEX IF NOT EXISTS crew_sessions_starts ON crew_sessions (starts_at)`,
  `CREATE INDEX IF NOT EXISTS crew_sessions_due ON crew_sessions (starts_at) WHERE reminded = 0`,
  `CREATE TABLE IF NOT EXISTS crew_going (
    session_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    trained INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (session_id, account_id)
  )`,
  `CREATE INDEX IF NOT EXISTS crew_going_account ON crew_going (account_id)`,
  // Muted people (social.ts): their posts stay out of the muter's feed. They aren't told, and nothing else changes.
  `CREATE TABLE IF NOT EXISTS mutes (
    muter_id TEXT NOT NULL,
    muted_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (muter_id, muted_id)
  )`,
  // Monthly challenge finishers (monthly.ts, Friends gap list 3 item 10): one row per device that finished a
  // month's challenge, for the app-wide count on the Awards card. A random id the device makes for this alone (not
  // the usage-stats install id or an account), so a row says nothing about who finished.
  `CREATE TABLE IF NOT EXISTS month_finishers (
    month TEXT NOT NULL,
    device TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (month, device)
  )`,
  // Bells (social.ts `bell`, Friends gap list 3): the watcher gets a push when someone they follow posts a workout
  // they may see. Only while the follow stands; unfollowing, blocking or leaving deletes it.
  `CREATE TABLE IF NOT EXISTS bells (
    watcher_id TEXT NOT NULL,
    watched_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (watcher_id, watched_id)
  )`,
  `CREATE INDEX IF NOT EXISTS bells_watched ON bells (watched_id)`,
  // People named with @handle in a comment who could see the post (social.ts comment), for their Activity.
  `CREATE TABLE IF NOT EXISTS comment_mentions (
    comment_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (comment_id, account_id)
  )`,
  `CREATE INDEX IF NOT EXISTS comment_mentions_account ON comment_mentions (account_id, created_at)`,
  // Training now (social.ts live): the workout a lifter is doing, for mutual friends to see and cheer. A row
  // older than LIVE_FOR counts as over; the app clears it when the workout ends.
  `CREATE TABLE IF NOT EXISTS live_sessions (
    account_id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    exercise_id TEXT NOT NULL DEFAULT '',
    done INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS cheers (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS cheers_to ON cheers (to_id, created_at)`,
  // Check in (Melvin, 2026-11-14): "I'm at the gym" to mutual friends, a push and a toast until they dismiss it.
  `CREATE TABLE IF NOT EXISTS friend_checkins (
    id TEXT PRIMARY KEY,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    gym TEXT NOT NULL DEFAULT '',
    focus TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    dismissed INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS friend_checkins_to ON friend_checkins (to_id, dismissed, created_at)`,
  // Suggestions the lifter dismissed (social.ts `suggest`): that person isn't suggested to them again.
  `CREATE TABLE IF NOT EXISTS suggest_hides (
    account_id TEXT NOT NULL,
    hidden_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (account_id, hidden_id)
  )`,
  // A phone's push token for Friends notifications (push.ts), in the language it registered with.
  `CREATE TABLE IF NOT EXISTS push_tokens (
    token TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    lang TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS push_tokens_account ON push_tokens (account_id, updated_at)`,
  // Trainer mode (src/server/coach.ts): a coach's invite code, and each coach and client pair the client agreed to.
  `CREATE TABLE IF NOT EXISTS coach_invites (
    code TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS coach_invites_coach ON coach_invites (coach_id)`,
  // Who coaches (Melvin, 2026-11-12: "track whether someone is a user vs a coach"): an account becomes a coach when it
  // makes its first invite; via is "coaches" when it came in through the website's coaches page, else "app".
  `CREATE TABLE IF NOT EXISTS coach_accounts (
    account_id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    via TEXT NOT NULL
  )`,
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
  // Trainer mode out of Labs (2026-11-12): what a coach's new clients start setup with, and one note from a coach to each client.
  `CREATE TABLE IF NOT EXISTS coach_defaults (
    coach_id TEXT PRIMARY KEY,
    goal TEXT,
    experience TEXT,
    days INTEGER,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS coach_notes (
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    body TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (coach_id, client_id)
  )`,
  `CREATE INDEX IF NOT EXISTS coach_notes_client ON coach_notes (client_id)`,
  // Coach and client chat (2026-11-12): messages between a linked pair, newest last; each side's read mark.
  `CREATE TABLE IF NOT EXISTS coach_messages (
    id TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    from_id TEXT NOT NULL,
    body TEXT NOT NULL,
    at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS coach_messages_pair ON coach_messages (coach_id, client_id, at)`,
  `CREATE INDEX IF NOT EXISTS coach_messages_client ON coach_messages (client_id)`,
  `CREATE TABLE IF NOT EXISTS coach_reads (
    account_id TEXT NOT NULL,
    other_id TEXT NOT NULL,
    read_at INTEGER NOT NULL,
    PRIMARY KEY (account_id, other_id)
  )`,
  // Coach chat statuses (2026-11-15, src/lib/coachStatus.ts): what each person picked and until when, when they last
  // had coaching open (Online), and who they're typing to and when (one row per account, so it never grows).
  `CREATE TABLE IF NOT EXISTS coach_status (
    account_id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'auto',
    until INTEGER NOT NULL DEFAULT 0,
    seen_at INTEGER NOT NULL DEFAULT 0,
    typing_to TEXT,
    typing_at INTEGER NOT NULL DEFAULT 0
  )`,
  // What a client shares with one coach beyond training: body (weight, body fat, tape measurements, sex and
  // height, for the shaped 3D figure). Off until the client turns it on.
  `CREATE TABLE IF NOT EXISTS coach_shares (
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    body INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (coach_id, client_id)
  )`,
  // Alerts already sent to a coach about a client ("quiet": no workout for a week), so each goes once per gap; and
  // each coach's alert switch (on unless turned off).
  `CREATE TABLE IF NOT EXISTS coach_alerts (
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    at INTEGER NOT NULL,
    PRIMARY KEY (coach_id, client_id, kind)
  )`,
  `CREATE TABLE IF NOT EXISTS coach_prefs (
    account_id TEXT PRIMARY KEY,
    alerts INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL
  )`,
  // A coach's daily nutrition targets for one client (2026-11-13): calories and protein in grams, either may be empty.
  `CREATE TABLE IF NOT EXISTS coach_targets (
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    kcal INTEGER,
    protein INTEGER,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (coach_id, client_id)
  )`,
  `CREATE INDEX IF NOT EXISTS coach_targets_client ON coach_targets (client_id)`,
  // School teams (teams.ts, docs/decisions/school-teams.md): a coach's school address and where its proof stands,
  // the school domains staff have trusted or blocked, each coach's teams, and the athletes on them.
  `CREATE TABLE IF NOT EXISTS school_coaches (
    account_id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    school TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL,
    code_hash TEXT NOT NULL DEFAULT '',
    expires_at INTEGER NOT NULL DEFAULT 0,
    tries INTEGER NOT NULL DEFAULT 0,
    verified_at INTEGER,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS school_coaches_domain ON school_coaches (domain)`,
  `CREATE TABLE IF NOT EXISTS school_domains (
    domain TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    school TEXT NOT NULL,
    at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS teams_coach ON teams (coach_id)`,
  `CREATE TABLE IF NOT EXISTS team_members (
    team_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    birth_year INTEGER NOT NULL,
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (team_id, account_id)
  )`,
  `CREATE INDEX IF NOT EXISTS team_members_account ON team_members (account_id)`,
  // My team (2026-11-25, teams.ts and teamChat.ts): a coach adds an athlete already linked to them to a team (they say
  // their age and agree before they're on it), and each team has a chat for its athletes and coach.
  `CREATE TABLE IF NOT EXISTS team_invites (
    team_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (team_id, account_id)
  )`,
  `CREATE INDEX IF NOT EXISTS team_invites_account ON team_invites (account_id)`,
  // Athletes who left a team or were taken off it, so its coach can add them back (2026-11-25). Gone when they rejoin.
  `CREATE TABLE IF NOT EXISTS team_left (
    team_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    left_at INTEGER NOT NULL,
    PRIMARY KEY (team_id, account_id)
  )`,
  `CREATE INDEX IF NOT EXISTS team_left_account ON team_left (account_id)`,
  `CREATE TABLE IF NOT EXISTS team_messages (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    body TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS team_messages_team ON team_messages (team_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS team_messages_account ON team_messages (account_id)`,
  `CREATE TABLE IF NOT EXISTS team_chat_reads (
    team_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    read_at INTEGER NOT NULL DEFAULT 0,
    pushed_at INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (team_id, account_id)
  )`,
  `CREATE INDEX IF NOT EXISTS team_chat_reads_account ON team_chat_reads (account_id)`,
  // Team sessions (2026-11-19, teamSessions.ts): one workout a coach runs for a whole team from one tablet, and the
  // sets each athlete logs there. Written into the athletes' own accounts when it ends (`written`).
  `CREATE TABLE IF NOT EXISTS team_sessions (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    coach_id TEXT NOT NULL,
    name TEXT NOT NULL,
    plan TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    written INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS team_sessions_team ON team_sessions (team_id, started_at)`,
  `CREATE INDEX IF NOT EXISTS team_sessions_coach ON team_sessions (coach_id, ended_at, started_at)`,
  `CREATE TABLE IF NOT EXISTS team_session_sets (
    session_id TEXT NOT NULL,
    id TEXT NOT NULL,
    athlete_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    weight REAL NOT NULL,
    reps INTEGER NOT NULL,
    target INTEGER NOT NULL,
    at INTEGER NOT NULL,
    PRIMARY KEY (session_id, id)
  )`,
  `CREATE INDEX IF NOT EXISTS team_session_sets_athlete ON team_session_sets (athlete_id)`,
  // Check-in forms and questionnaires (2026-11-13): a coach's forms, each one sent to a client (with the questions as
  // they were then), the client's answers, and at most one form per client that goes out again every week.
  `CREATE TABLE IF NOT EXISTS coach_forms (
    id TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL,
    title TEXT NOT NULL,
    questions TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS coach_forms_coach ON coach_forms (coach_id)`,
  `CREATE TABLE IF NOT EXISTS coach_checkins (
    id TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    form_id TEXT NOT NULL,
    title TEXT NOT NULL,
    questions TEXT NOT NULL,
    sent_at INTEGER NOT NULL,
    answers TEXT,
    answered_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS coach_checkins_pair ON coach_checkins (coach_id, client_id, sent_at)`,
  `CREATE INDEX IF NOT EXISTS coach_checkins_client ON coach_checkins (client_id, answered_at)`,
  `CREATE TABLE IF NOT EXISTS coach_checkin_repeats (
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    form_id TEXT NOT NULL,
    next_at INTEGER NOT NULL,
    PRIMARY KEY (coach_id, client_id)
  )`,
  // Photo answers to check-ins (2026-11-17), apart from the check-ins so listing them never reads a photo.
  `CREATE TABLE IF NOT EXISTS coach_checkin_photos (
    checkin_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    data TEXT NOT NULL,
    at INTEGER NOT NULL,
    PRIMARY KEY (checkin_id, question_id)
  )`,
  `CREATE INDEX IF NOT EXISTS coach_checkin_photos_pair ON coach_checkin_photos (coach_id, client_id)`,
  `CREATE INDEX IF NOT EXISTS coach_checkin_photos_client ON coach_checkin_photos (client_id)`,
  // Form video check-ins (formVideos.ts, 2026-11-19): the row and its pinned notes; the video itself is in Vercel Blob.
  `CREATE TABLE IF NOT EXISTS coach_videos (
    id TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    path TEXT NOT NULL,
    lift TEXT NOT NULL DEFAULT '',
    question TEXT NOT NULL DEFAULT '',
    bytes INTEGER NOT NULL DEFAULT 0,
    secs REAL NOT NULL DEFAULT 0,
    ready INTEGER NOT NULL DEFAULT 0,
    at INTEGER NOT NULL,
    coach_seen INTEGER NOT NULL DEFAULT 0,
    client_seen INTEGER NOT NULL DEFAULT 0
  )`,
  "CREATE INDEX IF NOT EXISTS coach_videos_pair ON coach_videos (coach_id, client_id, ready, at)",
  "CREATE INDEX IF NOT EXISTS coach_videos_client ON coach_videos (client_id, ready, at)",
  `CREATE TABLE IF NOT EXISTS coach_video_notes (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    ms INTEGER NOT NULL,
    text TEXT NOT NULL,
    at INTEGER NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS coach_video_notes_video ON coach_video_notes (video_id, ms)",
  // Booking (coachBooking.ts): a coach's open or booked session times, UTC ms.
  `CREATE TABLE IF NOT EXISTS coach_slots (
    id TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL,
    start_at INTEGER NOT NULL,
    minutes INTEGER NOT NULL,
    place TEXT NOT NULL DEFAULT '',
    client_id TEXT,
    booked_at INTEGER
  )`,
  "CREATE INDEX IF NOT EXISTS coach_slots_coach ON coach_slots (coach_id, start_at)",
  "CREATE INDEX IF NOT EXISTS coach_slots_client ON coach_slots (client_id, start_at)",
  // Client payments through Stripe Connect (coachPay.ts): each coach's Express account, the price each client pays,
  // their monthly plan and the payments Stripe told us about.
  `CREATE TABLE IF NOT EXISTS coach_stripe (
    coach_id TEXT PRIMARY KEY,
    stripe_id TEXT NOT NULL,
    ready INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'cad',
    updated_at INTEGER NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS coach_stripe_id ON coach_stripe (stripe_id)",
  `CREATE TABLE IF NOT EXISTS coach_prices (
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    kind TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (coach_id, client_id)
  )`,
  "CREATE INDEX IF NOT EXISTS coach_prices_client ON coach_prices (client_id)",
  `CREATE TABLE IF NOT EXISTS coach_subs (
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    sub_id TEXT NOT NULL,
    status TEXT NOT NULL,
    until INTEGER,
    ending INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (coach_id, client_id)
  )`,
  `CREATE TABLE IF NOT EXISTS coach_payments (
    id TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    kind TEXT NOT NULL,
    at INTEGER NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS coach_payments_pair ON coach_payments (coach_id, client_id, at)",
  // Ratings and reviews of coaches (coachReviews.ts, docs/decisions/coach-reviews.md, 2026-11-15): one per client and
  // coach, from adult clients after four weeks together or two paid or booked sessions, with one public reply from the
  // coach. `id` is a public handle that doesn't give away either account; `hidden` and `reply_hidden` are set by three
  // reports until staff decide.
  `CREATE TABLE IF NOT EXISTS coach_reviews (
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    id TEXT NOT NULL UNIQUE,
    stars INTEGER NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    reply TEXT NOT NULL DEFAULT '',
    reply_at INTEGER NOT NULL DEFAULT 0,
    hidden INTEGER NOT NULL DEFAULT 0,
    reply_hidden INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (coach_id, client_id)
  )`,
  "CREATE INDEX IF NOT EXISTS coach_reviews_client ON coach_reviews (client_id)",
  // Coaches sell programs (coachPrograms.ts, docs/decisions/coach-programs.md): a coach's program (its days are
  // routine codes) and who has each one (bought on the web, or got free). A refund removes the owner row.
  `CREATE TABLE IF NOT EXISTS coach_programs (
    id TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL,
    title TEXT NOT NULL,
    about TEXT NOT NULL,
    level TEXT NOT NULL,
    goal TEXT NOT NULL,
    weeks INTEGER NOT NULL,
    days TEXT NOT NULL,
    price REAL NOT NULL,
    currency TEXT NOT NULL,
    listed INTEGER NOT NULL DEFAULT 1,
    hidden INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS coach_programs_coach ON coach_programs (coach_id)",
  "CREATE INDEX IF NOT EXISTS coach_programs_listed ON coach_programs (listed, hidden, updated_at)",
  `CREATE TABLE IF NOT EXISTS program_owners (
    program_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    at INTEGER NOT NULL,
    payment_id TEXT,
    PRIMARY KEY (program_id, account_id)
  )`,
  "CREATE INDEX IF NOT EXISTS program_owners_account ON program_owners (account_id)",
  "CREATE INDEX IF NOT EXISTS program_owners_payment ON program_owners (payment_id)",
  // Season programs a coach assigns to clients or a school team (coachProgramAssign.ts): weekday-bound standing plans.
  `CREATE TABLE IF NOT EXISTS coach_program_assigns (
    id TEXT PRIMARY KEY,
    coach_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    program_id TEXT NOT NULL,
    team_id TEXT,
    title TEXT NOT NULL,
    weeks INTEGER NOT NULL,
    days TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    accepted_at INTEGER,
    started_at INTEGER,
    ended_at INTEGER
  )`,
  "CREATE INDEX IF NOT EXISTS coach_program_assigns_client ON coach_program_assigns (client_id, status, created_at)",
  "CREATE INDEX IF NOT EXISTS coach_program_assigns_coach ON coach_program_assigns (coach_id, program_id, status)",
  "CREATE INDEX IF NOT EXISTS coach_program_assigns_team ON coach_program_assigns (team_id, status, created_at)",
  "CREATE INDEX IF NOT EXISTS coach_program_assigns_pair ON coach_program_assigns (coach_id, client_id, status)",
  // A coach's calendar (coachSchedule.ts): one cell per coach, scope and civil date. scope is `all`, `team:<id>` or `client:<id>`.
  `CREATE TABLE IF NOT EXISTS coach_schedule_days (
    coach_id TEXT NOT NULL,
    scope TEXT NOT NULL,
    date TEXT NOT NULL,
    kind TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    code TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (coach_id, scope, date)
  )`,
  "CREATE INDEX IF NOT EXISTS coach_schedule_days_scope ON coach_schedule_days (scope, date)",
  `CREATE TABLE IF NOT EXISTS coach_calendar_access (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    scope TEXT NOT NULL,
    assistant_id TEXT,
    expires_at INTEGER NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS coach_calendar_access_owner ON coach_calendar_access (owner_id)",
  "CREATE INDEX IF NOT EXISTS coach_calendar_access_assistant ON coach_calendar_access (assistant_id)",
  // Ratings and reviews of programs (programReviews.ts, 2026-11-16): one per lifter and program, from adults who've had
  // it two weeks, with one public reply from its coach. Hidden and reply_hidden work as in coach_reviews.
  `CREATE TABLE IF NOT EXISTS program_reviews (
    program_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    id TEXT NOT NULL UNIQUE,
    stars INTEGER NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    reply TEXT NOT NULL DEFAULT '',
    reply_at INTEGER NOT NULL DEFAULT 0,
    hidden INTEGER NOT NULL DEFAULT 0,
    reply_hidden INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (program_id, account_id)
  )`,
  "CREATE INDEX IF NOT EXISTS program_reviews_account ON program_reviews (account_id)",
  // The public routine library (routineLibrary.ts, docs/decisions/routine-library.md, 2026-11-19): routines lifters
  // published, who saved each from the library (counted once) and their stars. Ratings are summed onto the routine.
  `CREATE TABLE IF NOT EXISTS library_routines (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    about TEXT NOT NULL DEFAULT '',
    goal TEXT NOT NULL,
    level TEXT NOT NULL,
    equipment TEXT NOT NULL DEFAULT '',
    minutes INTEGER NOT NULL,
    show_name INTEGER NOT NULL DEFAULT 1,
    author TEXT NOT NULL DEFAULT '',
    saves INTEGER NOT NULL DEFAULT 0,
    star_sum INTEGER NOT NULL DEFAULT 0,
    ratings INTEGER NOT NULL DEFAULT 0,
    hidden INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS library_routines_account ON library_routines (account_id, code)",
  "CREATE INDEX IF NOT EXISTS library_routines_list ON library_routines (hidden, saves)",
  `CREATE TABLE IF NOT EXISTS library_saves (
    routine_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    at INTEGER NOT NULL,
    PRIMARY KEY (routine_id, account_id)
  )`,
  "CREATE INDEX IF NOT EXISTS library_saves_account ON library_saves (account_id)",
  `CREATE TABLE IF NOT EXISTS library_ratings (
    routine_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    stars INTEGER NOT NULL,
    at INTEGER NOT NULL,
    PRIMARY KEY (routine_id, account_id)
  )`,
  "CREATE INDEX IF NOT EXISTS library_ratings_account ON library_ratings (account_id)",
  // Give a month, get a month (earnedPro.ts, docs/decisions/growth.md): who joined through whose invite, and the
  // Pro months it earned. One accept per friend ever; a month each once the friend has finished three workouts.
  `CREATE TABLE IF NOT EXISTS invite_accepts (
    friend_id TEXT PRIMARY KEY,
    inviter_id TEXT NOT NULL,
    at INTEGER NOT NULL,
    rewarded_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS invite_accepts_inviter ON invite_accepts (inviter_id)`,
  `CREATE TABLE IF NOT EXISTS earned_pro (
    account_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    at INTEGER NOT NULL,
    days INTEGER NOT NULL,
    PRIMARY KEY (account_id, friend_id)
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
  )`,
  // The Liftsmith community (community.ts, 2026-11-17): ideas and bugs about the app, their votes, comments, who gets
  // updates on each, the author's screenshot (only they and staff see it), status changes with the team's note (the
  // timeline and the changelog) and accounts staff blocked from posting. `votes` and `comments` are kept counts, so the
  // board sorts on an index. `hidden`: 1 after reports, 2 by staff. `teen`: written by someone under 18, so it never
  // carries their name and stays off the public website.
  `CREATE TABLE IF NOT EXISTS community_posts (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL DEFAULT '',
    handle TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'review',
    votes INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    status_at INTEGER NOT NULL DEFAULT 0,
    merged_into TEXT NOT NULL DEFAULT '',
    hidden INTEGER NOT NULL DEFAULT 0,
    teen INTEGER NOT NULL DEFAULT 0,
    platform TEXT NOT NULL DEFAULT '',
    app_version TEXT NOT NULL DEFAULT ''
  )`,
  "CREATE INDEX IF NOT EXISTS community_posts_board ON community_posts (hidden, votes DESC)",
  "CREATE INDEX IF NOT EXISTS community_posts_new ON community_posts (hidden, created_at DESC)",
  "CREATE INDEX IF NOT EXISTS community_posts_account ON community_posts (account_id)",
  "CREATE INDEX IF NOT EXISTS community_posts_merged ON community_posts (merged_into)",
  // Admin › Community lists every post newest first, hidden ones too.
  "CREATE INDEX IF NOT EXISTS community_posts_created ON community_posts (created_at DESC)",
  `CREATE TABLE IF NOT EXISTS community_votes (
    post_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    at INTEGER NOT NULL,
    PRIMARY KEY (post_id, account_id)
  )`,
  "CREATE INDEX IF NOT EXISTS community_votes_account ON community_votes (account_id)",
  `CREATE TABLE IF NOT EXISTS community_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    body TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    handle TEXT NOT NULL DEFAULT '',
    staff INTEGER NOT NULL DEFAULT 0,
    teen INTEGER NOT NULL DEFAULT 0,
    hidden INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS community_comments_post ON community_comments (post_id, created_at)",
  "CREATE INDEX IF NOT EXISTS community_comments_account ON community_comments (account_id)",
  `CREATE TABLE IF NOT EXISTS community_follows (
    post_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    on_ INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (post_id, account_id)
  )`,
  "CREATE INDEX IF NOT EXISTS community_follows_account ON community_follows (account_id)",
  `CREATE TABLE IF NOT EXISTS community_shots (
    post_id TEXT PRIMARY KEY,
    image BLOB NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS community_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    at INTEGER NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS community_updates_post ON community_updates (post_id, at)",
  "CREATE INDEX IF NOT EXISTS community_updates_status ON community_updates (status, at)",
  `CREATE TABLE IF NOT EXISTS community_bans (
    account_id TEXT PRIMARY KEY,
    at INTEGER NOT NULL
  )`,
];

/**
 * Columns added to a table after it first shipped: CREATE TABLE IF NOT EXISTS leaves an existing table alone,
 * so each one is added here if it's missing. Only ever append; a column is never renamed or dropped.
 */
const COLUMNS: [table: string, column: string, def: string][] = [
  // The country an account last synced from (Vercel's x-vercel-ip-country), for the strength standards' default:
  // counted unless the lifter says no, except in the EU, EEA, UK and Switzerland, where only a yes counts (standards.ts).
  ["accounts", "country", "TEXT"],
  // Codes of our own, not only creators' (Melvin, 2026-11-10): see src/server/creators.ts.
  ["creators", "kind", "TEXT NOT NULL DEFAULT 'creator'"],
  // A coach's carbs, fat and rest-day calories for a client (2026-11-15, docs/decisions/trainer-mode.md).
  ["coach_targets", "carbs", "INTEGER"],
  ["coach_targets", "fat", "INTEGER"],
  ["coach_targets", "kcal_rest", "INTEGER"],
  ["creators", "trial_days", "INTEGER"],
  ["creators", "offering", "TEXT"],
  ["creators", "ends_at", "INTEGER"],
  ["creators", "max_uses", "INTEGER"],
  // Friends stage 2: a public profile (social.ts, publicProfile.ts).
  ["social_profiles", "public", "INTEGER NOT NULL DEFAULT 0"],
  // Coaching: personal trainer or coach (Melvin, 2026-11-13: "differentiate between personal trainers and coaches").
  ["coach_prefs", "role", "TEXT"],
  // Whether pushes to this phone set the number on the app icon (Settings › Reminders, badge.ts; 2026-11-19).
  ["push_tokens", "badge", "INTEGER NOT NULL DEFAULT 1"],
  // Friends stage 2: which push notifications the lifter wants (push.ts). Likes start off.
  ["social_profiles", "push_follows", "INTEGER NOT NULL DEFAULT 1"],
  ["social_profiles", "push_comments", "INTEGER NOT NULL DEFAULT 1"],
  ["social_profiles", "push_sent", "INTEGER NOT NULL DEFAULT 1"],
  // Connected apps: the service's own id for the lifter, where removing access needs it (Polar AccessLink).
  ["connections", "remote_user", "TEXT"],
  // Connected apps: the PKCE code verifier for services that ask for one (Garmin Connect).
  ["connect_states", "verifier", "TEXT"],
  ["social_profiles", "push_likes", "INTEGER NOT NULL DEFAULT 0"],
  // Friends stage 3: avatar, who sees new posts, and the best lifts showcase (social.ts).
  ["social_profiles", "avatar", "TEXT NOT NULL DEFAULT ''"],
  ["social_profiles", "audience", "TEXT NOT NULL DEFAULT 'all'"],
  ["social_profiles", "show_lifts", "INTEGER NOT NULL DEFAULT 1"],
  ["social_profiles", "lifts", "TEXT NOT NULL DEFAULT '[]'"],
  // Friends stage 3: a caption and who sees each post.
  ["posts", "caption", "TEXT NOT NULL DEFAULT ''"],
  ["posts", "audience", "TEXT NOT NULL DEFAULT 'all'"],
  // Friends gap list 2: suggested to people the lifter may know (on to start), and the level and streak the app sends.
  ["social_profiles", "suggest", "INTEGER NOT NULL DEFAULT 1"],
  ["social_profiles", "level", "INTEGER NOT NULL DEFAULT 0"],
  ["social_profiles", "streak", "INTEGER NOT NULL DEFAULT 0"],
  // Friends gap list 2: a reply's top comment ('' for a comment on the post itself).
  ["post_comments", "reply_to", "TEXT NOT NULL DEFAULT ''"],
  // Friends gap list 2: training now and cheers pushes. Training now was off to start; new profiles turn it on
  // since 2026-11-13 (join sets it), and profiles made before keep what they had.
  ["social_profiles", "live", "INTEGER NOT NULL DEFAULT 0"],
  ["social_profiles", "push_cheers", "INTEGER NOT NULL DEFAULT 1"],
  // "Let friends cheer me on" (on to start; Melvin, 2026-11-12).
  ["social_profiles", "cheers", "INTEGER NOT NULL DEFAULT 1"],
  // The switch for workouts from people the lifter rang the bell for (Friends gap list 3).
  ["social_profiles", "push_posts", "INTEGER NOT NULL DEFAULT 1"],
  // The switch for friends' check-ins (Check in on Today, 2026-11-14; on to start).
  ["social_profiles", "push_checkins", "INTEGER NOT NULL DEFAULT 1"],
  // A tagline and a home gym (a gym_places id) on the profile (Melvin, 2026-11-14).
  ["social_profiles", "tagline", "TEXT NOT NULL DEFAULT ''"],
  ["social_profiles", "home_gym", "TEXT NOT NULL DEFAULT ''"],
  // Friends gap list 2: a club's weekly crew goal, set by its starter ('' and 0 for none).
  ["clubs", "goal_metric", "TEXT NOT NULL DEFAULT ''"],
  ["clubs", "goal_target", "INTEGER NOT NULL DEFAULT 0"],
  // A listed setup can say which real gym it is (gymPlaces.ts); the gym then offers that setup.
  ["public_gyms", "place_id", "TEXT NOT NULL DEFAULT ''"],
  // The claim code printed on a gym's poster or stand, as a hash (gymClaims.ts).
  ["gym_places", "claim_code", "TEXT NOT NULL DEFAULT ''"],
  ["gym_places", "qr_scans", "INTEGER NOT NULL DEFAULT 0"],
  // A gym a lifter added (gymPlaces.ts suggestPlace): who, and whether it still waits for staff.
  ["gym_places", "added_by", "TEXT NOT NULL DEFAULT ''"],
  // An official gym's own club (social.ts gymClubStart): the gym it belongs to, '' for a lifter's own club.
  ["clubs", "place_id", "TEXT NOT NULL DEFAULT ''"],
  // Club chat (clubChat.ts): when the member last opened it, last got a push about it, and their "Notify me" switch.
  ["club_members", "read_at", "INTEGER NOT NULL DEFAULT 0"],
  ["club_members", "pushed_at", "INTEGER NOT NULL DEFAULT 0"],
  ["club_members", "chat_push", "INTEGER NOT NULL DEFAULT 1"],
  ["gym_places", "pending", "INTEGER NOT NULL DEFAULT 0"],
  // Amenities (a comma list from gymExtras.ts AMENITIES) and prices (JSON), set by the owner (2026-11-13).
  ["gym_places", "amenities", "TEXT NOT NULL DEFAULT ''"],
  ["gym_places", "prices", "TEXT NOT NULL DEFAULT ''"],
  // The gym's starter program for new members (2026-11-13): a routine share code (routineShare.ts), '' for none.
  ["gym_places", "starter", "TEXT NOT NULL DEFAULT ''"],
  // More of what the map and the gym's own website say (2026-11-14, gymImport.ts and gymEnrich.ts): postcode, email,
  // Instagram and Facebook pages, wheelchair access (yes, limited, no or ''), and when the website was last read.
  ["gym_places", "postcode", "TEXT NOT NULL DEFAULT ''"],
  ["gym_places", "email", "TEXT NOT NULL DEFAULT ''"],
  ["gym_places", "instagram", "TEXT NOT NULL DEFAULT ''"],
  ["gym_places", "facebook", "TEXT NOT NULL DEFAULT ''"],
  ["gym_places", "wheelchair", "TEXT NOT NULL DEFAULT ''"],
  ["gym_places", "enriched_at", "INTEGER NOT NULL DEFAULT 0"],
  // A duplicate staff merged into another gym: hidden, and its page and app link go to that gym (gymPlaceReports.ts).
  ["gym_places", "merged_into", "TEXT NOT NULL DEFAULT ''"],
  // Each map server request of an import and how it went, so the next import tries the healthiest server first.
  ["gym_imports", "attempts", "TEXT NOT NULL DEFAULT ''"],
  // The one-button worldwide import (gymImportJobs.ts, 2026-11-16): when Claude last read the gym's site (gymAutoFill.ts),
  // and the job's kind (world or daily), step (map, web, ai, tidy) and what each step did.
  ["gym_places", "ai_at", "INTEGER NOT NULL DEFAULT 0"],
  ["gym_places", "ai_fix_at", "INTEGER NOT NULL DEFAULT 0"],
  // The chain a gym belongs to (gymChains.ts, 2026-11-19): a gym_chains slug, '' for none.
  ["gym_places", "chain", "TEXT NOT NULL DEFAULT ''"],
  // The fix-up's strict rules (2026-11-19, second version): the rules a job ran under (1 = the first run, whose
  // corrections are undone), whether that's done, how many suggestions it left, and each change's state (applied,
  // suggested for staff to Apply, dismissed).
  ["gym_ai_fix_jobs", "rules", "INTEGER NOT NULL DEFAULT 1"],
  ["gym_ai_fix_jobs", "reverted", "INTEGER NOT NULL DEFAULT 0"],
  ["gym_ai_fix_jobs", "suggested", "INTEGER NOT NULL DEFAULT 0"],
  ["gym_ai_fixes", "state", "TEXT NOT NULL DEFAULT 'applied'"],
  ["gym_import_jobs", "kind", "TEXT NOT NULL DEFAULT ''"],
  ["gym_import_jobs", "phase", "TEXT NOT NULL DEFAULT 'map'"],
  ["gym_import_jobs", "web_read", "INTEGER NOT NULL DEFAULT 0"],
  ["gym_import_jobs", "web_filled", "INTEGER NOT NULL DEFAULT 0"],
  ["gym_import_jobs", "ai_read", "INTEGER NOT NULL DEFAULT 0"],
  ["gym_import_jobs", "ai_filled", "INTEGER NOT NULL DEFAULT 0"],
  ["gym_import_jobs", "tidy_after", "TEXT NOT NULL DEFAULT ''"],
  ["gym_import_jobs", "tidy_fixed", "INTEGER NOT NULL DEFAULT 0"],
  ["gym_import_jobs", "note", "TEXT NOT NULL DEFAULT ''"],
  // The chains step (gymChains.ts chainStep): the last gym id it read, and how many gyms it put in a chain by name.
  ["gym_import_jobs", "chain_after", "TEXT NOT NULL DEFAULT ''"],
  ["gym_import_jobs", "chain_fixed", "INTEGER NOT NULL DEFAULT 0"],
  // Coach plans (src/lib/coachPlans.ts): which tier a store or web subscription is ('pro', 'coach' or 'coachPlus').
  ["entitlements", "tier", "TEXT"],
  ["stripe_subscriptions", "tier", "TEXT"],
  // Physio support (2026-11-13, docs/decisions/trainer-mode.md): a client shares pain and injuries with one coach;
  // a coach works as a trainer or a physio; a routine can say how many times a week it's meant to be done.
  ["coach_shares", "pain", "INTEGER NOT NULL DEFAULT 0"],
  // Repeating check-ins every one, two or four weeks (2026-11-17).
  ["coach_checkin_repeats", "every_days", "INTEGER NOT NULL DEFAULT 7"],
  ["coach_prefs", "kind", "TEXT NOT NULL DEFAULT 'trainer'"],
  ["coach_plans", "per_week", "INTEGER"],
  // Sharing item by item (2026-11-13, docs/decisions/trainer-mode.md "What a client shares"): heart rate, workout
  // notes, readiness and recovery, and cycle, each off until the client turns it on for that coach.
  ["coach_shares", "hr", "INTEGER NOT NULL DEFAULT 0"],
  ["coach_shares", "notes", "INTEGER NOT NULL DEFAULT 0"],
  ["coach_shares", "health", "INTEGER NOT NULL DEFAULT 0"],
  ["coach_shares", "cycle", "INTEGER NOT NULL DEFAULT 0"],
  // Coach chat stickers (2026-11-15, src/lib/stickers.ts): a message may be one sticker, by id, with empty text.
  ["coach_messages", "sticker", "TEXT"],
  // Moderation (2026-11-14, docs/decisions/moderation.md). `suspended` is 0 (fine), 1 (suspended or banned) or 2
  // (shadow banned); a suspension ends at `suspended_until` (0 for a ban). `boards_off` keeps the lifter off other
  // people's leaderboards. `notice` is what the lifter is told ('', 'warn', 'suspend' or 'ban') and why.
  ["social_profiles", "suspended_until", "INTEGER NOT NULL DEFAULT 0"],
  ["social_profiles", "boards_off", "INTEGER NOT NULL DEFAULT 0"],
  ["social_profiles", "notice", "TEXT NOT NULL DEFAULT ''"],
  ["social_profiles", "notice_reason", "TEXT NOT NULL DEFAULT ''"],
  ["social_profiles", "notice_at", "INTEGER NOT NULL DEFAULT 0"],
  // How big a gym website's icon is (the smaller side, in pixels; 2026-11-19, docs/decisions/gyms.md "Sharper icons"):
  // 0 for an icon kept before it was measured, so gymEnrich.ts measureIcons measures it once from its first bytes.
  ["gym_photos", "px", "INTEGER NOT NULL DEFAULT 0"],
  // Where the picture's file lives in Vercel Blob (gymBlob.ts, 2026-11-19); '' while its bytes are still in `image`.
  // Once it's set, `image` is left empty.
  ["gym_photos", "url", "TEXT NOT NULL DEFAULT ''"],
  // A coach program's phases (Build, Deload, Peak, each its own week for a few weeks; programPhases.ts, 2026-11-26), as
  // JSON, and the snapshot an assign takes of them. '' when the program is one week repeated.
  ["coach_programs", "phases", "TEXT NOT NULL DEFAULT ''"],
  ["coach_program_assigns", "phases", "TEXT NOT NULL DEFAULT ''"],
];

/**
 * Indexes on columns that COLUMNS adds, so they're made after the columns exist (on a fresh database SCHEMA's tables
 * don't have them yet). Find gyms near you looks up each nearby gym's setup and club by place (2026-11-13): without
 * these, every one of up to a thousand gyms scanned both tables.
 */
const LATE_SCHEMA = [
  `CREATE INDEX IF NOT EXISTS public_gyms_for ON public_gyms (place_id)`,
  `CREATE INDEX IF NOT EXISTS clubs_place ON clubs (place_id)`,
  // Garmin's pings name the lifter by Garmin's own user id (connect.ts garminPing).
  `CREATE INDEX IF NOT EXISTS connections_remote ON connections (provider, remote_user)`,
  // Found by EXPLAIN QUERY PLAN over every query (2026-11-16, docs/decisions/database-reads.md); each was a full scan.
  // Admin Stats: five per-install lookups by event name, and each install's trial start.
  `CREATE INDEX IF NOT EXISTS events_install_name ON events (install_id, name, at)`,
  `CREATE INDEX IF NOT EXISTS subscription_events_install ON subscription_events (install_id)`,
  // Friends' "training now" starts from the sessions updated in the last few minutes, not every profile.
  `CREATE INDEX IF NOT EXISTS live_sessions_updated ON live_sessions (updated_at)`,
  // A gym owner's or staff member's gyms; only claimed gyms are in it, so it stays small.
  `CREATE INDEX IF NOT EXISTS gym_places_claimed ON gym_places (claimed_by) WHERE claimed_by <> ''`,
  // The import job's website and AI steps walk the gyms due a read through these (gymEnrich.ts, gymAutoFill.ts), and
  // a new map gym is checked against the claimed and lifter-added ones (savePlaces), never the whole table (2026-11-16).
  `CREATE INDEX IF NOT EXISTS gym_places_web ON gym_places (enriched_at) WHERE claimed_by = '' AND hidden = 0 AND website <> ''`,
  // Website icons kept before they were measured (gymEnrich.ts measureIcons); empty once they all are.
  `CREATE INDEX IF NOT EXISTS gym_photos_unmeasured ON gym_photos (place_id) WHERE kind = 'icon' AND px = 0`,
  // Pictures whose bytes are still in the database (gymBlob.ts movePictures); empty once they've all moved to Blob.
  `CREATE INDEX IF NOT EXISTS gym_photos_unmoved ON gym_photos (place_id) WHERE url = ''`,
  `CREATE INDEX IF NOT EXISTS gym_places_ai ON gym_places (ai_at) WHERE claimed_by = '' AND hidden = 0 AND website <> '' AND enriched_at > 0`,
  // The AI fix-up pass takes each unclaimed gym with a website once, ever (gymAiFix.ts).
  `CREATE INDEX IF NOT EXISTS gym_places_ai_fix ON gym_places (ai_fix_at) WHERE claimed_by = '' AND hidden = 0 AND pending = 0 AND website <> ''`,
  `CREATE INDEX IF NOT EXISTS gym_places_own ON gym_places (source) WHERE source <> 'osm'`,
  // A chain's branches (gymChains.ts): its page, its counts and its logo read only the gyms in a chain.
  `CREATE INDEX IF NOT EXISTS gym_places_chain ON gym_places (chain) WHERE chain <> ''`,
  // Friends activity (replies to your comments) and erasing an account's comments.
  `CREATE INDEX IF NOT EXISTS post_comments_account ON post_comments (account_id)`,
  `CREATE INDEX IF NOT EXISTS post_comments_reply ON post_comments (reply_to) WHERE reply_to <> ''`,
  // A client's coaches who see their body data or pain ratings (coach overview, sync's pain alerts).
  `CREATE INDEX IF NOT EXISTS coach_shares_client ON coach_shares (client_id)`,
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
  ready ??= migrate(c).catch((e: unknown) => {
    // Try again on the next request rather than failing every request until the server restarts.
    ready = null;
    throw e;
  });
  await ready;
  return c;
}

/** The table or index a schema statement makes. */
const schemaName = (sql: string) => /^\s*CREATE\b[^(]*?IF NOT EXISTS\s+(\w+)/i.exec(sql)?.[1] ?? "";

/**
 * Brings the database up to SCHEMA and COLUMNS on a server's first query. Every statement is a network hop to Turso
 * in production, and running all ~150 one by one made each cold start take about four seconds (Friends felt slow,
 * 2026-11-12). Now one read says what's already there, and only what's missing is made, in one batch: one hop on a
 * database that's up to date, two while SCHEMA carries a one-off data fix.
 */
async function migrate(c: Client): Promise<void> {
  let have: Awaited<ReturnType<typeof present>>;
  try {
    have = await present(c);
  } catch {
    // A database that can't list its own columns this way: the slow path, one statement at a time.
    for (const s of SCHEMA) await c.execute(s);
    for (const [table, column, def] of COLUMNS) {
      const cols = await c.execute(`PRAGMA table_info(${table})`);
      if (!cols.rows.some((r) => r.name === column)) await c.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
    }
    for (const s of LATE_SCHEMA) await c.execute(s);
    return;
  }
  // Tables and indexes that aren't there yet, in their order in SCHEMA. SCHEMA holds only CREATE statements: a data fix
  // there would run on every cold start, and Turso bills every row it reads (a province fix-up that scanned the whole
  // gym table 13 times per start used most of the month's reads, 2026-11-16). Run a data fix once by hand instead.
  const todo = SCHEMA.filter((sql) => !have.names.has(schemaName(sql)));
  if (todo.length) await c.batch(todo, "write");
  // A table made just now may still lack columns added to COLUMNS since it was first written.
  if (todo.some((sql) => schemaName(sql))) have = await present(c);
  const alters = COLUMNS.filter(([table, column]) => !have.columns.has(`${table}.${column}`)).map(
    ([table, column, def]) => `ALTER TABLE ${table} ADD COLUMN ${column} ${def}`,
  );
  const late = LATE_SCHEMA.filter((sql) => !have.names.has(schemaName(sql)));
  if (alters.length || late.length) await c.batch([...alters, ...late], "write");
}

/** Every table and index in the database, and each table's columns as `table.column`, in one read. */
async function present(c: Client): Promise<{ names: Set<string>; columns: Set<string> }> {
  const r = await c.execute(
    `SELECT m.name AS name, p.name AS col FROM sqlite_master m LEFT JOIN pragma_table_info(m.name) p
     WHERE m.type IN ('table', 'index')`,
  );
  const names = new Set<string>();
  const columns = new Set<string>();
  for (const row of r.rows) {
    names.add(String(row.name));
    if (row.col != null) columns.add(`${String(row.name)}.${String(row.col)}`);
  }
  return { names, columns };
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
