import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import {
  areaOf,
  describeItem,
  gymsQuery,
  IMPORT_LIMITS,
  importItem,
  importKey,
  locatedOf,
  locateQuery,
  nearestTown,
  newGymsQuery,
  OVERPASS,
  planServers,
  regionItems,
  regionLabel,
  regionsQuery,
  serverHealth,
  SINCE_KEY,
  townsOf,
} from "./gymImport";
import type { OsmElement } from "./gymPlaces";

const NOW = 1_800_000_000_000;
const GYMS: OsmElement[] = [
  {
    type: "way",
    id: 1,
    center: { lat: 49.11734, lon: -122.67041 },
    tags: { leisure: "fitness_centre", name: "Steve Nash Fitness World", "addr:city": "Langley" },
  },
  { type: "node", id: 2, lat: 49.1025, lon: -122.6579, tags: { leisure: "fitness_centre", name: "Planet Fitness", opening_hours: "24/7" } },
  { type: "node", id: 3, lat: 49.1148, lon: -122.6694, tags: { leisure: "fitness_centre", name: "Club Pilates", sport: "pilates" } },
  { type: "node", id: 5, lat: 49.11, lon: -122.66, tags: { leisure: "fitness_centre" } },
];
const TOWNS: OsmElement[] = [
  { type: "town", id: 90, tags: { name: "Langley", place: "city", lat: "49.104", lon: "-122.66" } },
  { type: "town", id: 91, tags: { name: "Murrayville", place: "village", lat: "49.08", lon: "-122.62" } },
];
const REGIONS: OsmElement[] = [
  { type: "region", id: 390_867, tags: { iso: "CA-BC", name: "British Columbia" } },
  { type: "region", id: 224_299, tags: { iso: "CA-AB", name: "Alberta" } },
];

/** A fake map: each Overpass query gets `answer(query)`, unless `servers` says otherwise for that host. */
function fakeMap(
  servers: Record<string, () => Response | Promise<Response>> = {},
  answer = (ql: string): OsmElement[] => defaultAnswer(ql),
) {
  const calls: { host: string; ql: string }[] = [];
  const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
    const u = new URL(String(url));
    const ql = decodeURIComponent(String(init?.body ?? "").replace(/^data=/, ""));
    calls.push({ host: u.host, ql });
    const own = servers[u.host];
    if (!own) return Response.json({ elements: answer(ql) });
    // Honour the time limit the way fetch does.
    return await new Promise<Response>((ok, no) => {
      init?.signal?.addEventListener("abort", () => no(Object.assign(new Error("timed out"), { name: "TimeoutError" })));
      void Promise.resolve(own()).then(ok, no);
    });
  }) as typeof fetch;
  return { fetcher, calls };
}
const defaultAnswer = (ql: string): OsmElement[] => (ql.includes("ISO3166-2") ? REGIONS : [...GYMS, ...TOWNS]);

const BC = "region:CA:390867:BC";
const saved = { ...IMPORT_LIMITS };
beforeEach(async () => {
  await resetDb();
  IMPORT_LIMITS.waitMs = 1;
});
afterEach(() => {
  Object.assign(IMPORT_LIMITS, saved);
});

