import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";

import { accessFor, linkInstall } from "./access";
import { checkCreator, saveCreator } from "./creators";
import { query, resetDb, run } from "./db";
import {
  checkoutUrl,
  forgetStripe,
  formBody,
  microsOf,
  periodEnd,
  portalUrl,
  resetPriceCache,
  RETURN_URLS,
  storeStripeEvent,
  stripeConfig,
  trialFor,
  verifySignature,
  webPrices,
  type Fetch,
  type StripeConfig,
  type StripeEvent,
} from "./stripe";

const NOW = Date.UTC(2026, 10, 11);
const DAY = 86_400_000;
const S = (ms: number) => Math.floor(ms / 1000);
// Made-up test values, never real keys.
const CFG: StripeConfig = {
  secret: "sk_test_example",
  webhook: "whsec_example",
  prices: { monthly: "price_m", annual: "price_a" },
  coachPrices: { coach: { monthly: "price_cm", annual: "price_ca" } },
  live: true,
};

const sub = (over: Record<string, unknown> = {}) => ({
  id: "sub_1",
  customer: "cus_1",
  status: "trialing",
  cancel_at_period_end: false,
  trial_end: S(NOW + 14 * DAY),
  metadata: { account_id: "acct-1", install_id: "install-aaaa-1", creator_code: "", plan: "annual" },
  items: { data: [{ current_period_end: S(NOW + 14 * DAY), price: { id: "price_a", recurring: { interval: "year" } } }] },
  ...over,
});
const ev = (type: string, object: unknown, over: Partial<StripeEvent> = {}): StripeEvent => ({
  id: `evt_${type}_${Math.random().toString(36).slice(2, 8)}`,
  type,
  created: S(NOW),
  livemode: true,
  data: { object },
  ...over,
});

/** A fake Stripe that records each call and answers from `answers` by path. */
function fakeStripe(answers: Record<string, unknown>) {
  const calls: { url: string; method: string; body: URLSearchParams }[] = [];
  const f: Fetch = async (url, init) => {
    calls.push({ url, method: String(init.method), body: new URLSearchParams(String(init.body ?? "")) });
    const path = new URL(url).pathname.replace(/^\/v1/, "");
    const a = answers[path];
    return new Response(JSON.stringify(a ?? { error: { message: "nope" } }), { status: a ? 200 : 404 });
  };
  return { f, calls };
}

beforeEach(async () => {
  await resetDb();
  resetPriceCache();
});

describe("Stripe setup", () => {
  it("is off until all four values are set, and refuses a publishable key", () => {
    const env = {
      STRIPE_SECRET_KEY: "sk_live_x",
      STRIPE_WEBHOOK_SECRET: "whsec_x",
      STRIPE_PRICE_MONTHLY: "price_m",
      STRIPE_PRICE_ANNUAL: "price_a",
    };
    expect(stripeConfig(env)).toMatchObject({ live: true, prices: { monthly: "price_m", annual: "price_a" } });
    expect(stripeConfig({ ...env, STRIPE_SECRET_KEY: "rk_test_x" })?.live).toBe(false);
    expect(stripeConfig({ ...env, STRIPE_SECRET_KEY: "pk_live_x" })).toBeNull();
    expect(stripeConfig({ ...env, STRIPE_PRICE_ANNUAL: "" })).toBeNull();
    expect(stripeConfig({})).toBeNull();
  });

  it("encodes nested parameters the way Stripe reads them and drops empty ones", () => {
    expect(formBody({ "line_items[0][price]": "price_a", a: 1, b: undefined, c: null, d: "" })).toBe(
      "line_items%5B0%5D%5Bprice%5D=price_a&a=1",
    );
  });

  it("turns Stripe amounts into micros, zero-decimal currencies included", () => {
    expect(microsOf(3999, "usd")).toBe(39_990_000);
    expect(microsOf(-699, "USD")).toBe(6_990_000);
    expect(microsOf(1200, "JPY")).toBe(1_200_000_000);
  });

  it("reads the period end from the subscription or, on newer API versions, its item", () => {
    expect(periodEnd({ id: "s", customer: "c", status: "active", current_period_end: 100 })).toBe(100_000);
    expect(periodEnd(sub() as never)).toBe(S(NOW + 14 * DAY) * 1000);
  });
});

