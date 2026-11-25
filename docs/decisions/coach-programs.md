# Coaches' programs: sharing and selling them (Melvin, 2026-11-15; built)

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

Melvin asked for item 4 of a gap list on 2026-11-15: "a program marketplace where coaches sell training programs", paid through the Stripe Connect setup coaches already use for client payments ([Trainer mode](trainer-mode.md) "Payments through Stripe Connect").

## Where a paid program is bought (Melvin chose, 2026-11-15)

**Website checkout only.** A coach's program is a digital good used in the app, so Google Play and the App Store require their own billing for it when it's bought in the app (unlike personal training, a real-world service, which is why client payments can go through Stripe everywhere). Melvin picked, on a decision card, "Website checkout only" over showing the price in the apps with "on the website" (which both stores may treat as steering) and over in-app purchase (15 to 30% to the stores, fixed price tiers, coaches paid out by hand). So:

- The **web app** (`/app/`) lists every listed program with its price and sells paid ones on a Stripe Checkout page on the coach's own Stripe account.
- The **Android and iOS apps** show only free programs and programs the lifter already has. A paid program they don't have is never listed, shows no price, no buy button and no link (`canBuyHere`, `shownHere` in `src/lib/coachPrograms.ts`; the apps ask the server for `?free=1`). Opening a paid program's link there says it isn't available. Once bought on the web, it's theirs in the apps too, on every device they sign in on.
- A coach's own Programs tab shows their prices in the apps too: that's the seller managing what they sell, not a purchase.

## What a program is

- **A few of the coach's routines as its days** (1 to 7, in order), plus a title (60 characters), a few words about it (600), a level (beginner, intermediate, advanced, any), a goal (strength, muscle, fitness, fat loss, sport), how many weeks to run it (1 to 16) and a price (empty is free; 1 to 500 in the coach's Stripe currency). Each day travels as the same routine share code as shared routine links and routines from a coach (`encodeRoutine`): exercises, sets, supersets, warm-up, cool-down and cardio parts, **no weights or reps**, because the lifter's own progression fills those in. No second program editor: the days are routines made the usual way (one control, one destination).
- **Up to 20 programs per coach.** Title and words go through the same filter as Friends (`checkText`: no links, no blocked words).
- **Only adults list programs** (a profile under 18 can't save one, and a coach who turns out to be under 18 by birth year isn't listed).

## Coach side: Coaching › Programs

