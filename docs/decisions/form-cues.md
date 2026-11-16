# Form cues: common mistakes and their fixes

Built 2026-11-16 (Melvin asked for "offline exercise video or form cues … there's no coaching text on form faults"). The 3D figures show how a lift moves; this adds the words for what usually goes wrong.

## What it is

- **A library of common mistakes** (`FAULTS` in `src/lib/formFaults.ts`, about 100). Each has three catalogue lines in `src/locales/text/ff.ts`: what it looks like as the lifter would notice it (`ff.<id>`), what to do instead (`ff.<id>.fix`) and why it matters in one short line (`ff.<id>.why`). All six languages.
- **Every exercise gets two or three**, picked by rules on its movement pattern and its id (`faultIdsFor`): the first matching rule for the pattern wins, and each pattern has a fallback, so a new exercise always gets mistakes without a hand-written list. Isolation moves go by the muscle and the move (curls swing, triceps kickbacks drift at the elbow, glute kickbacks arch the back). Stretches get theirs from their kind (`stretchFaultIds`: warm-ups rush or force, pulse raisers go too fast, cool-downs bounce, force or hold the breath; hamstring stretches round the back).
- `formFaults.ts` imports no i18n, so the website can use it; the app's helpers that read the words are in `src/components/app/FormFaults.tsx`.

## Where it shows

- **The workout's How to sheet**, under the cues: "Common mistakes", each with its fix and why.
- **Exercise pages in the app** now have a "How to do it" card: the 3D figure, setup, cues and the mistakes.
- **Stretch sheets and the stretch player**: "Watch for", with the stretch's mistakes.
- **The rest timer's form check**: one mistake for the next set with its fix, rotating through the exercise's mistakes set by set (`formCheckId`). Between sets only, never during a set, so it adds no tap. On by default; **Form checks while resting** in Settings › Workout turns it off (`profile.delight.formCheck`). Not shown for custom exercises.
- **The website's exercise pages** list the mistakes for lifts without a written guide (English pages; localized pages exist only for guide lifts, which already cover their mistakes).

## Rules

- Short and actionable: the mistake, the fix, one line of why. No video: the 3D figure is the demo, and everything is text in the bundle, so it works offline.
- Every fault in the library is used by at least one exercise or stretch, and every catalogue line belongs to a fault (`formFaults.test.ts`).
- Pure web code, so Android, iOS and the web app get it together. Free.
