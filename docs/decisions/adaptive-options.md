# Adaptive workout options: automatic supersets, heavy lifts alone, warm-up sets, variety

Melvin, 2026-11-17: "For adaptive workout, how do we allow it to create superset automatically. This should be a toggle, we should have options to tweak how adaptive workouts work."

## Where

**Settings › Training › Adaptive workouts**, right under the program row (`AdaptiveOptions` in `Settings.tsx`). Training is where the plan is chosen, so the options for how the adaptive plan is built sit beside it. Switches and one chip row, no typing:

| Option | Saved as | Default | What it does |
| --- | --- | --- | --- |
| Pair exercises into supersets | `training.supersets` | off | The adaptive plan pairs exercises that don't share muscles (below). |
| Keep heavy squats and deadlifts on their own | `training.bigAlone` | on | Shown only with supersets on. Barbell squats and hinges never pair; on a strength goal no barbell compound does. |
| Warm-up sets | `training.warmups` | on | Off takes every warm-up set off, for every plan (adaptive, programs, routines) and for swaps and added exercises mid-workout (`warmupsOn`, `withoutWarmups` in `warmup.ts`). |
| Exercise variety | `variability` | balanced | Moved here from Training › More options (one control, one destination: it's no longer there). |

What was already elsewhere stays there and isn't repeated: rest times, rep ranges, set counts, the default length and priorities are in Settings › Workout › Plan details, and the length slider is on Today.

**Not Pro-gated.** They change how a plan is built, not what the app does: the adaptive plan itself is the Pro feature (free lifters get one a week, and these options apply to it). Fixed programs and routines keep their own supersets; only Warm-up sets reaches them.

**Basic automatic supersets stay free** (Melvin, 2026-11-17: "keep basic automatic supersets free"). The supersets switch, its rest maths and Keep heavy squats and deadlifts on their own are never behind Pro, and don't count as a Pro feature in `PRO_FEATURES`. A free lifter's weekly adaptive workout pairs exercises too when the switch is on. If richer superset options come later (a style choice, giant sets), each can be weighed for Pro on its own, but the basic switch stays free.

## How the pairing works (`src/lib/autoSuperset.ts`)

- **Who can pair:** not a heavy lift kept alone (above), a challenge set, an exercise kept lighter for an injury, a carry, a rehab or cardio part, or anything already in a superset.
- **Clash:** two exercises clash when either one's main muscles are among the other's main or helping muscles (bench press and overhead press share the triceps; a row's lower back is the deadlift's main muscle). Clashing exercises never pair.
- **Best partner:** opposite muscles (push with pull) 3, upper with lower body 2, core with anything 1; two barbell lifts lose a point (two bars, or plates changing every set). In plan order, each exercise that can pair takes its best partner after it (the nearest on a tie), which moves up to sit right after it. Pairs only, never three.
- **Rest:** within a round, the existing 15 s switch (`SWITCH_REST`). After a round, each paired exercise's rest is its usual rest less the partner's set time and the switch, in 15 s steps, never under a minute (or its own rest if that's already shorter): `pairedRest`. A rest the lifter set for that exercise is kept. The usual rest is kept as `soloRest` on the plan item, and an exercise split out of the pair on Today (or mid-workout) gets it back (`restoreSolo`, used by `withLinks`). Supersets the lifter or a routine linked keep their own rests, as before.
- **Time:** pairs share their rests, so with supersets on the generator picks exercises for 30% more time (`SUPERSET_ROOM`), pairs them, then drops the last exercise left on its own (or the last one) while the plan runs more than 5% over or trimming sets can't bring it to the length, re-pairing each time (`fitPaired`); extra sets come after, then the usual trim. Measured on the test gym: 60 minutes went from 4 exercises and 14 sets to 5 exercises and 21 sets, finishing on time.
- **Applies to** the daily adaptive plan and adaptive splits (both go through `generate`). The lifter's link and split choices on Today stick across rebuilds as before (`applyLinks`).

## Reasons (rule: every recommendation says why)

- Today: each paired exercise's line adds "Superset with Seated cable row: other muscles, so each rests during the other's set and the rest after a round is 1 min" (`pairWhy`, `why.pair`).
- During a set, under the target: "Rest is 1 min in this superset, because these muscles rested during the other exercise" (`workoutWhy`, `why.pairRest`).

## Platforms

Pure web code in the shared plan, so Android, iOS and the web app get it together. The lock-screen notification, Live Activity and watches already show the next exercise and the rest the app sends them, so they follow the pairs and the shorter rest with no native change.

## Shipped with

Features page entry `auto-supersets` (2026-11-17), blog post `/blog/automatic-supersets/`, and weekly email W63 `auto-supersets` ([Weekly tips emails](weekly-emails.md)).
