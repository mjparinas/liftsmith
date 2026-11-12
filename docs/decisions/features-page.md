# Features page

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

## What it is (Melvin, 2026-11-12)

- Melvin asked: "a distinct features page that lists all features of the app, connections compatibility in a table and all new features, and keep it up to date with all new features".
- **`/features/`** is that page (it used to be a plain index of the feature landing pages, which it still links). Top to bottom: jump chips, **Newest features** (every feature added on the three latest days that added any, grouped by category rather than by date, Melvin 2026-11-12: "categorize them instead"; each links down to its card), one section per group with a card per feature (name, Free / Pro / Free + Pro / Labs (Pro) chip, one or two plain sentences, the Pro part where it's mixed, where it runs and how the platforms differ), a mid-page call to action, then **What Liftsmith works with**: one table of every connection with Android, iPhone and Web columns and the plan, grouped (health apps, watches and heart rate, Bluetooth gear, fitness services, music and speakers, calendars and other apps). The table scrolls inside its own box on a phone, so the page never scrolls sideways.
- **One source:** `src/content/features.ts` (`FEATURE_GROUPS`, `CONNECTION_GROUPS`); the page is `src/components/site/FeaturesView.tsx`. Newest comes from each feature's `added` day, so there is no second list to keep. Every change, fixes included, stays on `/whats-new/`, which the Newest section links.
- **Honest status:** a connection that's built but depends on another company's approval and keys we may never get (Strava, WHOOP, Withings, Polar, Concept2) says **Investigating** (Melvin, 2026-11-12: "not even sure I could get approval or get it to work"); one waiting only on its store listing (the Garmin watch app) says **Coming soon**. Neither ever says Yes. When one goes live, flip its row (and the "Fitness service connections" card) in the same change.
- **Compatible devices live on their own pages and are linked, not copied:** the Bluetooth smart scale row links `/works-with/scales/` (the scale list, built in its own thread). A future list (heart rate straps, gym machines) gets its own page the same way and a `link` on its row.
- **The home page** links it under "And the rest" (`home.more.all`, all six languages). The page itself is English for now, like the other feature pages ([Public pages and SEO](public-pages-and-seo.md), website languages).

## Keeping it current (rule)

- A change that adds, removes or renames a feature a lifter would notice, moves one between Free, Pro and Labs, takes a lab out of Labs, or adds a connection, device or platform, updates `src/content/features.ts` in the same change, with today's `added` day for a new feature.
- `src/content/features.test.ts` fails when a lab (`LABS`), a Pro feature (`PRO_FEATURES`), a cloud service (`CLOUD`), an import source or a feature landing page has no entry, or when a lab that graduated is still marked Labs. Anything else (a new screen, a new free feature) relies on the rule, so check the list when a pull request ships something a lifter would see.
