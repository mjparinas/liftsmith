# Database reads: keeping Turso's rows-read bill down

Turso bills every row a query reads, including every row a full table scan or a `COUNT(*)` walks past. On 2026-11-16 Turso warned that the organization had used 75% of its monthly rows-read quota. Melvin asked for an investigation, then approved these fixes (thread "Reduce Turso row reads").

## What was reading

1. **A data fix that ran on every cold start.** `SCHEMA` in `db.ts` held 13 `UPDATE OR IGNORE gym_places … WHERE region = '<province>'` statements, an old one-off fix for gyms imported with "British Columbia" instead of "BC". `gym_places` has no index on `region`, so each statement read the whole gym table, 13 times on every server start. Cold starts happen all the time (the five-minute gym import schedule, UptimeRobot, every API route), so this was the main cost. Imports already write the short code (`SHORT_REGION` in `gymImport.ts` and `gymPlaces.ts`), so the fix is gone.
2. **The /gyms/ city list and the gyms sitemap** (`cities()`, `sitemapGyms()`) read every gym row, on every edge cache miss (every 2 minutes for /gyms/).
3. **The sync quota check** counted every event an account had on every push, so a lifter with 10,000 events cost 10,000 reads per logged set.
4. **The admin panel's numbers** (`adminMetrics`) filtered `events` by time, and `events` had no index on `at` alone, so each range was a full scan.
5. **Admin › Gyms import** polled every 4 seconds while a job ran, even with the tab hidden.

## Rules

- **`SCHEMA` holds only `CREATE` statements.** A data fix there would run on every cold start. Run a one-off fix once (an admin button, a script, or a guarded migration that checks a marker first). `dbMigrate.test.ts` fails when `SCHEMA` holds an `UPDATE`, `DELETE` or `INSERT`, and checks that an up-to-date database takes one read on a cold start.
- **A public page that reads a whole table keeps its answer.** The /gyms/ index and the gyms sitemap use `keptCities()` and `keptSitemapGyms()` (`gymPlaces.ts`, each server keeps them for `LIST_KEEP_MS`, 15 minutes), and /gyms/ is kept at the edge for an hour (`s-maxage=3600, stale-while-revalidate=86400`). A newly imported city can take up to an hour to show there. Admin and tests call `cities()` fresh.
- **Sync keeps a count** (`sync_usage`: events and bytes per account). Each push adds to it, and it's counted afresh once a day (`USAGE_RECOUNT_MS`) or when the account is within 90% of its quota, so the limit stays exact. The kept count only runs high (an event the account already had still adds), so it never lets a push past the quota.
- **Admin numbers are kept for two minutes** per period (`METRICS_KEEP_MS` in `adminData.ts`), and `events` has an `events_at` index for the date ranges.
- **Admin polling stops while its tab is hidden** and reads again when the tab comes back (`isVisible` and `onVisibility`), like the maintenance check. The maintenance check stays every 30 seconds (Melvin's choice); it reads one row.
- **Every new query on a table that grows uses an index** (Melvin, 2026-11-16: "ensure that agents.md is updated to account for missing index or such for new features"). Growing tables are the ones that gain rows as people use the app: `events`, `sync_events`, `posts`, `post_comments`, `post_likes`, `follows`, `social_profiles`, `live_sessions`, `gym_places`, `coach_*`, `email_log` and the like. Check the query with `EXPLAIN QUERY PLAN` on the real schema: it must say `SEARCH … USING INDEX`, never `SCAN <table>`, except in one-off admin work and the daily job. Add the index in the same change (in `SCHEMA`, or in `LATE_SCHEMA` when it covers a column added through `COLUMNS`), and add the query's shape to `dbIndexes.test.ts`, which fails when a plan scans. A partial index (`WHERE claimed_by <> ''`) is only used when the query repeats its condition, so write the condition into the query too.

## The index audit (2026-11-16)

Melvin asked for every database call to be checked. All of about 1,500 statements went through `EXPLAIN QUERY PLAN`; these scanned a growing table and got an index (all in `LATE_SCHEMA`, each checked in `dbIndexes.test.ts`):

1. **Admin stats** looked up each install's events by name five times and its trial start: `events (install_id, name, at)` and `subscription_events (install_id)`.
2. **Friends' "training now"** read every profile: it now starts from `live_sessions (updated_at)`, the sessions updated in the last few minutes.
3. **A gym owner's or staff member's gyms** scanned every gym: a partial `gym_places (claimed_by) WHERE claimed_by <> ''`, so only claimed gyms are in it, and the queries say `claimed_by <> '' AND claimed_by = ?`.
4. **Friends activity** (replies to your comments) and erasing an account's comments: `post_comments (account_id)` and a partial `post_comments (reply_to) WHERE reply_to <> ''`.
5. **A client's coaches who see their body data or pain ratings**: `coach_shares (client_id)`.
6. **The friends leaderboard** (`board()`) walked every profile and checked whether each was followed; it now starts from the lifter and the people they follow.

## Left as is

- Per-account reads of `sync_events` for coaching, standards and earned Pro read one account's history, not the whole table.
- The System tab's totals (`COUNT(*)` of events, synced events and page views) are already kept for a minute and run on demand and once a day.
