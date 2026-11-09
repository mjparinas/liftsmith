import { beforeEach, describe, expect, it } from "vitest";
import { batch, query, resetDb, run } from "./db";
import { checkCreator, claimCode, claimFromStore, findCreator, loadCreators, recordPayout, saveCreator } from "./creators";
import { storeRcEvent } from "./revenuecat";

const NOW = Date.UTC(2026, 10, 9);
const DAY = 86_400_000;
const add = (code: string, name: string, active = true) => saveCreator({ code, name, contact: null, rate: 0.3, months: 12, active, note: null }, NOW);

beforeEach(async () => {
  await resetDb();
});

describe("creator codes on the server", () => {
  it("checks the admin form", () => {
    expect(checkCreator({ code: "lift-alex", name: "Alex" })).toMatchObject({ ok: true, creator: { code: "LIFT-ALEX", rate: 0.3, months: 12, active: true } });
    expect(checkCreator({ code: "x", name: "Alex" }).ok).toBe(false);
    expect(checkCreator({ code: "LIFT-ALEX", name: "" }).ok).toBe(false);
    expect(checkCreator({ code: "LIFT-ALEX", name: "A", rate: 30 }).ok).toBe(false);
    expect(checkCreator({ code: "LIFT-ALEX", name: "A", months: 0 }).ok).toBe(false);
  });

  it("claims a live code for an install, and refuses unknown or paused ones", async () => {
    await add("LIFT-ALEX", "Alex");
    await add("LIFT-OLD", "Old", false);
    expect(await claimCode({ installId: "install-0001", code: "lift-alex", source: "typed", platform: "appstore" }, NOW)).toEqual({ ok: true, code: "LIFT-ALEX", name: "Alex" });
    expect(await claimCode({ installId: "install-0001", code: "LIFT-NOPE" })).toMatchObject({ ok: false, status: 404 });
    expect(await claimCode({ installId: "install-0001", code: "LIFT-OLD" })).toMatchObject({ ok: false, status: 404 });
    expect(await claimCode({ installId: "bad", code: "LIFT-ALEX" })).toMatchObject({ ok: false, status: 400 });
    expect(await findCreator("LIFT-OLD")).toBeNull();
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
    await run("INSERT INTO subscription_events (id, at, install_id, store, kind) VALUES ('t1', ?, 'install-0002', 'play', 'trial_start')", [NOW]);
    expect(await claimCode({ installId: "install-0002", code: "LIFT-ALEX" }, NOW)).toEqual({ ok: true, code: "LIFT-SAM", name: "Sam" });
    expect((await query("SELECT code FROM creator_installs"))[0].code).toBe("LIFT-SAM");
  });

  it("picks the code up from the RevenueCat webhook when the app's claim never arrived", async () => {
    await add("LIFT-ALEX", "Alex");
    await storeRcEvent({ id: "rc1", type: "INITIAL_PURCHASE", app_user_id: "install-0003", product_id: "pro:annual", period_type: "TRIAL", event_timestamp_ms: NOW, store: "PLAY_STORE", environment: "PRODUCTION", subscriber_attributes: { creator_code: { value: "LIFT-ALEX" } } }, NOW);
    expect(await query("SELECT code, source FROM creator_installs WHERE install_id = 'install-0003'")).toEqual([{ code: "LIFT-ALEX", source: "store" }]);
    // An app claim already there wins.
    await claimCode({ installId: "install-0004", code: "LIFT-ALEX", source: "link" }, NOW);
    await claimFromStore("install-0004", "LIFT-NOPE", NOW);
    expect((await query("SELECT code, source FROM creator_installs WHERE install_id = 'install-0004'"))[0]).toEqual({ code: "LIFT-ALEX", source: "link" });
  });

  it("loads what each creator is owed, leaving test installs out, and records payouts", async () => {
    await add("LIFT-ALEX", "Alex");
    await claimCode({ installId: "install-0005", code: "LIFT-ALEX" }, NOW - 100 * DAY);
    await claimCode({ installId: "install-test", code: "LIFT-ALEX" }, NOW - 100 * DAY);
    await batch([
      { sql: "INSERT INTO installs (id, first_seen, last_seen, platform, test) VALUES ('install-test', 0, 0, 'android', 1)", args: [] },
      { sql: "INSERT INTO subscription_events (id, at, install_id, store, kind, usd_micros) VALUES ('p1', ?, 'install-0005', 'play', 'purchase', 39990000)", args: [NOW - 90 * DAY] },
      { sql: "INSERT INTO subscription_events (id, at, install_id, store, kind, usd_micros) VALUES ('p2', ?, 'install-test', 'play', 'purchase', 39990000)", args: [NOW - 90 * DAY] },
    ]);
    let { rows } = await loadCreators(NOW);
    expect(rows[0]).toMatchObject({ code: "LIFT-ALEX", signups: 1, paying: 1 });
    expect(rows[0].owed).toBeCloseTo(10.2, 2);
    expect(await recordPayout("LIFT-NOPE", 5, "m@x", null, NOW)).toBe(false);
    expect(await recordPayout("LIFT-ALEX", 10.2, "m@x", "Wise 123", NOW)).toBe(true);
    ({ rows } = await loadCreators(NOW));
    expect(rows[0].owed).toBeCloseTo(0, 2);
  });
});
