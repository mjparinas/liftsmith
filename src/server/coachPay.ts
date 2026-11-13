// Client payments through Stripe Connect (Melvin, 2026-11-13: "taking client payments, through Stripe Connect"). A coach
// or personal trainer connects their own Stripe account (an Express account, set up on Stripe's pages), sets each
// client's price (per session or monthly), and the client pays on a Stripe Checkout page in the browser. The coach's
// account is the merchant: the money, the receipts, refunds and disputes are theirs, and Liftsmith takes no cut unless
// STRIPE_CONNECT_FEE_PERCENT says so. Card details never touch Liftsmith or the app. Decision record:
// docs/decisions/trainer-mode.md "Payments".
//
// Configured in Vercel: STRIPE_SECRET_KEY (the platform's key, shared with Pro on the web) and
// STRIPE_CONNECT_WEBHOOK_SECRET (the signing secret of the Connect webhook endpoint, /api/coach/stripe/). Until both
// are set, payments don't show anywhere.
import { SITE_URL } from "@/lib/site";

import { isAccountId, isClient, nameOf } from "./coach";
import { batch, query, run } from "./db";
import { notifyCoach } from "./push";
import { formBody, StripeError, verifySignature, type Fetch } from "./stripe";

type Env = Record<string, string | undefined>;
const API = "https://api.stripe.com/v1";

export interface PayConfig {
  secret: string;
  webhook: string;
  /** Liftsmith's share of each payment, in percent (0 by default). */
  feePercent: number;
}

export function payConfig(env: Env = process.env): PayConfig | null {
  const secret = env.STRIPE_SECRET_KEY?.trim();
  const webhook = env.STRIPE_CONNECT_WEBHOOK_SECRET?.trim();
  if (!secret || !webhook || !/^(sk|rk)_(live|test)_/.test(secret)) return null;
  const fee = Number(env.STRIPE_CONNECT_FEE_PERCENT ?? 0);
  return { secret, webhook, feePercent: Number.isFinite(fee) && fee > 0 && fee <= 20 ? fee : 0 };
}

export type PriceKind = "session" | "month";
const KINDS: PriceKind[] = ["session", "month"];

/** Currencies with no minor unit: an amount is whole units. Everything else here has cents. */
const ZERO_DECIMAL = new Set([
  "jpy",
  "krw",
  "vnd",
  "clp",
  "isk",
  "huf",
  "twd",
  "ugx",
  "xof",
  "xaf",
  "pyg",
  "rwf",
  "gnf",
  "kmf",
  "djf",
  "mga",
  "bif",
  "vuv",
  "xpf",
]);
export const minorUnits = (currency: string) => (ZERO_DECIMAL.has(currency.toLowerCase()) ? 1 : 100);

export const PAY_LIMITS = {
  /** A price in whole currency units. */
  amount: [1, 10_000] as const,
  /** Payments a report lists. */
  history: 10,
};

async function call<T>(
  cfg: PayConfig,
  method: "GET" | "POST" | "DELETE",
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  account?: string,
  f: Fetch = fetch,
) {
  const body = formBody(params);
  const r = await f(method === "GET" && body ? `${API}${path}?${body}` : `${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.secret}`,
      ...(account ? { "Stripe-Account": account } : {}),
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" ? body : undefined,
  });
  const json = (await r.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!r.ok) throw new StripeError(json.error?.message ?? `Stripe answered ${r.status}`, r.status);
  return json as T;
}

// ---------- The coach's Stripe account ----------

export interface PayAccount {
  /** Stripe has everything it needs and the coach can take payments. */
  ready: boolean;
  /** The account's own currency, which prices are set in. */
  currency: string;
}

interface StripeAccount {
  id: string;
  charges_enabled?: boolean;
  details_submitted?: boolean;
  default_currency?: string;
  metadata?: Record<string, string>;
}

