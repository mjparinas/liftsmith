import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";

import { joinCoach, makeInvite } from "./coach";
import {
  checkoutFor,
  clientPrices,
  endPair,
  forgetCoachPay,
  onboardUrl,
  payConfig,
  paymentsOf,
  refreshAccount,
  setPrice,
  stopMonthly,
  storeConnectEvent,
  verifyConnect,
  type ConnectEvent,
  type PayConfig,
} from "./coachPay";
import { query, resetDb } from "./db";
import { saveToken, setPushSender, type PushMessage } from "./push";

const NOW = 1_800_000_000_000;
const CFG: PayConfig = { secret: "sk_test_x", webhook: "whsec_test", feePercent: 0 };

const calls: { url: string; body: string; account?: string; method: string }[] = [];
let charges = true;
const fake = async (url: string, init: RequestInit) => {
  const h = (init.headers ?? {}) as Record<string, string>;
  calls.push({ url, body: String(init.body ?? ""), account: h["Stripe-Account"], method: String(init.method) });
  const json = (x: unknown) => new Response(JSON.stringify(x), { status: 200 });
  if (url.endsWith("/accounts")) return json({ id: "acct_1", charges_enabled: false, default_currency: "cad" });
  if (url.endsWith("/account_links")) return json({ url: "https://connect.stripe.com/setup/x" });
  if (url.includes("/accounts/acct_1")) return json({ id: "acct_1", charges_enabled: charges, default_currency: "cad" });
  if (url.endsWith("/checkout/sessions")) return json({ url: "https://checkout.stripe.com/c/x" });
  return json({});
};

const sent: PushMessage[] = [];
beforeEach(async () => {
  await resetDb();
  calls.length = 0;
  sent.length = 0;
  charges = true;
  setPushSender(async (m) => {
    sent.push(m);
    return "ok";
  });
  await makeInvite("coach", NOW, "CCCCDDDD");
  await joinCoach("client", "CCCCDDDD", NOW);
  await saveToken("coach", "tok-coach-0123456789abcdef", "ios", "en", NOW);
});

const ready = async () => {
  await onboardUrl(CFG, "coach", "coach@example.com", NOW, fake);
  await refreshAccount(CFG, "coach", NOW, fake);
};

describe("setting up", () => {
  it("needs the Connect webhook secret as well as the key", () => {
    expect(payConfig({ STRIPE_SECRET_KEY: "sk_test_1" })).toBeNull();
    expect(payConfig({ STRIPE_SECRET_KEY: "pk_test_1", STRIPE_CONNECT_WEBHOOK_SECRET: "whsec" })).toBeNull();
    expect(
      payConfig({ STRIPE_SECRET_KEY: "sk_test_1", STRIPE_CONNECT_WEBHOOK_SECRET: "whsec", STRIPE_CONNECT_FEE_PERCENT: "5" }),
    ).toMatchObject({ feePercent: 5 });
    expect(
      payConfig({ STRIPE_SECRET_KEY: "sk_test_1", STRIPE_CONNECT_WEBHOOK_SECRET: "whsec", STRIPE_CONNECT_FEE_PERCENT: "90" })?.feePercent,
    ).toBe(0);
  });

  it("makes one Express account and links to Stripe's setup pages", async () => {
    expect(await onboardUrl(CFG, "coach", "coach@example.com", NOW, fake)).toBe("https://connect.stripe.com/setup/x");
    await onboardUrl(CFG, "coach", "coach@example.com", NOW, fake);
    expect(calls.filter((c) => c.url.endsWith("/accounts"))).toHaveLength(1);
    expect(calls[0]!.body).toContain("type=express");
    charges = false;
    expect(await refreshAccount(CFG, "coach", NOW, fake)).toEqual({ ready: false, currency: "cad" });
  });
});

describe("prices and paying", () => {
  it("a price needs a Stripe account and a real client, and a client only sees it once payments work", async () => {
    expect(await setPrice("coach", "client", 60, "session", NOW)).toEqual({ error: "noAccount" });
    charges = false;
    await onboardUrl(CFG, "coach", null, NOW, fake);
    expect(await setPrice("coach", "stranger", 60, "session", NOW)).toEqual({ error: "notClient" });
    expect(await setPrice("coach", "client", 0, "session", NOW)).toEqual({ error: "bad" });
    expect(await setPrice("coach", "client", 60, "session", NOW)).toMatchObject({ amount: 60, currency: "cad", kind: "session" });
    expect(await clientPrices("client")).toEqual([]);
    charges = true;
    await refreshAccount(CFG, "coach", NOW, fake);
    expect(await clientPrices("client")).toMatchObject([{ coachId: "coach", amount: 60 }]);
  });

  it("checkout runs on the coach's own account, in cents, with the pair in the metadata", async () => {
    await ready();
    await setPrice("coach", "client", 62.5, "session", NOW);
    expect(await checkoutFor(CFG, "client", "coach", fake)).toBe("https://checkout.stripe.com/c/x");
    const c = calls.find((x) => x.url.endsWith("/checkout/sessions"))!;
    expect(c.account).toBe("acct_1");
    const q = new URLSearchParams(c.body);
    expect(q.get("mode")).toBe("payment");
    expect(q.get("line_items[0][price_data][unit_amount]")).toBe("6250");
    expect(q.get("metadata[client]")).toBe("client");
    expect(q.get("payment_intent_data[application_fee_amount]")).toBeNull();
    expect(await checkoutFor(CFG, "stranger", "coach", fake)).toEqual({ error: "notClient" });
  });

  it("a monthly plan is a subscription, and Liftsmith's share only applies when set", async () => {
    await ready();
    await setPrice("coach", "client", 200, "month", NOW);
    await checkoutFor({ ...CFG, feePercent: 5 }, "client", "coach", fake);
    const q = new URLSearchParams(calls.find((x) => x.url.endsWith("/checkout/sessions"))!.body);
    expect(q.get("mode")).toBe("subscription");
    expect(q.get("line_items[0][price_data][recurring][interval]")).toBe("month");
    expect(q.get("subscription_data[application_fee_percent]")).toBe("5");
  });
});

