# Lift mastery and the unlocks it brings

Melvin, 2026-11-27: "Can we add more things that the user can unlock through exercises, please?" Of the eight ideas offered he picked four: lift mastery, figure colours, share card frames and profile titles ("do 1 to 4"). All free, on Android, iOS and the web together (pure web code plus the server), and nothing that adds a tap during a set.

## Mastery stars (`src/lib/mastery.ts`)

- Every exercise earns up to four stars from the sets logged of it: **25, 100, 300 and 1,000** (`MASTERY_SETS`).
- Every `set` event counts once by id, bonus drop and rest-pause sets too. Warm-ups are their own event type, so they never count, and a rehab part's sets (`partId === "rehab"`) don't either: they aren't training the lift.
- **Derived from the event log every time, never stored**, like XP and badges: imported history counts, a deleted workout takes its sets with it, and devices merge without conflict. `game()` returns the counts as `mastery`.
- Muscle families (`familySets`): each set counts once for the family of its exercise's first main muscle (`familyOf` in `theme.ts`); cardio counts for none.
- Shown: a card on the exercise page (`MasteryCard`: stars, sets, a bar to the next star and what stars unlock, with the `mastery` glossary "i"), next to the exercise's name on the workout screen (`LiftStars`, display only; it counts the one lift from deferred events rather than the whole game, so Log set paints first), the five most mastered lifts on Awards above the Locker (`MasteryList`, each opening its exercise page), and on Done for the lifts whose stars went up in that workout (`MasteryDone`, `starsGained`).

## What it unlocks (`MASTERY_ITEMS`, `BADGE_ITEMS` in `game.ts`)

Three new Locker groups, kinds `figure`, `frame` and `title`, saved on `profile.cosmetics` (which syncs). **None of them comes from a crate**: the crate pool stays the old kinds only (`CRATE_KINDS`: accent, sound, plates), so every crate already opened still holds what it held, and every new item has a sure path. The Locker hint for a mastery item says what's left ("log 500 sets for legs, 120 so far"), for a badge item its badge.

- **Figure colours** for every 3D figure in the app (demos, stretches, the recovery map, Health). Hologram is everyone's. Cobalt 500 push sets, Aqua 500 pull sets, Violet 500 leg sets, Rose 300 core sets, Mint three lifts at two stars, Gold a three-star lift, Platinum a four-star lift. Applied once in `App.tsx` through `setFigureColour` (`demo/colours.ts`), which both renderers read; the website's figures never set it.
- **Share card frames** from personal bests and plate clubs: Iron (bench plate club bronze), Silver (personal bests silver), Chrome (squat plate club silver), Gold (personal bests gold), Ember (deadlift plate club gold), Platinum (personal bests platinum). A gradient border drawn on every share card (`setCardFrame`, `drawFrame` in `shareImage.ts`); No frame is everyone's.
- **Profile titles** (`src/lib/titles.ts`): fixed words under the name on the Friends profile and its public page, never typed, so nothing to moderate. From badges: Early bird, Regular, Weekend warrior, Comeback kid, Explorer, Centurion, Streak keeper, Record breaker. Three name the lift that earned them: "{lift} devotee" (two stars), "specialist" (three) and "master" (four), saved as `title-devotee:<exerciseId>`; the Locker offers one chip per lift with enough stars.

## Titles on the server

- `social_profiles.title` (`COLUMNS` in `db.ts`), read with the profile rows the server already reads (no new query). `update` takes `title`; anything that isn't one of the known shapes (`parseTitle`) is saved as "" (`titleOf`).
- **The server checks only the shape**, not that the lifter earned it: unlocks are worked out from the lifter's own events on the device, like avatars and levels. Faking one means editing your own app's requests to show a few fixed words, which harms nobody.
- The app sends it with the avatar and lifts (`profileChanges`, `useProfileSync` in `Friends.tsx`), only when it changed. The person page shows it in gold above the tagline (`AboutLine`); the public page in the reader's language (`titleWords` in `src/server/titleWords.ts`, which reads the catalogues directly because server pages don't load the app's).
- Older cached profiles have no `title`, so it's optional in `SocialProfile` and `PersonCard`.

## Gating

The Locker and Awards open with the existing unlocks (Awards after one workout, the Locker with seasons after five, [Features that unlock as you train](unlocks.md)); Done's prize cards for new items wait for the Locker's unlock. The exercise page card and the workout screen's stars show from the start.