async function accountRow(coachId: string): Promise<{ stripe_id: string; ready: number; currency: string } | null> {
  const [r] = await query<{ stripe_id: string; ready: number; currency: string }>(
    "SELECT stripe_id, ready, currency FROM coach_stripe WHERE coach_id = ?",
    [coachId],
  );
  return r ?? null;
}

export async function payAccount(coachId: string): Promise<PayAccount | null> {
  const r = await accountRow(coachId);
  return r ? { ready: Number(r.ready) === 1, currency: String(r.currency || "cad") } : null;
}

async function saveAccount(coachId: string, a: StripeAccount, now: number) {
  await run(
    `INSERT INTO coach_stripe (coach_id, stripe_id, ready, currency, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (coach_id) DO UPDATE SET stripe_id = excluded.stripe_id, ready = excluded.ready, currency = excluded.currency, updated_at = excluded.updated_at`,
    [coachId, a.id, a.charges_enabled ? 1 : 0, (a.default_currency ?? "cad").toLowerCase(), now],
  );
}

/** Where Stripe sends the coach back after setting up: always our own site, into Coaching. */
export const PAY_RETURN = `${SITE_URL}/app/#/trainer`;

/**
 * The link to Stripe's setup pages for this coach, making their Express account the first time. Stripe asks for their
 * country, business details and bank account; Liftsmith never sees them.
 */
export async function onboardUrl(
  cfg: PayConfig,
  coachId: string,
  email: string | null,
  now = Date.now(),
  f: Fetch = fetch,
): Promise<string> {
  let row = await accountRow(coachId);
  if (!row) {
    const a = await call<StripeAccount>(
      cfg,
      "POST",
      "/accounts",
      {
        type: "express",
        email: email ?? undefined,
        "capabilities[card_payments][requested]": true,
        "capabilities[transfers][requested]": true,
        "business_profile[product_description]": "Personal training and coaching sessions",
        "metadata[liftsmith_account]": coachId,
      },
      undefined,
      f,
    );
    await saveAccount(coachId, a, now);
    row = { stripe_id: a.id, ready: a.charges_enabled ? 1 : 0, currency: a.default_currency ?? "cad" };
  }
  const link = await call<{ url: string }>(
    cfg,
    "POST",
    "/account_links",
    { account: row.stripe_id, refresh_url: PAY_RETURN, return_url: PAY_RETURN, type: "account_onboarding" },
    undefined,
    f,
  );
  return link.url;
}

/** Asks Stripe whether the coach's account can take payments yet (after they come back from setting up). */
export async function refreshAccount(cfg: PayConfig, coachId: string, now = Date.now(), f: Fetch = fetch): Promise<PayAccount | null> {
  const row = await accountRow(coachId);
  if (!row) return null;
  const a = await call<StripeAccount>(cfg, "GET", `/accounts/${encodeURIComponent(row.stripe_id)}`, {}, undefined, f);
  await saveAccount(coachId, a, now);
  return { ready: !!a.charges_enabled, currency: (a.default_currency ?? "cad").toLowerCase() };
}

/** A one-time link into the coach's own Stripe dashboard (payouts, refunds, receipts). */
export async function dashboardUrl(cfg: PayConfig, coachId: string, f: Fetch = fetch): Promise<string | null> {
  const row = await accountRow(coachId);
  if (!row) return null;
  return (await call<{ url: string }>(cfg, "POST", `/accounts/${encodeURIComponent(row.stripe_id)}/login_links`, {}, undefined, f)).url;
}

// ---------- Prices ----------

export interface Price {
  coachId: string;
  clientId: string;
  /** In whole currency units (60 is $60). */
  amount: number;
  currency: string;
  kind: PriceKind;
  at: number;
}
interface PriceRow {
  coach_id: string;
  client_id: string;
  amount: number;
  currency: string;
  kind: string;
  updated_at: number;
}
const price = (r: PriceRow): Price => ({
  coachId: String(r.coach_id),
  clientId: String(r.client_id),
  amount: Number(r.amount),
  currency: String(r.currency),
  kind: KINDS.find((k) => k === r.kind) ?? "session",
  at: Number(r.updated_at),
});

