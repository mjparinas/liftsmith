// Real gyms (Melvin, 2026-11-12, docs/decisions/gyms.md). Lifters' own listings (gymDirectory.ts) are setups:
// equipment and weights at about 1 km. These are the gyms themselves: a name, an address, a map position, hours,
// a website. Staff seed a city from OpenStreetMap (ODbL, so pages credit "© OpenStreetMap contributors"); an
// owner who claims one makes it official (a check mark, shown first). A gym offers one setup: its owner's once
// claimed, else the most-added setup lifters listed for it.
//
// These are businesses on a public map, not anything about a lifter, so the position is kept as the map has it.
import { randomBytes } from "node:crypto";

import {
  cleanAmenities,
  cleanPrices,
  currencyFor,
  type Amenity,
  type GymIssue,
  type GymNews,
  type GymTrainer,
  type Prices,
} from "@/lib/gymExtras";
import { SHORT_REGION } from "@/lib/regions";

import { batch, query, rateLimit, run, type Row } from "./db";
import { distanceKm } from "./gymDirectory";
import { issuesOf, newsOf, trainersOf } from "./gymExtras";
import { checkText } from "./moderation";

export const PLACE_LIMITS = {
  /** How far "Find gyms near you" looks, in km. */
  radiusKm: 15,
  /** Gyms one search returns. */
  results: 30,
  /** Places one import may write, so a whole country can't be pulled by mistake. */
  perImport: 5_000,
};

export type PlaceKind = "gym" | "studio";

/** A real gym as the finder shows it. */
export interface Place {
  id: string;
  /** Web address parts: /gyms/<citySlug>/<slug>/ ("langley-bc", "steve-nash-fitness-world"). */
  citySlug: string;
  slug: string;
  name: string;
  kind: PlaceKind;
  address: string;
  city: string;
  region: string;
  lat: number;
  lon: number;
  km: number;
  hours: string;
  website: string;
  phone: string;
  country: string;
  updatedAt: number;
  /** Claimed by its owner. */
  official: boolean;
  /** Lifters who added it. */
  lifters: number;
  /** The setup it offers (gymShare.ts code): the owner's, else the most-added listing's. Empty when nobody set one up. */
  code: string;
  /** Where its details came from, for the map credit. */
  source: "osm" | "staff" | "owner" | "lifter";
  /** The code of the gym's own club and weekly leaderboard (social.ts gymClubStart), '' when it has none. */
  club: string;
  /** Our address for its map picture (gymMedia.ts, Mapbox), '' while Mapbox isn't set up. */
  map: string;
  /** Its logo's and photos' ids (/api/gyms/photo/?id=), added by the owner. Photos only on one gym's own lookups. */
  logo: string;
  photos: string[];
  /** What it has besides equipment, and what a visit costs (the owner's, gymExtras.ts). */
  amenities: Amenity[];
  prices: Prices | null;
  /** One gym's own lookups only (empty in lists): the owner's announcements, open equipment problems, its trainers. */
  news: GymNews[];
  issues: GymIssue[];
  trainers: GymTrainer[];
}

const s = (x: unknown) => (typeof x === "string" ? x : "");
const n = (x: unknown) => (typeof x === "number" ? x : Number(x ?? 0));
const validLat = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= -90 && x <= 90;
const validLon = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x) && x >= -180 && x <= 180;
export const isPlaceId = (x: unknown): x is string => typeof x === "string" && /^[0-9a-f]{16}$/.test(x);

