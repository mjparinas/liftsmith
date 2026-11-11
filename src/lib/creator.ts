"use client";

// Creator codes (AGENTS.md "Marketing and growth", Melvin approved 2026-11-09). A creator shares a code
// (LIFT-NAME) or a link (getliftsmith.com/c/lift-name). The lifter's followers get a 30-day Pro trial
// instead of 14 days, and the creator earns 30% of our net revenue from each subscriber who used the
// code, for that subscriber's first 12 months (src/lib/creatorMetrics.ts works the money out).
//
// How a code reaches the app:
// - the link on the web: /c/<code> saves it in localStorage, which the web app (same site) reads;
// - Android: the link sends people to Play with an install referrer (utm_source=creator, utm_campaign=<code>),
//   which the InstallInfo plugin already reads;
// - iPhone: the App Store passes nothing per install, so the link page shows the code to type in setup's
//   trial step or Settings › Redeem a code (Platform deltas in AGENTS.md).
//
// The code is sent to POST /api/creator/ with the random install id (never anything else). That claim is
// how the creator gets paid, so it is sent whatever the usage-stats switch says, and /privacy/ says so.
// The code also goes to RevenueCat as a subscriber attribute, so the store's purchase webhook carries it too.
// Once a trial or purchase has started, the code can't be changed: it belongs to that subscription.
//
// A lifetime code (Melvin, 2026-11-11) gives Pro for good to the signed-in account that redeems it, on every
// device and platform that account signs in on, with nothing bought in the store. It needs an account, so
// that Pro survives a reinstall or a new phone and its use limit counts people: typed while signed out, it's
// kept and redeemed as soon as the lifter signs in (`redeemSaved`).
import { create } from "zustand";

import { installId, platformStore } from "./analytics";
import { api, AuthError, readAccount, setAccountPro } from "./auth";
import { codeKind, DEFAULT_OFFERING, DEFAULT_TRIAL_DAYS, normalizeCode, OFFERING_ID, playLinkWithCode, type CodeKind } from "./creatorCode";
import { installInfo } from "./installInfo";
import { isNative } from "./juice";
import { SITE_URL } from "./site";

export { normalizeCode, playLinkWithCode };

export const CREATOR_KEY = "liftsmith.creator";
/** Set when the lifter removes a code, so a link or the install referrer doesn't bring it back. */
const CLEARED_KEY = "liftsmith.creatorCleared";
/** The trial a code gives unless the server says otherwise, in days (the store offering behind it is "creator30"). */
export const CREATOR_TRIAL_DAYS = DEFAULT_TRIAL_DAYS;
export const CREATOR_OFFERING = DEFAULT_OFFERING;

export type CodeSource = "link" | "referrer" | "typed";
/** pending: not checked yet (offline); ok: live; unknown: no such code; ended: past its end date or out of uses. */
export type CodeStatus = "pending" | "ok" | "unknown" | "ended";

export interface CreatorClaim {
  code: string;
  at: number;
  source: CodeSource;
  /** pending: not checked with the server yet (offline); ok: a live creator; unknown: no such code. */
  status: CodeStatus;
  /** The creator's display name, once the server has said (never for a promo code). */
  name?: string;
  /** What the server said the code is and gives; until then, a creator's 30-day trial is assumed. */
  kind?: CodeKind;
  trialDays?: number | null;
  offering?: string;
}

/** A code in a link: /c/<code>/, or ?c= / ?code= on any page. */
export function codeFromUrl(href: string): string | null {
  try {
    const u = new URL(href, SITE_URL);
    const m = u.pathname.match(/^\/c\/([^/]+)\/?$/);
    return normalizeCode(m?.[1] ?? u.searchParams.get("c") ?? u.searchParams.get("code"));
  } catch {
    return null;
  }
}

/** A code in a Play install referrer: utm_source=creator&utm_campaign=<code>. */
export function codeFromReferrer(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const q = new URLSearchParams(raw);
  return q.get("utm_source") === "creator" ? normalizeCode(q.get("utm_campaign")) : null;
}

// ---------- Storage ----------

