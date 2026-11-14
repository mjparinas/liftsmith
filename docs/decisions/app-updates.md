# App updates: "A new version is ready"

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

Melvin, 2026-11-14: "on start up (in the background) … see if there is a newer version of the app and if there is, take them to the download page".

## What it does

- **When it checks:** four seconds after the app starts, and again on return to the app when the last check was 12 hours ago or more (an app left in memory for days still hears about updates). In the background: nothing waits for it, and offline or with no store it shows nothing and tries again next time. Code: `src/lib/appUpdate.ts` (`startAppUpdates`, `checkForUpdate`), started from `App.tsx` once the app is ready.
- **Android** (`AppUpdatePlugin.java`, `com.google.android.play:app-update`): Google Play's In-App Updates. Play says whether a newer version code is out; an install that didn't come from Play (a CI debug APK) never hears of one. Update starts Play's **flexible** update: Play asks once, downloads while the lifter keeps using the app, and the note turns into "Update ready" with Restart, which installs it (`completeUpdate`; the workout in progress is kept in localStorage, so nothing is lost). If Play's flow can't start, Update opens the Play listing instead. We never use the immediate (full-screen, blocking) flow: a lifter may be mid-workout.
- **iOS** (`AppUpdatePlugin` in `DelightPlugins.swift`): the App Store's public lookup (`itunes.apple.com/lookup?bundleId=…&country=<storefront>`), comparing its `version` with the app's own (numeric compare), and skipping a version whose `minimumOsVersion` is above the phone's. Update opens its App Store page (`trackViewUrl`). iOS has no in-app download. Until the app is in the App Store the lookup finds nothing, so nothing shows; no setup is needed when it goes live.
- **Web app:** nothing. Every open loads the newest page (`public/sw.js` is network first), so there's never an older version to update from.

## How it shows

- A small note at the top of every screen except the workout, in the page (not over it), the same place as friends' check-ins (`UpdateToast.tsx`): "A new version of Liftsmith is out" with **Update** and ✕. Not a primary button: the screen's own primary stays the one primary.
- **No nagging:** ✕ hides that version for seven days (`DISMISS_DAYS`). A newer version than the one closed shows at once. A downloaded update always offers Restart.
- Never during a workout (the note is hidden on the workout screen and Restart is only offered off it).
- Text in `x.update*`, all six languages.
