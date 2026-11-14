"use client";

// The invite loop, the app side (growth plan item 2, "give a month, get a month"; docs/decisions/growth.md "The invite
// loop"). The server pays out (src/server/earnedPro.ts); this file keeps the lifter's invite link on the device so a
// share card can carry it without waiting for the network, shares it, and reads "Your invites" for Friends › People.
// Pure web code, so Android, iOS and the web app get it together.
import { track } from "./analytics";
import { readAccount } from "./auth";
import { flag } from "./flags";
import { inviteUrl } from "./invite";
import { liveRead, readKept } from "./liveRead";
import { social } from "./social";

/** One friend who joined with the lifter's link. */
export type InviteFriend = { name: string; handle: string; workouts: number; rewarded: boolean };

/** What "Your invites" shows (`invites` in src/server/social.ts). */
export type InviteStatus = {
  friends: InviteFriend[];
  /** The invite this lifter joined with, seen from their side (`name` is the inviter). */
  joined: InviteFriend | null;
  /** Months earned from invites in the last 365 days, and the most there can be. */
  months: number;
  perYear: number;
  /** Workouts a friend finishes before both get their month. */
  needed: number;
  /** When Pro earned from invites ends, if it's running. */
  until: number | null;
  /** Whether to talk about the reward at all: false while the admin flag is off and for anyone under 18. */
  reward: boolean;
};

const CODE_KEY = "liftsmith.inviteCode";
const STATUS = "invites";
/** A kept code is used until a day before it expires, so a shared link always has time left. */
const MARGIN = 86_400_000;

type Kept = { account: string; code: string; expiresAt: number };

/** The lifter's invite code kept on the device, if it's theirs and still has a day left. */
export function keptInviteCode(now = Date.now()): string | null {
  const account = readAccount();
  if (!account) return null;
  try {
    const k = JSON.parse(localStorage.getItem(CODE_KEY) ?? "null") as Kept | null;
    return k && k.account === account.id && k.expiresAt - MARGIN > now ? k.code : null;
  } catch {
    return null;
  }
}

/**
 * The lifter's invite code: the kept one, or a fresh one from the server (the same code until it expires or is used
 * 50 times). Throws when signed out, not in Friends, or offline with nothing kept.
 */
export async function inviteCode(now = Date.now()): Promise<string> {
  const kept = keptInviteCode(now);
  if (kept) return kept;
  const account = readAccount();
  const r = await social<{ code: string; expiresAt: number }>("invite");
  try {
    if (account)
      localStorage.setItem(CODE_KEY, JSON.stringify({ account: account.id, code: r.code, expiresAt: r.expiresAt } satisfies Kept));
  } catch {
    // Blocked storage: it's asked for again next time.
  }
  return r.code;
}

/** Gets the code ready in the background (the share sheet calls it on open), so sharing never waits for it. */
export function warmInviteCode(): void {
  if (!readAccount() || keptInviteCode()) return;
  void inviteCode().catch(() => undefined);
}

/** The lifter's invite link, ready to share, or null when there's none (signed out, not in Friends). */
export async function inviteLink(): Promise<string | null> {
  try {
    return inviteUrl(await inviteCode());
  } catch {
    return null;
  }
}

/** Whether the app mentions the month of Pro: the admin flag, then the server's word for this lifter (teens: never). */
export const rewardOn = (status?: Pick<InviteStatus, "reward"> | null) => flag("referralReward") !== false && status?.reward !== false;

/** "Your invites", the kept copy at once and then the server's. */
export function loadInvites(show: (s: InviteStatus) => void): Promise<void> {
  // A server without "invites" (an older deployment) answers something else: show nothing rather than break People.
  return liveRead(
    STATUS,
    () => social<InviteStatus>("invites"),
    (s) => {
      if (isStatus(s)) show(s);
    },
  );
}

const isStatus = (s: unknown): s is InviteStatus =>
  !!s && typeof s === "object" && Array.isArray((s as InviteStatus).friends) && typeof (s as InviteStatus).needed === "number";

export const keptInvites = (): InviteStatus | null => {
  const k = readKept<unknown>(STATUS);
  return isStatus(k) ? k : null;
};

/** Where an invite was shared from, for analytics (`social_invite` with a detail). */
export type InviteFrom = "people" | "done" | "card";
export const trackInvite = (from: InviteFrom) => track("feature", { name: "social_invite", detail: from });
