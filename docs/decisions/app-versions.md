# App versions

**Every new feature bumps the version** (Melvin, 2026-11-19: "versions should get bumped on every new feature, right now it's this Version 0.1.0"). Until then every build said 0.1.0 and only the store build number moved.

## The scheme

Plain `major.minor.patch`, one number for every platform:

- **A feature bumps the minor version** (0.2.0 → 0.3.0): anything that goes on the features page, the weekly email list or What's new as New or Better.
- **Fixes only bump the patch** (0.2.0 → 0.2.1): a pull request that only fixes or tidies something a lifter could notice. Changes a lifter can't notice (CI, docs, admin-only tools, tests, refactors) bump nothing.
- **The major version** stays 0 until Melvin calls a 1.0.

Bump with `node scripts/bump-version.mjs minor` (or `patch`) in the same pull request as the feature. It runs `npm version --no-git-tag-version` (package.json and package-lock.json) and sets every iOS target's `MARKETING_VERSION` (app, widgets, watch) to match.

## One source

`package.json`'s `version` is the only place a version is written by hand:

- **Web app and website:** `next.config.ts` stamps it as `NEXT_PUBLIC_APP_VERSION`; `APP_VERSION` and `versionLabel` in `src/lib/build.ts` show it in Settings › Help › Version, the What's new sheet, analytics and feedback diagnostics.
- **Android phone and Wear OS:** `release.yml` passes it as `VERSION_NAME`; without it (a local or CI debug build) `android/app/build.gradle` and `android/wear/build.gradle` read it from package.json, so neither file holds a number.
- **iPhone, widgets and Apple Watch:** `release.yml` passes it as `MARKETING_VERSION`; the Xcode project's own value is kept equal by the bump script for local builds.
- **Build numbers are not the version.** The store build number (Android `versionCode`, iOS `CURRENT_PROJECT_VERSION`) is still the Release workflow's run number, so it keeps rising whatever the version does; Wear OS adds 100,000,000. The Play Production review of 0.1.0 is a fixed bundle and isn't touched by later uploads.

`src/lib/appVersion.test.ts` fails when the lockfile, the Xcode project or a Gradle file disagrees with package.json.

## Tied to What's new

Each release in `RELEASES` (`src/lib/appNews.ts`, [What's new](whats-new.md)) carries the `version` it ships as, newest first, and the website's `/whats-new/` shows it next to the day. A release is one promotion: several feature pull requests merged before the same nightly promotion add their changes to the top release and move its `version` up to the newest bump; the first feature after a promotion starts a new release at the top, dated the next promotion's day (Pacific). `appNews.test.ts` fails when the top release's minor version isn't package.json's, so a minor bump can't land without its What's new entry. A patch bump may add a Fixed change to the top release, or none.

## Parallel pull requests

Two threads branching from the same staging both bump to the same number. When a branch is behind staging and staging's version already moved, merge staging, take its version and bump once more from there (and move the top release's `version` with it).

## History

- 0.1.0: every build up to Release 44 (2026-11-19).
- 0.2.0: open now in the gym finder, settings search, the map-first finder and What's new itself (2026-11-19, promoted 2026-11-20).
- 0.3.0: five new training seasons planned through 2027 (2026-11-19).
