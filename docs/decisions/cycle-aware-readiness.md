# Cycle-aware readiness (Melvin, 2026-11-09; built)

Part of the decision record. [AGENTS.md](../../AGENTS.md) has the rules that apply to every change and the list of topics. Record decisions about this topic here, in the same change as the code.

- **Opt-in, with its own consent sheet** (Settings › Cycle-aware readiness › Set up). The sheet says what is logged, that it stays on the phone (only the user's own backup/sync moves it), that it is never used for analytics or ads or included in feedback reports, that it isn't medical advice, contraception or a fertility tool, and that turning it off deletes it. `profile.cycle.consentAt` records the agreement.
- The lifter logs the first day of a period with one tap ("Period started today" / "Started yesterday"), stored as `cycle` events. `src/lib/cycle.ts` estimates the cycle day and phase from their own median cycle length (gaps of 21 to 45 days, default 28), and says nothing if nothing was logged in the last two cycles.
- It feeds `readiness.ts` as a small nudge the lifter can override: period days −5 ("go by feel"), late luteal −4, follicular +3, otherwise 0. The effect is small on purpose, because the evidence is mixed and individual.
- **Turn off and delete** removes every cycle event and the consent. Reading menstrual data from Health Connect and HealthKit waits for health plugin support (the current plugin has no menstruation type); logging works the same on both platforms (parity).
