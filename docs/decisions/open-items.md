# Open items

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

## Public launch: web and Android (2026-11-11)

Done before launch: Google sign-in for the web and Android, Android billing (Play `pro` subscription, RevenueCat, the webhook; a test trial went through on version 7), Stripe live payments on the web, Firebase push for Android Friends (`GOOGLE_SERVICES_JSON`, `FCM_SERVICE_ACCOUNT_JSON`), the analytics database and admin variables, the privacy, terms and delete-account pages on www, Vercel Web Analytics, and the MediaPipe runtime and pose model served from our own origin.

**Sent for review on 2026-11-12** (Play Console submission 1): Production 0.1.0 (build 17, full rollout, the 95 countries in [Google Play review](google-play-review.md)), the store listing from `docs/PLAY_LISTING.md`, and every App content declaration: Data safety, the content rating retake, Target audience (18 and over), Health apps (with READ_NUTRITION and the Wear OS app's heart rate permissions), Advertising ID: No, Sign in details, and the foreground service declaration. That declaration has two unlisted YouTube videos: special use for the phone's lock-screen workout notification, and health for the Wear OS app's workout with heart rate (recorded on a Wear OS emulator paired with a phone emulator). Play no longer has a "Contains in-app purchases" tickbox; it shows that from the subscription and the content rating answers. What's left:

1. **Wear OS production release** (build 100000017): it wasn't in submission 1. In Production, switch the form factor to Wear OS, accept "Proceed anyway" on the version code warning (the +100000000 offset in `android/wear/build.gradle` is on purpose, and Wear version codes can't go back below it), save, and send it from Publishing overview.
2. **Once the listing is live:** set `NEXT_PUBLIC_GOOGLE_PLAY_URL` in Vercel (Production and Preview) to `https://play.google.com/store/apps/details?id=com.getliftsmith.app` and redeploy, so the site's Google Play badges stop saying "Coming soon"; the App Store badge keeps saying it until iOS ships.

After launch, not blocking it:

- Validate camera rep counting on real recorded lifts.
- Creator program: add each creator in /admin/ › Creators (Android's 30-day offers exist); payouts are sent by hand from the CSV. The iPhone side is under iOS below.
- Official Google Play and App Store badge artwork for the home page, and real beta-tester quotes to replace the sample testimonials (samples never show on the live site).
- A dedicated RevenueCat service account in Google Cloud, so `liftsmith-admin@` can drop Pub/Sub Admin.
- Profile links (`/app/#/person/<handle>`) open the installed app on Android (App Links) and the web app on iPhone until Universal Links exist. Public profiles' own pages (`/u/<handle>/`) are web pages anyway.

## iOS (deferred)

Melvin, 2026-11-10: everything that needs iOS setup is recorded here as an open gap and waits until he picks iOS back up. The code ships on both platforms; these steps turn the iPhone parts on.

- **Billing on iPhone:** App Store Connect Paid Apps agreement, banking and tax, the "Pro" group (`pro_monthly`, `pro_annual`, 14-day free intro offers, Family Sharing on annual) and sandbox testers; the App Store app in RevenueCat with Apple's server notification URL; a `creator30` offering with its own products for creator codes; then the GitHub secret `REVENUECAT_IOS_KEY`. App Store App Privacy and age rating answers from `docs/PRIVACY_LABELS.md` and [Friends](friends.md).

- **Volume button logs a set on iPhone** (Labs, `VolumeKeysPlugin.swift`): built and compiled in CI, but not yet tried on an iPhone. Check that a press from the buttons and from earbuds logs once, music keeps playing, and no volume pop-up shows.
- **Voice set logging on iPhone** (Labs, `SpeechLogPlugin.swift`): built and compiled in CI, but not yet tried on an iPhone. Check the speech recognition and microphone prompts, that recognition stays on the device for each of the six languages, and that music comes back after listening.

- **Friends push on iPhone** (2026-11-11): turn on the Push Notifications capability for the App ID `com.getliftsmith.app`, and add `aps-environment` (`production`) to `App.entitlements`. Create an APNs auth key (Keys › Apple Push Notifications service), and put it in Vercel as `APNS_KEY_P8` (the .p8 text), `APNS_KEY_ID` and `APNS_TEAM_ID`. Then retake the App Store age rating with the answers in [Friends](friends.md) "Store answers". Until then the iPhone shows Friends activity in the app only.

- **Universal Links** for remix and shared routine links: the Associated Domains entitlement (`applinks:www.getliftsmith.com`) on the App ID and in `App.entitlements`, plus `public/.well-known/apple-app-site-association` with the team id and `/app/*`. Until then those links open in Safari, and the in-app paste box (Routines › Add a routine from a link) brings a routine into the app.

- **Sign in with Google on iPhone:** create an iOS OAuth client in Google Cloud (project `liftsmith-514303`, bundle `com.getliftsmith.app`) and put its id in `GOOGLE_IOS_CLIENT_ID` (`src/lib/authIds.ts`). Until then the iPhone app has no Google button.
- **Sign in with Apple:** enable Sign in with Apple on the App ID `com.getliftsmith.app`; create the Services ID `com.getliftsmith.web` for the web (domain `www.getliftsmith.com`, return URL `https://www.getliftsmith.com/app/`) and put it in `APPLE_SERVICES_ID`; make a Sign in with Apple key and set `APPLE_TEAM_ID`, `APPLE_KEY_ID` and `APPLE_PRIVATE_KEY` in Vercel (for revoking on account deletion); register `getliftsmith.com` and hello@getliftsmith.com for Apple's private relay email. Until then the iPhone app's Apple button can't finish signing in, and the web has no Apple button. Steps: https://claude.ai/artifact/X4Yunes35tx9ZNYt4FYhxY
- **Watch rep counting on Apple Watch** (Labs, 2026-11-11): the watch app streams Core Motion during a set (`MotionStream` in `WatchModel.swift`) and the phone counts it like Wear OS's. It hasn't been tried on an Apple Watch yet; check a set of squats and curls counts, and that the sign of "up" is right (if every count comes out at zero on a lift that should count, flip the sign in `MotionStream.add`).
- **Health twin's "Open the Health app" on iPhone** (2026-11-11): `HealthWorkout.openPermissions` opens the Health app with `x-apple-health://` and falls back to Liftsmith's page in Settings. It hasn't been tried on an iPhone yet; check it opens Health when the HRV or VO₂ max tile has no data.
- **iPhone home-screen widget** (Melvin, 2026-11-10: skipped for now). The Today widget (PR #150) works on Android, but on iPhone it shows only its plain Start and Log set buttons until the widget extension can read the app's data. To turn it on: in the Apple Developer portal, create the App Group `group.com.getliftsmith.app` and enable it on the App IDs `com.getliftsmith.app` and `com.getliftsmith.app.widgets`; then add the App Group entitlement to both Xcode targets (the app's `App.entitlements` and a new one for `LiftsmithWidgets`) and drop the gap from [Platform deltas](platform-deltas.md). The code already writes and reads the group (`WorkoutSessionPlugin.setWidget`, `QuickStartWidget.swift`).
