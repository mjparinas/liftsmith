// Real gyms (Melvin, 2026-11-12, docs/decisions/gyms.md). Lifters' own listings (gymDirectory.ts) are setups:
// equipment and weights at about 1 km. These are the gyms themselves: a name, an address, a map position, hours,
// a website. Staff seed a city from OpenStreetMap (ODbL, so pages credit "© OpenStreetMap contributors"); an
// owner who claims one makes it official (a check mark, shown first). A gym offers one setup: its owner's once
// claimed, else the most-added setup lifters listed for it.
//
// These are businesses on a public map, not anything about a lifter, so the position is kept as the map has it.
import { randomBytes } from "node:crypto";

import { batch, query, run, type Row } from "./db";
import { distanceKm } from "./gymDirectory";

export const PLACE_LIMITS = {
  /** How far "Find gyms near you" looks, in km. */
  radiusKm: 15,
  /** Gyms one search returns. */
  results: 30,
  /** Places one import may write, so a whole country can't be pulled by mistake. */
  perImport: 2_000,
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
  /** Claimed by its owner. */
  official: boolean;
  /** Lifters who added it. */
  lifters: number;
  /** The setup it offers (gymShare.ts code): the owner's, else the most-added listing's. Empty when nobody set one up. */
  code: string;
  /** Where its details came from, for the map credit. */
  source: "osm" | "staff" | "owner";
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
  /yoga|pilates|barre|lagree|spin|cycl|dance|aerial|pole|martial|karate|taekwondo|judo|jiu|kickbox|boxing|capoeira|climb|hockey|swim|9round/;

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
    const about = `${t.sport ?? ""} ${name}`.toLowerCase();
    out.push({
      ref,
      name,
      kind: STUDIO.test(about) ? "studio" : "gym",
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
  let added = 0;
  let updated = 0;
  for (const d of drafts.slice(0, PLACE_LIMITS.perImport)) {
    const [had] = await query("SELECT id, claimed_by FROM gym_places WHERE source_ref = ?", [d.ref]);
    if (had) {
      if (s(had.claimed_by)) continue;
      await run(
        `UPDATE gym_places SET name = ?, address = ?, city = ?, region = ?, country = ?, lat = ?, lon = ?, hours = ?,
           website = ?, phone = ?, updated_at = ? WHERE id = ?`,
        [d.name, d.address, d.city, d.region, d.country, d.lat, d.lon, d.hours, d.website, d.phone, now, s(had.id)],
      );
      updated++;
      continue;
    }
    const id = randomBytes(8).toString("hex");
    const city = citySlugOf(d.city, d.region);
    await run(
      `INSERT INTO gym_places (id, city_slug, slug, name, kind, address, city, region, country, lat, lon, hours, website, phone,
         source, source_ref, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'osm', ?, ?, ?)`,
      [
        id,
        city,
        await freeSlug(d.name, city, id),
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
    );
    added++;
  }
  return { added, updated };
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

/** Province or state codes for the countries most lifters are in, so pages read "Langley, BC". */
const SHORT_REGION: Record<string, string> = {
  "British Columbia": "BC",
  Alberta: "AB",
  Saskatchewan: "SK",
  Manitoba: "MB",
  Ontario: "ON",
  Quebec: "QC",
  "New Brunswick": "NB",
  "Nova Scotia": "NS",
  "Prince Edward Island": "PE",
  "Newfoundland and Labrador": "NL",
  Yukon: "YT",
  "Northwest Territories": "NT",
  Nunavut: "NU",
};

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
  const area: Area = {
    city: clean(a.city ?? a.town ?? a.village ?? a.municipality ?? hit.name, 60),
    region: SHORT_REGION[regionName] ?? clean(regionName, 60),
    country: clean(a.country_code, 2).toUpperCase(),
  };
  const filter = `nwr["leisure"="fitness_centre"]`;
  let scope: string;
  if (hit.osm_type === "relation" && hit.osm_id) scope = `area(${3_600_000_000 + hit.osm_id})->.a;(${filter}(area.a););`;
  else if (hit.boundingbox?.length === 4) {
    const [south, north, west, east] = hit.boundingbox.map(Number);
    scope = `(${filter}(${south},${west},${north},${east}););`;
  } else return { ok: false, error: "where" };
  const body = `data=${encodeURIComponent(`[out:json][timeout:60];${scope}out center tags;`)}`;
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

// --- The finder ---

const PLACE_COLUMNS = `p.id, p.city_slug, p.slug, p.name, p.kind, p.address, p.city, p.region, p.lat, p.lon, p.hours, p.website, p.source,
  p.claimed_by, p.lifters, p.code,
  (SELECT g.code FROM public_gyms g WHERE g.place_id = p.id AND g.hidden = 0 ORDER BY g.adds DESC, g.updated_at DESC LIMIT 1) AS listed`;

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
  official: !!s(r.claimed_by),
  lifters: n(r.lifters),
  code: s(r.code) || s(r.listed),
  source: s(r.source) === "staff" ? "staff" : s(r.source) === "owner" ? "owner" : "osm",
});

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
  return r ? toPlace(r, 0) : null;
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
}

export async function adminPlaces(q: unknown): Promise<{ places: AdminPlace[]; total: number; official: number }> {
  const term = typeof q === "string" ? q.trim().slice(0, 80) : "";
  const like = `%${term.replace(/[%_]/g, "")}%`;
  const rows = await query(
    `SELECT p.id, p.city_slug, p.slug, p.name, p.kind, p.address, p.city, p.region, p.source, p.claimed_by, p.lifters, p.hidden, p.code,
       (SELECT COUNT(*) FROM public_gyms g WHERE g.place_id = p.id) AS setups
     FROM gym_places p ${term ? "WHERE p.name LIKE ? OR p.city LIKE ?" : ""}
     ORDER BY p.claimed_by = '' , p.lifters DESC, p.city, p.name LIMIT 300`,
    term ? [like, like] : [],
  );
  const [c] = await query("SELECT COUNT(*) AS total, SUM(claimed_by <> '') AS official FROM gym_places");
  return {
    total: n(c?.total),
    official: n(c?.official),
    places: rows.map((r) => ({
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
    })),
  };
}

export type PlaceAction = "hide" | "show" | "gym" | "studio" | "delete";

export async function actOnPlace(id: unknown, action: unknown, now = Date.now()): Promise<boolean> {
  if (!isPlaceId(id)) return false;
  switch (action) {
    case "hide":
    case "show":
      return (await run("UPDATE gym_places SET hidden = ?, updated_at = ? WHERE id = ?", [action === "hide" ? 1 : 0, now, id])) > 0;
    case "gym":
    case "studio":
      return (await run("UPDATE gym_places SET kind = ?, updated_at = ? WHERE id = ?", [action, now, id])) > 0;
    case "delete":
      await batch([
        { sql: "UPDATE public_gyms SET place_id = '' WHERE place_id = ?", args: [id] },
        { sql: "DELETE FROM gym_place_lifters WHERE place_id = ?", args: [id] },
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
];
