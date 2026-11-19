import { beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import { countVisit, forgetInsights, gymInsights, visitDeletes } from "./gymInsights";
import { placesFromOsm, savePlaces } from "./gymPlaces";

// Owner insights (docs/decisions/gyms.md "Owner insights"): anonymous visits in, totals for the owner out.
const NOW = 1_800_000_000_000;
const DAY = 86_400_000;
let gym = "";
beforeEach(async () => {
  await resetDb();
  forgetInsights();
  await savePlaces(
    placesFromOsm([{ type: "node", id: 1, lat: 49.1, lon: -122.6, tags: { leisure: "fitness_centre", name: "Iron Works" } }], {
      city: "Langley",
      region: "BC",
      country: "CA",
    }),
    NOW,
  );
  gym = String((await query("SELECT id FROM gym_places"))[0]!.id);
  await run("UPDATE gym_places SET claimed_by = 'acc-owner' WHERE id = ?", [gym]);
});

const visit = (session: string, over: Record<string, unknown> = {}) => ({
  session,
  place: gym,
  day: 1,
  hour: 18,
  at: NOW - DAY,
  minutes: 50,
  gear: ["barbell", "rack"],
  ...over,
});

describe("counting visits", () => {
  it("counts a workout once and keeps who only as a one-way code", async () => {
    expect(await countVisit("acc:lifter-1", visit("sess-0001"), NOW)).toEqual({ ok: true, counted: true });
    expect(await countVisit("acc:lifter-1", visit("sess-0001"), NOW)).toEqual({ ok: true, counted: false });
    const rows = await query("SELECT * FROM gym_visits");
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain("lifter-1");
    expect(JSON.stringify(rows)).not.toContain("sess-0001");
  });

  it("refuses a gym that doesn't exist and malformed visits", async () => {
    expect(await countVisit("acc:a", visit("sess-0002", { place: "ffffffffffffffff" }), NOW)).toEqual({ ok: false, error: "bad" });
    expect(await countVisit("acc:a", visit("sess-0003", { hour: 30 }), NOW)).toEqual({ ok: false, error: "bad" });
  });

  it("clears visits older than ten weeks as new ones come in", async () => {
    await run("INSERT INTO gym_visits (id, place_id, who, date, day, hour, minutes, gear) VALUES ('old', ?, 'x', ?, 1, 9, 30, '')", [
      gym,
      Math.floor(NOW / DAY) - 80,
    ]);
    await countVisit("acc:a", visit("sess-0004"), NOW);
    expect((await query("SELECT id FROM gym_visits")).map((r) => r.id)).not.toContain("old");
  });

  it("takes an account's visits out when the account is deleted", async () => {
    await countVisit("acc:gone", visit("sess-0005"), NOW);
    await countVisit("acc:stays", visit("sess-0006"), NOW);
    for (const d of visitDeletes("gone")) await run(d.sql, d.args);
    expect(await query("SELECT id FROM gym_visits")).toHaveLength(1);
  });
});

describe("the owner's insights", () => {
  it("are only for the gym's owner or staff", async () => {
    expect(await gymInsights("acc-someone", gym, NOW)).toBeNull();
    expect(await gymInsights("acc-owner", gym, NOW)).toMatchObject({ ready: false, lifters: 0 });
  });

  it("show hours and equipment once five lifters trained there", async () => {
    for (let i = 0; i < 4; i++) await countVisit(`acc:l${i}`, visit(`sess-1${i}000`), NOW);
    expect(await gymInsights("acc-owner", gym, NOW)).toMatchObject({ ready: false, lifters: 4, hours: [] });
    forgetInsights();
    await countVisit("install:abcdefgh12", visit("sess-20000"), NOW);
    const ins = (await gymInsights("acc-owner", gym, NOW))!;
    expect(ins).toMatchObject({ ready: true, lifters: 5, workouts: 5, peak: { day: 1, hour: 18 } });
    expect(ins.gear.map((g) => g.equipment)).toEqual(["barbell", "rack"]);
  });
});
