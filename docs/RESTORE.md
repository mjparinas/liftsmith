# Practising a database restore

The server database is Turso (libSQL). Turso keeps point-in-time backups on its own; we don't copy the database anywhere else. A backup only counts if a restore works, so practise one about once a month. The admin System tab's **Backups** card turns amber when the last practice is over 35 days old.

A practice restores into a **new, separate database**. It never touches production, so it's safe to do at any time.

## Steps (about 10 minutes)

1. Install and sign in to the Turso CLI (`brew install tursodatabase/tap/turso` or `curl -sSfL https://get.tur.so/install.sh | bash`, then `turso auth login`).
2. Find the production database's name: `turso db list` (it's the one named in Vercel's `TURSO_DATABASE_URL`).
3. Restore it as it was an hour ago into a new database:

   ```bash
   turso db create liftsmith-restore-drill --from-db <production-name> --timestamp "$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)"
   ```

   On macOS use `date -u -v-1H +%Y-%m-%dT%H:%M:%SZ`. How far back you can go depends on the Turso plan. If the command has changed, Turso's docs on point-in-time recovery have the current form.
4. Check the copy has the data:

   ```bash
   turso db shell liftsmith-restore-drill "SELECT COUNT(*) FROM installs; SELECT COUNT(*) FROM accounts; SELECT COUNT(*) FROM sync_events; SELECT MAX(at) FROM events;"
   ```

   The counts should be close to the System tab's Database card, and the latest event should be about an hour old.
5. Delete the copy: `turso db destroy liftsmith-restore-drill`.
6. In the admin panel's System tab, under **Record a restore practice**, pick the day and press **Record restore practice** (admins only; it's recorded in the Log tab).

## A real restore

If production data is lost or damaged:

1. Turn on **maintenance mode** (System tab, type TURN ON) so nothing new is written while you work. The home page, the admin panel and the web app stay up; the apps keep everything on the device and sync again later.
2. Restore to a new database from just before the damage, as in step 3, and check it as in step 4.
3. Make a token for it (`turso db tokens create <new-name>`) and point Vercel's `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` at it (Production and Preview), then redeploy.
4. Check the System tab is green, then turn maintenance mode off. Keep the damaged database until you're sure, then destroy it.

Devices hold their own full copy of every workout (offline-first), so after a restore their next sync sends back anything the restored database is missing.
