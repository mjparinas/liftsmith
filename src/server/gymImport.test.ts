import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import { IMPORT_LIMITS, importArea, importKey, lastImported, OVERPASS, overpassQuery, recentImports, serverOrder } from "./gymImport";
import type { OsmElement } from "./gymPlaces";

const NOW = 1_800_000_000_000;
const OSM: OsmElement[] = [
  { type: "way", id: 1, center: { lat: 49.11734, lon: -122.67041 }, tags: { leisure: "fitness_centre", name: "Steve Nash Fitness World" } },
  { type: "node", id: 2, lat: 49.1025, lon: -122.6579, tags: { leisure: "fitness_centre", name: "Planet Fitness", opening_hours: "24/7" } },
  { type: "node", id: 3, lat: 49.1148, lon: -122.6694, tags: { leisure: "fitness_centre", name: "Club Pilates", sport: "pilates" } },
  { type: "node", id: 5, lat: 49.11, lon: -122.66, tags: { leisure: "fitness_centre" } },
];
const LANGLEY = [
  { osm_type: "relation", osm_id: 2_000_000, name: "Langley", address: { city: "Langley", state: "British Columbia", country_code: "ca" } },
];

/** A fake web: Nominatim answers with `hits`, each Overpass server with what `servers` says (by host). */
function fakeWeb(servers: Record<string, () => Response | Promise<Response>>, hits: unknown[] = LANGLEY) {
  const calls: string[] = [];
  const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    calls.push(u);
    if (u.includes("nominatim")) return Response.json(hits);
    const answer = servers[new URL(u).host];
    if (!answer) return Response.json({ elements: OSM });
    // Honour the time limit the way fetch does.
    return await new Promise<Response>((ok, no) => {
      init?.signal?.addEventListener("abort", () => no(Object.assign(new Error("timed out"), { name: "TimeoutError" })));
      void Promise.resolve(answer()).then(ok, no);
    });
  }) as typeof fetch;
  return { fetcher, calls };
}

const saved = { ...IMPORT_LIMITS };
beforeEach(async () => {
  await resetDb();
});
afterEach(() => {
  Object.assign(IMPORT_LIMITS, saved);
});