/** Sets (or, with no amount, clears) what a client pays this coach, in the coach's Stripe currency. */
export async function setPrice(
  coachId: string,
  clientId: unknown,
  amount: unknown,
  kind: unknown,
  now = Date.now(),
): Promise<Price | null | { error: "notClient" | "noAccount" | "bad" }> {
  if (!isAccountId(clientId) || !(await isClient(coachId, clientId))) return { error: "notClient" };
  if (amount === null || amount === undefined || amount === "") {
    await run("DELETE FROM coach_prices WHERE coach_id = ? AND client_id = ?", [coachId, clientId]);
    return null;
  }
  const acc = await payAccount(coachId);
  if (!acc) return { error: "noAccount" };
  const [lo, hi] = PAY_LIMITS.amount;
  const k = KINDS.find((x) => x === kind);
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < lo || amount > hi || !k) return { error: "bad" };
  const p: Price = { coachId, clientId, amount: Math.round(amount * 100) / 100, currency: acc.currency, kind: k, at: now };
  await run(
    `INSERT INTO coach_prices (coach_id, client_id, amount, currency, kind, updated_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (coach_id, client_id) DO UPDATE SET amount = excluded.amount, currency = excluded.currency, kind = excluded.kind, updated_at = excluded.updated_at`,
    [coachId, clientId, p.amount, p.currency, p.kind, now],
  );
  return p;
}

export async function priceFor(coachId: string, clientId: string): Promise<Price | null> {
  const [r] = await query<PriceRow>("SELECT * FROM coach_prices WHERE coach_id = ? AND client_id = ?", [coachId, clientId]);
  return r ? price(r) : null;
}

// ---------- Paying ----------

export interface Payment {
  id: string;
  coachId: string;
  clientId: string;
  amount: number;
  currency: string;
  kind: PriceKind;
  at: number;
}
export interface Subscription {
  status: string;
  /** End of the paid month, ms. */
  until: number | null;
  /** Stops at the end of the month. */
  ending: boolean;
}
interface PaymentRow {
  id: string;
  coach_id: string;
  client_id: string;
  amount: number;
  currency: string;
  kind: string;
  at: number;
}
const payment = (r: PaymentRow): Payment => ({
  id: String(r.id),
  coachId: String(r.coach_id),
  clientId: String(r.client_id),
  amount: Number(r.amount),
  currency: String(r.currency),
  kind: KINDS.find((k) => k === r.kind) ?? "session",
  at: Number(r.at),
});

async function subOf(coachId: string, clientId: string): Promise<(Subscription & { id: string }) | null> {
  const [r] = await query<{ sub_id: string; status: string; until: number | null; ending: number }>(
    "SELECT sub_id, status, until, ending FROM coach_subs WHERE coach_id = ? AND client_id = ?",
    [coachId, clientId],
  );
  return r
    ? { id: String(r.sub_id), status: String(r.status), until: r.until === null ? null : Number(r.until), ending: Number(r.ending) === 1 }
    : null;
}

/** What a pair sees about money: the price, the monthly subscription if there is one, and recent payments. */
export async function paymentsOf(
  coachId: string,
  clientId: string,
): Promise<{ price: Price | null; sub: Subscription | null; payments: Payment[] }> {
  const rows = await query<PaymentRow>("SELECT * FROM coach_payments WHERE coach_id = ? AND client_id = ? ORDER BY at DESC LIMIT ?", [
    coachId,
    clientId,
    PAY_LIMITS.history,
  ]);
  const sub = await subOf(coachId, clientId);
  return {
    price: await priceFor(coachId, clientId),
    sub: sub ? { status: sub.status, until: sub.until, ending: sub.ending } : null,
    payments: rows.map(payment),
  };
}