/** "Steve Nash Fitness World", "Langley" → "steve-nash-fitness-world-langley". Accents folded; other scripts dropped. */
export function slugify(...parts: string[]): string {
  return parts
    .join(" ")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

// Places that are about something other than lifting: shown only when asked for, never first.
const STUDIO =
  /gymnast|yoga|pilates|barre|lagree|spin|cycl|dance|aerial|pole|martial|karate|taekwondo|judo|jiu|kickbox|boxing|capoeira|climb|hockey|swim|9round/;

// Rec and community centres: OpenStreetMap tags them sports_centre or community_centre, not fitness_centre, so the
// import asks for those too, and keeps one only when its name or sport says there's a gym inside (an arena or a pool
// alone isn't one).
const REC_NAME = "recreation|rec cent|leisure|fitness|ymca|ywca|wellness|athletic|gym";
const REC = new RegExp(REC_NAME, "i");
const REC_SPORT = /fitness|weightlifting|crossfit|bodybuilding|powerlifting/;

export interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface Area {
  /** The city the import was for, used when a gym has no city of its own. */
  city: string;
  region: string;
  country: string;
}

export interface PlaceDraft {
  ref: string;
  name: string;
  kind: PlaceKind;
  address: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  hours: string;
  website: string;
  phone: string;
}

const clean = (x: string | undefined, max: number) =>
  (x ?? "")
    .replace(/[\u0000-\u001f]/g, " ")
    .trim()
    .slice(0, max);
const httpUrl = (x: string | undefined) => {
  const v = clean(x, 300);
  return /^https?:\/\/[^\s]+$/i.test(v) ? v : "";
};

/** OpenStreetMap fitness centres as places. Unnamed and private ones are left out. */
export function placesFromOsm(elements: OsmElement[], area: Area): PlaceDraft[] {
  const out: PlaceDraft[] = [];
  const seen = new Set<string>();
  for (const e of elements) {
    const t = e.tags ?? {};
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    const name = clean(t.name, 80);
    if (!name || !validLat(lat) || !validLon(lon)) continue;
    if (t.access === "private" || t.access === "no" || t.access === "members_only_staff") continue;
    const ref = `osm:${e.type}/${e.id}`;
    if (seen.has(ref)) continue;
    seen.add(ref);
    const fitness = t.leisure === "fitness_centre";
    if (!fitness && !REC.test(name) && !REC_SPORT.test(t.sport ?? "")) continue;
    const about = `${t.sport ?? ""} ${name}`.toLowerCase();
    out.push({
      ref,
      name,
      // A rec centre's sport tag lists everything it hosts (swimming, hockey), so only its name can make it a studio.
      kind: STUDIO.test(fitness ? about : name.toLowerCase()) ? "studio" : "gym",
      address: clean([t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" "), 120),
      city: clean(t["addr:city"], 60) || area.city,
      region: clean(t["addr:province"] ?? t["addr:state"], 60) || area.region,
      country: clean(t["addr:country"], 2).toUpperCase() || area.country,
      lat: Math.round(lat * 1e5) / 1e5,
      lon: Math.round(lon * 1e5) / 1e5,
      hours: clean(t.opening_hours, 200),
      website: httpUrl(t.website ?? t["contact:website"]),
      phone: clean(t.phone ?? t["contact:phone"], 40),
    });
  }
  return out;
}

/** Writes imported places: new ones are added, unclaimed ones refreshed, claimed ones left as their owner set them. */
export async function savePlaces(drafts: PlaceDraft[], now = Date.now()): Promise<{ added: number; updated: number }> {
  // A big city has thousands of gyms, and each statement is a trip to the database, so read what's there in a few
  // queries and write in batches (one at a time, New York took minutes).
  const list = drafts.slice(0, PLACE_LIMITS.perImport);
  const had = new Map<string, Row>();
  for (const part of chunks(
    list.map((d) => d.ref),
    400,
  )) {
    const rows = await query(
      `SELECT id, claimed_by, source_ref FROM gym_places WHERE source_ref IN (${part.map(() => "?").join(",")})`,
      part,
    );
    for (const r of rows) had.set(s(r.source_ref), r);
  }
  const fresh = list.filter((d) => !had.has(d.ref));
  const taken = new Set<string>();
  for (const part of chunks([...new Set(fresh.map((d) => citySlugOf(d.city, d.region)))], 400)) {
    const rows = await query(`SELECT city_slug, slug FROM gym_places WHERE city_slug IN (${part.map(() => "?").join(",")})`, part);
    for (const r of rows) taken.add(`${s(r.city_slug)}/${s(r.slug)}`);
  }
  const stmts: { sql: string; args: (string | number)[] }[] = [];
  let added = 0;
  let updated = 0;
  for (const d of list) {
    const old = had.get(d.ref);
    if (old) {
      if (s(old.claimed_by)) continue;
      stmts.push({
        sql: `UPDATE gym_places SET name = ?, address = ?, city = ?, region = ?, country = ?, lat = ?, lon = ?, hours = ?,
           website = ?, phone = ?, updated_at = ? WHERE id = ?`,
        args: [d.name, d.address, d.city, d.region, d.country, d.lat, d.lon, d.hours, d.website, d.phone, now, s(old.id)],
      });
      updated++;
      continue;
    }
    const id = randomBytes(8).toString("hex");
    const city = citySlugOf(d.city, d.region);
    const base = slugify(d.name) || id;
    let slug = base;
    for (let i = 2; taken.has(`${city}/${slug}`); i++) slug = i < 50 ? `${base}-${i}` : `${base}-${id}`;
    taken.add(`${city}/${slug}`);
    stmts.push({
      sql: `INSERT OR IGNORE INTO gym_places (id, city_slug, slug, name, kind, address, city, region, country, lat, lon, hours, website, phone,
         source, source_ref, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'osm', ?, ?, ?)`,
      args: [
        id,
        city,
        slug,
        d.name,
        d.kind,
        d.address,
        d.city,
        d.region,
        d.country,
        d.lat,
        d.lon,
        d.hours,
        d.website,
        d.phone,
        d.ref,
        now,
        now,
      ],
    });
    added++;
  }
  for (const part of chunks(stmts, 200)) await batch(part);
  return { added, updated };
}

function chunks<T>(xs: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
}

/** "Langley", "BC" → "langley-bc": a city's page, and the folder its gyms' pages sit in. */
export const citySlugOf = (city: string, region: string) => slugify(city, region) || "gyms";

async function freeSlug(name: string, citySlug: string, id: string): Promise<string> {
  const base = slugify(name) || id;
  for (let i = 1; i < 50; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const [taken] = await query("SELECT 1 AS x FROM gym_places WHERE city_slug = ? AND slug = ?", [citySlug, slug]);
    if (!taken) return slug;
  }
  return `${base}-${id}`;
}

// --- Seeding from OpenStreetMap (staff only) ---

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
// OSM's services ask for an identifying client; this names the app, never a person.
const UA = "Liftsmith gym finder (https://www.getliftsmith.com)";

interface Found {
  osm_type?: string;
  osm_id?: number;
  boundingbox?: string[];
  name?: string;
  address?: Record<string, string>;
}

export type ImportResult =
  { ok: true; area: string; found: number; added: number; updated: number } | { ok: false; error: "where" | "map" };

/** Looks up an area by name ("Langley, BC"), then pulls its fitness centres from OpenStreetMap. */
export async function importArea(where: string, fetcher: typeof fetch = fetch, now = Date.now()): Promise<ImportResult> {
  const q = clean(where, 120);
  if (!q) return { ok: false, error: "where" };
  const geo = await fetcher(`${NOMINATIM}?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  }).catch(() => null);
  const hits = geo?.ok ? ((await geo.json().catch(() => [])) as Found[]) : [];
  const hit = hits[0];
  if (!hit) return { ok: false, error: "where" };
  const a = hit.address ?? {};
  const regionName = a.state ?? a.province ?? "";
  // "CA-BC": the province or state code, whatever language or spelling the name came back in.
  const isoRegion = /^(?:CA|US|AU)-([A-Z]{2,3})$/.exec(a["ISO3166-2-lvl4"] ?? "")?.[1];
  const area: Area = {
    city: clean(a.city ?? a.town ?? a.village ?? a.municipality ?? hit.name, 60),
    region: isoRegion ?? SHORT_REGION[regionName] ?? clean(regionName, 60),
    country: clean(a.country_code, 2).toUpperCase(),
  };
  const filters = [
    `nwr["leisure"="fitness_centre"]`,
    `nwr["leisure"="sports_centre"]["name"]`,
    `nwr["amenity"="community_centre"]["name"~"${REC_NAME}",i]`,
  ];
  let scope: string;
  if (hit.osm_type === "relation" && hit.osm_id)
    scope = `area(${3_600_000_000 + hit.osm_id})->.a;(${filters.map((f) => `${f}(area.a);`).join("")});`;
  else if (hit.boundingbox?.length === 4) {
    const [south, north, west, east] = hit.boundingbox.map(Number);
    scope = `(${filters.map((f) => `${f}(${south},${west},${north},${east});`).join("")});`;
  } else return { ok: false, error: "where" };
  const body = `data=${encodeURIComponent(`[out:json][timeout:180];${scope}out center tags;`)}`;
  for (const url of OVERPASS) {
    const r = await fetcher(url, {
      method: "POST",
      headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }).catch(() => null);
    if (!r?.ok) continue;
    const j = (await r.json().catch(() => null)) as { elements?: OsmElement[] } | null;
    if (!j?.elements) continue;
    const drafts = placesFromOsm(j.elements, area);
    const saved = await savePlaces(drafts, now);
    return { ok: true, area: [area.city, area.region].filter(Boolean).join(", "), found: drafts.length, ...saved };
  }
  return { ok: false, error: "map" };
}

// --- A gym the map doesn't have: a lifter or owner adds it, staff check it ---

export type SuggestResult =
  { ok: true; place: string } | { ok: false; error: "name" | "address" | "where" | "exists" | "slow" | "words" | "link" };

/** Similar names: one folded name inside the other ("planet fitness" and "planet fitness langley"). */
const sameName = (a: string, b: string) => {
  const x = slugify(a);
  const y = slugify(b);
  return !!x && !!y && (x.includes(y) || y.includes(x));
};

/**
 * A signed-in lifter or owner adds a gym OpenStreetMap doesn't have: its name, street address and city. We find it on
 * the map (Nominatim), refuse a duplicate of a gym already within 300 m, and keep it hidden until staff approve it in
 * Admin › Gyms. Five a day per account.
 */
export async function suggestPlace(
  accountId: string,
  body: Record<string, unknown>,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<SuggestResult> {
  const name = clean(s(body.name), 80);
  const address = clean(s(body.address), 120);
  const city = clean(s(body.city), 60);
  if (name.length < 2) return { ok: false, error: "name" };
  if (address.length < 3 || city.length < 2) return { ok: false, error: "address" };
  for (const text of [name, address, city]) {
    const c = checkText(text, 200);
    if (!c.ok) return { ok: false, error: c.error === "empty" ? "name" : c.error };
  }
  if (!(await rateLimit(`gyms:suggest:${accountId}`, 5, 86_400_000, now))) return { ok: false, error: "slow" };
  const look = async (q: string) => {
    const r = await fetcher(`${NOMINATIM}?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(q)}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    }).catch(() => null);
    const hits = r?.ok ? ((await r.json().catch(() => [])) as (Found & { lat?: string; lon?: string })[]) : [];
    return hits[0] ?? null;
  };
  // The street address first; when the map doesn't know it, the city, with the lifter's own rounded position if sent.
  const exact = await look(`${address}, ${city}`);
  const hit = exact ?? (await look(city));
  if (!hit) return { ok: false, error: "where" };
  const near = !exact && validLat(body.lat) && validLon(body.lon) ? { lat: body.lat, lon: body.lon } : null;
  const lat = near?.lat ?? Number(hit.lat);
  const lon = near?.lon ?? Number(hit.lon);
  if (!validLat(lat) || !validLon(lon)) return { ok: false, error: "where" };
  const a = hit.address ?? {};
  const regionName = a.state ?? a.province ?? "";
  const region = /^(?:CA|US|AU)-([A-Z]{2,3})$/.exec(a["ISO3166-2-lvl4"] ?? "")?.[1] ?? SHORT_REGION[regionName] ?? clean(regionName, 60);
  const cityName = clean(a.city ?? a.town ?? a.village ?? a.municipality, 60) || city;
  const d = 0.3 / 111;
  const close = await query("SELECT id, name, lat, lon FROM gym_places WHERE lat BETWEEN ? AND ? AND lon BETWEEN ? AND ? LIMIT 200", [
    lat - d,
    lat + d,
    lon - d * 2,
    lon + d * 2,
  ]);
  const twin = close.find((r) => sameName(s(r.name), name) && distanceKm({ lat, lon }, { lat: n(r.lat), lon: n(r.lon) }) <= 0.3);
  if (twin) return { ok: false, error: "exists" };
  const id = randomBytes(8).toString("hex");
  const citySlug = citySlugOf(cityName, region);
  await run(
    `INSERT INTO gym_places (id, city_slug, slug, name, kind, address, city, region, country, lat, lon, source, added_by, pending, hidden,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'lifter', ?, 1, 1, ?, ?)`,
    [
      id,
      citySlug,
      await freeSlug(name, citySlug, id),
      name,
      STUDIO.test(name.toLowerCase()) ? "studio" : "gym",
      address,
      cityName,
      region,
      clean(a.country_code, 2).toUpperCase(),
      Math.round(lat * 1e5) / 1e5,
      Math.round(lon * 1e5) / 1e5,
      accountId,
      now,
      now,
    ],
  );
  return { ok: true, place: id };
}

