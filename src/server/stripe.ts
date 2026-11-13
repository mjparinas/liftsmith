// Pro on the web app, sold through Stripe (docs/decisions/money.md, "Pro on the web"). The phones sell Pro through
// their stores (RevenueCat); a browser can't, so the website sells the same two plans with Stripe Checkout and lets
// the lifter manage them in Stripe's own customer portal. A web subscription belongs to the Liftsmith account (never
// to an install), so it unlocks Pro on every device that account signs in on, Android and iPhone included, through
// the `pro` flag that sync already carries (access.ts).
//
// We call Stripe's REST API with fetch: no SDK, no Stripe.js and no script from another host (AGENTS.md "Security").
// Checkout is a page on checkout.stripe.com the browser navigates to, so the site's script policy is untouched.
//
// Configured in Vercel, never in the repo: STRIPE_SECRET_KEY (a restricted or secret key), STRIPE_WEBHOOK_SECRET
// (the endpoint's whsec_ signing secret), STRIPE_PRICE_MONTHLY and STRIPE_PRICE_ANNUAL (price ids). Until all four
// are set the web app sells nothing and everything stays unlocked there, as before.
//
// Coach plans (src/lib/coachPlans.ts, docs/decisions/money.md "Coach plans") are two more products on the same account,
// each with a monthly and an annual price: STRIPE_PRICE_COACH_MONTHLY and STRIPE_PRICE_COACH_ANNUAL, and
// STRIPE_PRICE_COACH_PLUS_MONTHLY and STRIPE_PRICE_COACH_PLUS_ANNUAL. A tier is sold on the web once both of its prices
// are set. A lifter already paying for Pro on the web moves their one subscription to the coach price (no second bill).
import { createHmac, timingSafeEqual } from "node:crypto";

import { isCoachTier, isPaidCoachTier, type CoachTier, type PaidCoachTier } from "@/lib/coachPlans";
import { SITE_URL } from "@/lib/site";

import { claimFromStore, findCode } from "./creators";
import { batch, query, run } from "./db";

type Env = Record<string, string | undefined>;
export type WebPlan = "monthly" | "annual";

const API = "https://api.stripe.com/v1";
const DAY = 86_400_000;
/** Stripe's own clock and ours may differ a little; older signatures are refused (Stripe's default). */
export const SIGNATURE_TOLERANCE_S = 300;
/** Trial lengths the app may ask for (the trialDays A/B flag). A code's own trial comes from the server. */
const ASKABLE_TRIALS = new Set([7, 14]);
const DEFAULT_TRIAL = 14;
/** Statuses that keep Pro on. past_due: Stripe is retrying the card (Smart Retries), like the stores' grace period. */
export const PRO_STATUSES = new Set(["trialing", "active", "past_due"]);
/** Pro stays on this long past the period end we last heard about, in case a renewal's webhook is late. */
export const WEB_GRACE_MS = 3 * DAY;

export interface StripeConfig {
  secret: string;
  webhook: string;
  prices: Record<WebPlan, string>;
  /** Coach plans' prices, for each tier whose two prices are set. */
  coachPrices: Partial<Record<PaidCoachTier, Record<WebPlan, string>>>;
  /** Live keys only take live events, test keys only test ones. */
  live: boolean;
}

export function stripeConfig(env: Env = process.env): StripeConfig | null {
  const secret = env.STRIPE_SECRET_KEY?.trim();
  const webhook = env.STRIPE_WEBHOOK_SECRET?.trim();
  const monthly = env.STRIPE_PRICE_MONTHLY?.trim();
  const annual = env.STRIPE_PRICE_ANNUAL?.trim();
  if (!secret || !webhook || !monthly || !annual) return null;
  // A publishable key here would build fine and then fail every call: refuse it so the web app stays unlocked.
  if (!/^(sk|rk)_(live|test)_/.test(secret)) return null;
  const coachPrices: StripeConfig["coachPrices"] = {};
  for (const [tier, m, a] of [
    ["coach", env.STRIPE_PRICE_COACH_MONTHLY, env.STRIPE_PRICE_COACH_ANNUAL],
    ["coachPlus", env.STRIPE_PRICE_COACH_PLUS_MONTHLY, env.STRIPE_PRICE_COACH_PLUS_ANNUAL],
  ] as const) {
    if (m?.trim() && a?.trim()) coachPrices[tier] = { monthly: m.trim(), annual: a.trim() };
  }
  return { secret, webhook, prices: { monthly, annual }, coachPrices, live: /_live_/.test(secret) };
}

