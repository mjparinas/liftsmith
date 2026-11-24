# What's new

Melvin, 2026-11-19: "Can you add similar whats new button for the latest changes" (with screenshots of another app's Settings › Version row and its What's new sheet).

## What it is

- **Settings › Help › Version** shows the app's version (with the store build number on Android and iOS, `versionLabel` in `build.ts`) and a **What's new** button beside it. One control, one destination: nothing else on Settings opens the sheet. On the phones, the same row has **Check for updates** / **Install** for the store (`appUpdate.ts`, [App updates](app-updates.md)).
- **The sheet** (`WhatsNew.tsx`, `WhatsNewSheet`): a tinted header card with the release day, the version and a summary ("6 new · 7 better · 2 fixed"), then the changes grouped under **New**, **Better** and **Fixed** chips (mint, blue and violet tints), each a card with an icon, a bold title and one or two plain sentences, and a **Let's go** button that closes it. Same kinds as the website's `/whats-new/` page.
- **Once after an update**, a small note at the top of **Today** (in the page like the update note, not over it): "What's new in Liftsmith", the summary, **See all** and ✕. Either one, or opening the sheet from Settings, marks the release seen, so it never comes back for that release. It never shows during a workout or on another screen.
- **A lifter with no workouts never gets the note**: a first setup marks the current release seen (`Onboarding.tsx`), and so does Today with no finished workouts (`autoAction` in `appNews.ts`). Everything is new to them; announcing it would be noise.
- **Seen is per device** (`liftsmith.whatsNew` in localStorage, the newest release day seen). It doesn't sync: a second phone shows the note once too, which is harmless, and the `liftsmith.` prefix is already wiped on sign out.

## Respecting unlocks

A change can name the unlock it waits for (`unlock`, [Features that unlock as you train](unlocks.md)) and a `gate` (`community` while the community flag is on, `adult` not for under-18s, `native` in the phone apps only, such as home-screen widgets). A lifter who can't reach it doesn't see it, and the counts leave it out too, so a new lifter is never told about seasons before seasons appear. If nothing in a release is visible, the note doesn't show and the release is marked seen.

## One list for the app and the website

- `src/lib/appNews.ts` `RELEASES`, newest first: each release has its `day` (ISO, Pacific), an English `headline` for the website, and its changes (`id`, `kind`, `icon`, optional `unlock` and `gate`).
- The words are in the catalogue `src/locales/text/wn.ts` as `wn.c.<id>.title` and `wn.c.<id>.body`, in all ten languages. `appNews.test.ts` fails when a change lacks either in any language, or the releases are out of order.
- The website's `/whats-new/` page (`src/lib/whatsNew.ts`) puts the app's releases first, in English from the same catalogue, then the older website-only days.
- **Adding a release**: when a promotion ships something a lifter will notice, add a release at the top of `RELEASES` with that day, pick the changes worth a line (new features, things that got noticeably better, fixes a lifter would have hit), add their words in all ten languages, and gate anything behind an unlock. Keep it to roughly 15 items; leave out admin, internal and website-only work.

Pure web code, so Android, iOS and the web app get it together (platform parity). The version comes from `InstallInfo` on the phones, already registered on both.

## The first release (2026-11-19)

Covers what shipped from 2026-11-15 to 2026-11-18: training seasons, the community board, club chat and crew sessions, gym class schedules, common mistakes and fixes, the This week and Recovery widgets (phones), automatic supersets, fitness tests on a number line, the stretch get-ready countdown, 5 lb machine steps, smoother 3D figures, ten languages, coach check-ins with weight and photos, jumps that leave the floor and one-side stretches showing the right side.

## Releases carry their version (2026-11-19)

Each release has a `version` (package.json's at the promotion it ships in), and the website shows it beside the day. The first release is 0.1.0; 0.2.0 (dated 2026-11-20, the next promotion) adds open now in the gym finder, settings search and the map-first finder. A feature bumps the minor version and joins the top release; see [App versions](app-versions.md).
