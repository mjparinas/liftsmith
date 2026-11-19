// Gym chains (Melvin, 2026-11-19: "logos and 'all locations' pages for gym chains"; docs/decisions/gyms.md "Gym
// chains"). Gyms that belong to one chain share its logo and link to one page listing every branch: /gym-chains/<slug>/
// on the website and #/gymchain/<slug> in the app. How a gym's chain is found is in gymChainNames.ts.
//
// - A gym's chain is set when it's imported (savePlaces: the map's brand tag, else a known chain's name) and, in the
//   worldwide import's last step, for gyms whose names repeat across cities (`chainStep`).
// - `refreshChains` (the end of every import, worldwide and daily) counts each chain's visible branches and picks its
//   website and logo: the sharpest icon from the site most of its branches link to, copied into the chain's own row in
//   gym_photos (kind 'chain'), so it stays when that branch goes.
// - Claimed gyms are left exactly as their owner set them: the import never writes them, and they never show the chain's
//   logo in place of their own (gymPlaces.ts chainOf).
// - Reads go through the partial index gym_places_chain, so a chain's page reads only its own branches; the name step
//   reads every unclaimed gym once per worldwide import, which is the one full pass (docs/decisions/database-reads.md).
import { randomBytes } from "node:crypto";

import { batch, query, type Row } from "./db";
import { chainKey, chainSlug, genericName, matchChain, pickChainSite, type IconChoice } from "./gymChainNames";
import { keptList } from "./gymPlaces";

export const CHAIN_LIMITS = {
  /** A chain shows (its link on a gym's page, its own page) once it has this many visible branches. */
  shown: 2,
  /** Its page is offered to search engines from this many (fewer is a thin page; docs/decisions/seo.md). */
  indexed: 3,
  /** A name without a brand tag becomes a chain when this many gyms in this many cities share it. */
  namePlaces: 3,
  nameCities: 3,
  /** Branches a page lists, most first. */
  listed: 2_000,
  /** Gyms the name step reads at a time. */
  step: 2_000,
};

const s = (x: unknown) => (typeof x === "string" ? x : x == null ? "" : String(x));
const n = (x: unknown) => (typeof x === "number" ? x : Number(x ?? 0));
const isSlug = (x: unknown): x is string => typeof x === "string" && /^[a-z0-9-]{1,60}$/.test(x);

/** Every chain's name (chainKey) → its slug, for matching gyms by name; kept on the server like the city list. */
export async function chainNames(): Promise<Map<string, string>> {
  const rows = await query("SELECT slug, name FROM gym_chains");
  return new Map(rows.map((r) => [chainKey(s(r.name)), s(r.slug)]));
}
export const keptChainNames = () => keptList("chainNames", chainNames);

// --- The name step (worldwide import) ---

export interface ChainStep {
  /** The next step's cursor (a gym id), '' when the pass is done. */
  next: string;
  checked: number;
  /** Gyms that got a chain this step, and chains found from names (first step only). */
  chained: number;
  found: number;
}

/**
 * Names shared by gyms in three cities or more that aren't only common words ("Fitness Centre") become chains. One
 * grouped read of the unclaimed gyms without a chain, once per worldwide import.
 */
export async function discoverNameChains(now = Date.now()): Promise<number> {
  const rows = await query(
    `SELECT lower(name) AS k, MIN(name) AS name, COUNT(*) AS n, COUNT(DISTINCT city_slug) AS c FROM gym_places
     WHERE chain = '' AND claimed_by = '' AND hidden = 0 AND pending = 0
     GROUP BY lower(name) HAVING COUNT(*) >= ? AND COUNT(DISTINCT city_slug) >= ?`,
    [CHAIN_LIMITS.namePlaces, CHAIN_LIMITS.nameCities],
  );
  const fresh = rows.filter((r) => !genericName(s(r.name)) && chainSlug(s(r.name)));
  const stmts = fresh.map((r) => ({
    sql: "INSERT OR IGNORE INTO gym_chains (slug, name, source, updated_at) VALUES (?, ?, 'name', ?)",
    args: [chainSlug(s(r.name)), s(r.name), now],
  }));
  for (let i = 0; i < stmts.length; i += 500) await batch(stmts.slice(i, i + 500));
  return fresh.length;
}

/**
 * One step of the name pass: the next `CHAIN_LIMITS.step` unclaimed gyms without a chain, each matched against the
 * known chains by name (gymChainNames.ts matchChain). The first step (`after` '') finds new name chains first.
 */
