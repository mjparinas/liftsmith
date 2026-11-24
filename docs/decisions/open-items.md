# Open items

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

## Public launch: web and Android (2026-11-11)

Done before launch: Google sign-in for the web and Android, Android billing (Play `pro` subscription, RevenueCat, the webhook; a test trial went through on version 7), Stripe live payments on the web, Firebase push for Android Friends (`GOOGLE_SERVICES_JSON`, `FCM_SERVICE_ACCOUNT_JSON`), the analytics database and admin variables, the privacy, terms and delete-account pages on www, Vercel Web Analytics, and the MediaPipe runtime and pose model served from our own origin.

**Live on Google Play** (approved 2026-11-23): https://play.google.com/store/apps/details?id=com.getliftsmith.app. Site badges and FAQ say so (`STORE_LINKS.googlePlay` in `src/lib/site.ts`, `NEXT_PUBLIC_GOOGLE_PLAY_URL` in Vercel). The App Store badge still says "Coming soon" until iOS ships.

**Sent for review on 2026-11-12** (Play Console submission 1): Production 0.1.0 (build 17, full rollout, the 95 countries in [Google Play review](google-play-review.md)), the store listing from `docs/PLAY_LISTING.md`, and every App content declaration: Data safety, the content rating retake, Target audience (18 and over), Health apps (with READ_NUTRITION and the Wear OS app's heart rate permissions), Advertising ID: No, Sign in details, and the foreground service declaration. That declaration has two unlisted YouTube videos: special use for the phone's lock-screen workout notification, and health for the Wear OS app's workout with heart rate (recorded on a Wear OS emulator paired with a phone emulator). Play no longer has a "Contains in-app purchases" tickbox; it shows that from the subscription and the content rating answers. What's left:

1. **Wear OS on Play** (paused 2026-11-23 after a Wear App Quality rejection): the Wear OS form factor was removed from Play Console (Advanced settings › Form factors), and Release no longer uploads the Wear AAB (`release.yml`; the bundle still builds into the artifact). When ready again: add Wear OS as a form factor, restore the `wear:internal` upload step, put a build on Wear production (version code +100,000,000 in `android/wear/build.gradle`), accept "Proceed anyway" on the version code warning if shown, and send it from Publishing overview. Fix the Wear quality issue first ([Watch apps](watch-apps.md) "Finding the phone").

### Android Release uploads (Health apps, 2026-11-22 → resolved 2026-11-23)

Play blocked commits with **"You must let us know whether your app includes any health features"** until App content › **Health apps** was current (Activity and fitness, Nutrition and weight management, Period tracking, and **Exercise** for `READ_EXERCISE`; not Sleep or Physical therapy). While that was critical, [#634](https://github.com/mjparinas/liftsmith/pull/634) set `changesNotSentForReview: true` so the AAB could land without auto-sending review. Once the form cleared, Play started auto-sending review and refused that flag (**"The query parameter changesNotSentForReview must not be set"** — Release run 62). The flag and the misleading Health apps follow-up step are removed; upload failures show Play's own error again.

Also still due on that form / Data safety when those releases reach production: approximate location purpose for gym listings, and Health Connect's Exercise (read) as below.

After launch, not blocking it:

- **Play Data safety, gym listings** (2026-11-12, [Gym sharing](gym-sharing.md)): in App content › Data safety, add App functionality to Location › Approximate location's purposes, because a listed gym's area (about 1 km) is kept with the account. Do it before the release that carries gym listings reaches production.

- **Cheers: drop the 30-second check where push works** — **Done** (2026-11-22, [Friends](friends.md) "Training now and cheers"): Android with a registered push token skips the 30-second `cheers` read; open, after each set and cheer pushes still load cheers. iPhone keeps the timer until APNs is set; the web keeps it (no push). Watch the `/api/social/` request rate on the admin System tab as usage grows.
- **Store listing experiments** (growth item 7, [Growth](growth.md) "Still for Melvin"): in Play Console, one experiment at a time, on the icon, then the first screenshot, then the short description. Spanish, French, German, Italian and Japanese are drafted in `docs/PLAY_LISTING_TRANSLATIONS.md`. Still to write: Portuguese (Brazil), Korean, Polish and Turkish. App Store listing experiments wait until iOS ships.
- **Partner directories** (growth item 8, after Play approval): list Liftsmith on the Garmin Connect IQ store, the Health Connect app list, the Apple Health app list, the Oura and Withings partner pages, AlternativeTo, SaaSHub and Product Hunt. [Connected apps](connected-apps.md) records the developer consoles for the keys, not a submission URL for these directories.
- **Connected keys Melvin creates** (2026-11-15, [Connected apps](connected-apps.md) "Keys Melvin creates"): each service is built and shows "Coming soon" until its keys are in Vercel (Production and Preview). Once one goes live: move its features page row from Investigating to yes, and add its weekly email and blog post.
  - [x] **Oura** — keys are in (2026-11-11). Still open: app review (capped at about 10 users) and written consent for a paid feature. Redirect `https://www.getliftsmith.com/api/connect/oura/callback/`.
  - [ ] **Strava** — https://www.strava.com/settings/api. Authorization Callback Domain `www.getliftsmith.com`.
  - [ ] **WHOOP** — https://developer-dashboard.whoop.com. Redirect `https://www.getliftsmith.com/api/connect/whoop/callback/`.
  - [ ] **Garmin Connect Developer Program** — https://developer.garmin.com/gc-developer-program/overview. Redirect `https://www.getliftsmith.com/api/connect/garmin/callback/`. Ping (not Push) for Dailies, Sleeps, HRV, Body Compositions, Activities and Deregistration, each to `https://www.getliftsmith.com/api/connect/garmin/push/`.
  - [ ] **Withings** — https://developer.withings.com. Callback `https://www.getliftsmith.com/api/connect/withings/callback/`.
  - [ ] **Polar** — https://admin.polaraccesslink.com. Callback `https://www.getliftsmith.com/api/connect/polar/callback/`.
  - [ ] **Concept2** — https://log.concept2.com/developers. Redirect `https://www.getliftsmith.com/api/connect/concept2/callback/`.
- **Not doing:** Garmin's Training API and posting finished lifts to Garmin Connect. The Connect IQ watch app already shows the live workout. Leave both out unless Melvin reopens them ([Connected apps](connected-apps.md)).
- **Play Health Connect declaration: add READ_EXERCISE** (2026-11-19, [Workouts from other apps](outside-workouts.md)): App content › Health apps, add Exercise (read) for "Count workouts from other apps" (runs, rides and sports from other apps tire muscles in the recovery map and move the adaptive plan). Do it before the release that carries it reaches production.
- Validate camera rep counting on real recorded lifts.
- Creator program: add each creator in /admin/ › Creators (Android's 30-day offers exist); payouts are sent by hand from the CSV. The iPhone side is under iOS below.
- Official Google Play and App Store badge artwork for the home page, and real beta-tester quotes to replace the sample testimonials (samples never show on the live site).
- A dedicated RevenueCat service account in Google Cloud, so `liftsmith-admin@` can drop Pub/Sub Admin.
- Profile links (`/app/#/person/<handle>`) open the installed app on Android (App Links) and the web app on iPhone until Universal Links exist. Public profiles' own pages (`/u/<handle>/`) are web pages anyway.

## iOS (App Store path, 2026-11-23)

Code and site wiring for the iPhone release. Console steps Melvin still finishes are marked **Melvin**. Listing copy to paste is in [APP_STORE_LISTING.md](../APP_STORE_LISTING.md).

### Done in the repo / Vercel (2026-11-23)
- `App.entitlements`: `aps-environment` production, Associated Domains `applinks:www.getliftsmith.com` (Push and Associated Domains must also be on the App ID in the Developer portal — **Melvin** if not already).
- `Info.plist`: `remote-notification` background mode; `ITSAppUsesNonExemptEncryption` false (export compliance).
- `public/.well-known/apple-app-site-association` for team `VLJC5F4469` on `/app` and `/invite`; `vercel.json` serves it as `application/json`.
- `startAppLinks` handles iOS Universal Links as well as Android App Links.
- Friends push server keys: `APNS_KEY_P8` / `APNS_KEY_ID` (`49G753BURJ`) / `APNS_TEAM_ID` in Vercel (from the APNs auth key in Downloads). Redeploy production so the running server picks them up.

### Still Melvin (blocks TestFlight / review)
- **GitHub Release secrets** (`gh auth` was expired on this machine, so these weren't set from here): `APPLE_TEAM_ID` (`VLJC5F4469`), `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` (App Store Connect API key, App Manager). Without these, `release.yml` skips the iOS · TestFlight job. After `gh auth refresh`: `printf '%s' 'VLJC5F4469' | gh secret set APPLE_TEAM_ID`.
- **App Store Connect app** for `com.getliftsmith.app` (create if missing), listing from [APP_STORE_LISTING.md](../APP_STORE_LISTING.md), App Privacy from `docs/PRIVACY_LABELS.md`, age rating from [Friends](friends.md) "Store answers", review account notes (same as Play).
- **Billing on iPhone:** Paid Apps agreement, banking and tax; Pro group `pro_monthly` / `pro_annual` (14-day free intro, Family Sharing on annual); coach products `coach_monthly` / `coach_annual` / `coach_plus_monthly` / `coach_plus_annual` ranked above Pro; sandbox testers; RevenueCat App Store app + Apple server notifications; GitHub `REVENUECAT_IOS_KEY` (`appl_…`).
- **App ID capabilities in the Developer portal:** Push Notifications, Associated Domains, Sign in with Apple, HealthKit (and watch app HealthKit if automatic signing doesn't register it).
- **Sign in with Google on iPhone:** create an iOS OAuth client in Google Cloud (project `liftsmith-514303`, bundle `com.getliftsmith.app`) and put its id in `GOOGLE_IOS_CLIENT_ID` (`src/lib/authIds.ts`). Until then the iPhone app has no Google button (Apple + email still work).
- After approval: set `NEXT_PUBLIC_APP_STORE_URL` so the site badge links to the listing.

### Device checks (not blocking first review)
- **Volume button logs a set on iPhone** (Labs, `VolumeKeysPlugin.swift`): built and compiled in CI, but not yet tried on an iPhone. Check that a press from the buttons and from earbuds logs once, music keeps playing, and no volume pop-up shows.
- **Voice set logging on iPhone** (Labs, `SpeechLogPlugin.swift`): built and compiled in CI, but not yet tried on an iPhone. Check the speech recognition and microphone prompts, that recognition stays on the device for each of the six languages, and that music comes back after listening.
- **Share cards on screenshot on iPhone** (2026-11-16, [Sharing](sharing.md)): `ScreenshotsPlugin` in `DelightPlugins.swift` is built and compiled in CI but not tried on an iPhone. Check that a screenshot opens the sheet once, not during a workout or over another sheet, and that the screenshot is still saved to Photos.
- ~~**Sign in with Apple**~~ (done 2026-11-23): Services ID `com.getliftsmith.web`, Vercel `NEXT_PUBLIC_APPLE_SERVICES_ID` + `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY`; web smoke test signed in. iPhone native path still to try when an iOS build is on a device.
- **Watch rep counting on Apple Watch** (Labs, 2026-11-11): the watch app streams Core Motion during a set (`MotionStream` in `WatchModel.swift`) and the phone counts it like Wear OS's. It hasn't been tried on an Apple Watch yet; check a set of squats and curls counts, and that the sign of "up" is right (if every count comes out at zero on a lift that should count, flip the sign in `MotionStream.add`).
- **Health twin's "Open the Health app" on iPhone** (2026-11-11): `HealthWorkout.openPermissions` opens the Health app with `x-apple-health://` and falls back to Liftsmith's page in Settings. It hasn't been tried on an iPhone yet; check it opens Health when the HRV or VO₂ max tile has no data.
- **iPhone home-screen widgets** (Melvin, 2026-11-10: skipped for now). The Today widget (PR #150), and since 2026-11-15 the This week and Recovery widgets (`RecoveryWeekWidgets.swift`), work on Android, but on iPhone it shows only its plain Start and Log set buttons until the widget extension can read the app's data. To turn it on: in the Apple Developer portal, create the App Group `group.com.getliftsmith.app` and enable it on the App IDs `com.getliftsmith.app` and `com.getliftsmith.app.widgets`; then add the App Group entitlement to both Xcode targets (the app's `App.entitlements` and a new one for `LiftsmithWidgets`) and drop the gap from [Platform deltas](platform-deltas.md). The code already writes and reads the group (`WorkoutSessionPlugin.setWidget`, `QuickStartWidget.swift`).
