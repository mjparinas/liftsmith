import { beforeEach, describe, expect, it } from "vitest";

import { encodeGym, kitOf } from "@/lib/gymShare";
import { makeTestGym } from "@/test/factories";

import { resetDb, run } from "./db";
import { cityHtml, goneHtml, gymHtml, gymSitemapXml, hoursHtml, indexHtml } from "./gymPage";
import { cities, cityPlaces, placeBySlug, placesFromOsm, savePlaces, sitemapGyms, type OsmElement } from "./gymPlaces";

const NOW = 1_800_000_000_000;
const OSM: OsmElement[] = [
  {
    type: "way",
    id: 1,
    center: { lat: 49.11734, lon: -122.67041 },
    tags: {
      leisure: "fitness_centre",
      name: "Steve Nash <Fitness> World",
      "addr:housenumber": "19925",
      "addr:street": "Willowbrook Drive",
      opening_hours: "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00",
      website: "https://example.com/gym",
    },
  },
  { type: "node", id: 2, lat: 49.1025, lon: -122.6579, tags: { leisure: "fitness_centre", name: "Planet Fitness", opening_hours: "24/7" } },
  { type: "node", id: 3, lat: 49.1148, lon: -122.6694, tags: { leisure: "fitness_centre", name: "Club Pilates", sport: "pilates" } },
];

beforeEach(async () => {
  await resetDb();
  await savePlaces(placesFromOsm(OSM, { city: "Langley", region: "BC", country: "CA" }), NOW);
});

describe("a gym's page", () => {
  it("shows the facts, escapes names, and carries ExerciseGym data", async () => {
    const p = (await placeBySlug("langley-bc", "steve-nash-fitness-world"))!;
    const html = gymHtml(p, await cityPlaces("langley-bc"), "en");
    expect(html).toContain("<title>Steve Nash &#60;Fitness&#62; World in Langley | Liftsmith</title>");
    expect(html).not.toContain("<Fitness>");
    expect(html).toContain("19925 Willowbrook Drive, Langley, BC");
    expect(html).toContain('href="/app/#/gymplace/' + p.id + '"');
    expect(html).toContain("Not claimed yet");
    expect(html).toContain("Be the first Liftsmith lifter to add this gym.");
    expect(html).toContain("Nobody has set up this gym’s equipment yet.");
    expect(html).toContain("Gym details © OpenStreetMap contributors");
    expect(html).toContain("More gyms in Langley");
    expect(html).toContain('href="/gyms/langley-bc/planet-fitness/"');
    // Studios aren't offered as "more gyms".
    expect(html).not.toContain("Club Pilates");
    const ld = JSON.parse(/application\/ld\+json">(.*?)<\/script>/.exec(html)![1]!) as Record<string, unknown>;
    expect(ld).toMatchObject({ "@type": "ExerciseGym", openingHours: ["Mo-Fr 05:00-23:00", "Sa,Su 07:00-20:00"] });
    expect(html).not.toContain('content="noindex"');
    expect(html).not.toMatch(/<script(?! type="application\/ld\+json")/);
  });

  it("shows an official gym's mark, its lifters and its equipment, in the reader's language", async () => {
    await run("UPDATE gym_places SET claimed_by = 'acc-owner', lifters = 12, code = ? WHERE slug = 'planet-fitness'", [
      encodeGym({ ...kitOf(makeTestGym("commercial", "kg")), name: "PF" }),
    ]);
    const p = (await placeBySlug("langley-bc", "planet-fitness"))!;
    const en = gymHtml(p, [], "en");
    expect(en).toContain('class="tick"');
    expect(en).toContain("12 Liftsmith lifters train here");
    expect(en).toContain("Barbell");
    expect(en).toContain("Open 24 hours, every day");
    const fr = gymHtml(p, [], "fr");
    expect(fr).toContain("12 sportifs Liftsmith s’entraînent ici");
    expect(fr).toContain('lang="fr"');
  });

  it("marks a studio's page noindex", async () => {
    const p = (await placeBySlug("langley-bc", "club-pilates"))!;
    expect(gymHtml(p, [], "en")).toContain('content="noindex"');
  });

  it("lays out opening hours by weekday, or as written when it can't read them", () => {
    const html = hoursHtml("Mo-Fr 05:00-23:00; Sa off", "en");
    expect(html).toContain("<dt>Monday</dt><dd>05:00–23:00</dd>");
    expect(html).toContain('<dt>Saturday</dt><dd><span class="muted">Closed</span></dd>');
    expect(hoursHtml("by appointment", "en")).toBe("<p>by appointment</p>");
    expect(hoursHtml("", "en")).toContain("Hours not listed yet.");
  });
});

describe("cities and the sitemap", () => {
  it("lists a city's gyms with studios apart, and every city", async () => {
    const html = cityHtml("langley-bc", await cityPlaces("langley-bc"), "en");
    expect(html).toContain("<h1>Gyms in Langley, BC</h1>");
    expect(html).toContain("2 gyms in Langley, BC");
    expect(html.indexOf("Planet Fitness")).toBeLessThan(html.indexOf("Studios and classes"));
    expect(html.indexOf("Studios and classes")).toBeLessThan(html.indexOf("Club Pilates"));
    const list = await cities();
    expect(list).toMatchObject([{ citySlug: "langley-bc", city: "Langley", region: "BC", gyms: 2 }]);
    expect(indexHtml(list, "en")).toContain('href="/gyms/langley-bc/"');
    expect(goneHtml("en")).toContain('content="noindex"');
  });

  it("puts gyms in the sitemap but not studios or hidden gyms", async () => {
    await run("UPDATE gym_places SET hidden = 1 WHERE slug = 'planet-fitness'");
    const xml = gymSitemapXml(await sitemapGyms());
    expect(xml).toContain("https://www.getliftsmith.com/gyms/langley-bc/steve-nash-fitness-world/");
    expect(xml).not.toContain("planet-fitness");
    expect(xml).not.toContain("club-pilates");
  });
});