describe("importing the world, region by region", () => {
  it("splits a country into its regions, each named the way gym pages name it", async () => {
    const { fetcher, calls } = fakeMap();
    const r = await importItem("country:CA", fetcher, NOW);
    expect(r).toMatchObject({ ok: true, found: 0, split: ["region:CA:390867:BC", "region:CA:224299:AB"] });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.ql).toBe(regionsQuery("CA"));
    expect(regionItems("DE", [{ type: "region", id: 7, tags: { iso: "DE-BY", name: "Bayern" } }])).toEqual(["region:DE:7:Bayern"]);
    expect(regionItems("DE", [{ type: "region", id: 7, tags: { iso: "AT-1", name: "Burgenland" } }])).toEqual([]);
  });

  it("imports a country with no regions whole", async () => {
    const { fetcher, calls } = fakeMap({}, (ql) => (ql.includes("ISO3166-2") ? [] : [...GYMS, ...TOWNS]));
    const r = await importItem("country:LU", fetcher, NOW);
    expect(r).toMatchObject({ ok: true, found: 3, added: 3 });
    expect(calls[1]!.ql).toContain(areaOf({ country: "LU" }));
    expect(await query("SELECT DISTINCT country FROM gym_places")).toEqual([{ country: "LU" }]);
  });

  it("imports a region: the map's city when it has one, else the nearest town, keeping everything the map has", async () => {
    const { fetcher, calls } = fakeMap({ "overpass-api.de": () => new Response("busy", { status: 504 }) });
    const r = await importItem(BC, fetcher, NOW);
    expect(r).toMatchObject({ ok: true, area: "BC, CA", found: 3, added: 3, server: "maps.mail.ru" });
    expect(calls[0]!.ql).toBe(gymsQuery(areaOf({ relation: 390_867 })));
    expect(r.log.join("\n")).toMatch(/overpass-api\.de HTTP 504 \(server busy\)/);
    const rows = await query("SELECT name, city, region, country, hours, kind FROM gym_places ORDER BY name");
    expect(rows).toEqual([
      { name: "Club Pilates", city: "Langley", region: "BC", country: "CA", hours: "", kind: "studio" },
      { name: "Planet Fitness", city: "Langley", region: "BC", country: "CA", hours: "24/7", kind: "gym" },
      { name: "Steve Nash Fitness World", city: "Langley", region: "BC", country: "CA", hours: "", kind: "gym" },
    ]);
  });

  it("runs again without writing what didn't change, and never changes a claimed gym", async () => {
    await importItem(BC, fakeMap().fetcher, NOW);
    expect(await importItem(BC, fakeMap().fetcher, NOW + 1)).toMatchObject({ ok: true, added: 0, updated: 0, unchanged: 3 });
    await run("UPDATE gym_places SET claimed_by = 'acc-owner', name = 'Planet Fitness Langley' WHERE source_ref = 'osm:node/2'");
    expect(await importItem(BC, fakeMap().fetcher, NOW + 2)).toMatchObject({ ok: true, kept: 1 });
    expect(await query("SELECT name FROM gym_places WHERE source_ref = 'osm:node/2'")).toEqual([{ name: "Planet Fitness Langley" }]);
  });

  it("never lists a claimed or lifter-added gym twice when the map has it under a new id", async () => {
    await run(
      `INSERT INTO gym_places (id, city_slug, slug, name, city, region, country, lat, lon, source, claimed_by, created_at, updated_at)
       VALUES ('aaaaaaaaaaaaaaaa', 'langley-bc', 'planet-fitness-langley', 'Planet Fitness Langley', 'Langley', 'BC', 'CA', 49.1026, -122.658, 'lifter', 'acc-owner', 1, 1),
              ('bbbbbbbbbbbbbbbb', 'langley-bc', 'steve-nash', 'Steve Nash Fitness World', 'Langley', 'BC', 'CA', 49.1174, -122.6705, 'lifter', '', 1, 1)`,
    );
    const r = await importItem(BC, fakeMap().fetcher, NOW);
    expect(r).toMatchObject({ ok: true, added: 1, kept: 2 });
    const rows = await query("SELECT name, source_ref FROM gym_places ORDER BY name");
    // Linked by the map's id, so the next import finds them at once; the claimed gym's details are untouched.
    expect(rows).toEqual([
      { name: "Club Pilates", source_ref: "osm:node/3" },
      { name: "Planet Fitness Langley", source_ref: "osm:node/2" },
      { name: "Steve Nash Fitness World", source_ref: "osm:way/1" },
    ]);
    expect(await importItem(BC, fakeMap().fetcher, NOW + 1)).toMatchObject({ added: 0, kept: 1 });
  });

  it("keeps a gym's region as it is when the map spells it another way", async () => {
    await importItem("region:DE:7:Bayern", fakeMap().fetcher, NOW);
    await importItem("region:DE:7:Bavaria", fakeMap().fetcher, NOW + 1);
    expect(await query("SELECT DISTINCT region FROM gym_places")).toEqual([{ region: "Bayern" }]);
  });

  it("treats an Overpass error hidden in a normal answer as a failure, not as a region with no gyms", async () => {
    const remark = () => Response.json({ elements: [], remark: 'runtime error: Query timed out in "query" at line 1 after 141 seconds.' });
    const { fetcher } = fakeMap({ "overpass-api.de": remark, "maps.mail.ru": remark, "overpass.private.coffee": remark });
    const r = await importItem(BC, fetcher, NOW);
    expect(r).toMatchObject({ ok: false, error: "map" });
    expect(!r.ok && r.detail).toMatch(/overpass-api\.de: error: runtime error/);
    expect(await query("SELECT COUNT(*) AS n FROM gym_places")).toEqual([{ n: 0 }]);
    expect(await query("SELECT ok, query, area FROM gym_imports")).toEqual([{ ok: 0, query: importKey(BC), area: "BC, CA" }]);
  });

  it("refuses an item it doesn't know", async () => {
    expect(await importItem("Langley, BC", fakeMap().fetcher, NOW)).toMatchObject({ ok: false, error: "where" });
    expect(await importItem("region:CA:x:BC", fakeMap().fetcher, NOW)).toMatchObject({ ok: false, error: "where" });
  });
});

