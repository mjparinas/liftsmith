# Now playing

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

Melvin, 2026-11-13: removed the mood playlists ("i dont really like this functionality"), then asked for a built-in player in their place ("and a built in spotify player?", "yes please"), with a way to turn it off ("this seems like a feature that can be disabled if wanted").

## What it is

- **One row, on Today and the workout screen** (`NowPlayingBar`, `src/components/app/NowPlaying.tsx`): the song and its artist and app when the phone says them, otherwise "Music playing" or "Music paused", then previous, play or pause, next (44 px each). It shows only while a music app has something playing or paused. On Today it sits under the status chips; on the workout screen it takes the Sonos bar's place under the set or rest card, and gives way to the Sonos bar when the Sonos lab is connected, so there's only ever one music control. It never adds a tap during a set: nothing has to be touched.
- **On by default, with a switch** in Settings › Workout › Music controls (`profile.training.nowPlaying`, missing means on, synced with the profile). The switch shows only in the Android and iOS apps.
- **Free**, and pure on-device: nothing about the music leaves the phone or goes to analytics.

## No Spotify SDK or Web API

Spotify's developer apps start in development mode, capped at a few named users, and extended access needs a large existing audience, so an in-app Spotify player isn't possible for us. Control goes through the phone's own media controls instead, which reach Spotify like any other music app.

## Platforms

- **Android** (`NowPlayingPlugin.java`): with no permission, the buttons send the phone's media keys (`AudioManager.dispatchMediaKeyEvent`), which Android hands to the app that last played, like a headset button; whether music is playing comes from `AudioManager.isMusicActive` and an `AudioPlaybackCallback` says when that changes. Without song names, once music has shown up the row stays (paused) until the screen closes, so Pause doesn't make Play disappear (`nextNow`). **Song names** need notification access: Settings › Workout has one "Show song names" button (only while the switch is on and access isn't allowed) that opens Android's notification access page for Liftsmith. With it, `MediaListener` (an empty `NotificationListenerService`, reading no notifications) lets the plugin read the active media sessions: the one playing, else the newest, never our own. Its song, artist and app show, and the buttons control that session directly.
- **iOS** (`NowPlayingPlugin.swift`): **Apple Music only**, through `MPMusicPlayerController.systemMusicPlayer`, after the lifter allows Apple Music (`NSAppleMusicUsageDescription`; Settings › Workout has "Allow Apple Music", or "Open Settings" once iOS has been told no). Apple gives apps no way to read or control Spotify, YouTube Music or any other app's playback, so on an iPhone those are controlled from Control Centre, the lock screen or the music app. Recorded in [Platform deltas](platform-deltas.md).
- **Web:** a page can't see or control other apps' music, so the web app has no row and no switch.

## Battery

The plugin listens only between `watch` and `unwatch`, which `useNowPlayingWatch` calls while the row is on screen and the app is in front; going to the background or leaving the screen stops it and forgets what was playing ([Battery](battery.md)). No polling: Android's playback and media session callbacks and iOS's player notifications drive every update.
