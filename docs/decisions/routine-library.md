# Routine library

Built 2026-11-19 (Melvin picked gap item 6, "public routine library": lifters opt in to share routines as public pages
that people can search and rate). Code: `src/server/routineLibrary.ts` (rules and data), `src/app/api/library/route.api.ts`
(the app's calls), `src/server/libraryPage.ts` and `src/app/api/library/page/route.api.ts` (the website's pages),
`src/lib/routineLibrary.ts` (client), `Library.tsx` (browse and one routine), `PublishRoutine.tsx` (the card in the routine
editor), text in `src/locales/text/rl.ts`.

## What it is

- **Publishing is on purpose, one routine at a time.** In a routine's editor, "Publish to the routine library" opens a
  card: title (60 characters, starts as the routine's name), a few words (300), a goal (strength, muscle, fitness, fat
  loss, sport), a level (beginner, intermediate, advanced, any) and **Show my name** (on by default; off shows no name).
  Publish, then Update, View and Take it out. Nothing is ever published by default.
- **Only the routine's shape goes out:** the same code as a shared routine link (`routineShare.ts`): exercises, set
  counts, supersets and parts. Never weights, reps, notes or anything personal; the saver's own progression fills those
  in. The phone works out the equipment it needs and about how long it takes (`routineEquipment`, `routineMinutes`),
  because the server doesn't load the exercise list.
- **Publishing the same routine again updates it** (matched by its code, or by the id the card already knows), so a
  shared page link keeps working. 30 routines per account.
- **Browse** (`#/library`, from Programs › From lifters and the Routines sheet's "Find one in the library"): search by
  words (accents ignored), goal chips, Top or New, and **Fits my gym** (only routines the active gym has every piece of
  equipment for). One routine (`#/library/<id>`) is the shared-routine preview with Save, then stars, Share its page and
  Report.
- **Stars, only from lifters who saved it.** 1 to 5, one rating per lifter, changeable, 0 takes it back; never on your
  own routine; shown once three lifters have rated (like coach and program reviews). Saves count once per lifter, never
  the publisher's own. No written reviews: routines are small, and reviews would need their own moderation.
- **Website:** `/routines/` lists routines by goal (noindex while empty) and `/routines/<slug>-<id>/` is each one's page,
  server-drawn with no scripts (`SHARE_PAGE_CSP`), with the exercises and sets, `ExercisePlan` structured data (no
  `AggregateRating`: Google doesn't support it for that type) and a button that opens it in the app. A wrong slug
  redirects to the right one; a removed or hidden routine is a 404. Both are in the gym sitemap and IndexNow. The footer's
  Learn column links `/routines/`.

## Teens

Under 18s can browse, save and rate, but **can't publish**: a published routine is a public page that can carry a
name. The card says publishing opens at 18 (`rl.teen`), and the server refuses too (`teen`).

## Moderation

- Title and words go through the Friends text filter (`checkText`): no links, no blocked words.
- Anyone signed in can report a routine (spam, abuse, unsafe, other, with an optional note). Three reports from
  different lifters hide it from everyone but its publisher, who sees "Hidden while we look at reports about it". Reports
  go to Admin › Reports as kind `routine`: Dismiss brings it back, Remove deletes it with its saves and ratings.
- Rate limits per account: 120 library actions an hour, 20 publishes and 20 reports a day.
- Deleting an account deletes its routines, saves and ratings, and takes its stars off the routines it rated
  (`libraryCleanup`).

## Database reads

Browsing reads one indexed list (`library_routines_list`, hidden first then saves), kept for a minute per server, and
filters it in memory, so a search costs no rows. One routine, its rating and the lifter's own save and stars are read by
key. Every query shape is in `dbIndexes.test.ts`.

## Parity

Pure web code plus our own API, so Android, iOS and the web app get it together. Nothing native.
