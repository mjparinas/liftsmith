# Liftsmith for Garmin watches

A Connect IQ watch app: the phone's workout on the wrist (set, weight and reps or the rest countdown, plates, heart
rate), with **Log set** on START (or a tap) and **+30 s** on DOWN (or a swipe up) during rest. The phone does all the
logging; the watch only shows the state, sends taps back and adds its own heart rate. Decisions in
[Watch apps](../docs/decisions/watch-apps.md).

- `manifest.xml`: app id `a818f48482054d7fa025f6b704934614` (the phone apps use the same id in `GarminLink.java` and
  `GarminLink.swift`; `nativeStrings.test.ts` checks they match), the watches it supports, permissions
  (Communications, Sensor) and languages.
- `source/`: `LiftsmithApp.mc` (phone messages, heart rate, the rest buzz), `WorkoutState.mc` (what the phone sent),
  `WorkoutView.mc` (the one screen), `WorkoutDelegate.mc` (buttons).
- `resources*/strings/strings.xml`: English plus Spanish, French, German, Italian and Japanese.

## Building and publishing (needs Melvin's Garmin account)

Garmin's compiler needs device files that only download with a Garmin sign-in, so this can't build in CI yet.

1. Make a free Garmin developer account at https://developer.garmin.com (Sign in, accept the Connect IQ agreement).
2. Install the SDK Manager (https://developer.garmin.com/connect-iq/sdk/), sign in, download the latest SDK and the
   devices in `manifest.xml` (or "all").
3. Install Visual Studio Code and Garmin's **Monkey C** extension, then run **Monkey C: Generate a Developer Key**
   once. Keep that key file safe and private: every update to the store has to be signed with the same key.
4. Open this `garmin/` folder in VS Code. **Monkey C: Run** opens the simulator; send it test messages from the
   simulator's Connection menu, or pair a real watch (**Monkey C: Build for Device** and copy the `.prg` to the
   watch's `GARMIN/APPS` folder over USB) with the Liftsmith phone app running a workout.
5. **Monkey C: Export Project** makes `garmin.iq`. Upload it at https://apps.garmin.com/developer/upload with the
   listing (name Liftsmith, the app icon, a few watch screenshots from the simulator, the privacy policy link
   https://www.getliftsmith.com/privacy/). Garmin reviews it, usually within a few days.
6. Once it's live, put the listing's link in `GARMIN_STORE_URL` (`src/lib/garmin.ts`) so Connected apps shows a
   "Get the watch app" button.
