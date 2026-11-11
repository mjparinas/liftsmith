import { beforeEach, describe, expect, it } from "vitest";

import { accountPro } from "./accounts";
import {
  checkCreator,
  claimCode,
  claimFromStore,
  findCode,
  hasLifetimePro,
  loadCreators,
  recordPayout,
  redeemLifetime,
  saveCreator,
} from "./creators";
import { batch, query, resetDb, run } from "./db";
import { storeRcEvent } from "./revenuecat";

const NOW = Date.UTC(2026, 10, 9);
const DAY = 86_400_000;
const add = (code: string, name: string, active = true) =>
  saveCreator(
    {
      code,
      kind: "creator",
      name,
      contact: null,
      rate: 0.3,
      months: 12,
      active,
      note: null,
      trialDays: 30,
      offering: "creator30",
      endsAt: null,
      maxUses: null,
    },
    NOW,
  );

beforeEach(async () => {
  await resetDb();
});

describe("creator codes on the server", () => {
  it("checks the admin form", () => {
    expect(checkCreator({ code: "lift-alex", name: "Alex" })).toMatchObject({
      ok: true,
      creator: { code: "LIFT-ALEX", rate: 0.3, months: 12, active: true },
    });
    expect(checkCreator({ code: "x", name: "Alex" }).ok).toBe(false);
    expect(checkCreator({ code: "LIFT-ALEX", name: "" }).ok).toBe(false);
    expect(checkCreator({ code: "LIFT-ALEX", name: "A", rate: 30 }).ok).toBe(false);
    expect(checkCreator({ code: "LIFT-ALEX", name: "A", months: 0 }).ok).toBe(false);
  });

  it("claims a live code for an install, and refuses unknown or paused ones", async () => {
    await add("LIFT-ALEX", "Alex");
    await add("LIFT-OLD", "Old", false);
    expect(await claimCode({ installId: "install-0001", code: "lift-alex", source: "typed", platform: "appstore" }, NOW)).toEqual({
      ok: true,
      info: { code: "LIFT-ALEX", kind: "creator", name: "Alex", trialDays: 30, offering: "creator30" },
    });
    expect(await claimCode({ installId: "install-0001", code: "LIFT-NOPE" })).toMatchObject({ ok: false, status: 404 });
    expect(await claimCode({ installId: "install-0001", code: "LIFT-OLD" })).toMatchObject({ ok: false, status: 404 });
    expect(await claimCode({ installId: "bad", code: "LIFT-ALEX" })).toMatchObject({ ok: false, status: 400 });
    expect(await findCode("LIFT-OLD")).toEqual({ ok: false, status: 404 });
    const rows = await query("SELECT * FROM creator_installs");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ code: "LIFT-ALEX", source: "typed" });
  });

  it("lets the code change until a trial starts, then keeps the first one", async () => {
    await add("LIFT-ALEX", "Alex");
    await add("LIFT-SAM", "Sam");
    await claimCode({ installId: "install-0002", code: "LIFT-ALEX" }, NOW);
    await claimCode({ installId: "install-0002", code: "LIFT-SAM" }, NOW);
    expect((await query("SELECT code FROM creator_installs"))[0].code).toBe("LIFT-SAM");
    await run("INSERT INTO subscription_events (id, at, install_id, store, kind) VALUES ('t1', ?, 'install-0002', 'play', 'trial_start')", [
      NOW,
    ]);
    expect(await claimCode({ installId: "install-0002", code: "LIFT-ALEX" }, NOW)).toMatchObject({
      ok: true,
      info: { code: "LIFT-SAM", name: "Sam" },
    });
    expect((await query("SELECT code FROM creator_installs"))[0].code).toBe("LIFT-SAM");
  });

  it("picks the code up from the RevenueCat webhook when the app's claim never arrived", async () => {
    await add("LIFT-ALEX", "Alex");
    await storeRcEvent(
      {
        id: "rc1",
        type: "INITIAL_PURCHASE",
        app_user_id: "install-0003",
        product_id: "pro:annual",
        period_type: "TRIAL",
        event_timestamp_ms: NOW,
        store: "PLAY_STORE",
        environment: "PRODUCTION",
        subscriber_attributes: { creator_code: { value: "LIFT-ALEX" } },
      },
      NOW,
    );
    expect(await query("SELECT code, source FROM creator_installs WHERE install_id = 'install-0003'")).toEqual([
      { code: "LIFT-ALEX", source: "store" },
    ]);
    // An app claim already there wins.
    await claimCode({ installId: "install-0004", code: "LIFT-ALEX", source: "link" }, NOW);
    await claimFromStore("install-0004", "LIFT-NOPE", NOW);
    expect((await query("SELECT code, source FROM creator_installs WHERE install_id = 'install-0004'"))[0]).toEqual({
      code: "LIFT-ALEX",
      source: "link",
    });
  });

  it("checks a promo code: no commission, its own trial or offer, an end date and a limit", () => {
    expect(
      checkCreator({
        kind: "promo",
        code: "summer",
        name: "Summer sale",
        rate: 0.3,
        offering: "promo_half",
        maxUses: "100",
        endsAt: "2026-12-31",
      }),
    ).toMatchObject({
      ok: true,
      creator: {
        code: "SUMMER",
        kind: "promo",
        rate: 0,
        trialDays: null,
        offering: "promo_half",
        maxUses: 100,
        endsAt: Date.parse("2026-12-31"),
      },
    });
    expect(checkCreator({ code: "LIFT-ALEX", name: "Alex" })).toMatchObject({
      creator: { kind: "creator", trialDays: 30, offering: "creator30" },
    });
    expect(checkCreator({ kind: "promo", code: "SUMMER", name: "" }).ok).toBe(false);
    expect(checkCreator({ kind: "promo", code: "SUMMER", name: "S", trialDays: 120 }).ok).toBe(false);
    expect(checkCreator({ kind: "promo", code: "SUMMER", name: "S", offering: "no spaces" }).ok).toBe(false);
    expect(checkCreator({ kind: "promo", code: "SUMMER", name: "S", endsAt: "soon" }).ok).toBe(false);
    expect(checkCreator({ kind: "promo", code: "SUMMER", name: "S", maxUses: 0 }).ok).toBe(false);
  });

  it("gives a promo code's own terms without a name, and stops it once it ends or runs out", async () => {
    const promo = (code: string, over: Record<string, unknown>) => {
      const c = checkCreator({ kind: "promo", code, name: "Internal label", ...over });
      if (!c.ok) throw new Error(c.error);
      return saveCreator(c.creator, NOW);
    };
    await promo("WELCOME", { trialDays: 21, offering: "trial21" });
    await promo("ENDED", { endsAt: NOW - DAY });
    await promo("TWO", { maxUses: 2 });
    expect(await claimCode({ installId: "install-0101", code: "welcome" }, NOW)).toEqual({
      ok: true,
      info: { code: "WELCOME", kind: "promo", name: null, trialDays: 21, offering: "trial21" },
    });
    expect(await claimCode({ installId: "install-0101", code: "ENDED" }, NOW)).toMatchObject({ ok: false, status: 410 });
    expect(await claimCode({ installId: "install-0102", code: "TWO" }, NOW)).toMatchObject({ ok: true });
    expect(await claimCode({ installId: "install-0103", code: "TWO" }, NOW)).toMatchObject({ ok: true });
    expect(await claimCode({ installId: "install-0104", code: "TWO" }, NOW)).toMatchObject({ ok: false, status: 410 });
    // An install that already holds it keeps it, and the store webhook still records a purchase made with it.
    expect(await claimCode({ installId: "install-0103", code: "TWO" }, NOW)).toMatchObject({ ok: true });
    await claimFromStore("install-0105", "ENDED", NOW);
    expect(await query("SELECT code FROM creator_installs WHERE install_id = 'install-0105'")).toEqual([{ code: "ENDED" }]);
    // No commission on our own codes.
    const { rows } = await loadCreators(NOW);
    expect(rows.find((r) => r.code === "WELCOME")).toMatchObject({ kind: "promo", rate: 0, trialDays: 21, offering: "trial21" });
  });

  it("loads what each creator is owed, leaving test installs out, and records payouts", async () => {
    await add("LIFT-ALEX", "Alex");
    await claimCode({ installId: "install-0005", code: "LIFT-ALEX" }, NOW - 100 * DAY);
    await claimCode({ installId: "install-test", code: "LIFT-ALEX" }, NOW - 100 * DAY);
    await batch([
      { sql: "INSERT INTO installs (id, first_seen, last_seen, platform, test) VALUES ('install-test', 0, 0, 'android', 1)", args: [] },
      {
        sql: "INSERT INTO subscription_events (id, at, install_id, store, kind, usd_micros, source) VALUES ('p1', ?, 'install-0005', 'play', 'purchase', 39990000, 'store')",
        args: [NOW - 90 * DAY],
      },
      {
        sql: "INSERT INTO subscription_events (id, at, install_id, store, kind, usd_micros, source) VALUES ('p2', ?, 'install-test', 'play', 'purchase', 39990000, 'store')",
        args: [NOW - 90 * DAY],
      },
    ]);
    let { rows } = await loadCreators(NOW);
    expect(rows[0]).toMatchObject({ code: "LIFT-ALEX", signups: 1, paying: 1 });
    expect(rows[0].owed).toBeCloseTo(10.2, 2);
    expect(await recordPayout("LIFT-NOPE", 5, "m@x", null, NOW)).toBe(false);
    expect(await recordPayout("LIFT-ALEX", 10.2, "m@x", "Wise 123", NOW)).toBe(true);
    ({ rows } = await loadCreators(NOW));
    expect(rows[0].owed).toBeCloseTo(0, 2);
  });

  it("pays commission only on store-verified events, never on the app's own (forgeable) purchase events", async () => {
    await add("LIFT-ALEX", "Alex");
    await claimCode({ installId: "install-0006", code: "LIFT-ALEX" }, NOW - 100 * DAY);
    await run(
      "INSERT INTO subscription_events (id, at, install_id, store, kind, usd_micros, source) VALUES ('fake', ?, 'install-0006', 'play', 'purchase', 999000000, 'app')",
      [NOW - 90 * DAY],
    );
    const { rows } = await loadCreators(NOW);
    expect(rows[0]).toMatchObject({ code: "LIFT-ALEX", signups: 1, paying: 0 });
    expect(rows[0].owed).toBe(0);
  });
});