export async function chainStep(after: string, now = Date.now()): Promise<ChainStep> {
  const found = after ? 0 : await discoverNameChains(now);
  const known = await chainNames();
  const rows = await query(
    `SELECT id, name FROM gym_places WHERE id > ? AND chain = '' AND claimed_by = '' AND pending = 0 ORDER BY id LIMIT ?`,
    [after, CHAIN_LIMITS.step],
  );
  const sets = new Map<string, string[]>();
  for (const r of rows) {
    const slug = matchChain(s(r.name), known);
    if (slug) sets.set(slug, [...(sets.get(slug) ?? []), s(r.id)]);
  }
  const stmts = [...sets].map(([slug, ids]) => ({
    sql: `UPDATE gym_places SET chain = ? WHERE chain = '' AND claimed_by = '' AND id IN (${ids.map(() => "?").join(",")})`,
    args: [slug, ...ids],
  }));
  for (let i = 0; i < stmts.length; i += 200) await batch(stmts.slice(i, i + 200));
  return {
    next: rows.length < CHAIN_LIMITS.step ? "" : s(rows[rows.length - 1]!.id),
    checked: rows.length,
    chained: [...sets.values()].reduce((a, ids) => a + ids.length, 0),
    found,
  };
}

// --- Counts, website and logo ---

export interface ChainRefresh {
  chains: number;
  logos: number;
}

/**
 * Each chain's visible branches, cities and countries, its website and its logo, from its branches. Reads only gyms in
 * a chain (gym_places_chain). A chain whose logo pick changed gets a fresh copy of that icon, under a new id (pictures
 * are kept a year at their address), and the old copy goes.
 */
export async function refreshChains(now = Date.now()): Promise<ChainRefresh> {
  const [counts, sites, chains] = await Promise.all([
    query(
      `SELECT chain, COUNT(*) AS n, COUNT(DISTINCT city_slug) AS c, COUNT(DISTINCT country) AS k FROM gym_places
       WHERE chain <> '' AND hidden = 0 GROUP BY chain`,
    ),
    query(
      `SELECT p.chain, p.website, m.id AS icon, m.px FROM gym_places p
       LEFT JOIN gym_photos m ON m.place_id = p.id AND m.kind = 'icon'
       WHERE p.chain <> '' AND p.hidden = 0 AND p.website <> ''`,
    ),
    query("SELECT slug, logo, logo_from, website, places, cities, countries FROM gym_chains"),
  ]);
  const byChain = new Map<string, { websites: string[]; icons: IconChoice[] }>();
  for (const r of sites) {
    const c = byChain.get(s(r.chain)) ?? { websites: [], icons: [] };
    c.websites.push(s(r.website));
    if (s(r.icon)) c.icons.push({ id: s(r.icon), px: n(r.px), website: s(r.website) });
    byChain.set(s(r.chain), c);
  }
  const counted = new Map(counts.map((r) => [s(r.chain), r] as const));
  const stmts: { sql: string; args: (string | number)[] }[] = [];
  let logos = 0;
  for (const c of chains) {
    const slug = s(c.slug);
    const k: Row | undefined = counted.get(slug);
    const site = pickChainSite(byChain.get(slug)?.websites ?? [], byChain.get(slug)?.icons ?? []);
    const places = n(k?.n);
    const same =
      places === n(c.places) &&
      n(k?.c) === n(c.cities) &&
      n(k?.k) === n(c.countries) &&
      site.website === s(c.website) &&
      site.icon === s(c.logo_from);
    if (same) continue;
    let logo = s(c.logo);
    if (site.icon !== s(c.logo_from)) {
      if (logo) stmts.push({ sql: "DELETE FROM gym_photos WHERE id = ? AND kind = 'chain'", args: [logo] });
      logo = "";
      if (site.icon) {
        logo = randomBytes(8).toString("hex");
        stmts.push({
          sql: `INSERT INTO gym_photos (id, place_id, kind, image, created_at, px)
                SELECT ?, ?, 'chain', image, ?, px FROM gym_photos WHERE id = ?`,
          args: [logo, `chain:${slug}`, now, site.icon],
        });
        logos++;
      }
    }
    stmts.push({
      sql: `UPDATE gym_chains SET places = ?, cities = ?, countries = ?, website = ?, logo = ?, logo_from = ?, updated_at = ? WHERE slug = ?`,
      args: [places, n(k?.c), n(k?.k), site.website, logo, logo ? site.icon : "", now, slug],
    });
  }
  for (let i = 0; i < stmts.length; i += 500) await batch(stmts.slice(i, i + 500));
  return { chains: chains.length, logos };
}

