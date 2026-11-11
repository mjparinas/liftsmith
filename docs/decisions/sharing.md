# Sharing

Melvin, 2026-11-11: "There should be opportunities to share workouts and/or milestones with other people." He chose to build share moments and cards first, then public links with link previews.

## Share cards (built 2026-11-11)

- **One share sheet** (`ShareSheet.tsx`) for every moment. It shows the card exactly as it will go out, then: which moment (chips, when a screen has several), **Post** (1080×1350, 4:5 for feeds) or **Story** (1080×1920, 9:16), **Show weights** (on) and **Show my name** (off; the name is the optional one in Account and sync), a line saying what never goes on a card, and one Share button. The size and switches are remembered on the device (`liftsmith.sharePrefs` in localStorage).
- **Where to share from**, one control each:
  - *Done:* "Share this workout" opens the sheet with the workout, each new PR, a level-up and each badge just earned.
  - *Progress › History:* a share icon on each workout card under the calendar (the workout and its PRs).
  - *Awards:* a share icon on every earned badge, and on the level card.
  - *Coach's notes:* the "what's working" note (a lift up 5%+ in six weeks) has **Share it**, a lift progress card.
  - *Recap:* the month and year recap goes through the same sheet.
  - The PR replay sheet has no share button of its own, because Done's Share already offers each PR (one control, one destination).
- **Cards** (`shareCards.ts` decides what's on them, `shareImage.ts` draws them): workout (time, sets, volume, muscles worked as chips, PRs and badges), PR (lift, weight × reps, estimated one-rep max, the gain on the last best), badge (a medal in the tier colour), level (title, level, workouts, week streak, badges), lift progress (+% over N weeks, before and now) and recap. Always dark (like the app's dark theme), with the brand, the level and streak footer and getliftsmith.com. A Japanese headline wraps by character.
- **The 3D figure** is the art on workout, PR and progress cards: one still of the hologram (`src/components/demo/still.ts`), caught halfway through the hardest phase of the lift at the three-quarter view with the working muscles lit, in the lifter's figure (Settings sex). WebGL on a GPU, the 2D canvas otherwise, and none in tests; drawn once per lift and kept for the app run. With room (stories) it gets its own space; on a full post it sits behind the text on the right.
- **Privacy:** heart rate, body weight, body fat, measurements, cycle data, injuries, gyms and places are never on a card. Weights appear only while Show weights is on; the name only when Show my name is on. Tested in `shareCards.test.ts`.
- **Platforms:** pure web code. Android and iOS share the PNG through `@capacitor/share` (written to the cache folder with `@capacitor/filesystem`), the web app through the Web Share API with files, or a download where that's missing. No native code, so the three stay in step.
- Analytics: `feature` `share_card` with `<kind>:<size>:<how>` (`native`, `web`, `download`, `cancelled`, `failed`). A cancelled share sheet isn't an error.

## Public links with link previews (built 2026-11-11)

- **What:** under the Share button, **Link with a preview** turns the card into `www.getliftsmith.com/w/<id>/`. Pasted into iMessage, WhatsApp, Slack, Discord, Reddit or X it unfurls with the card as the preview; opened, it shows the card and a "Try Liftsmith" button to the home page (`utm_source=share`, `utm_campaign=<kind>`). The sheet then offers Share link, Copy link and Delete link.
- **Opt-in and deletable:** nothing is uploaded until the lifter taps Create a link, and only that one card (drawn again at post size as a JPEG, so the 3D figure and every language come with it). **Account and sync › Your share links** lists every link to open or delete. Deleting the account deletes its links.
- **Signing in is required** (Claude's call, 2026-11-11): every link needs an owner who can find and delete it later, and uploads from no one can't be traced or cleaned up. Signed out, the section says so and offers Sign in.
- **Limits** (`LIMITS` in `src/server/shareLinks.ts`): JPEG only (checked by its first bytes), the two card sizes only, 600 KB, title 120 and description 200 characters, 30 new links a day and 100 kept per account. Ids are 10 random characters (about 58 bits).
- **Not in search:** the page and image send `noindex` (meta and `X-Robots-Tag`). Thousands of thin, near-identical pages would count against the site in Google, so the growth comes from people tapping previews, not from ranking. `/w/` is not in `robots.txt`'s disallow list on purpose: preview bots (X, Facebook) obey robots.txt and wouldn't fetch the card. The image is served from `/w/<id>/card.jpg` rather than `/api/` for the same reason.
- **Server-drawn page, no scripts:** `/w/<id>/` and `/w/<id>/card.jpg` are rewrites (server build only, `next.config.ts`) to `src/app/api/share/page/` and `src/app/api/share/image/`. The page is plain HTML built in `pageHtml` with its own CSP (`default-src 'none'; img-src 'self'; style-src 'unsafe-inline'`), so the "keep pages static for the script hashes" rule doesn't apply: there is no script to allow. Everything the lifter typed is escaped. Its text (`link.*`) is in the lifter's language at the time they made the link, read straight from the catalogue file so the server doesn't load the app's i18n.
- **Storage:** table `share_links` in the Turso database (image as a BLOB). A card is about 150 to 300 KB, so 100 links is at most 60 MB for one account; watch the database size on the admin System tab if links take off, and move images to object storage then.
- **Platforms:** pure web code again. The phones call the API on `SITE_URL` with the account token (CORS already allows the native origins); the web app calls it on its own origin.
