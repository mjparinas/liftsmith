# Pregnancy and postpartum mode (Melvin, 2026-11-19; built)

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

- **Why** (gap analysis item 10, Melvin picked it 2026-11-19): pregnant and postpartum lifters only got a "check with a doctor" line. Like [Injury mode](injury-mode.md), this mode changes the plan itself, week by week, instead of adding a screen to read.
- **Where:** Settings › Body and units › Pregnancy and postpartum (`PregnancySettings.tsx`, under Cycle-aware readiness; in Settings search as `preg.title`). Hidden for lifters whose Your stats say male, unless it's already on. **Free**, like injury mode, because it's a safety feature.
- **Opt-in with its own consent sheet**, like the cycle: what it does, that it stays on the phone (only the user's own backup and sync move it, never analytics, ads or feedback reports), and that it isn't medical advice (check with a doctor or midwife, follow them, stop if something feels wrong).
- **No dates to type.** Pick I'm pregnant or I've had my baby, then the weeks on a `BumpField` (1 to 42 pregnant, 0 to 104 since birth); after birth a C-section switch. Stored on the profile as `pregnancy: { consentAt, due?, birth?, csection? }` (syncs like the rest of the profile; `wipe.ts` already clears the profile). The card's stepper corrects the weeks; **My baby's here** sets the birth to today; a due date 2+ weeks past with no birth counts as a birth on the due date. **Turn off** (or **I'm back to my usual training** in the last phase) removes it.
- **The rules** (`src/lib/pregnancy.ts`, from the 2019 Canadian guideline for physical activity in pregnancy (SOGC/CSEP), ACOG Committee Opinion 804 (2020) and the 2019 return-to-running guidance after birth). Pregnancy weeks count from the last period, as a midwife does.

  | Phase | Weeks | Load | Reps in reserve | Sets at most | Left out |
  |---|---|---|---|---|---|
  | First trimester | pregnant 1–13 | usual | 2+ | 4 | nothing |
  | Second trimester | 14–27 | 90% | 3+ | 3 | on the back, on the belly, jumps, crunch-style core |
  | Third trimester | 28+ | 80% | 3+ | 3 | the same |
  | Rest and recover | 0–5 after birth (0–7 after a C-section) | 50% | 4+ | 2 | jumps, running, crunch-style core |
  | Easing back in | 6–11 (8–13) | 70% | 3+ | 3 | the same |
  | Building back | 12–15 (14–17) | 85% | 2+ | 4 | nothing |
  | Nearly back to usual | 16+ (18+) | 90% | 2+ | 5 | nothing, until the lifter turns it off |

  Every phase: no push days (a push call becomes as planned, `replan` and `generate`), no challenges or AMRAP sets, warm-ups kept unless the load came down.
- **Which exercises** are lists by id (`ON_BACK`, `ON_BELLY`, `JUMPS`, `RUNS`, `CRUNCHES`), never a match on English text; `pregnancy.test.ts` fails when an exercise whose setup says it's done lying on the back or face down isn't listed, or an id doesn't exist. Hip thrusts with the upper back on a bench, incline work, side-lying work, planks and dead bugs stay (dead bugs and heel slides only leave with lying on the back). Walking, cycling, rowing and the cross trainer stay after birth; running comes back at 12 weeks, as return-to-running guidance says.
- **Everywhere the plan is made**, through the injury code paths: the adaptive plan leaves the exercises out and lightens as it picks (`generate`, `injuredTarget`); fixed program days and saved routines swap a left-out exercise for the closest one that fits and lighten set by set (`injuryPass`); swap lists leave them out (`alternatives(…, mode)`); a swap or an added exercise mid-workout gets the mode's target. A **rehab routine from a physio stays as written**, as it does for injuries (a pelvic health physio's program is meant for this). With an injury too, the lighter of the two wins.
- **Lighter sets are marked like injury sets** (`injuryPct` on the plan item and the set), so progression, new bests, strength standards and the 1RM estimate leave them out, and the plan picks up from before when the mode ends. The plan item also carries `mode` so Today labels it "Pregnancy 90%" or "After birth 70%" instead of "Injury".
- **Every change says why:** each target's note names the week and the share (`preg.note.*`), Today shows a chip ("Pregnancy · week 22", "After birth · week 8") that opens the setting, and the setting lists what the workouts do now and when it changes next. Stop signs (ACOG's warning signs in pregnancy; heavier bleeding, pain, leaking, pelvic heaviness or a tummy bulge after birth) and "not medical advice" are on the card.
- **Never shared:** not in analytics, feedback reports or a coach's view (coach.ts reads only named profile fields). The privacy policy lists it with cycle data.
- **Parity:** pure web code, so Android, iOS and the web get it together. No native code.
- **Weekly email** W74 (`pregnancy`) skips accounts whose synced profile says male (`notMale`, `WeeklyFacts.male`).
- Not built: reading pregnancy from Health Connect or Apple Health (neither plugin exposes it), a pelvic floor program of its own (a physio's rehab routine covers it), or changes to readiness beyond no push days.
