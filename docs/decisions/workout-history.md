# Workout history: editing, notes, doing it again and exercise pages (Melvin, 2026-11-11)

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

Melvin asked for these after a check against the table stakes of other lifting apps ("do 1, 2, 3, 4, 5", 2026-11-11). They're pure web code, so Android, iOS and the web app get them together, with no native code and no platform delta.

## Editing and deleting a finished workout

- **Progress › History › a workout › Edit** (the pencil next to Share) opens one sheet (`EditWorkout.tsx`): the workout's name and note, every set (tap a set to open its weight and reps, both `BumpField`s, and Take out this set), **Delete this workout**, which asks once in the sheet, and Cancel. Nothing is saved until **Save changes**. Taking out every set is the same as deleting the workout. The workout running now can't be edited here; it changes on the workout screen (Undo, Discard).
- **Events are never changed in place** (`src/lib/editHistory.ts`). An edited set is deleted and written again with a new id at the same moment (`at`), so it stays in its place in the workout, and its reps-left rating moves to the new id. Per-side reps are dropped, because the edited reps are for both sides. Deleting a workout deletes every event carrying its session id plus the ratings of its sets. Sync sends the deletes as tombstones and the new set as a plain insert, so merging stays order-independent, and stats, PRs, streaks, XP, recovery and progression are derived again from what's left.
- Two phones editing the same set before syncing would both write a replacement, so the set would show twice; the lifter takes one out. Rare enough not to need a merge rule.
- **Copies outside the app aren't changed:** a workout already written to Health Connect or Apple Health, a post on the Friends feed (delete it there) and a share link keep what they had. The sheet says so for Health.

## A workout's name and note

- `sessionNote` events (`SessionNoteEvent` in `types.ts`): one optional name (60 characters) and note (1,000) per workout. Saving again deletes the old one and writes one new event, timed at least a millisecond after the old one so the newest wins on every device; both empty clears it. A note never counts as a workout (sessions are derived from sets).
- Written on the **Done screen** ("Add a name or note", folded away until tapped, after the pain ratings) or in the edit sheet. History shows the lifter's name in place of the routine or program name, and the note under the totals. Notes on a single exercise stay as they were (`note` events, shown next time on the workout screen).

## Doing a past workout again

- **Do this again** on a workout in History (hidden while a workout is running) makes Today's plan that workout's exercises and set counts, in the same order, with supersets kept where both exercises are still next to each other (`repeatPlan` with a session id, `workoutOf` in `ghost.ts`). Bonus drop and rest-pause sets aren't planned sets, so they're left out (this also changed Today's "Same as last time", which used to count them). Weights and reps still come from progression, so it keeps moving forward, and exercises the active gym can't do are left out; if none can be done, the card says so. It opens Today, where the lifter reviews it and taps Start, like any plan.

## One page for each exercise

- `#/exercise/<id>` (`ExercisePage.tsx`, views in `src/lib/liftPage.ts`). Opened by tapping an exercise's name in History and a lift in Progress › Personal records (each list row is the one control).
- In the order of the action-over-stats rule: **Next time** (progression's target with its plates and its own reason line, the same `target()` the plan uses), then **Which way it's going**: the best estimated max and one line on what to do, from each session's best e1RM (last six weeks against the six before: up or down by 1% or more; stalled when the best is three weeks old or more and nothing beats it, the same three weeks coach's notes use; steady otherwise; "log a few more" until there's enough). Then **Best for each rep count** (the heaviest weight for at least 1, 2, 3, 5, 8, 10, 12 and 15 reps, a row only when it's heavier than the row for more reps) and **Every session** (all sets, eight sessions at a time). Bodyweight lifts show their most reps instead of the table; timed work shows sessions only.

## Plate and warm-up calculators

In [Tools](tools-tdee-calculator.md); recorded there.
- **Log a past workout without typing** (polish pass, 2026-11-12): the day is a chip (Today, Yesterday, 2 days ago, or Earlier, which opens the phone's date picker) and the start time a − / + stepper in quarter hours, replacing the typed date-and-time box.
