import { beforeEach, describe, expect, it } from "vitest";

import { clientLimit, tierFor, tierFromStore, UNLIMITED_CLIENTS } from "@/lib/coachPlans";

import { joinCoach, makeInvite } from "./coach";
import { coachPlanOf } from "./coachPlan";
import { query, resetDb, run } from "./db";
import { setFlag } from "./flags";
import { setPushSender, type PushMessage } from "./push";
import { storeRcEvent, tierOfEvent } from "./revenuecat";
import { moveWebSub, storeStripeEvent, subTier, type StripeEvent } from "./stripe";

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;

beforeEach(async () => {
  await resetDb();
  setPushSender(null);
});

/** Links `n` clients to the coach, `at` when each joined. */
async function clients(coach: string, n: number, at = NOW) {
  for (let i = 0; i < n; i++)
    await run("INSERT INTO coach_links (coach_id, client_id, created_at) VALUES (?, ?, ?)", [coach, `${coach}-client${i}`, at]);
}

async function invite(coach: string) {
  return (await makeInvite(coach, NOW)).code;
}

const plansOn = (at = NOW) => setFlag("coachPlans", true, 100, "test", at);

describe("coach plan tiers", () => {
  it("each tier allows more clients than the one before, and Coach Plus has no set limit", () => {
    expect(clientLimit("pro")).toBe(3);
    expect(clientLimit("coach")).toBe(25);
    expect(clientLimit("coachPlus")).toBe(UNLIMITED_CLIENTS);
    expect(clientLimit("coach", { pro: 5, coach: 50 })).toBe(50);
    expect(tierFor(3)).toBe("pro");
    expect(tierFor(4)).toBe("coach");
    expect(tierFor(26)).toBe("coachPlus");
  });

  it("reads the tier from RevenueCat's entitlements, else the product", () => {
    expect(tierFromStore(["pro", "coach", "coach_plus"], "x")).toBe("coachPlus");
    expect(tierFromStore(["pro", "coach"], null)).toBe("coach");
    expect(tierFromStore(null, "coach_plus:annual")).toBe("coachPlus");
    expect(tierFromStore(null, "coach_monthly")).toBe("coach");
    expect(tierFromStore(["pro"], "pro:monthly")).toBe("pro");
  });

  it("an upgrade counts at once; a move down waits for the renewal", () => {
    const base = { id: "e", type: "PRODUCT_CHANGE", entitlement_ids: ["pro"], product_id: "pro:monthly" };
    expect(tierOfEvent({ ...base, new_product_id: "coach:monthly" })).toBe("coach");
    expect(tierOfEvent({ ...base, product_id: "coach_plus:annual", entitlement_ids: ["coach_plus"], new_product_id: "pro:annual" })).toBe(
      "coachPlus",
    );
    expect(tierOfEvent({ id: "e", type: "RENEWAL" })).toBeNull();
  });
});