// --- Pages ---

export interface Chain {
  slug: string;
  name: string;
  website: string;
  /** Its shared logo's id (/api/gyms/photo/?id=), '' for none. */
  logo: string;
  places: number;
  cities: number;
  countries: number;
  updatedAt: number;
}

/** One branch as a chain's page lists it: enough to find it and open its own page. */
export interface ChainBranch {
  id: string;
  citySlug: string;
  slug: string;
  name: string;
  kind: "gym" | "studio";
  address: string;
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  hours: string;
  official: boolean;
  lifters: number;
}

const toChain = (r: Row): Chain => ({
  slug: s(r.slug),
  name: s(r.name),
  website: s(r.website),
  logo: s(r.logo),
  places: n(r.places),
  cities: n(r.cities),
  countries: n(r.countries),
  updatedAt: n(r.updated_at),
});

const toBranch = (r: Row): ChainBranch => ({
  id: s(r.id),
  citySlug: s(r.city_slug),
  slug: s(r.slug),
  name: s(r.name),
  kind: s(r.kind) === "studio" ? "studio" : "gym",
  // An address saved with only a unit ("109-") shows as none, as on the gym's own page.
  address: /^[^\s]{1,12}-$/.test(s(r.address).trim()) ? "" : s(r.address),
  city: s(r.city),
  region: s(r.region),
  country: s(r.country),
  lat: n(r.lat),
  lon: n(r.lon),
  hours: s(r.hours),
  official: !!s(r.claimed_by),
  lifters: n(r.lifters),
});

/** A chain and its branches (by country, region, city, then name), or null when it has too few to show. */
export async function chainPage(slug: unknown): Promise<{ chain: Chain; branches: ChainBranch[] } | null> {
  if (!isSlug(slug)) return null;
  const [c] = await query("SELECT * FROM gym_chains WHERE slug = ? AND places >= ?", [slug, CHAIN_LIMITS.shown]);
  if (!c) return null;
  const rows = await query(
    `SELECT id, city_slug, slug, name, kind, address, city, region, country, lat, lon, hours, claimed_by, lifters FROM gym_places
     WHERE chain = ? AND chain <> '' AND hidden = 0 LIMIT ?`,
    [slug, CHAIN_LIMITS.listed],
  );
  const branches = rows
    .map(toBranch)
    .sort(
      (a, b) =>
        a.country.localeCompare(b.country) ||
        a.region.localeCompare(b.region) ||
        a.city.localeCompare(b.city) ||
        a.name.localeCompare(b.name),
    );
  return branches.length >= CHAIN_LIMITS.shown ? { chain: toChain(c), branches } : null;
}

/** `chainPage` as the public pages show it: kept on the server for 15 minutes, like the city list. */
export const keptChainPage = (slug: string) => keptList(`chain:${slug}`, () => chainPage(slug));

/** Every chain with enough branches to show, the biggest first (/gym-chains/). */
export async function chains(): Promise<Chain[]> {
  const rows = await query("SELECT * FROM gym_chains WHERE places >= ? ORDER BY places DESC, name LIMIT 5000", [CHAIN_LIMITS.shown]);
  return rows.map(toChain);
}
export const keptChains = () => keptList("chains", chains);

/** Chain pages for the sitemap: those with enough branches to be worth indexing. */
export async function sitemapChains(): Promise<{ path: string; lastModified: number }[]> {
  const rows = await query("SELECT slug, updated_at FROM gym_chains WHERE places >= ? ORDER BY places DESC LIMIT 5000", [
    CHAIN_LIMITS.indexed,
  ]);
  return rows.map((r) => ({ path: `/gym-chains/${s(r.slug)}/`, lastModified: n(r.updated_at) }));
}

export const keptSitemapChains = () => keptList("sitemapChains", sitemapChains);

/** Whether a chain's page is offered to search engines (enough branches; docs/decisions/seo.md, thin pages). */
export const chainIndexable = (c: Pick<Chain, "places">) => c.places >= CHAIN_LIMITS.indexed;

/** Runs a chain refresh, failing quietly (an import's last step; the next one tries again). */
export const refreshChainsQuietly = (now = Date.now()) => refreshChains(now).catch(() => ({ chains: 0, logos: 0 }));
