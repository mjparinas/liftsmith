# Battery: nothing runs in the background

Melvin, 2026-11-10: "make sure the app doesn't drain the phone battery when it's not in use." Gradelings kept the phone and its Wi-Fi awake because a two-minute sync timer kept firing while the app was in the background (fixed there in Gradelings #553 by skipping the timer while the page is hidden).

## The rule

When the app is in the background (phone locked, another app in front, or a hidden browser tab), it does nothing on a timer. No polling, no redraws, no camera, no network calls except a one-off push of unsent changes as it goes to the background. Everything picks up again the moment it comes back. Work is triggered by events (a change, coming back online, returning to the app), never by a clock.

The one exception is a workout in progress: the live notification (Android foreground service, iOS Live Activity) keeps counting rest down natively, and a connected heart rate monitor keeps reading so the workout's heart rate log stays complete. Once the workout ends, by Finish, Discard, the automatic end of a forgotten workout or a sync from another device, all of that stops.

## What does what

- **Sync** (`sync.ts`) was already event-driven, which is where Liftsmith differs from Gradelings: on open, on return to the app, when back online, and 4 s after a change. There is no sync timer. Going to the background only pushes when something is waiting.
- **Feature flags and analytics** refresh on return to the app and flush once as it leaves. No timers.
- **Gym by location, reminders, language and text size** are read on open and on return, never on a timer.
- **The screen clock** (`useNow`, used by ~30 screens, every 250 ms on the workout screen) stops while hidden and jumps to the right time on return. `wakeAt` asks for a single tick at one moment while hidden; only the web uses it, for its rest-over notification, because the native apps sound their own.
- **Rest that ran out while away** doesn't chime again on return (more than 2 s late counts as already alerted).
- **Live notification updates:** a heart-rate-only change reaches the notification at most every 5 s (`HR_NOTIFY_MS` in `Workout.tsx`), instead of with every reading (about one a second), so a locked Android phone isn't redrawing its notification every second. iOS keeps its own 15 s budget on top.
- **Auto-end of a forgotten workout** (`workoutWatch.ts`): one timer set for the moment it's due (3 hours after the last activity, moved whenever the lifter does something) plus a check on return, instead of a check every minute. It also stops the live notification however a workout ends.
- **Heart rate** (`hrLink.ts`, from the heart rate auto-reconnect change): released, reconnect retries cancelled, whenever the workout ends. This matters most on iOS, where the `bluetooth-central` background mode would otherwise keep waking the app for every reading.
- **Keep screen on:** the browser drops the wake lock when the app is hidden; the workout screen asks for it again on return (it used to think it still held it).
- **Camera rep counting** closes the camera and pose model while the app is hidden and starts fresh on return.
- **3D figures** (`demo/engine.ts`) already stop rendering when off screen or hidden.
- **Service worker** only caches and handles notification taps; no background sync or periodic sync.
- **Admin panel** (website): System's auto refresh and the maintenance banner don't refresh while the tab is hidden; the banner reads again on return.

`src/lib/visibility.ts` (`isVisible`, `onVisibility`, `useVisible`) is the one place that answers "is the app on screen?". New timers go through `useNow` or check `isVisible()`; a new background behaviour needs a reason as good as the workout's. Tests: `src/lib/background.test.tsx` (an hour hidden leaves no timer and no redraw; auto-end runs from one timer; no timer without a workout).

## Platforms

Pure web code, so Android, iOS and the web get the same behaviour. The native pieces that legitimately run in the background (the Android foreground service with its chronometer and rest-over alarm, the iOS Live Activity and its scheduled rest-over notification) were checked: both are stopped by `stopSession()` and schedule single alarms, not repeating ones.
