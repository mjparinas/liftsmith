"use client";

// The lifter's invite code for whatever they share (Melvin, 2026-11-15: "all share functionality should include the
// users share link for tracking and benefit purposes"; docs/decisions/growth.md "An invite in every link"). Every
// share in the app asks here: share cards print it and send the link, and shared links (routines, gyms, workouts to
// remix, a profile, a card's page) carry it as ?invite=<code>. Only for lifters in Friends, and never for anyone under
// 18: a shared link can travel anywhere, and an invite makes whoever opens it a mutual follow.
import { useEffect, useState } from "react";

import { inviteCode, keptInviteCode } from "@/lib/referral";
import { socialOn, useSocial } from "@/lib/social";
import { useApp } from "@/lib/store";
import { isTeen } from "@/lib/teen";

export interface ShareInvite {
  /** Whether this lifter's shares may carry an invite at all. */
  can: boolean;
  /** The code once it's on the device (null while it's fetched the first time, or when `can` is false). */
  code: string | null;
  /** The code, fetched if it isn't kept yet; null when there's none (offline the first time, signed out). */
  get(): Promise<string | null>;
}

export function useShareInvite(): ShareInvite {
  const teen = useApp((s) => isTeen(s.profile));
  const joined = useSocial((st) => !!st.me?.profile);
  const can = socialOn() && !teen && (joined || !!keptInviteCode());
  const [fetched, setFetched] = useState<string | null>(null);
  const kept = can ? keptInviteCode() : null;
  useEffect(() => {
    if (!can || keptInviteCode()) return;
    let live = true;
    void inviteCode()
      .then((c) => live && setFetched(c))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [can]);
  const code = can ? (kept ?? fetched) : null;
  return {
    can,
    code,
    get: async () => {
      if (!can) return null;
      try {
        return code ?? (await inviteCode());
      } catch {
        return null;
      }
    },
  };
}
