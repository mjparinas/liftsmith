# Friends and the workout feed

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

Melvin, 2026-11-11, from the missing-features list: "Friends and a feed: follow people, see their workouts, like and comment", with moderation, blocking and reporting and private defaults. Built in stages; stage 1 is below, stage 2 is in [Open items](open-items.md).

## Where it lives

- **A people button on Today's header** (Melvin chose it over a sixth tab, 2026-11-11), between the streak flame and the level, with a dot while there's unread activity or a follow request waiting. It opens **Friends** (`#/friends`): Feed, Activity and People as chips at the top, and a gear for Friends settings. A person's page is `#/person/<handle>`. One control each: the post's heart likes, its speech bubble opens the comments sheet, its "…" holds Report (or Delete on your own post), and the person page's "…" holds Block and Report.
- **Done** gets **Post to friends** under the stats once the lifter has joined (or posts by itself with "Post every workout" on), then shows **Posted to friends · Remove**. It asks the server whether this workout is already posted, so a reload or a second device doesn't post twice; the server also keeps one post per workout.
- Hidden everywhere when the `social` flag is off (admin Flags tab), and the server then answers 503, so it's a kill switch.

## Privacy by default

- **Signing in is required**, then **joining is opt-in**: a handle (3 to 20 of a–z, 0–9, _; unique; names that look official are reserved), a display name, and agreeing to four community rules. Both app stores require terms users agree to, a filter, reporting and blocking for apps with user posts (Apple 1.2, Google's UGC policy); the agreement time is stored (`agreed_at`).
- **Follow requests need approval** unless the lifter turns on "Anyone can follow me"; turning it on lets everyone waiting in. **Nothing is posted** until the lifter taps Post (or turns on "Post every workout", off by default). **Show weights** is on by default, like share cards; off, posts show sets and reps only.
- **Posts are for accepted followers only** unless the lifter makes their profile public (below). A post carries the workout summary only (`PostBody` in `src/lib/socialTypes.ts`): time, sets, volume, new-best count, muscles worked, and per exercise its id, sets and best set. The server keeps only those fields (`parsePost`), so heart rate, body weight or fat, measurements, cycle data, injuries, gyms and places can't get in. Exercises travel as ids, so each reader sees the names in their own language and weights in their own unit; a custom exercise's name goes along (through the word filter).
- **Finding people is by exact handle** or a shared profile link (People › Share my profile). There's no directory, search or suggestions, so the list of users can't be browsed or scraped, and lookups are rate-limited.

## Public profiles (stage 2)

Melvin, 2026-11-11: "make public accounts available on the web through a link and it should be added to the sitemap … only public users should be in the sitemap".

- **Public profile** is a switch in Friends settings, **off by default** and not offered while joining, so every profile starts private. Its hint says plainly that anyone can see the profile and workouts, on the web too, and that search engines can list the page. Public also means anyone can follow (turning it on turns on "Anyone can follow me" and lets everyone waiting in); turning "Anyone can follow me" off turns Public off too.
- **In the app**, anyone who isn't blocked sees a public profile's posts on its person page, and can like and comment (the same `canSee` check, so blocking still hides everything both ways). A public profile's posts still reach someone's Feed only once they follow it. The person page's kicker says "Public profile".
- **On the web**, `www.getliftsmith.com/u/<handle>/` (a rewrite to `src/app/api/people/page/`, server build only) shows the name, handle, workout, follower and following counts, the last 12 workouts (date, time, sets, volume and new bests when shown, and up to four exercises with their best set) and a "Follow in the app" button to `#/person/<handle>`. Plain HTML with no scripts and the share page's strict CSP (`SHARE_PAGE_CSP`), every typed value escaped, a canonical link and Open Graph tags. The page's language follows the reader's `Accept-Language` (six languages, `pub.*` in `src/locales/text/pub.ts`, read directly by `src/server/publicProfile.ts`), and weights are in pounds for `en-US` readers, kilograms otherwise. Custom exercise names show as the poster wrote them.
- **Anything else gets one "This profile isn't public" page** with `noindex` and a 404: a private profile, a suspended one, a hidden handle or no such handle, so the page never reveals whether a private handle exists. Hidden (reported) posts are left out. The page is cached for 5 minutes at most, so turning Public off takes it down soon.
- **The people sitemap** `/sitemap-people.xml` (rewrite to `src/app/api/people/sitemap/`) lists only public, unsuspended profiles **with at least one workout posted** (an empty page is thin content), newest activity first, up to 45,000; `robots.txt` names it next to `sitemap.xml`. The static `sitemap.xml` stays the site's own pages.
- **Sharing:** People › Share my profile shares the web page when the profile is public, the in-app link otherwise; Friends settings has "See my public page" while it's public.
- Tests: `src/server/publicProfile.test.ts` (private shows nothing, the page and its escaping, the sitemap's rules, suspension, language and units) and the public cases in `social.test.ts`.

## Sending a workout to a friend (stage 2)

The original ask: "sending a workout directly to gym buddies".

- **Send to a friend** sits on Done (this workout) and in a saved routine's editor, next to Share routine. Both appear only once the lifter has joined Friends.
- It opens a sheet of the lifter's **friends: people they follow who follow them back** (`people` with `list: "friends"`). Tap a name to send. Mutual follows only, so nobody can push workouts at strangers. Blocking either way stops it, and there's a limit of 50 sends a day.
- **What travels is a routine code**, the same one routine links use (`encodeRoutine`). It holds the exercises, their set counts and supersets, and nothing else: no weights, notes or anything personal. From Done, the name is "Workout on <date>".
- **The server checks the code's shape** (`CODE_RE`). It reads the name out of the code itself and puts it through the word filter and the link check, so the name the friend sees on opening is the one that was checked. It's stored in `sent_workouts`.
- **The friend sees it in Activity** as "<name> sent you a workout: <workout>". It counts toward the unread dot. Tapping it opens `#/routine/<code>`, the shared-routine preview with Save.
- Leaving Friends or deleting the account deletes sends both ways.
- Analytics: `feature` `social_send`.
- Tests: the sending cases in `social.test.ts`, and the send-then-Activity flow in `Friends.test.tsx`.

## Push notifications (stage 2)

- **What:** a push when someone follows you or asks to follow, accepts your request, comments on your workout, sends you a workout, and (off by default) likes one. Friends settings › Notifications has a switch for each (follows and requests, comments, workouts sent to you, likes), stored on the profile (`push_*` columns). The Activity list and the people button's dot still carry everything.
- **Asking:** the permission prompt shows only when the lifter acts. That means joining Friends, or turning a notification switch on. After that, opening the app keeps the token current without asking (`startPush` in `src/lib/push.ts`). If the phone has notifications off, the switches say so.
- **Server:** `src/server/push.ts`.
  - The phone registers its token with `pushToken` (`push_tokens`: the token, account, platform and the phone's language; at most 10 per account, newest kept).
  - `notify` runs after follow, answer, like, comment and send, in the recipient's language (`push.*`, `src/locales/text/push.ts`).
  - Android goes through **Firebase Cloud Messaging HTTP v1** (a service account JWT for an OAuth token, cached for its hour). iOS goes through **APNs** (an ES256 token JWT over HTTP/2).
  - A dead token (FCM `UNREGISTERED`, APNs 410 or `BadDeviceToken`) is deleted. Sending never fails or holds up the action: errors are swallowed, and it gives up after 4 s.
  - **Off until the keys exist** (`pushConfigured`): `FCM_SERVICE_ACCOUNT_JSON` for Android, and `APNS_KEY_P8`, `APNS_KEY_ID` and `APNS_TEAM_ID` for iOS (`APNS_TOPIC` defaults to `com.getliftsmith.app`; set `APNS_SANDBOX=1` only for development builds).
- **Taps** open the push's route: `#/friends`, or `#/routine/<code>` for a sent workout (`onPushTap`, wired in `App.tsx`).
- **Removing tokens:** signing out drops the token (`stopPush` before `signOut`). So does leaving Friends or deleting the account (`socialDeletes`).
- **Android** (`@capacitor/push-notifications`):
  - The release build writes `android/app/google-services.json` from the `GOOGLE_SERVICES_JSON` secret.
  - Without it the app builds the same, but `InstallInfo` reports `push: false` (no `google_app_id` resource), so the app never asks Firebase for a token (that would crash).
  - Pushes use a "Friends" channel (created by the app; its name is `push.channel`) and the app's status bar icon, set as Firebase defaults in `AndroidManifest.xml`.
- **iOS:** `AppDelegate.swift` hands the APNs token to Capacitor. It needs the Push Notifications capability and the `aps-environment` entitlement, which are under "iOS (deferred)" in Open items. Until then registration fails quietly.
- **Web app:** no push; the dot and Activity carry it (Platform deltas).
- **Tests:** `src/server/push.test.ts` covers language, the switches with likes off by default, a sent workout's route, dead tokens, the token limit and sign-out, and staying off without keys.

## Store answers for user-generated content

For Melvin to enter in the consoles (Friends adds content people make and share):

- **Google Play › App content › Content rating:** retake the questionnaire. Answer **Yes** to "Does the app allow users to interact or exchange content with other users?", covering comments, likes, following and posting workouts, and **Yes** to "users can share content". Answer **No** to sharing the user's physical location. Digital purchases stay **Yes** (Pro). The rating normally keeps the same age band and adds the "Users Interact" descriptor.
- **Google Play › App content › Target audience:** keep it **18 and over** (or 13+ at the youngest). Users interacting is allowed with the safeguards Play's UGC policy asks for, all built: terms agreed before posting, a filter, reporting, blocking, and staff review (the admin Reports tab).
- **Google Play › Data safety:** the push token counts as **Device or other IDs** for App functionality, collected only from people who join Friends and allow notifications (row added to `docs/PRIVACY_LABELS.md`).
- **App Store Connect › Age Rating:**
  - Answer **Yes** to **User-Generated Content**.
  - Answer **No** to **Messaging and Chat**. There are no private messages; comments sit on posts that followers see.
  - Answer **No** to Advertising.
  - The answers to the other questions don't change.
  - Apple 1.2 asks for the same four safeguards, all in place.

## Safety

- **Blocking** removes follows both ways; neither sees the other's profile, posts or comments again (lookups answer "no one with that handle"), and the blocked person isn't told. Unblock from People › Blocked.
- **Reporting** a post, comment or profile: one reason chip (spam, bullying, hate, sexual, dangerous advice, something else), then Send. One report per person per thing. **Three different people reporting a post or comment hides it** (`HIDE_AFTER`) until staff decide. A profile is reported by handle but stored by account, so changing the handle doesn't escape it.
- **The admin Reports tab** (`/admin/?tab=Reports`, `src/components/admin/Reports.tsx`) lists open reports grouped by what was reported, most reported first, with the content, author, reasons and notes. Admins can **Remove** (deletes the post or comment; for a profile, resets the name to the handle), **Dismiss** (shows it again), **Suspend author** (hides their profile and everything they wrote, and stops them following, posting and commenting) or **Unsuspend**. Every action is in the audit log. Support staff can read the tab.
- **The word filter** (`src/server/moderation.ts`) checks handles, names, comments and custom exercise names: whole words only, after undoing capitals, accents, leetspeak and doubled letters, against a short list of slurs kept as SHA-256 hashes (so they aren't written out in this public repo). **Links are refused** in names and comments. Comments are 280 characters.
- **Limits per account per day** (`DAILY`): 100 follows, 20 posts, 100 comments, 500 likes, 30 reports, 300 lookups. The post owner can delete any comment on their post.
- **Leaving Friends** (its settings) deletes the profile, posts, likes, comments, follows, blocks and the reports they made; a suspended profile's row stays, so leaving and rejoining can't undo a suspension. **Deleting the account** deletes all of it (`socialDeletes`, part of `deleteAccount`).

## How it works

- Server: `src/server/social.ts`, one route `POST /api/social/` with `{op, …}` (`me`, `join`, `update`, `leave`, `lookup`, `follow`, `unfollow`, `answer`, `people`, `block`, `unblock`, `report`, `post`, `unpost`, `posted`, `feed`, `person`, `thread`, `like`, `comment`, `uncomment`, `activity`), so the phones need one CORS-allowed path. Tables in Turso: `social_profiles`, `follows`, `blocks`, `posts`, `post_likes`, `post_comments`, `reports`. The feed is posts from accepted follows plus your own, newest first, 20 at a time.
- **Activity is worked out, not stored**: new followers, requests, likes and comments on your posts, from the tables themselves; `seen_at` on the profile marks what's been read.
- App: `src/lib/social.ts` (calls, the `useSocial` store, building a post from the event log) and `src/components/app/Friends.tsx`. Text in `friends.*`, six languages.
- **Platforms:** pure web code calling the server, like sync and share links, so Android, iOS and the web app get it together; no native code. Push notifications are stage 2 (Open items).
- Analytics: `feature` events `social_join`, `social_follow`, `social_post` (`tap` or `auto`), `social_report` (`<kind>:<reason>`), `social_leave`. No handles, names or text.
- Tests: `src/server/social.test.ts` (privacy defaults, following, the feed's visibility, likes and comments, blocking, report hiding and staff actions, suspension, account deletion) and `src/components/app/Friends.test.tsx` (the screens against the real server code). The accessibility run scans Friends signed out, the feed, comments, activity, people and a person's page.
