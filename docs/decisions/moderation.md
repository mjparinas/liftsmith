# Moderation: reporting profiles, the Users tab and resetting an account

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

Melvin, 2026-11-14: "users should be able to report a profile, on the admin i should be able to view users, see their reports (how many and by whom), and either ban, shadow ban, unban, and other possibilities that you suggest. reporting should also have a fixed list of reasons why". Then: "in the admin can you give the ability to reset an account (clear everything, but keep their login information)" and "ensure that you have an are you sure message that forces you to type their username correctly". Reporting posts and comments, the word filter and the Reports tab came first and are in [Friends](friends.md).

## Reporting (Android, iOS and the web app)

- **Fixed reasons per kind** (`REASONS_FOR` in `src/lib/socialTypes.ts`), one chip each, "Something else" always last:
  - *Profile:* spam or scam, bullying or harassment, hate, pretending to be someone else, offensive name or handle, under 13, fake lifts or cheating, something else.
  - *Post:* spam or scam, bullying or harassment, hate, sexual content, dangerous advice, fake lifts or cheating, something else.
  - *Comment:* the post list without fake lifts.
  The server refuses a reason that isn't on the kind's list. Avatars are preset pictures, not photos, so there's no "inappropriate photo" reason.
- **"Something else" asks for an optional note** (280 characters, `REPORT_NOTE_MAX`), the one typed field, shown only for that reason. Only staff read it.
- A profile report says "nobody is told who sent one. We review every report about a profile" (`friends.report.hintProfile`); posts and comments keep the "several reports hide it" line.
- Shared web code (`ReportSheet` in `Friends.tsx`), so Android, iOS and the web app get it together; nothing native. Text in all six languages.

## Standing on Friends (`src/server/socialModeration.ts`)

- **Only Friends is moderated.** A lifter's own workouts, settings, sync and account stay theirs whatever happens on Friends: the app is useful alone, and their data is theirs. "Sign out everywhere", Reset account and Delete account are separate admin tools.
- `social_profiles.suspended` is the standing: **0** fine, **1** suspended (until `suspended_until`) or banned (`suspended_until` 0), **2** shadow banned. Every existing `suspended = 0` filter hides both 1 and 2 from other people. Actions refuse only 1 (`barred` in `social.ts`).
- **Warn:** a notice in Friends with the reason and "Please keep to them, or your profile may be suspended", until the lifter taps Got it (`noticeSeen` op). Nothing else changes.
- **Suspend** for 1, 3, 7 or 30 days (`SUSPEND_DAYS`): hidden from everyone, can't post, comment, follow or cheer, live training removed; the notice gives the end. It lifts on its own: when the lifter next opens Friends (`liftIfOver` in `joined` and `me`) and in the daily admin job (`liftExpired` in `/api/cron/admin/`), so other people see them again even if they don't open the app.
- **Ban:** the same, with no end, and the account's email addresses go on a ban list as SHA-256 hashes (`social_bans`). Joining Friends from any account with a banned email is refused, so deleting the account and signing up again doesn't get around it. The hash stays after the account is deleted (abuse prevention); nothing else about the person is kept. Unban takes the account's hashes off the list.
- **Shadow ban:** the lifter carries on as usual and sees their own posts, comments and board line, but nobody else sees anything they do: their profile, posts, comments, likes' and cheers' sources, Activity lines, follow requests and Training now are all hidden by the existing filters, and no push goes out from them (`push.ts` reads the sender only when `suspended = 0`). They're never told; a warning still showing is cleared. For spammers and trolls who'd make a new account if they knew.
- **Unban** clears a suspension, ban or shadow ban and any notice.
- **Take off leaderboards** (`boards_off`, for fake lifts): left off other people's friends board, club boards and challenge standings, still on their own (`ON_BOARD` in `social.ts`), so nothing looks different to them. Posts and the feed are unchanged.
- **Reset name** (to the handle) and **reset handle** (to `lifter_` and six random characters; a name that was just the old handle follows it).
- **Dismiss reports:** closes every open report on the profile, its posts and its comments, and shows posts and comments hidden by reports again.
- Warn, suspend and ban take a reason staff pick (the top reason of the waiting reports to start), shown to the lifter in their language. The notice ends "Think we got it wrong? Tell us through Send feedback in Settings", the appeal path.
- The Reports tab's "Suspend author" is now **Ban author** (and Unban) and goes through the same `moderate()`, so it tells the lifter and adds the email to the ban list.

## The admin Users tab

- **Admins act, support staff read** (as everywhere on the panel). Every action is in the audit log as `mod.<action>` with the reason and days, `account.reset` for a reset.
- **List:** search by email, account id or `@handle`; filter by **Everyone**, **Reported** (reports waiting), **Banned, suspended or limited** (any standing other than fine, or off leaderboards) or **Under 18**; sort by **Newest**, **Most reported** or **Last seen**. Columns add the Friends handle with standing and Under 18 badges, and reports waiting and in all. Reports count against a person whether they're about the profile, a post or a comment.
- **Account page › Friends and reports:** the handle, name, standing (with a suspension's end), badges, then tiles for reports waiting, reports ever (from how many people), reports they sent (and how many staff dismissed, which can show someone reporting in bad faith) and what they've been told. **Who reported them:** each report with the reporter (handle or email, a link to their own account page, an Under 18 badge), the reason and note, what it was about (profile, the post's exercises or the comment), when and its status. Then the actions and **What staff did**, the audit history for this account from both tabs.
- **Teens** (school teams, ages 13 to 18; [School teams](school-teams.md)): an under 18 profile gets a badge and a note: teen-safe defaults apply, prefer a warning first, and a report that they're under 13 means deleting the account, because nobody under 13 may use Liftsmith. Reporters under 18 are marked too. Under 18 is read the same way as `isMinor` (a school team's birth year, or the birth year in the lifter's settings), by year in the list.

## Reset account

- **What's cleared:** synced workouts, body data and settings (`sync_events`, `sync_records`), shared links, Friends (everything `socialDeletes` covers), coaching links, chats, plans and check-ins (`coachCleanup`), shared gym setups, and connected apps (revoked at each service).
- **What's kept:** the account and its sign-in methods, staff notes, and everything that pays for or proves Pro: store purchases on its installs, a web subscription, coach payments, earned Pro, school team membership and official gyms they own or work at. A suspended, banned or shadow-banned Friends profile stays (an empty profile with its standing), so a reset can't undo moderation; a ban's email hash stays too.
- **Devices:** every session is ended, so each device gets the signed-out answer on its next request and wipes itself through the app's own sign-out path ([Accounts and sign-in](accounts-and-sign-in.md)); the old data can't sync back. The lifter signs in again to an empty account. One edge: changes made on a device that never reached the server (offline) are kept there by that path and offered back, as for any sign-out.
- **"Are you sure?"** A dialog lists what goes and what stays, and the Reset button waits until their Friends handle (their email without one, their id without either) is typed exactly; the server checks the same text.
