# Liftsmith: guide for agents

Liftsmith is an Android-first adaptive strength training app. It plans each workout from the lifter's equipment, recovery and training block, then gets out of the way while they lift. This file records every product and technical decision made so far, and why. Follow them. If a task seems to need one changed, raise it with the owner (Melvin) first, and when a decision changes, update this file in the same change.

The full plan with stages lives in the plan doc: https://claude.ai/artifact/S24kx43ZkQ8g3gGtGew34n

## Commands

```bash
npm run dev                  # http://localhost:3000 (public site), http://localhost:3000/app/ (the app)
npm test                     # unit + integration tests (Vitest; engine in node, screens in jsdom)
npm run test:coverage
npm run test:mutation        # Stryker on the engine; report in reports/mutation/
npm run lint && npx tsc --noEmit
npm run build                # static export to out/
node scripts/e2e.mjs         # full playthrough (serves out/ itself, or pass a base URL)
node scripts/e2e-offline.mjs # real offline after one visit
node scripts/e2e-devices.mjs # layout on 8 phones and tablets
node scripts/e2e-a11y.mjs    # axe WCAG 2.2 AA on every screen
npx cap sync                 # copy out/ into the Android and iOS shells (after npm run build)
```

There is no Android SDK in cloud sessions; APKs and AABs build in GitHub Actions (`.github/workflows/android.yml`).

## Platform parity (rule, Melvin, 2026-11-09)

