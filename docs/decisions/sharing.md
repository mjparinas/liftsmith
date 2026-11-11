# Sharing

Melvin, 2026-11-11: "There should be opportunities to share workouts and/or milestones with other people." He chose to build share moments and cards first, then public links with link previews.

## Share cards (built 2026-11-11)

- **One share sheet** (`ShareSheet.tsx`) for every moment. It shows the card exactly as it will go out, then: which moment (chips, when a screen has several), **Post** (1080×1350, 4:5 for feeds) or **Story** (1080×1920, 9:16), **Show weights** (on) and **Show my name** (off; the name is the optional one in Account and sync), a line saying what never goes on a card, and one Share button. The size and switches are remembered on the device (`liftsmith.sharePrefs` in localStorage).
- **Where to share from**, one control each:
  - *Done:* "Share this workout" opens the sheet with the workout, each new PR, a level-up and each badge just earned.
  - *Progress › History:* a share icon on each workout card under the calendar (the workout and its PRs).
  - *Awards:* a share icon on every earned badge, and on the level card.
  - *Coach's notes:* the "what's working" note (a lift up 5%+ in six weeks) has **Share it**, a lift progress card.
  - *Recap:* the month and year recap goes through the same sheet.
  - The PR replay sheet has no share button of its own, because Done's Share already offers each PR (one control, one destination).
- **Cards** (`shareCards.ts` decides what's on them, `shareImage.ts` draws them): workout (time, sets, volume, muscles worked as chips, PRs and badges), PR (lift, weight × reps, estimated one-rep max, the gain on the last best), badge (a medal in the tier colour), level (title, level, workouts, week streak, badges), lift progress (+% over N weeks, before and now) and recap. Always dark (like the app's dark theme), with the brand, the level and streak footer and getliftsmith.com. A Japanese headline wraps by character.
- **The 3D figure** is the art on workout, PR and progress cards: one still of the hologram (`src/components/demo/still.ts`), caught halfway through the hardest phase of the lift at the three-quarter view with the working muscles lit, in the lifter's figure (Settings sex). WebGL on a GPU, the 2D canvas otherwise, and none in tests; drawn once per lift and kept for the app run. With room (stories) it gets its own space; on a full post it sits behind the text on the right.
- **Privacy:** heart rate, body weight, body fat, measurements, cycle data, injuries, gyms and places are never on a card. Weights appear only while Show weights is on; the name only when Show my name is on. Tested in `shareCards.test.ts`.
- **Platforms:** pure web code. Android and iOS share the PNG through `@capacitor/share` (written to the cache folder with `@capacitor/filesystem`), the web app through the Web Share API with files, or a download where that's missing. No native code, so the three stay in step.
- Analytics: `feature` `share_card` with `<kind>:<size>:<how>` (`native`, `web`, `download`, `cancelled`, `failed`). A cancelled share sheet isn't an error.
