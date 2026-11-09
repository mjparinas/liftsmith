import { beforeEach, describe, expect, it } from "vitest";
import { query, resetDb } from "./db";
import { authorized, kindOf, storeRcEvent, type RcEvent } from "./revenuecat";

const NOW = Date.UTC(2026, 10, 9);
const DAY = 86_400_000;
const ev = (over: Partial<RcEvent>): RcEvent => ({
  id: "e1", type: "INITIAL_PURCHASE", app_user_id: "install-aaaa-1", product_id: "pro:annual", period_type: "NORMAL", event_timestamp_ms: NOW,
  expiration_at_ms: NOW + 365 * DAY, store: "PLAY_STORE", environment: "PRODUCTION", price: 39.99, price_in_purchased_currency: 39.99, currency: "USD",
  country_code: "US", original_transaction_id: "GPA.1", ...over,
});

beforeEach(async () => {
  await resetDb();
});

describe("RevenueCat webhook", () => {
  it("checks the shared secret", () => {
    expect(authorized("s3cret", "s3cret")).toBe(true);
    expect(authorized("Bearer s3cret", "s3cret")).toBe(true);
    expect(authorized("nope", "s3cret")).toBe(false);
    expect(authorized(null, "s3cret")).toBe(false);
    expect(authorized("s3cret", undefined)).toBe(false);
  });

  it("maps store events to the Revenue tab's kinds", () => {
    expect(kindOf(ev({ period_type: "TRIAL" }))).toEqual({ kind: "trial_start" });
    expect(kindOf(ev({}))).toEqual({ kind: "purchase" });
    expect(kindOf(ev({ type: "RENEWAL", is_trial_conversion: true }))).toEqual({ kind: "trial_convert" });
    expect(kindOf(ev({ type: "RENEWAL" }))).toEqual({ kind: "renew" });
    expect(kindOf(ev({ type: "CANCELLATION", cancel_reason: "BILLING_ERROR" }))).toEqual({ kind: "cancel", reason: "billing" });
    expect(kindOf(ev({ type: "CANCELLATION", cancel_reason: "UNSUBSCRIBE" }))).toEqual({ kind: "cancel", reason: "unsubscribe" });
    expect(kindOf(ev({ type: "CANCELLATION", cancel_reason: "CUSTOMER_SUPPORT" }))).toEqual({ kind: "refund" });
    expect(kindOf(ev({ type: "EXPIRATION", expiration_reason: "BILLING_ERROR" }))).toEqual({ kind: "expire", reason: "billing" });
    expect(kindOf(ev({ type: "TEST" }))).toBeNull();
  });

  it("stores each event once, with prices in micros, and keeps the install's entitlement current", async () => {
    await storeRcEvent(ev({ period_type: "TRIAL", price: 0, price_in_purchased_currency: 0, expiration_at_ms: NOW + 14 * DAY }), NOW);
    await storeRcEvent(ev({ period_type: "TRIAL", price: 0, price_in_purchased_currency: 0 }), NOW); // a retried delivery
    await storeRcEvent(ev({ id: "e2", type: "RENEWAL", is_trial_conversion: true, event_timestamp_ms: NOW + 14 * DAY }), NOW + 14 * DAY);
    const rows = await query("SELECT * FROM subscription_events ORDER BY at");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ kind: "trial_start", install_id: "install-aaaa-1", subscription: "GPA.1", store: "play", plan: "annual", usd_micros: null, source: "store" });
    expect(rows[1]).toMatchObject({ kind: "trial_convert", usd_micros: 39_990_000, price_micros: 39_990_000, currency: "USD", country: "US" });
    const [e] = await query("SELECT * FROM entitlements");
    expect(e).toMatchObject({ app_user_id: "install-aaaa-1", active: 1, plan: "annual", store: "play" });
  });

  it("ends the entitlement on expiry, and leaves sandbox purchases and family shares out of revenue", async () => {
    await storeRcEvent(ev({ environment: "SANDBOX" }), NOW);
    expect(await query("SELECT * FROM subscription_events")).toHaveLength(0);
    await storeRcEvent(ev({ id: "f1", app_user_id: "install-bbbb-2", is_family_share: true }), NOW);
    const [fam] = await query("SELECT * FROM subscription_events");
    expect(fam).toMatchObject({ kind: "purchase", usd_micros: null });
    await storeRcEvent(ev({ id: "x1", type: "EXPIRATION", app_user_id: "install-bbbb-2", expiration_at_ms: NOW, event_timestamp_ms: NOW + DAY }), NOW + DAY);
    const [e] = await query("SELECT active, family FROM entitlements WHERE app_user_id = ?", ["install-bbbb-2"]);
    expect(e).toMatchObject({ active: 0 });
  });
});
