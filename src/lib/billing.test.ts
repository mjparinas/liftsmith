import { afterEach, describe, expect, it } from "vitest";
import { entActive, entFromInfo, hasPro, OFFLINE_GRACE_MS, planOf, setBillingLive, storePro, trialDaysOf, type Entitlement } from "./billing";
import { can } from "./entitlements";

const NOW = Date.UTC(2026, 10, 9);
const DAY = 86_400_000;
const ent = (over: Partial<Entitlement> = {}): Entitlement => ({ active: true, trial: false, plan: "annual", expiresAt: NOW + 30 * DAY, willRenew: true, ...over });

afterEach(() => setBillingLive(false));

describe("Pro from the store", () => {
  it("gives everyone Pro while billing isn't live", () => {
    expect(hasPro(NOW)).toBe(true);
    expect(can("adaptive")).toBe(true);
    expect(can("recoveryMap")).toBe(true);
  });

  it("follows the entitlement once billing is live, keeping the free features free", () => {
    setBillingLive(true, null);
    expect(hasPro(NOW)).toBe(false);
    expect(can("adaptive")).toBe(false);
    expect(can("recoveryMap")).toBe(false);
    setBillingLive(true, ent());
    expect(hasPro(NOW)).toBe(true);
  });

  it("allows a few days past the last expiry seen, for a renewal the phone hasn't heard about offline", () => {
    const e = ent({ expiresAt: NOW });
    expect(entActive(e, NOW + OFFLINE_GRACE_MS - 1)).toBe(true);
    expect(entActive(e, NOW + OFFLINE_GRACE_MS + 1)).toBe(false);
    expect(entActive(ent({ expiresAt: null }), NOW + 400 * DAY)).toBe(true);
    expect(entActive(ent({ active: false }), NOW)).toBe(false);
  });

  it("reads the plan from store product ids", () => {
    expect(planOf("pro_annual")).toBe("annual");
    expect(planOf("pro:annual")).toBe("annual");
    expect(planOf("pro_monthly")).toBe("monthly");
    expect(planOf("pro:monthly")).toBe("monthly");
    expect(planOf("something")).toBeUndefined();
  });

  it("maps RevenueCat's customer info, including a trial and family sharing", () => {
    const info = {
      entitlements: { all: { pro: { isActive: true, willRenew: true, periodType: "TRIAL", expirationDateMillis: NOW + 14 * DAY, store: "PLAY_STORE", productIdentifier: "pro", productPlanIdentifier: "annual", ownershipType: "FAMILY_SHARED" } } },
      managementURL: "https://play.google.com/store/account/subscriptions",
    };
    expect(entFromInfo(info)).toEqual({ active: true, trial: true, plan: "annual", expiresAt: NOW + 14 * DAY, willRenew: true, store: "PLAY_STORE", family: true, manageUrl: info.managementURL });
    expect(entFromInfo({ entitlements: { all: {} } })).toBeNull();
  });

  it("reads free-trial lengths from the intro price, and ignores paid intro offers", () => {
    expect(trialDaysOf({ price: 0, periodUnit: "DAY", periodNumberOfUnits: 14 })).toBe(14);
    expect(trialDaysOf({ price: 0, periodUnit: "WEEK", periodNumberOfUnits: 1 })).toBe(7);
    expect(trialDaysOf({ price: 0.99, periodUnit: "MONTH", periodNumberOfUnits: 1 })).toBeNull();
    expect(trialDaysOf(null)).toBeNull();
  });

  it("tells reminders about a store trial, Pro, or a lapsed plan", () => {
    expect(storePro(NOW, { live: false, ent: ent() })).toBeUndefined();
    expect(storePro(NOW, { live: true, ent: ent({ trial: true, expiresAt: NOW + DAY }) })).toEqual({ state: "trial", endsAt: NOW + DAY });
    expect(storePro(NOW, { live: true, ent: ent() })).toEqual({ state: "pro" });
    expect(storePro(NOW, { live: true, ent: ent({ active: false, expiresAt: NOW - DAY }) })).toEqual({ state: "free", since: NOW - DAY });
  });
});
