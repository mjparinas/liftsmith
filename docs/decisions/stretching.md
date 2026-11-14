# Stretching

Melvin asked on 2026-11-11: "add all kinds of different stretches, this should be available either before or after the workout. maybe add suggested stretches based on the muscle groups being worked out that day. users can choose to skip it or not. they should also be able to select stretches from a library and do them adhoc (not necessarily during a workout day)", and then "the stretch library should include 3d examples as well".

## The library

- **48 stretches** in `src/lib/stretches.ts`, two kinds:
  - *Warm-up moves* (`warm`, 25): dynamic stretches and drills for before lifting (marching, jumping jacks, arm circles, leg swings, lunge with a reach, toy soldiers, side lunges, downward dog pedal, …). Some raise the pulse (`pulse`); a warm-up starts with one.
  - *Cool-down holds* (`cool`, 23): static stretches for after a workout or a rest day (doorway chest, cross-body shoulder, overhead triceps, child's pose, cobra, pigeon, figure-four, half-kneeling hip flexor, butterfly, wall calf, downward dog, …), 30 to 45 seconds, per side where it's one-sided.
- **Every app muscle has at least one of each kind** (a test checks), so a warm-up or cool-down can cover any day.
- Each stretch has its muscles (`for`), a dose (hold seconds or reps, `eachSide`) and any kit it needs (`needs`: bands, a pull-up bar, a bench). Suggestions leave out what the gym can't do; the library shows everything.
- The general warm-up's drills (the old `warmupRoutine.ts`) became the first 18 warm-up moves and kept their `warm.*` text. Everything else is `str.*` (`src/locales/text/str.ts`), in all six languages.
- Stretches are **not** exercises: they aren't in `EXERCISES`, the generator or the exercise browser, so the two libraries grow without touching each other (agreed with the exercise-library thread, 2026-11-11).

## 3D demos

- Every stretch plays on the same 3D figure as the exercises (male or female from Settings, 2D canvas without WebGL). Motions are in `src/lib/demo/stretchMotions.ts`: 42 of their own, and six drills that are the same movement as an exercise borrow its motion (band pull-aparts, dead hang, bodyweight squat, glute bridge, dead bug, side lunge).
- The demo is asked for `stretch:<id>` (`demoId`), so a stretch and an exercise with the same id ("glute-bridge") can't collide; the engine asks `stretchMotion` first. The stretch's muscles light up on the figure.
- Floor and front-to-back stretches show side-on (`stretchView`); the rest keep the three-quarter view.
- `stretchMotions.test.ts` checks every stretch on both bodies through its whole cycle: limbs keep their length, hands and feet reach their targets, nothing goes through the floor.

## Where it shows

- **Before a workout:** Today's "Warm up first" chip opens the warm-up for today's plan (`#/stretch/warmup`). Settings › Workout › *Warm up before every workout* (off by default) makes Start open it first. Either way it's a list with a reason under each stretch, a Start button and **Skip and start lifting**; the end screen's button is Start workout. Off by default because Start must stay one tap for everyone else ("Focus on the workout").
- **After a workout:** Done shows a *Cool down* card for the muscles just trained (`#/stretch/cooldown`). Settings › Workout › *Offer a cool-down* (on by default) hides it.
- **Rest days:** Today's rest-day card offers *Stretch today* (`#/stretch/rest`): holds for what trained in the last two days, or the whole body.
- **Any day:** a *Stretch library* card on Today (under the plan, every day but during a workout; Melvin, 2026-11-14: "Can you add it on today") and Progress › All tools › *Stretch library* (`#/stretch`). Filter by kind and muscle, tap a stretch for its demo and how-to (and *Do this one*), or tick several and *Start*. Picks stay for the session.
- Suggestions are about five minutes (eight on a rest day), seeded by day, picked to cover the most of the day's muscles. The lifter can drop any before starting.

## The player

- One stretch at a time: the figure, the name, why it's there, a countdown, how to do it, Pause and Next, and what's next. One-sided stretches split the time and say "Switch sides" halfway. Rep moves get about three seconds a rep.
- Sounds and haptics from the shared set (a switch-on pair for switching sides, the log pair for the next stretch, the goal-done run at the end). The screen stays on while it plays (`keepAwake`). A polite live region names each new stretch and side for screen readers; the countdown is a `timer`.
- Finishing saves a `stretch` event (moment, ids, seconds), which syncs like any other event. Nothing reads it yet; it's there for streaks or insights later.

## Why lines

Every suggested stretch says why (AGENTS.md "Every recommendation says why"), from `stretchWhy`: a pulse raiser "raises your heart rate", a warm-up move "readies today's muscles: …", a cool-down hold "worked today: …", a rest-day hold "trained in the last two days: …", and a library stretch "stretches: …". The muscle list goes after a colon so no language needs agreement with it.

## Search

The library has a search box like the exercise browser's (PR #185), using the same `fold()` so accents and case don't matter (`searchStretches` in `stretches.ts`). Every word typed must match the stretch's name in the app's language or English, or a muscle it's for. It combines with the kind and muscle chips, and a search that finds nothing says so. Typing is optional: the chips alone narrow the list.

## Platforms

Pure web code: Android, iOS and the web app get the same screens. No native code is needed (no notification for a stretch routine; the screen stays on instead).

## Follow-ups

- The library's muscle chips and the exercise browser's are two copies of the same row; pull them into one shared component if a third place needs it.
