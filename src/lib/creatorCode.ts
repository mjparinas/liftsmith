// Codes, shared by the app (creator.ts) and the server (src/server/creators.ts). Most come from creators, who
// earn commission on them; a promo code is one of our own, with no commission (Melvin, 2026-11-10). A lifetime
// code is ours too: it gives the signed-in account Pro for good, with no store purchase (Melvin, 2026-11-11).

export type CodeKind = "creator" | "promo" | "lifetime";

export const CODE_KINDS: readonly CodeKind[] = ["creator", "promo", "lifetime"];
export const codeKind = (v: unknown): CodeKind => (v === "promo" || v === "lifetime" ? v : "creator");

/** What a code gives unless it says otherwise: a 30-day trial, sold from the RevenueCat offering "creator30". */
export const DEFAULT_TRIAL_DAYS = 30;
export const DEFAULT_OFFERING = "creator30";

/** A RevenueCat offering id: letters, digits, dashes and underscores. */
export const OFFERING_ID = /^[A-Za-z0-9_-]{1,40}$/;

/** What the server says about a live code, to the app and the /c/ link page. */
export interface CodeInfo {
  code: string;
  kind: CodeKind;
  /** The creator's name; never sent for a promo code, whose name is only a label for the admin panel. */
  name: string | null;
  /** The free trial it gives, or null when its offering gives a discount instead (or it's a lifetime code). */
  trialDays: number | null;
  offering: string;
}

/** "lift-melvin " → "LIFT-MELVIN". Letters, digits and dashes, 3 to 24 characters; anything else is null. */
export function normalizeCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    // Keep it as typed.
  }
  s = s.toUpperCase().replace(/\s+/g, "");
  return /^[A-Z0-9](?:[A-Z0-9-]{1,22})[A-Z0-9]$/.test(s) ? s : null;
}

/** The Play listing link that carries a code through the install (Android only). */
export function playLinkWithCode(playUrl: string, code: string): string {
  const u = new URL(playUrl);
  u.searchParams.set("referrer", `utm_source=creator&utm_medium=creator&utm_campaign=${code}`);
  return u.toString();
}
