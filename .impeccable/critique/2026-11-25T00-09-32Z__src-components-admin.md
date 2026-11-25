---
target: /admin
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/melvinparinas/.cursor/worktrees/liftsmith/a98g/src/components/admin"
timestamp: 2026-11-25T00-09-32Z
slug: src-components-admin
closed: true
---
Method: dual-agent (A: 790a6584-97ca-46a5-8e94-aae6641200d5 · B: 0b60ac09-5a23-4323-904b-15a6af84e1b3)

# Critique: `/admin` (src/components/admin) — Operate

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | NeedsYou silent on fetch error; Reports arm is visual-only |
| 2 | Match System / Real World | 3 | Reports opens with a policy essay |
| 3 | User Control and Freedom | 3 | Reports arm has no Esc / click-away cancel |
| 4 | Consistency and Standards | 2 | Destructive confirms diverge across Reports / Users / Flags |
| 5 | Error Prevention | 3 | Two-tap Remove/Ban present; Ban still low ceremony |
| 6 | Recognition Rather Than Recall | 3 | Moderation rules read-once-then-recall |
| 7 | Flexibility and Efficiency | 3 | Inbox shortcuts strong; no tab accelerators / bulk Reports |
| 8 | Aesthetic and Minimalist Design | 2 | Always-on 21-tab chip wall |
| 9 | Error Recovery | 3 | Stats error shell good; NeedsYou still null-fails |
| 10 | Help and Documentation | 2 | No Operate map; Reports help is a paragraph |
| **Total** | | **28/40** | **Good** |

## Design Specificity Verdict

**LLM:** Partially authored for Liftsmith Operate. Midnight Forge chrome, Needs you, Inbox waiting model, and triage Overview are product-shaped; always-visible 21-destination nav and Numbers suite still read as interchangeable SaaS admin.

**Deterministic scan:** CLI `detect` exit 0 with 1 advisory — `design-system-font-size` at AdminChrome.tsx:125 (`0.7rem` role chip off DESIGN.md ramp, smallest listed 0.75rem). Browser overlay on Sign-in found `dark-glow` on `.btn-primary` (design-system intentional / FP). Authenticated tabs not scanned (sign-in gate).

## Overall Impression

Prior fixes (two-tap Reports, Overview KPIs, Inbox More, error shell) landed and nudged the score, but the desk still greets staff with a chip wall. Biggest opportunity: progressive nav so Work/triage dominates and Numbers stays one intentional door away.

## What's Working

1. Triage-first Overview — Needs you + 4 KPIs + More metrics.
2. Inbox power desk — Waiting default, Archive/Done primary, documented j/k/e/d/r/.
3. Forge-skinned chrome + shaped skeletons; recoverable stats error shell.

## Priority Issues

### [P1] Always-on 21-destination nav
- **Why:** Extraneous load on every task; phone wrap before content.
- **Fix:** Work + badges always; collapse Numbers/Running until opened; keep deep links.
- **Suggested command:** `/impeccable distill`

### [P1] Reports unread wall + thin arming UX
- **Why:** Policy essay before first judgment; Confirm re-label without Esc/live region.
- **Fix:** Short task cards + policy link; sticky/modal confirm with consequence; Esc clears; announce armed.
- **Suggested command:** `/impeccable clarify` (+ harden for confirm)

### [P2] Inconsistent destructive patterns
- **Why:** Reports vs Users vs Flags vs Maintenance teach different ceremonies.
- **Fix:** One danger pattern across Operate.
- **Suggested command:** `/impeccable harden`

### [P2] NeedsYou swallows errors
- **Why:** Overview can look quiet when To Do API is down.
- **Fix:** Recoverable alert + Retry like the stats shell.
- **Suggested command:** `/impeccable harden`

### [P3] Touch / one-primary polish
- **Why:** Nav under 44px; many `.btn-primary` peers on Needs you rows.
- **Fix:** ≥44px targets; one primary per region.
- **Suggested command:** `/impeccable audit` / `/impeccable quieter`

## Persona Red Flags

**Alex:** Inbox shortcuts delight; no cross-tab accelerators; no bulk Reports; Numbers is mouse-only.

**Sam:** Chip targets `min-h-9`; Reports Confirm lacks aria-live/pressed; Inbox More via `<details>` is weak for SR; 21 nav buttons before content.

**Riley:** NeedsYou silent fail; armed confirm can stick across rows; mixed failure honesty vs stats shell.

## Minor Observations

AuthCard composition is strong. Overview charts still dilute triage after scroll. Badge uses primary gradient (high chroma). HowItWorks should migrate beyond Gyms. Keep Canadian plain staff copy.

## Questions to Consider

1. Why is Revenue as clickable as Inbox on every viewport if Operate’s job is clearing human work?
2. Would progressive nav (Work always; Numbers behind a door) still satisfy “all options visible” via deep links + badges?
3. Should Ban feel as heavy as delete-account, or is two-tap enough after three reports?
4. What if Overview ended after Needs you + 4 KPIs and charts lived only on Numbers?
