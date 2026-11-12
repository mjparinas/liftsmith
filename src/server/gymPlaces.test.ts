import { beforeEach, describe, expect, it } from "vitest";

import { encodeGym, kitOf } from "@/lib/gymShare";
import { makeTestGym } from "@/test/factories";

import { deleteAccount } from "./accounts";
import { query, resetDb, run } from "./db";
import { nearby, publish } from "./gymDirectory";
import {
  actOnPlace,
  ADMIN_PAGE,
  adminPlaces,
  importArea,
  joinPlace,
  nearbyPlaces,
  placesFromOsm,
  savePlaces,
  slugify,
  type OsmElement,
} from "./gymPlaces";

const NOW = 1_800_000_000_000;
const AREA = { city: "Langley", region: "BC", country: "CA" };
// Real gyms in Langley, BC, as OpenStreetMap has them (trimmed).
const OSM: OsmElement[] = [
  {
    type: "way",
    id: 1,
    center: { lat: 49.11734, lon: -122.67041 },
    tags: { leisure: "fitness_centre", name: "Steve Nash Fitness World", "addr:housenumber": "19925", "addr:street": "Willowbrook Drive" },
  },
  { type: "node", id: 2, lat: 49.1025, lon: -122.6579, tags: { leisure: "fitness_centre", name: "Planet Fitness", opening_hours: "24/7" } },
  { type: "node", id: 3, lat: 49.1148, lon: -122.6694, tags: { leisure: "fitness_centre", name: "Club Pilates", sport: "pilates" } },
  {
    type: "node",
    id: 4,
    lat: 49.17,
    lon: -122.57,
    tags: { leisure: "fitness_centre", name: "Athlete Training Centre", access: "private" },
  },
  { type: "node", id: 5, lat: 49.11, lon: -122.66, tags: { leisure: "fitness_centre" } },
  {
    type: "node",
    id: 6,
    lat: 49.4206,
    lon: -122.5759,
    tags: { leisure: "fitness_centre", name: "Snap Fitness", "addr:city": "Maple Ridge", website: "javascript:alert(1)" },
  },
];
// Willowbrook, Langley.
const HERE = { lat: 49.11, lon: -122.67 };
const code = () => encodeGym({ ...kitOf(makeTestGym("commercial", "kg")), name: "Iron Works" });

beforeEach(async () => {
  await resetDb();
});

describe("reading OpenStreetMap", () => {
  it("keeps named public gyms, marks studios, and fills in the city", () => {
    const drafts = placesFromOsm(OSM, AREA);
    expect(drafts.map((d) => d.name)).toEqual(["Steve Nash Fitness World", "Planet Fitness", "Club Pilates", "Snap Fitness"]);
    expect(drafts[0]).toMatchObject({ ref: "osm:way/1", kind: "gym", address: "19925 Willowbrook Drive", city: "Langley", region: "BC" });
    expect(drafts[2]!.kind).toBe("studio");
    expect(drafts[3]).toMatchObject({ city: "Maple Ridge", website: "" });
  });

  it("makes plain web addresses", () => {
    expect(slugify("Steve Nash Fitness World", "Langley")).toBe("steve-nash-fitness-world-langley");
    expect(slugify("Évolution Pilates & Yoga", "Montréal")).toBe("evolution-pilates-and-yoga-montreal");
    expect(slugify("ジム")).toBe("");
  });
});

describe("saving places", () => {
  it("adds once, refreshes on a second import, and gives each a unique address", async () => {
    const drafts = placesFromOsm(OSM, AREA);
    expect(await savePlaces(drafts, NOW)).toEqual({ added: 4, updated: 0 });
    expect(await savePlaces(drafts, NOW)).toEqual({ added: 0, updated: 4 });
    await savePlaces([{ ...drafts[1]!, ref: "osm:node/99" }], NOW);
    const slugs = (await query("SELECT city_slug, slug FROM gym_places WHERE name = 'Planet Fitness' ORDER BY slug")).map(
      (r) => `${String(r.city_slug)}/${String(r.slug)}`,
    );
    expect(slugs).toEqual(["langley-bc/planet-fitness", "langley-bc/planet-fitness-2"]);
  });

  it("never overwrites a claimed gym", async () => {
    await savePlaces(placesFromOsm(OSM, AREA), NOW);
    await run("UPDATE gym_places SET claimed_by = 'acc-owner', hours = 'Mo-Su 05:00-23:00' WHERE source_ref = 'osm:node/2'");
    await savePlaces(placesFromOsm(OSM, AREA), NOW + 1);
    const [p] = await query("SELECT hours FROM gym_places WHERE source_ref = 'osm:node/2'");
    expect(p!.hours).toBe("Mo-Su 05:00-23:00");
  });
});

