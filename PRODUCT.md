# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are strength lifters in a real gym (home gym or commercial), short on time, who need today's workout planned from the equipment and plates they own, which muscles are recovered, and where they are in their training block — then need to log sets with as few taps as possible mid-set.

Secondary audiences (confirmed in product rules): coaches and physios (trainer mode, rehab protocols, form videos), school coaches and athletes 13–18 (school teams, team sessions), and gyms (finder, class schedules, claimed gym pages). Friends/social and community feedback are supporting loops, not the core job.

## Product Purpose

Liftsmith is adaptive strength training for Android, iOS, and the web. The lifter picks how long they have; the app plans every set from their gym profile, recovery, and block, shows exactly which plates to load, and stays out of the way while they lift. Success means they finish the right work for today without fighting the app in the rack.

Works offline; stats live on the device. Sync is optional background for signed-in accounts.

## Positioning

Adaptive planning from owned equipment and plates, muscle recovery, and RIR periodization (build weeks and deloads), with exact plate loading on every barbell set and a workout UX that never adds a tap during a set. Focus on the workout, not the app: one-tap log as planned, next set pre-filled, rest timer starts itself.

An original app: may borrow category ideas but never uses competitor names, art, screenshots, exercise videos, or exact look in the UI. Exercise names, setup text, and cues are Liftsmith's own.

## Operating Context

Used on the gym floor (often one-handed, gloves, poor reception), on lock screen / Live Activity / watch companions during rest, and at home for setup, progress, Friends, and coaching. Website (getliftsmith.com) markets the product, hosts SEO/public pages, coach program checkout, and community; native shells open straight into `/app/`. Ten languages; Canadian English for `en`.

## Capabilities and Constraints

- Equipment and gym profiles including exact plates owned; workouts sized 15–90 minutes; barbell plate graphic per side; progressive overload with RIR blocks and deloads; exercise swaps keeping the same muscles; recovery body map; Bluetooth HR, Health Connect / Apple Health; lock-screen rest timer and live workout notification; offline-first event log.
- Free vs Pro (and Coach / Coach Plus) boundaries in `PRO_FEATURES` / money decisions; Labs are Pro experiments; features unlock by finished workouts for new lifters.
- Platform parity: every feature lands on Android and iOS together, plus web where it makes sense; one-platform gaps recorded in platform deltas.
- Stack is established: Next.js 16 (server + static export), React 19, TypeScript, Tailwind 4, Zustand, Capacitor 8 shells (`com.getliftsmith.app`), Vitest / Playwright CI. Not a greenfield stack choice.
- Undecided / open: none raised in init beyond what decision docs already mark as parked or investigating.

## Brand Commitments

- Name: Liftsmith; site: getliftsmith.com; contact: hello@getliftsmith.com.
- Maker is not named in public surfaces (website, apps, store listing, blog bylines); about page says independent developer.
- Voice: plain words, action over stats; every recommendation says why in a short line; jargon gets glossary "i" entries.
- Canadian English spelling in all user-facing English.
- App mark: anvil with a loaded barbell (original); mascot: original kettlebell, only in quiet empty/setup moments.
- Binding product principles from owner (Melvin) live in AGENTS.md and `docs/decisions/` — treat those as product authority alongside this file.

## Evidence on Hand

- Product and technical authority: README.md, AGENTS.md, `docs/decisions/` (per-feature decision records).
- Marketing/site copy and feature catalogue: `src/content/features.ts`, site locales, Play listing docs under `docs/`.
- Real UI screenshots and store art pipelines: `public/screens/`, `public/og/`, `scripts/site-screenshots.mjs`, Play listing scripts.
- Do not fabricate testimonials, customer names, benchmarks, or competitor comparisons that are not already in committed content.

## Product Principles

1. Action over stats — every screen answers "what should I do?" before "what happened?"
2. Focus on the workout — zero extra taps during a set; optional work waits for rest.
3. One control, one destination — no duplicate buttons to the same place on a screen.
4. Explain the non-obvious — glossary every training term a lifter might not know.
5. Offline-first and honest — local truth first; never invent social proof or competitor-derived identity.

## Accessibility & Inclusion

Target WCAG 2.2 AA everywhere, enforced in CI (`e2e-a11y.mjs`, colour-token tests, keyboard runs). In-app: text size, colour-blind safe palette, more contrast, Lean / reduce motion, one-handed workout controls, big numbers mid-set. Under-18 protections (privacy, email, social, body composition) are product requirements, not optional polish.
