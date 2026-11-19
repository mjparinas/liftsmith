import { beforeEach, describe, expect, it } from "vitest";

import { query, resetDb, run } from "./db";
import { brandOf, chainKey, chainSlug, genericName, matchChain, pickChainSite } from "./gymChainNames";
import { chainHtml, chainsIndexHtml } from "./gymChainPage";
import { CHAIN_LIMITS, chainPage, chains, chainStep, refreshChains, sitemapChains } from "./gymChains";
import { gymHtml } from "./gymPage";
import { forgetKeptLists, placeById, savePlaces, type PlaceDraft } from "./gymPlaces";

const NOW = 1_800_000_000_000;

let ref = 0;
const draft = (over: Partial<PlaceDraft> = {}): PlaceDraft => ({
  ref: `osm:node/${++ref}`,
  name: "Planet Fitness",
  kind: "gym",
  address: `${ref} Main Street`,
  city: "Langley",
  region: "BC",
  country: "CA",
  lat: 49 + ref / 1000,
  lon: -122 - ref / 1000,
  hours: "",
  website: "",
  phone: "",
  postcode: "",
  email: "",
  instagram: "",
  facebook: "",
  wheelchair: "",
  ...over,
});

const idOf = async (name: string, city: string) =>
  String((await query("SELECT id FROM gym_places WHERE name = ? AND city = ?", [name, city]))[0]?.id ?? "");

beforeEach(async () => {
  await resetDb();
  forgetKeptLists();
});

describe("chain names", () => {
  it("folds accents and punctuation into one key and slug", () => {
    expect(chainKey("Éconofitness")).toBe("econofitness");
    expect(chainKey("Gold's Gym")).toBe("gold s gym");
    expect(chainSlug("Planet Fitness")).toBe("planet-fitness");
    expect(chainSlug("24 Hour Fitness")).toBe("24-hour-fitness");
  });

  it("takes the map's brand tag, the first of two, and never a generic one", () => {
    expect(brandOf({ brand: "Anytime Fitness" })).toBe("Anytime Fitness");
    expect(brandOf({ brand: "Anytime Fitness;Snap Fitness" })).toBe("Anytime Fitness");
    expect(brandOf({ "brand:en": "Basic-Fit" })).toBe("Basic-Fit");
    expect(brandOf({ brand: "Fitness Center" })).toBe("");
    expect(brandOf({})).toBe("");
  });

  it("calls names made only of common words generic", () => {
    for (const n of ["Fitness Centre", "Gimnasio Municipal", "Hotel Gym", "24/7 Fitness", "Salle de sport", "Gym"])
      expect(genericName(n), n).toBe(true);
    for (const n of ["Planet Fitness", "Éconofitness", "YMCA", "F45 Training"]) expect(genericName(n), n).toBe(false);
  });

  it("matches a gym to a chain by its whole name or its first words", () => {
    const known = new Map([
      [chainKey("Planet Fitness"), "planet-fitness"],
      [chainKey("F45 Training"), "f45-training"],
    ]);
    expect(matchChain("Planet Fitness", known)).toBe("planet-fitness");
    expect(matchChain("Planet Fitness Langley", known)).toBe("planet-fitness");
    expect(matchChain("PLANET FITNESS - Surrey", known)).toBe("planet-fitness");
    expect(matchChain("F45 Training Kitsilano", known)).toBe("f45-training");
    expect(matchChain("Planet Yoga", known)).toBe("");
    expect(matchChain("Fitness Planet", known)).toBe("");
  });

  it("takes the chain's site from most of its branches, and its logo only from that site", () => {
    const sites = ["https://www.planetfitness.com/gyms/a", "https://www.planetfitness.com/gyms/b", "https://pf-langley.example/"];
    const icons = [
      { id: "own", px: 512, website: "https://pf-langley.example/" },
      { id: "small", px: 64, website: "https://www.planetfitness.com/gyms/a" },
      { id: "big", px: 180, website: "https://www.planetfitness.com/gyms/b" },
    ];
    expect(pickChainSite(sites, icons)).toEqual({ website: "https://www.planetfitness.com/", icon: "big", px: 180 });
    // One branch's site isn't the chain's.
    expect(pickChainSite(["https://one.example/"], [{ id: "x", px: 200, website: "https://one.example/" }])).toEqual({
      website: "",
      icon: "",
      px: 0,
    });
  });
});

