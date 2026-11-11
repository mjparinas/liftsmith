// One answer to "does this Liftsmith account have Pro, and through what?" (docs/decisions/money.md, "One Pro, any
// platform"). Pro can come from:
// - the store review account (review.ts) or a lifetime code (pro_grants, creators.ts): Pro with nothing to manage;
// - a web subscription through Stripe (stripe.ts), managed in Stripe's customer portal;
// - a Google Play or App Store subscription (RevenueCat's webhook keeps `entitlements` per install), once a phone that
//   holds it has synced while signed in to the account (account_installs, written by the sync route).
// Sync sends the answer on every round, so a web subscription unlocks the phones and a store one unlocks the web app.
import { hasLifetimePro } from "./creators";
import { query, run } from "./db";
import { accountHasPro } from "./review";
import { webSub, type WebSub } from "./stripe";

export type ProVia = "review" | "code" | "web" | "play" | "appstore";

export interface AccountSub extends WebSub {
  store: "web" | "play" | "appstore";
}

export interface Access {
  pro: boolean;
  via: ProVia | null;
  /** The paid subscription behind it, when there is one (for the Pro screen's status and Manage). */
  sub: AccountSub | null;
}

const SAFE_ID = /^[A-Za-z0-9_-]{8,64}$/;

/** Links an install to the account it synced under, so that install's store subscription counts for the account. */
export async function linkInstall(accountId: string, installId: unknown, now = Date.now()): Promise<void> {
  if (typeof installId !== "string" || !SAFE_ID.test(installId)) return;
  await run(
    `INSERT INTO account_installs (account_id, install_id, at) VALUES (?, ?, ?)
     ON CONFLICT(account_id, install_id) DO UPDATE SET at = excluded.at`,
    [accountId, installId, now],
  );
}

/** The newest live store subscription on any install linked to the account. */
async function storeSub(accountId: string, now: number): Promise<AccountSub | null> {
  const rows = await query<{ plan: string | null; period: string | null; store: string | null; expires_at: number | null }>(
    `SELECT e.plan, e.period, e.store, e.expires_at FROM account_installs ai JOIN entitlements e ON e.app_user_id = ai.install_id
     WHERE ai.account_id = ? AND e.active = 1 AND (e.expires_at IS NULL OR e.expires_at > ?) ORDER BY e.expires_at DESC LIMIT 1`,
    [accountId, now],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    store: r.store === "appstore" ? "appstore" : "play",
    plan: r.plan === "annual" || r.plan === "monthly" ? r.plan : null,
    trial: r.period === "TRIAL",
    expiresAt: r.expires_at == null ? null : Number(r.expires_at),
    willRenew: true,
    status: "active",
  };
}

export async function accessFor(accountId: string, email: string | null, now = Date.now()): Promise<Access> {
  if (accountHasPro(email)) return { pro: true, via: "review", sub: null };
  if (await hasLifetimePro(accountId)) return { pro: true, via: "code", sub: null };
  const web = await webSub(accountId, now);
  if (web) return { pro: true, via: "web", sub: { ...web, store: "web" } };
  const store = await storeSub(accountId, now);
  if (store) return { pro: true, via: store.store, sub: store };
  return { pro: false, via: null, sub: null };
}

/** Whether the account already pays somewhere (or has Pro for good), so the web shouldn't sell it a second plan. */
export async function alreadyPro(accountId: string, email: string | null, now = Date.now()): Promise<Access | null> {
  const a = await accessFor(accountId, email, now);
  return a.pro ? a : null;
}