describe("importing a city", () => {
  it("imports an area by name, trying the next map server when one is busy", async () => {
    const { fetcher, calls } = fakeWeb({ "overpass-api.de": () => new Response("busy", { status: 504 }) });
    const r = await importArea("Langley, BC", fetcher, NOW);
    expect(r).toMatchObject({ ok: true, area: "Langley, BC", found: 3, added: 3, updated: 0, unchanged: 0, server: "maps.mail.ru" });
    expect(calls).toHaveLength(3);
    expect(r.log.join("\n")).toMatch(/overpass-api\.de HTTP 504 \(server busy\)/);
    expect(await importArea("  ", fetcher, NOW)).toMatchObject({ ok: false, error: "where" });
    const none = fakeWeb({}, []);
    expect(await importArea("Nowhere", none.fetcher, NOW)).toMatchObject({ ok: false, error: "where" });
  });

  it("uses the province's code whatever language its name comes back in", async () => {
    const { fetcher } = fakeWeb({}, [
      {
        osm_type: "relation",
        osm_id: 2_000_001,
        name: "Abbotsford",
        address: { city: "Abbotsford", state: "Colombie-Britannique", "ISO3166-2-lvl4": "CA-BC", country_code: "ca" },
      },
    ]);
    expect(await importArea("Abbotsford", fetcher, NOW)).toMatchObject({ ok: true, area: "Abbotsford, BC" });
  });

  it("gives up on a server that hangs and moves to the next, instead of waiting minutes", async () => {
    IMPORT_LIMITS.serverMs = 50;
    const hang = () => new Promise<Response>(() => undefined);
    const { fetcher } = fakeWeb({ "overpass-api.de": hang });
    const started = Date.now();
    const r = await importArea("Langley, BC", fetcher, NOW);
    expect(r).toMatchObject({ ok: true, server: "maps.mail.ru" });
    expect(Date.now() - started).toBeLessThan(2_000);
    expect(r.log.join("\n")).toMatch(/overpass-api\.de no answer in 0\.1s/);
  });

  it("treats an Overpass error hidden in a normal answer as a failure, not as a city with no gyms", async () => {
    const remark = () => Response.json({ elements: [], remark: 'runtime error: Query timed out in "query" at line 1 after 91 seconds.' });
    const { fetcher } = fakeWeb({ "overpass-api.de": remark, "maps.mail.ru": remark, "overpass.private.coffee": remark });
    const r = await importArea("Langley, BC", fetcher, NOW);
    expect(r).toMatchObject({ ok: false, error: "map" });
    expect(!r.ok && r.detail).toMatch(/overpass-api\.de: error: runtime error/);
    expect(await query("SELECT COUNT(*) AS n FROM gym_places")).toEqual([{ n: 0 }]);
  });

  it("remembers the area, so a re-import skips Nominatim and writes nothing that didn't change", async () => {
    const first = fakeWeb({});
    await importArea("Langley, BC", first.fetcher, NOW);
    const again = fakeWeb({});
    const r = await importArea("  langley ,  bc ", again.fetcher, NOW + 1);
    expect(r).toMatchObject({ ok: true, added: 0, updated: 0, unchanged: 3 });
    expect(again.calls.some((u) => u.includes("nominatim"))).toBe(false);
    expect(r.log.join("\n")).toMatch(/skipped Nominatim/);
    const fresh = fakeWeb({});
    await importArea("Langley, BC", fresh.fetcher, NOW + 2, { fresh: true });
    expect(fresh.calls.some((u) => u.includes("nominatim"))).toBe(true);
  });

  it("keeps a row with the log for every import, failed ones included, for 90 days", async () => {
    const down = () => new Response("nope", { status: 429 });
    const bad = fakeWeb({ "overpass-api.de": down, "maps.mail.ru": down, "overpass.private.coffee": down });
    await importArea("Langley, BC", bad.fetcher, NOW);
    await importArea("Langley, BC", fakeWeb({}).fetcher, NOW + 1000);
    const rows = await recentImports();
    expect(rows.map((r) => r.ok)).toEqual([true, false]);
    expect(rows[1]).toMatchObject({ query: "langley, bc", area: "Langley, BC" });
    expect(rows[1]!.error).toMatch(/429 \(too many requests\)/);
    expect(rows[0]!.log).toMatch(/database read/);
    expect(await lastImported(["Langley, BC", "Surrey, BC"])).toEqual({ "langley, bc": NOW + 1000 });
    await importArea("Surrey, BC", fakeWeb({}).fetcher, NOW + IMPORT_LIMITS.keepMs + 2000);
    expect((await recentImports()).map((r) => r.query)).toEqual(["surrey, bc"]);
  });

  it("starts parallel imports on different servers", async () => {
    expect(serverOrder(0)).toEqual(OVERPASS);
    expect(serverOrder(1)[0]).toBe(OVERPASS[1]);
    expect(serverOrder(4)[0]).toBe(OVERPASS[1]);
    const { fetcher, calls } = fakeWeb({});
    await importArea("Langley, BC", fetcher, NOW, { server: 2 });
    expect(calls.filter((u) => !u.includes("nominatim"))).toEqual([OVERPASS[2]]);
  });

  it("asks Overpass to give up before our own time limit", () => {
    const q = overpassQuery({ osmType: "relation", osmId: 5, bbox: [], area: { city: "X", region: "", country: "" } });
    expect(q).toMatch(/^\[out:json\]\[timeout:90\];area\(3600000005\)/);
    expect(IMPORT_LIMITS.overpassTimeout * 1000).toBeLessThan(IMPORT_LIMITS.serverMs);
    expect(importKey("  St. John's ,NL ")).toBe("st. john's, nl");
  });
});

it("never leaves a claimed gym changed after a re-import", async () => {
  await importArea("Langley, BC", fakeWeb({}).fetcher, NOW);
  await run("UPDATE gym_places SET claimed_by = 'acc-owner', name = 'Planet Fitness Langley' WHERE source_ref = 'osm:node/2'");
  const r = await importArea("Langley, BC", fakeWeb({}).fetcher, NOW + 1);
  expect(r).toMatchObject({ ok: true, kept: 1 });
  expect(await query("SELECT name FROM gym_places WHERE source_ref = 'osm:node/2'")).toEqual([{ name: "Planet Fitness Langley" }]);
});
