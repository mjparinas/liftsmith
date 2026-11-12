# Sonos

Melvin, 2026-11-12: "I use sonos at home, would be cool to have the app adjust my music, switch songs, adjust volume." Built as a Pro lab, `labSonos` (Settings › Labs › Sonos), because it's new, needs a Sonos developer integration and has only been tried against Sonos's documented API, not a real speaker yet.

## What the lifter gets

- **Connect once** in Settings › Connected apps › Sonos (the card shows only while the lab is on, or while Sonos is still connected so it can be removed). It uses the same OAuth flow as Strava and Oura (`connect.ts`, provider `sonos`), so it needs a Liftsmith account; the tokens stay on our server, sealed like the others.
- **Pick a speaker** (a Sonos group: one speaker or several playing together) on the same card.
- **On the workout screen**, a Sonos card under the set or rest card (`SonosBar` in `Sonos.tsx`): album art, the song and artist, which speaker, previous, play or pause, next, and volume − / + (the shared `Bump`, so it holds to repeat; the new level is sent 350 ms after the last press, so a held button sends one change). Its gear opens the same settings in a sheet. It's not on the screen once the workout is finished, and nothing in it is needed to log a set.
- **Follow my workout** (on by default): the **set volume** (40) when a workout starts and when rest ends, the **rest volume** (25) when rest starts, optionally a **Sonos favourite** to start the workout with (otherwise it just presses play), and **pause when the workout ends** (on). Rest is never louder than sets. +30 s during rest changes nothing; skipping rest turns it back up straight away.
- Settings are kept on the device (`ls.sonos` in localStorage), not synced: the speakers belong to one home.

## How it works

- **Sonos Control API, through the cloud** (`https://api.ws.sonos.com/control/api/v1`). The app calls `GET` and `POST /api/connect/sonos/player/` (`src/app/api/connect/[provider]/player/route.api.ts`), which uses the lifter's token to call Sonos (`src/server/sonos.ts`): households → groups and favourites, then the chosen group's playback state, metadata and group volume; commands are `playback/play`, `pause`, `skipToNextTrack`, `skipToPreviousTrack`, `groupVolume` (absolute), `groupVolume/relative` and `favorites` (load a favourite and play it). Nothing from Sonos is stored. Rate limits: 600 reads and 900 commands an hour per account.
- **Why the cloud and not the home network:** Sonos's local API (UPnP and the newer local websocket) can't be reached from a web page, and on the phones would need local-network permission on iOS, discovery and a native plugin on both. The cloud API is one path for Android, iOS and the web app, with no native code, and it works from anywhere the phone has internet. The cost is a round trip of a few hundred milliseconds per command. If that's ever too slow, local control could be added later as a native plugin on both phones.
- **Regrouping:** Sonos changes a group's id when speakers are grouped differently. A command that gets 410 or 404 (`Gone`) reads the groups again, finds the speaker by its saved name (or the one playing), and retries once.
- **Following the workout** is `followWorkout` in `src/lib/sonos.ts`, subscribed to the store from `Workout.tsx`'s module (like the heart rate release), so it runs however the workout starts or ends. The rules are the pure `musicSteps` (tested). A workout coming back from storage on a reload (started more than a minute ago) doesn't restart the music. The natural end of rest is one timeout set for that moment, during a workout only ([Battery](battery.md)). If the app is in the background when rest runs out, the phone may hold that timeout until the app is back; the volume then goes up on return or with the next set. Nothing else polls: the card reads Sonos when it opens, when the app comes back to the front, when rest starts or ends, and 1.2 s after a skip or a favourite.
- **Platforms:** pure web code, so Android, iOS and the web app get it together. Sonos's sign-in page opens in the browser and comes back through `liftsmith://connected` on the phones, like the other connections.

## What Melvin needs to do

1. Sign in at https://developer.sonos.com and create a free Sonos developer account and open **My Account › Integrations › New Control Integration**.
2. Name it Liftsmith, add a short description and a support email (hello@getliftsmith.com), and create a key (name it `liftsmith`). The **Key** is the client id and the **Secret** is the client secret.
3. Add the **redirect URI** `https://www.getliftsmith.com/api/connect/sonos/callback/` (the trailing slash matters). No event callback URL is needed.
4. In Vercel (Project › Settings › Environment Variables, Production and Preview), set `SONOS_CLIENT_ID` and `SONOS_CLIENT_SECRET`, then redeploy. Until both are set the Sonos card says "Coming soon".
5. In the app: turn on Settings › Labs › Sonos, then Connected apps › Sonos › Connect, allow Liftsmith on Sonos's page, and pick a speaker.

Sonos's Control API only reaches speakers on the **Sonos S2** app; S1-only speakers can't be controlled. A Control Integration works for any Sonos user; Sonos asks integrations that go to the public to follow its brand and certification rules, which matters if this leaves Labs.

## Open

- Not yet tried against real speakers (no keys when it was built).
- Sonos can push changes to an event callback URL; we read on events instead, so the song name can lag until the next read.
