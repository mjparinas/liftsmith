# School teams: free for high school coaches and their athletes

Melvin, 2026-11-13: "can we make the app free for anybody in high school or below? even high school coaches? is that a good idea or not?" We talked it through and he approved this shape ("ok do that"): **free Pro for high school coaches who prove a school email address, and free Pro through the team for their athletes aged 13 to 18. Nobody under 13. No open, self-serve student discount.** Body composition and public profiles are off by default for minors. He also asked for blog posts ("dont forget to add blog posts for this").

## Why through coaches

- A coach brings a whole team, students build the habit early, and teams talk.
- Most teenagers have no email address we can check, so an "I'm in high school" button would be used by adults. A coach with a school address is checkable, and it puts a responsible adult next to every athlete.
- Under 13 brings in COPPA in the US (and the lowest digital age of consent in the EU is 13), and Liftsmith stores health data, so under 13 stays out entirely.

## Proving a school (`src/server/teams.ts`)

- Coaching › **School teams** › Confirm my school: the school's name and the coach's school address. We email a six-digit code (30 minutes, 5 tries counted before comparing, 5 codes a day per account).
- **Free mail never counts** (`FREE_MAIL`: Gmail, Outlook, iCloud, Yahoo, Proton, Canadian ISPs and others).
- **Known school domains are approved at once:** patterns only schools get (`k12.<state>.us`, `.sch.uk`, `.ed.jp`) and every domain staff have trusted (`school_domains`). Anything else waits for staff on the **admin Users tab › School coaches** card (`SchoolCoaches.tsx`, `/api/admin/schools/`, audited): **Approve** trusts the domain (that coach and everyone waiting there, and the next coach is approved at once), **Reject** turns down this coach, **Block domain** stops the domain for good (a company, a university, a domain anyone can get an address at). Canadian school boards (`sd35.bc.ca`, `tdsb.on.ca` …) have no common pattern, so the first coach at each board goes through staff.
- **The proof lasts a school year** (`verifiedMs`, 400 days), then the coach confirms the address again. A coach who leaves the school loses the address, so free Pro ends for them and their athletes.

## Teams

- A verified coach makes up to **5 teams**, each with a name and an 8-character code (same alphabet as coach codes) that lasts until the coach makes a new one or deletes the team. **Send invite** shares `#/trainer/team.<code>`.
- **Joining:** the athlete enters the code (or opens the link), picks their age from 13 to 18 (prefilled from Your stats), and sees what joining shares before **Join the team**. The server checks the age too. Joining links them as the coach's client (`coach_links`, trainer mode), so the coach gets the usual reports, routines, notes and chat. A verified school coach can have up to **300 clients** (other coaches stay at 30); a team holds up to 100 athletes. Joining still counts toward the athlete's 3 coaches.
- **What the coach sees** is trainer mode's workouts-only view (`KEEP` in `coach.ts`). Body data is never shared through a team; the client's own per-coach Share body data switch is hidden for under 18s until they turn body composition on.
- **Leaving:** Leave team (athlete), Remove (coach, from the roster) or Delete team ends the coach link too, unless the athlete is on another of that coach's teams.
- **Free Pro** (`schoolPro`, checked in `accessFor` after every paid and earned source): `school` for a verified coach, `team` for an athlete on a verified coach's team whose age at joining puts them at most 19 this year (a birth year can't tell an 18-year-old from a 19-year-old). The Pro screen says where it comes from (`pro.status.school`, `pro.status.team`).
- **The team board** (Team board, a sheet): teammates' first names and their workouts and sets in the last 7 days, most workouts first, for the team's coach and athletes only. Never weights, body numbers or a public page. It leads with the action (how many haven't trained yet this week, who leads).

## Teen-safe defaults (`src/lib/teen.ts`, `social.ts`)

- **Under 13 can't set up the app:** setup's age box says Liftsmith is for 13 and older and Continue stays off (`tooYoung`). Age stays optional, as before.
- **Under 18 by the profile's age, body composition is off until they turn it on** (Body › Health › Body fat and body shape, `profile.bodyComp`): the body fat box under weigh-ins, the body fat pin on the figure, Shape the figure like me and the per-coach Share body data switch are hidden. Weigh-ins and training work the same.
- **Friends:** someone under 18 (by a team's age or their synced profile's birth year, `isMinor`) can't make their profile public, and starts out of suggestions to strangers (they can opt in). Profiles were already private by default.

## Platforms

Pure web code on the server and in the app, so Android, iOS and the web app get it in the same change, with no native code and no platform gap.

## Also

- Features page: `school-teams` under For coaches, in all six site languages. Blog: three posts (`src/content/blog/o.ts`): the announcement, a guide for high school coaches and one for teens starting to lift.
- Analytics: `feature` `team` with `join`, `leave`, `schoolCode`, `verified`, `pending`, `make`, `invite`, `newCode`, `remove` and `delete`. No names, schools or ids.
- Deleting an account deletes its school proof, its teams (their athletes become teamless) and its places on teams (`teamDeletes`).
- Not built: a club (non-school) team plan, parent accounts, and school districts buying for many coaches. Physiotherapists are a separate thread that also builds on trainer mode.