/** Gyms lifters added that wait for staff, oldest first. */
export async function pendingPlaces(): Promise<AdminPlace[]> {
  const rows = await query(`${ADMIN_SQL} WHERE p.pending = 1 ORDER BY p.created_at LIMIT 100`);
  return rows.map(toAdmin);
}

export async function pendingPlaceCount(): Promise<{ count: number; oldest: number | null }> {
  const [r] = await query("SELECT COUNT(*) AS n, MIN(created_at) AS oldest FROM gym_places WHERE pending = 1");
  return { count: n(r?.n), oldest: r?.oldest == null ? null : n(r.oldest) };
}

// --- The finder ---

const PLACE_COLUMNS = `p.id, p.city_slug, p.slug, p.name, p.kind, p.address, p.city, p.region, p.country, p.lat, p.lon, p.hours, p.website, p.phone,
  p.source, p.claimed_by, p.lifters, p.code, p.updated_at, p.amenities, p.prices,
  (SELECT g.code FROM public_gyms g WHERE g.place_id = p.id AND g.hidden = 0 ORDER BY g.adds DESC, g.updated_at DESC LIMIT 1) AS listed,
  (SELECT c.code FROM clubs c WHERE c.place_id = p.id) AS club,
  (SELECT m.id FROM gym_photos m WHERE m.place_id = p.id AND m.kind = 'logo' LIMIT 1) AS logo`;

