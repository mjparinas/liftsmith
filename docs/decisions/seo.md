# SEO: ranking and click rate (2026-11-17)

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. The pages themselves (which exist, which are indexed, the sitemap) are in [Public pages and SEO](public-pages-and-seo.md); this file is about how they're written to rank and get clicked. Record decisions about this topic here, in the same change as the code.

## Where we started

Melvin pasted the admin Search panel on 2026-11-17 (Oct 18 to Nov 14, about four weeks of data on a new domain): 15,491 times shown, 3 clicks, average position 19.4, most searches at position 50 to 90, 3,680 sitemap pages. The "Worth a better title" list was empty because almost nothing showed on page one. So the problem is ranking first and click rate second. The pages that did rank 6 to 25: `/exercises/box-squat/alternatives/` (11.5), `/exercises/db-row/alternatives/` (25.5), `/exercises/towel-row/` (27.3), `/blog/beginner-gym-workout-plan/` (9.5), `/blog/30-minute-strength-workout/` (6.5). Searches with impressions included "ab wheel rollout", "1 rep max calculator", "2 plates and a 25 on each side", "7 plates on each side" and "one arm db row alternative".

## What changed (2026-11-17)

- **Titles say what people search** (`src/lib/exerciseMeta.ts`). Exercise pages: `<Lift>: how to do it, muscles worked, <n> alternatives` (lifts with a guide: `…, sets and reps`). Alternatives pages: `<n> best <lift> alternatives (home and gym)`. Each title and description is the first of a list of candidates that fits search-result length (`SEO_TITLE_MAX` 60, `SEO_DESCRIPTION_MAX` 158), so long names fall back to a shorter form instead of being cut. `exerciseMeta.test.ts` checks every one of the ~1,000 exercises.
- **Descriptions lead with the answer.** An exercise page's description starts with the muscles it works ("The doorway towel row works the upper back and lats."), and an alternatives page's names the best three swaps ("Can't do the one-arm dumbbell row? Try the …"), so the snippet answers the search before the click.
- **Every exercise page answers questions, with FAQ data.** Lifts with a guide keep their written FAQ; the rest get three answered from their own data (`exerciseFaq`: muscles worked, equipment needed, what to do instead). Alternatives pages get their own (`alternativesFaq` in the page: the best swap and why, a no-equipment swap, a dumbbell, machine or kettlebell swap where one exists, which muscles a swap should train). Both carry `FAQPage` JSON-LD next to the existing `HowTo` and `ItemList`. Google shows FAQ and HowTo rich results only for a few sites now, so the point is the answers on the page, not the rich result.
- **More alternatives pages in search** (Melvin confirmed, 2026-11-17: "pr 575 is fine"). Changed from 2026-11-12 (only the ~50 guided lifts): `indexAlternatives` now also indexes the lifts in pick weights' `STAPLE` and `COMMON` lists with at least three alternatives, 242 pages (from 50), because the pages now differ from each other (named swaps, FAQ) and Search Console showed people searching alternatives to everyday lifts without a guide (the box squat was ranking 11.5 while `noindex`). The niche rest stay `noindex, follow`. Revisit if Search Console's "Crawled, currently not indexed" grows with alternatives pages.
- **Blog posts can have a search title** (`seoTitle` on `Article`): the headline stays on the page and in share cards, the search title carries the words people type. Set for the beginner plan ("Beginner gym workout plan: 3 days a week for 8 weeks"), the 30-minute workout, the dumbbell home workout, the no-equipment workout and lifting on a cut. Use it only when the headline misses the search words; keep it under 60 characters.
- **Calculators aim at their searches.** The one-rep max page is titled "1RM calculator: one rep max calculator for any lift" and answers "What is a one-rep max?". The plate calculator has a **plates per side chart** (1 to 8 plates a side: 45s, 45s and a 25, 45s and a 10, 20 kg and 25 kg plates; `src/lib/plateChart.ts`) and answers "How much is 3 plates?", "2 plates and a 25 on each side?", "7 plates on each side?" and "a plate in kg?" from the same numbers.
- **Internal links to the pages that rank.** The home page (every language) has a Free guides section linking 12 popular exercise guides (`HOME_GUIDES` in `HomeView.tsx`, each must have a guide), the plate and 1RM calculators, programs and muscles. The exercises hub lists the guided lifts first. Exercise pages list the blog posts that link to them (`articlesLinking`), so links go both ways between a post and the lifts it teaches.

## What to watch in Search Console

Give it two to four weeks after the release (Google recrawls a new domain slowly; IndexNow covers Bing).

- Performance › Pages: position and clicks for the five pages above, and for `/tools/plate-calculator/` and `/tools/one-rep-max-calculator/`.
- Performance › Queries: "plates" searches and "<lift> alternative" searches moving up; the admin's "Worth a better title" list filling as pages reach page one (that's the next round: rewrite those).
- Indexing › Pages: alternatives pages under "Crawled, currently not indexed". If many of the ~190 newly indexed ones land there, go back to the guided lifts only.

## Rules

- A new page template gets a title built for the search (what, then the intent words: how to, muscles, alternatives, chart, calculator) through a candidates list that fits 60 characters, and a description that answers first.
- Blog copy stays English only and never names another app; competitors appear only on compare, alternatives and import pages ([Public pages and SEO](public-pages-and-seo.md)).
- Structured data only describes what's on the page. No fake ratings, no `Product` for the app.