// ---------- Talking to Stripe ----------

type Param = string | number | boolean | null | undefined;

/** Stripe's form encoding: nested keys are written out ("line_items[0][price]"). Empty values are left out. */
export function formBody(params: Record<string, Param>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") q.append(k, String(v));
  return q.toString();
}

export class StripeError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export type Fetch = (url: string, init: RequestInit) => Promise<Response>;

async function call<T>(cfg: StripeConfig, method: "GET" | "POST", path: string, params: Record<string, Param> = {}, f: Fetch = fetch) {
  const body = formBody(params);
  const r = await f(method === "GET" && body ? `${API}${path}?${body}` : `${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.secret}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" ? body : undefined,
  });
  const json = (await r.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!r.ok) throw new StripeError(json.error?.message ?? `Stripe answered ${r.status}`, r.status);
  return json as T;
}

// ---------- Prices ----------

export interface WebPrice {
  plan: WebPlan;
  /** In the currency's smallest unit, as Stripe gives it (699 is $6.99). */
  amount: number;
  currency: string;
}

let priceCache: { at: number; key: string; prices: WebPrice[] } | null = null;

/** Both plans' prices from Stripe, annual first, kept for 10 minutes so the paywall doesn't call Stripe each time. */
export async function webPrices(cfg: StripeConfig, now = Date.now(), f: Fetch = fetch): Promise<WebPrice[]> {
  const key = `${cfg.prices.annual}|${cfg.prices.monthly}`;
  if (priceCache && priceCache.key === key && now - priceCache.at < 600_000) return priceCache.prices;
  const out: WebPrice[] = [];
  for (const plan of ["annual", "monthly"] as WebPlan[]) {
    const p = await call<{ unit_amount: number | null; currency: string; active: boolean }>(
      cfg,
      "GET",
      `/prices/${cfg.prices[plan]}`,
      {},
      f,
    );
    if (p.active && typeof p.unit_amount === "number") out.push({ plan, amount: p.unit_amount, currency: p.currency.toUpperCase() });
  }
  priceCache = { at: now, key, prices: out };
  return out;
}

export function resetPriceCache() {
  priceCache = null;
  coachPriceCache = null;
}

export interface CoachWebPrice extends WebPrice {
  tier: PaidCoachTier;
}

let coachPriceCache: { at: number; key: string; prices: CoachWebPrice[] } | null = null;

/** The coach plans' prices from Stripe (each tier annual first), for the tiers the web sells; cached like webPrices. */
export async function coachWebPrices(cfg: StripeConfig, now = Date.now(), f: Fetch = fetch): Promise<CoachWebPrice[]> {
  const key = JSON.stringify(cfg.coachPrices);
  if (coachPriceCache && coachPriceCache.key === key && now - coachPriceCache.at < 600_000) return coachPriceCache.prices;
  const out: CoachWebPrice[] = [];
  for (const tier of ["coach", "coachPlus"] as PaidCoachTier[]) {
    const ids = cfg.coachPrices[tier];
    if (!ids) continue;
    for (const plan of ["annual", "monthly"] as WebPlan[]) {
      const p = await call<{ unit_amount: number | null; currency: string; active: boolean }>(cfg, "GET", `/prices/${ids[plan]}`, {}, f);
      if (p.active && typeof p.unit_amount === "number")
        out.push({ tier, plan, amount: p.unit_amount, currency: p.currency.toUpperCase() });
    }
  }
  coachPriceCache = { at: now, key, prices: out };
  return out;
}

// ---------- Trials ----------

/** Whether the account may still get a free trial on the web: never subscribed here, and no store subscription linked to it. */
export async function trialEligible(accountId: string): Promise<boolean> {
  const web = await query("SELECT 1 FROM stripe_subscriptions WHERE account_id = ? LIMIT 1", [accountId]);
  if (web.length) return false;
  const store = await query(
    "SELECT 1 FROM account_installs ai JOIN subscription_events se ON se.install_id = ai.install_id WHERE ai.account_id = ? LIMIT 1",
    [accountId],
  );
  return store.length === 0;
}

/**
 * The free trial a checkout gives, in days, or null for none: a live code's own trial (a creator's 30 days) first,
 * then the length the app asked for (7 or 14, the trialDays A/B), and nothing for an account that had one already.
 */
export async function trialFor(
  accountId: string | null,
  code: unknown,
  asked: unknown,
  now = Date.now(),
): Promise<{ days: number | null; code: string | null }> {
  const found = code ? await findCode(code, { now }) : null;
  const live = found?.ok && found.info.kind !== "lifetime" ? found.info : null;
  if (accountId && !(await trialEligible(accountId))) return { days: null, code: live?.code ?? null };
  if (live) return { days: live.trialDays, code: live.code };
  const n = Number(asked);
  return { days: ASKABLE_TRIALS.has(n) ? n : DEFAULT_TRIAL, code: null };
}

// ---------- Checkout and the customer portal ----------

/** The account's Stripe customer, made on its first checkout. */
async function customerFor(cfg: StripeConfig, accountId: string, email: string | null, f: Fetch): Promise<string> {
  const known = await query<{ customer_id: string }>("SELECT customer_id FROM stripe_customers WHERE account_id = ?", [accountId]);
  if (known[0]) return String(known[0].customer_id);
  const c = await call<{ id: string }>(cfg, "POST", "/customers", { email: email ?? undefined, "metadata[account_id]": accountId }, f);
  await run("INSERT OR IGNORE INTO stripe_customers (account_id, customer_id, at) VALUES (?, ?, ?)", [accountId, c.id, Date.now()]);
  const kept = await query<{ customer_id: string }>("SELECT customer_id FROM stripe_customers WHERE account_id = ?", [accountId]);
  return String(kept[0]?.customer_id ?? c.id);
}

export interface CheckoutInput {
  accountId: string;
  email: string | null;
  plan: WebPlan;
  installId: string | null;
  code: string | null;
  trialDays: number | null;
  /** A coach plan instead of Pro (no trial: Pro's own trial and its 3 clients are the way to try coaching). */
  tier?: PaidCoachTier;
}

/** Where Stripe sends the lifter back: always our own site (never an address from the request), into the app. */
export const RETURN_URLS = {
  paid: `${SITE_URL}/app/#/pro/paid`,
  /** A coach plan comes back to Coaching, which waits for the plan to reach the account. */
  coachPaid: `${SITE_URL}/app/#/trainer/plan`,
  coachCancelled: `${SITE_URL}/app/#/trainer`,
  cancelled: `${SITE_URL}/app/#/pro/settings`,
  portal: `${SITE_URL}/app/#/pro/settings`,
};

/** A Stripe Checkout page for one plan. The account, install and code ride along as metadata for the webhook. */
export async function checkoutUrl(cfg: StripeConfig, input: CheckoutInput, f: Fetch = fetch): Promise<string> {
  const customer = await customerFor(cfg, input.accountId, input.email, f);
  const meta = { account_id: input.accountId, install_id: input.installId, creator_code: input.code, plan: input.plan, tier: input.tier };
  const price = input.tier ? cfg.coachPrices[input.tier]?.[input.plan] : cfg.prices[input.plan];
  if (!price) throw new StripeError("That plan isn't sold on the web", 400);
  const params: Record<string, Param> = {
    mode: "subscription",
    customer,
    client_reference_id: input.accountId,
    "line_items[0][price]": price,
    "line_items[0][quantity]": 1,
    success_url: input.tier ? RETURN_URLS.coachPaid : RETURN_URLS.paid,
    cancel_url: input.tier ? RETURN_URLS.coachCancelled : RETURN_URLS.cancelled,
    "subscription_data[trial_period_days]": input.trialDays ?? undefined,
    // Cancel rather than bill if the card was never added during a trial (it always is, but be safe).
    "subscription_data[trial_settings][end_behavior][missing_payment_method]": input.trialDays ? "cancel" : undefined,
  };
  for (const [k, v] of Object.entries(meta)) {
    params[`metadata[${k}]`] = v;
    params[`subscription_data[metadata][${k}]`] = v;
  }
  const s = await call<{ url: string | null }>(cfg, "POST", "/checkout/sessions", params, f);
  if (!s.url) throw new StripeError("Stripe gave no checkout page", 502);
  return s.url;
}

/**
 * Moves the account's live web subscription to a coach plan's price, so a lifter who pays for Pro on the web upgrades
 * without a second subscription. Stripe bills the difference for the rest of the period straight away; a free trial
 * ends now, because the trial is for Pro. Returns false when there's no live web subscription to move.
 */
export async function moveWebSub(
  cfg: StripeConfig,
  accountId: string,
  tier: PaidCoachTier,
  plan: WebPlan,
  f: Fetch = fetch,
  now = Date.now(),
) {
  const price = cfg.coachPrices[tier]?.[plan];
  if (!price) throw new StripeError("That plan isn't sold on the web", 400);
  const row = await liveSubRow(accountId, now);
  if (!row) return false;
  const sub = await call<StripeSub>(cfg, "GET", `/subscriptions/${row.id}`, {}, f);
  const item = (sub.items?.data?.[0] as { id?: string } | undefined)?.id;
  if (!item) return false;
  await call(
    cfg,
    "POST",
    `/subscriptions/${row.id}`,
    {
      "items[0][id]": item,
      "items[0][price]": price,
      proration_behavior: "always_invoice",
      trial_end: sub.status === "trialing" ? "now" : undefined,
      cancel_at_period_end: false,
      "metadata[tier]": tier,
      "metadata[plan]": plan,
    },
    f,
  );
  return true;
}

/** Stripe's customer portal for the account: change plan, update the card, cancel, see invoices. */
export async function portalUrl(cfg: StripeConfig, accountId: string, f: Fetch = fetch): Promise<string | null> {
  const known = await query<{ customer_id: string }>("SELECT customer_id FROM stripe_customers WHERE account_id = ?", [accountId]);
  if (!known[0]) return null;
  const s = await call<{ url: string }>(
    cfg,
    "POST",
    "/billing_portal/sessions",
    { customer: String(known[0].customer_id), return_url: RETURN_URLS.portal },
    f,
  );
  return s.url;
}

// ---------- The webhook ----------

/** Checks the Stripe-Signature header ("t=…,v1=…") against the raw body, in constant time, within the tolerance. */
export function verifySignature(payload: string, header: string | null, secret: string, nowS = Math.floor(Date.now() / 1000)): boolean {
  if (!header || !secret) return false;
  const parts = header.split(",").map((p) => p.trim().split("="));
  const t = Number(parts.find(([k]) => k === "t")?.[1]);
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v ?? "");
  if (!Number.isFinite(t) || !sigs.length || Math.abs(nowS - t) > SIGNATURE_TOLERANCE_S) return false;
  const want = Buffer.from(createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex"));
  return sigs.some((s) => {
    const got = Buffer.from(s);
    return got.length === want.length && timingSafeEqual(got, want);
  });
}

type Meta = Record<string, string | undefined> | null | undefined;

interface StripeSub {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end?: boolean;
  current_period_end?: number | null;
  trial_end?: number | null;
  metadata?: Meta;
  items?: { data?: { current_period_end?: number | null; price?: { id?: string; recurring?: { interval?: string } | null } }[] };
}

interface StripeInvoice {
  id: string;
  customer: string;
  subscription?: string | null;
  parent?: { subscription_details?: { subscription?: string | null; metadata?: Meta } | null } | null;
  billing_reason?: string;
  amount_paid: number;
  currency: string;
  customer_address?: { country?: string | null } | null;
  subscription_details?: { metadata?: Meta } | null;
}

interface StripeCharge {
  id: string;
  customer?: string | null;
  amount_refunded: number;
  currency: string;
  invoice?: string | null;
}

export interface StripeEvent {
  id: string;
  type: string;
  created: number;
  livemode: boolean;
  data: { object: unknown; previous_attributes?: Record<string, unknown> };
}

const ZERO_DECIMAL = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);
/** Stripe's smallest unit → micros (the admin panel's money unit). */
export function microsOf(amount: number, currency: string): number {
  return Math.round(Math.abs(amount) * (ZERO_DECIMAL.has(currency.toUpperCase()) ? 1_000_000 : 10_000));
}

