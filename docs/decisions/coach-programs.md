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

- A new tab on the coach's pages (`#/trainer/programs`, `CoachPrograms.tsx`), for every coach: free programs need no payments. **New program** opens the editor: name, about, the days (chips of the coach's routines, numbered in the order picked; with no routines, **Make a routine** opens the routines sheet), level, goal, weeks, price (only once their Stripe account takes payments; otherwise a line saying to set up payments) and **On the list**.
- Each program shows Listed or Off the list, its price and how many it sold. Editing keeps its days unless the coach picks new ones. **Share link** (the phone's share sheet, or copy) shares `https://www.getliftsmith.com/app/#/program/<id>`; **See it as a lifter** opens the program page.
- **Delete** removes a program nobody has; a program somebody bought is only taken off the list instead ("Take it off the list"), so nobody loses what they paid for. Off the list, only the coach and people who have it can open it.
- The coach gets a push for each sale (`coachProgramSold`, once per payment).

## Lifter side

- **Settings › Program** gets **From coaches**: the programs the lifter has, and **Browse coaches' programs** (`#/program`), the list, newest first.
- **A program's page** (`#/program/<id>`): who made it (name and role), level, weeks, days a week, goal, about, and each day with its exercise and set counts. A day's exercises show only once the lifter has it (or it's free); then each day opens the shared routine preview. **Get it free** / **Save all days to my routines** saves every day as a routine in one tap (days already in their routines are skipped), and a free one goes on their list when they're signed in. On the web, a paid one has **Buy for {price}** (signed in) or **Sign in to buy**; Stripe sends them back to `#/program/<id>~paid`, which says thanks and looks again for a few seconds while Stripe's webhook arrives.
- Under 18s can get free programs but can't buy one (the server refuses with `teen`, and the page says why).

## Money

- **The coach is the merchant**, as with client payments: the Checkout session runs on the coach's connected account (direct charge), so receipts, refunds and disputes are theirs. Liftsmith's share is `feeFor` (the `coachPayFee` flag, 2% by default, only from a coach on plain Pro once coach plans are on; Coach, Coach Plus and high school coaches pay nothing), as `application_fee_amount`.
- **The Connect webhook** (`/api/coach/stripe/`) passes each event to `storeProgramEvent` first: `checkout.session.completed` with `metadata[kind] = program` gives the buyer the program, only when the event's account is the program's coach's; `charge.refunded` (fully refunded) takes it back, matched by payment on that coach's account. Everything else goes on to client payments as before. Stripe resends events, so each sale is recorded and announced once.
- **Deleting an account** removes the programs it has and the programs it made (with who had them); lifters keep any days they already saved to their routines, since those live on their own devices.

## Code

`src/server/coachPrograms.ts` (tables `coach_programs` and `program_owners`), `/api/programs/` (`src/app/api/programs/route.api.ts`), `src/lib/coachPrograms.ts`, `CoachPrograms.tsx` (coach), `CoachProgram.tsx` (list and page), `Programs.tsx` (From coaches), text in `src/locales/text/cpg.ts` and the glossary term `coachPrograms`. Pure web code plus the server, so Android, iOS and the web app get it together; the only platform difference is where a paid program can be bought ([Platform deltas](platform-deltas.md)).

## Not built yet

- Public, indexable program pages on the website (`/coach-programs/<id>/`) and listing a coach's programs on the trainer directory. The share link opens the web app for now.
- Ratings on programs (coach ratings are their own feature), and staff hiding a program from the admin panel (the `hidden` column is there; programs pass the text filter on the way in).
