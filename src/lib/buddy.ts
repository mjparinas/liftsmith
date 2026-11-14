"use client";

import { inSentence, list, t } from "./i18n";

// Check in (Melvin, 2026-11-14: "make check in use the messaging system instead of using an external app. under age
// kids shouldnt be able to use this"): one tap on Today sends a short "I'm at the gym" to the lifter's coach as a
// Liftsmith message (the coach chat, src/server/coach.ts sendMessage), which also reaches the coach's phone as a push.
// It used to open the phone's share sheet for a list of buddy names typed on the device. Decision record:
// docs/decisions/trainer-mode.md "Check in".

/** The check-in message: a greeting by first name, then where and what the lifter is training today. */
export function checkinText(opts: { to?: string; gym?: string; focus?: string[] }): string {
  const first = opts.to?.trim().split(/\s+/)[0] ?? "";
  const hi = first ? t("buddy.hi", { who: first }) : "";
  const gym = opts.gym && opts.gym !== "My gym" ? opts.gym : "";
  const focus = opts.focus?.length ? list(opts.focus.map((f) => inSentence(f, true))) : "";
  const body =
    gym && focus
      ? t("buddy.atGymFocus", { gym, focus })
      : gym
        ? t("buddy.atGym", { gym })
        : focus
          ? t("buddy.atFocus", { focus })
          : t("buddy.at");
  return hi + body;
}

/** Whether Check in shows: signed in, 18 or older by the age on the profile, and training with a coach. */
export function canCheckIn(opts: { signedIn: boolean; teen: boolean; coaches: number }): boolean {
  return opts.signedIn && !opts.teen && opts.coaches > 0;
}
