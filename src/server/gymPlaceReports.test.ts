import { beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import { decidePlace, mergedPath, mergedTarget, placeIdFrom, placeReportCount, reportedPlaces, reportPlace } from "./gymPlaceReports";
import { joinPlace, placeById, placesFromOsm, savePlaces } from "./gymPlaces";
import { reportPageHtml } from "./gymReportPage";

// Reporting a problem with a real gym's page (docs/decisions/gyms.md "Reporting a gym page").
const NOW = 1_800_000_000_000;
let a = "";
let b = "";
const slugOf = async (id: string) => (await query("SELECT city_slug, slug FROM gym_places WHERE id = ?", [id]))[0]!;

beforeEach(async () => {
  await resetDb();
  await savePlaces(
    placesFromOsm(
      [
        { type: "node", id: 1, lat: 49.1, lon: -122.6, tags: { leisure: "fitness_centre", name: "Iron Works" } },
        { type: "node", id: 2, lat: 49.1001, lon: -122.6001, tags: { leisure: "fitness_centre", name: "Iron Works Gym" } },
      ],
      { city: "Langley", region: "BC", country: "CA" },
    ),
    NOW,
  );
  const rows = await query("SELECT id, name FROM gym_places ORDER BY name");
  a = String(rows[0]!.id);
  b = String(rows[1]!.id);
});

describe("reporting a gym's page", () => {
  it("keeps one open report per person, and never hides the page by itself", async () => {
    expect(await reportPlace("ip:1", a, "closed", "  Shut in  June ", NOW)).toEqual({ ok: true });
    expect(await reportPlace("ip:1", a, "wrong", "Hours wrong", NOW + 1)).toEqual({ ok: true });
    for (const who of ["ip:2", "ip:3", "ip:4"]) await reportPlace(who, a, "notGym", "", NOW);
    const [r] = await reportedPlaces();
    expect(r!.id).toBe(a);
    expect(r!.reports).toBe(4);
    expect(r!.lines.find((l) => l.note)).toEqual({ reason: "wrong", note: "Hours wrong", at: NOW + 1 });
    expect(await placeById(a)).not.toBeNull();
    expect(await placeReportCount()).toEqual({ count: 1, last: NOW + 1 });
  });

  it("refuses an unknown reason, a missing gym, and too many reports a day", async () => {
    expect(await reportPlace("ip:1", a, "spam", "", NOW)).toEqual({ ok: false, error: "reason" });
    expect(await reportPlace("ip:1", "0123456789abcdef", "closed", "", NOW)).toEqual({ ok: false, error: "gone" });
    await run("UPDATE gym_places SET hidden = 1 WHERE id = ?", [b]);
    expect(await reportPlace("ip:1", b, "closed", "", NOW)).toEqual({ ok: false, error: "gone" });
    for (let i = 0; i < 9; i++) await reportPlace("ip:9", a, "other", String(i), NOW);
    expect((await reportPlace("ip:9", a, "other", "", NOW)).ok).toBe(true);
    expect(await reportPlace("ip:9", a, "other", "", NOW)).toEqual({ ok: false, error: "slow" });
  });
});

describe("staff deciding", () => {
  it("dismiss closes the reports and changes nothing", async () => {
    await reportPlace("ip:1", a, "closed", "", NOW);
    expect(await decidePlace("staff@x", a, "dismiss", {}, NOW)).toEqual({ ok: true });
    expect(await reportedPlaces()).toEqual([]);
    expect(await placeById(a)).not.toBeNull();
  });

  it("hide takes the page down", async () => {
    await reportPlace("ip:1", a, "notGym", "", NOW);
    expect((await decidePlace("staff@x", a, "hide", {}, NOW)).ok).toBe(true);
    expect(await placeById(a)).toBeNull();
    expect(await reportedPlaces()).toEqual([]);
  });

  it("edit fixes the details but keeps the page address", async () => {
    await reportPlace("ip:1", a, "wrong", "", NOW);
    const before = await slugOf(a);
    expect(await decidePlace("staff@x", a, "edit", { name: "", phone: "1" }, NOW)).toEqual({ ok: false, error: "A gym needs a name." });
    expect((await decidePlace("staff@x", a, "edit", { website: "iron.example" }, NOW)).ok).toBe(false);
    expect(await decidePlace("staff@x", a, "edit", { name: "Iron Works Langley", address: "1 Main St", kind: "studio" }, NOW)).toEqual({
      ok: true,
    });
    const p = (await placeById(a))!;
    expect([p.name, p.address, p.kind]).toEqual(["Iron Works Langley", "1 Main St", "studio"]);
    expect(await slugOf(a)).toEqual(before);
    expect(await reportedPlaces()).toEqual([]);
  });

  it("merge moves the lifters, hides the duplicate and sends its page and app link to the kept gym", async () => {
    await joinPlace("acc:1", b, NOW);
    await joinPlace("acc:2", b, NOW);
    await joinPlace("acc:1", a, NOW);
    await reportPlace("ip:1", b, "duplicate", "Same as Iron Works", NOW);
    const kept = await slugOf(a);
    const old = await slugOf(b);
    expect((await decidePlace("staff@x", b, "merge", { into: "/gyms/nowhere/at-all/" }, NOW)).ok).toBe(false);
    expect((await decidePlace("staff@x", b, "merge", { into: b }, NOW)).ok).toBe(false);
    const into = `https://www.getliftsmith.com/gyms/${String(kept.city_slug)}/${String(kept.slug)}/`;
    expect(await decidePlace("staff@x", b, "merge", { into }, NOW)).toEqual({ ok: true });
    expect((await placeById(a))!.lifters).toBe(2);
    expect(await placeById(b)).toBeNull();
    expect(await mergedTarget(b)).toBe(a);
    expect(await mergedTarget(a)).toBeNull();
    expect(await mergedPath(String(old.city_slug), String(old.slug))).toBe(`/gyms/${String(kept.city_slug)}/${String(kept.slug)}/`);
    expect(await reportedPlaces()).toEqual([]);
  });

  it("won't merge away a claimed gym", async () => {
    await run("UPDATE gym_places SET claimed_by = 'acc-owner' WHERE id = ?", [b]);
    expect((await decidePlace("staff@x", b, "merge", { into: a }, NOW)).ok).toBe(false);
    expect(await placeById(b)).not.toBeNull();
  });

  it("delete removes a non-gym for good, and no import brings it back", async () => {
    await joinPlace("acc:1", a, NOW);
    await reportPlace("ip:1", a, "notGym", "A knife shop", NOW);
    const ref = String((await query("SELECT source_ref FROM gym_places WHERE id = ?", [a]))[0]!.source_ref);
    expect(await decidePlace("staff@x", a, "delete", {}, NOW)).toEqual({ ok: true });
    expect(await query("SELECT id FROM gym_places WHERE id = ?", [a])).toEqual([]);
    expect(await query("SELECT * FROM gym_place_lifters WHERE place_id = ?", [a])).toEqual([]);
    expect(await query("SELECT name, deleted_by FROM gym_places_deleted WHERE source_ref = ?", [ref])).toEqual([
      { name: "Iron Works", deleted_by: "staff@x" },
    ]);
    expect(await reportedPlaces()).toEqual([]);
    // The same map gym comes in again on a re-import or the daily refresh: it stays deleted, the other one is kept.
    const r = await savePlaces(
      placesFromOsm(
        [
          { type: "node", id: 1, lat: 49.1, lon: -122.6, tags: { leisure: "fitness_centre", name: "Iron Works" } },
          { type: "node", id: 2, lat: 49.1001, lon: -122.6001, tags: { leisure: "fitness_centre", name: "Iron Works Gym" } },
        ],
        { city: "Langley", region: "BC", country: "CA" },
      ),
      NOW + 1,
    );
    expect(r.added).toBe(0);
    expect((await query("SELECT id FROM gym_places")).map((x) => String(x.id))).toEqual([b]);
    expect(await decidePlace("staff@x", a, "delete", {}, NOW)).toEqual({ ok: false, error: "That gym is gone." });
  });

  it("won't delete a claimed gym", async () => {
    await run("UPDATE gym_places SET claimed_by = 'acc-owner' WHERE id = ?", [b]);
    expect((await decidePlace("staff@x", b, "delete", {}, NOW)).ok).toBe(false);
    expect(await placeById(b)).not.toBeNull();
  });

  it("reads a gym from its id or its page address", async () => {
    const s = await slugOf(a);
    expect(await placeIdFrom(a)).toBe(a);
    expect(await placeIdFrom(`/gyms/${String(s.city_slug)}/${String(s.slug)}/`)).toBe(a);
    expect(await placeIdFrom("nothing")).toBeNull();
  });
});

describe("the website's report form", () => {
  it("is a script-free form that posts back to the gym's report address, in the reader's language", () => {
    const html = reportPageHtml({ name: "Iron Works", citySlug: "langley-bc", slug: "iron-works" }, "fr");
    expect(html).toContain('action="/gyms/langley-bc/iron-works/report/"');
    expect(html).toContain('value="duplicate"');
    expect(html).toContain("Signaler un problème");
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).not.toMatch(/<script(?![^>]*application\/ld\+json)/);
    expect(reportPageHtml({ name: "Iron Works", citySlug: "langley-bc", slug: "iron-works" }, "en", "sent")).toContain("Thanks.");
  });
});