describe("client limits", () => {
  it("while coach plans are off, every coach keeps the old 30", async () => {
    await clients("coach", 29);
    const p = await coachPlanOf("coach", NOW);
    expect(p).toMatchObject({ live: false, limit: 30, clients: 29 });
    expect(await joinCoach("newbie", await invite("coach"), NOW)).not.toHaveProperty("error");
    expect(await joinCoach("another", await invite("coach"), NOW)).toEqual({ error: "coachFull" });
  });

  it("with them on, Pro takes 3 clients and the 4th is turned away, and the coach is told once a day", async () => {
    const sent: PushMessage[] = [];
    setPushSender(async (m) => {
      sent.push(m);
      return "ok";
    });
    await run("INSERT INTO push_tokens (token, account_id, platform, lang, updated_at) VALUES ('tok', 'coach', 'android', 'en', ?)", [NOW]);
    await plansOn();
    const code = await invite("coach");
    for (const c of ["a", "b", "c"]) expect(await joinCoach(c, code, NOW)).not.toHaveProperty("error");
    expect(await joinCoach("d", code, NOW)).toEqual({ error: "coachFull" });
    expect(await joinCoach("e", code, NOW)).toEqual({ error: "coachFull" });
    expect(sent.filter((m) => m.kind === "coachFull")).toHaveLength(1);
    expect(await coachPlanOf("coach", NOW)).toMatchObject({ live: true, tier: "pro", limit: 3, clients: 3, graceUntil: null });
  });

  it("the admin flags move Pro's and Coach's limits", async () => {
    await plansOn();
    await setFlag("coachProClients", 5, 100, "test", NOW);
    expect((await coachPlanOf("coach", NOW)).limit).toBe(5);
  });

  it("a coach over Pro's limit when plans went on keeps 30 for 90 days, and nobody is ever unlinked", async () => {
    await clients("coach", 8, NOW - DAY);
    await plansOn(NOW);
    const p = await coachPlanOf("coach", NOW + DAY);
    expect(p).toMatchObject({ limit: 30, graceUntil: NOW + 90 * DAY });
    const after = await coachPlanOf("coach", NOW + 91 * DAY);
    expect(after).toMatchObject({ limit: 3, clients: 8, graceUntil: null });
    // Still 8 linked: a limit only stops new clients joining.
    const [n] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_links WHERE coach_id = 'coach'");
    expect(Number(n?.n)).toBe(8);
  });

  it("a coach within Pro's limit when plans went on gets no grace", async () => {
    await clients("coach", 2, NOW - DAY);
    await plansOn(NOW);
    expect(await coachPlanOf("coach", NOW + DAY)).toMatchObject({ limit: 3, graceUntil: null });
  });

  it("a store Coach subscription on a linked phone gives 25", async () => {
    await plansOn();
    await run("INSERT INTO account_installs (account_id, install_id, at) VALUES ('coach', 'install-coach-1', ?)", [NOW]);
    await storeRcEvent(
      {
        id: "rc1",
        type: "INITIAL_PURCHASE",
        app_user_id: "install-coach-1",
        product_id: "coach:monthly",
        entitlement_ids: ["pro", "coach"],
        period_type: "NORMAL",
        store: "PLAY_STORE",
        expiration_at_ms: NOW + 30 * DAY,
        event_timestamp_ms: NOW,
      },
      NOW,
    );
    expect(await coachPlanOf("coach", NOW)).toMatchObject({ tier: "coach", via: "play", limit: 25 });
    // Lapsed: back to Pro's limit.
    expect(await coachPlanOf("coach", NOW + 31 * DAY)).toMatchObject({ tier: "pro", limit: 3 });
  });

  it("a web Coach Plus subscription has no set limit", async () => {
    await plansOn();
    const cfg = {
      prices: { monthly: "price_m", annual: "price_a" },
      coachPrices: { coachPlus: { monthly: "price_pm", annual: "price_pa" } },
      live: true,
    };
    const ev: StripeEvent = {
      id: "evt_1",
      type: "customer.subscription.created",
      created: Math.floor(NOW / 1000),
      livemode: true,
      data: {
        object: {
          id: "sub_1",
          customer: "cus_1",
          status: "active",
          metadata: { account_id: "coach" },
          items: {
            data: [{ current_period_end: Math.floor((NOW + 30 * DAY) / 1000), price: { id: "price_pa", recurring: { interval: "year" } } }],
          },
        },
      },
    };
    await storeStripeEvent(ev, cfg, NOW);
    expect(await coachPlanOf("coach", NOW)).toMatchObject({ tier: "coachPlus", via: "web", limit: UNLIMITED_CLIENTS });
  });

  it("a Stripe subscription's tier comes from its price, else its metadata", () => {
    const cfg = { coachPrices: { coach: { monthly: "price_cm", annual: "price_ca" } } };
    expect(subTier({ id: "s", customer: "c", status: "active", items: { data: [{ price: { id: "price_cm" } }] } }, cfg)).toBe("coach");
    expect(subTier({ id: "s", customer: "c", status: "active", metadata: { tier: "coachPlus" } }, cfg)).toBe("coachPlus");
    expect(subTier({ id: "s", customer: "c", status: "active", items: { data: [{ price: { id: "price_m" } }] } }, cfg)).toBe("pro");
  });
});

describe("moving a web Pro subscription to a coach plan", () => {
  it("changes the one subscription's price instead of starting a second, and ends a Pro trial", async () => {
    await run(
      "INSERT INTO stripe_subscriptions (id, account_id, customer_id, status, plan, period_end, cancel_at_period_end, updated_at, tier) VALUES ('sub_9', 'coach', 'cus_9', 'trialing', 'monthly', ?, 0, ?, 'pro')",
      [NOW + 10 * DAY, NOW],
    );
    const calls: { url: string; body: string }[] = [];
    const f = async (url: string, init: RequestInit) => {
      calls.push({ url, body: String(init.body ?? "") });
      const json =
        init.method === "GET" ? { id: "sub_9", customer: "cus_9", status: "trialing", items: { data: [{ id: "si_1" }] } } : { id: "sub_9" };
      return new Response(JSON.stringify(json), { status: 200 });
    };
    const cfg = {
      secret: "sk_test_example",
      webhook: "whsec_example",
      prices: { monthly: "price_m", annual: "price_a" },
      coachPrices: { coach: { monthly: "price_cm", annual: "price_ca" } },
      live: false,
    };
    expect(await moveWebSub(cfg, "coach", "coach", "annual", f, NOW)).toBe(true);
    const post = new URLSearchParams(calls[1]!.body);
    expect(calls[1]!.url).toMatch(/\/subscriptions\/sub_9$/);
    expect(post.get("items[0][id]")).toBe("si_1");
    expect(post.get("items[0][price]")).toBe("price_ca");
    expect(post.get("trial_end")).toBe("now");
    expect(post.get("proration_behavior")).toBe("always_invoice");
    expect(await moveWebSub(cfg, "nobody", "coach", "annual", f, NOW)).toBe(false);
  });
});
