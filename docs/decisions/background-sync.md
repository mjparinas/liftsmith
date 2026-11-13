# Background sync and the offline cache

Melvin, 2026-11-13: "Data should always sync in the background to make the app feel snappier and account for the fact that gyms can have bad reception. Data pulls should be from the local db/cache when offline and synced online later. A small syncing spinner should subtly show up on the screen whenever the background syncs happen. Just a small white circle outline with a gradient that spins. The friends page can show stale data but a note at the top should inform the user they're currently offline."

## The rule

**No screen waits for the network to show what it already knew.** Every screen reads from the device first and asks the server behind it. A new screen that shows something from our server follows the same rule (`liveRead`), and anything new that goes to the network in the background is wrapped in `track` so the syncing ring shows it.

## What was already local-first (audit, 2026-11-13)

- **The training log** (workouts, sets, weigh-ins, health readings, injuries, routines, profile, gyms): IndexedDB first (`localdb.ts`), pushed and pulled in the background by `sync.ts` on open, on return to the foreground, when back online and 4 s after a change. Nothing on Today, the workout, Body, Progress or Awards touches the network.
- **Friends:** the last feed, own state and suggestions are kept per account (`socialCache.ts`) and shown at once.
- **Feature flags** (`remoteFlags.ts`), **connected apps' status** (`connections.ts`), **coach's notes on Today** (`trainer.ts` `useCoachNotes`), **Pro access** (`auth.ts`): kept on the device and refreshed behind.

## What changed

- **`src/lib/liveRead.ts`.** `liveRead(key, fetch, show)` shows the copy kept on the device at once (`fresh` false), loads in the background and shows the answer (`fresh` true), and keeps it. When the server can't be reached and a copy was shown, the screen keeps it and nothing is thrown; a refusal (signed out, not allowed, gone) is still thrown so the screen can say so. Copies are kept per account in one localStorage entry (`liftsmith.reads`, the newest 40, none over 300,000 characters), dropped on sign-out (`forgetAccount` → `forgetReads`) and by the device wipe (the `liftsmith.` prefix). Used by Coaching's home and forms (`coach.overview`), a client's page (`coach.client.<id>`), the chat (`coach.chat.<id>`, the kept thread only before anything else is shown, so a message just sent never disappears), a check-in to answer (`coach.checkin.<id>`), school teams (`teams`) and share links (`share.links`, kept again after a delete). The gyms a lifter runs, lists or trains at (`ownedGyms`, `myListings`, `trainerGyms`) fall back to their kept copy when offline.
- **`src/lib/net.ts`.** `useNet` holds `busy` (background requests on their way) and `offline`. `api()` in `auth.ts` reports every answer (online, even an error status) and every failure to reach the server (offline), and when the phone itself says it has no connection it fails at once instead of waiting for a timeout. `watchNet()` (started in `App.tsx`) follows the browser's `online` and `offline` events. `track(promise)` counts a background request; sync, Friends' parts, connected apps' status and daily pulls, coach's notes, `liveRead` and the gym lists use it. Actions the lifter taps (send, save, delete) aren't tracked: their own buttons show they're busy.
- **The syncing ring** (`SyncSpinner.tsx`, `.sync-spinner` in `globals.css`): a 16 px circle outline with a gradient arc spinning around it, top right under the status bar. It shows once background work has run 300 ms (so a quick answer never flickers) and stays 700 ms after it ends. White on dark screens; on light screens the ring is the ink colour (`--spin-ring`), because white wouldn't show. Not drawn at all when nothing runs (no idle animation, [Battery](battery.md)), never during a workout (nothing moves during a set that the lifter didn't touch), `aria-hidden` (a screen reader isn't told every time the app syncs), and never takes a tap. Lean mode stops its spin like every other animation; reduced motion slows it.
- **Friends' offline note** (`OfflineNote` in `Friends.tsx`, `friends.offline` in six languages, the `offline` icon): while `offline`, a card at the top of the tab says the feed is what it showed last and updates when the phone is back online. It goes as soon as any request gets through.

## Platforms

Pure web code, so Android, iOS and the web app get it together. The native apps' WebViews report `navigator.onLine` and the `online` / `offline` events like a browser, so no native code is needed.

## Not done

- Per-exercise pick weights cached on the device are another thread's work.
- Live things stay live: Sonos' player state, the gym finder (needs a location and the server's directory), Training now on Friends, and sign-in, billing and Stripe pages.
