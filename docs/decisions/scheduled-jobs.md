# Scheduled jobs: Vercel Schedules

Melvin asked on 2026-11-15 to move the jobs from Vercel's legacy Cron Jobs (deprecated) to **Vercel Schedules**, following Vercel's migration guide (https://vercel.com/docs/schedules/migrate-from-cron-jobs).

## What runs

Static path schedules in `vercel.json` (`schedules`), each a `GET` to a route under `src/app/api/cron/`, in UTC (no `timezone`), the same times the crons had:

| Schedule | Path | When (UTC) | What |
|---|---|---|---|
| `reminders` | `/api/cron/reminders/` | 00:05 daily | Plans the next day's reminder and lifecycle emails with Resend ([Reminders](reminders-and-lifecycle-messages.md)) |
| `admin` | `/api/cron/admin/` | 13:00 daily | System checks and alerts, database size, IndexNow, quiet-client alerts, expired suspensions |
| `digest-pdt` | `/api/cron/digest/` | 15:00 daily | The admins' morning digest (8 AM Pacific in daylight time) |
| `digest-pst` | `/api/cron/digest/` | 16:00 daily | The same, 8 AM Pacific in standard time; the digest goes out once per Pacific day |
| `gym-refresh` | `/api/cron/gym-refresh/` | 10:00 daily | Starts the daily gym refresh: new gyms anywhere since the last run, then their websites and AI ([Gyms](gyms.md)) |
| `gym-imports` | `/api/cron/gym-imports/` | every 5 minutes | Safety net for the gym import worker, which also hands over to itself ([Gyms](gyms.md)) |

## Rules

- **Auth is unchanged.** Vercel sends `Authorization: Bearer $CRON_SECRET` to path schedules, read from the deployment when it becomes current, so a new `CRON_SECRET` only takes effect after a redeploy. The routes keep their constant-time check (`authorized` in `revenuecat.ts`).
- **Never in both.** A job listed in `crons` and in `schedules` runs twice per occurrence. `crons` is gone from `vercel.json`; don't bring it back.
- **Every scheduled route is safe to run twice.** Path schedules aren't retried when a route fails, Vercel says it "can't rule out a duplicate delivery", runs can overlap, and a run that fires during a deploy can go to the old deployment. So: reminders send with Resend idempotency keys; the digest claims the Pacific day in one statement before sending (`claimSetting` in `settings.ts`) and hands it back if nothing went out; the gym worker holds a lease on its job; the admin job's alerts go out at most once every 6 hours per kind. A new job needs the same.
- **Production only.** Production schedules start Active; Preview branches' start Inactive (and preview deployments are off anyway).
- Runs start within a 1-minute jitter window (Pro's default), not on the second.
- Each run is still recorded by `trackJob` (`job_runs`), so Admin › System and To Do see a late or failed job. Vercel's own execution history is on the project's **Schedules** page.
- To run one now: Vercel dashboard › Schedules, or `vercel schedules invoke <name>`.
