# App Store listing

The text for App Store Connect › App Information and the English (Canada) store listing. Melvin pastes the text and uploads the screenshots; nothing here goes to the App Store by itself. **iPhone 6.1" / 6.3" screenshots** (1179×2556, required by Connect): `store/appstore/iphone-6.1/`, composed by `scripts/play-compose.mjs` from the same raw captures as Play (taller frame, same aurora and captions — never resize Play's 1080×1920 JPGs; Connect rejects those dimensions, and padding or cropping looks wrong).

```bash
npm run build:static
node scripts/play-capture.mjs
node scripts/play-compose.mjs   # also writes store/appstore/iphone-6.1/
```

Rules for this text (Apple's metadata policy plus our own):
- Only features that ship on iPhone today. Apple Watch is in; Wear OS and Health Connect stay out of this listing. Cloud connections that still say "Coming soon" stay out. No prices: the store shows them.
- No other apps' names, no "best" or "#1", no testimonials, no emoji, no all caps.
- Every URL uses `www` (Melvin, 2026-11-09).

## Contact and review

| Field | Value |
| --- | --- |
| Support URL | https://www.getliftsmith.com |
| Marketing URL | https://www.getliftsmith.com |
| Privacy policy | https://www.getliftsmith.com/privacy/ |
| Category | Health & Fitness |
| Secondary | Lifestyle (optional) |

**App Review Information** (same as Play's Sign in details):

- **Sign-in required:** Yes (Pro features; the free app works without an account)
- **User name:** review@getliftsmith.com
- **Password:** the 12-digit `REVIEW_SIGNIN_CODE` in Vercel (never commit it)
- **Notes:**

> No account is needed to use the app: finish the short setup and every screen is reachable. This account has all Pro (paid) features, with no purchase or trial. To sign in: Settings > Account and sync > Continue with email. Enter the username above, tap "Email me a code" (no email is sent to this address), type the password above into the Code box, then tap Sign in. The code is reusable and never expires. Pro includes adaptive workouts, the recovery map and advanced stats. Sign in with Apple and Sign in with Google are also available on this build.

App Privacy answers: `docs/PRIVACY_LABELS.md`. Age rating: [Friends](decisions/friends.md) "Store answers" (User-Generated Content Yes; Messaging and Chat No; Advertising No).

## Name (30 characters at most)

**Liftsmith: Gym Workout Planner** (30)

## Subtitle (30 characters at most)

**Adaptive strength workouts** (27)

## Promotional text (170 characters; can change without a new build)

**Today's workout from your gym, recovery and block. One tap logs each set. Lock-screen rest timer and Apple Watch.** (112)

## Description (4,000 characters at most)

```text
Liftsmith plans today's strength workout from the equipment at your gym, how recovered each muscle is and where you are in your training block. Then it gets out of the way while you lift.

YOUR WORKOUT, ALREADY PLANNED
• Pick a length from 15 to 90 minutes, warm-ups and rest included, and Liftsmith fills it with exercises your gym can actually do.
• Training blocks with reps in reserve that tighten week by week, then a deload.
• Double progression: hit your reps and the next session adds a rep or the weight goes up.
• A daily readiness call from your own data: push, as planned, or go easy. You can always override it.
• Or follow a classic program: 5×5, 3×5, tiered progression, training max waves, push/pull/legs, upper/lower, bodyweight skills, or your own saved routines.

EVERY NUMBER SAYS WHY
• Each exercise, set count, weight and rep target comes with a short reason in plain words.
• Tap "Why?" on any set to see the rule behind it: last session, your feedback, the week of the block and how your plates round it.
• Coach's notes spot what needs doing: a stalled lift, a muscle short of its weekly sets, fatigue building up, the last hard week of a block. Most fix in one tap.

BUILT FOR THE GYM FLOOR
• One tap logs the set as planned. The next set is always filled in.
• The rest timer starts itself and shows the next set's plates, so you can load the bar while you rest.
• Plate math for every barbell set, using the plates your gym really has.
• Rest countdown, next set and Log set on the lock screen and Dynamic Island (Live Activity).
• A 3D demo of every exercise, with the muscles it works.
• Supersets, warm-up sets, exercise swaps, notes and your own custom exercises.
• Injury mode skips or lightens exercises that load a sore area, and eases you back in.

RECOVERY AND PROGRESS
• A body map of how recovered each muscle is, from your own sets.
• Estimated one-rep max for every lift, a DOTS score, strength score and personal records.
• Weekly sets per muscle against a research-backed target.
• TDEE calculator that keeps up with your weigh-ins and how often you train.
• Body weight log and private progress photos that never leave your phone.

STAY CONSISTENT
• Streaks count weeks that meet your goal, so rest days never break them.
• Levels, weekly quests, 150+ badges and a crate after every workout.
• Workout reminders on your training days.
• Friends if you want them: post a workout for followers you approve.

ON YOUR WRIST
• An Apple Watch app shows the set, weight and reps or the rest countdown, reads heart rate from the watch, and logs the set with one tap.

YOUR DATA, YOUR PHONE
• Works fully offline. No account needed.
• Sign in with Apple, Google or email to back up and sync with the web app, if you like.
• Reads weight, height, body fat and more from Apple Health, and saves each workout there.
• Live heart rate from any Bluetooth heart rate monitor or watch that shares heart rate.
• Import your history from another app's CSV, and export your sets or a full backup any time.
• No ads, ever.

MADE FOR EVERY LIFTER
• One-handed controls for left or right hand, with hold-to-repeat buttons instead of typing.
• Text size that follows your phone, colour-blind safe colours, a high-contrast option, and VoiceOver support.
• Light and dark themes, and a Lean mode with less motion.
• In ten languages, from English and Spanish to Japanese and Korean.

LIFTSMITH PRO
The logger, plate math, rest timer, lock-screen controls, fixed programs, one adaptive workout a week and coaching reasons are free. Pro adds daily adaptive programming, splits, the recovery map, advanced stats, cloud connections, the plateau detective and the goal planner. Try it free for 14 days.

Liftsmith isn't a medical app. Talk to a doctor before starting a new training program, especially after an injury.

Questions or ideas? Send feedback from Settings or write to hello@getliftsmith.com.
```

## Keywords (100 characters, comma-separated, no spaces after commas preferred)

```text
workout,gym,strength,lifting,fitness,weights,training,exercise,planner,tracker,muscle,recovery
```

(96 characters)

## What's New (for the first release)

**First release on the App Store.** Adaptive workouts from your gym and recovery, one-tap logging, Live Activity rest timer, Apple Watch companion, Friends and Pro.

## Subscriptions (create in App Store Connect, then RevenueCat)

Subscription group **Pro** (rank high → low for upgrades Apple prorates):

| Product id | Price (USD) | Intro | Family Sharing |
| --- | --- | --- | --- |
| `coach_plus_monthly` | $39.99 | none | No |
| `coach_plus_annual` | $399.99 | none | No |
| `coach_monthly` | $19.99 | none | No |
| `coach_annual` | $199.99 | none | No |
| `pro_monthly` | match Play | 14-day free | No |
| `pro_annual` | match Play | 14-day free | Yes |

Then: Paid Apps agreement, banking and tax; sandbox testers; RevenueCat App Store app + Apple server notifications; GitHub secret `REVENUECAT_IOS_KEY` (`appl_…`).
