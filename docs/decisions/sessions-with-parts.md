# Workouts with parts: lifting, stretches, rehab and cardio in one session (stage 1 built)

Melvin asked on 2026-11-13: "I wonder if we can create a concept of a "session" (or a better name) that is a collection of stretches and workouts or rehab, etc. can you plan what that would look like? Could we do this in a way that doesn't break existing data?", and then "Session could maybe also include health metrics like heart rates, lifting speed, weights etc".

This file is the plan. Melvin's choices are recorded at the end; stage 1 is built.

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
2. **Parts on Today and in the workout.** The plan card's part list, Start running through them, the part header and between-parts card, rehab as a part, the cool-down card folded in, the part name in the notification, Live Activity and watches, Health segments.
3. **Routines with parts, sharing and coaches.** Routine builder "Add part", `r2` links, coach-assigned routines with parts, `KEEP` additions, the coach report per part.
4. **Per-part metrics that lead to an action.** HR per part, `meanSpeed`, pain before and after rehab, and the coach's notes they feed (for example "your heart rate during the cool-down stays high, take it longer"; "rehab pain is down 3 points in two weeks, ask your physio about the next stage").

Each stage updates the features page, gets a blog post, and adds its text in all six languages.

## Decided (Melvin, 2026-11-13: "Do your suggestions")

1. **Name:** "Workout" for the whole thing and "parts" for the pieces. Coaching's booked "sessions" keep their name; in code the container stays `sessionId`.
2. **Stretch-only and rehab-only days:** any workout of 10 minutes or more keeps the streak alive and earns XP; the weekly workout goal counts workouts with a lifting or cardio part, except for a lifter whose only plan is rehab, where rehab workouts count.
3. **Rehab and progression:** rehab sets never move progression, recovery or plateaus for the main lifts.
4. **Start order:** Start runs the parts in order, with a Skip on each between-parts card.