describe("chains from the import", () => {
  it("puts branches in the chain the map names, and names others by a known chain's name", async () => {
    await savePlaces(
      [
        draft({ brand: "Planet Fitness", city: "Langley" }),
        draft({ brand: "Planet Fitness", city: "Surrey" }),
        draft({ name: "Planet Fitness Abbotsford", city: "Abbotsford" }),
        draft({ name: "Iron Works", city: "Langley" }),
      ],
      NOW,
    );
    const rows = await query("SELECT name, chain FROM gym_places ORDER BY name");
    expect(rows.map((r) => [r.name, r.chain])).toEqual([
      ["Iron Works", ""],
      ["Planet Fitness", "planet-fitness"],
      ["Planet Fitness", "planet-fitness"],
      ["Planet Fitness Abbotsford", "planet-fitness"],
    ]);
    expect((await query("SELECT slug, name, source FROM gym_chains"))[0]).toEqual({
      slug: "planet-fitness",
      name: "Planet Fitness",
      source: "brand",
    });
  });

  it("never changes a claimed gym, and a later import without the brand keeps the chain", async () => {
    await savePlaces([draft({ ref: "osm:node/900", city: "Langley" }), draft({ ref: "osm:node/901", city: "Surrey" })], NOW);
    await run("UPDATE gym_places SET claimed_by = 'owner' WHERE source_ref = 'osm:node/900'");
    await savePlaces(
      [draft({ ref: "osm:node/900", brand: "Planet Fitness" }), draft({ ref: "osm:node/901", brand: "Planet Fitness" })],
      NOW + 1,
    );
    const by = async (r: string) => String((await query("SELECT chain FROM gym_places WHERE source_ref = ?", [r]))[0]?.chain);
    expect(await by("osm:node/900")).toBe("");
    expect(await by("osm:node/901")).toBe("planet-fitness");
    forgetKeptLists();
    await savePlaces([draft({ ref: "osm:node/901", name: "PF Surrey" })], NOW + 2);
    expect(await by("osm:node/901")).toBe("planet-fitness");
  });

  it("finds chains from names repeated in three cities, never generic ones", async () => {
    await savePlaces(
      [
        ...["Langley", "Surrey", "Burnaby"].map((city) => draft({ name: "Steve Nash Fitness World", city })),
        draft({ name: "Steve Nash Fitness World Express", city: "Delta" }),
        ...["Langley", "Surrey", "Burnaby", "Delta"].map((city) => draft({ name: "Fitness Centre", city })),
        ...["Langley", "Surrey"].map((city) => draft({ name: "Iron Works", city })),
      ],
      NOW,
    );
    const step = await chainStep("", NOW);
    expect(step).toMatchObject({ next: "", found: 1, chained: 4 });
    const rows = await query("SELECT name, city, chain FROM gym_places WHERE chain <> '' ORDER BY city");
    expect(rows.map((r) => r.city)).toEqual(["Burnaby", "Delta", "Langley", "Surrey"]);
    expect(new Set(rows.map((r) => r.chain))).toEqual(new Set(["steve-nash-fitness-world"]));
  });

  it("pages through the gyms a step at a time", async () => {
    const was = CHAIN_LIMITS.step;
    CHAIN_LIMITS.step = 2;
    try {
      await savePlaces(
        ["A", "B", "C"].map((city) => draft({ name: "Iron Works", city })),
        NOW,
      );
      const first = await chainStep("", NOW);
      expect(first.next).not.toBe("");
      expect((await chainStep(first.next, NOW)).next).toBe("");
    } finally {
      CHAIN_LIMITS.step = was;
    }
  });
});