/** Which tier a subscription is on: its price id against the coach prices, else its metadata, else Pro. */
export function subTier(sub: StripeSub, cfg: Pick<StripeConfig, "coachPrices"> | null): CoachTier {
  const id = sub.items?.data?.[0]?.price?.id;
  if (id && cfg)
    for (const tier of ["coach", "coachPlus"] as PaidCoachTier[]) {
      const p = cfg.coachPrices[tier];
      if (p && (p.monthly === id || p.annual === id)) return tier;
    }
  const m = sub.metadata?.tier;
  return isPaidCoachTier(m) ? m : "pro";
}

/** Which plan a subscription is on: its price id against ours, else the price's interval. */
export function subPlan(sub: StripeSub, cfg: Pick<StripeConfig, "prices"> | null): WebPlan | null {
  const price = sub.items?.data?.[0]?.price;
  if (price?.id && cfg) {
    if (price.id === cfg.prices.annual) return "annual";
    if (price.id === cfg.prices.monthly) return "monthly";
  }
  const i = price?.recurring?.interval;
  return i === "year" ? "annual" : i === "month" ? "monthly" : null;
}

/** When the paid-for period ends, in ms. Newer API versions keep it on the item rather than the subscription. */
export function periodEnd(sub: StripeSub): number | null {
  const s = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
  return typeof s === "number" ? s * 1000 : null;
}