const toPlace = (r: Row, km: number): Place => ({
  id: s(r.id),
  citySlug: s(r.city_slug),
  slug: s(r.slug),
  name: s(r.name),
  kind: s(r.kind) === "studio" ? "studio" : "gym",
  address: s(r.address),
  city: s(r.city),
  region: s(r.region),
  lat: n(r.lat),
  lon: n(r.lon),
  km: Math.round(km * 10) / 10,
  hours: s(r.hours),
  website: s(r.website),
  phone: s(r.phone),
  country: s(r.country),
  updatedAt: n(r.updated_at),
  official: !!s(r.claimed_by),
  lifters: n(r.lifters),
  code: s(r.code) || s(r.listed),
  source: (["staff", "owner", "lifter"] as const).find((x) => x === s(r.source)) ?? "osm",
  club: s(r.club),
  map: process.env.MAPBOX_TOKEN ? `/api/gyms/map/?place=${s(r.id)}` : "",
  logo: s(r.logo),
  photos: [],
  amenities: cleanAmenities(s(r.amenities)),
  prices: cleanPrices(s(r.prices), currencyFor(s(r.country))),
  news: [],
  issues: [],
  trainers: [],
});

/** One gym's photos, oldest first (gymMedia.ts). */
async function withPhotos(p: Place): Promise<Place> {
  const [rows, news, issues, trainers] = await Promise.all([
    query("SELECT id FROM gym_photos WHERE place_id = ? AND kind = 'photo' ORDER BY created_at, id", [p.id]),
    newsOf(p.id),
    issuesOf(p.id),
    trainersOf(p.id),
  ]);
  return { ...p, photos: rows.map((r) => s(r.id)), news, issues, trainers };
}