describe("lifetime Pro codes", () => {
  const addLifetime = (code: string, maxUses: number | null, endsAt: number | null = null) =>
    saveCreator(
      {
        code,
        kind: "lifetime",
        name: "Friends",
        contact: null,
        rate: 0,
        months: 12,
        active: true,
        note: null,
        trialDays: null,
        offering: "creator30",
        endsAt,
        maxUses,
      },
      NOW,
    );

  it("checks the admin form: no commission and no trial, whatever the form says", () => {
    expect(
      checkCreator({ code: "test-lifetime-2", kind: "lifetime", name: "Friends", rate: 0.3, trialDays: 30, maxUses: 3 }),
    ).toMatchObject({
      ok: true,
      creator: { code: "TEST-LIFETIME-2", kind: "lifetime", rate: 0, trialDays: null, maxUses: 3 },
    });
  });

  it("refuses a lifetime code short enough to guess, dashes not counted", () => {
    expect(checkCreator({ code: "pals", kind: "lifetime", name: "Friends" }).ok).toBe(false);
    expect(checkCreator({ code: "FREE-PRO-1", kind: "lifetime", name: "Friends" }).ok).toBe(false);
    expect(checkCreator({ code: "FRIENDS-7Q4K", kind: "lifetime", name: "Friends" }).ok).toBe(true);
    // Other kinds give at most a trial, so short codes stay fine for them.
    expect(checkCreator({ code: "LIFT", kind: "promo", name: "Short" }).ok).toBe(true);
  });

  it("gives the account Pro for good, and the account's Pro reaches every device through sync", async () => {
    await addLifetime("TEST-LIFETIME-1", 3);
    expect(await accountPro("acct-1")).toBe(false);
    expect(await redeemLifetime("acct-1", "test-lifetime-1", NOW)).toEqual({ ok: true, code: "TEST-LIFETIME-1" });
    expect(await hasLifetimePro("acct-1")).toBe(true);
    expect(await accountPro("acct-1")).toBe(true);
    // Again from another device: still fine, and it doesn't spend another use.
    expect(await redeemLifetime("acct-1", "TEST-LIFETIME-1", NOW)).toEqual({ ok: true, code: "TEST-LIFETIME-1" });
    expect((await loadCreators(NOW)).rows[0]).toMatchObject({ code: "TEST-LIFETIME-1", kind: "lifetime", signups: 1, name: "Friends" });
  });

  it("stops at its use limit, counting accounts, and the accounts that got it keep it", async () => {
    await addLifetime("TEST-LIFETIME-1", 3);
    for (const a of ["acct-1", "acct-2", "acct-3"]) expect((await redeemLifetime(a, "TEST-LIFETIME-1", NOW)).ok).toBe(true);
    expect(await redeemLifetime("acct-4", "TEST-LIFETIME-1", NOW)).toMatchObject({ ok: false, status: 410 });
    expect(await hasLifetimePro("acct-4")).toBe(false);
    expect(await redeemLifetime("acct-2", "TEST-LIFETIME-1", NOW)).toEqual({ ok: true, code: "TEST-LIFETIME-1" });
    // Installs typing it don't use it up: only redemptions count.
    await claimCode({ installId: "install-0100", code: "TEST-LIFETIME-1" }, NOW);
    expect((await findCode("TEST-LIFETIME-1", { accountId: "acct-1" })).ok).toBe(true);
    expect((await findCode("TEST-LIFETIME-1")).ok).toBe(false);
  });

  it("never gives more uses than the limit when accounts redeem at the same moment", async () => {
    await addLifetime("TEST-LIFETIME-1", 3);
    const accounts = Array.from({ length: 8 }, (_, i) => `acct-${i}`);
    const results = await Promise.all(accounts.map((a) => redeemLifetime(a, "TEST-LIFETIME-1", NOW)));
    expect(results.filter((r) => r.ok)).toHaveLength(3);
    expect(await query("SELECT * FROM pro_grants WHERE code = 'TEST-LIFETIME-1'")).toHaveLength(3);
  });

  it("answers 404 for unknown or paused codes, 409 for other kinds, 410 once ended", async () => {
    await add("LIFT-ALEX", "Alex");
    await addLifetime("OLD-PRO", null, NOW - DAY);
    expect(await redeemLifetime("acct-1", "NOPE-NOPE", NOW)).toMatchObject({ ok: false, status: 404 });
    expect(await redeemLifetime("acct-1", "LIFT-ALEX", NOW)).toMatchObject({ ok: false, status: 409 });
    expect(await redeemLifetime("acct-1", "OLD-PRO", NOW)).toMatchObject({ ok: false, status: 410 });
    expect(await hasLifetimePro("acct-1")).toBe(false);
  });

  it("one lifetime code per account", async () => {
    await addLifetime("TEST-LIFETIME-1", 3);
    await addLifetime("FRIENDS", null);
    await redeemLifetime("acct-1", "TEST-LIFETIME-1", NOW);
    expect(await redeemLifetime("acct-1", "FRIENDS", NOW)).toMatchObject({ ok: false, status: 409, held: "TEST-LIFETIME-1" });
  });

  it("tells the app it's a lifetime code with no trial", async () => {
    await addLifetime("TEST-LIFETIME-1", 3);
    expect(await findCode("TEST-LIFETIME-1")).toEqual({
      ok: true,
      info: { code: "TEST-LIFETIME-1", kind: "lifetime", name: null, trialDays: null, offering: "creator30" },
    });
  });
});
