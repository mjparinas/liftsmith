// Fixing gyms already saved with a postcode or house number for a city ("80145, Campania", "1, ON", "6337, CA"), with
// no city at all (pages under /gyms/gyms/), or with an untidy address (stray commas, repeated parts). Admin › Gyms ›
// Gym list runs it in steps (docs/decisions/gyms.md "Clean city names and addresses", 2026-11-15).
//
// The right city comes from, in order: the city inside the saved value ("80145 Napoli" → "Napoli"), the city most of
// the gyms within about 3 km are filed under, then OpenStreetMap's own answer for the gym's position (Nominatim
// reverse, one request a second, a few per step). A gym that moves keeps a redirect from its old page (moveToCity).
// Claimed gyms are left as their owner set them.
import { query, run } from "./db";
import { badCity, cityName, tidyAddress } from "./gymAddress";
import { citySlugOf, moveToCity, UA } from "./gymPlaces";

export const REPAIR_LIMITS = {
  /** Gyms looked at in one step. */
  batch: 1_000,
  /** Map lookups in one step (Nominatim allows one a second). */
  lookups: 12,
  lookupMs: 10_000,
  gapMs: 1_100,
  /** How far around a gym its neighbours vote on its city, in degrees (about 3 km). */
  box: 0.03,
};

export const REVERSE = "https://nominatim.openstreetmap.org/reverse";

export interface RepairChange {
  id: string;
  name: string;
  /** "80145, Campania → Napoli, Campania" or an address before and after. */
  what: string;
}

export interface RepairStep {
  /** Gyms looked at, and where the next step starts ('' when the list is done). */
  checked: number;
  next: string;
  cities: number;
  addresses: number;
  moved: number;
  /** Bad cities nothing could fix yet (no neighbours, and no lookups left in this step). */
  unsure: number;
  changes: RepairChange[];
}

const str = (x: unknown) => (typeof x === "string" ? x : x == null ? "" : String(x));
const num = (x: unknown) => Number(x ?? 0);

/** The city most gyms around a point are filed under (at least two of them agreeing, or the only one there). */
export async function neighbourCity(
  p: { id: string; lat: number; lon: number; country: string },
  box = REPAIR_LIMITS.box,
): Promise<{ city: string; region: string } | null> {
  const rows = await query(
    `SELECT city, region FROM gym_places WHERE country = ? AND lat BETWEEN ? AND ? AND lon BETWEEN ? AND ? AND id <> ? AND pending = 0 LIMIT 300`,
    [p.country, p.lat - box, p.lat + box, p.lon - box, p.lon + box, p.id],
  );
  const votes = new Map<string, { city: string; region: string; n: number }>();
  for (const r of rows) {
    const city = str(r.city);
    if (badCity(city)) continue;
    const k = `${city}|${str(r.region)}`;
    const v = votes.get(k) ?? { city, region: str(r.region), n: 0 };
    v.n++;
    votes.set(k, v);
  }
  const ranked = [...votes.values()].sort((a, b) => b.n - a.n);
  const top = ranked[0];
  if (!top) return null;
  if (top.n >= 2 && top.n > (ranked[1]?.n ?? 0)) return top;
  return ranked.length === 1 ? top : null;
}

/** OpenStreetMap's city for a position, or ''. */
export async function reverseCity(lat: number, lon: number, fetcher: typeof fetch = fetch): Promise<string> {
  const r = await fetcher(`${REVERSE}?format=jsonv2&zoom=10&addressdetails=1&lat=${lat}&lon=${lon}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(REPAIR_LIMITS.lookupMs),
  }).catch(() => null);
  if (!r?.ok) return "";
  const j = (await r.json().catch(() => null)) as { name?: string; address?: Record<string, string> } | null;
  if (!j) return "";
  // The map's own city, town or village, else the name it found; a postcode area or house number is never a city.
  const a = j.address ?? {};
  return cityName(a.city ?? a.town ?? a.village ?? a.municipality) || cityName(j.name);
}

/** How many gyms look wrong right now: a city that isn't one, or a page filed under a city it no longer has. */
export async function repairCount(): Promise<number> {
  const rows = await query("SELECT city, region, city_slug FROM gym_places WHERE pending = 0 AND claimed_by = ''");
  return rows.filter((r) => badCity(str(r.city)) || citySlugOf(str(r.city), str(r.region)) !== str(r.city_slug)).length;
}

/** One step of the repair: the next `batch` gyms after `after` (by id). */
export async function repairStep(
  after: string,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((ok) => setTimeout(ok, ms)),
): Promise<RepairStep> {
  const rows = await query(
    `SELECT id, name, address, city, region, country, postcode, lat, lon, city_slug FROM gym_places
     WHERE id > ? AND pending = 0 AND claimed_by = '' ORDER BY id LIMIT ?`,
    [after, REPAIR_LIMITS.batch],
  );
  const out: RepairStep = { checked: rows.length, next: "", cities: 0, addresses: 0, moved: 0, unsure: 0, changes: [] };
  let lookups = 0;
  for (const r of rows) {
    const id = str(r.id);
    const name = str(r.name);
    let city = str(r.city);
    let region = str(r.region);
    const was = [city, region].filter(Boolean).join(", ");
    if (badCity(city)) {
      let found = cityName(city) ? { city: cityName(city), region } : null;
      found ??= await neighbourCity({ id, lat: num(r.lat), lon: num(r.lon), country: str(r.country) });
      if (!found && lookups < REPAIR_LIMITS.lookups) {
        if (lookups) await sleep(REPAIR_LIMITS.gapMs);
        lookups++;
        const c = await reverseCity(num(r.lat), num(r.lon), fetcher);
        if (c) found = { city: c, region };
      }
      if (found) {
        city = found.city;
        region = region || found.region;
        await run("UPDATE gym_places SET city = ?, region = ?, updated_at = ? WHERE id = ? AND claimed_by = ''", [city, region, now, id]);
        out.cities++;
        out.changes.push({ id, name, what: `${was || "no city"} → ${[city, region].filter(Boolean).join(", ")}` });
      } else out.unsure++;
    }
    const address = str(r.address);
    const tidy = tidyAddress(address, { city, region, postcode: str(r.postcode) });
    if (tidy !== address) {
      await run("UPDATE gym_places SET address = ?, updated_at = ? WHERE id = ? AND claimed_by = ''", [tidy, now, id]);
      out.addresses++;
      out.changes.push({ id, name, what: `“${address}” → ${tidy ? `“${tidy}”` : "no address"}` });
    }
    if (citySlugOf(city, region) !== str(r.city_slug) && (await moveToCity(id, now))) out.moved++;
  }
  out.next = rows.length === REPAIR_LIMITS.batch ? str(rows[rows.length - 1]?.id) : "";
  return out;
}
