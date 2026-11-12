"use client";

// Invite links and the friends leaderboard, the app side (Melvin, 2026-11-11, from the social gaps list; decision
// record docs/decisions/friends.md "Invites and the leaderboard"). An invite link is
// www.getliftsmith.com/app/#/invite/<code>: the app opens it through App Links on Android, and anywhere else it opens
// the web app. On Android a lifter without the app can install it from the invite screen with the code as the
// Play install referrer, so the invite still arrives after install. The code waits on the device until the lifter
// has signed in and joined Friends, then the two follow each other.
import { readAccount } from "./auth";
import { installInfo } from "./installInfo";
import { isNative } from "./juice";
import { APP_PATH, SITE_URL } from "./site";
import { social } from "./social";
import type { BoardMetric, BoardRow } from "./socialTypes";

const PENDING = "liftsmith.invite";
const CODE_RE = /^[2-9A-HJ-NP-Z]{8}$/;

export const cleanInvite = (x: unknown) => {
  const c = typeof x === "string" ? x.toUpperCase().replace(/[\s-]/g, "") : "";
  return CODE_RE.test(c) ? c : "";
};

export const inviteUrl = (code: string) => `${SITE_URL}${APP_PATH}#/invite/${code}`;

/** Google Play with the invite as the install referrer, for Android phones opening the link without the app. */
export const PLAY_ID = "com.getliftsmith.app";
export const playInviteUrl = (code: string) =>
  `https://play.google.com/store/apps/details?id=${PLAY_ID}&referrer=${encodeURIComponent(`utm_source=invite&utm_campaign=${code}`)}`;

/** An invite in a Play install referrer: utm_source=invite&utm_campaign=<code>. */
export function inviteFromReferrer(raw: string | null | undefined): string {
  if (!raw) return "";
  const q = new URLSearchParams(raw);
  return q.get("utm_source") === "invite" ? cleanInvite(q.get("utm_campaign")) : "";
}

export function pendingInvite(): string {
  try {
    return cleanInvite(localStorage.getItem(PENDING));
  } catch {
    return "";
  }
}
export function savePendingInvite(code: string) {
  try {
    if (cleanInvite(code)) localStorage.setItem(PENDING, cleanInvite(code));
    else localStorage.removeItem(PENDING);
  } catch {
    // private mode: the invite screen still works while it's open
  }
}

let checkedReferrer = false;
/** On open, once: an invite that came through the Play install referrer waits like one from a link. */
export async function startInvite(): Promise<void> {
  if (checkedReferrer || !isNative()) return;
  checkedReferrer = true;
  const info = await installInfo();
  const code = inviteFromReferrer(info?.installReferrer);
  // Only the first launch after install matters; a used invite is cleared, so it's never picked up again.
  if (code && !localStorage.getItem(`${PENDING}.seen`)) {
    savePendingInvite(code);
    localStorage.setItem(`${PENDING}.seen`, "1");
  }
}

/** Accepts the waiting invite once the lifter has joined Friends. Returns the inviter's handle, or null. */
export async function acceptPending(): Promise<string | null> {
  const code = pendingInvite();
  if (!code || !readAccount()) return null;
  try {
    const r = await social<{ handle: string }>("acceptInvite", { code });
    savePendingInvite("");
    return r.handle;
  } catch (e) {
    // A used-up, expired or own invite won't work later either; a network error might.
    const msg = e instanceof Error ? e.message : "";
    if (msg === "invite" || msg === "self") savePendingInvite("");
    return null;
  }
}

// --- The leaderboard ---

/** Monday 00:00 local time of the week holding `now`, or of the week before with `weeksBack`. */
export function weekStart(now: number, weeksBack = 0): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7 * weeksBack);
  return d.getTime();
}

/** The board ranked by one measure, highest first; ties share a place and sort by name. */
export function rankBoard(rows: readonly BoardRow[], metric: BoardMetric): (BoardRow & { place: number })[] {
  const sorted = [...rows].sort((a, b) => b[metric] - a[metric] || a.name.localeCompare(b.name));
  let place = 0;
  return sorted.map((r, i) => {
    if (i === 0 || r[metric] !== sorted[i - 1]![metric]) place = i + 1;
    return { ...r, place };
  });
}

/**
 * The one thing to do about the board (AGENTS.md "Action over stats"): how much more puts the lifter level with,
 * or ahead of, the person just above them; or, at the top, that they lead. Null with no one else on the board.
 */
export function boardNudge(
  rows: readonly BoardRow[],
  metric: BoardMetric,
): { kind: "lead"; by: number } | { kind: "chase"; name: string; gap: number } | { kind: "tied"; name: string } | null {
  const ranked = rankBoard(rows, metric);
  const i = ranked.findIndex((r) => r.me);
  if (i < 0 || ranked.length < 2) return null;
  const me = ranked[i]!;
  const above = ranked
    .slice(0, i)
    .reverse()
    .find((r) => r[metric] > me[metric]);
  if (!above) {
    const tied = ranked.find((r) => !r.me && r[metric] === me[metric]);
    if (tied && me[metric] > 0) return { kind: "tied", name: tied.name };
    const next = ranked.find((r) => !r.me);
    return me[metric] > 0 && next ? { kind: "lead", by: me[metric] - next[metric] } : null;
  }
  return { kind: "chase", name: above.name, gap: above[metric] - me[metric] };
}