/** A client's prices from each of their coaches who can take payments, for Your coach. */
export async function clientPrices(clientId: string): Promise<(Price & { sub: Subscription | null })[]> {
  const rows = await query<PriceRow>(
    `SELECT p.* FROM coach_prices p JOIN coach_stripe s ON s.coach_id = p.coach_id AND s.ready = 1
       JOIN coach_links l ON l.coach_id = p.coach_id AND l.client_id = p.client_id
      WHERE p.client_id = ?`,
    [clientId],
  );
  return Promise.all(
    rows.map(async (r) => {
      const s = await subOf(String(r.coach_id), clientId);
      return { ...price(r), sub: s ? { status: s.status, until: s.until, ending: s.ending } : null };
    }),
  );
}

export type PayError = "notClient" | "noPrice" | "notReady" | "subscribed";

/** A Stripe Checkout page on the coach's account for what this client owes: one session, or the monthly plan. */
export async function checkoutFor(
  cfg: PayConfig,
  clientId: string,
  coachId: unknown,
  f: Fetch = fetch,
): Promise<string | { error: PayError }> {
  if (!isAccountId(coachId) || !(await isClient(coachId, clientId))) return { error: "notClient" };
  const p = await priceFor(coachId, clientId);
  if (!p) return { error: "noPrice" };
  const acc = await accountRow(coachId);
  if (!acc || Number(acc.ready) !== 1) return { error: "notReady" };
  const sub = await subOf(coachId, clientId);
  if (p.kind === "month" && sub && ["active", "trialing", "past_due"].includes(sub.status) && !sub.ending) return { error: "subscribed" };
  const unit = Math.round(p.amount * minorUnits(p.currency));
  const name = `${p.kind === "month" ? "Coaching" : "Training session"} with ${await nameOf(coachId)}`.slice(0, 120);
  const fee = cfg.feePercent;
  const s = await call<{ url: string }>(
    cfg,
    "POST",
    "/checkout/sessions",
    {
      mode: p.kind === "month" ? "subscription" : "payment",
      "line_items[0][quantity]": 1,
      "line_items[0][price_data][currency]": p.currency,
      "line_items[0][price_data][unit_amount]": unit,
      "line_items[0][price_data][product_data][name]": name,
      ...(p.kind === "month" ? { "line_items[0][price_data][recurring][interval]": "month" } : {}),
      // Liftsmith's share, only when configured.
      ...(fee && p.kind === "session" ? { "payment_intent_data[application_fee_amount]": Math.round((unit * fee) / 100) } : {}),
      ...(fee && p.kind === "month" ? { "subscription_data[application_fee_percent]": fee } : {}),
      "metadata[coach]": coachId,
      "metadata[client]": clientId,
      "metadata[kind]": p.kind,
      ...(p.kind === "month" ? { "subscription_data[metadata][coach]": coachId, "subscription_data[metadata][client]": clientId } : {}),
      ...(p.kind === "session"
        ? { "payment_intent_data[metadata][coach]": coachId, "payment_intent_data[metadata][client]": clientId }
        : {}),
      success_url: `${SITE_URL}/app/#/trainer/paid`,
      cancel_url: `${SITE_URL}/app/#/trainer`,
    },
    acc.stripe_id,
    f,
  );
  return s.url;
}

/** Stops a monthly plan at the end of the paid month. Either side can. */
export async function stopMonthly(cfg: PayConfig, accountId: string, otherId: unknown, f: Fetch = fetch): Promise<boolean> {
  if (!isAccountId(otherId)) return false;
  const pair = (await isClient(accountId, otherId))
    ? { coach: accountId, client: otherId }
    : (await isClient(otherId, accountId))
      ? { coach: otherId, client: accountId }
      : null;
  if (!pair) return false;
  const sub = await subOf(pair.coach, pair.client);
  const acc = await accountRow(pair.coach);
  if (!sub || !acc) return false;
  await call(cfg, "POST", `/subscriptions/${encodeURIComponent(sub.id)}`, { cancel_at_period_end: true }, acc.stripe_id, f);
  await run("UPDATE coach_subs SET ending = 1 WHERE coach_id = ? AND client_id = ?", [pair.coach, pair.client]);
  return true;
}

