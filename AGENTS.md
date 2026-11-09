# Liftsmith: guide for agents

Liftsmith is an Android-first adaptive strength training app. It plans each workout from the lifter's equipment, recovery and training block, then gets out of the way while they lift. This file records every product and technical decision made so far, and why. Follow them. If a task seems to need one changed, raise it with the owner (Melvin) first, and when a decision changes, update this file in the same change.

The full plan with stages lives in the plan doc: https://claude.ai/artifact/S24kx43ZkQ8g3gGtGew34n

## Commands

```bash
npm run dev        # http://localhost:3000 (public site), http://localhost:3000/app/ (the app)
npm test           # engine tests (Vitest)
npm run typecheck
npm run build      # static export to out/
npx cap sync android   # copy out/ into the Android shell (after npm run build)
```

There is no Android SDK in cloud sessions; APKs and AABs build in GitHub Actions (`.github/workflows/android.yml`).

## Platform parity (rule, Melvin, 2026-11-09)

- **Android and iOS ship together.** Every feature lands on both platforms in the same change: native Android code (Kotlin in `android/`) and native iOS code (Swift in `ios/`) for anything the web layer can't do. A pull request that adds or changes a native feature on one platform must do the same on the other, or say in its description why it can't (for example, a platform API that doesn't exist) and what the other platform does instead.
- Platform equivalents: Health Connect ↔ HealthKit (Apple Health); foreground-service notification ↔ Live Activity (lock screen and Dynamic Island); Play Billing ↔ StoreKit; Sign in with Google ↔ Sign in with Apple (both offered on iOS); Wear OS ↔ Apple Watch.
- CI builds both apps on every pull request that touches app code.

## Product decisions

### Positioning
- **An original app.** It borrows ideas from Fitbod (daily adaptive workouts, equipment matching, recovery map, variability setting) and Gymverse (periodized blocks with RIR and deloads, exercise swaps, lock-screen timer). It never uses their names in the UI, their art, screenshots, exercise videos or exact look. Exercise names, setup text and cues are our own.
- **Focus on the workout, not the app.** One tap logs a set as planned. The next set is always pre-filled. The rest timer starts itself. Anything optional (feedback, swaps, info) appears between sets and never adds a tap during a set.
- **Dark, trustworthy, professional.** Deep navy-black background, one blue accent (`#4c8dff`), green, amber and red reserved for status (recovery bands, warnings). Large touch targets, tabular numbers, system font (Roboto on Android).

### Name
- **Liftsmith** (Melvin chose it, 2026-11-09; the working name before was Setwise). The name is set in `src/lib/brand.ts`.
- Android package id: `com.liftsmith.app` (proposed). It must be final before the first Play upload and can never change after it.
- Site domain placeholder: `liftsmith.app` (`src/lib/site.ts`, overridable with `NEXT_PUBLIC_SITE_URL`); not yet registered.

### Training engine (src/lib)
- **Equipment and gym profiles.** Each gym has its own equipment list, bars, the exact plates owned (with counts), dumbbells, kettlebells and machine step. The generator uses only exercises whose every needed item is at the active gym (`available` in `exercises.ts`).
- **Bodyweight exercises** cover every major muscle, so a "Bodyweight" gym (hotel, park) gets full workouts. A test checks this.
- **Workout length.** A slider from 15 to 90 minutes. The plan is seeded by day and gym, so moving the slider adds or drops exercises at the end instead of reshuffling (`generator.ts`).
- **Recovery.** Each set adds fatigue to its primary muscles (full) and secondary muscles (half), less when far from failure. Fatigue fades so 90% is gone after about 48 h for small muscles and 72 h for large ones. Bands: Fresh 90%+, Ready 70%+, Recovering 40%+, Fatigued under 40% (`recovery.ts`). The generator only targets muscles at 55%+ and avoids exercises whose primary muscles are under 40%.
- **Periodization.** Blocks of 3 to 6 build weeks (default 4) then a deload week. RIR steps down across the build weeks (3, 2, 1, 0 for four weeks); the deload is RIR 4 at half the sets. Weekly sets per muscle rise from 8–12 to 12–20 by experience (`block.ts`).
- **Progression.** Double progression on top of the RIR target: hit every set's target and the next session adds a rep; at the top of the rep range, the weight goes up one loadable step and reps go back to the bottom; a miss by 2+ reps drops a step. Post-exercise feedback (too easy, too hard) shifts it one more step. First sessions start from a share of body weight scaled by experience (`progression.ts`).
- **Variability.** Consistent keeps an exercise for a muscle about 75% of the time, Balanced 50%, Variable 25%.
- **Swaps.** Alternatives share primary muscles and must be doable at the gym, ranked by muscle overlap and movement pattern. A swap marked "not available here" keeps that exercise out of plans at that gym for 14 days.
- **Plates.** Every suggested barbell weight is one the lifter's plates can make. The plate solver is a bounded knapsack (a greedy fill misses some combinations), prefers fewest plates, then heaviest first, and works in the gym's unit so 45 lb plates stay exact (`plates.ts`). Plate colours follow the common competition convention.
- **Units.** Weights are stored in kilograms; a gym's plates, bars and dumbbells are stored in the gym's unit and converted at the edges (`units.ts`).

### Workout screen
- Big target weight and reps with steppers, the barbell plate graphic for every barbell set, a big Log set button, an automatic rest timer with +30 s and Skip, and the next set's plates shown during rest so the lifter can load while resting.
- **Live workout notification and lock-screen rest timer.** On Android, a foreground service shows an ongoing notification with a live countdown, the next set and plates, heart rate, and Log set and +30 s buttons; it sounds and vibrates when rest ends. The web build falls back to a service-worker notification and an alert at rest end (`sessionNotify.ts`). On iOS this will be a Live Activity.
- The screen stays on during a workout (wake lock).

### Heart rate and health
- **Live heart rate comes over Bluetooth**, not Health Connect, because Health Connect gets Fitbit data in batches, often minutes late. Any standard heart rate broadcaster works (Heart Rate Service 0x180D): Fitbit Charge 6 and Pixel Watch "share heart rate", Polar, Garmin, Wahoo straps (`heartRate.ts`).
- **Health Connect** (Android) reads heart rate history and writes finished workouts and calories, so they show in Google's and Fitbit's apps. **Apple Health** (HealthKit) does the same on iOS.

### Stats and recovery map
- An original front and back body map (`src/components/BodyMap.tsx`) coloured by recovery band, with a legend.
- Stats: weekly sets per muscle against the target, estimated one-rep max trends (Epley), PRs, volume, session history, streaks and trophies.

### Engagement and juice (owner request, 2026-11-09)
- Duolingo-style loops and Gradelings-style juice: XP per set with PR and session bonuses, levels with titles, a training-week streak with freezes, PR celebrations (confetti, heavy haptic, fanfare), "plate club" trophies (2-plate bench, 3-plate squat, 4-plate deadlift, bodyweight bench), a post-workout crate of random cosmetics, weekly quests, customization (accent colours, plate and bar finishes, timer sounds), and opt-in nudge notifications.
- **Streaks count weeks that meet the days-per-week goal, not days**, so rest days never break a streak and nobody is pushed to train sore.
- **The line we hold:** no tricks in billing (plain prices, cancel in two taps, no fake countdowns or pre-ticked upgrades), no notifications that pretend to be something else, and no reward for training a muscle marked Fatigued. Juice goes around and between sets, never adds taps during one. All motion respects `prefers-reduced-motion`.
- XP, levels, streaks and trophies are derived from events, never stored (`game.ts`).

### Money
- **Prices (confirmed by Melvin, 2026-11-09):** Pro is $6.99 a month or $39.99 a year. The annual plan is pushed as "about $3.33 a month, less than half of Fitbod", with a 7-day free trial on the annual plan. **No lifetime plan.**
- **Free tier:** the workout logger, plate graphic, rest timer and live notification. **Pro:** adaptive programming (generator, progression, RIR blocks and deloads), the recovery map and advanced stats.
- **Billing is native:** Google Play Billing on Android and StoreKit on iOS, through a Capacitor purchases plugin. The subscription is checked on the device so Pro works offline, and verified by the server once accounts exist.
- Until billing lands, the app has a single `pro` entitlement switched on, so the paywall drops in without reworking screens.

### Accounts and sign-in
- Accounts are optional. The app works fully offline with no account; signing in turns on sync and backup.
- Sign in with Google (Android Credential Manager one-tap sheet) and Sign in with Apple (native sheet on iOS). They ship together, because Apple requires Sign in with Apple whenever an iOS app offers Google sign-in. Email sign-in is the web fallback.

### Public pages and SEO (owner request, 2026-11-09)
- Like Gradelings: statically generated pages for every exercise, muscle, piece of equipment, muscle-and-equipment pair (only pairs with 3+ exercises), exercise alternatives, tools (plate calculator, one-rep max calculator) and training guides (RIR, deloads, progressive overload). All are in `sitemap.xml` with structured data (`HowTo`, `ItemList`, `WebApplication`, `Article`, `FAQPage`), and each ends with a call to action into the app. Built from the same data as the app.
- The app (`/app/`) is `noindex` and disallowed in `robots.txt`.
- **Comparison pages** (`/compare/fitbod/`, `/compare/hevy/`, `/compare/strong/`, `/compare/gymverse/`, `/alternatives/fitbod/`): every competitor fact lives in one data file with its source URL and the date checked, and the build fails when any row is more than 90 days old. Competitors are named in text only (no logos or screenshots), with a trademark line. Claims are factual and dated, never disparaging.

## Architecture decisions

- **Stack copied from Gradelings** (`mjparinas/gradelings`): Next.js 16 static export, React 19, TypeScript, Tailwind 4, Zustand, Vitest.
- **Capacitor, not Bubblewrap (Melvin chose it, 2026-11-09).** A TWA can't run a foreground service, show a live lock-screen countdown, read Health Connect, keep Bluetooth heart rate going with the screen off, or use StoreKit (it has no iOS app). Capacitor wraps the same static export and adds those through native plugins; it also builds the iOS app. The cost is a store release for each app change.
- **Offline-first, like Gradelings.** Everything the lifter does is an event with a unique id (set, session start and end, feedback, swap), appended to IndexedDB first (`localdb.ts`). Stats, PRs, recovery, streaks, XP and progression are recomputed from events, never stored (`derive.ts`), so merging devices is order-independent and duplicate-safe. Profile and gyms are last-write-wins on `updatedAt`.
- **Sync (later):** push unsynced events and pull new ones by cursor (`POST /api/sync/`), when online, when the app becomes visible, and shortly after a change. Server on Vercel with libsql or Turso, as in Gradelings.
- **One static page for the app** with hash routes (`#/today`, `#/workout`, …), so it works offline from one cached page.
- **The active workout** is also kept in `localStorage`, so killing the app mid-set loses nothing.
- **Seeded randomness only** in the generator (`random.ts`), never `Math.random`, so plans are reproducible and testable.
- **Native code** lives in the Android project as small Capacitor plugins (WorkoutSession foreground service; Health Connect), called from `src/lib/sessionNotify.ts` and friends, which fall back to web APIs when not native.

## Open items
- Confirm the Android package id and register a domain.
- A GitHub repo for the project (cloud sessions can't create repos; Melvin to create one).
- Play Console account, Health Connect permissions declaration, privacy policy page.
