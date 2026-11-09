# Google Play store listing

The text and art for the Play Console's **Main store listing** (Grow › Store presence). Melvin pastes the text and uploads the art; nothing here goes to Play by itself. The art is made from the real app by `scripts/play-capture.mjs` (raw screens), `scripts/play-compose.mjs` (captions and the feature graphic) and `scripts/play-video.mjs` (the promo video). Re-run all three after a visible change to Today, the workout screen, rest, Recovery, Progress or the finish screen:

```bash
npm run build:static
node scripts/play-capture.mjs   # about 2½ minutes; raw screens in store/play/raw/ (not committed)
node scripts/play-compose.mjs   # store/play/phone, tablet-7, tablet-10, feature-graphic.png
node scripts/play-video.mjs     # store/play/promo-video.mp4 (not committed; upload to YouTube)
```

Rules for this text (Play's metadata policy plus our own):
- Only features that ship today. No watch apps, no Strava/Oura/Whoop, no sync or accounts, no prices or "Pro" until billing is live.
- No other apps' names, no "best" or "#1", no testimonials, no emoji, no all caps.
- Every URL uses `www` (Melvin, 2026-11-09).

## Contact details

| Field | Value |
| --- | --- |
| Email | hello@getliftsmith.com |
| Website | https://www.getliftsmith.com |
| Privacy policy | https://www.getliftsmith.com/privacy/ |
| Category | Health & Fitness |
| Tags | Workout tracker, Strength training, Gym, Fitness, Weightlifting (pick from Play's list) |

## App name (30 characters at most)

**Liftsmith: Gym Workout Planner** (30)

Alternative: Liftsmith: Strength Training (28).

## Short description (80 characters at most)

**Adaptive gym workouts that explain every weight. Log each set with one tap.** (75)

Alternative: Smart strength workouts planned around your gym, recovery and progress. (71)

## Full description (4,000 characters at most)

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
• Rest countdown, next set and Log set button on your lock screen and in the notification.
• A 3D demo of every exercise, with the muscles it works.
• Supersets, warm-up sets, exercise swaps, notes and your own custom exercises.
• Change the plan mid-workout when time runs short or the bench is taken.
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
• Workout reminders on your training days, and a home-screen widget and quick settings tile to start a workout.

YOUR DATA, YOUR PHONE
• Works fully offline. No account needed.
• Reads weight, height and body fat from Health Connect, and saves each workout's active calories there.
• Live heart rate from any Bluetooth heart rate monitor or watch that shares heart rate.
• Import your history from a CSV export of another workout app, and export your sets or a full backup any time.
• No ads, ever.

MADE FOR EVERY LIFTER
• One-handed controls for left or right hand, with hold-to-repeat buttons instead of typing.
• Text size that follows your phone, colour-blind safe colours, a high-contrast option, and screen reader support.
• Light and dark themes, and a Lean mode with less motion.
• English, with Spanish and French translations rolling out.

Liftsmith isn't a medical app. Talk to a doctor before starting a new training program, especially after an injury.

Questions or ideas? Send feedback from Settings or write to hello@getliftsmith.com.
```

Length: checked by `src/lib/playListing.test.ts`.

When billing goes live, add this paragraph before "Liftsmith isn't a medical app", tick "Contains in-app purchases" in Play Console, and update the test:

```text
LIFTSMITH PRO
The logger, plate math, rest timer, lock-screen controls, fixed programs and coaching reasons are free. Liftsmith Pro adds adaptive programming, adaptive splits, the recovery map, advanced stats, mid-workout re-planning, the plateau detective and the goal-date planner. Try it free for 14 days.
```

## Phone screenshots (8, 1080×1920)

`store/play/phone/`. The caption is drawn on each image; the same words are here so the listing and the art agree.

| # | File | Headline | Line |
| --- | --- | --- | --- |
| 1 | 01-today.jpg | Your workout, already planned | Built from your gym, your recovery and your training block |
| 2 | 02-today-plan.jpg | Every exercise says why | Recovery, weekly sets and last time, in plain words |
| 3 | 03-workout.jpg | One tap logs the set | Target weight, plates per side and a 3D demo of every lift |
| 4 | 04-why.jpg | Why this weight? | Tap to see the rule behind every number |
| 5 | 05-rest.jpg | The rest timer runs itself | Load the next set's plates while you rest |
| 6 | 06-recovery.jpg | See what's recovered | Every muscle, from your own sets |
| 7 | 07-progress.jpg | Your coach says what to do next | Spot stalls and short muscles early, fix them in one tap |
| 8 | 08-done.jpg | PRs, levels and badges | Every workout moves you forward |

## Tablet screenshots (7, 7-inch 1080×1920 and 10-inch 1440×2560)

`store/play/tablet-7/` and `store/play/tablet-10/`: Today, the plan with reasons, Recovery, Progress, one-rep max / DOTS / PRs, TDEE, and achievements.

## Feature graphic (1024×500)

`store/play/feature-graphic.png`: the icon, "Your next set, already planned." and two real screens. Play may put a play button over the middle when there is a video, so the text sits on the left. It uses `public/icon.svg` until the new app icon lands; save the new icon as `store/play/icon-512.png` and re-run `play-compose.mjs` and `play-video.mjs`.

## Promo video

Play takes a YouTube link. Upload `store/play/promo-video.mp4` (1920×1080, about 31 s, no sound) to YouTube as public or unlisted, with ads off, and paste the link. Add music in YouTube Studio's audio library if you want sound (royalty-free only).

Storyboard (each scene about 3.6 s with a slow push-in and crossfades; `SCENES` in `play-video.mjs`):

| Time | Scene | On screen |
| --- | --- | --- |
| 0–3 s | Title card | Icon, "Liftsmith", "Your next set, already planned." |
| 3–6 s | PLAN · Today | "Your workout, already planned" |
| 6–9 s | EXPLAIN · Today's plan | "Every exercise says why" |
| 9–12 s | LIFT · Workout | "One tap logs the set" |
| 12–16 s | REST · Rest timer | "The timer runs itself" |
| 16–19 s | TRUST · Why sheet | "Why this weight?" |
| 19–22 s | RECOVER · Body map | "See what's recovered" |
| 22–25 s | IMPROVE · Coach's notes | "Your coach says what to do next" |
| 25–28 s | CELEBRATE · Finish | "PRs, levels and badges" |
| 28–31 s | End card | "Lift with a plan." "Get Liftsmith on Google Play" |

A later cut could add live footage: the 3D lifter from the home page, a set logged with a real tap, and the lock-screen notification from an Android phone (only a real device can show it).
