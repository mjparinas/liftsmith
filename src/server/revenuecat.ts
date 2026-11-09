// RevenueCat webhook (POST /api/billing/revenuecat/): one event format for both stores' server notifications
// (Google Play RTDN and App Store Server Notifications v2 go to RevenueCat; RevenueCat calls us). Each event
// becomes a row in subscription_events, the table the admin Revenue tab replays (adminMetrics.ts), and
// updates the install's row in `entitlements`. The app's own trial_start and purchase events stop being
// mirrored into subscription_events once this is configured (collect.ts), so nothing counts twice.
//
// RevenueCat sends the Authorization header we set in its dashboard; REVENUECAT_WEBHOOK_SECRET must match.
// Docs: https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
import { timingSafeEqual } from "node:crypto";
import { batch } from "./db";

export interface RcEvent {
  id: string;
  type: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  period_type?: string;
  event_timestamp_ms?: number;
  expiration_at_ms?: number | null;
  store?: string;
  environment?: string;
  /** USD, after RevenueCat's conversion; negative for refunds. */
  price?: number | null;
  price_in_purchased_currency?: number | null;
  currency?: string | null;
  country_code?: string | null;
  is_trial_conversion?: boolean;
  is_family_share?: boolean;
  cancel_reason?: string;
  expiration_reason?: string;
  original_transaction_id?: string;
  transaction_id?: string;
  entitlement_ids?: string[] | null;
}

export type Kind = "trial_start" | "trial_convert" | "purchase" | "renew" | "cancel" | "uncancel" | "billing_recover" | "refund" | "expire";

/** RevenueCat event → our subscription event kind and reason (AGENTS.md "Analytics": the kinds the Revenue tab reads). */
export function kindOf(e: RcEvent): { kind: Kind; reason?: string } | null {
  switch (e.type) {
    case "INITIAL_PURCHASE":
      return { kind: e.period_type === "TRIAL" ? "trial_start" : "purchase" };
    case "RENEWAL":
      return { kind: e.is_trial_conversion ? "trial_convert" : "renew" };
    case "CANCELLATION":
      // A refund through support shows up as a cancellation with this reason.
      if (e.cancel_reason === "CUSTOMER_SUPPORT") return { kind: "refund" };
      return { kind: "cancel", reason: e.cancel_reason === "BILLING_ERROR" ? "billing" : e.cancel_reason?.toLowerCase() };
    case "UNCANCELLATION":
      return { kind: "uncancel" };
    case "EXPIRATION":
      return { kind: "expire", reason: e.expiration_reason === "BILLING_ERROR" ? "billing" : e.expiration_reason?.toLowerCase() };
    case "SUBSCRIPTION_EXTENDED":
    case "PRODUCT_CHANGE":
    case "BILLING_ISSUE":
    case "TRANSFER":
    case "TEST":
    default:
      return null;
  }
}

export function planOf(productId: string | undefined): "annual" | "monthly" | null {
  if (!productId) return null;
  if (/annual|year/i.test(productId)) return "annual";
  if (/month/i.test(productId)) return "monthly";
  return null;
}

const storeOf = (s: string | undefined) => (s === "PLAY_STORE" ? "play" : s === "APP_STORE" || s === "MAC_APP_STORE" ? "appstore" : (s ?? "other").toLowerCase());
const micros = (x: number | null | undefined) => (typeof x === "number" && Number.isFinite(x) ? Math.round(Math.abs(x) * 1_000_000) : null);

/** Whether the request carries the shared secret. */
export function authorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  const got = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const want = Buffer.from(secret);
  return got.length === want.length && timingSafeEqual(got, want);
}

/** Stores one webhook event. Sandbox purchases (testers, App Review) are kept out of the numbers. */
export async function storeRcEvent(e: RcEvent, now = Date.now()): Promise<"stored" | "ignored"> {
  if (!e?.id || !e.type) return "ignored";
  if (e.environment === "SANDBOX") return "ignored";
  const user = e.app_user_id ?? e.original_app_user_id ?? null;
  const at = e.event_timestamp_ms ?? now;
  const k = kindOf(e);
  const stmts: { sql: string; args: (string | number | null)[] }[] = [];
  if (k) {
    // Family members' shared access isn't a sale.
    const paid = !e.is_family_share && k.kind !== "trial_start" && k.kind !== "cancel" && k.kind !== "uncancel" && k.kind !== "expire";
    const currency = e.currency ? e.currency.toUpperCase().slice(0, 3) : null;
    stmts.push({
      sql: "INSERT OR IGNORE INTO subscription_events (id, at, install_id, subscription, store, kind, plan, price_micros, currency, usd_micros, country, reason, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'store')",
      args: [
        `rc-${e.id}`, at, user, e.original_transaction_id ?? null, storeOf(e.store), k.kind, planOf(e.product_id),
        paid ? micros(e.price_in_purchased_currency) : null, paid ? currency : null, paid ? micros(e.price) : null,
        e.country_code ? e.country_code.toUpperCase().slice(0, 2) : null, k.reason ?? null,
      ],
    });
  }
  // Everything that changes access updates the install's entitlement.
  if (user && (k || e.type === "PRODUCT_CHANGE" || e.type === "SUBSCRIPTION_EXTENDED" || e.type === "BILLING_ISSUE")) {
    const expires = e.expiration_at_ms ?? null;
    const active = k?.kind === "expire" || k?.kind === "refund" ? 0 : expires == null || expires > now ? 1 : 0;
    stmts.push({
      sql: `INSERT INTO entitlements (app_user_id, active, plan, period, store, expires_at, family, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(app_user_id) DO UPDATE SET active = excluded.active, plan = COALESCE(excluded.plan, plan), period = COALESCE(excluded.period, period),
            store = excluded.store, expires_at = COALESCE(excluded.expires_at, expires_at), family = excluded.family, updated_at = excluded.updated_at
            WHERE excluded.updated_at >= entitlements.updated_at`,
      args: [user, active, planOf(e.product_id), e.period_type ?? null, storeOf(e.store), expires, e.is_family_share ? 1 : 0, at],
    });
  }
  await batch(stmts);
  return stmts.length ? "stored" : "ignored";
}