describe("Webhook signatures", () => {
  const body = JSON.stringify({ id: "evt_1" });
  const signed = (t: number, secret = "whsec_example") => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;

  it("takes Stripe's signature and nothing else", () => {
    const t = S(NOW);
    expect(verifySignature(body, signed(t), "whsec_example", t)).toBe(true);
    expect(verifySignature(body, `v1=deadbeef,${signed(t)}`, "whsec_example", t)).toBe(true);
    expect(verifySignature(body, signed(t, "whsec_other"), "whsec_example", t)).toBe(false);
    expect(verifySignature(`${body} `, signed(t), "whsec_example", t)).toBe(false);
    expect(verifySignature(body, null, "whsec_example", t)).toBe(false);
    expect(verifySignature(body, "garbage", "whsec_example", t)).toBe(false);
  });

  it("refuses an old signature, so a captured request can't be replayed later", () => {
    const t = S(NOW);
    expect(verifySignature(body, signed(t), "whsec_example", t + 301)).toBe(false);
    expect(verifySignature(body, signed(t), "whsec_example", t + 299)).toBe(true);
  });
});

describe("Web Pro on the account", () => {
  it("a trial gives the account Pro on every platform, and its end takes it away", async () => {
    await storeStripeEvent(ev("customer.subscription.created", sub()), CFG, NOW);
    expect(await accessFor("acct-1", null, NOW)).toMatchObject({
      pro: true,
      via: "web",
      sub: { store: "web", plan: "annual", trial: true, willRenew: true },
    });
    const rows = await query("SELECT kind, store, source, install_id FROM subscription_events");
    expect(rows).toEqual([{ kind: "trial_start", store: "web", source: "store", install_id: "install-aaaa-1" }]);

    await storeStripeEvent(ev("customer.subscription.deleted", sub({ status: "canceled" }), { created: S(NOW + DAY) }), CFG, NOW + DAY);
    expect((await accessFor("acct-1", null, NOW + DAY)).pro).toBe(false);
  });

  it("keeps Pro while Stripe retries a card, and for three days past a period end it hasn't heard about", async () => {
    await storeStripeEvent(ev("customer.subscription.updated", sub({ status: "past_due" })), CFG, NOW);
    expect((await accessFor("acct-1", null, NOW)).pro).toBe(true);
    const end = S(NOW + 14 * DAY) * 1000;
    expect((await accessFor("acct-1", null, end + 2 * DAY)).pro).toBe(true);
    expect((await accessFor("acct-1", null, end + 4 * DAY)).pro).toBe(false);
  });

  it("an older event never overwrites a newer one", async () => {
    await storeStripeEvent(ev("customer.subscription.updated", sub({ status: "active" }), { created: S(NOW + DAY) }), CFG, NOW);
    await storeStripeEvent(ev("customer.subscription.updated", sub({ status: "incomplete" }), { created: S(NOW) }), CFG, NOW);
    expect((await query("SELECT status FROM stripe_subscriptions"))[0]).toEqual({ status: "active" });
  });

  it("records cancelling and changing your mind, and keeps test events out of a live setup", async () => {
    await storeStripeEvent(ev("customer.subscription.created", sub({ status: "active" })), CFG, NOW);
    const cancel = ev("customer.subscription.updated", sub({ status: "active", cancel_at_period_end: true }));
    cancel.data.previous_attributes = { cancel_at_period_end: false };
    await storeStripeEvent(cancel, CFG, NOW);
    expect((await accessFor("acct-1", null, NOW)).sub?.willRenew).toBe(false);
    const back = ev("customer.subscription.updated", sub({ status: "active" }), { created: S(NOW) + 5 });
    back.data.previous_attributes = { cancel_at_period_end: true };
    await storeStripeEvent(back, CFG, NOW);
    expect((await query("SELECT kind FROM subscription_events ORDER BY at, kind")).map((r) => r.kind)).toEqual(["cancel", "uncancel"]);

    expect(await storeStripeEvent(ev("customer.subscription.created", sub({ id: "sub_t" }), { livemode: false }), CFG, NOW)).toEqual({
      stored: false,
      eventId: null,
    });
  });

  it("ignores events from a coach's connected account, even with an account in the metadata", async () => {
    const e = ev("customer.subscription.created", sub({ id: "sub_coach" }), { account: "acct_coach1" });
    expect(await storeStripeEvent(e, CFG, NOW)).toEqual({ stored: false, eventId: null });
    expect((await accessFor("acct-1", null, NOW)).pro).toBe(false);
    expect(await query("SELECT id FROM stripe_subscriptions")).toEqual([]);
  });

  it("finds the account from the customer when the metadata is missing", async () => {
    await run("INSERT INTO stripe_customers (account_id, customer_id, at) VALUES ('acct-2', 'cus_2', 0)");
    await storeStripeEvent(
      ev("customer.subscription.created", sub({ id: "sub_2", customer: "cus_2", status: "active", metadata: {} })),
      CFG,
      NOW,
    );
    expect((await accessFor("acct-2", null, NOW)).via).toBe("web");
  });
});

