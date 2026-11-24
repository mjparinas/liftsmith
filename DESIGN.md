---
name: Liftsmith
description: Dark, trustworthy strength training UI — Midnight Forge glass with Trust Cobalt accent
colors:
  bg: "#080b10"
  surface: "#10151d"
  raised: "#18202b"
  line: "#232d3a"
  ink: "#eef2f7"
  muted: "#94a1b2"
  faint: "#808c9d"
  primary: "#4c8dff"
  primary-light: "#1d4fc4"
  accent-2: "#8b7bff"
  accent-ink: "#06122a"
  btn-ink: "#06122a"
  forge-violet: "#a78bfa"
  rest-cyan: "#38d6e8"
  ember: "#ff8a3d"
  done-mint: "#34d399"
  warn: "#f5b544"
  bad: "#f0605d"
  gold: "#f2c14e"
  grad-a: "#5b9cff"
  grad-b: "#7f8bff"
  grad-c: "#9b86ff"
  light-bg: "#f4f6f9"
  light-surface: "#ffffff"
  light-raised: "#eaeef3"
  light-line: "#d3dae3"
  light-ink: "#0e1621"
typography:
  display:
    fontFamily: "Inter, Roboto, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(2rem, 6vw, 3rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  screen-title:
    fontFamily: "Inter, Roboto, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  sheet-title:
    fontFamily: "Inter, Roboto, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  card-title:
    fontFamily: "Inter, Roboto, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, Roboto, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, Roboto, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.12em"
rounded:
  card: "20px"
  control: "1rem"
  pill: "999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  gap-cards: "1rem"
  desk-col: "42rem"
  desk-btn: "25rem"
components:
  button-primary:
    backgroundColor: "linear-gradient(135deg, {colors.grad-a} 0%, {colors.grad-b} 55%, {colors.grad-c} 100%)"
    textColor: "{colors.btn-ink}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  chip:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  input:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
---

# Design System: Liftsmith

## Overview

**Creative North Star: "The Midnight Forge"**

Liftsmith looks like a dark, trustworthy forge for serious lifting: deep navy-black surfaces, one Trust Cobalt accent, and raised glass cards under a soft top aurora. The system is professional and calm on the gym floor — lively in small springs and bursts, never loud mid-set. Brand lives in precise tokens, tabular numbers, and a single primary action per screen.

Personality is dark-default, tactile glass, and restrained craft. Supporting hues (Forge Violet, Rest Cyan, Ember, Done Mint) tint marks and cards; they never become body text. Status colours (mint / amber / coral) keep their meaning. Light mode keeps the same structure with deeper cobalt for contrast. Accessibility is part of the identity: WCAG 2.2 AA, colour-blind safe tokens, Lean mode, and rem-based type.

Confirmed visual rejections: competitor fitness-app skins; purple-on-white SaaS gradients; cream-serif “wellness brochure”; emoji chrome; loud gamification neon on core workout UI.

**Key Characteristics:**
- Dark navy forge base with Trust Cobalt as the rare accent
- Blue→violet primary gradient; one primary per screen
- Raised glass cards (20px) with hairline + top sheen
- System sans (Inter / Roboto); extrabold screen titles; tabular display numbers
- Soft glass lift + aurora glow; motion short and purposeful (none during a set except what was touched)

## Colors

A dark navy forge palette with one Trust Cobalt accent and four supporting tint hues; green, amber, and red stay reserved for status.

### Primary
- **Trust Cobalt** (`#4c8dff` dark / `#1d4fc4` light): brand accent, focus rings, selected chips, links, and the cool end of the primary button gradient. Rarity matters — keep accent area modest on any screen.
- **Forge Gradient** (`#5b9cff` → `#7f8bff` → `#9b86ff` dark; deeper blue→violet in light): primary actions only (`.btn-primary`).
- **Accent ink** (`#06122a` dark / `#ffffff` light): text on the primary button (`--btn-ink`).

### Secondary
- **Forge Violet** (`#a78bfa`): levels, Pro marks, quotes, legs family tint (darkened on light screens).
- **Rest Cyan** (`#38d6e8`): rest timers, time cues, pull family tint.
- **Ember** (`#ff8a3d`): streaks, challenges, core family tint.
- **Done Mint** (`#34d399`): completion, fresh recovery, push/good status.

