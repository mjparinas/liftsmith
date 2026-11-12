import { beforeEach, describe, expect, it } from "vitest";

import { decodeGym, encodeGym, kitOf } from "@/lib/gymShare";
import { makeTestGym } from "@/test/factories";

import { deleteAccount } from "./accounts";
import { query, resetDb } from "./db";
import {
  added,
  addressKey,
  cell,
  distanceKm,
  LIMITS,
  mine,
  nearby,
  openGymReportCount,
  publish,
  report,
  reportedGyms,
  resolveGym,
  unpublish,
} from "./gymDirectory";

const NOW = 1_800_000_000_000;
// Downtown Vancouver, and a gym about 3 km east of it.
const HERE = { lat: 49.2827, lon: -123.1207 };
const EAST = { lat: 49.2827, lon: -123.08 };
const code = (name = "Iron Works") => encodeGym({ ...kitOf(makeTestGym("commercial", "kg")), name });
const list = (account: string, over: Record<string, unknown> = {}) =>
  publish(account, { localId: "g1", code: code(), name: "Iron Works", ...EAST, ...over }, NOW);

beforeEach(async () => {
  await resetDb();
});

describe("listing a gym", () => {
  it("keeps only a position rounded to about 1 km", async () => {
    const r = await list("acc-a", { lat: 49.28274, lon: -123.08123 });
    expect(r.ok).toBe(true);
    const [row] = await query("SELECT lat, lon FROM public_gyms");
    expect([row!.lat, row!.lon]).toEqual([49.28, -123.08]);
    expect(cell(49.28749)).toBe(49.29);
  });

  it("updates the same gym instead of listing it twice", async () => {
    const a = await list("acc-a");
    const b = await list("acc-a", { name: "Iron Works East" });
    expect(a).toEqual(b);
    expect(await mine("acc-a")).toMatchObject([{ localId: "g1", name: "Iron Works East", hidden: false }]);
  });

  it("refuses names with links or slurs, bad codes and bad positions", async () => {
    expect(await list("acc-a", { name: "Join www.spam.com" })).toEqual({ ok: false, error: "link" });
    expect(await list("acc-a", { code: "garbage" })).toEqual({ ok: false, error: "code" });
    expect(await list("acc-a", { lat: 120 })).toEqual({ ok: false, error: "place" });
    expect(await list("acc-a", { localId: "../x" })).toEqual({ ok: false, error: "code" });
  });

  it("stops at five gyms an account", async () => {
    for (let i = 0; i < LIMITS.perAccount; i++) expect((await list("acc-a", { localId: `g${i}` })).ok).toBe(true);
    expect(await list("acc-a", { localId: "g-extra" })).toEqual({ ok: false, error: "full" });
  });

  it("stores the code as the server read it, under the checked name", async () => {
    await list("acc-a", { name: "  Iron   Works  " });
    const [row] = await query("SELECT code FROM public_gyms");
    expect(decodeGym(String(row!.code))!.name).toBe("Iron Works");
  });

  it("unlists a gym, and account deletion removes every listing", async () => {
    await list("acc-a");
    await unpublish("acc-a", "g1");
    expect(await mine("acc-a")).toEqual([]);
    await list("acc-a");
    await deleteAccount("acc-a");
    expect(await query("SELECT * FROM public_gyms")).toEqual([]);
  });
});

describe("finding gyms", () => {
  it("finds listed gyms nearby, nearest first, and none far away", async () => {
    await list("acc-a");
    await publish("acc-b", { localId: "x", code: code("Far gym"), name: "Far gym", lat: 49.5, lon: -123.12 }, NOW);
    const found = await nearby(HERE.lat, HERE.lon);
    expect(found).toHaveLength(1);
    expect(found![0]).toMatchObject({ name: "Iron Works", unit: "kg", adds: 0 });
    expect(found![0]!.km).toBe(3);
    expect(distanceKm(HERE, EAST)).toBeCloseTo(2.97, 1);
    expect(await nearby("49", -123)).toBeNull();
  });

  it("counts an add once per lifter", async () => {
    const r = await list("acc-a");
    const id = r.ok ? r.id : "";
    await added("acc:acc-b", id, NOW);
    await added("acc:acc-b", id, NOW);
    await added(addressKey("10.0.0.1"), id, NOW);
    expect((await nearby(HERE.lat, HERE.lon))![0]!.adds).toBe(2);
  });

  it("hides a gym after three reports, until staff dismiss them", async () => {
    const r = await list("acc-a");
    const id = r.ok ? r.id : "";
    expect(await report("acc:b", id, "nonsense")).toBe(false);
    await report("acc:b", id, "private");
    await report("acc:b", id, "private");
    await report(addressKey("10.0.0.2"), id, "spam");
    expect(await nearby(HERE.lat, HERE.lon)).toHaveLength(1);
    await report("acc:c", id, "wrong");
    expect(await nearby(HERE.lat, HERE.lon)).toEqual([]);
    expect(await openGymReportCount()).toBe(1);
    expect(await reportedGyms()).toMatchObject([{ id, reports: 3, hidden: true, reasons: { private: 1, spam: 1, wrong: 1 } }]);
    await resolveGym(id, "dismiss");
    expect(await nearby(HERE.lat, HERE.lon)).toHaveLength(1);
    expect(await reportedGyms()).toEqual([]);
    await report("acc:d", id, "offensive");
    await resolveGym(id, "remove");
    expect(await nearby(HERE.lat, HERE.lon)).toEqual([]);
  });

  it("keeps no address, only a one-way key", () => {
    expect(addressKey("10.0.0.1")).toMatch(/^ip:[0-9a-f]{24}$/);
    expect(addressKey("10.0.0.1")).not.toContain("10.0.0.1");
  });
});
