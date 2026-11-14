# Settings screen

Melvin asked on 2026-11-10 whether Settings had too much. The audit found one long scroll of about 40 controls and 7 buttons with no grouping, several duplicates, and rare one-time settings in prime spots. He approved every recommendation ("execute all your recommendations"), plus Pro at the very top.

## Layout (`src/components/app/Settings.tsx`)

- **Main screen:** Liftsmith Pro first, as the one tinted card (violet) with the primary button (Melvin: "it should probably be at the very top"); free lifters see what Pro adds and "See Pro", Pro lifters see their plan and "Manage your plan". Then Account (sign-in and sync), then **Gyms and equipment** (`#/gym`; 2026-11-12, when Friends took Gyms' place in the tab bar, [Friends](friends.md)), then Connected apps and Coaching, then one row per group with a line saying what's in it, then **Labs** (2026-11-10, marked Pro without Pro, `#/settings/labs`; [Camera rep counting](camera-rep-counting.md)), then Help (feedback). Every row is the one button for its page.
- **Groups**, each its own page at `#/settings/<group>` with "‹ Settings":
  - *Training:* program, goal, experience (with a glossary "i": years for each level and what it changes, Melvin 2026-11-11), schedule (training days, time, add to calendar, fit around my calendar), injuries, then "More training options" (exercise variety, build weeks before a deload, start a new block today), and Run setup again at the bottom.
  - *Workout:* one-handed controls first (they only change the workout screen), Sounds, Vibration, the rest timer (start by itself and keep the screen on as switches, then one "Alert when rest ends" switch that follows Sounds and Vibration, or is silent when off; UX audit, Melvin 2026-11-13: the five "When rest ends" chips repeated Sounds and Vibration. Older saved choices of sound only, vibration only or both still work until the switch is touched), what shows between sets (voice coach, ghost mode, plate memory, breathing or game), and "Plan details" (the old Workout preferences page, `#/training`: rest, reps, sets, effort scale, length, week start, priorities, favourites, per-exercise).
  - *Reminders:* phone notifications and email (`MessageSettings.tsx`).
  - *Look and feel:* appearance, earned themes and app icon, daily quote, language, and Accessibility (text size, colours, contrast, Lean mode as a switch).
  - *Body and units:* units, body weight shown from the last weigh-in with a link to log one on Progress, landing on the weigh-in (no second place to type it; Health weigh-ins arrive by themselves), cycle-aware readiness.
  - *Your data and privacy:* saving and backup, export sets CSV, import, usage stats (a switch, with the privacy link and install id), erase this device.
- **Old deep links still land:** `#/settings/saving` opens Your data at Saving and backup; `#/settings/themes` and `#/settings/accessibility` open Look and feel at that section (`LEGACY`).
- **Connected apps** (Health Connect, Apple Health, heart rate monitor, Strava and others) is its own page, `#/connections`, built in its own thread; Settings has one row for it.
- **Every row on the Settings screen has its own icon** (UX audit, 2026-11-13): Account is a lock, Gyms a pin, Connected apps a link, Coaching people, Training a target, Workout a dumbbell, Look and feel a moon, Data and privacy layers and Labs a light bulb, so no two rows read as the same thing.

## What moved or merged

- **Days a week is the training-day chips.** Picking days sets `daysPerWeek` to how many are picked (at least one), so the plan, reminders and the calendar can't disagree. `trainingDays(profile)` in `calendar.ts` is the one reader; if setup is run again with a new days-a-week, the goal wins and the days are spread out again.
- **Your name** moved to the Account page. **Redeem a code** lives on the Pro page only (below the plans). **Tools** left Settings (it's on Progress › All tools). The big-screen dashboard button was removed separately (#144).
- On/off settings that were chip pairs are switches now: Lean mode, usage stats, start the rest timer by itself, keep the screen on.
- Smart defaults were already right: plate memory, ghost mode, auto-start rest and keeping the screen on default to on; text size, contrast and language default to Match my phone.

## Footer and Labs order (Melvin, 2026-11-14)

- The note at the foot of Settings says where the data lives: signed in, "saved on this device and synced to your account" (`settings.footer.synced`); signed out, "saved on this device only" (`settings.footer.local`). It used to say "everything is stored on this device" for everyone, which was wrong once accounts and sync landed.
- Sonos is first on Settings › Labs (`LABS` in `src/lib/labs.ts`); the rest keep their order.

## Tests

`Settings.test.tsx` (order, groups, deep links, training days setting days a week, body weight read-only), the App and Delight tests open the group pages, and `scripts/e2e-a11y.mjs` runs axe on every group page.
