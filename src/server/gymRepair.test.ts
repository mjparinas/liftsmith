import { beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import { movedGym } from "./gymPlaces";
import { neighbourCity, repairCount, repairStep } from "./gymRepair";

const NOW = 1_800_000_000_000;
let n = 0;
async function gym(over: {
  name: string;
  city: string;
  region?: string;
  lat?: number;
  lon?: number;
  address?: string;
  claimed?: boolean;
  slug?: string;
}) {
  const id = (++n).toString(16).padStart(16, "0");
  const city = over.city;
  const region = over.region ?? "ON";
  const citySlug = `${city || "gyms"}${region ? `-${region}` : ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  await run(
    `INSERT INTO gym_places (id, city_slug, slug, name, address, city, region, country, lat, lon, source, source_ref, claimed_by, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'CA', ?, ?, 'osm', ?, ?, ?, ?)`,
    [
      id,
      citySlug,
      over.slug ?? over.name.toLowerCase().replace(/\s+/g, "-"),
      over.name,
      over.address ?? "",
      city,
      region,
      over.lat ?? 43.65,
      over.lon ?? -79.38,
      `osm:node/${n}`,
      over.claimed ? "owner" : "",
      NOW,
      NOW,
    ],
  );
  return id;
}

const never = (() => {
  throw new Error("no lookups expected");
}) as unknown as typeof fetch;

beforeEach(async () => {
  await resetDb();
  n = 0;
});

describe("fixing city names", () => {
  it("takes the city most gyms nearby are filed under, moves the page and tidies the address", async () => {
    await gym({ name: "North Gym", city: "Toronto" });
    await gym({ name: "South Gym", city: "Toronto", lat: 43.66 });
    const bad = await gym({ name: "Iron Den", city: "1", address: "55 King St W,, Toronto," });
    expect(await repairCount()).toBe(1);
    const r = await repairStep("", never, NOW + 1);
    expect(r).toMatchObject({ checked: 3, cities: 1, addresses: 1, moved: 1, unsure: 0, next: "" });
    const [p] = await query("SELECT city, city_slug, slug, address FROM gym_places WHERE id = ?", [bad]);
    expect(p).toMatchObject({ city: "Toronto", city_slug: "toronto-on", slug: "iron-den", address: "55 King St W" });
    expect(await movedGym("1-on", "iron-den")).toBe("/gyms/toronto-on/iron-den/");
    expect(await repairCount()).toBe(0);
  });

  it("asks the map for a gym with no neighbours, and fixes pages filed under /gyms/gyms/", async () => {
    const lonely = await gym({ name: "DIY Gym24", city: "", region: "", lat: 60, lon: -100 });
    const asked: string[] = [];
    const map = (async (url: string) => {
      asked.push(url);
      return Response.json({ name: "Thompson", address: { city: "Thompson", state: "Manitoba" } });
    }) as unknown as typeof fetch;
    const r = await repairStep("", map, NOW + 1, async () => undefined);
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain("/reverse?");
    expect(r).toMatchObject({ cities: 1, moved: 1 });
    const [p] = await query("SELECT city, city_slug FROM gym_places WHERE id = ?", [lonely]);
    expect(p).toMatchObject({ city: "Thompson", city_slug: "thompson" });
    expect(await movedGym("gyms", "diy-gym24")).toBe("/gyms/thompson/diy-gym24/");
  });

  it("uses the name inside the value, and leaves claimed gyms alone", async () => {
    const napoli = await gym({ name: "Palestra", city: "80145 Napoli", region: "Campania", lat: 40.85, lon: 14.25 });
    const claimed = await gym({ name: "Owned", city: "6337", claimed: true });
    await repairStep("", never, NOW + 1);
    const [a] = await query("SELECT city, city_slug FROM gym_places WHERE id = ?", [napoli]);
    expect(a).toMatchObject({ city: "Napoli", city_slug: "napoli-campania" });
    const [b] = await query("SELECT city FROM gym_places WHERE id = ?", [claimed]);
    expect(b).toMatchObject({ city: "6337" });
  });

  it("only trusts neighbours that agree", async () => {
    await gym({ name: "A", city: "Toronto" });
    await gym({ name: "B", city: "Mississauga" });
    expect(await neighbourCity({ id: "x", lat: 43.65, lon: -79.38, country: "CA" })).toBeNull();
    await gym({ name: "C", city: "Toronto" });
    expect(await neighbourCity({ id: "x", lat: 43.65, lon: -79.38, country: "CA" })).toMatchObject({ city: "Toronto" });
  });
});