describe("the daily refresh", () => {
  it("adds gyms new on the map anywhere, finding each one's country, region and town", async () => {
    await importItem(BC, fakeMap().fetcher, NOW);
    await run("UPDATE gym_places SET city = 'Langley City' WHERE source_ref = 'osm:node/2'");
    const changed: OsmElement[] = [
      {
        type: "node",
        id: 2,
        lat: 49.1025,
        lon: -122.6579,
        tags: { leisure: "fitness_centre", name: "Planet Fitness", opening_hours: "Mo-Su 05:00-23:00" },
      },
      { type: "node", id: 77, lat: 52.52, lon: 13.405, tags: { leisure: "fitness_centre", name: "Kraftwerk Gym" } },
      { type: "node", id: 78, lat: 0, lon: -30, tags: { leisure: "fitness_centre", name: "Gym at Sea" } },
    ];
    const located: OsmElement[] = [
      { type: "m", id: 1, tags: { i: "0" } },
      { type: "boundary", id: 51_477, tags: { level: "2", cc: "DE", name: "Deutschland" } },
      { type: "boundary", id: 62_422, tags: { level: "4", iso: "DE-BE", name: "Berlin" } },
      { type: "town", id: 240_109_189, tags: { name: "Berlin", place: "city", lat: "52.517", lon: "13.389" } },
      { type: "m", id: 2, tags: { i: "1" } },
    ];
    const { fetcher, calls } = fakeMap({}, (ql) => (ql.includes("newer:") ? changed : located));
    const r = await importItem(`new:${NOW - 86_400_000}`, fetcher, NOW + 1);
    expect(r).toMatchObject({ ok: true, added: 1, updated: 1 });
    expect(calls[0]!.ql).toBe(newGymsQuery(NOW - 86_400_000));
    expect(calls[1]!.ql).toBe(
      locateQuery([
        { lat: 52.52, lon: 13.405 },
        { lat: 0, lon: -30 },
      ]),
    );
    const rows = await query(
      "SELECT name, city, region, country, hours FROM gym_places WHERE source_ref IN ('osm:node/2', 'osm:node/77') ORDER BY name",
    );
    expect(rows).toEqual([
      { name: "Kraftwerk Gym", city: "Berlin", region: "Berlin", country: "DE", hours: "" },
      // A gym already listed keeps its city, region and country; the map's new hours come in.
      { name: "Planet Fitness", city: "Langley City", region: "BC", country: "CA", hours: "Mo-Su 05:00-23:00" },
    ]);
    const [since] = await query("SELECT value FROM admin_settings WHERE key = ?", [SINCE_KEY]);
    // Next time it looks from an hour before this request (the map servers lag the map a little).
    expect(Number(since?.value)).toBeGreaterThan(Date.now() - 2 * 3_600_000);
    expect(describeItem(`new:${Date.UTC(2026, 10, 16, 10)}`)).toBe("new on the map since 2026-11-16 10:00 UTC");
  });
});

describe("where a gym is", () => {
  it("files a gym under the town whose reach covers it, a city reaching further than a village", () => {
    const towns = townsOf(TOWNS);
    expect(towns).toHaveLength(2);
    // 3 km from Langley (a city) and 2.5 km from Murrayville (a village): the city.
    expect(nearestTown(towns, 49.083, -122.65)).toBe("Langley");
    // Right next to the village.
    expect(nearestTown(towns, 49.0801, -122.6201)).toBe("Murrayville");
    // Far from both: simply the nearest.
    expect(nearestTown(towns, 51, -123)).toBe("Langley");
    expect(nearestTown([], 50, -120)).toBe("");
    // A town named with a postcode is never a city.
    expect(townsOf([{ type: "town", id: 1, tags: { name: "80145", place: "town", lat: "1", lon: "1" } }])).toEqual([]);
  });

  it("names regions by their code in Canada, the US and Australia, else by the map's name", () => {
    expect(regionLabel("CA", "CA-BC", "British Columbia")).toBe("BC");
    expect(regionLabel("US", "US-CA", "California")).toBe("CA");
    expect(regionLabel("DE", "DE-BY", "Bayern")).toBe("Bayern");
  });

  it("reads each point's answers after its marker", () => {
    const pts = [
      { lat: 1, lon: 1 },
      { lat: 2, lon: 2 },
    ];
    expect(
      locatedOf(
        [
          { type: "m", id: 1, tags: { i: "1" } },
          { type: "boundary", id: 5, tags: { level: "2", cc2: "us" } },
          { type: "boundary", id: 6, tags: { level: "4", iso: "US-WA", name: "Washington" } },
          { type: "town", id: 7, tags: { name: "Seattle", place: "city", lat: "2", lon: "2" } },
        ],
        pts,
      ),
    ).toEqual([null, { country: "US", region: "WA", city: "Seattle" }]);
  });
});