- **Android and iOS ship together.** Every feature lands on both platforms in the same change: native Android code (Java or Kotlin in `android/`) and native iOS code (Swift in `ios/`) for anything the web layer can't do. A pull request that adds or changes a native feature on one platform must do the same on the other, or say in its description why it can't (for example, a platform API that doesn't exist) and what the other platform does instead.
- Platform equivalents: Health Connect ↔ HealthKit (Apple Health); foreground-service notification ↔ Live Activity (lock screen and Dynamic Island); Play Billing ↔ StoreKit; Sign in with Google ↔ Sign in with Apple (both offered on iOS); Wear OS ↔ Apple Watch.
- CI builds both apps on every pull request (`android` and `ios` jobs in `ci.yml`).
- **Live workout notification today:** Android runs a foreground service (`WorkoutService.java`) with an ongoing notification: lock-screen rest countdown (chronometer), next set and plates, heart rate, and Log set / +30 s buttons, plus a rest-over alert. iOS (`WorkoutSessionPlugin.swift`) schedules a time-sensitive rest-over notification with the same two buttons. The iOS lock-screen countdown needs a Live Activity (a widget extension target), which is the next parity item. Both are driven by the same `WorkoutSession` calls in `src/lib/sessionNotify.ts`.
- Native code registered by the app: Android `MainActivity.registerPlugin`, iOS `MainViewController.capacitorDidLoad` (Capacitor 8 with SPM doesn't auto-register app-target plugins).
- Native apps open straight into the app (`server.appStartPath: /app/index.html`); the landing page is for the website.

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

### Setup wizard (Melvin, 2026-11-09)
- First run opens a short wizard (`src/components/app/Onboarding.tsx`): goal and experience; gym and units; days a week and body weight; notifications and a heart rate monitor. Health connections (Health Connect, Apple Health, readiness sources) join it as they land, and should prefill age, body weight and height when the user allows it.
- **It can be run again** from Settings ("Run setup again", `#/setup`). A rerun keeps existing gyms unless the user picks one to add, and never touches workout history.
- One question per screen, big tiles, every step optional except the first three, under a minute in total.

### Workout screen
- Big target weight and reps with steppers, the barbell plate graphic for every barbell set, a big Log set button, an automatic rest timer with +30 s and Skip, and the next set's plates shown during rest so the lifter can load while resting.
- **Live workout notification and lock-screen rest timer.** On Android, a foreground service shows an ongoing notification with a live countdown, the next set and plates, heart rate, and Log set and +30 s buttons; it sounds and vibrates when rest ends. The web build falls back to a service-worker notification and an alert at rest end (`sessionNotify.ts`). On iOS this will be a Live Activity.
- The screen stays on during a workout (wake lock).

### Heart rate and health
- **Live heart rate comes over Bluetooth**, not Health Connect, because Health Connect gets Fitbit data in batches, often minutes late. Any standard heart rate broadcaster works (Heart Rate Service 0x180D): Fitbit Charge 6 and Pixel Watch "share heart rate", Polar, Garmin, Wahoo straps (`heartRate.ts`).
- **Health Connect** (Android) and **Apple Health** (iOS) go through one plugin, `@capgo/capacitor-health` (`src/lib/health.ts`). Reads (weight, height, body fat, resting HR, HRV, sleep, HR) prefill the wizard's body weight step ("Fill in from Health Connect / Apple Health"). Finished workouts are written as active calories (about 5 METs) and average HR, because the plugin can't write workout sessions yet. The Android Health Connect privacy rationale is `public/privacypolicy.html`.
- Native heart rate uses `@capacitor-community/bluetooth-le` on both platforms (keeps reading with the screen off; iOS has the `bluetooth-central` background mode). The web build keeps Web Bluetooth.

### Integrations roadmap (Melvin agreed, 2026-11-09; research: https://claude.ai/artifact/UoDvYPVgFxt8wwPuJJS7KH)
1. **MVP:** Health Connect + HealthKit reads to prefill the wizard, plus writing finished workouts. Bluetooth 0x180D stays the only live heart rate path (straps, Garmin/Polar/Whoop broadcast, Fitbit Charge 6, Pixel Watch). The wizard's connect step offers Health access and heart rate pairing only.
2. **Next: readiness.** An on-device readiness score from sleep, HRV and resting HR against a 30-day baseline, plus a pre-workout check-in (energy, soreness, feeling unwell). It feeds `generator.ts`/`block.ts` as a low/normal/high adjustment the lifter can override. **Readiness auto-adjust is a Pro feature.**
3. **Next: music.** Mood playlists chosen in the same check-in and opened by deep link (saved or curated playlists). **No Spotify API** (development mode is capped at 5 users, extended access needs 250k MAU, audio features were removed).
4. **With sync/server:** Strava upload (needs a Strava subscription; 10 athletes before review).
5. **Later, on demand:** Oura and Whoop direct APIs (server side, 10-user caps; Oura needs written consent for a paid feature).
- **Skipped:** Hume Health direct (no API; its data arrives through Apple Health), live SpO2, the Google Health API, aggregators, and volume-follows-intensity (Android only, since iOS can't control other apps' volume, so it's skipped for platform parity).

### Stats and recovery map
- An original front and back body map (`src/components/BodyMap.tsx`) coloured by recovery band, with a legend.
- Stats: weekly sets per muscle against the target, estimated one-rep max trends (Epley), PRs, volume, session history, streaks and trophies.

### Engagement and juice (owner request, 2026-11-09)
- Duolingo-style loops and Gradelings-style juice: XP per set with PR and session bonuses, levels with titles, a training-week streak with freezes, PR celebrations (confetti, heavy haptic, fanfare), "plate club" trophies (2-plate bench, 3-plate squat, 4-plate deadlift, bodyweight bench), a post-workout crate of random cosmetics, weekly quests, customization (accent colours, plate and bar finishes, timer sounds), and opt-in nudge notifications.
- **Streaks count weeks that meet the days-per-week goal, not days**, so rest days never break a streak and nobody is pushed to train sore.
- **The line we hold:** no tricks in billing (plain prices, cancel in two taps, no fake countdowns or pre-ticked upgrades), no notifications that pretend to be something else, and no reward for training a muscle marked Fatigued. Juice goes around and between sets, never adds taps during one. All motion respects `prefers-reduced-motion`.
- XP, levels, streaks and trophies are derived from events, never stored (`game.ts`).

### Money
- **No ads, ever** (Melvin, 2026-11-09). No ad SDKs, sponsored placements, interstitials or rewarded videos, in either app or on the site. The subscription is the only revenue.
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

## Testing (Melvin asked, 2026-11-09: like Gradelings)

- **Unit tests** (`src/lib/*.test.ts`, node) for every engine rule: plates, recovery, blocks, progression, generator, stats, game.
- **Component and integration tests** (`*.test.tsx`, `// @vitest-environment jsdom`, Testing Library, fake-indexeddb): the whole app from first run to a saved workout through the real store and IndexedDB, steppers, swaps, a bodyweight gym, and a workout surviving a reload.
- **Browser tests** (Playwright, `scripts/e2e*.mjs`): playthrough, offline, a device layout sweep (no sideways scroll, Log set fully on screen and 48 px+, controls 44 px+), and axe WCAG 2.2 AA with no serious or critical problems. Any console error fails a run.
- **Mutation tests** (Stryker, `stryker.config.mjs`, Gradelings' Vitest 5 runner in `scripts/stryker-vitest5.mjs`) on the engine; the run fails below the `break` score. It is a ratchet: the first run scored 34%, so `break` is 30 for now; raise it (target 60, Gradelings aims for 85) as engine tests land.
- A bug fix comes with a test that fails without it. Flaky tests are fixed at the cause, never retried.
- Colour tokens must pass contrast: `--color-faint` was raised to `#808c9d` because axe failed `#5b6777`.

## CI/CD (Melvin asked, 2026-11-09: like Gradelings)

- `.github/workflows/ci.yml` on every pull request and push to `main` and `staging`: types, lint (no warnings), dependency audit, unit and integration tests with coverage, build, then browser tests in three parallel jobs. **"CI passed"** is the one required check.
- `mutation.yml`: weekly, on demand, and on pull requests that touch the engine.
- `promote-staging.yml`: nightly, merges `staging` into `main` when CI passed on staging (copied from Gradelings).
- `ci.yml` also builds an Android debug APK (uploaded as an artifact to install and try) and an unsigned iOS simulator build on every pull request. Both are part of "CI passed".
- `release.yml`: on every promotion to `main` and on demand, builds a signed Android App Bundle and uploads it to the Play **internal** track, and archives iOS and uploads it to **TestFlight**. Version name comes from `package.json`, build number from the run number. Each platform skips itself with a notice until its secrets exist. Promoting past internal testing stays a human step in the store consoles.
- Secrets: `ANDROID_KEYSTORE_B64` (base64 upload keystore, alias `upload`), `ANDROID_KEYSTORE_PASSWORD`, `PLAY_SERVICE_ACCOUNT_JSON`, `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` (App Store Connect API key, App Manager role). The first Android upload must be done by hand in Play Console before the API can upload.
- Web deploys through Vercel's Git integration: `main` is production, `staging` and pull requests get previews.
- Dependabot targets `staging`, weekly.

## Borrowed from Gradelings (Melvin asked, 2026-11-09)

Patterns from `mjparinas/gradelings` adopted for Liftsmith. Copy the Gradelings code where it fits rather than rewriting it.

- **Branches and merging:** pull requests go to `staging`; a nightly workflow promotes `staging` to `main` when CI is green (one production build a day). Agents may merge a pull request into `staging` once every check, including "CI passed", is green; never into `main`. Flaky tests are fixed at the cause, never retried.
- **Feature flags** defined in code (`src/lib/flags.ts`), state on the server, cached on the device for offline use, so a feature can be switched off without a store release. A/B tests read through the same path.
- **Admin panel** (`/admin/`, admin emails from the environment, every change audited): subscriptions, trial-to-paid, a weekly retention table, revenue, users, a read-only support role, maintenance mode and alerts. The owner's test account is left out of every metric.
- **Error reporting:** Sentry with a scrubber (no workout notes, names or health data leave the device), loaded only when something goes wrong.
- **Analytics:** Vercel Web Analytics on public pages only, plus counted clicks on calls to action. In the app, only the events needed for the admin dashboard, disclosed on `/privacy/`. Health data never leaves the device except through sync to the user's own account.
- **Security:** hashed Content Security Policy with no `'unsafe-inline'`, security headers, size-limited request bodies, hashed session tokens, `security.txt`.
- **More engagement, Gradelings-style:** streak freezes computed in `derive`, never stored; mystery crates picked from the session id so every device agrees; a weekly "you got stronger" recap; an "almost there" card ("1 more rep for a bench PR"); shareable milestone cards; seasonal events; a few Easter eggs. Nothing blocks a tap or pushes late-night use.
- **What's new** screen after an update, and **promo, referral and friends-and-family codes** (store promo codes on native).
- **Accessibility:** axe-core WCAG 2.2 AA run, keyboard run, forced-colours support, and a colour-blind check. The recovery map's colours must pass it, and every band also has a label and a percentage.
- **Browser tests like Gradelings':** a full playthrough, an offline run, a layout sweep across phones and tablets, and a tap-latency benchmark ("every tap answers within a frame or two").
- **Store tooling:** scripts that make Play and App Store screenshots and the feature graphic from the real app, plus `docs/PLAY_LISTING.md` and `docs/PLAY_CONSOLE_ANSWERS.md`.
- **Email** through Resend (receipts, weekly recap, win-back), with hashed unsubscribe tokens and the CASL mailing address.
- **Exercise demo videos** self-hosted and cached on the device for offline use, like Gradelings' help videos.
- **Data rights:** JSON export, erase device and delete account; a restore check for backups; a full-storage notice.
- **Languages:** English at launch. UI text stays in one place per screen so Spanish and French can follow, as Gradelings did.

## Open items
- Confirm the Android package id and register a domain.
- Play Console account and the Health Connect permissions declaration form; host the privacy page (`public/privacypolicy.html`) on the real domain.
- iOS Live Activity for the lock-screen rest countdown (widget extension), to match Android.
