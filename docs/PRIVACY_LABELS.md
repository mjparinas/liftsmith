# Store privacy labels

Answers for the Google Play **Data safety** form and the App Store **App Privacy** questions. Keep them in step with `/privacy/` (`src/app/privacy/page.tsx`), `ios/App/App/PrivacyInfo.xcprivacy` and the event allow-list in `src/lib/analyticsSchema.ts`. When any of those change, update this file in the same pull request, and update the answers in both store consoles before the next release.

Last reviewed: 2026-11-09 (subscriptions through RevenueCat added; Health Connect reads cut to weight, height, body fat and resting heart rate; privacy contact hello@getliftsmith.com).

## What leaves the device

| Data | Sent | Why | Linked to a person? |
|---|---|---|---|
| Random install id (made on first open; not an advertising id) | Yes, with usage stats | Analytics | No (no account is attached; accounts are optional and analytics never carry one) |
| Device maker, model, OS version, app version, screen, language, time zone | Yes, with usage stats | Analytics, app functionality (which devices to support) | No |
| Install source: store, Play install referrer tags, Apple Search Ads attribution, first website visit's tags and referrer | Yes, with usage stats | Analytics | No |
| Screens viewed, setup steps, features used, permission answers, workout started/finished with exercise and set counts and length | Yes, with usage stats | Analytics | No |
| Paywall views, trial starts, purchases with plan and price | Yes, with usage stats | Analytics | No |
| Subscription: install id (as RevenueCat's user id), plan, price, currency, country, trial and renewal dates, store receipt | Yes, to RevenueCat (our billing service provider), and from the stores' server notifications back to our database | App functionality (unlocking Pro), Analytics (revenue) | No |
| Country and region (from the IP address on arrival; the address isn't stored) | Yes | Analytics | No |
| Feedback message, optional email, optional screenshot, optional device details | Only when the user sends feedback | App functionality (support) | Email is given by the user |
| Reminder email address, which reminder kinds are on, consent time | Only when the user turns on email reminders (double opt-in) | App functionality, developer communications (offers only if the user turns them on) | Yes, by the email address |
| Training days and time, time zone, days a week, setup time, first and last workout times, days trained this week, streak, Pro state | Only with email reminders | App functionality (deciding when to send a reminder) | Yes, by the email address. No weights, reps or heart rate |
| Weights, reps, heart rate, body weight, Health Connect / Apple Health data, cycle data, location | **No** (stays on the device) | | |
| Advertising id (IDFA, Android advertising id) | **Never** (`AD_ID` permission removed in the manifest; no ATT prompt) | | |

Usage stats are on by default outside the EU, EEA, UK and Switzerland, and off until switched on inside them. They can be switched off in Settings › Usage stats and in the setup wizard.

## Google Play: Data safety

- Does your app collect or share any of the required user data types? **Yes.**
- Is all of the user data collected by your app encrypted in transit? **Yes** (HTTPS only).
- Do you provide a way for users to request that their data is deleted? **Yes** (Settings › Erase this device resets the install id; deletion on request through in-app feedback with the install id).
- **Shared** with third parties: **none** (Vercel, Turso, Resend and RevenueCat are service providers acting for us, which Play does not count as sharing).

Collected data types:

| Category › type | Collected | Shared | Ephemeral | Required or optional | Purposes |
|---|---|---|---|---|---|
| Location › Approximate location | Yes (country and region from IP) | No | No | Required | Analytics |
| App activity › App interactions | Yes | No | No | Optional (user can turn off) | Analytics |
| App activity › Other user-generated content | Yes (feedback message) | No | No | Optional | App functionality |
| App info and performance › Diagnostics | Yes (device details on feedback, app version) | No | No | Optional | Analytics, App functionality |
| Device or other IDs › Device or other IDs | Yes (random install id) | No | No | Optional | Analytics |
| Personal info › Email address | Yes (only if given with feedback, or for email reminders) | No | No | Optional | App functionality, Developer communications |
| Health and fitness › Fitness info | Yes, only with email reminders: workout times and counts, never weights, reps or heart rate | No | No | Optional | App functionality |
| Financial info › Purchase history | Yes (plan and price of a purchase; RevenueCat checks the receipt) | No | No | Optional | App functionality, Analytics |
| Health and fitness › Health info | **No** (stays on the device) | | | | |

Health Connect: the permissions declaration form still applies to the on-device reads and writes (see `public/privacypolicy.html`). Declare only READ_WEIGHT, READ_HEIGHT, READ_BODY_FAT and READ_RESTING_HEART_RATE (setup, weigh-ins, TDEE) and WRITE_ACTIVE_CALORIES_BURNED and WRITE_HEART_RATE (finished workouts). Privacy policy URL: https://www.getliftsmith.com/privacy/.

## App Store: App Privacy

- Do you or your third-party partners collect data from this app? **Yes.**
- **Data used to track you: none.** No IDFA, no ATT prompt, no data broker or ad network.
- **Data linked to you** (only when the user sends feedback or turns on email reminders): Contact Info › Email Address (App Functionality; Developer's Advertising or Marketing, for Pro offers the user turns on); User Content › Other User Content (the feedback message and screenshot); Health & Fitness › Fitness (with email reminders only: workout times and counts, for App Functionality).
- **Phone reminders** are local notifications scheduled on the device and collect nothing.
- **Data not linked to you:**
  - Identifiers › Device ID (random install id): Analytics.
  - Usage Data › Product Interaction: Analytics.
  - Diagnostics › Other Diagnostic Data: Analytics, App Functionality.
  - Purchases › Purchase History: App Functionality, Analytics (RevenueCat checks the store receipt).
  - Location › Coarse Location (country from IP): Analytics.
- Health & Fitness: **not collected** (Apple Health data stays on the device).

The privacy manifest (`PrivacyInfo.xcprivacy`) declares the same "not linked, not tracking" types for analytics.
