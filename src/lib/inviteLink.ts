// Invite links, the parts the server shares with the app (src/app/api/invite/ sends /invite/<code>/ on to the app's
// invite screen). No "use client" and nothing from the app, so a route handler can use them too. The rest is in
// invite.ts (docs/decisions/growth.md "The invite loop" and "An invite in every link").
import { APP_PATH, SITE_URL } from "./site";

const CODE_RE = /^[2-9A-HJ-NP-Z]{8}$/;

export const cleanInvite = (x: unknown) => {
  const c = typeof x === "string" ? x.toUpperCase().replace(/[\s-]/g, "") : "";
  return CODE_RE.test(c) ? c : "";
};

export const inviteUrl = (code: string) => `${SITE_URL}/invite/${code}`;
/** The invite as it's printed on a share card: short, with no https:// or www. */
export const invitePrinted = (code: string) => `${SITE_URL.replace(/^https?:\/\/(www\.)?/, "")}/invite/${code}`;
/** Where /invite/<code>/ sends the browser: the app's own invite screen (the old link, which keeps working). */
export const inviteAppPath = (code: string) => `${APP_PATH}#/invite/${code}`;

/** The query parameter that carries an invite on any other link the lifter shares. */
export const INVITE_PARAM = "invite";

/** `url` with the lifter's invite code added (before any `#`), or `url` unchanged when there's no code. */
export function withInvite(url: string, code: string | null | undefined): string {
  const c = cleanInvite(code);
  if (!c) return url;
  try {
    const u = new URL(url);
    u.searchParams.set(INVITE_PARAM, c);
    return u.toString();
  } catch {
    return url;
  }
}

/** The invite a link carries: /invite/<code>, the app's #/invite/<code>, or ?invite=<code>. Empty when none. */
export function inviteOfUrl(url: string): string {
  let u: URL;
  try {
    u = new URL(url, SITE_URL);
  } catch {
    return "";
  }
  const path = /^\/invite\/([^/]+)\/?$/.exec(u.pathname)?.[1];
  if (path) return cleanInvite(path);
  const hash = /^#\/invite\/([^/?]+)/.exec(u.hash)?.[1];
  if (hash) return cleanInvite(hash);
  return cleanInvite(u.searchParams.get(INVITE_PARAM));
}
