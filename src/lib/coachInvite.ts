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

// Signing up as a coach (Melvin, 2026-11-12: one account for everyone, but coaches get their own way in). The website's
// coaches page opens the app at #/trainer with no code; before setup that means "I'm a coach", so the welcome screen asks
// to sign in (coaching goes through the account) and setup ends on the coaching screen. It's also how the admin panel
// tells coaches who came from that page (the first invite is sent with via "coaches"). The Play listing link from that
// page carries utm_source=coaches, so it survives an install on Android too.
const SIGNUP = "liftsmith.coachSignup";

/** Opened as #/trainer (or #/trainer/) with no code: the coaches page's way in. */
export const isCoachSignupHash = (hash: string) => /^#\/trainer\/?$/.test(hash);

/** Whether this device came in through the coaches page and hasn't sent its first invite yet. */
export function coachSignup(): boolean {
  if (typeof location !== "undefined" && isCoachSignupHash(location.hash)) return true;
  try {
    return localStorage.getItem(SIGNUP) === "1";
  } catch {
    return false;
  }
}

export function saveCoachSignup(on: boolean): void {
  try {
    if (on) localStorage.setItem(SIGNUP, "1");
    else localStorage.removeItem(SIGNUP);
  } catch {
    // private mode: it still works while the page is open
  }
}

/** Google Play for coaches from the coaches page, marked so the app knows on its first launch. */
export const playCoachSignupUrl = () =>
  `https://play.google.com/store/apps/details?id=com.getliftsmith.app&referrer=${encodeURIComponent("utm_source=coaches")}`;

let checked = false;
/** On open, once: keeps a code from the link, or from the Play install referrer on the first launch after install. */
export async function startCoachInvite(): Promise<void> {
  if (checked) return;
  checked = true;
  const hash = typeof location !== "undefined" ? location.hash : "";
  const fromLink = coachCode(hash);
  if (fromLink) return savePendingCoach(fromLink);
  if (isCoachSignupHash(hash)) return saveCoachSignup(true);
  if (!isNative()) return;
  const referrer = (await installInfo())?.installReferrer;
  const code = coachFromReferrer(referrer);
  try {
    if (!localStorage.getItem(`${PENDING}.seen`)) {
      if (code) savePendingCoach(code);
      else if (new URLSearchParams(referrer ?? "").get("utm_source") === "coaches") saveCoachSignup(true);
      localStorage.setItem(`${PENDING}.seen`, "1");
    }
  } catch {
    // private mode
  }
}
