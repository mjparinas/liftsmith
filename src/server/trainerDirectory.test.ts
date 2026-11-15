import { beforeEach, describe, expect, it } from "vitest";

import { MSG_LANGS } from "@/lib/messageText";

import { resetDb, run } from "./db";
import { cityHtml } from "./gymPage";
import { cityPlaces } from "./gymPlaces";
import { adultName, cityTrainers, DIRECTORY_MIN, trainerCities } from "./trainerDirectory";
import { directoryEntries, trainerCityHtml, trainerIndexHtml } from "./trainerPage";

// The trainer, coach and physio directory by city (docs/decisions/public-pages-and-seo.md "Trainer directory").
const NOW = Date.UTC(2026, 10, 15);

async function gym(id: string, name: string, citySlug = "toronto-on", hidden = 0) {
  await run(
    `INSERT INTO gym_places (id, city_slug, slug, name, kind, city, region, country, lat, lon, source, hidden, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'gym', ?, 'ON', 'CA', 43.6, -79.4, 'osm', ?, ?, ?)`,
    [id, citySlug, id, name, citySlug === "toronto-on" ? "Toronto" : "Ottawa", hidden, NOW, NOW],
  );
}

async function trainer(
  account: string,
  placeId: string,
  profile: Record<string, unknown>,
  o: { status?: string; role?: string; bio?: string } = {},
) {
  await run("INSERT OR IGNORE INTO sync_records (account_id, key, body, updated_at) VALUES (?, 'profile', ?, ?)", [
    account,
    JSON.stringify(profile),
    NOW,
  ]);
  await run("INSERT INTO gym_trainers (place_id, account_id, code, bio, status, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
    placeId,
    account,
    `${account}-${placeId}`,
    o.bio ?? "",
    o.status ?? "listed",
    NOW,
  ]);
  if (o.role)
    await run("INSERT OR REPLACE INTO coach_prefs (account_id, alerts, role, kind, updated_at) VALUES (?, 1, ?, ?, ?)", [
      account,
      o.role,
      o.role === "physio" ? "physio" : "trainer",
      NOW,
    ]);
}

const adult = (name: string) => ({ name, birthYear: 1988 });

beforeEach(async () => {
  await resetDb();
  await gym("aaaaaaaaaaaaaaa1", "Iron Works");
  await gym("aaaaaaaaaaaaaaa2", "Bay Street Barbell");
  await gym("aaaaaaaaaaaaaaa3", "Closed Gym", "toronto-on", 1);
  await gym("bbbbbbbbbbbbbbb1", "Capital Strength", "ottawa-on");
});

describe("who is listed", () => {
  it("lists only named adults, never under-18s or profiles without a birth year", () => {
    expect(adultName(JSON.stringify(adult("Sam")), NOW)).toBe("Sam");
    expect(adultName(JSON.stringify({ name: "Kid", birthYear: 2010 }), NOW)).toBe("");
    expect(adultName(JSON.stringify({ name: "No year" }), NOW)).toBe("");
    expect(adultName(JSON.stringify({ birthYear: 1980 }), NOW)).toBe("");
    expect(adultName("not json", NOW)).toBe("");
  });

  it("groups each person once with all their gyms in the city, leaving out pending, hidden gyms and minors", async () => {
    await trainer("sam", "aaaaaaaaaaaaaaa1", adult("Sam"), { role: "coach", bio: "Powerlifting coach" });
    await trainer("sam", "aaaaaaaaaaaaaaa2", adult("Sam"));
    await trainer("pat", "aaaaaaaaaaaaaaa2", adult("Pat"), { role: "physio" });
    await trainer("wait", "aaaaaaaaaaaaaaa1", adult("Waiting"), { status: "pending" });
    await trainer("gone", "aaaaaaaaaaaaaaa3", adult("Hidden"));
    await trainer("teen", "aaaaaaaaaaaaaaa1", { name: "Teen", birthYear: 2011 });
    await trainer("lee", "bbbbbbbbbbbbbbb1", adult("Lee"));
    const c = await cityTrainers("toronto-on", NOW);
    expect(c.city).toBe("Toronto");
    expect(c.people.map((p) => [p.name, p.role, p.gyms.map((g) => g.name)])).toEqual([
      ["Sam", "coach", ["Iron Works", "Bay Street Barbell"]],
      ["Pat", "physio", ["Bay Street Barbell"]],
    ]);
    expect((await trainerCities(NOW)).map((x) => [x.citySlug, x.people])).toEqual([
      ["toronto-on", 2],
      ["ottawa-on", 1],
    ]);
    expect(await cityTrainers("../etc", NOW)).toEqual({ city: "", region: "", people: [] });
  });
});

describe("the pages", () => {
  it("draws a city in every language, indexed only with enough people, and the sitemap keeps only those", async () => {
    await trainer("sam", "aaaaaaaaaaaaaaa1", adult("Sam <b>"), { role: "coach" });
    await trainer("pat", "aaaaaaaaaaaaaaa2", adult("Pat"), { role: "physio" });
    await trainer("lee", "bbbbbbbbbbbbbbb1", adult("Lee"));
    const toronto = await cityTrainers("toronto-on", NOW);
    const ottawa = await cityTrainers("ottawa-on", NOW);
    expect(toronto.people.length).toBe(DIRECTORY_MIN);
    for (const lang of MSG_LANGS) {
      const html = trainerCityHtml(lang, "toronto-on", toronto);
      expect(html, lang).not.toMatch(/\{\w+\}|undefined|NaN/);
      expect(html, lang).toContain("Sam &#60;b&#62;");
      expect(html, lang).toContain('href="/gyms/toronto-on/aaaaaaaaaaaaaaa1/"');
      expect(html, lang).toContain('rel="nofollow"');
      expect(html, lang).not.toContain('name="robots" content="noindex"');
      expect(trainerCityHtml(lang, "ottawa-on", ottawa), lang).toContain('name="robots" content="noindex"');
      expect(trainerIndexHtml(lang, []), lang).toContain('name="robots" content="noindex"');
    }
    const entries = directoryEntries(await trainerCities(NOW), NOW).map((e) => e.path);
    expect(entries).toEqual(["/trainers/", "/trainers/toronto-on/"]);
    expect(directoryEntries([], NOW)).toEqual([]);
  });

  it("links a gym city page to its trainers only when someone is listed", async () => {
    const places = await cityPlaces("toronto-on");
    expect(cityHtml("toronto-on", places, "en", 2)).toContain('href="/trainers/toronto-on/"');
    expect(cityHtml("toronto-on", places, "en")).not.toContain("/trainers/toronto-on/");
  });
});
