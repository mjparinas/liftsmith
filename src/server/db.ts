// The server's one database (as in Gradelings): SQLite-compatible libSQL. A local file in development,
// a hosted Turso database in production (DATABASE_URL + DATABASE_AUTH_TOKEN, or the TURSO_DATABASE_URL +
// TURSO_AUTH_TOKEN pair the Vercel Marketplace integration creates), and memory in tests.
import { createClient, type Client, type InValue } from "@libsql/client";

import { regionSlug, SHORT_REGION } from "@/lib/regions";

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
  // Gyms imported with the province's full name ("Langley, British Columbia", 2026-11-12) get its code and the shorter
  // web address ("langley-bc"). OR IGNORE leaves a gym whose new address is taken where it is.
  ...Object.entries(SHORT_REGION).map(
    ([name, code]) =>
      `UPDATE OR IGNORE gym_places SET region = '${code}', city_slug = substr(city_slug, 1, length(city_slug) - ${regionSlug(name).length}) || '${code.toLowerCase()}' WHERE region = '${name}' AND city_slug LIKE '%-${regionSlug(name)}'`,
  ),
  // Lifters who added a real gym, counted once each (account, else a one-way code from the address).
  `CREATE TABLE IF NOT EXISTS gym_place_lifters (
    place_id TEXT NOT NULL,
    who TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (place_id, who)
  )`,
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
  // Friends stage 2: a public profile (social.ts, publicProfile.ts).
  ["social_profiles", "public", "INTEGER NOT NULL DEFAULT 0"],
  // Friends stage 2: which push notifications the lifter wants (push.ts). Likes start off.
  ["social_profiles", "push_follows", "INTEGER NOT NULL DEFAULT 1"],
  ["social_profiles", "push_comments", "INTEGER NOT NULL DEFAULT 1"],
  ["social_profiles", "push_sent", "INTEGER NOT NULL DEFAULT 1"],
  // Connected apps: the service's own id for the lifter, where removing access needs it (Polar AccessLink).
  ["connections", "remote_user", "TEXT"],
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
  // Friends gap list 2: training now (off to start) and cheers pushes (on to start).
  ["social_profiles", "live", "INTEGER NOT NULL DEFAULT 0"],
  ["social_profiles", "push_cheers", "INTEGER NOT NULL DEFAULT 1"],
  // "Let friends cheer me on" (on to start; Melvin, 2026-11-12).
  ["social_profiles", "cheers", "INTEGER NOT NULL DEFAULT 1"],
  // The switch for workouts from people the lifter rang the bell for (Friends gap list 3).
  ["social_profiles", "push_posts", "INTEGER NOT NULL DEFAULT 1"],
  // Friends gap list 2: a club's weekly crew goal, set by its starter ('' and 0 for none).
  ["clubs", "goal_metric", "TEXT NOT NULL DEFAULT ''"],
  ["clubs", "goal_target", "INTEGER NOT NULL DEFAULT 0"],
  // A listed setup can say which real gym it is (gymPlaces.ts); the gym then offers that setup.
  ["public_gyms", "place_id", "TEXT NOT NULL DEFAULT ''"],
  // The claim code printed on a gym's poster or stand, as a hash (gymClaims.ts).
  ["gym_places", "claim_code", "TEXT NOT NULL DEFAULT ''"],
  ["gym_places", "qr_scans", "INTEGER NOT NULL DEFAULT 0"],
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
    return;
  }
  // Tables and indexes that aren't there yet, plus the one-off data fixes (UPDATE … statements, which make nothing
  // and run on every start because they change nothing once done), in their order in SCHEMA.
  const todo = SCHEMA.filter((sql) => !schemaName(sql) || !have.names.has(schemaName(sql)));
  if (todo.length) await c.batch(todo, "write");
  // A table made just now may still lack columns added to COLUMNS since it was first written.
  if (todo.some((sql) => schemaName(sql))) have = await present(c);
  const alters = COLUMNS.filter(([table, column]) => !have.columns.has(`${table}.${column}`)).map(
    ([table, column, def]) => `ALTER TABLE ${table} ADD COLUMN ${column} ${def}`,
  );
  if (alters.length) await c.batch(alters, "write");
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