// ---------- The Connect webhook ----------

export interface ConnectEvent {
  id: string;
  type: string;
  account?: string;
  data: { object: Record<string, unknown> };
}

type Obj = Record<string, unknown>;
const str = (x: unknown) => (typeof x === "string" ? x : "");
const meta = (o: Obj): Record<string, string> =>
  o.metadata && typeof o.metadata === "object" ? (o.metadata as Record<string, string>) : {};

async function coachOfStripe(stripeId: string): Promise<string | null> {
  const [r] = await query<{ coach_id: string }>("SELECT coach_id FROM coach_stripe WHERE stripe_id = ?", [stripeId]);
  return r ? String(r.coach_id) : null;
}

/** The pair a payment belongs to, from its metadata, only when that coach owns the paying account. */
async function pairOf(e: ConnectEvent, m: Record<string, string>): Promise<{ coach: string; client: string } | null> {
  const coach = e.account ? await coachOfStripe(e.account) : null;
  if (!coach || m.coach !== coach || !isAccountId(m.client)) return null;
  return { coach, client: m.client };
}

const fromMinor = (amount: number, currency: string) => amount / minorUnits(currency);

async function recordPayment(
  id: string,
  pair: { coach: string; client: string },
  amountMinor: number,
  currency: string,
  kind: PriceKind,
  now: number,
) {
  const cur = currency.toLowerCase();
  const fresh = await query<{ id: string }>(
    `INSERT INTO coach_payments (id, coach_id, client_id, amount, currency, kind, at) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (id) DO NOTHING RETURNING id`,
    [id, pair.coach, pair.client, fromMinor(amountMinor, cur), cur, kind, now],
  );
  // Stripe sends an event more than once now and then: the coach hears about each payment once.
  if (fresh.length) {
    const text = new Intl.NumberFormat("en", { style: "currency", currency: cur.toUpperCase() }).format(fromMinor(amountMinor, cur));
    await notifyCoach(pair.coach, "coachPaid", { name: await nameOf(pair.client), text }, `#/trainer/c.${pair.client}`);
  }
}