/** Gyms within `PLACE_LIMITS.radiusKm`: official ones first, then nearest. Studios only when asked for. */
export async function nearbyPlaces(lat: unknown, lon: unknown, opts: { studios?: boolean } = {}): Promise<Place[] | null> {
  if (!validLat(lat) || !validLon(lon)) return null;
  const here = { lat, lon };
  const dLat = PLACE_LIMITS.radiusKm / 111;
  const dLon = PLACE_LIMITS.radiusKm / (111 * Math.max(0.05, Math.cos((lat * Math.PI) / 180)));
  const rows = await query(
    `SELECT ${PLACE_COLUMNS} FROM gym_places p
     WHERE p.hidden = 0 AND p.lat BETWEEN ? AND ? AND p.lon BETWEEN ? AND ? ${opts.studios ? "" : "AND p.kind = 'gym'"} LIMIT 1000`,
    [lat - dLat, lat + dLat, lon - dLon, lon + dLon],
  );
  return rows
    .map((r) => ({ r, km: distanceKm(here, { lat: n(r.lat), lon: n(r.lon) }) }))
    .filter((x) => x.km <= PLACE_LIMITS.radiusKm)
    .map(({ r, km }) => toPlace(r, km))
    .sort((a, b) => Number(b.official) - Number(a.official) || a.km - b.km || b.lifters - a.lifters)
    .slice(0, PLACE_LIMITS.results);
}

