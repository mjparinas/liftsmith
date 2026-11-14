"use client";

import { create } from "zustand";

import { readAccount } from "./auth";
import { inSentence, list, t } from "./i18n";
import { social, socialOn } from "./social";
import type { CheckinIn } from "./socialTypes";
import { MUSCLE_LABEL, type Muscle } from "./types";

// Check in (Melvin, 2026-11-14: "i want this to send a message to friends not coaches. it should just show up as a
// phone notification, and when they open the app, a permanent but dismisable toast message. no full messaging
// functionality... yet"). One tap on Today tells the mutual friends the lifter picks that they're at the gym: the
// server (src/server/social.ts checkIn) pushes it to each friend's phones and keeps it until that friend closes the
// toast (CheckinToasts.tsx). Nobody under 18 sends or gets one. Decision record: docs/decisions/friends.md "Check in".

/** A check-in as the friend reads it: who, where and what they're training, in the reader's language. */
export function checkinText(opts: { name: string; gym?: string; focus?: readonly string[] }): string {
  const name = opts.name;
  const gym = opts.gym && opts.gym !== "My gym" ? opts.gym : "";
  const muscles = (opts.focus ?? []).filter((m): m is Muscle => m in MUSCLE_LABEL).slice(0, 3);
  const focus = muscles.length ? list(muscles.map((m) => inSentence(MUSCLE_LABEL[m], true))) : "";
  return gym && focus
    ? t("buddy.atGymFocus", { name, gym, focus })
    : gym
      ? t("buddy.atGym", { name, gym })
      : focus
        ? t("buddy.atFocus", { name, focus })
        : t("buddy.at", { name });
}

/** Whether Check in shows: signed in, in Friends, and 18 or older by the age on the profile. */
export function canCheckIn(opts: { joined: boolean; teen: boolean }): boolean {
  return opts.joined && !opts.teen;
}

/** Sends the check-in to the picked friends (handles). Resolves with how many got it. */
export async function sendCheckin(handles: string[], gym: string, focus: readonly string[]): Promise<number> {
  const r = await social<{ sent: number }>("checkIn", { handles, gym: gym === "My gym" ? "" : gym, focus: focus.slice(0, 3) });
  return r.sent;
}

interface ToastState {
  checkins: CheckinIn[];
}
/** Friends' check-ins waiting to be closed, for the toast. */
export const useCheckins = create<ToastState>(() => ({ checkins: [] }));

let last = 0;
/** Looks for friends' check-ins (on open and on return to the app, at most once a minute). Quiet on any failure. */
export async function refreshCheckins(now = Date.now(), force = false): Promise<void> {
  if (!readAccount() || !socialOn() || (!force && now - last < 60_000)) return;
  last = now;
  try {
    const r = await social<{ checkins?: CheckinIn[] }>("checkins");
    useCheckins.setState({ checkins: r.checkins ?? [] });
  } catch {
    // not in Friends, offline or an older server: keep what was there
  }
}

/** Closes one check-in toast, here at once and on the server behind it, so other devices stop showing it too. */
export function dismissCheckin(id: string): void {
  useCheckins.setState((s) => ({ checkins: s.checkins.filter((c) => c.id !== id) }));
  void social("checkinDismiss", { id }).catch(() => {});
}