async function accountOfCustomer(customer: string | null | undefined, meta: Meta): Promise<string | null> {
  if (meta?.account_id) return meta.account_id;
  if (!customer) return null;
  const r = await query<{ account_id: string }>("SELECT account_id FROM stripe_customers WHERE customer_id = ?", [customer]);
  return r[0] ? String(r[0].account_id) : null;
}

type Stmt = { sql: string; args: (string | number | null)[] };

function subEvent(
  id: string,
  at: number,
  sub: string | null,
  install: string | null,
  kind: string,
  plan: WebPlan | null,
  money?: { micros: number; currency: string },
  country?: string | null,
  reason?: string | null,
): Stmt {
  const usd = money && money.currency === "USD" ? money.micros : null;
  return {
    sql: "INSERT OR IGNORE INTO subscription_events (id, at, install_id, subscription, store, kind, plan, price_micros, currency, usd_micros, country, reason, source) VALUES (?, ?, ?, ?, 'web', ?, ?, ?, ?, ?, ?, ?, 'store')",
    args: [
      id,
      at,
      install,
      sub,
      kind,
      plan,
      money?.micros ?? null,
      money?.currency ?? null,
      usd,
      country ? country.toUpperCase().slice(0, 2) : null,
      reason ?? null,
    ],
  };
}