export async function placeById(id: unknown): Promise<Place | null> {
  if (!isPlaceId(id)) return null;
  const [r] = await query(`SELECT ${PLACE_COLUMNS} FROM gym_places p WHERE p.id = ? AND p.hidden = 0`, [id]);
  return r ? withPhotos(toPlace(r, 0)) : null;
}

// --- Gym pages (gymPage.ts): /gyms/, /gyms/<city>/, /gyms/<city>/<gym>/ ---

const isSlug = (x: unknown): x is string => typeof x === "string" && /^[a-z0-9-]{1,90}$/.test(x);

export async function placeBySlug(citySlug: unknown, slug: unknown): Promise<Place | null> {
  if (!isSlug(citySlug) || !isSlug(slug)) return null;
  const [r] = await query(`SELECT ${PLACE_COLUMNS} FROM gym_places p WHERE p.city_slug = ? AND p.slug = ? AND p.hidden = 0`, [
    citySlug,
    slug,
  ]);
  return r ? withPhotos(toPlace(r, 0)) : null;
}

/** Every gym in a city: official first, then the most lifters, then by name. */
export async function cityPlaces(citySlug: unknown): Promise<Place[]> {
  if (!isSlug(citySlug)) return [];
  const rows = await query(`SELECT ${PLACE_COLUMNS} FROM gym_places p WHERE p.city_slug = ? AND p.hidden = 0 LIMIT 2000`, [citySlug]);
  return rows
    .map((r) => toPlace(r, 0))
    .sort((a, b) => Number(b.official) - Number(a.official) || b.lifters - a.lifters || a.name.localeCompare(b.name));
}

export interface City {
  citySlug: string;
  city: string;
  region: string;
  country: string;
  gyms: number;
  updatedAt: number;
}

/** Cities with at least one gym (studios aside), most gyms first. */
export async function cities(): Promise<City[]> {
  const rows = await query(
    `SELECT city_slug, MAX(city) AS city, MAX(region) AS region, MAX(country) AS country, COUNT(*) AS n, MAX(updated_at) AS at
     FROM gym_places WHERE hidden = 0 AND kind = 'gym' GROUP BY city_slug ORDER BY n DESC, city LIMIT 5000`,
  );
  return rows.map((r) => ({
    citySlug: s(r.city_slug),
    city: s(r.city),
    region: s(r.region),
    country: s(r.country),
    gyms: n(r.n),
    updatedAt: n(r.at),
  }));
}

