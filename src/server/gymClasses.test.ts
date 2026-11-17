import { beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import { releaseGym } from "./gymClaims";
import { classDeletes, classesOf, deleteClass, saveClass } from "./gymClasses";
import { ownerExtras } from "./gymExtras";
import { gymHtml } from "./gymPage";
import { gymIndexable, placeById, placesFromOsm, savePlaces } from "./gymPlaces";

// A gym's weekly class schedule (docs/decisions/gyms.md "Class schedules").
const NOW = 1_800_000_000_000;
let gym = "";
const spin = {
  name: "Spin",
  kind: "cycling",
  days: [1, 3],
  start: "18:00",
  minutes: 45,
  coach: "Sam",
  room: "Studio 2",
  note: "Bring water.",
  off: [],
};

beforeEach(async () => {
  await resetDb();
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

describe("posting classes", () => {
  it("lets the owner add one, which shows on the gym's page in the app and on the website", async () => {
    const r = await saveClass("acc-owner", gym, spin, NOW);
    expect(r).toMatchObject({ ok: true, cls: { name: "Spin", days: [1, 3], start: "18:00", minutes: 45 } });
    const p = (await placeById(gym))!;
    expect(p.classes).toHaveLength(1);
    expect(p.classes[0]).toMatchObject({ name: "Spin", coach: "Sam", room: "Studio 2" });
    expect(gymIndexable(p)).toBe(true);
    const html = gymHtml(p, [], "en");
    expect(html).toContain("Class schedule");
    expect(html).toContain("6:00 PM–6:45 PM");
    expect(html).toContain("Spin");
    expect(html).toContain("with Sam");
    expect(html).toContain("Monday");
    expect(html).toContain("Wednesday");
    // The owner's page sees the same list.
    expect((await ownerExtras("acc-owner", gym))?.classes.map((c) => c.name)).toEqual(["Spin"]);
  });

  it("lets the gym's staff change and remove a class", async () => {
    await run("INSERT INTO gym_staff (place_id, account_id, name, invited_by, created_at) VALUES (?, 'acc-staff', 'Kim', 'acc-owner', ?)", [
      gym,
      NOW,
    ]);
    const r = await saveClass("acc-staff", gym, spin, NOW);
    if (!r.ok) throw new Error(r.error);
    const moved = await saveClass("acc-staff", gym, { ...spin, id: r.cls.id, start: "19:00", off: ["2027-02-01"] }, NOW);
    expect(moved).toMatchObject({ ok: true, cls: { start: "19:00", off: ["2027-02-01"] } });
    expect((await classesOf(gym, NOW))[0]).toMatchObject({ start: "19:00", off: ["2027-02-01"] });
    expect(await deleteClass("acc-staff", gym, r.cls.id)).toBe(true);
    expect(await classesOf(gym, NOW)).toEqual([]);
  });

  it("refuses anyone who doesn't manage the gym, and a gym nobody has claimed", async () => {
    expect(await saveClass("acc-other", gym, spin, NOW)).toEqual({ ok: false, error: "owner" });
    const r = await saveClass("acc-owner", gym, spin, NOW);
    if (!r.ok) throw new Error(r.error);
    expect(await deleteClass("acc-other", gym, r.cls.id)).toBe(false);
    await run("UPDATE gym_places SET claimed_by = '' WHERE id = ?", [gym]);
    expect(await saveClass("acc-owner", gym, spin, NOW)).toEqual({ ok: false, error: "owner" });
    // An unclaimed gym shows no schedule, even one left from before.
    expect((await placeById(gym))!.classes).toEqual([]);
  });

  it("checks the words and refuses a class that isn't one", async () => {
    expect(await saveClass("acc-owner", gym, { ...spin, note: "Book at www.example.com" }, NOW)).toEqual({ ok: false, error: "link" });
    expect(await saveClass("acc-owner", gym, { ...spin, days: [] }, NOW)).toEqual({ ok: false, error: "bad" });
    expect(await saveClass("acc-owner", gym, { ...spin, id: "not-an-id" }, NOW)).toEqual({ ok: false, error: "bad" });
    expect(await saveClass("acc-owner", gym, { ...spin, id: "0123456789abcdef" }, NOW)).toEqual({ ok: false, error: "gone" });
  });

  it("drops dates off once they're past", async () => {
    await saveClass("acc-owner", gym, { ...spin, off: ["2027-01-04", "2027-01-11"] }, NOW);
    expect((await classesOf(gym, Date.parse("2027-01-08T12:00:00Z")))[0]!.off).toEqual(["2027-01-11"]);
  });
});

describe("when the gym or the account goes", () => {
  it("a released gym loses its schedule", async () => {
    await saveClass("acc-owner", gym, spin, NOW);
    expect(await releaseGym("acc-owner", gym, NOW)).toBe(true);
    expect(await query("SELECT id FROM gym_classes")).toEqual([]);
  });

  it("a deleted account's classes stay with the gym without saying who added them", async () => {
    await saveClass("acc-owner", gym, spin, NOW);
    for (const d of classDeletes("acc-owner")) await run(d.sql, d.args);
    expect(await query("SELECT account_id FROM gym_classes")).toEqual([{ account_id: "" }]);
  });
});
