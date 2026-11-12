# Growth: organic, the Hevy way

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code. Marketing channels, the creator program and the rules we hold in marketing are in [Marketing and growth](marketing-and-growth.md); website traffic and SEO are in [Public pages and SEO](public-pages-and-seo.md). This file is the strategy that ties them together, and the list of what to build next for growth.

## Decided

- **Follow Hevy's model** (Melvin, 2026-11-12: "Can we try to follow Hevy's growth strategy? Organic growth, minimal spend, customer delight"). Growth comes from the product and the people who use it, not from buying installs. Still no paid ads and no ads in the app, ever ([Marketing and growth](marketing-and-growth.md), [Money](money.md)).
- **Who we grow through** (Melvin, 2026-11-12): regular gym users, trainers and their clients, and gyms themselves. The other groups below are Claude's suggestions until Melvin picks.
- **Gyms: claimed gyms, a gym finder and gym pages, with a poster and QR stand** (Melvin, 2026-11-12). Being built in its own thread ("Let gyms claim their page and find gyms"); its decisions go in that thread's own topic file, not here. This file only says how it fits the growth plan (below).

## What Hevy did (sources, read 2026-11-12)

- About 2 million downloads in its first four years on roughly $15k of ad spend in total, half of them in the last five months of that span: word of mouth plus the App Store and Google Play algorithms rewarding retention and ratings ([RevenueCat, Sub Club podcast with Guillem Ros, 2023](https://www.revenuecat.com/blog/growth/guillem-ros-hevy-podcast)).
- Bootstrapped. Pro priced low on purpose (about $3 a month, $24 a year at the time), which means low revenue per user, so they **"doubled down on virality"**: the social feed made people follow each other, and those follows formed communities that brought friends in (same source).
- A generous free app (unlimited logging) so nobody has a reason to leave for a cheaper tracker; Pro for the extras ([Starter Story, 2024](https://www.starterstory.com/hevy-breakdown), lower confidence).
- Exercise library pages and a blog for search traffic (same, lower confidence), and later **Hevy Coach**, a separate paid product for personal trainers whose clients use the free Hevy app, so every coach brings their clients.

What we take from it: the loop that matters is **a lifter brings a friend because training together in the app is better**, plus **people who bring a crowd** (coaches, gyms, creators) getting something for it. Low price and a generous free tier make the recommendation easy to give. Delight is what makes people give it.

## What we already have (2026-11-12)

| Loop | Built |
| --- | --- |
| Friend to friend | Friends tab: feed, likes and comments, invite links and QR "Scan to follow" (mutual follow, Play install referrer carries the invite), challenges, clubs and gym crews, monthly challenge for everyone, friend coach's notes ([Friends](friends.md)) |
| Share outward | Share cards for workouts, PRs, badges, levels, progress and recaps; public links with previews and a "Try Liftsmith" button ([Sharing](sharing.md)); shared routine links ([Programs](programs.md)); public profiles `/u/<handle>/` |
| Coach brings clients | Trainer mode out of Labs: coaching is Pro, being a client is free, invite links that skip most of setup, `/coaches/` page in six languages ([Trainer mode](trainer-mode.md)) |
| Creator brings followers | Creator codes: 30% of net for 12 months, 30-day trial for followers, `/c/<code>/` landing ([Marketing and growth](marketing-and-growth.md)) |
| Search | 2,000+ exercise pages, guides, 50+ blog posts, tools and embeddable calculators, compare and import pages, home and pricing in six languages ([Public pages and SEO](public-pages-and-seo.md)) |
| Gym to lifter | Share a gym's kit as a link, and a nearby gym list from lifters who opt in ([Gym sharing](gym-sharing.md)); claiming, gym pages and the QR stand are being built now |
| Switching | CSV import from Strong, Hevy, Fitbod, StrongLifts and JEFIT |
| Delight | Coach's notes with reasons, juice (sounds, haptics, bursts, mascot), achievements, levels, streaks, anniversaries, month and year recap, seasonal challenges |
| Measuring | First-touch UTM on the website and Play install referrer on Android (`analyticsSchema.ts`), tagged sources `share`, `invite`, `coach`, `creator`, `profile` |

So the loops exist. What's missing is mostly the **reward for bringing people**, the **ask at the right moment**, and the **official side of gyms** (claiming, pages, the stand).

## Who else (suggested segments)

Ranked by how cheaply we can reach them and how well the app already serves them.

1. **People switching from another app.** Fitbod over its price, Strong and Hevy users who want the plan made for them. Import is built and the compare pages exist; the reach is search and Reddit.
2. **Home and garage gym owners.** Equipment matching and the plate solver fit exactly; they gather in a few big communities (r/homegym, garage gym YouTube). Home gym equipment brands and YouTubers are natural creator-code partners.
3. **Lifters coming back from an injury, and physiotherapists.** Injury mode plans around what hurts. A physio who hands a patient a free app with a "train with your coach" link is a trainer in all but name; the coach side already works for them.
4. **Women who lift.** Cycle-aware readiness, the female 3D figure, and a lot of under-served search terms. Reach: creators.
5. **Lifters over 40.** Fitness age, fitness tests, joint-friendly swaps, age-adjusted strength score. Reach: search ("strength training over 40" posts exist) and older-lifter creators.
6. **University and college strength clubs, and campus rec centres.** One club leader brings 30 to 100 lifters through a club link; dense, social, and they switch apps together.
7. **People training for a physical test** (police, fire, military). A fixed date and fixed lifts suit blocks and the goal planner; a small set of very specific search pages.
8. **Wearable owners** (Garmin, Apple Watch, Wear OS, Oura, WHOOP). The watch apps and connections are a reason to pick us; their forums and connect-app directories list partner apps for free.
9. **Gym staff and front desks.** Not a segment that pays, but they hand the new member the app on day one. Covered by the gym program.

Not recommended: corporate wellness (sales-led, slow, needs a team) and school teams under 16 (age rules and consent).

## Recommendations, ranked

Ranked by expected growth per hour of Melvin's time and per dollar. Each says whether it's **build** (Claude writes the code) or **do** (Melvin, with Claude drafting). Nothing here is decided until Melvin picks.

1. **Ask for a store rating at a happy moment (build, small).** The stores' own review prompt (Play In-App Review, `SKStoreReviewController` on iOS, nothing on the web) after a moment of delight: a new PR, a level-up or finishing the third workout, never during a set, at most once every 90 days and only after a week of use. Ratings and their count are what the store algorithms reward, which is the second half of Hevy's growth. It never asks for a good rating or rewards one (store rules and our marketing rules). Native code on both phones.
2. **Give a month, get a month (build, medium).** A friend who joins through an invite link and finishes three workouts gives both of them a month of Pro, up to 12 months earned a year. It rides on what exists: invite codes, mutual follows, and server-side Pro grants on the account (`pro_grants`, the way lifetime codes work), so it works on Android, iOS and the web and needs no store offer. The three-workout bar stops fake accounts paying out. This is the reward Hevy's loop didn't need because its price was so low; ours is higher, so a reward helps.
3. **Coaches with active clients get Pro free (build, small).** A coach with 3 or more clients who trained in the last 14 days gets Pro on the account for as long as that holds. Hevy charges coaches separately; we'd pay them in Pro for bringing people, which turns every coach into a recruiter. Pairs with a short outreach list to local trainers and physios (do).
4. **The gym program (separate thread, build plus do).** Claimed gyms, the gym finder, gym pages and the QR stand are the most local loop we have: a lifter scans the stand, the gym and its equipment are picked, and they see who else trains there. Suggestions for that thread: claimed gyms get a club and leaderboard of their own for members who opt in; the gym page shows "N lifters train here" only above a small floor (say 10) so nobody can be singled out; **start with a free printable poster PDF** the gym prints itself and ship the plastic stand only to claimed gyms with 20+ lifters, so spend follows proof (a stand plus shipping is roughly $15 to $30 each).
5. **Liftsmith Wrapped in late December (build small, do).** The year recap already exists and opens from 26 December. Give it a story-sized share card set (top lift, total volume, sessions, strongest month, "stronger than in January") built for Instagram stories, and a one-week push to share it. Spotify-style year-ends are the cheapest viral moment of the year, and this one is six weeks away.
6. **"You asked, we built it" (build small, do).** Hevy's community stuck because users felt heard. When a release ships something from feedback, `#/whats-new` (and the web page) credits "asked for by lifters", and the feedback sender gets a short email or in-app note saying their idea shipped. Costs nothing and makes fans who tell others.
7. **Store listing experiments (do).** Play Console store listing experiments on the icon, first screenshot and short description, one at a time, plus the listing in all six languages. Free, and it compounds with every visitor search and the gym program send.
8. **Partner directories (do, after Play approval).** Garmin Connect IQ store, Health Connect and Apple Health app lists, Oura and Withings partner pages, AlternativeTo, SaaSHub, Product Hunt. Each is a free, permanent link from a page lifters already visit.
9. **A public routine library (build, larger, later).** Shared routines become indexable pages (`/routines/<slug>/`), opt-in, with the builder's handle, like Hevy's explore. Good for search and for creators, but it needs moderation first, so it waits until Friends has real users.
10. **Campus clubs (do, later).** Free Pro for the club leader (a promo code) in exchange for running their club in a Liftsmith club. Only after the gym program shows the club board works in the wild.

## How we'll know (no public numbers)

- **Share of installs from people** (`invite`, `share`, `coach`, `creator`, `profile`, gym QR) against search and the store's own browse. Hevy-style growth means this share rises.
- **Invites per active lifter per month** and **invite to third workout**, the two halves of the friend loop.
- **Store rating and rating count**, weekly.
- **Clients per coach** and **lifters per claimed gym**.
- These stay on the admin panel; none are shared publicly ([Marketing and growth](marketing-and-growth.md)).