/** Every gym page worth indexing: gyms (not studios) that aren't hidden. */
export async function sitemapGyms(): Promise<{ path: string; lastModified: number }[]> {
  const rows = await query(
    "SELECT city_slug, slug, updated_at FROM gym_places WHERE hidden = 0 AND kind = 'gym' ORDER BY updated_at DESC LIMIT 45000",
  );
  return rows.map((r) => ({ path: `/gyms/${s(r.city_slug)}/${s(r.slug)}/`, lastModified: n(r.updated_at) }));
}

/** A lifter added this gym: counted once per lifter. */
export async function joinPlace(who: string, id: unknown, now = Date.now()): Promise<void> {
  if (!isPlaceId(id)) return;
  const [p] = await query("SELECT id FROM gym_places WHERE id = ?", [id]);
  if (!p) return;
  const added = await run("INSERT OR IGNORE INTO gym_place_lifters (place_id, who, created_at) VALUES (?, ?, ?)", [id, who, now]);
  if (added)
    await run("UPDATE gym_places SET lifters = (SELECT COUNT(*) FROM gym_place_lifters WHERE place_id = ?) WHERE id = ?", [id, id]);
}

/** Is `id` a gym a listing can say it is? */
export async function placeExists(id: unknown): Promise<boolean> {
  if (!isPlaceId(id)) return false;
  const [p] = await query("SELECT 1 AS x FROM gym_places WHERE id = ?", [id]);
  return !!p;
}

// --- Staff: the Gyms tab ---

export interface AdminPlace {
  id: string;
  /** Web address parts: /gyms/<citySlug>/<slug>/ ("langley-bc", "steve-nash-fitness-world"). */
  citySlug: string;
  slug: string;
  name: string;
  kind: PlaceKind;
  address: string;
  city: string;
  region: string;
  source: string;
  official: boolean;
  lifters: number;
  setups: number;
  hidden: boolean;
  hasKit: boolean;
  /** Visits from the QR code on the gym's poster or stand (gymPosters.ts). */
  qrScans: number;
  /** Added by a lifter and waiting for staff. */
  pending: boolean;
  createdAt: number;
  /** The owner's logo and photos (gymMedia.ts), which staff can take down. */
  pictures: number;
}

const ADMIN_SQL = `SELECT p.id, p.city_slug, p.slug, p.name, p.kind, p.address, p.city, p.region, p.source, p.claimed_by, p.lifters, p.hidden,
    p.code, p.qr_scans, p.pending, p.created_at, (SELECT COUNT(*) FROM public_gyms g WHERE g.place_id = p.id) AS setups,
    (SELECT COUNT(*) FROM gym_photos m WHERE m.place_id = p.id) AS pictures
  FROM gym_places p`;

const toAdmin = (r: Row): AdminPlace => ({
  id: s(r.id),
  citySlug: s(r.city_slug),
  slug: s(r.slug),
  name: s(r.name),
  kind: s(r.kind) === "studio" ? "studio" : "gym",
  address: s(r.address),
  city: s(r.city),
  region: s(r.region),
  source: s(r.source),
  official: !!s(r.claimed_by),
  lifters: n(r.lifters),
  setups: n(r.setups),
  hidden: !!n(r.hidden),
  hasKit: !!s(r.code) || n(r.setups) > 0,
  qrScans: n(r.qr_scans),
  pending: !!n(r.pending),
  createdAt: n(r.created_at),
  pictures: n(r.pictures),
});

/** Gyms per page in the admin list (a country can have thousands). */
export const ADMIN_PAGE = 50;

export interface AdminPlaceList {
  places: AdminPlace[];
  /** Every gym, and the official ones, whatever the search. */
  total: number;
  official: number;
  /** Gyms matching the search, and this page of them (from 1). */
  matches: number;
  page: number;
  pages: number;
}