describe("finding gyms", () => {
  it("lists official gyms first, then nearest, and leaves studios and far gyms out", async () => {
    await savePlaces(placesFromOsm(OSM, AREA), NOW);
    let found = await nearbyPlaces(HERE.lat, HERE.lon);
    expect(found!.map((p) => p.name)).toEqual(["Steve Nash Fitness World", "Planet Fitness"]);
    await run("UPDATE gym_places SET claimed_by = 'acc-owner' WHERE name = 'Planet Fitness'");
    found = await nearbyPlaces(HERE.lat, HERE.lon);
    expect(found!.map((p) => [p.name, p.official])).toEqual([
      ["Planet Fitness", true],
      ["Steve Nash Fitness World", false],
    ]);
    expect((await nearbyPlaces(HERE.lat, HERE.lon, { studios: true }))!.map((p) => p.name)).toContain("Club Pilates");
    expect(await nearbyPlaces(120, 0)).toBeNull();
  });

  it("offers the setup lifters listed for a gym, and shows that setup under the gym instead of on its own", async () => {
    await savePlaces(placesFromOsm(OSM, AREA), NOW);
    const [gym] = (await nearbyPlaces(HERE.lat, HERE.lon))!;
    expect(gym!.code).toBe("");
    await publish("acc-a", { localId: "g1", code: code(), name: "Iron Works", ...HERE, placeId: gym!.id }, NOW);
    await publish("acc-b", { localId: "g1", code: code(), name: "Other gym", ...HERE }, NOW);
    expect((await nearbyPlaces(HERE.lat, HERE.lon))![0]!.code).toBeTruthy();
    expect((await nearby(HERE.lat, HERE.lon))!.map((l) => l.name)).toEqual(["Other gym"]);
  });

  it("ignores a made-up gym id on a listing", async () => {
    await publish("acc-a", { localId: "g1", code: code(), name: "Iron Works", ...HERE, placeId: "0123456789abcdef" }, NOW);
    const [row] = await query("SELECT place_id FROM public_gyms");
    expect(row!.place_id).toBe("");
  });

  it("counts each lifter who adds a gym once, and forgets a deleted account", async () => {
    await savePlaces(placesFromOsm(OSM, AREA), NOW);
    const [gym] = (await nearbyPlaces(HERE.lat, HERE.lon))!;
    await joinPlace("acc:a", gym!.id, NOW);
    await joinPlace("acc:a", gym!.id, NOW);
    await joinPlace("ip:x", gym!.id, NOW);
    await joinPlace("acc:a", "nope", NOW);
    expect((await nearbyPlaces(HERE.lat, HERE.lon))![0]!.lifters).toBe(2);
    await deleteAccount("a", async () => null);
    expect((await nearbyPlaces(HERE.lat, HERE.lon))![0]!.lifters).toBe(1);
  });
});

describe("staff", () => {
  it("hides, re-marks and deletes gyms", async () => {
    await savePlaces(placesFromOsm(OSM, AREA), NOW);
    const { places, total } = await adminPlaces("");
    expect(total).toBe(4);
    const planet = places.find((p) => p.name === "Planet Fitness")!;
    expect(await actOnPlace(planet.id, "hide")).toBe(true);
    expect((await nearbyPlaces(HERE.lat, HERE.lon))!.map((p) => p.name)).toEqual(["Steve Nash Fitness World"]);
    const pilates = places.find((p) => p.name === "Club Pilates")!;
    await actOnPlace(pilates.id, "gym");
    expect((await nearbyPlaces(HERE.lat, HERE.lon))!.map((p) => p.name)).toContain("Club Pilates");
    await actOnPlace(pilates.id, "delete");
    expect((await adminPlaces("pilates")).places).toEqual([]);
    expect(await actOnPlace(planet.id, "explode")).toBe(false);
  });

  it("pages the gym list 50 at a time", async () => {
    const many: OsmElement[] = Array.from({ length: 120 }, (_, i) => ({
      type: "node",
      id: 1000 + i,
      lat: 49.1 + i / 10_000,
      lon: -122.6,
      tags: { leisure: "fitness_centre", name: `Gym ${String(i).padStart(3, "0")}` },
    }));
    await savePlaces(placesFromOsm(many, AREA), NOW);
    const first = await adminPlaces("", 1);
    expect(first).toMatchObject({ total: 120, matches: 120, page: 1, pages: 3 });
    expect(first.places).toHaveLength(ADMIN_PAGE);
    const last = await adminPlaces("", 3);
    expect(last.places).toHaveLength(20);
    const all = new Set([...first.places, ...(await adminPlaces("", 2)).places, ...last.places].map((p) => p.id));
    expect(all.size).toBe(120);
    expect((await adminPlaces("", 99)).page).toBe(3);
    expect((await adminPlaces("", "junk")).page).toBe(1);
    expect(await adminPlaces("Gym 11", 1)).toMatchObject({ total: 120, matches: 10, pages: 1 });
    expect(first.places[0]).toMatchObject({ citySlug: "langley-bc", slug: expect.any(String) });
  });

  it("imports an area by name through the map services", async () => {
    const calls: string[] = [];
    const fake = (async (url: string | URL | Request) => {
      const u = String(url);
      calls.push(u);
      if (u.includes("nominatim"))
        return Response.json([
          {
            osm_type: "relation",
            osm_id: 2_000_000,
            name: "Langley",
            address: { city: "Langley", state: "British Columbia", country_code: "ca" },
          },
        ]);
      if (u.includes("overpass-api.de")) return new Response("busy", { status: 504 });
      return Response.json({ elements: OSM });
    }) as typeof fetch;
    const r = await importArea("Langley, BC", fake, NOW);
    expect(r).toEqual({ ok: true, area: "Langley, BC", found: 4, added: 4, updated: 0 });
    expect(calls).toHaveLength(3);
    expect(await importArea("  ", fake, NOW)).toEqual({ ok: false, error: "where" });
    const none = (async () => Response.json([])) as unknown as typeof fetch;
    expect(await importArea("Nowhere", none, NOW)).toEqual({ ok: false, error: "where" });

    // The province's ISO code wins over its name, in whatever language or spelling the name comes back.
    const french = (async (url: string | URL | Request) =>
      String(url).includes("nominatim")
        ? Response.json([
            {
              osm_type: "relation",
              osm_id: 2_000_001,
              name: "Abbotsford",
              address: { city: "Abbotsford", state: "Colombie-Britannique", "ISO3166-2-lvl4": "CA-BC", country_code: "ca" },
            },
          ])
        : Response.json({ elements: [] })) as typeof fetch;
    expect(await importArea("Abbotsford", french, NOW)).toMatchObject({ ok: true, area: "Abbotsford, BC" });
  });
});