/**
 * Stores one Stripe event: the subscription's state (which is the account's web Pro) and, for live events, a row in
 * subscription_events for the admin Revenue tab and creator commission (store 'web', source 'store': Stripe signed it).
 * Returns the subscription_events id it wrote, so the route can send the new-customer alert.
 */
export async function storeStripeEvent(
  e: StripeEvent,
  cfg: (Pick<StripeConfig, "prices" | "live"> & Partial<Pick<StripeConfig, "coachPrices">>) | null,
  now = Date.now(),
): Promise<{ stored: boolean; eventId: string | null }> {
  if (!e?.id || !e.type || !e.data?.object) return { stored: false, eventId: null };
  // Test events reach a live endpoint (Stripe's dashboard "send test event"), and the other way round: keep them apart.
  if (cfg && e.livemode !== cfg.live) return { stored: false, eventId: null };
  const at = (e.created ?? Math.floor(now / 1000)) * 1000;
  const id = `st-${e.id}`;
  const stmts: Stmt[] = [];
  let eventId: string | null = null;

  if (e.type.startsWith("customer.subscription.")) {
    const sub = e.data.object as StripeSub;
    const account = await accountOfCustomer(sub.customer, sub.metadata);
    const plan = subPlan(sub, cfg);
    const tier = subTier(sub, cfg ? { coachPrices: cfg.coachPrices ?? {} } : null);
    const end = periodEnd(sub);
    const status = e.type === "customer.subscription.deleted" ? "canceled" : sub.status;
    const install = sub.metadata?.install_id ?? null;
    if (account) {
      stmts.push({
        sql: `INSERT INTO stripe_subscriptions (id, account_id, customer_id, status, plan, period_end, trial_end, cancel_at_period_end, install_id, updated_at, tier)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET status = excluded.status, plan = COALESCE(excluded.plan, plan), period_end = COALESCE(excluded.period_end, period_end),
              trial_end = excluded.trial_end, cancel_at_period_end = excluded.cancel_at_period_end, updated_at = excluded.updated_at, tier = excluded.tier
              WHERE excluded.updated_at >= stripe_subscriptions.updated_at`,
        args: [
          sub.id,
          account,
          sub.customer,
          status,
          plan,
          end,
          sub.trial_end ? sub.trial_end * 1000 : null,
          sub.cancel_at_period_end ? 1 : 0,
          install,
          at,
          tier,
        ],
      });
      stmts.push({
        sql: "INSERT OR IGNORE INTO stripe_customers (account_id, customer_id, at) VALUES (?, ?, ?)",
        args: [account, sub.customer, at],
      });
    }
    let kind: string | null = null;
    let reason: string | null = null;
    const prev = e.data.previous_attributes ?? {};
    if (e.type === "customer.subscription.created" && sub.status === "trialing") kind = "trial_start";
    else if (e.type === "customer.subscription.deleted") {
      kind = "expire";
      reason =
        (sub as { cancellation_details?: { reason?: string } }).cancellation_details?.reason === "payment_failed"
          ? "billing"
          : "unsubscribe";
    } else if (e.type === "customer.subscription.updated" && "cancel_at_period_end" in prev) {
      kind = sub.cancel_at_period_end ? "cancel" : "uncancel";
      if (kind === "cancel") reason = "unsubscribe";
    }
    if (kind && e.livemode) {
      stmts.push(subEvent(id, at, sub.id, install, kind, plan, undefined, null, reason));
      eventId = id;
    }
  } else if (e.type === "invoice.paid") {
    const inv = e.data.object as StripeInvoice;
    const subId = inv.subscription ?? inv.parent?.subscription_details?.subscription ?? null;
    const meta = inv.subscription_details?.metadata ?? inv.parent?.subscription_details?.metadata;
    if (inv.amount_paid > 0 && subId && e.livemode) {
      const row = await query<{ plan: string | null; install_id: string | null; trial_end: number | null; paid: number }>(
        "SELECT plan, install_id, trial_end, (SELECT COUNT(*) FROM subscription_events WHERE subscription = ? AND store = 'web' AND kind IN ('purchase', 'trial_convert', 'renew')) AS paid FROM stripe_subscriptions WHERE id = ?",
        [subId, subId],
      );
      const r = row[0];
      const first = !r || Number(r.paid) === 0;
      const kind =
        inv.billing_reason === "subscription_create" ? "purchase" : first && r?.trial_end ? "trial_convert" : first ? "purchase" : "renew";
      const currency = inv.currency.toUpperCase();
      const plan = (r?.plan as WebPlan | null) ?? (meta?.plan === "annual" || meta?.plan === "monthly" ? meta.plan : null);
      stmts.push(
        subEvent(
          id,
          at,
          subId,
          r?.install_id ?? meta?.install_id ?? null,
          kind,
          plan,
          { micros: microsOf(inv.amount_paid, currency), currency },
          inv.customer_address?.country,
        ),
      );
      eventId = id;
    }
  } else if (e.type === "charge.refunded") {
    const ch = e.data.object as StripeCharge;
    if (ch.amount_refunded > 0 && e.livemode) {
      const currency = ch.currency.toUpperCase();
      const sub = ch.customer
        ? await query<{ id: string; plan: string | null; install_id: string | null }>(
            "SELECT id, plan, install_id FROM stripe_subscriptions WHERE customer_id = ? ORDER BY updated_at DESC LIMIT 1",
            [ch.customer],
          )
        : [];
      stmts.push(
        subEvent(id, at, sub[0]?.id ?? null, sub[0]?.install_id ?? null, "refund", (sub[0]?.plan as WebPlan | null) ?? null, {
          micros: microsOf(ch.amount_refunded, currency),
          currency,
        }),
      );
      eventId = id;
    }
  }

  if (!stmts.length) return { stored: false, eventId: null };
  await batch(stmts);
  if (e.type.startsWith("customer.subscription.")) {
    const sub = e.data.object as StripeSub;
    await claimFromStore(sub.metadata?.install_id ?? null, sub.metadata?.creator_code, at);
  }
  return { stored: true, eventId };
}

