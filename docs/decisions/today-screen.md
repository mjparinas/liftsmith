# Today screen (Melvin, 2026-11-09)

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

- The greeting uses the lifter's first name when one is set ("Good evening, Melvin"). Setup's first step asks for it (optional), and Settings can change it.
- **Daily quote:** one quote a day on Today, directly below the readiness card (Melvin, 2026-11-11), about effort, health, hard work and discipline, from `src/lib/quotes.ts` (380 quotes, at least 365 so none repeats within a year; bundled, so it works offline). A fixed seeded shuffle picks the day's quote, so every device shows the same one and it changes at local midnight. Every quote has its author and, where known, its source; only documented quotes, with common misattributions left out (a test checks a few). Settings › Daily quote turns it off (`profile.quotes`).
