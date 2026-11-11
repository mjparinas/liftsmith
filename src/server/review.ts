// The store reviewers' account (docs/decisions/accounts-and-sign-in.md, "Store review account"). Google Play
// and App Review can't receive an emailed code, make accounts, or buy or trial a subscription, yet must reach
// every part of the app. So one fixed address signs in with a long, reusable code kept only in Vercel
// (REVIEW_SIGNIN_CODE), and that account has Pro on the server without a purchase.
//
// Safe by construction: the code works for this one address only, it must be 12 to 16 digits (a trillion
// or more guesses against the per-address limit on the verify route), it's compared in constant time, no
// email is ever sent to the address, and removing the variable turns the whole path off, Pro included.
import { createHash, timingSafeEqual } from "node:crypto";

type Env = Record<string, string | undefined>;

export const REVIEW_EMAIL = "review@getliftsmith.com";
/** What a review code must look like. Anything shorter leaves the path off. */
export const REVIEW_CODE_RE = /^\d{12,16}$/;

/** The configured review code, or null when the path is off (unset, or too short to be safe). */
export function reviewCode(env: Env = process.env): string | null {
  const c = env.REVIEW_SIGNIN_CODE?.trim() ?? "";
  return REVIEW_CODE_RE.test(c) ? c : null;
}

/** Whether this address is the review account and the path is on. */
export function isReviewEmail(email: string | null | undefined, env: Env = process.env): boolean {
  return email === REVIEW_EMAIL && reviewCode(env) !== null;
}

/** Whether `code` is the review code, for the review address only, in constant time. */
export function reviewCodeMatches(email: string, code: string, env: Env = process.env): boolean {
  const want = reviewCode(env);
  if (email !== REVIEW_EMAIL || !want) return false;
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(code.trim()), h(want));
}

/** Pro that comes with the review account. Lifetime codes add Pro per account too (hasLifetimePro in creators.ts). */
export function accountHasPro(email: string | null | undefined, env: Env = process.env): boolean {
  return isReviewEmail(email, env);
}