- A new tab on the coach's pages (`#/trainer/programs`, `CoachPrograms.tsx`), for every coach: free programs need no payments. **New program** opens the editor: name, about, the days (chips of the coach's routines, numbered in the order picked; with no routines, **Make a routine** opens the routines sheet), level, goal, weeks, price (only once their Stripe account takes payments; otherwise a line saying to set up payments) and **On the list**. A sports coach, including a school coach, does not see a price, a sale count, or that Stripe line (`sports` on `CoachPrograms`). Saving a program there stores it as free.
- Each program shows Listed or Off the list. A personal trainer or physio also sees its price and how many it sold. A sports coach, including a school coach, does not. Editing keeps its days unless the coach picks new ones. **Share link** (the phone's share sheet, or copy) shares `https://www.getliftsmith.com/app/#/program/<id>`; **See it as a lifter** opens the program page.
- **Delete** removes a program nobody has; a program somebody bought is only taken off the list instead ("Take it off the list"), so nobody loses what they paid for. Off the list, only the coach and people who have it can open it.
- The coach gets a push for each sale (`coachProgramSold`, once per payment).

## Picking the days (Melvin, 2026-11-25: "i dont understand how these programs work for coaches")

- The editor says what a day is, right under **Days**: one workout, done in order (Day 1, then Day 2), with weights from each lifter's own history.
- **The picked days come first, in the order they run** (1, 2, 3, 4), then the coach's other routines A to Z (`dayChoices` in `coachProgramTemplates.ts`). It used to list routines newest first, so four picked days read 4, 3, 2, 1.
- **Identical copies show once.** Two routines are the same day when their share code matches (name, exercises, sets and parts) and neither belongs to a coach assignment (`routineKey`). Routines that share a name but differ say how many exercises each has.
- **A template reuses what it already made.** Tapping Upper / Lower or Push / Pull / Legs used to make four or six new routines every time, so a coach who tried them a few times had dozens of "Upper A"s. Now an unchanged day routine is reused, and only a day the coach changed gets a new one.
- **Remove N identical copies** (under the chips, only when there are some) deletes the extra copies from the coach's routines, keeping the picked one, today's routine, or else the newest (`extraCopies`). Programs already saved are untouched: their days travel as codes on the server.
- Pure web code, so Android, iOS and the web get it together.

## Lifter side

- **Settings › Program** gets **From coaches**: the programs the lifter has, and **Browse coaches' programs** (`#/program`), the list, newest first.
- **A program's page** (`#/program/<id>`): who made it (name and role), level, weeks, days a week, goal, about, and each day with its exercise and set counts. A day's exercises show only once the lifter has it (or it's free); then each day opens the shared routine preview. **Get it free** / **Save all days to my routines** saves every day as a routine in one tap (days already in their routines are skipped), and a free one goes on their list when they're signed in. On the web, a paid one has **Buy for {price}** (signed in) or **Sign in to buy**; Stripe sends them back to `#/program/<id>~paid`, which says thanks and looks again for a few seconds while Stripe's webhook arrives.
- Under 18s can get free programs but can't buy one (the server refuses with `teen`, and the page says why).

## Money

- **The coach is the merchant**, as with client payments: the Checkout session runs on the coach's connected account (direct charge), so receipts, refunds and disputes are theirs. Liftsmith's share is `feeFor` (the `coachPayFee` flag, 2% by default, only from a coach on plain Pro once coach plans are on; Coach, Coach Plus and high school coaches pay nothing), as `application_fee_amount`.
- **The Connect webhook** (`/api/coach/stripe/`) passes each event to `storeProgramEvent` first: `checkout.session.completed` with `metadata[kind] = program` gives the buyer the program, only when the event's account is the program's coach's; `charge.refunded` (fully refunded) takes it back, matched by payment on that coach's account. Everything else goes on to client payments as before. Stripe resends events, so each sale is recorded and announced once. The live Connect endpoint listens for `charge.refunded` (added 2026-11-16).
- **Deleting an account** removes the programs it has and the programs it made (with who had them); lifters keep any days they already saved to their routines, since those live on their own devices.

## Code

`src/server/coachPrograms.ts` (tables `coach_programs` and `program_owners`), `/api/programs/` (`src/app/api/programs/route.api.ts`), `src/lib/coachPrograms.ts`, `CoachPrograms.tsx` (coach), `CoachProgram.tsx` (list and page), `Programs.tsx` (From coaches), text in `src/locales/text/cpg.ts` and the glossary term `coachPrograms`. Pure web code plus the server, so Android, iOS and the web app get it together; the only platform difference is where a paid program can be bought ([Platform deltas](platform-deltas.md)).

## Ratings (Melvin, 2026-11-16: "build public seo pages for both")

- **Only someone who has the program rates it**, after two weeks with it (`PROGRAM_REVIEW_LIMITS.days`), so a rating says how it went rather than how it looked. Never its own coach, and only adults. One review per lifter and program, 1 to 5 stars and an optional line of up to 500 characters through the Friends text filter (no links); they can change or delete it. **Only confirmed owners count** (Melvin, 2026-11-16: "can confirmed purchasers provide reviews"): a review counts and shows only while its writer still has the program, so a refund or dropping a free program takes it out of the rating and the list, and getting the program back brings it back. A review from someone who paid shows **Verified purchase** (`verified`, in the app and on the public page).
- **Nobody sees a program's rating or reviews until it has three** (`shown`), except its coach, who sees every review from the first one and replies once to each in public. The coach gets a push the first time a lifter rates one of their programs (`coachProgramReview`).
- **Reports** use the coach reviews' path: kind `review` in `reports`, three reports hide it, and Admin › Reports handles both kinds unchanged (`locate` in `coachReviews.ts` looks in `coach_reviews`, then `program_reviews`).
- **In the app** the program's page (`#/program/<id>`) has a Ratings section (`ProgramReviews.tsx`): the stars and count, a form for a lifter who can rate it, their own review with Edit and Delete, a line on when they can, and for its coach every review with a reply box. Reviews show the reviewer's first name and last initial, or "A lifter".
- Code: `src/server/programReviews.ts` (table `program_reviews`), the `review`, `unreview` and `reply` actions on `/api/programs/`, and `rating`, `reviews` and `mine` on `GET ?id`.

## Public pages (2026-11-16)

- **`/coach-programs/`** lists every listed program of an adult coach, grouped by goal, with its price and rating (most reviewed first, then newest, up to 500), and **`/coach-programs/<slug>-<id>/`** is one program: who made it, level, goal, weeks, days, about, the price, its rating and latest reviews once it has three, and the coach's other programs. A free program lists each day's exercises; a paid one shows only how many exercises and sets each day has, because the exercises are what's being sold. "Get it" opens the program in the web app, where a paid one is bought.
- Plain HTML with no scripts, in the reader's language, under the share pages' strict CSP, drawn per request like the trainer directory (`src/server/programPage.ts`, `/api/programs/page/`, rewritten in `next.config.ts`). An old slug redirects to the program's own address; an unlisted, removed or under-18 coach's program is a noindex 404 showing the list. Structured data: `ItemList` on the list and a `Course` provided by the coach (`provider`, `offers`, and `aggregateRating` and `review` once it has three) on each program, never a `Product`, which Google reads as a merchant listing (`appSchema.test.ts`).
- In `/sitemap-gyms.xml` and the daily IndexNow ping (dated by `updatedAt`), and linked from the site footer (Programs from coaches). Web only: these are website pages, so there is nothing for the apps to do.

## Assign to clients and teams (Melvin, 2026-11-24; built)

A coach assigns a multi-day program as a **weekday-bound standing plan** for N weeks — school teams and personal-training clients share the path (athletes are already coach clients).

- **Templates:** New program offers **Upper / Lower** and **Push / Pull / Legs** (`coachProgramTemplates.ts`): creates day routines with default weekdays; the coach can edit before saving.
- **Assign to…** on a program (and from a school team or client report): all clients, pick clients, or a team. Snapshots days and weekdays into `coach_program_assigns`. Athletes get a push and Today **Follow this program** once; that sets `planSource.kind = "coachProgram"`. Today shows that weekday's day; off days show rest / "no lift scheduled".
- **Program calendar:** month grid (desktop two-column like Schedule; phone grid + day card) with Done / Not yet / Scheduled roster (first names, never weights). Separate from Coaching › Schedule (booking).
- **Coaching delivery, not purchase:** assign sends day codes even if the program is priced; never creates paid `program_owners` (teens never buy). Free programs may still grant ownership.
- Code: `src/server/coachProgramAssign.ts`, `src/lib/coachProgramAssign.ts`, `ProgramCalendar.tsx`, `ProgramAssignToday.tsx`. Feature `coach-assign-program`.

## Not built yet

- Listing a coach's programs on their trainer directory entry, and staff hiding a program from the admin panel (the `hidden` column is there; programs pass the text filter on the way in).
- Writing every programmed day into the phone OS calendar; assigning built-in Pro adaptive splits as `planSource`.
