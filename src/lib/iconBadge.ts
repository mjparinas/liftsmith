"use client";

// The number on the app icon (Melvin, 2026-11-19: "add app icon notifications"), and the red counts inside the app
// that say where it comes from: Friends (new likes, comments, follows and follow requests) and coaching (unread
// messages). One count, `badgeCount`, feeds the icon, the tab bar, the sidebar and Today's coach badge, so they
// always add up (docs/decisions/reminders-and-lifecycle-messages.md "App icon badge").
//
// While the app is closed the number comes with each push (the server works it out, src/server/badge.ts): APNs'
// `badge` on iOS, FCM's `notification_count` on Android, whose launcher draws it from the notifications. While the
// app is open this file keeps it right: the native AppBadge plugin (AppBadgePlugin.java, AppBadgePlugin in
// DelightPlugins.swift) sets it on iOS and clears Friends and coaching notifications on Android once nothing is
// waiting, and the web app uses the Badging API (an installed web app on Chrome, Edge and Safari; a browser tab
// shows nothing). Settings › Reminders › Number on the app icon turns it off everywhere (`messages.badge`).
import { useEffect } from "react";

import { useAccount } from "./auth";
import { BADGE_MAX, badgeCount, badgeOn, type Waiting } from "./badgeCount";
import { isNative } from "./juice";
import { socialOn, useSocial } from "./social";
import { useApp } from "./store";
import { coachWaiting, useCoachNotes } from "./trainer";

/** Whether this device can show a number on the app icon at all. */
export function badgeSupported(): boolean {
  if (isNative()) return true;
  return typeof navigator !== "undefined" && "setAppBadge" in navigator;
}

type BadgeNav = Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
type Cap = { Plugins?: Record<string, { set?: (a: { count: number }) => Promise<unknown> } | undefined> };

let shown = -1;

/** Puts `n` on the app icon (0 clears it). Repeats of the same number do nothing. Never throws. */
export async function setIconBadge(n: number): Promise<void> {
  const count = Math.min(BADGE_MAX, Math.max(0, Math.floor(n)));
  if (count === shown) return;
  shown = count;
  try {
    if (isNative()) {
      const plugin = (window as unknown as { Capacitor?: Cap }).Capacitor?.Plugins?.AppBadge;
      await plugin?.set?.({ count });
      return;
    }
    const nav = typeof navigator !== "undefined" ? (navigator as BadgeNav) : undefined;
    if (!nav?.setAppBadge) return;
    if (count > 0) await nav.setAppBadge(count);
    else await (nav.clearAppBadge?.() ?? nav.setAppBadge(0));
  } catch {
    // a browser that refuses (no permission, not installed) simply shows no number
    shown = -1;
  }
}

/** Forgets the last number set, so the next one is sent again (tests, and signing out). */
export function resetIconBadge() {
  shown = -1;
}

/** What's waiting, from what Friends and coaching already loaded (no extra requests). */
export function useWaiting(): Waiting {
  const me = useSocial((s) => s.me);
  const coach = useCoachNotes(coachWaiting);
  const signedIn = useAccount((s) => !!s.account);
  if (!signedIn) return { friends: 0, coach: 0 };
  return { friends: socialOn() ? (me?.unread ?? 0) + (me?.requests ?? 0) : 0, coach };
}

/** Keeps the app icon's number equal to what's waiting. Mounted once, at the app's root. */
export function useIconBadge() {
  const w = useWaiting();
  const on = useApp((s) => badgeOn(s.profile));
  const n = badgeCount(w, on);
  useEffect(() => {
    void setIconBadge(n);
  }, [n]);
}
