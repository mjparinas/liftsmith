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

## Found and not done yet (ranked)

1. **Every language ships in the app's first load.** All six catalogues are one 3.5 MB script (960 KB gzipped) of
   the app's 5.7 MB. Loading only the active language (English stays as the fallback) would cut about half the
   JavaScript a phone has to load at start. Needs the first render to wait for the language, so it's its own change.
2. **The exercise demo animates all the time on the workout screen**, including rest: about a quarter of the main
   thread on a slowed phone. Pausing it during rest, or after a few loops, would save battery and keep taps quick.
3. **The website's proxy runs on every page.** `src/proxy.api.ts` (maintenance mode) makes every public page go
   through a function, which adds about 70 ms to each page and a cold start now and then. Limiting it to `/api/`
   would leave pages up during maintenance, so it's Melvin's call.
4. **All app screens are in one bundle** (about 1.1 MB). Loading rarely used screens (admin-like tools, trainer,
   gyms, imports) on demand would help the web app's first visit; inside the phone apps the files are local, so the
   gain there is small.
5. **Vercel's per-route timings need Observability Plus**, which is off for the team, so slow API routes can't be
   ranked from production data. The app is offline first, so API speed only shows on Friends (already cached,
   [Friends](friends.md) "Loading fast") and sign-in.