export function readClaim(): CreatorClaim | null {
  try {
    const raw = localStorage.getItem(CREATOR_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as CreatorClaim;
    return normalizeCode(c?.code) ? c : null;
  } catch {
    return null;
  }
}

function writeClaim(c: CreatorClaim | null) {
  try {
    if (c) localStorage.setItem(CREATOR_KEY, JSON.stringify(c));
    else localStorage.removeItem(CREATOR_KEY);
  } catch {
    // Storage blocked: the code still applies for this session.
  }
  useCreator.setState({ claim: c });
}

export const useCreator = create<{ claim: CreatorClaim | null; checking: boolean }>(() => ({ claim: null, checking: false }));

const dead = (c: CreatorClaim) => c.status === "unknown" || c.status === "ended";

/** The code that gives the longer trial: one the server knows (or hasn't checked yet, offline). A lifetime code gives no trial. */
export function activeCode(c: CreatorClaim | null = useCreator.getState().claim): string | null {
  return c && !dead(c) && c.kind !== "lifetime" ? c.code : null;
}

/** The RevenueCat offering to sell from with the active code, or null without one. */
export function activeOffering(c: CreatorClaim | null = useCreator.getState().claim): string | null {
  return activeCode(c) ? (c?.offering ?? CREATOR_OFFERING) : null;
}

/** The trial the active code gives, in days, or null when it gives a discount (or there's no code). */
export function codeTrialDays(c: CreatorClaim | null = useCreator.getState().claim): number | null {
  if (!activeCode(c)) return null;
  return c?.trialDays === undefined ? CREATOR_TRIAL_DAYS : c.trialDays;
}

export type SetResult = "ok" | "invalid" | "locked" | "same";

/**
 * Applies a code. `locked` is true once this lifter has a trial or subscription (the code belongs to it
 * then). A link or referrer never replaces a code the lifter typed; a typed code replaces anything.
 */
export function setCode(raw: string, source: CodeSource, locked: boolean, now = Date.now()): SetResult {
  const code = normalizeCode(raw);
  if (!code) return "invalid";
  const cur = readClaim();
  if (cur?.code === code && !dead(cur)) return "same";
  if (locked) return "locked";
  if (cur && !dead(cur) && cur.source === "typed" && source !== "typed") return "locked";
  writeClaim({ code, at: now, source, status: "pending" });
  return "ok";
}

export function clearCode(locked: boolean): boolean {
  if (locked) return false;
  writeClaim(null);
  try {
    localStorage.setItem(CLEARED_KEY, "1");
  } catch {}
  return true;
}

const cleared = () => {
  try {
    return localStorage.getItem(CLEARED_KEY) === "1";
  } catch {
    return false;
  }
};

// ---------- Server ----------

/** Native apps load from a local origin, so they post to the real site. */
export const creatorUrl = () => (isNative() || typeof location === "undefined" ? `${SITE_URL}/api/creator/` : "/api/creator/");

type Post = (url: string, init: RequestInit) => Promise<Response>;

/** Hooks the billing module sets, so a checked code reaches RevenueCat and the offers (no import cycle). */
export const creatorHooks: { onChecked?: (code: string | null) => void } = {};

/** Sends the claim to the server: checks the code and records which creator this install came from. */
export async function sendClaim(post: Post = fetch): Promise<CodeStatus | null> {
  const c = readClaim();
  if (!c || dead(c)) return null;
  useCreator.setState({ checking: true });
  try {
    const r = await post(creatorUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ installId: installId(), code: c.code, source: c.source, platform: platformStore() }),
    });
    if (r.status === 404 || r.status === 410) {
      const status = r.status === 404 ? "unknown" : "ended";
      writeClaim({ ...c, status });
      creatorHooks.onChecked?.(null);
      return status;
    }
    if (!r.ok) return null; // Server not set up or busy: stays pending, tried again on the next open.
    const j = (await r.json().catch(() => ({}))) as {
      name?: unknown;
      code?: unknown;
      kind?: unknown;
      trialDays?: unknown;
      offering?: unknown;
    };
    // The server may answer with the code it already holds for this install (a trial started under it).
    const code = normalizeCode(typeof j.code === "string" ? j.code : null) ?? c.code;
    const next: CreatorClaim = { ...c, code, status: "ok" };
    delete next.name; // A promo code has none, and a kept code may belong to someone else.
    writeClaim({
      ...next,
      ...(typeof j.name === "string" && j.name ? { name: j.name.slice(0, 60) } : {}),
      ...(typeof j.kind === "string" ? { kind: codeKind(j.kind) } : {}),
      ...(j.trialDays === null || (typeof j.trialDays === "number" && j.trialDays > 0 && j.trialDays <= 90)
        ? { trialDays: j.trialDays }
        : {}),
      ...(typeof j.offering === "string" && OFFERING_ID.test(j.offering) ? { offering: j.offering } : {}),
    });
    if (j.kind === "lifetime") {
      creatorHooks.onChecked?.(null);
      await redeemSaved();
    } else creatorHooks.onChecked?.(code);
    return "ok";
  } catch {
    return null; // Offline: keep it pending.
  } finally {
    useCreator.setState({ checking: false });
  }
}

// ---------- Lifetime codes ----------

/** ok: the account has Pro for good; signedOut: sign in first; notLifetime: a live code of another kind;
 * held: the account already has Pro from another lifetime code; unknown / ended as for any code; null: offline. */
export type RedeemStatus = "ok" | "signedOut" | "notLifetime" | "held" | "unknown" | "ended" | null;

/** Redeems a lifetime code for the signed-in account. On success the account has Pro here at once. */
export async function redeemLifetime(raw: string): Promise<RedeemStatus> {
  const code = normalizeCode(raw);
  if (!code) return "unknown";
  const a = readAccount();
  if (!a) return "signedOut";
  try {
    await api<{ ok: boolean }>("/api/creator/redeem/", { body: { code }, token: a.token });
    setAccountPro(true, { proVia: "code" });
    return "ok";
  } catch (e) {
    const st = e instanceof AuthError ? e.status : 0;
    if (st === 404) return "unknown";
    if (st === 410) return "ended";
    if (st === 409) return e instanceof AuthError && e.message === "Already Pro" ? "held" : "notLifetime";
    if (st === 401) return "signedOut";
    return null;
  }
}

/** A lifetime code saved while signed out (or offline) is redeemed once there's an account: on open and on sign-in. */
export async function redeemSaved(): Promise<RedeemStatus> {
  const c = readClaim();
  if (!c || c.kind !== "lifetime" || c.status !== "ok" || readAccount()?.pro) return null;
  if (!readAccount()) return "signedOut";
  const r = await redeemLifetime(c.code);
  if (r === "unknown" || r === "ended") writeClaim({ ...c, status: r });
  return r;
}

/** On every open: picks a code up from the link or the Play install referrer, then checks a pending one. */
export async function startCreator(href = typeof location !== "undefined" ? location.href : ""): Promise<void> {
  useCreator.setState({ claim: readClaim() });
  if (!readClaim() && !cleared()) {
    const fromLink = codeFromUrl(href);
    if (fromLink) setCode(fromLink, "link", false);
    else if (isNative()) {
      const info = await installInfo();
      const fromPlay = codeFromReferrer(info?.installReferrer);
      if (fromPlay) setCode(fromPlay, "referrer", false);
    }
  }
  if (readClaim()?.status === "pending") await sendClaim();
  else await redeemSaved();
}
