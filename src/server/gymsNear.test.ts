import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetDb } from "./db";
import { indexHtml } from "./gymPage";
import { cities, closestPlaces, placesFromOsm, savePlaces, type OsmElement } from "./gymPlaces";
import { closestReply, GYMS_INDEX_CSP, ipSpot } from "./gymsNear";

const NOW = 1_800_000_000_000;
const gym = (id: number, name: string, lat: number, lon: number): OsmElement => ({
  type: "node",
  id,
  lat,
  lon,
  tags: { leisure: "fitness_centre", name },
});
// Twelve gyms in Langley, BC, a step apart going east, one official far away in Vancouver, and a studio next door.
const LANGLEY: OsmElement[] = Array.from({ length: 12 }, (_, i) => gym(i + 1, `Gym ${i + 1}`, 49.1, -122.66 + i * 0.01));
const HERE = { lat: 49.1, lon: -122.665 };

beforeEach(async () => {
  await resetDb();
  await savePlaces(
    placesFromOsm(
      [
        ...LANGLEY,
        { type: "node", id: 50, lat: 49.1, lon: -122.664, tags: { leisure: "fitness_centre", name: "Yoga Loft", sport: "yoga" } },
      ],
      { city: "Langley", region: "BC", country: "CA" },
    ),
    NOW,
  );
  await savePlaces(placesFromOsm([gym(99, "Far Gym", 49.28, -123.12)], { city: "Vancouver", region: "BC", country: "CA" }), NOW);
});

describe("the gyms closest to a spot", () => {
  it("gives the ten nearest gyms, nearest first, without studios", async () => {
    const found = (await closestPlaces(HERE.lat, HERE.lon))!;
    expect(found).toHaveLength(10);
    expect(found.map((p) => p.name).slice(0, 3)).toEqual(["Gym 1", "Gym 2", "Gym 3"]);
    expect(found.every((p, i) => i === 0 || p.km >= found[i - 1]!.km)).toBe(true);
    expect(found.map((p) => p.name)).not.toContain("Yoga Loft");
  });

  it("widens the search when there are fewer than ten nearby", async () => {
    // From Vancouver: Far Gym is close, the Langley gyms are 35 to 45 km away, past the first ring.
    const found = (await closestPlaces(49.28, -123.12))!;
    expect(found[0]!.name).toBe("Far Gym");
    expect(found).toHaveLength(10);
    expect(found[1]!.km).toBeGreaterThan(15);
  });

  it("refuses a spot that isn't on the map", async () => {
    expect(await closestPlaces(120, 0)).toBeNull();
    expect(await closestPlaces("49", -122)).toBeNull();
  });
});

describe("where the visitor is", () => {
  it("reads Vercel's guess from the address, city included", () => {
    expect(
      ipSpot(new Headers({ "x-vercel-ip-latitude": "49.1", "x-vercel-ip-longitude": "-122.66", "x-vercel-ip-city": "Langley%20City" })),
    ).toEqual({ lat: 49.1, lon: -122.66, from: "ip", city: "Langley City" });
  });

  it("has no spot without both numbers, or with junk", () => {
    expect(ipSpot(new Headers())).toBeNull();
    expect(ipSpot(new Headers({ "x-vercel-ip-latitude": "49.1" }))).toBeNull();
    expect(ipSpot(new Headers({ "x-vercel-ip-latitude": "abc", "x-vercel-ip-longitude": "1" }))).toBeNull();
    expect(ipSpot(new Headers({ "x-vercel-ip-latitude": "95", "x-vercel-ip-longitude": "1" }))).toBeNull();
    // A broken city name is left out, not a crash.
    expect(ipSpot(new Headers({ "x-vercel-ip-latitude": "1", "x-vercel-ip-longitude": "1", "x-vercel-ip-city": "%E0" }))).toEqual({
      lat: 1,
      lon: 1,
      from: "ip",
    });
  });

  it("answers with the spot rounded to about 1 km and each gym's page", async () => {
    const places = (await closestPlaces(HERE.lat, HERE.lon))!;
    const out = closestReply({ lat: 49.123456, lon: -122.654321, from: "device" }, places);
    expect(out.here).toEqual({ lat: 49.12, lon: -122.65, from: "device" });
    expect(out.gyms[0]).toMatchObject({ name: "Gym 1", where: "Langley", path: "/gyms/langley-bc/gym-1/", official: false });
    expect(closestReply(null, [])).toEqual({ here: null, gyms: [] });
  });
});

describe("the /gyms/ page", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("leads with the map of the closest gyms and keeps every city link in the folded directory", async () => {
    vi.stubEnv("MAPBOX_TOKEN", "pk.test");
    const html = indexHtml(await cities(), "en");
    expect(html.indexOf('id="near"')).toBeLessThan(html.indexOf('id="directory"'));
    expect(html).toContain('<section class="card near" id="near" hidden');
    expect(html).toContain('id="near-map"');
    expect(html).toContain("<summary>Show full directory (2 cities)</summary>");
    // Crawlable: the city links are in the page itself, not loaded by the script.
    expect(html).toContain('href="/gyms/langley-bc/"');
    expect(html).toContain('href="/gyms/vancouver-bc/"');
    // Scripts only from our own origin; the words ride along as data, never as script.
    expect(html).toContain('<script src="/vendor/leaflet/leaflet.js" defer></script><script src="/gyms-near.js" defer></script>');
    const text = JSON.parse(/id="near-text">(.*?)<\/script>/.exec(html)![1]!) as Record<string, string>;
    expect(text.fromIpCity).toBe("Around {city}, going by your internet connection. Use your location for the closest ones.");
    expect(GYMS_INDEX_CSP).toContain("script-src 'self';");
    expect(GYMS_INDEX_CSP).not.toContain("unsafe-eval");
  });

  it("leaves the map out without a Mapbox token but still lists the closest gyms", async () => {
    const html = indexHtml(await cities(), "de");
    expect(html).not.toContain('id="near-map"');
    expect(html).toContain('id="near-list"');
    expect(html).toContain("Studios in deiner Nähe");
  });
});
