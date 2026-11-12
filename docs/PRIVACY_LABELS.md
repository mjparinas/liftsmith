# Store privacy labels

Answers for the Google Play **Data safety** form and the App Store **App Privacy** questions. Keep them in step with `/privacy/` (`src/app/privacy/page.tsx`), `ios/App/App/PrivacyInfo.xcprivacy` and the event allow-list in `src/lib/analyticsSchema.ts`. When any of those change, update this file in the same pull request, and update the answers in both store consoles before the next release.

Last reviewed: 2026-11-11 (Friends added: handle, name, follows, posted workout summaries, likes, comments and reports, with an account only and shown only to approved followers; Play counts what a user chooses to show other users as collected, not shared; then public profiles: a lifter can choose to make their profile and posts public on the web, which is still user-chosen public content, so the answers below don't change). Also 2026-11-11 (Pro on the web through Stripe: when signed in, sync links the install id to the account so a store subscription gives Pro on the web and a web one on the phones; the install id and purchase history are then linked to the account, below). Before that, 2026-11-10 (feature flag checks and A/B test groups added, under the install id and only with usage stats; Play's Data safety form filled in: photos, other personal info and the install id's second purpose added below). Before that, 2026-11-09 (optional accounts with sync added: email and the synced copy of the lifter's data, linked to the account; subscriptions through RevenueCat added; Health Connect reads cut to weight, height, body fat and resting heart rate; then sleep, HRV, steps, VO2 max and respiratory rate added for the health twin; privacy contact hello@getliftsmith.com).

## What leaves the device

