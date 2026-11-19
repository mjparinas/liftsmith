# Workouts from other apps

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

## What it is (Melvin, 2026-11-19)

Gap item 1 from the 2026-11-17 gap analysis, picked by Melvin on 2026-11-19 with "do 1 (make this a setting)". Before this, Liftsmith only wrote its own workouts to Health Connect and Apple Health; runs, rides, sports and classes from a watch or another app were invisible, so the plan could ask for heavy squats the morning after a 90-minute match.

**Settings › Connected apps › Count workouts from other apps** (a switch on the Health Connect / Apple Health card, `profile.outsideWorkouts`, **off by default**). Turning it on asks Health for workouts (Health Connect's `READ_EXERCISE`, HealthKit's workout type; `OUTSIDE_READ` and `askOutside` in `health.ts`), never with the rest of the reads, so the Connect button and Play's declaration of the core reads don't change for lifters who never use it. Free, like the rest of Health.

## How it works

- **Reading.** While the switch is on, `importHealthDaily` (on launch, on return to the app at most every 15 minutes, and Sync now) also reads the last 45 days of workouts a week at a time (`readOutside`, the health plugin's `queryWorkouts`, no new native code) and turns them into `outside` events (`outsideEvents` in `src/lib/outside.ts`): the kind (Health's ~120 workout types folded into 14: run, walk, hike, ride, swim, row, cardio, HIIT class, strength, sport, climbing, snow or skating, yoga or Pilates, other), the start, the length, distance, calories and the recording app's name.
- **Left out:** Liftsmith's own workouts (its app id, `OWN_SOURCES`), anything under five minutes, unfinished or future sessions, not-really-exercise types (fishing, sailing, golf, bowling and the like, `SKIP`), and any workout that overlaps a Liftsmith workout (a watch recording the same session, or a Garmin run that also came in as cardio). The overlap check runs again wherever outside workouts count (`countedOutside`), so a Liftsmith workout or cloud import that arrives later still wins.
- **Ids** are `hw-<when the switch went on, base 36>-<Health's own id>`, so a re-read adds nothing. Turning the switch off deletes every `outside` event (and its sync copy). Because a deleted id is a tombstone that never syncs again, the time the switch went on is part of the id: turning it back on reads the same workouts under new ids.
- **Recovery** (`recovery.ts`): each one adds hard sets' worth of fatigue to the muscles its kind uses (`LOAD`: primary in full, secondary at half, like a lifting set), `per30` sets every 30 minutes, capped at six (`MAX_SETS`), counted from when it ended. A 45-minute run leaves the legs Ready, a 90-minute match leaves them Recovering. Yoga, Pilates and stretching add nothing. The recovery map, Today's plan, the readiness score's big-muscle signal, next-up and the widgets all read `recovery()`, so they all follow.
- **Readiness** (`readiness.ts`): the hardest outside workout that ended in the last 24 hours and was worth at least two hard sets is its own signal, −8 points, with its reason shown under the call: "Sport in the last day (90 min)" (`sig.outside`). That's the "why" for an easier plan.
- **What it never does:** outside workouts are not Liftsmith workouts. No sets, bests, XP, streak, weekly goal, unlocks, season points or weekly sets per muscle come from them, because those are about the lifting. Weekly load shows as recovery, not as sets.
- **Where the lifter sees it:** under the recovery map on Body › Muscles, **From other apps** lists the last seven days' outside workouts (kind, minutes, the app, the day) with a line saying they count in recovery and where to turn it off. Nothing shows when there are none.

## Platforms

- **Android:** Health Connect, `READ_EXERCISE` added to the manifest (it was stripped before). **Play Console's Health Connect declaration needs READ_EXERCISE added** (open items).
- **iOS:** Apple Health workouts through the same plugin call; the Health share usage string in all ten languages says it reads workouts when the switch is on. iOS never says whether a read was allowed, so a no shows only as nothing coming in.
- **Web:** no health store in a browser, so no switch; once a phone has read them, the workouts sync to the account and the web app's recovery map and plan count them too ([Platform deltas](platform-deltas.md)).

## Decided against, for now (Melvin, 2026-11-19)

From the same gap list:

- **"Ask the coach" AI chat** (gap item 2: a chat grounded in the lifter's own logs whose answers end in one-tap actions): **not now, maybe in the future** (Melvin, 2026-11-19: "i dont want 2, record that, maybe in the future but not now"). Don't build it or suggest it again unless Melvin brings it up.
- **Jump test readiness lab** (gap item 9: a jump test as a readiness check in Labs): declined (Melvin, 2026-11-19: "nah").
