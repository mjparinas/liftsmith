# Speed

Melvin, 2026-11-13: "i'd like the app to be / feel as snappy and quick as possible."

## How it was measured

The static build (`npm run build:static`) served locally and driven by Playwright's Chromium on a 412 px phone,
with the CPU slowed 4× (about a mid-range Android phone). Two years of history were written straight into
IndexedDB first: four workouts a week, 20 sets each, plus a weigh-in, about 9,600 events. An empty account hides
every problem below, because the app's numbers are worked out from the whole event log every time.

| | Before | After |
| --- | --- | --- |
| Open the app to Today (two years of workouts) | 5.2 s | about 1.2 s |
| Open the app to Today (new account) | 0.5 s | 0.5 s |
| Progress tab | 2.9 s | 0.3 s |
| Back to Today | 2.8 s | 0.3 s |
| Log set, tap to paint | 260 ms | 160 ms (85 ms on a new account) |

## Rules

- **Engine code that reads the whole history must stay linear in it.** Anything that loops over weeks, days or
  sets and scans or sorts the whole event log inside the loop gets slow for exactly the lifters who use the app
  most. Sort once and slice by time (`setsOf` and `firstFrom` in `game.ts`).
- **Cache by the event list itself.** The store replaces `events` on every change and never edits it in place, so a
  `WeakMap` keyed on the array is a safe cache (`SORTED_SETS` and `PROGRESS` in `game.ts`). Never mutate the store's
  array.
- **One game result for the whole app.** `useGame()` (`Achievements.tsx`) shares one `game()` result between every
  caller (Today alone had four, plus the home screen widget and the earned-theme check in `App.tsx`, which now reads
  `useGame().achievements` through `unlockFrom` instead of counting achievements again). Its inputs are deferred
  (`useDeferredValue`), so a Log set paints before the game catches up.
- **The lock-screen look-ahead** (`aheadSteps`, `sessionAhead.ts`) works on this workout's sets plus other workouts'
  cardio distances only, because that's all `afterLog` and `sessionFields` read; a test checks the steps are the
  same with and without a long history.
- To check a change that touches history-wide code, seed a long history and time it, not only an empty account.

## One language at a time (2026-11-13)

Melvin picked it from the list. The six catalogues used to be one 3.5 MB script in the app's first load. Now:

- `scripts/locales.mjs` (`npm run locales`, run before `build` and `build:static`) writes one JSON file per language
  to `src/locales/gen/` (not committed) from the same catalogues. The source stays as it is, every language side by
  side in `src/locales/text/<prefix>.ts`.
- The app reads each language through `src/locales/load/<lang>.ts`, which re-exports the source; the production builds
  swap those for the JSON files (`turbopack.resolveAlias` in `next.config.ts`). Dev and tests read the source.
- `i18n.ts` keeps English loaded (the fallback) and loads another language the first time it's needed
  (`loadLanguage`). The first screen waits for it behind the loading screen (`languagePending`, `App.tsx`), so a
  French phone never flashes English; switching in Settings changes the words when the file arrives (a few
  milliseconds, it's on the device). Tests load every language at the start (`src/test/setup.ts`).
- Code that needs the English text whatever the language uses `english(key)` from `i18n.ts`; importing
  `@/locales/en` (or any catalogue) at run time in app code would bring every language back.

The app's first load went from 5.7 MB of script to about 2.7 MB.

## Battery saver for 3D figures (2026-11-13)

Melvin asked for "a slow phone mode" with a better name. **Settings › Look and feel › Battery saver for 3D figures**
(`profile.liteDemos`, `src/lib/liteDemos.ts`, off by default) draws the exercise demos and the recovery map at one
device pixel per CSS pixel (instead of up to two) and half the frame rate (15 instead of 30, 30 instead of 60 where
the figure can be turned). Shared web code, so Android, iOS and the web app get it together.

**The demo on the workout screen stands still during rest**, whatever the setting: it only moves while there's a set
to do. The heart still beats with a live heart rate.

## Maintenance check only where it matters (2026-11-13)

The maintenance proxy (`src/proxy.api.ts`) runs only on API routes and the server-drawn pages, not on every page,
because each page visit paid for a function call (about 70 ms, plus cold starts). Static pages stay up during
maintenance; they never read the database. Melvin chose this.

## Found and not done yet (ranked)

1. **All app screens are in one bundle** (about 1.1 MB). Loading rarely used screens (trainer, gyms, imports, tools)
   on demand would help the web app's first visit; inside the phone apps the files are local, so the gain is small.
2. **Vercel's per-route timings need Observability Plus**, which is off for the team, so slow API routes can't be
   ranked from production data. The app is offline first, so API speed only shows on Friends (already cached,
   [Friends](friends.md) "Loading fast") and sign-in.