/** One page of the admin gym list, official first, then most lifters; searchable by name, city or region. */
export async function adminPlaces(q: unknown, pageAsked: unknown = 1): Promise<AdminPlaceList> {
  const term = typeof q === "string" ? q.trim().slice(0, 80) : "";
  const like = `%${term.replace(/[%_]/g, "")}%`;
  const where = `WHERE p.pending = 0${term ? " AND (p.name LIKE ? OR p.city LIKE ? OR p.region LIKE ?)" : ""}`;
  const args = term ? [like, like, like] : [];
  const [m] = await query(`SELECT COUNT(*) AS n FROM gym_places p ${where}`, args);
  const matches = n(m?.n);
  const pages = Math.max(1, Math.ceil(matches / ADMIN_PAGE));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(pageAsked) || 1)));
  const rows = await query(
    `${ADMIN_SQL} ${where}
     ORDER BY p.claimed_by = '' , p.lifters DESC, p.city, p.name, p.id LIMIT ? OFFSET ?`,
    [...args, ADMIN_PAGE, (page - 1) * ADMIN_PAGE],
  );
  const [c] = await query("SELECT COUNT(*) AS total, SUM(claimed_by <> '') AS official FROM gym_places WHERE pending = 0");
  return {
    total: n(c?.total),
    official: n(c?.official),
    matches,
    page,
    pages,
    places: rows.map(toAdmin),
  };
}

export type PlaceAction = "hide" | "show" | "gym" | "studio" | "delete" | "approve" | "reject" | "pictures";

export async function actOnPlace(id: unknown, action: unknown, now = Date.now()): Promise<boolean> {
  if (!isPlaceId(id)) return false;
  switch (action) {
    case "hide":
    case "show":
      return (await run("UPDATE gym_places SET hidden = ?, updated_at = ? WHERE id = ?", [action === "hide" ? 1 : 0, now, id])) > 0;
    case "gym":
    case "studio":
      return (await run("UPDATE gym_places SET kind = ?, updated_at = ? WHERE id = ?", [action, now, id])) > 0;
    case "pictures":
      // Staff take down every picture the owner added (gymMedia.ts).
      await run("DELETE FROM gym_photos WHERE place_id = ?", [id]);
      return true;
    case "approve":
      return (await run("UPDATE gym_places SET pending = 0, hidden = 0, updated_at = ? WHERE id = ? AND pending = 1", [now, id])) > 0;
    case "reject": {
      const [p] = await query("SELECT 1 AS x FROM gym_places WHERE id = ? AND pending = 1", [id]);
      if (!p) return false;
      await run("DELETE FROM gym_places WHERE id = ? AND pending = 1", [id]);
      return true;
    }
    case "delete":
      await batch([
        { sql: "UPDATE public_gyms SET place_id = '' WHERE place_id = ?", args: [id] },
        { sql: "DELETE FROM gym_place_lifters WHERE place_id = ?", args: [id] },
        { sql: "UPDATE clubs SET place_id = '' WHERE place_id = ?", args: [id] },
        { sql: "DELETE FROM gym_photos WHERE place_id = ?", args: [id] },
        ...["gym_news", "gym_issues", "gym_trainers"].map((t) => ({ sql: `DELETE FROM ${t} WHERE place_id = ?`, args: [id] })),
        { sql: "DELETE FROM gym_places WHERE id = ?", args: [id] },
      ]);
      return true;
    default:
      return false;
  }
}

/** Account deletion: the lifter stops counting toward the gyms they added. */
export const placeDeletes = (accountId: string) => [
  {
    sql: "UPDATE gym_places SET lifters = MAX(0, lifters - 1) WHERE id IN (SELECT place_id FROM gym_place_lifters WHERE who = ?)",
    args: [`acc:${accountId}`],
  },
  { sql: "DELETE FROM gym_place_lifters WHERE who = ?", args: [`acc:${accountId}`] },
  // Gyms they added stay (they're businesses on a map); a gym still waiting for staff goes with them.
  { sql: "DELETE FROM gym_places WHERE added_by = ? AND pending = 1", args: [accountId] },
  { sql: "UPDATE gym_places SET added_by = '' WHERE added_by = ?", args: [accountId] },
];
