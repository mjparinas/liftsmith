# Workouts with parts: lifting, stretches, rehab and cardio in one session (stages 1 to 6 built)

Melvin asked on 2026-11-13: "I wonder if we can create a concept of a "session" (or a better name) that is a collection of stretches and workouts or rehab, etc. can you plan what that would look like? Could we do this in a way that doesn't break existing data?", and then "Session could maybe also include health metrics like heart rates, lifting speed, weights etc".

This file is the plan. Melvin's choices are recorded at the end; stages 1 to 5 are built.

## The short version

- **We already have the container.** Every event from a workout carries a `sessionId`: sets, warm-up sets, notes, swaps, feedback, the heart rate stream, pain ratings and the workout's name. What's missing is that stretches (warm-up and cool-down) and other kinds of work aren't tied to it, and nothing says what *parts* a workout had.
- **So we don't add a new container. We give the existing workout "parts"**: warm-up, lifting, rehab, cardio, cool-down, a fitness test. A workout today is a workout with one part, lifting.
- **Nothing stored changes.** Old events are read as they are; a new derived view groups them. New fields are optional, there are no new event types, no IndexedDB version bump and no server table change. Older app versions keep working with data written by newer ones.

## Naming

"Session" is already taken twice: in code a `sessionId` is a workout, and in coaching "sessions" are the appointments a lifter books with a trainer (`bk.*`, `CoachSessions.tsx`, #405). A third meaning would confuse lifters ("my session with Sam" vs "today's session") and us.

**Proposal: keep the word "Workout" for the whole thing and call the pieces "parts".** Lifters already think of a warm-up and a cool-down as part of a workout, every screen that says "workout" stays right, and nothing new needs to be explained. A workout's title comes from what's in it: "Upper body", "Upper body + knee rehab", "Stretch" (only stretches), "Knee rehab" (only rehab). In code the container stays `sessionId`; the new type is `SessionPart`.

Other names considered: "Session" (clashes as above), "Training" ("today's training" reads well but is awkward as a countable noun in history), "Plan" (already Today's plan), "Routine" (already the saved template), "Block" (already the training block).

## What the lifter sees

### Today

The plan card becomes a short list of parts, each with its time and a one-line why, for example:

1. Warm-up, 5 min: "readies today's muscles: chest, shoulders" (only when the warm-up setting is on, or the lifter taps the chip)
2. Lifting, 40 min: the exercise list as today
3. Knee rehab, 10 min: "your physio asked for 3 times a week; 1 done"
4. Cool-down, 5 min: "worked today: chest, triceps"

A part can be dropped before Start with one tap (a small ✕ on its row; it comes back with Undo). **Start stays one tap** and runs the parts in order. Nothing changes for a lifter with no extra parts: the card looks exactly as it does now.

Where parts come from:
- **Warm-up and cool-down:** the existing settings (warm-up off by default, cool-down on). The cool-down card on Done becomes the last part instead, so it's done inside the workout and counted with it.
- **Rehab:** an active injury with a rehab program (chosen by the lifter or assigned by a physio, see [Trainer mode](trainer-mode.md)) adds its rehab part on the days it's due.
- **Cardio:** a routine or coach plan can include one; the adaptive plan doesn't add cardio on its own.
- **A saved routine with parts** (below) brings its own.

### During the workout

- The workout screen shows which part it's in, small, above the exercise: "2 of 4 · Lifting". Between parts there's one card: what's next, Start, and Skip. It never adds a tap during a set.
- A stretch part plays in the same stretch player as today (`Stretch.tsx`), inside the workout, so the rest timer, heart rate and the live notification keep going.
- A rehab part works like rehab routines do now: lighter targets and a pain rating after each exercise.
- Ending early is still one button; parts not reached are recorded as skipped (they're just absent from `parts`, see below).

### Done and history

- Done shows the workout as before, with one line per part: time, and the one or two numbers that matter for that part (lifting: volume and any PRs; rehab: pain before and after; stretch: minutes held; cardio: distance or average power). Heart rate per part (average and peak) shows where it was recorded.
- Following the action-over-stats rule, each part's line ends with what to do next when there's something to do ("Rehab: 2 of 3 this week, one more by Sunday"), and leaves numbers out when nobody would act on them.
- History lists one entry per workout, with its parts. Old workouts show as before (one lifting part). Old stand-alone stretches show as their own short "Stretch" entry; old warm-ups and cool-downs done next to a workout are folded into it when they fall close enough (warm-up ended within 30 minutes before the start, cool-down started within 60 minutes after the end).

### Saved routines with parts

A routine can hold parts: "Warm-up (these 4 stretches) → Lifting (these exercises) → Rehab (this program) → Cool-down". The routine builder gets an "Add part" row under the exercise list. A routine without parts is exactly today's routine.

## Health metrics in a workout

Most of this is already captured per set and per workout; parts make it readable per part.

| Metric | Captured today | With parts |
| --- | --- | --- |
| Heart rate | Per set (`hrAvg`, `hrMax`, `hrEnd`), whole stream (`hrSeries`), workout average, peak and low (`sessionEnd`) | The stream keeps recording through stretch, rehab and cardio parts; per-part average and peak are cut from the stream by each part's start and end. Nothing new is stored. |
| Weights and reps | Every set | Unchanged. Rehab sets keep their own tag so stats can tell them apart (below). |
| Lifting speed | Last full rep's speed (`endSpeed`) when the camera counts with bar speed on | Add optional `meanSpeed` (mean of the set's full reps) next to `endSpeed`, so a set's speed and its drop-off can be shown and used by today's-max. Per-rep arrays stay out of the event log (size). |
| Time | Set duration, rest, work and rest totals, workout length | Each part's start and end, so time per part is exact. |
| Pain | Pain events with `sessionId` and `exerciseId` | Shown per rehab part, before and after. |
| Stretch | Stretch events (moment, ids, seconds), not tied to a workout | Tied to the workout and part (below). |
| Calories | Workout total | Per part from the heart rate stream where there is one. |

New metrics are only shown where they lead to an action or a recommendation (AGENTS.md "Action over stats"). The plan is to capture them all and show few.

## Data model

Everything below is optional fields on existing types. Events never change once written, so optional means old events are simply read without them.

```ts
type PartKind = "warm" | "lift" | "rehab" | "cardio" | "cool" | "stretch" | "test";

/** One part as it happened, written once on sessionEnd. */
interface SessionPart {
  id: string;          // unique within the workout
  kind: PartKind;
  start: number;       // ms
  end: number;         // ms
  /** Where it came from: a routine part, a rehab program, the stretch moment. */
  ref?: string;
}

interface SessionStartEvent {
  // …as today, plus:
  /** The parts planned at Start, in order (kinds and refs only), so history can show what was skipped. */
  plan?: { kind: PartKind; ref?: string }[];
}

interface SessionEndEvent {
  // …as today, plus:
  /** The parts that were done, in order. Missing on older workouts: the whole workout is one "lift" part. */
  parts?: SessionPart[];
}

interface StretchEvent {
  // …as today, plus:
  /** The workout and part this was done in. Missing on older and stand-alone stretches. */
  sessionId?: string;
  partId?: string;
}

interface SetEvent {
  // …as today, plus:
  /** Which part the set belongs to, when the workout had more than one. */
  partId?: string;
  /** Mean speed of the set's full reps (m/s), next to endSpeed. */
  meanSpeed?: number;
}

interface RoutinePart {
  kind: PartKind;
  /** Lifting, rehab and cardio parts: exercises and sets as in RoutineItem. */
  items?: RoutineItem[];
  /** Stretch parts: stretch ids, or none to let the app pick for the day's muscles. */
  stretches?: string[];
}

interface Routine {
  // …as today, plus:
  /** Parts in order. When present, `items` still holds the lifting part, so older app versions see a lifting routine. */
  parts?: RoutinePart[];
}
```

Why parts go on `sessionEnd` rather than a new `part` event: one write at the end (the active workout already lives in localStorage, so a killed app loses nothing), no new event type that older app versions would get through sync and not understand, and the auto-end path already writes `sessionEnd`.

### The derived view

A new pure function, `sessionsOf(events)` (`src/lib/sessions.ts`, engine tsconfig), builds `Workout { id, start, end, parts: { kind, start, end, sets, stretches, pain, hr } [] }` from the events every time, like everything else in `derive.ts`:

- `sessionEnd.parts` present: use it; sets and stretches join their part by `partId`.
- Missing (every workout until this ships): one `lift` part from start to end with all the sets; a stretch event without `sessionId` joins the nearest workout by the time rule above, or stands alone.

`derive()` and every existing stat keep reading sets as they do now. The new view sits beside them; screens move to it one at a time.

### What counts where

- **Volume, recovery, progression, PRs, plateaus:** lifting and cardio sets only, as today. Rehab sets don't move progression or recovery for the main lifts (they're lighter by design and would read as missed reps or a stall); they keep their own adherence and pain view.
- **Stretches** never count toward volume or recovery.
- **Streaks, the weekly goal and XP:** see choice 2 below.

## Existing data: nothing to migrate

- Stored events are never rewritten. Every new field is optional, and the derived view fills the gaps (old workout = one lifting part; old stretch = joined by time or stand-alone).
- No IndexedDB version bump, no backup format change (old backups restore; new backups restored by an older app ignore the extra fields).
- Old app versions on another device: they ignore unknown fields on events they understand, and there are no new event types. A routine edited and saved on an old version may lose its `parts` (profile records are last-write-wins); it falls back to its lifting `items`, never to nothing.
- Tests: `sessions.test.ts` builds old-shape events with the factories (no `parts`, no `sessionId` on stretches) and checks they come out as today's history, plus a property test that grouping never loses or duplicates a set.

## Sync

Nothing changes on the server's sync tables: event bodies are stored as they come, and the quota counts events, which don't grow (one `parts` array on an event that's already written). Two places do change:

- **Coaches** see events through `KEEP` in `src/server/coach.ts`. Add `parts` to `sessionEnd`, `plan` to `sessionStart`, `partId` to `set`, and add `stretch` (moment, ids, seconds, sessionId, partId) so a coach or physio sees warm-ups, cool-downs and stretch homework. Pain stays behind the client's per-coach pain share, as now.
- **Friends feed:** a post is still one per workout; the card lists its parts. A stretch-only workout isn't posted unless the lifter shares it.

## Sharing

- Routine links are `r1~name~exercise.sets…` (`routineShare.ts`). Parts need a new version, `r2`, with a part marker between groups (`~w:` warm-up stretches, `~l:` lifting, `~h:` rehab, `~c:` cardio, `~d:` cool-down). `decodeRoutine` keeps reading `r1`. A `r1` link is a lifting-only `r2` routine.
- An older app opening an `r2` link can't read it; the website's routine page (the link's landing) says to update the app, and the app's "not a routine link" message gets the same hint.
- Share cards and public workout links show the parts line under the title.

## Coaches and physios

- A coach can assign a routine with parts (for example a physio's "Knee: warm-up, rehab, cool-down" or a trainer's "Lower body + hip mobility"), with times a week as today. The client's Today shows it as parts.
- The coach's client report reads parts: adherence per part (rehab done 2 of 3 this week, cool-downs skipped), pain before and after rehab (with consent), and time per part.
- A booked coaching appointment (#405) can later link to the workout done during it (`sessionId` on the booking), so "Session with Sam" in the calendar opens the workout. Not in the first stages.

## Health Connect and Apple Health

Workouts are written to Health as one strength workout today (`HealthWorkoutPlugin.kt`, `HealthWorkoutPlugin.swift`). With parts:

- **Android:** `ExerciseSessionRecord` takes `segments` (`ExerciseSegment`, with types such as weightlifting, stretching and the cardio machines), so one session is written with one segment per part.
- **iOS:** `HKWorkoutBuilder` with `HKWorkoutActivity` (iOS 16+) writes one workout with an activity per part (traditional strength training, flexibility, the cardio types). Below iOS 16 it stays one strength workout.
- Both are native changes in the same pull request (parity rule). The web app has no Health write, as today.

## Platforms

- Parts, the Today list, the workout's part header, Done, history, routines and sharing are web code: Android, iOS and the web app get them together.
- **Native, both phones in the same change:** the live notification (Android `WorkoutService`) and Live Activity (iOS) show the part name ("Cool-down · Pigeon 0:30") from one new optional `part` field in the `WorkoutSession` payload (`sessionNotify.ts`); the watch apps (Wear OS, Apple Watch, Garmin) get the same field. Health segments as above.
- No platform delta expected.

## Free and Pro

Parts aren't a Pro feature: warm-ups, cool-downs, rehab and routines are free today and stay free. What's Pro stays Pro (adaptive plans picking the parts for the day, the recovery map, advanced stats per part). Being a coach's or physio's client stays free.

## Stages

Each stage is its own pull request, shippable on its own.

1. **The derived view and history** (built 2026-11-13). `src/lib/sessions.ts` (`joinStretches`, `partsOf`, `coolDownHome`; in the engine tsconfig) reads every stretch event against the workouts: one with a `sessionId` belongs to that workout, an older one or a warm-up done before Start joins by the time rule above, and the rest stand alone. A cool-down logged within the hour after a workout now carries that workout's `sessionId` (`logStretch` in `store.ts`); a warm-up can't, because the workout doesn't exist yet when it's logged, so it stays on the time rule until stage 2 makes it a part. History (Progress › History) shows "Warm-up: 5 min · Lifting: 42 min · Cool-down: 4 min" under a workout that had more than one part, and stretch-only days get their own mark on the calendar and a Stretches card (time, how many, their names). Coaches now see stretch events (moment, ids, seconds, sessionId; `KEEP` in `coach.ts`). The `SessionPart` and `PartKind` types and the optional `sessionEnd.parts` are in `types.ts` but not written yet. Not yet on the features page: it gets its entry, with a blog post, when parts reach Today in stage 2. Tests: `sessions.test.ts` (old data reads as one lifting part, the time rule, a `sessionId` wins, nothing lost or doubled) and `History.test.tsx`.
2. **Parts on Today and in the workout** (built 2026-11-13). Today shows the parts above the plan (`TodayParts` in `Stretch.tsx`): Warm-up and Cool-down rows with a switch, about how many minutes (from `suggest`) and a why line, around the Lifting (or Rehab) row. The warm-up switch starts from Settings › Workout's `warmFirst`; the cool-down part starts off, because Settings' "Offer a cool-down" (on by default) already offers one as a card on Done, and making it a part for everyone would add a stop to every Finish. Both switches only change the next workout (`partPicks` in the workout slice, cleared at Start). The old "Warm up" chip under the plan went, under one control, one destination. Start (`start()` in `store/workout.ts`) plans the parts (`planParts`), keeps them on the active workout (`parts`, `part`) only when there's more than one, and writes them on `sessionStart.plan`. A warm-up part opens the warm-up screen, which goes on to the lifting by itself when its last stretch ends, or with Skip (`nextPart(skip)`; `enterPart` closes the part before). After the last set, Finish says "On to the cool-down" and opens it; the cool-down ends the workout when done, or with "Skip and finish" (`endWorkout.ts`). `sessionEnd.parts` records the parts done, with start and end (`doneParts`; skipped parts left out), and History reads those times (`partsOf(..., recorded)`). While a stretch part is on, Log set and +30 s do nothing, so a tap on the lock screen can't log a set. **The lock screen and watches** show the part through the existing `SessionState` fields (title "Warm-up: Cat-cow", set line "Warm-up · 2 of 5", next stretch or part, a timer for the hold), so the Android notification, the Live Activity and the Wear OS, Apple Watch and Garmin apps needed no native change. **Health:** the workout goes to Health Connect with an `ExerciseSegment` per part (stretching or weightlifting; `HealthWorkoutPlugin.kt`) and to Apple Health with an `HKWorkoutActivity` per part on iOS 16+ (flexibility or traditional strength training; `HealthWorkoutPlugin.swift`); one part sends none. The cool-down card on Done and Today hides when the workout already had a cool-down. **Streak and XP:** a stretch routine of 10 minutes or more done on its own (not joined to a workout) keeps the week streak and earns 30 XP (`stretchDays` in `derive.ts`, `XP.stretchDay` in `game.ts`); the weekly goal still counts workouts. **Deferred to stage 3:** rehab as its own part next to lifting (in stage 2 a rehab routine's whole workout is the Rehab part, which already counts for the goal) and rehab-only days by time. Features page: "Workouts with parts"; blog post "Your workout now has parts". Tests: `sessions.test.ts`, `store/workoutParts.test.ts`, `derive.test.ts`.
3. **Routines with parts, sharing and coaches** (built 2026-11-13). A routine can hold a warm-up and a cool-down (`Routine.parts`, `RoutinePart` in `types.ts`: kind `warm` or `cool`, with up to 12 stretch ids of that kind or none to let the app pick on the day; `cleanParts` in `routines.ts`). The lifting stays in `items`, so a routine with parts is still a plain routine to anything that doesn't know them. The routine builder has Warm-up first and Cool-down after switches under the exercises, each with Choose stretches (chips from the library) (`RoutinePartsEditor` in `Stretch.tsx`), and a routine's card says "Warm-up (4 stretches) → Lifting → Cool-down" (`routinePartsLine`). Using it today switches its parts on on Today (`partDefaults`; the lifter can still flip either for one workout), Start plans them, and a live warm-up or cool-down plays the routine's own stretches. **Links stay `r1`** (a change from the `r2` in the plan above): the parts travel as `w[:ids]` and `d[:ids]` segments after the exercises and before the rehab mark, which older apps read as unknown exercises and drop, so an older app still opens the routine with its exercises instead of refusing the link. Shared routines save their parts and show the parts line. **Coaches** assign routines with parts through the same code; the server now passes `sessionStart.plan` and `sessionEnd.parts` to coaches (`KEEP`), and each assigned routine with parts shows "Warm-up: done in 0 of 2 · Cool-down: done in 1 of 2" over the workouts that followed it (`PlanProgress.parts`, `trainer.ts`). Sending a routine to a friend (Friends) still sends the exercises only. **Still to come:** rehab as its own part beside lifting in one workout (a rehab routine is still the whole workout's Rehab part), cardio parts, and the coach's pain before and after rehab, which go with stage 4. Tests: `routineShare.test.ts`, `routines.test.ts`, `trainer.test.ts`, `store/workoutParts.test.ts`, `RoutineParts.test.tsx`. Features page: the "Workouts with parts" entry now mentions routines; blog post "Save a warm-up and cool-down with your routine".
4. **Per-part metrics that lead to an action** (built 2026-11-13). `src/lib/partMetrics.ts` (engine tsconfig) reads what the parts already record; nothing new is stored except one optional field on sets. **Heart rate per part:** `hrOfParts` cuts the workout's `hrSeries` by each recorded part's start (inclusive) and end (exclusive) into average, peak and last-minute heart rate. **Pain before and after:** `sessionPain` takes "before" from a pain rating on the Injuries screen in the 12 hours before Start, else the first of two or more ratings in the workout, and "after" from the last rating in it (between sets or on Done). History shows "Knee pain: 4 → 2" under a workout when there's a before (`PainLine` in `History.tsx`), and the coach's client report shows the latest rated workout's before and after on each injury when the client shares pain (`RehabInjury.lastWorkout` in `trainer.ts`, `trn.painWorkout`). **Coach's notes** (`insights.ts`, keys `ins.rehabPain*` and `ins.coolHr.*`): pain after workouts moving two points or more (`rehabPainTrends`: an active injury, three or more rated workouts in four weeks at least ten days apart, the first two against the last two) says so with the numbers, good when down ("ask your physio whether you're ready for the next stage") and a warning when up ("tell your physio, keep the rehab easy"), with a button to Injuries; a heart rate still 100 bpm or more in the cool-down's last minute and no lower than the lifting's average, in two of the last three cool-downs with a stream in three weeks (`coolHrHigh`), suggests a longer cool-down with slow breathing. The app never says what's right for an injury. **Bar speed:** sets counted by the camera with a scale now also save `meanSpeed` (mean of the full reps, `meanFullSpeed`) next to `endSpeed`; nothing shows it yet, it's captured for today's max and later advice. Coaches don't get set speeds (as before). **Not in this stage** (no request yet): rehab as its own part beside lifting in one workout, cardio parts, and calories per part. Features page: the "Workouts with parts" entry mentions the notes; blog post "Is your rehab working? Your workout now tells you". Tests: `partMetrics.test.ts`.

5. **Rehab beside the lifting and cardio parts** (built 2026-11-13; Melvin picked it from the next-steps list). Both are parts made of exercises, so they need no new screen: at Start their exercises go on the end of the plan, each marked with its part (`PlanItem.part`, `"rehab"` or `"cardio"`), the workout runs them like any exercise, and each set says which part it was done in (`SetEvent.partId`, written only for these two). The part follows the exercise on screen (`followPart` in `store/workout.ts`, `movePart` in `sessions.ts`): reaching the first rehab exercise closes the lifting and starts the rehab part; going back to an earlier exercise from the strip keeps the times already recorded. Order: warm-up, lifting, rehab, cardio, cool-down (`planParts`). `sessionStart.plan` and `sessionEnd.parts` carry `ref`: the rehab routine's id or the cardio exercise's id. Code: `src/lib/partExtras.ts` (engine tsconfig).
   - **Rehab beside:** offered on Today (a Rehab row with a switch, minutes and a why line) when the lifter has a rehab routine from their physio or coach (`rehab: true`, the newest) whose exercises the gym can do, and the day's plan isn't that rehab already. It starts on when it's due: an active injury and not done today or yesterday (`REHAB_GAP_DAYS` 2, about every other day; done means a workout with that routine, or a rehab part with its id). The exercises run as written: the routine's sets, last rehab part's reps and weight (else the usual first target), injury mode never changes them (`afterInjuryChange` skips items with a part), and the pain check comes after each one as in a rehab routine. **Rehab sets never move the main lifts** (Melvin's choice 3): `sessionsOf` in `progression.ts` (so progression, plateaus and ghost mode), `recovery.ts` and the plateau detective's weekly sets skip sets with `partId: "rehab"`. Rehab routines done as a whole workout are unchanged (no `partId`), so their own targets still move forward as before. A physio sees the rehab done: coaches get `partId` on sets (`KEEP`), and an assigned rehab routine done beside lifting counts on their adherence because its exercises are in the workout.
   - **Cardio:** a Cardio row on Today under the lifting, off by default (the adaptive plan never adds cardio on its own, as planned above), on when the day's routine has a cardio part. Switched on, it shows chips for the machine (last time's first, then the common ones this gym can do, at most six; `CARDIO_PICKS`) and the minutes (10, 15, 20, 30; `CardioPicker` in `Stretch.tsx`), so there's no typing. It starts from the routine's part, else last time's exercise and minutes, else the first the gym can do for 15 minutes. It's one timed set (`cardioItem`) logged like any cardio set (time, distance where it means something, a Bluetooth machine can fill it in).
   - **Routines:** `RoutinePart` gains kind `cardio` with an optional `exerciseId` and `minutes` (`cleanParts` keeps known cardio exercises and 1 to 120 minutes; parts order warm-up, cardio, cool-down). The builder has a Cardio after switch with the same chips; the routine card reads "Lifting → Cardio (Rowing machine)". Links stay `r1`: cardio travels as `c[:exercise:minutes]` (no dot, so older apps drop it like `w` and `d`). Rehab isn't a routine part: it comes from the physio's own rehab routine.
   - **Finish** goes to the cool-down when there is one (`toCoolDown`), closing what's open; rehab or cardio not reached were never started, so they aren't recorded. History names each part (`hx.part.cardio`).
   - **Health:** each part is still a segment or workout activity; a cardio part also sends what it was (`activity`: bike, row, run, walk, elliptical, stairs, ski or other; `cardioActivity`). Android maps it to Health Connect's machine segment (stationary biking, rowing machine, treadmill running, walking, elliptical, stair-climbing machine); if Health Connect refuses that type in a strength session, the cardio segment goes as "other workout", then as no segments. iOS 16+ writes the matching `HKWorkoutActivityType` (cycling, rowing, running, walking, elliptical, stair climbing, cross-country skiing, mixed cardio). The lock screen and watches needed nothing new: rehab and cardio are ordinary exercises there.
   - Not done (no request yet): calories per part, rehab as a part inside a saved routine (it comes from the physio's routine instead), and cardio chosen by the adaptive plan. Features page: the "Workouts with parts" entry; blog post "Rehab and cardio, in the same workout as your lifting". Tests: `partExtras.test.ts`, `store/workoutPartsBeside.test.ts`, `RoutineParts.test.tsx`, `Delight.test.tsx`.

6. **Workout length covers the whole workout** (built 2026-11-14; Melvin: "Right now 25 min plus warm-up, cardio and cool-down really means about 45, which is confusing"). Today's length slider (`profile.minutes`) now sets the total, not the lifting. `splitSession` (`src/lib/sessionSplit.ts`, engine tsconfig) splits it: each part that's on keeps its own minutes (a warm-up or cool-down `STRETCH_PART_MIN` 5, the physio's rehab what its exercises take, the cardio its chosen minutes) and lifting gets the rest. Lifting keeps at least `LIFT_FLOOR` 15 minutes; when the parts would squeeze it below that, the cardio shrinks first, never below `CARDIO_FLOOR` 5 (`cardioCut`), and anything still missing makes the workout run over the slider (`over`). With nothing else on, lifting gets the whole slider, so a lifter who only lifts sees no change.
   - **Where:** `replan` (`store/plan.ts`) works out the split from the same picks Start uses (`partPicks` over Settings' warm-up default, rehab when due, cardio when on) and sizes the adaptive plan and a split program's day to `split.lift` (it passes a profile with those minutes; nothing is saved). A saved routine, a fixed program day or a plan picked on Today ("Same as last time") runs as written, so `split` is null and no bar shows. `pickPart` and `pickCardio` replan, so switching a part on or off resizes the lifting at once. Start runs the cut cardio (`split.cardio`).
   - **On Today:** a thin bar under the slider (`SplitBar` in `Stretch.tsx`), shown only when something besides lifting is on: one segment per part in the order they run, coloured by part (warm-up ember, lifting the accent, rehab violet, cardio mint, cool-down cyan; the Cardio row's heart moved from ember to mint so the bar and rows match), with the minutes written under it ("Warm-up 5 min · Lifting 25 min · Cardio 10 min · Cool-down 5 min"), so colour is never the only cue. When the cardio was cut or the workout runs over, one line under it says why (`str.part.cardioCut`, `str.part.over`). Each part's row shows its minutes from the split; the Lifting row shows `split.lift` (it used to show the plan's estimate, which read "about 49 min" at 50 with nothing else on). The cardio's own minute chips stay the way to shorten it, and lifting gets the time back. Warm-up and cool-down keep a fixed 5 minutes (no minute picker yet).
   - **Slider marks** (same change, Melvin: "set to 50 mins … the slider dot looks like it is near 44"): the "45" mark sat at the middle of the row, but 45 is 40% of 15 to 90, and the browser keeps the 28 px thumb inside the track. The mark and the filled part of the track are now placed where the thumb's centre is for that value (`onTrack` in `Today.tsx`).
   - **Lifting can be switched off** (Melvin, 2026-11-14: "lifting should include a toggle as well, some days i might want to only do cardio and stretch"). The Lifting row on Today gets a switch when the plan follows the slider and cardio (or the physio's rehab) can be offered (`PartPicksToday.lift`). Off, the exercise list is hidden, Start runs only the other parts (`planParts` leaves out the lifting part, and a workout with only a cardio part still records it as a part), and the cardio takes the lifting's time: what the slider leaves after the other parts, never below 5 minutes (`splitSession` with `lift: false`; its minute chips are hidden because the slider sets it). Lifting off always leaves something with exercises: switching it off turns the cardio on, and switching off the last of cardio and rehab brings the lifting back (`pickPart`, `partsOn` in `store/workout.ts`, which Today's split, the picks and Start share). The line under the bar says the cardio gets the lifting's time, or how long the workout runs when it isn't the slider's length (`str.part.noLift`, `str.part.noLiftTotal`). A stretch-only day stays the stretch library's job.
   - Features page entry `workout-length`; blog post "Workout length now means the whole workout". Tests: `sessionSplit.test.ts`, `store/sessionSplit.test.ts`, `Delight.test.tsx`. Web code only, so Android, iOS and the web app get it together.

Each stage updates the features page, gets a blog post, and adds its text in all six languages.

## Decided (Melvin, 2026-11-13: "Do your suggestions")

1. **Name:** "Workout" for the whole thing and "parts" for the pieces. Coaching's booked "sessions" keep their name; in code the container stays `sessionId`.
2. **Stretch-only and rehab-only days:** any workout of 10 minutes or more keeps the streak alive and earns XP; the weekly workout goal counts workouts with a lifting or cardio part, except for a lifter whose only plan is rehab, where rehab workouts count.
3. **Rehab and progression:** rehab sets never move progression, recovery or plateaus for the main lifts.
4. **Start order:** Start runs the parts in order, with a Skip on each between-parts card.