describe("Web revenue", () => {
  const invoice = (over: Record<string, unknown> = {}) => ({
    id: "in_1",
    customer: "cus_1",
    parent: { subscription_details: { subscription: "sub_1", metadata: { install_id: "install-aaaa-1", plan: "annual" } } },
    billing_reason: "subscription_cycle",
    amount_paid: 3999,
    currency: "usd",
    customer_address: { country: "ca" },
    ...over,
  });

  it("a trial's first payment is a conversion, the next ones renewals, and money is in USD micros", async () => {
    await storeStripeEvent(ev("customer.subscription.created", sub()), CFG, NOW);
    await storeStripeEvent(ev("invoice.paid", invoice({ amount_paid: 0, billing_reason: "subscription_create" })), CFG, NOW);
    const a = await storeStripeEvent(ev("invoice.paid", invoice(), { created: S(NOW + 14 * DAY) }), CFG, NOW);
    await storeStripeEvent(ev("invoice.paid", invoice({ id: "in_2" }), { created: S(NOW + 379 * DAY) }), CFG, NOW);
    const rows = await query("SELECT id, kind, plan, usd_micros, country FROM subscription_events ORDER BY at");
    expect(rows.map((r) => r.kind)).toEqual(["trial_start", "trial_convert", "renew"]);
    expect(rows[1]).toMatchObject({ id: a.eventId, plan: "annual", usd_micros: 39_990_000, country: "CA" });
  });

  it("a purchase without a trial, and a refund", async () => {
    await storeStripeEvent(ev("customer.subscription.created", sub({ status: "active", trial_end: null })), CFG, NOW);
    await storeStripeEvent(
      ev("invoice.paid", invoice({ billing_reason: "subscription_create", amount_paid: 699, currency: "cad" })),
      CFG,
      NOW,
    );
    await storeStripeEvent(ev("charge.refunded", { id: "ch_1", customer: "cus_1", amount_refunded: 699, currency: "cad" }), CFG, NOW);
    const rows = await query("SELECT kind, price_micros, currency, usd_micros FROM subscription_events ORDER BY kind");
    expect(rows).toEqual([
      { kind: "purchase", price_micros: 6_990_000, currency: "CAD", usd_micros: null },
      { kind: "refund", price_micros: 6_990_000, currency: "CAD", usd_micros: null },
    ]);
  });

  it("credits the creator whose code came with the checkout", async () => {
    const c = checkCreator({ code: "LIFT-ALEX", name: "Alex" });
    if (!c.ok) throw new Error(c.error);
    await saveCreator(c.creator, NOW);
    await storeStripeEvent(
      ev(
        "customer.subscription.created",
        sub({ metadata: { account_id: "acct-1", install_id: "install-aaaa-1", creator_code: "LIFT-ALEX" } }),
      ),
      CFG,
      NOW,
    );
    expect(await query("SELECT install_id, code, source FROM creator_installs")).toEqual([
      { install_id: "install-aaaa-1", code: "LIFT-ALEX", source: "store" },
    ]);
  });
});

