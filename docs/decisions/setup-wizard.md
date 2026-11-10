# Setup wizard (Melvin, 2026-11-09)

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

- First run opens a short wizard (`src/components/app/Onboarding.tsx`): goal and experience; gym and units; days a week, body weight, and optional age, sex and "I know my numbers" (best recent set of the four main lifts); notifications and a heart rate monitor. Health connections (Health Connect, Apple Health, readiness sources) join it as they land, and should prefill age, body weight and height when the user allows it.
- **It can be run again** from Settings ("Run setup again", `#/setup`). A rerun keeps existing gyms unless the user picks one to add, and never touches workout history.
- One question per screen, big tiles, every step optional except the first three, under a minute in total.
- **The last step before the Pro offer is "Save your progress"** (Melvin, 2026-11-09, after setting up in a phone browser: "it's not clear how to save my information or register"). See "Saving and backup".
