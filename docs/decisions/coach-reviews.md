# Coach ratings and reviews

Melvin, 2026-11-15: "what do you think of a rating system for coaches?", then "yes please" to the proposal: verified clients only, stars plus a short review, one public reply, hidden until three reviews, reports through the existing moderation queue, no public reviews from teens, and a results number next to the stars.

Code: `src/server/coachReviews.ts` (rules, table `coach_reviews`), `/api/coach/reviews/` (`src/app/api/coach/reviews/route.api.ts`), `src/lib/coachReviews.ts` (the app's calls), `src/components/app/CoachReviews.tsx` (the screens), `src/server/trainerPage.ts` (`ratingHtml`, `ratingLd`), text in `src/locales/text/rev.ts` and the `gp.rev*` lines of `gp.ts`. Tests: `src/server/coachReviews.test.ts`.

## Who can review

- **Only a coach's own client**, linked in Coaching (`coach_links`). Covers coaches, personal trainers and physios alike: the role only changes words.
- **Only after working together long enough to know:** four weeks linked (`REVIEW_LIMITS.days`, 28), or sooner once there are two sessions paid (`coach_payments`) or held (booked `coach_slots` that have ended) (`sessions`, 2). Before that the client sees when they can rate.
- **Adults only.** A client under 18 by their profile's birth year or a school team (`isMinor` in `teams.ts`) can't leave one and is told reviews are for 18 and over. Unknown age counts as adult, the same as everywhere else on the server.
- **One review per client and coach** (primary key on the pair). The client can change it while they're still the coach's client and delete it any time. It stays up after they stop working together, because a review of a coach who was let go is still true.
- One to five whole stars, and optional text up to 500 characters through the same filter as Friends (`checkText`: no links, no blocked words).
- The coach gets a push the first time a client reviews them (`coachReview`), never on edits.

## What others see

- **Nothing until three reviews** (`REVIEW_LIMITS.shown`): no average, no stars and no review text, so one unhappy client can't sink a new coach. Before that a coach's invite says "New here: their rating shows once they have 3 reviews." The coach sees every review of them from the first, so they can reply.
- The reviewer shows as **first name and last initial** ("Ana L."), or "A client" with no name; the form says so before posting.
- **Results next to the stars:** once a coach has three or more current clients (`outcomeClients`), "N of M clients trained in the last 2 weeks", from finished workouts the clients' phones synced (`sessionEnd` events). It's shown whether or not there are enough reviews, because it's a count, not an opinion, and with three clients it can't single anyone out. (Action over stats: it answers "will this coach keep me training?")
- **Where:** a coach's invite (the consent card a lifter sees before agreeing, `CoachRatingPreview`), the trainer directory city pages on the website (stars, count, results and the two latest reviews with the coach's reply), and the coach's own Coaching › Setup (`MyReviews`). The client's own review sits under their coach on Coaching (`RateCoach`).
- **Structured data:** on the directory, each `Person` with enough reviews carries `aggregateRating` and up to three `Review`s, the same ones the page shows. schema.org allows ratings on a Person; Google only draws review stars for some types (local businesses, products and a few others), so stars in search results aren't promised.
- The review id is a hash of the pair (`reviewId`), so pages and reports never show an account id.

## Replies and reports

- **One public reply per review** from the coach, which they can change or clear. A coach can't delete or hide a review.
- **Anyone signed in can report** a review or a reply (reasons: spam, bullying, hate, sexual content, pretending to be someone else, something else). Nobody can report their own words. Reports go into the existing `reports` table as kind `review` (target `<id>` or `<id>.reply`), and **three different people hide it** until staff decide.
- Staff decide on the admin **Reports** tab like any other report: Remove deletes the review (or clears only the reply, keeping the review), Dismiss shows it again. Ban author applies only to Friends, so it shows only when the author has a Friends profile.
- Changing a reply that was reported clears its open reports, since they no longer describe it.

## Platforms

Pure web code: Android, iOS and the web app get it together; the directory is website only. Deleting an account deletes the reviews it wrote and the reviews of it (`coachCleanup`).

## Also

- Features page: `coach-reviews` (2026-11-15). Blog: "Coach ratings and reviews from clients who trained with them" (`src/content/blog/ad.ts`). Weekly tips: C7 `coach-reviews`, `fresh`.