### Tertiary
- **Warn Amber** (`#f5b544`) and **Bad Coral** (`#f0605d`): warnings and errors only; never decorative.
- **Gold** (`#f2c14e`): awards / legendary rarity accents.
- Season kit hues (Tempest, Bloom, Solstice, Maple, Obsidian) appear only when a training season is active.

### Neutral
- **Forge Void** (`#080b10`): page background (dark default).
- **Forge Surface** (`#10151d`): cards and panels.
- **Forge Raised** (`#18202b`): inputs, secondary buttons, raised rows.
- **Forge Line** (`#232d3a`): hairline borders.
- **Forge Ink** (`#eef2f7`): primary text.
- **Forge Muted** (`#94a1b2`) / **Forge Faint** (`#808c9d`): secondary and tertiary text.
- Light neutrals: paper bg `#f4f6f9`, white surface `#ffffff`, raised `#eaeef3`, line `#d3dae3`, ink `#0e1621`.

### Named Rules
**The One Accent Rule.** Trust Cobalt (and its gradient) is the only brand accent on a screen; supporting hues are tints for marks and card glows, never body copy.

**The Status Means Status Rule.** Mint, amber, and coral communicate recovery and feedback only — never pure decoration on core workout chrome.

**The Token Rule.** Every colour is a CSS variable in `globals.css` with dark and light values; never hard-code a hex in a component.

## Typography

**Display Font:** Inter (with Roboto / system-ui)
**Body Font:** Inter (with Roboto / system-ui)
**Label/Mono Font:** same stack; tabular nums via `.display` / `.num`

**Character:** Clean system sans — professional, gym-legible, never decorative. Weight does the hierarchy; letter-spacing tightens only on titles and display numbers.

### Hierarchy
- **Display** (800, large / clamp, line-height 1, tracking −0.03em): workout weights, reps, timers (`.display`).
- **Screen title** (800, 1.75rem, tight): every screen `h1` via `ScreenHeader` / `SCREEN_TITLE`.
- **Sheet title** (800, 1.25rem, tight): sheets and dialogs (`SHEET_TITLE`).
- **Card title** (700, 1.125rem, snug): in-card headings (`CARD_TITLE`).
- **Body** (400, 1rem, 1.5): default UI copy; prefer rem so Accessibility text size scales.
- **Label** (600, 0.75rem, uppercase, tracking 0.12em, muted): section labels (`SECTION_LABEL`).

### Named Rules
**The One Title Scale Rule.** Never invent heading sizes by hand — use `ScreenHeader`, `Section`, `Sheet`, or the shared title classes.

**The Tabular Numbers Rule.** Any weight, rep, timer, or readiness figure uses tabular numerals.

## Layout

Phone-first app chrome with a five-tab bar (Today, Body, Progress, Friends, Awards). Content clears the bar via `--nav-h` and `.clear-nav`; safe-area padding on top and bottom. Cards in stacks always use gap (never touching). Screens use `.aurora` for the soft top glow.

On desktop web (`data-layout="desktop"`): sidebar replaces the tab bar; pages widen; sheets become centred dialogs; the workout stays a focused phone-width panel. Full-width buttons on side pages cap at 25rem (`.desk-fit`); form-like columns at 42rem (`.desk-col`); multi-card flows use `.desk-cols` (two columns, 1.5rem gap).

Spacing rhythm: Tailwind rem scale; card-to-card gap ≥ 1rem in the app; server-drawn site cards get 16px between siblings. Touch targets ≥ 44px; Log set stays fully on-screen on supported devices.

### Named Rules
**The No Touching Cards Rule.** Two bordered rounded surfaces never sit closer than a visible gap (CI `e2e-gaps.mjs`).

**The One Primary Rule.** Exactly one primary action per screen.

## Elevation & Depth

Soft glass lift: surfaces read as raised glass through a hairline border, a faint top sheen, and a short soft drop shadow — not heavy Material elevation stacks. Depth also comes from the tonal ladder (bg → surface → raised). A fixed aurora glow sits at the top of screens (radial Trust Cobalt / violet washes).

