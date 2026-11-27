# Play promotional content: an event for every training season (2026-11-27)

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

Traffic idea 6 of 6 from "Find new ways to grow traffic" (Melvin, 2026-11-27: "do them all, put effort into them"): the Play listing in the last four app languages, and Google Play promotional content (Play's events, also called LiveOps) for each training season.

## The listing in Portuguese, Korean, Polish and Turkish

Already written on 2026-11-15 with the languages themselves (PR #538): name, short and full description and eight phone screenshots each, in `docs/PLAY_LISTING_TRANSLATIONS.md` (pt-BR text also used for pt-PT), checked by `playListing.test.ts`. What's left is Play Console: paste them and send them for review with the 11 countries already saved for those languages ([Google Play review](google-play-review.md)). **Held:** phone build 166 and Wear OS build 165 are in production review, and store listing changes go to review too, so nothing is changed in Play Console until that review is approved and Melvin says go.

## Events

- **Two per season, from the built-in schedule** (`DEFAULT_SEASONS`): a **season start** event for its first four weeks, and a **finale week** event for its last week, when every point counts twice. Season 1, Ember, started on 23 November 2026, before this plan, so it gets only its finale. That makes 11 events to January 2028, none overlapping, because Play shows one promotional item at a time.
- **Type: Time-limited event.** Not an Offer (seasons aren't a discount) and not a Major update (seasons already shipped).
- **Timing:** starts at noon UTC on the season's Monday (a season starts on each lifter's own Monday, and at noon UTC it's Monday nearly everywhere); a start event ends four weeks later, a finale at midnight UTC after the season's last Sunday. Each is submitted two weeks ahead, so it can be featured; the first is due 11 January 2027.
- **Every app language**, English as the default and nine translations, so the event shows in every country the app sells in. Taglines lead with the season's name exactly as the app shows it (`ssn.title`, `ssn.kit.*`), and the challenges are the app's own lines (`ssn.ch.*`). Each tagline fits the spotlight format too (48 characters, 23 in Japanese and Korean), under Play's 80.
- **Honest about unlocks:** seasons open after a lifter's fifth workout ([Features that unlock as you train](unlocks.md)), and every event says so, because Play shows events to people who don't have the app yet and its rules want events that apply to everyone.
- **Free first:** every tier is free and Pro adds a bonus row, the same line as the app. No prices.
- **Deep link:** `https://www.getliftsmith.com/app/#/season`, which App Links open in the Android app on the Season screen.
- **Art from the app's own 3D figure:** `scripts/play-promotions.mjs` draws each 1920×1080 image from the hologram figure doing a different lift, recoloured to the season's palette (the free theme for a start, the Pro row's for a finale; the same colours as the season app icons in `make-icons.mjs`), over a motif of its own (sparks, bolts, petals, sun rays, leaves, shards). No text or logo, nothing that looks like a button, the figure inside Play's safe zone, and under 1 MB.
- **One source:** `store/play/promotions/events.json` holds the dates, text and image paths; the script writes `docs/PLAY_PROMOTIONS.md` (the page to paste from) and the images. `playPromotions.test.ts` checks that every built-in season has its events with the right dates, every language, the season names, Play's limits and rules (no bullets, line breaks, HTML, calls to action, ranking claims, prices, emoji or other apps' names), the images and that the doc is current. The test reads the doc, so `ci.yml` runs CI when it changes, like the listing docs.
- **A new or moved season updates its events in the same change** (new kit: add its colours and motif to `ART` and `PALETTES`, its events to the JSON, then run the script). Moving a season in Admin › Seasons doesn't change the built-in list, so move its events in Play Console by hand.
- **Applying is Melvin's step in Play Console**, after the production review is approved. Play Console says whether the app is eligible for promotional content (it's open to apps that meet Play's criteria for its growth tools); if it isn't yet, the drafts wait.
- **App Store in-app events** wait with the rest of iOS ([Open items](open-items.md), iOS deferred).

Nothing here changes the app, so there's no version bump or What's new entry.