// ---------- The account's web subscription ----------

export interface WebSub {
  plan: WebPlan | null;
  /** The coach plan tier it's on (Pro for a plain Pro subscription). */
  tier?: CoachTier;
  trial: boolean;
  expiresAt: number | null;
  willRenew: boolean;
  status: string;
}

interface SubRow {
  id: string;
  status: string;
  plan: string | null;
  period_end: number | null;
  trial_end: number | null;
  cancel_at_period_end: number;
  tier: string | null;
}

/** The account's web subscription row that gives Pro now: the highest coach tier first, then the latest period end. */
async function liveSubRow(accountId: string, now: number): Promise<SubRow | null> {
  const rows = await query<SubRow>(
    `SELECT id, status, plan, period_end, trial_end, cancel_at_period_end, tier FROM stripe_subscriptions WHERE account_id = ?
     ORDER BY CASE tier WHEN 'coachPlus' THEN 2 WHEN 'coach' THEN 1 ELSE 0 END DESC, period_end DESC`,
    [accountId],
  );
  for (const r of rows) {
    const end = r.period_end == null ? null : Number(r.period_end);
    if (!PRO_STATUSES.has(String(r.status))) continue;
    if (end != null && end + WEB_GRACE_MS <= now) continue;
    return r;
  }
  return null;
}

