---
target: /admin section
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/melvinparinas/.cursor/worktrees/liftsmith/a98g/src/components/admin"
timestamp: 2026-11-24T23-05-02Z
slug: src-components-admin
---
Method: dual-agent (A: 9f90a95e-a301-45b3-8be9-a9ec1f84273a · B: dc7c4fbc-d6e4-43f5-89c1-687e65f6b7a8)

Target: `/admin/` (`src/components/admin`) · Mode: Operate

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Badges + skeletons strong; NeedsYou silent on fetch fail; stats error strips shell |
| 2 | Match System / Real World | 3 | Work copy is plain; Numbers still speak DAU/MRR without triage framing |
| 3 | User Control and Freedom | 3 | History + Escape work; destructive paths uneven (confirm vs none) |
| 4 | Consistency and Standards | 3 | Skin matches app; nav badges misuse `.btn-primary`; title scale drift |
| 5 | Error Prevention | 2 | Users reset is type-to-confirm; **Reports Remove/Ban fire with no confirm** |
| 6 | Recognition Rather Than Recall | 2 | 21 always-visible tabs; phone chips hide Work/Numbers group labels |
| 7 | Flexibility and Efficiency | 3 | Inbox shortcuts + HeaderSearch; no command palette; search clears after find |
| 8 | Aesthetic and Minimalist Design | 2 | Sign-in is tight; Overview 8 peer tiles + analytics walls fight Operate focus |
| 9 | Error Recovery | 2 | Inline alerts OK; bare stats-error page has no shell, nav, or Sign out |
| 10 | Help and Documentation | 3 | Gyms HowItWorks / Flags prose help; Reports opens with dense policy wall |
| **Total** | | **26/40** | **Fair — usable, high-cost mistakes and IA density dominate** |

## Design Specificity Verdict

**LLM assessment:** Authored for Liftsmith (Midnight Forge), not a stock Retool skin. `AdminChrome` / `AdminAuthCard` reuse the app mark, aurora, glass cards, Trust Cobalt primary, stroke icons, and Work / Numbers / People / Running groups. Residual generic SaaS: KPI-tile grids, multi-`BarList` walls, dense payout tables.

**Deterministic scan:** CLI `detect --json src/components/admin` exited **0** with **1** advisory: `design-system-font-size` at `AdminChrome.tsx:125` (`0.7rem` on the staff role badge). Treat as likely intentional micro-label (false-positive suspect), not a body-type breach.

**Visual overlays:** Injection succeeded on the sign-in gate (`http://localhost:3000/admin/`). Overlay reported **dark-glow** (“GLOWING SHADOW ACCENTS”) on the **Email me a link** primary button — that glow is the design-system `.btn-primary` shadow, so treat as a **false positive** against DESIGN.md’s Soft Glass / primary glow vocabulary. Authenticated deep tabs were not overlay-scanned (auth gate).

## Overall Impression

Admin wears the product correctly and leads with action (NeedsYou, badges, To Do / Inbox). The biggest gap is Operate trust: irreversible moderation without confirm, a 21-destination IA that collapses on phones, and a stats-error state that abandons the shell. Skinning is ahead of triage UX.

## What's Working

1. **Action-first Work spine** — NeedsYou before stats; waiting badges; Gyms sub-parts (To do / Import / Gym list) model good nested IA.
2. **Brand-coherent chrome** — aurora, mark, grouped sidebar from `lg`, shared icons; feels like Liftsmith, not a bolted-on admin.
3. **Staff-speed affordances** — Inbox keyboard path, shaped skeletons, Users type-to-confirm, Flags “Are you sure?”, narrow `Table` → cards.

## Priority Issues

### [P0] Reports Ban / Remove with no confirm
- **What:** `Reports.tsx` danger actions call `act()` immediately from the row (`onClick={() => void act(g, a.action)}`).
- **Why it matters:** Highest-cost staff mistake on a dense list; Ban/Remove sit beside Dismiss with equal visual weight.
- **Fix:** Confirm sheet naming the target and effect; demote Ban relative to Remove/Dismiss; mirror Users’ type-to-confirm for Ban.
- **Suggested command:** `/impeccable harden` (Reports destructive actions)

### [P1] Phone IA is a 21-chip wall
- **What:** `AdminShell` wraps all tabs; Work/Numbers/People/Running labels are `hidden lg:block`.
- **Why it matters:** First-week support and on-call scans can’t tell Work from Numbers; recognition fails.
- **Fix:** Collapsible groups, Work-only default + More, or sticky Work row with Numbers in overflow — copy Gyms’ nested-parts pattern upward.
- **Suggested command:** `/impeccable adapt` (AdminChrome mobile navigation)

### [P1] Stats error strips the product
- **What:** `AdminApp` `state === "error"` renders a bare `<main>` outside `AdminShell`.
- **Why it matters:** No Sign out, no To Do/Inbox, no recovery while still “signed in.”
- **Fix:** Keep shell; banner + Retry; allow Work tabs that don’t need the stats payload.
- **Suggested command:** `/impeccable harden` (AdminApp error recovery chrome)

### [P2] Overview dilutes Operate intent
- **What:** After NeedsYou, eight equal `Tile`s (`TileBones n={8}`) compete as peer KPIs.
- **Why it matters:** Product principle “action over stats” is contradicted by dashboard theater on the default tab.
- **Fix:** Cap to 3–4 action-linked KPIs; park the rest under Numbers or “More metrics.”
- **Suggested command:** `/impeccable quieter` (Overview tiles)

### [P2] Inbox open-state action soup
- **What:** Multiple peer border buttons plus primary Archive-and-next; keyboard help `hidden md:block`.
- **Why it matters:** Support must re-parse actions every message; shortcuts invisible on the widths staff often use.
- **Fix:** One primary progression; fold secondary toggles into More; surface shortcut hints on all widths.
- **Suggested command:** `/impeccable distill` (Inbox message actions)

## Persona Red Flags

**Alex (Power User):** `HeaderSearch` clears after navigate; no jump-to-tab / command palette; Codes payout still uses `window.prompt`; Inbox shortcuts disappear on narrow widths.

**Sam (Support, week one):** 21 unlabeled phone chips; can see waiting badges but may lack write power with no escalate affordance; Ban sits equal to Dismiss; shell-less error page strands them.

**Melvin-owner (To Do / Inbox scan):** NeedsYou truncates at 5; Overview still mounts full stats skeleton under triage; Reports stacks Friends + gym report streams without sub-nav; NeedsYou fetch failure silently hides the triage card.

## Minor Observations

- Locale helpers use `en-US` while product English is Canadian.
- Nav count badges use `.btn-primary` (filled CTA language) instead of count-dot treatment.
- `AdminAuthCard` title uses ad-hoc `text-xl` instead of `SCREEN_TITLE`.
- Sign-in is the best Operate screen: one job, clear CTA, build stamp.
- `Table` phone cardization and `aria-busy` skeletons are above typical internal-tool quality.

## Questions to Consider

1. If Melvin only opens admin to clear red badges, why is Overview still a Metrics dashboard instead of a full-width To Do?
2. Should Numbers collapse into one Insights surface (with Ask AI) instead of eight peer tabs competing with Inbox?
3. Is Ban allowed to share a row with Dismiss without typing the handle (as Reset already forces)?
4. For support, is a read-only Inbox with waiting badges worse than an explicit escalate path?
5. Does consumer-app skinning make Ban feel too casual?