### Shadow Vocabulary
- **Card lift** (`inset 0 1px 0 var(--sheen-edge), 0 8px 24px -16px var(--shadow)`): default `.card`.
- **Tinted card lift** (same inset + coloured soft shadow): `.card-tint` with `--tint`.
- **Primary glow** (`0 10px 28px -10px` mixed from `--grad-a`): `.btn-primary`.
- **Toast float** (`0 8px 24px var(--shadow)`): transient toasts.

### Named Rules
**The Soft Glass Rule.** Prefer hairline + sheen + short shadow over large multi-layer drop shadows.

**The Calm Motion Rule.** Springs and bursts are short; Lean mode and `prefers-reduced-motion` cut them. Nothing moves during a set except what the lifter just touched.

## Shapes

Gently rounded forge tiles: cards at 20px radius; controls (buttons, inputs) at ~1rem (`rounded-2xl`); chips, switches, and toasts go fully pill (999px). Borders are 1px `--color-line` (or tint-mixed on `.card-tint`). No sharp rectangles for primary chrome; no excessive pill clusters in marketing heroes.

Icons: one hand-drawn stroke set (24-unit grid, 2px), never emoji in app chrome. App mark: anvil with a loaded barbell. Mascot: original kettlebell, only in quiet empty/setup moments.

### Named Rules
**The Glass Tile Rule.** Cards are rounded rectangles with sheen — not floating opaque blobs or hard Material cards.

## Components

Tactile glass: controls should feel pressable (`.press` squash) and readable at a glance in the rack.

### Buttons
- **Shape:** generously rounded (~1rem / `rounded-2xl`)
- **Primary:** blue→violet gradient, `--btn-ink` text, coloured soft shadow; one per screen
- **Secondary / default:** raised surface, ink text, hairline
- **Hover / Focus:** focus ring from accent; press squash (`scale(0.95)`, primary stretches `1.02 / 0.9`)
- **Desktop:** full-width primary on side pages caps at 25rem

### Chips
- **Style:** raised or accent-wash backgrounds; pill radius; muted/ink text
- **State:** selected shows a tick (colour never the only cue); filter chips for gym finder etc.

### Cards / Containers
- **Corner Style:** 20px
- **Background:** surface + top sheen gradient; optional `--tint` radial for hero cards
- **Shadow Strategy:** Soft Glass Rule
- **Border:** 1px line (tint-mixed when tinted)
- **Internal Padding:** typically 16px; stacks use gap

### Inputs / Fields
- **Style:** raised field, rounded control, ink text; prefer `BumpField` (− box +) over bare typing for numbers
- **Focus:** accent border / ring
- **Switches:** `Switch` / `SwitchRow` / `InlineSwitch` for on/off — never On/Off chip pairs

### Navigation
- **Phone:** five-tab bar with safe area; active state uses accent; Friends can show a count dot
- **Desktop:** left sidebar with the same destinations plus Programs, Tools, Coaching, Settings
- **Sheets:** modal dialogs with ✕ Close, drag-to-dismiss, Escape; labelled by title

### Signature: Display numbers & empty states
- **Display numbers:** extrabold tabular figures for weight/reps/timers
- **EmptyState:** tinted icon tile, title, one help line, optional action; mascot only where the UI is otherwise quiet

## Do's and Don'ts

### Do:
- **Do** use CSS tokens from `globals.css` for every colour, including status and CVD variants.
- **Do** put screen titles through `ScreenHeader` / `SCREEN_TITLE` and section labels through `Section`.
- **Do** keep one primary gradient button per screen and gap every card stack.
- **Do** prefer steppers, chips, and switches over typing on the gym floor.
- **Do** honour dark default, light theme, colour-blind safe, and more-contrast modes.

### Don't:
- **Don't** hard-code hex colours in components.
- **Don't** use competitor names, art, or look-alikes; don't put emoji in app chrome.
- **Don't** add a second control that opens the same sheet/page already reachable on that screen.
- **Don't** animate for decoration during a set, or stretch desktop side-page buttons past 25rem.
- **Don't** invent purple-on-white, cream-serif wellness, or neon gamification for core workout UI.
