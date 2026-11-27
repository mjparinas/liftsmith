# 30-day challenges: printable calendars on the website, tracked in the app

**Asked:** Melvin, 2026-11-27, traffic idea 2 of 6 from "Find new ways to grow traffic" ("do them all, put effort into them"): 30-day challenge pages for squats, push-ups, plank, pull-ups and more, each with a printable calendar that carries the site link and a "Join in the app" button, aimed at "30 day ___ challenge" searches and Pinterest.

## What a challenge is

- One bodyweight move a day for 30 days, a little more each day, **a rest day every fourth day** (4, 8, … 28), so day 30 is the biggest day.
- **Twelve challenges** (`THIRTY_CHALLENGES` in `src/lib/thirtyDay.ts`): squat, push-up, plank, pull-up, sit-up, glute bridge, lunge (counted per leg), wall sit, burpee, dead hang, calf raise and mountain climber. Holds (plank, wall sit, dead hang) count seconds.
- **Three levels** each, Beginner, Intermediate and Advanced, each with its own day 1 and day 30 and, where it matters, its own exercise: Beginner push-ups are knee push-ups and Beginner pull-ups are slow negatives, so nobody starts with a move they can't do yet.
- The 30 numbers come from one function, `thirtyPlan`: day 1 is the level's start, day 30 its end, the training days between climb evenly and never go down, rounded to a step that reads well (ones while small, then twos, fives, tens). The website's calendar, the printed sheet and the app all read it, so paper and phone never disagree (AGENTS.md "One source per number").

## The website

- `/challenges/` lists them; each has `/challenges/30-day-<move>-challenge/`, the words people search. Both are in all ten site languages (`/de/challenges/…`) with hreflang, in the sitemap at 0.8 and 0.7, and in the footer's Learn column. Each page has its own preview card (`public/og/challenges/`, the exercise's 3D figure) and `ExercisePlan` and `FAQPage` structured data.
- A page has: the app's own name and why for the challenge (`c30.<id>.name` and `.why`, read through `fromApp.ts`, so the site and app agree), the level chips with the 30-day calendar, which levels do what, the rules, how to do the move (the exercise's own setup, cues, still and muscles, linking to its exercise page) and four questions. Its words are in `src/locales/site/challenge.ts`.
- **Print the calendar** prints one page at the level picked: black on white whatever the theme, the 30 days with a box to tick, a line for a name and a start date, the page's address and a QR code that opens the page with `?from=print` (CSS in `globals.css`, `.print-sheet` and `.print-only`). The printed address is the backlink.
- **Join in the app** opens `/app/#/challenge/<id>~<level>` at the level picked. On Android the website's challenge pages also open the app (App Links: `challenges` joined `TRANSLATED` in `appLinks.ts` and the manifest), at the challenge's screen.
- Pinterest: the page's preview card is its image. Auto-made pins are their own thread (traffic idea 4).

## The app

- **Tools › 30-day challenges** (`#/challenge`) lists them with your running ones on top; `#/challenge/<id>` is one challenge: the level chips, today's number with what you did on a `BumpField` (the target by default) and **Done**, the calendar filling in, How to do it (the exercise page) and Leave. `ThirtyDay.tsx`.
- **Today** shows each running challenge with the day's line and a one-tap **Done** (no typing), or "Day 3 done. Rest tomorrow, then day 5" with **Undo**. Nothing shows when none is running.
- **Every number says why** (AGENTS.md): day 1 is "a number most beginner lifters can do today", later days are "up from 25 on day 3", a rest day says rest helps the next day, and back after a gap says the day waited.
- **Days are steps, not dates.** Day N is the next day not done, one per calendar day, and a rest day takes one calendar day of its own. A missed day never fails the challenge, it waits (no streak to lose, Melvin's "action over stats" and the kindest rule for a beginner). Undo takes back a day logged today.
- **Events**, so it syncs and is derived, never stored: `thirtyJoin` (challenge and level; joining one already running changes its level and keeps its days), `thirtyDay` (the join's id, the day and what was actually done) and `thirtyLeave`. Only the next day counts, so two devices logging the same day count it once. Store actions in `src/lib/store/thirty.ts`.
- **Up to three at once** (`THIRTY_MAX_ACTIVE`), so Today stays short.
- **Not workouts:** challenge days never count as Liftsmith workouts, so no sets, bests, XP, streak, weekly goal or recovery map. Keeps the training engine's numbers honest and the plan unchanged.
- **Pregnancy mode:** a challenge whose move the mode leaves out (lying on the back or belly, jumps, crunches) says so on its screen; joining stays the lifter's choice.
- **Free**, for everyone, and **not behind an unlock** (unlocks.ts): people arrive from the website's Join in the app on their first day.
- Pure web code, so Android, iOS and the web app get it together. The only native change is the Android App Links entries for the pages; iOS Universal Links are still deferred (open-items.md).
- Words in `src/locales/text/c30.ts`, all ten languages.

## Not done

- No reminders or pushes for a challenge day yet; Today and the weekly email carry it. Worth adding as its own switch in Settings › Reminders if lifters ask.
- No friend or group challenges on the same plan yet (Friends has its own challenges).