describe("A phone's store subscription on the web", () => {
  it("counts for the account once that phone has synced while signed in", async () => {
    await run(
      "INSERT INTO entitlements (app_user_id, active, plan, period, store, expires_at, family, updated_at) VALUES ('install-phone-1', 1, 'monthly', 'NORMAL', 'play', ?, 0, ?)",
      [NOW + 20 * DAY, NOW],
    );
    expect((await accessFor("acct-1", null, NOW)).pro).toBe(false);
    await linkInstall("acct-1", "install-phone-1", NOW);
    expect(await accessFor("acct-1", null, NOW)).toMatchObject({ pro: true, via: "play", sub: { store: "play", plan: "monthly" } });
    expect((await accessFor("acct-1", null, NOW + 21 * DAY)).pro).toBe(false);
  });

  it("ignores an install id that isn't one", async () => {
    await linkInstall("acct-1", "x", NOW);
    await linkInstall("acct-1", { evil: true }, NOW);
    expect(await query("SELECT * FROM account_installs")).toEqual([]);
  });
});

describe("Trials and checkout", () => {
  it("gives the asked trial (7 or 14), a code's own trial first, and none to an account that had one", async () => {
    expect(await trialFor("acct-1", null, "7", NOW)).toEqual({ days: 7, code: null });
    expect(await trialFor("acct-1", null, "90", NOW)).toEqual({ days: 14, code: null });
    const c = checkCreator({ code: "LIFT-ALEX", name: "Alex" });
    if (!c.ok) throw new Error(c.error);
    await saveCreator(c.creator, NOW);
    expect(await trialFor("acct-1", "lift-alex", "14", NOW)).toEqual({ days: 30, code: "LIFT-ALEX" });
    await storeStripeEvent(ev("customer.subscription.created", sub()), CFG, NOW);
    expect(await trialFor("acct-1", "LIFT-ALEX", "14", NOW)).toEqual({ days: null, code: "LIFT-ALEX" });
  });

  it("opens Checkout for the account's own customer, on our own return pages, with the account in the metadata", async () => {
    const { f, calls } = fakeStripe({
      "/customers": { id: "cus_9" },
      "/checkout/sessions": { url: "https://checkout.stripe.com/c/pay/cs_test_1" },
    });
    const url = await checkoutUrl(
      CFG,
      { accountId: "acct-9", email: "lifter@example.com", plan: "monthly", installId: "install-aaaa-9", code: null, trialDays: 14 },
      f,
    );
    expect(url).toBe("https://checkout.stripe.com/c/pay/cs_test_1");
    const s = calls[1]!.body;
    expect(s.get("customer")).toBe("cus_9");
    expect(s.get("line_items[0][price]")).toBe("price_m");
    expect(s.get("subscription_data[trial_period_days]")).toBe("14");
    expect(s.get("subscription_data[metadata][account_id]")).toBe("acct-9");
    expect(s.get("success_url")).toBe(RETURN_URLS.paid);
    // A second checkout reuses the customer.
    await checkoutUrl(CFG, { accountId: "acct-9", email: null, plan: "annual", installId: null, code: null, trialDays: null }, f);
    expect(calls.filter((c) => c.url.endsWith("/customers"))).toHaveLength(1);
    expect(calls[2]!.body.get("subscription_data[trial_period_days]")).toBeNull();
    expect(await portalUrl(CFG, "acct-0", f)).toBeNull();
  });

  it("reads both prices from Stripe, annual first", async () => {
    const { f } = fakeStripe({
      "/prices/price_a": { unit_amount: 3999, currency: "usd", active: true },
      "/prices/price_m": { unit_amount: 699, currency: "usd", active: true },
    });
    expect(await webPrices(CFG, NOW, f)).toEqual([
      { plan: "annual", amount: 3999, currency: "USD" },
      { plan: "monthly", amount: 699, currency: "USD" },
    ]);
  });

  it("deleting the account cancels its web subscription in Stripe", async () => {
    await storeStripeEvent(ev("customer.subscription.created", sub({ status: "active" })), CFG, NOW);
    const { f, calls } = fakeStripe({ "/subscriptions/sub_1/cancel": { id: "sub_1", status: "canceled" } });
    await forgetStripe("acct-1", CFG, f);
    expect(calls.map((c) => c.url)).toEqual(["https://api.stripe.com/v1/subscriptions/sub_1/cancel"]);
    expect(await query("SELECT * FROM stripe_subscriptions")).toEqual([]);
  });
});
