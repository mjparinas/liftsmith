"use client";

// A coach's invite before setup (trainer mode out of Labs, 2026-11-12; docs/decisions/trainer-mode.md). A coach's invite
// link is www.getliftsmith.com/app/#/trainer/<code>: Android opens it in the app through App Links, anywhere else it
// opens the web app. On a fresh install the code waits on the device, so setup can take the short coach path (sign in,
// agree to share, a few questions) instead of every question. On Android a lifter without the app installs it from the
// web app's welcome screen with the code as the Play install referrer, so it still arrives; on iOS, and anywhere else,
// the welcome screen takes the code typed in.
import { installInfo } from "./installInfo";
import { isNative } from "./juice";

const PENDING = "liftsmith.coachInvite";
const CODE_RE = /^[2-9A-HJ-NP-Z]{8}$/;

/** A typed code or a pasted invite link, tidied to the code. Empty when it can't be one. */
export function coachCode(text: string | null | undefined): string {
  if (!text) return "";
  const m = /#\/trainer\/([\w-]+)/.exec(text);
  const c = (m ? m[1]! : text).toUpperCase().replace(/[\s-]/g, "");
  return CODE_RE.test(c) ? c : "";
}

/** The waiting code: the one this page was opened with (#/trainer/<code>), else one saved earlier. */
export function pendingCoach(): string {
  if (typeof location !== "undefined") {
    const fromLink = coachCode(location.hash);
    if (fromLink) return fromLink;
  }
  try {
    return coachCode(localStorage.getItem(PENDING));
  } catch {
    return "";
  }
}

export function savePendingCoach(code: string): void {
  try {
    if (coachCode(code)) localStorage.setItem(PENDING, coachCode(code));
    else localStorage.removeItem(PENDING);
  } catch {
    // private mode: the code still works while the page is open
  }
}

/** Google Play with the coach's code as the install referrer, for Android phones opening the link without the app. */
export const playCoachUrl = (code: string) =>
  `https://play.google.com/store/apps/details?id=com.getliftsmith.app&referrer=${encodeURIComponent(`utm_source=coach&utm_campaign=${code}`)}`;

/** A coach's code in a Play install referrer: utm_source=coach&utm_campaign=<code>. */
export function coachFromReferrer(raw: string | null | undefined): string {
  if (!raw) return "";
  const q = new URLSearchParams(raw);
  return q.get("utm_source") === "coach" ? coachCode(q.get("utm_campaign")) : "";
}

let checked = false;
/** On open, once: keeps a code from the link, or from the Play install referrer on the first launch after install. */
export async function startCoachInvite(): Promise<void> {
  if (checked) return;
  checked = true;
  const fromLink = typeof location !== "undefined" ? coachCode(location.hash) : "";
  if (fromLink) return savePendingCoach(fromLink);
  if (!isNative()) return;
  const code = coachFromReferrer((await installInfo())?.installReferrer);
  try {
    if (code && !localStorage.getItem(`${PENDING}.seen`)) {
      savePendingCoach(code);
      localStorage.setItem(`${PENDING}.seen`, "1");
    }
  } catch {
    // private mode
  }
}
