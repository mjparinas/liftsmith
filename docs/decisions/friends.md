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
- **Posts are for accepted followers only**, never public, never in search. A post carries the workout summary only (`PostBody` in `src/lib/socialTypes.ts`): time, sets, volume, new-best count, muscles worked, and per exercise its id, sets and best set. The server keeps only those fields (`parsePost`), so heart rate, body weight or fat, measurements, cycle data, injuries, gyms and places can't get in. Exercises travel as ids, so each reader sees the names in their own language and weights in their own unit; a custom exercise's name goes along (through the word filter).
- **Finding people is by exact handle** or a shared profile link (People › Share my profile). There's no directory, search or suggestions, so the list of users can't be browsed or scraped, and lookups are rate-limited.

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