/** Applies one verified Connect event. Unknown events and accounts are ignored. */
export async function storeConnectEvent(e: ConnectEvent, now = Date.now()): Promise<void> {
  const o = e.data.object;
  switch (e.type) {
    case "account.updated": {
      const coach = await coachOfStripe(str(o.id));
      if (coach) await saveAccount(coach, o as unknown as StripeAccount, now);
      return;
    }
    case "checkout.session.completed": {
      const pair = await pairOf(e, meta(o));
      if (!pair) return;
      if (o.mode === "payment" && o.payment_status === "paid")
        await recordPayment(str(o.payment_intent) || str(o.id), pair, Number(o.amount_total ?? 0), str(o.currency), "session", now);
      if (o.mode === "subscription" && str(o.subscription))
        await batch([
          {
            sql: `INSERT INTO coach_subs (coach_id, client_id, sub_id, status, until, ending, updated_at) VALUES (?, ?, ?, 'active', NULL, 0, ?)
                  ON CONFLICT (coach_id, client_id) DO UPDATE SET sub_id = excluded.sub_id, status = 'active', ending = 0, updated_at = excluded.updated_at`,
            args: [pair.coach, pair.client, str(o.subscription), now],
          },
        ]);
      return;
    }
    case "invoice.paid": {
      const parent = (o.parent as Obj | undefined)?.subscription_details as Obj | undefined;
      const pair = await pairOf(e, { ...meta((o.subscription_details as Obj | undefined) ?? {}), ...meta(parent ?? {}) });
      if (!pair || !Number(o.amount_paid)) return;
      await recordPayment(str(o.id), pair, Number(o.amount_paid), str(o.currency), "month", now);
      const lines = ((o.lines as Obj | undefined)?.data as Obj[] | undefined) ?? [];
      const end = Number((lines[0]?.period as Obj | undefined)?.end ?? 0);
      await run("UPDATE coach_subs SET status = 'active', until = ?, updated_at = ? WHERE coach_id = ? AND client_id = ?", [
        end ? end * 1000 : null,
        now,
        pair.coach,
        pair.client,
      ]);
      return;
    }
    case "invoice.payment_failed": {
      const parent = (o.parent as Obj | undefined)?.subscription_details as Obj | undefined;
      const pair = await pairOf(e, { ...meta((o.subscription_details as Obj | undefined) ?? {}), ...meta(parent ?? {}) });
      if (pair)
        await run("UPDATE coach_subs SET status = 'past_due', updated_at = ? WHERE coach_id = ? AND client_id = ?", [
          now,
          pair.coach,
          pair.client,
        ]);
      return;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const pair = await pairOf(e, meta(o));
      if (!pair) return;
      const status = e.type === "customer.subscription.deleted" ? "canceled" : str(o.status);
      await run("UPDATE coach_subs SET status = ?, ending = ?, updated_at = ? WHERE coach_id = ? AND client_id = ? AND sub_id = ?", [
        status,
        o.cancel_at_period_end ? 1 : 0,
        now,
        pair.coach,
        pair.client,
        str(o.id),
      ]);
      return;
    }
    default:
      return;
  }
}

export const verifyConnect = (payload: string, header: string | null, cfg: PayConfig, nowS?: number) =>
  verifySignature(payload, header, cfg.webhook, nowS);

// ---------- Ending ----------

/**
 * A client and coach stopped working together (either side unlinked, or an account is being deleted): their monthly
 * plan ends now, so nobody keeps paying for coaching they no longer get. Payments already made stay with the coach's
 * Stripe account; Liftsmith forgets the pair's price and history.
 */
export async function endPair(coachId: string, clientId: string, cfg: PayConfig | null = payConfig(), f: Fetch = fetch): Promise<void> {
  const sub = await subOf(coachId, clientId);
  const acc = await accountRow(coachId);
  if (cfg && sub && acc && sub.status !== "canceled")
    await call(cfg, "DELETE", `/subscriptions/${encodeURIComponent(sub.id)}`, {}, acc.stripe_id, f).catch(() => null);
  await batch([
    { sql: "DELETE FROM coach_subs WHERE coach_id = ? AND client_id = ?", args: [coachId, clientId] },
    { sql: "DELETE FROM coach_prices WHERE coach_id = ? AND client_id = ?", args: [coachId, clientId] },
    { sql: "DELETE FROM coach_payments WHERE coach_id = ? AND client_id = ?", args: [coachId, clientId] },
  ]);
}

/** Before an account is deleted: every monthly plan it pays or is paid ends. The coach's Stripe account stays theirs. */
export async function forgetCoachPay(accountId: string, cfg: PayConfig | null = payConfig(), f: Fetch = fetch): Promise<void> {
  const pairs = await query<{ coach_id: string; client_id: string }>(
    "SELECT coach_id, client_id FROM coach_subs WHERE coach_id = ? OR client_id = ?",
    [accountId, accountId],
  );
  for (const p of pairs) await endPair(String(p.coach_id), String(p.client_id), cfg, f);
  await batch([
    { sql: "DELETE FROM coach_prices WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
    { sql: "DELETE FROM coach_payments WHERE coach_id = ? OR client_id = ?", args: [accountId, accountId] },
    { sql: "DELETE FROM coach_stripe WHERE coach_id = ?", args: [accountId] },
  ]);
}
