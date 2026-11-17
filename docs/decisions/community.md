# Community: ideas, bugs, votes and the roadmap

Melvin, 2026-11-17: "a community for the app itself. like voting for features that are missing, adding comments,
mentioning bugs, etc". Built in-house on our own database, filters and reports, with no third-party board.

## What lifters do

- **Settings › Help › Community** (`#/community`, `Community.tsx`), one row above Send feedback. The tab bar stays at five.
  Hidden while the admin flag `community` is off, which also stops new posts (the website keeps showing what's there).
- **Ideas and Bugs** are two lists, sorted Top (votes) or New, Open (Under review, Planned, In progress) or Done
  (Shipped, Won't do), with a search box. The board loads once (300 by votes plus the 100 newest) and is sorted and
  searched on the device, kept with `liveRead` so it opens at once and offline.
- **Posting** (`#/community/new`, `#/community/new-bug`): a title (8 to 100 characters), optional details (2,000), and for a bug
  one optional screenshot (a JPEG of at most 450 kB, shrunk on the device by `shrinkImage`). Bug reports carry the
  platform and app version for staff. While the title is typed, posts that share its words show under it
  (`similarPosts`) so a lifter votes instead of posting twice. Five posts, 60 comments and 300 votes a day per account.
  The author can delete a post only while it's Under review; after that it belongs to everyone who voted.
- **Voting:** one per account, the arrow beside each post (`aria-pressed`). The author's own vote is counted on posting.
- **Following:** posting, voting and commenting follow a post; a switch on the post turns its updates off (a later vote
  doesn't turn them back on). Followers get a push when its status changes (`communityShipped`, `communityFixed`,
  `communityPlanned`, `communityProgress`, `communityWont`), the author when someone comments (`communityComment`) or
  the team answers (`communityTeam`). The board's **Updates on what you follow** card lists posts whose status moved
  since the device last looked (`newsFor`, `liftsmith.community.seen`). No email for now.
- **Comments and @mentions:** 1,000 characters through the Friends filter. `@handle` is a Friends handle; Reply fills it
  in. A mention reaches someone only if they're already part of that post (its author, or following it), so it can't
  be used to reach a stranger (`communityMention`). Writers delete their own comments.
- **Statuses:** Under review, Planned, In progress, Shipped (Fixed, for a bug), Won't do, and Merged (a duplicate).
  Each change can carry a team note, shown on the post's timeline and, for Shipped, in the changelog.
- **Roadmap tab:** In progress, Planned and the changelog (what shipped, with the team's notes).

## Who shows, and teen safety

- A post or comment shows the writer's Friends name and handle, else their first name and last initial
  (`shortName`), else "A Liftsmith lifter".
- **Under 18** (school teams have lifters aged 13 to 18): no name or handle is ever stored or shown, and nothing they
  write is on the website (`teen` on posts and comments, `web: true` reads). They can still post, vote and comment
  in the app.
- **Screenshots** are only ever seen by their author (`/api/community/shot/`, signed in) and staff
  (`/api/admin/community/?shot=`), never on the website or to other lifters: a picture of the app can show a name,
  weights or health numbers. Deleted with the post and with the account.

## Moderation

- Everything goes through `checkText` (no links, no slurs). Anyone signed in can report a post or comment (spam,
  abuse, hate, sexual, danger, other); **three reports from different people hide it** until staff look. Reports are
  kind `feedback` in `reports` with targets `p:<post>` and `c:<comment>`, so they come to **Admin › Reports** with the
  rest: Remove, Dismiss (shows it again) and Ban author (blocks the account from the community, `community_bans`).
  An account banned or suspended on Friends can't post here either.
- **Admin › Community** (`components/admin/Community.tsx`, `/api/admin/community/`, admins act, support reads, every
  change audited): filter by status, search, open a post to set its status with a note (followers are told after the
  answer, in `after()`), merge a duplicate into the post it repeats (votes and followers move over, each counted once;
  the duplicate's page redirects), reply as the Liftsmith team, hide or remove a post or comment, block or unblock the
  author, and see the screenshot.

## The website

Server-drawn pages with no scripts under `SHARE_PAGE_CSP` (`src/server/communityPage.ts`, `/api/community/page/`):
`/community/` (top ideas, bugs being looked at, recently shipped), `/community/roadmap/`, `/community/changelog/` and
`/community/<slug>-<id>/` (status, votes, details, the timeline and comments, schema.org `DiscussionForumPosting`).
Reading only: every page links into the app to vote or post. A merged post 301s to the one it went into; a hidden or
under-18's post is a noindex 404; a post with fewer than three votes and no answer from the team is noindex
(`indexable`), so one-line ideas nobody backed don't fill the index. The lists and the indexable posts are in the gym
sitemap and IndexNow. A footer link (Product › Ideas and roadmap) is on every page.

## Account deletion

Votes come off the counts, comments go, screenshots go, posts still Under review go, and posts staff already answered
stay on the roadmap with no name on them (`communityCleanup`).

## Platforms

Pure web code plus our own server, so Android, iOS and the web app get it together; no native code.