/** The account's web subscription that gives Pro now, if any. */
export async function webSub(accountId: string, now = Date.now()): Promise<WebSub | null> {
  const r = await liveSubRow(accountId, now);
  if (!r) return null;
  return {
    plan: r.plan === "annual" || r.plan === "monthly" ? r.plan : null,
    tier: isCoachTier(r.tier) ? r.tier : "pro",
    trial: r.status === "trialing",
    expiresAt: r.period_end == null ? null : Number(r.period_end),
    willRenew: !Number(r.cancel_at_period_end),
    status: String(r.status),
  };
}

/**
 * Deleting the account ends its web subscription straight away (no more charges for an account that no longer exists;
 * the lifter is told on the delete screen) and forgets the customer link. Stripe keeps its own invoices, as the law asks.
 */
export async function forgetStripe(accountId: string, cfg: StripeConfig | null = stripeConfig(), f: Fetch = fetch): Promise<void> {
  const subs = await query<{ id: string; status: string }>("SELECT id, status FROM stripe_subscriptions WHERE account_id = ?", [accountId]);
  if (cfg)
    for (const s of subs)
      if (PRO_STATUSES.has(String(s.status)) || s.status === "incomplete" || s.status === "unpaid")
        await call(cfg, "POST", `/subscriptions/${String(s.id)}/cancel`, {}, f).catch(() => null);
  await batch([
    { sql: "DELETE FROM stripe_subscriptions WHERE account_id = ?", args: [accountId] },
    { sql: "DELETE FROM stripe_customers WHERE account_id = ?", args: [accountId] },
  ]);
}