| Data | Sent | Why | Linked to a person? |
|---|---|---|---|
| Random install id (made on first open; not an advertising id) | Yes, with usage stats | Analytics | No (no account is attached; accounts are optional and analytics never carry one) |
| Feature flag check: the install id and which version of a feature it was shown during an A/B test | Yes, with usage stats (without them the check carries no id and nothing is recorded) | Analytics (rollouts and A/B tests) | No |
| Device maker, model, OS version, app version, screen, language, time zone | Yes, with usage stats | Analytics, app functionality (which devices to support) | No |
| Install source: store, Play install referrer tags, Apple Search Ads attribution, first website visit's tags and referrer | Yes, with usage stats | Analytics | No |
| Screens viewed, setup steps, features used, permission answers, workout started/finished with exercise and set counts and length | Yes, with usage stats | Analytics | No |
| Paywall views, trial starts, purchases with plan and price | Yes, with usage stats | Analytics | No |
| Subscription: install id (as RevenueCat's user id), plan, price, currency, country, trial and renewal dates, store receipt | Yes, to RevenueCat (our billing service provider), and from the stores' server notifications back to our database | App functionality (unlocking Pro), Analytics (revenue) | No |
| Code (a creator's or our own promo code): the code, the install id, how it arrived (link, Play install referrer, typed) and platform | Only when the user uses a code or its link; sent whether usage stats are on or off, and also set as a RevenueCat subscriber attribute | App functionality (the trial or offer, use limits), creator commission (paying the referrer) | No |
| Country and region (from the IP address on arrival; the address isn't stored) | Yes | Analytics | No |
| Feedback message, optional email, optional screenshot, optional device details | Only when the user sends feedback | App functionality (support) | Email is given by the user |
| Reminder email address, which reminder kinds are on, consent time | Only when the user turns on email reminders (the signed-in account's verified address; any other address is double opt-in) | App functionality, developer communications (offers only if the user turns them on) | Yes, by the email address |
| Training days and time, time zone, days a week, setup time, first and last workout times, days trained this week, streak, Pro state | Only with email reminders | App functionality (deciding when to send a reminder) | Yes, by the email address. No weights, reps or heart rate |
| Account: email address, sign-in methods (Google or Apple account id), session tokens (hashed) | Only when the user signs in (optional) | App functionality (sync and backup), account management | Yes |
| Synced copy: workouts and sets, notes, body weight, gyms, routines, settings and profile (including birth year and sex), and if used Health Connect / Apple Health readings, injuries and cycle logs | Only when the user signs in (optional); deleted with the account | App functionality (backup and sync to the user's own devices) | Yes, to the user's own account. Never in usage stats, never shared |
| Friends (optional, account only): handle, display name, follows, blocks, posted workout summaries (time, sets, exercises, best sets; weights only if shown), workouts sent to friends (name, exercises, sets), likes, comments, reports the user made | Only when the user joins Friends; deleted when they leave Friends or delete the account | App functionality (shown to the followers the user approves) | Yes. Shown to other users only at the user's direction; never in usage stats, never used for ads |
| Weights, reps, heart rate, body weight, Health Connect / Apple Health data, cycle data | **No** without an account (stays on the device) | | |
| Gym listings (optional, account only): gym name, equipment and weights, area rounded to about 1 km; reports on listings (account id or a one-way code from the address) | Only when the user lists a gym for lifters nearby; deleted when they unlist it or delete the account | App functionality (others nearby find the gym and add its setup) | Yes, to the account, but shown to others without who listed it |
| Location (beyond a listed gym's 1 km area), progress photos | **Never** | | |
| Advertising id (IDFA, Android advertising id) | **Never** (`AD_ID` permission removed in the manifest; no ATT prompt) | | |

Usage stats are on by default outside the EU, EEA, UK and Switzerland, and off until switched on inside them. They can be switched off in Settings › Usage stats and in the setup wizard.

## Google Play: Data safety

- Does your app collect or share any of the required user data types? **Yes.**
- Is all of the user data collected by your app encrypted in transit? **Yes** (HTTPS only).
- Do you provide a way for users to request that their data is deleted? **Yes** (Settings › Account and sync › Delete my account deletes the account and its synced copy; Settings › Erase this device resets the install id; deletion on request through in-app feedback with the install id).
- Account deletion: the app lets users create an account, so Play's account deletion form needs the in-app path above and a web link: https://www.getliftsmith.com/delete-account/ (2026-11-10: names the app, gives the in-app steps, the web app path and an email route from the account address, and lists what is deleted, kept and for how long). Deleting some data without deleting the account: **Yes** (cycle logs, email reminders and usage stats in Settings; anything else by email within 30 days).
- **Shared** with third parties: **none** (Vercel, Turso, Resend, RevenueCat and Anthropic, which may draft an answer to an email someone sends us, are service providers acting for us, which Play does not count as sharing).

Collected data types:

| Category › type | Collected | Shared | Ephemeral | Required or optional | Purposes |
|---|---|---|---|---|---|
| Location › Approximate location | Yes (country and region from IP; a listed gym's area at about 1 km, only if the user lists a gym) | No | No | Required | Analytics, App functionality |
| App activity › App interactions | Yes | No | No | Optional (user can turn off) | Analytics |
| App activity › Other user-generated content | Yes (feedback message) | No | No | Optional | App functionality |
| App info and performance › Diagnostics | Yes (device details on feedback, app version) | No | No | Optional | Analytics, App functionality |
| Device or other IDs › Device or other IDs | Yes (random install id; RevenueCat uses it to unlock Pro, and when signed in it's linked to the account so Pro follows the account; with Friends, the phone's push token so follows, comments and sent workouts can be notified) | No | No | Optional | Analytics, App functionality |
| Personal info › Email address | Yes (only if given with feedback, for email reminders, or to sign in to an account) | No | No | Optional | App functionality, Developer communications, Account management |
| Personal info › User IDs | Yes (account id, Google or Apple account id, only when signed in) | No | No | Optional | App functionality, Account management |
| Personal info › Other info | Yes, only with an account: birth year and sex in the synced profile | No | No | Optional | App functionality |
| Photos and videos › Photos | Yes, only if the user attaches a screenshot from the photo library to feedback. Progress photos are never uploaded | No | No | Optional | App functionality |
| Health and fitness › Fitness info | Yes: with email reminders, workout times and counts; with an account, the synced workouts, sets, body weight and heart rate; with Friends, the workout summaries the user posts for their followers | No | No | Optional | App functionality |
| Financial info › Purchase history | Yes (plan and price of a purchase; RevenueCat checks the receipt) | No | No | Optional | App functionality, Analytics |
| Health and fitness › Health info | Yes, only with an account: synced Health Connect readings, injuries and cycle logs, for the user's own devices | No | No | Optional | App functionality |
| App activity › Other user-generated content | Yes, with an account: exercise notes and routines; with Friends, comments, the display name and handle | No | No | Optional | App functionality |

Health Connect: the permissions declaration form still applies to the on-device reads and writes (see `public/privacypolicy.html`). Declare only READ_WEIGHT, READ_HEIGHT, READ_BODY_FAT and READ_RESTING_HEART_RATE (setup, weigh-ins, TDEE, the health twin), READ_SLEEP, READ_HEART_RATE_VARIABILITY and READ_RESPIRATORY_RATE (the health twin on the Body tab, and the Pro readiness call: "adjusts workout intensity to recovery"), READ_STEPS (the health twin and TDEE's activity level), READ_VO2_MAX (the health twin), READ_NUTRITION (calories and protein a food app logs, for the coach's notes; added 2026-11-11, so the declaration form needs it added), WRITE_EXERCISE (each finished workout as a strength training session; added 2026-11-10, so the declaration form needs it added), and WRITE_ACTIVE_CALORIES_BURNED and WRITE_HEART_RATE (finished workouts). The Wear OS app adds BODY_SENSORS (up to Wear OS 5) and READ_HEART_RATE (Wear OS 6's own health permission) for the watch's heart rate sensor while a workout runs, and FOREGROUND_SERVICE_HEALTH for that workout; the foreground service declaration needs a video of a workout on the watch for it (added to the form 2026-11-12). Privacy policy URL: https://www.getliftsmith.com/privacy/.

## App Store: App Privacy

- Do you or your third-party partners collect data from this app? **Yes.**
- **Data used to track you: none.** No IDFA, no ATT prompt, no data broker or ad network.
- **Data linked to you** (only when the user signs in, sends feedback or turns on email reminders): Contact Info › Email Address and Identifiers › User ID (signing in; App Functionality); Health & Fitness › Health and Fitness, and User Content › Other User Content (the synced copy of the user's data, with an account only; App Functionality); Contact Info › Email Address (App Functionality; Developer's Advertising or Marketing, for Pro offers the user turns on); User Content › Other User Content (the feedback message and screenshot); Health & Fitness › Fitness (with email reminders only: workout times and counts, for App Functionality). Identifiers › Device ID and Purchases › Purchase History (signed in only: sync links the install id to the account, so Pro bought in the store, on the web or with a code follows the account; App Functionality).
- **Phone reminders** are local notifications scheduled on the device and collect nothing.
- **Data not linked to you:**
  - Identifiers › Device ID (random install id): Analytics.
  - Usage Data › Product Interaction: Analytics.
  - Diagnostics › Other Diagnostic Data: Analytics, App Functionality.
  - Purchases › Purchase History: App Functionality, Analytics (RevenueCat checks the store receipt).
  - Location › Coarse Location (country from IP): Analytics.
- Health & Fitness without an account: **not collected** (Apple Health data stays on the device). With an account it's synced to the user's own account (above), never used for tracking.
- Apple Health reads also include **sex and date of birth** (2026-11-10, Your stats): only the birth year is kept, in the profile, the same field the lifter can type. Health Connect has neither, so Android's declaration is unchanged.

The privacy manifest (`PrivacyInfo.xcprivacy`) declares the same "not linked, not tracking" types for analytics.