describe("counts, logo and pages", () => {
  const seed = async () => {
    await savePlaces(
      [
        draft({ brand: "Planet Fitness", city: "Langley", website: "https://www.planetfitness.com/gyms/langley" }),
        draft({ brand: "Planet Fitness", city: "Surrey", website: "https://www.planetfitness.com/gyms/surrey" }),
        draft({ brand: "Planet Fitness", city: "Seattle", region: "WA", country: "US" }),
        draft({ name: "Planet Fitness", brand: "Planet Fitness", city: "Delta" }),
      ],
      NOW,
    );
    const langley = await idOf("Planet Fitness", "Langley");
    await run(
      "INSERT INTO gym_photos (id, place_id, kind, image, created_at, px) VALUES ('00000000000000a1', ?, 'icon', x'89504e47', 0, 192)",
      [langley],
    );
    const delta = await idOf("Planet Fitness", "Delta");
    await run("UPDATE gym_places SET claimed_by = 'owner' WHERE id = ?", [delta]);
    return { langley, delta };
  };

  it("counts branches, cities and countries and copies the sharpest icon as the chain's logo", async () => {
    await seed();
    expect(await refreshChains(NOW)).toEqual({ chains: 1, logos: 1 });
    const [c] = await query("SELECT * FROM gym_chains");
    expect(c).toMatchObject({
      places: 4,
      cities: 4,
      countries: 2,
      website: "https://www.planetfitness.com/",
      logo_from: "00000000000000a1",
    });
    const logo = String(c!.logo);
    expect(logo).toMatch(/^[0-9a-f]{16}$/);
    expect((await query("SELECT kind, place_id, px FROM gym_photos WHERE id = ?", [logo]))[0]).toEqual({
      kind: "chain",
      place_id: "chain:planet-fitness",
      px: 192,
    });
    // Nothing changed: nothing written.
    expect(await refreshChains(NOW + 1)).toEqual({ chains: 1, logos: 0 });
    expect(String((await query("SELECT logo FROM gym_chains"))[0]?.logo)).toBe(logo);
  });

  it("shows the chain's logo on unclaimed branches, never on a claimed one", async () => {
    const { delta } = await seed();
    await refreshChains(NOW);
    const logo = String((await query("SELECT logo FROM gym_chains"))[0]?.logo);
    const surrey = await placeById(await idOf("Planet Fitness", "Surrey"));
    expect(surrey?.logo).toBe(logo);
    expect(surrey?.chain).toEqual({ slug: "planet-fitness", name: "Planet Fitness", places: 4 });
    const claimed = await placeById(delta);
    expect(claimed?.logo).toBe("");
    expect(claimed?.chain?.slug).toBe("planet-fitness");
  });

  it("lists every branch on the chain's page, and the chains with enough of them", async () => {
    await seed();
    await refreshChains(NOW);
    const page = await chainPage("planet-fitness");
    expect(page?.branches.map((b) => `${b.country} ${b.city}`)).toEqual(["CA Delta", "CA Langley", "CA Surrey", "US Seattle"]);
    expect(page?.branches.find((b) => b.city === "Delta")?.official).toBe(true);
    expect(await chainPage("nope")).toBeNull();
    expect(await chainPage("../x")).toBeNull();
    expect((await chains()).map((c) => c.slug)).toEqual(["planet-fitness"]);
    expect(await sitemapChains()).toEqual([{ path: "/gym-chains/planet-fitness/", lastModified: NOW }]);

    const html = chainHtml(page!.chain, page!.branches, "en");
    expect(html).toContain("<h1>Planet Fitness locations</h1>");
    expect(html).toContain("4 locations.");
    expect(html).toContain('href="/gyms/langley-bc/planet-fitness/"');
    expect(html).toContain("Canada");
    expect(html).toContain("United States");
    expect(html).not.toContain('name="robots"');
    expect(html).not.toMatch(/<script(?! type="application\/ld\+json")/);
    expect(chainsIndexHtml(await chains(), "fr")).toContain("Chaînes de salles");
  });

  it("keeps a two-branch chain's page out of search, and hides a chain of one", async () => {
    await savePlaces(
      [
        draft({ name: "Iron Works", brand: "Iron Works", city: "A" }),
        draft({ name: "Iron Works", brand: "Iron Works", city: "B" }),
        draft({ name: "Solo Gym", brand: "Solo Gym", city: "C" }),
      ],
      NOW,
    );
    await refreshChains(NOW);
    const page = await chainPage("iron-works");
    expect(chainHtml(page!.chain, page!.branches, "en")).toContain('<meta name="robots" content="noindex">');
    expect(await sitemapChains()).toEqual([]);
    expect(await chainPage("solo-gym")).toBeNull();
    expect((await placeById(await idOf("Solo Gym", "C")))?.chain).toBeNull();
  });

  it("links a branch's own page to the chain", async () => {
    await seed();
    await refreshChains(NOW);
    const p = await placeById(await idOf("Planet Fitness", "Surrey"));
    const html = gymHtml(p!, [], "en");
    expect(html).toContain("Part of Planet Fitness");
    expect(html).toContain('<a href="/gym-chains/planet-fitness/">See all 4 locations</a>');
  });
});