describe("map servers", () => {
  it("gives up on a server that hangs and moves to the next, instead of waiting minutes", async () => {
    IMPORT_LIMITS.serverMs = 50;
    const hang = () => new Promise<Response>(() => undefined);
    const { fetcher } = fakeMap({ "overpass-api.de": hang });
    const started = Date.now();
    const r = await importItem(BC, fetcher, NOW);
    expect(r).toMatchObject({ ok: true, server: "maps.mail.ru" });
    expect(Date.now() - started).toBeLessThan(2_000);
    expect(r.log.join("\n")).toMatch(/overpass-api\.de no answer in 0\.1s/);
  });

  it("starts parallel imports on different servers", async () => {
    expect(planServers().order).toEqual(OVERPASS);
    expect(planServers({}, 1).order[0]).toBe(OVERPASS[1]);
    expect(planServers({}, 4).order[0]).toBe(OVERPASS[1]);
    const { fetcher, calls } = fakeMap();
    await importItem(BC, fetcher, NOW, { server: 2 });
    expect(calls.map((c) => c.host)).toEqual([new URL(OVERPASS[2]!).host]);
  });

  it("tries the server that answered most lately first, and one that keeps hanging only after a busy round", () => {
    const { order, slow } = planServers({
      "overpass-api.de": { ok: 1, busy: 6, timeout: 0, error: 0 },
      "maps.mail.ru": { ok: 4, busy: 2, timeout: 0, error: 0 },
      "overpass.private.coffee": { ok: 1, busy: 0, timeout: 5, error: 0 },
    });
    expect(order).toEqual([OVERPASS[1], OVERPASS[0], OVERPASS[2]]);
    expect([...slow]).toEqual([OVERPASS[2]]);
    expect(planServers({ "overpass.private.coffee": { ok: 0, busy: 0, timeout: 2, error: 0 } }, 1).order).toEqual([
      OVERPASS[1],
      OVERPASS[0],
      OVERPASS[2],
    ]);
  });

  it("waits and asks a busy server again instead of failing, and remembers how each server did", async () => {
    let tries = 0;
    const busyThenOk = () =>
      ++tries < 2 ? new Response("at capacity", { status: 502 }) : Response.json({ elements: [...GYMS, ...TOWNS] });
    const waits: number[] = [];
    const { fetcher, calls } = fakeMap({
      "overpass-api.de": busyThenOk,
      "maps.mail.ru": () => new Response("busy", { status: 504 }),
      "overpass.private.coffee": () => new Promise<Response>(() => undefined),
    });
    IMPORT_LIMITS.serverMs = 50;
    IMPORT_LIMITS.waitMs = 8_000;
    const first = await importItem(BC, fetcher, NOW, { sleep: async (ms) => void waits.push(ms) });
    expect(first).toMatchObject({ ok: true, server: "overpass-api.de" });
    expect(waits).toEqual([8_000]);
    expect(calls.map((c) => c.host)).toEqual(["overpass-api.de", "maps.mail.ru", "overpass.private.coffee", "overpass-api.de"]);
    expect(first.log.join("\n")).toMatch(/every map server busy; asking again in 8\.0s/);
    expect(await serverHealth(NOW)).toEqual({
      "overpass-api.de": { ok: 1, busy: 1, timeout: 0, error: 0 },
      "maps.mail.ru": { ok: 0, busy: 1, timeout: 0, error: 0 },
      "overpass.private.coffee": { ok: 0, busy: 0, timeout: 1, error: 0 },
    });
    expect(await serverHealth(NOW + IMPORT_LIMITS.healthMs + 1)).toEqual({});
  });

  it("gives up after a few busy rounds, with the last thing each server said", async () => {
    const busy = () => new Response("busy", { status: 504 });
    const { fetcher } = fakeMap({ "overpass-api.de": busy, "maps.mail.ru": busy, "overpass.private.coffee": busy });
    const waits: number[] = [];
    const r = await importItem(BC, fetcher, NOW, { sleep: async (ms) => void waits.push(ms) });
    expect(r).toMatchObject({ ok: false, error: "map" });
    expect(waits).toHaveLength(IMPORT_LIMITS.rounds - 1);
    expect(!r.ok && r.detail.split("; ")).toHaveLength(3);
  });

  it("asks Overpass to give up before our own time limit", () => {
    expect(gymsQuery(areaOf({ relation: 5 }))).toMatch(/^\[out:json\]\[timeout:140\];area\(3600000005\)/);
    expect(IMPORT_LIMITS.overpassTimeout * 1000).toBeLessThan(IMPORT_LIMITS.serverMs);
    expect(importKey("  Region:CA:1:BC ")).toBe("region:ca:1:bc");
  });
});