const event = (type: string, object: Record<string, unknown>, account = "acct_1"): ConnectEvent => ({
  id: `evt_${type}`,
  type,
  account,
  data: { object },
});

describe("the Connect webhook", () => {
  it("checks the signature with the Connect secret", () => {
    const t = Math.floor(NOW / 1000);
    const sig = createHmac("sha256", CFG.webhook).update(`${t}.{}`).digest("hex");
    expect(verifyConnect("{}", `t=${t},v1=${sig}`, CFG, t)).toBe(true);
    expect(verifyConnect("{}", `t=${t},v1=${sig}`, { ...CFG, webhook: "other" }, t)).toBe(false);
  });

  it("records a paid session once and tells the coach", async () => {
    await ready();
    const paid = event("checkout.session.completed", {
      id: "cs_1",
      mode: "payment",
      payment_status: "paid",
      payment_intent: "pi_1",
      amount_total: 6000,
      currency: "cad",
      metadata: { coach: "coach", client: "client" },
    });
    await storeConnectEvent(paid, NOW);
    await storeConnectEvent(paid, NOW);
    expect((await paymentsOf("coach", "client")).payments).toMatchObject([{ id: "pi_1", amount: 60, kind: "session" }]);
    expect(sent).toHaveLength(1);
    expect(sent[0]!.body).toContain("$60.00");
  });

  it("ignores payments from an account that isn't that coach's", async () => {
    await ready();
    await storeConnectEvent(
      event(
        "checkout.session.completed",
        {
          id: "cs_2",
          mode: "payment",
          payment_status: "paid",
          amount_total: 100,
          currency: "cad",
          metadata: { coach: "coach", client: "client" },
        },
        "acct_other",
      ),
      NOW,
    );
    expect((await paymentsOf("coach", "client")).payments).toEqual([]);
  });

  it("follows a monthly plan: started, paid, failing, stopping, and ended when they part", async () => {
    await ready();
    const m = { coach: "coach", client: "client" };
    await storeConnectEvent(
      event("checkout.session.completed", { id: "cs_3", mode: "subscription", subscription: "sub_1", metadata: m }),
      NOW,
    );
    await storeConnectEvent(
      event("invoice.paid", {
        id: "in_1",
        amount_paid: 20000,
        currency: "cad",
        parent: { subscription_details: { metadata: m } },
        lines: { data: [{ period: { end: NOW / 1000 + 2_592_000 } }] },
      }),
      NOW,
    );
    expect((await paymentsOf("coach", "client")).sub).toMatchObject({ status: "active", until: NOW + 2_592_000_000 });
    await storeConnectEvent(event("invoice.payment_failed", { id: "in_2", parent: { subscription_details: { metadata: m } } }), NOW);
    expect((await paymentsOf("coach", "client")).sub?.status).toBe("past_due");
    expect(await stopMonthly(CFG, "client", "coach", fake)).toBe(true);
    expect(calls.at(-1)).toMatchObject({ method: "POST", account: "acct_1" });
    expect((await paymentsOf("coach", "client")).sub?.ending).toBe(true);
    await endPair("coach", "client", CFG, fake);
    expect(calls.at(-1)).toMatchObject({ method: "DELETE", url: expect.stringContaining("/subscriptions/sub_1") });
    expect(await paymentsOf("coach", "client")).toEqual({ price: null, sub: null, payments: [] });
  });

  it("deleting an account ends its plans and forgets its Stripe link", async () => {
    await ready();
    await storeConnectEvent(
      event("checkout.session.completed", {
        id: "cs_4",
        mode: "subscription",
        subscription: "sub_2",
        metadata: { coach: "coach", client: "client" },
      }),
      NOW,
    );
    await forgetCoachPay("coach", CFG, fake);
    expect(calls.some((c) => c.method === "DELETE")).toBe(true);
    expect(await query("SELECT * FROM coach_stripe")).toEqual([]);
  });
});
