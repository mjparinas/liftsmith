// Importing a city's gyms from OpenStreetMap (staff only; docs/decisions/gyms.md "Importing gyms"). Nominatim finds
// the area, Overpass lists its fitness centres, savePlaces (gymPlaces.ts) writes them keyed on the map's own id.
//
// Speed (Melvin, 2026-11-14: "importing gyms take a long time"): almost all of an import is waiting on Overpass, and a
// busy Overpass server would hold a request for minutes and then fail, before the next server was even tried. So each
// server gets a time limit (and Overpass is told to give up sooner itself), an error Overpass hides inside a 200
// answer counts as a failure, the area Nominatim found is remembered so a re-import skips that lookup, and parallel
// imports start on different servers (`server`) so two cities run at once without queueing on one.
//
// Every import leaves a row in gym_imports with a step-by-step log (timings, which server, what it said), shown on
// Admin › Gyms and downloadable, so a failed city can be understood later.
import { randomBytes } from "node:crypto";

import { SHORT_REGION } from "@/lib/regions";

import { query, run } from "./db";
import {
  clean,
  NOMINATIM,
  placesFromOsm,
  REC_NAME,
  savePlaces,
  UA,
  type Area,
  type Found,
  type OsmElement,
  type OsmSkips,
} from "./gymPlaces";

export const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export const IMPORT_LIMITS = {
  /** The whole import must finish inside the route's five minutes, with room to save. */
  budgetMs: 250_000,
  /** One Overpass server gets at most this long before the next is tried. */
  serverMs: 100_000,
  /** What Overpass is told, in seconds, so a busy server gives up on its own before our limit. */
  overpassTimeout: 90,
  /** Nominatim gets this long. */
  lookupMs: 15_000,
  /** How long import rows (and their logs) are kept. */
  keepMs: 90 * 86_400_000,
};

/** Where an area is on the map, as Nominatim found it. Kept on each import row so a re-import skips the lookup. */
export interface Scope {
  osmType: string;
  osmId: number;
  bbox: number[];
  area: Area;
}

export type ImportResult =
  | {
      ok: true;
      id: string;
      area: string;
      found: number;
      added: number;
      updated: number;
      unchanged: number;
      kept: number;
      skipped: OsmSkips;
      server: string;
      ms: number;
      log: string[];
    }
  | { ok: false; id: string; error: "where" | "map"; detail: string; ms: number; log: string[] };

/** "  Langley,  BC " → "langley, bc": one key per place, whatever the spacing or case. */
export const importKey = (where: string) =>
  clean(where, 120)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ");

const host = (url: string) => new URL(url).host;
const secs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

/** Servers in the order to try them, starting from `start` (so parallel imports spread out). */
export const serverOrder = (start = 0) => OVERPASS.map((_, i) => OVERPASS[(i + Math.abs(Math.trunc(start))) % OVERPASS.length]!);

function scopeFrom(hit: Found): Scope | null {
  const a = hit.address ?? {};
  const regionName = a.state ?? a.province ?? "";
  // "CA-BC": the province or state code, whatever language or spelling the name came back in.
  const isoRegion = /^(?:CA|US|AU)-([A-Z]{2,3})$/.exec(a["ISO3166-2-lvl4"] ?? "")?.[1];
  const area: Area = {
    city: clean(a.city ?? a.town ?? a.village ?? a.municipality ?? hit.name, 60),
    region: isoRegion ?? SHORT_REGION[regionName] ?? clean(regionName, 60),
    country: clean(a.country_code, 2).toUpperCase(),
  };
  const bbox = (hit.boundingbox ?? []).map(Number);
  const relation = hit.osm_type === "relation" && !!hit.osm_id;
  if (!relation && !(bbox.length === 4 && bbox.every(Number.isFinite))) return null;
  return { osmType: hit.osm_type ?? "", osmId: hit.osm_id ?? 0, bbox: bbox.length === 4 ? bbox : [], area };
}

/** The Overpass query for an area: its boundary when OSM has one, else its box. */
export function overpassQuery(scope: Scope, timeout = IMPORT_LIMITS.overpassTimeout): string {
  const filters = [
    `nwr["leisure"="fitness_centre"]`,
    `nwr["leisure"="sports_centre"]["name"]`,
    `nwr["amenity"="community_centre"]["name"~"${REC_NAME}",i]`,
  ];
  let body: string;
  if (scope.osmType === "relation" && scope.osmId)
    body = `area(${3_600_000_000 + scope.osmId})->.a;(${filters.map((f) => `${f}(area.a);`).join("")});`;
  else {
    const [south, north, west, east] = scope.bbox;
    body = `(${filters.map((f) => `${f}(${south},${west},${north},${east});`).join("")});`;
  }
  return `[out:json][timeout:${timeout}];${body}out center tags;`;
}

async function cachedScope(key: string): Promise<Scope | null> {
  const [row] = await query<{ scope: string }>("SELECT scope FROM gym_imports WHERE query = ? AND scope <> '' ORDER BY at DESC LIMIT 1", [
    key,
  ]);
  if (!row) return null;
  try {
    const s = JSON.parse(row.scope) as Scope;
    return s && typeof s.osmType === "string" && Array.isArray(s.bbox) && s.area ? s : null;
  } catch {
    return null;
  }
}

/** Overpass answers some failures with a 200 and a "remark" instead of an error status. */
const overpassFailure = (remark: unknown) =>
  typeof remark === "string" && /runtime error|timed out|out of memory|too busy|rate_limited/i.test(remark) ? remark : "";

export interface ImportOptions {
  /** Which Overpass server to try first (parallel imports pass different ones). */
  server?: number;
  /** Look the area up again even when an earlier import found it. */
  fresh?: boolean;
}

/** Looks up an area by name ("Langley, BC"), then pulls its fitness centres from OpenStreetMap and saves them. */
export async function importArea(
  where: string,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
  opts: ImportOptions = {},
): Promise<ImportResult> {
  const started = Date.now();
  const id = randomBytes(8).toString("hex");
  const log: string[] = [];
  const say = (line: string) => log.push(`+${secs(Date.now() - started)} ${line}`);
  const key = importKey(where);
  let scope: Scope | null = null;
  const finish = async (r: ImportResult) => {
    await record(r, key, scope, now).catch(() => undefined);
    return r;
  };
  const fail = (error: "where" | "map", detail: string) => finish({ ok: false, id, error, detail, ms: Date.now() - started, log });
  if (!key) return { ok: false, id, error: "where", detail: "No place given.", ms: 0, log };
  say(`import "${key}"`);

  scope = opts.fresh ? null : await cachedScope(key);
  if (scope) say(`area from an earlier import: ${scope.osmType || "box"}${scope.osmId ? `/${scope.osmId}` : ""}, skipped Nominatim`);
  else {
    const t = Date.now();
    const geo = await fetcher(`${NOMINATIM}?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(key)}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(IMPORT_LIMITS.lookupMs),
    }).catch((e: unknown) => {
      say(`nominatim failed after ${secs(Date.now() - t)}: ${String(e instanceof Error ? e.message : e)}`);
      return null;
    });
    if (geo && !geo.ok) say(`nominatim answered ${geo.status} after ${secs(Date.now() - t)}`);
    const hits = geo?.ok ? ((await geo.json().catch(() => [])) as Found[]) : [];
    const hit = Array.isArray(hits) ? hits[0] : undefined;
    if (!hit) return fail("where", geo?.ok ? "Nominatim found no place by that name." : "Nominatim didn't answer.");
    scope = scopeFrom(hit);
    if (!scope) return fail("where", `Nominatim found "${hit.name ?? "?"}" but no boundary or box for it.`);
    say(`nominatim ${secs(Date.now() - t)}: ${hit.name ?? "?"} → ${scope.osmType}/${scope.osmId}`);
  }
  const areaName = [scope.area.city, scope.area.region].filter(Boolean).join(", ");
  say(`area ${areaName || "?"} (${scope.area.country || "?"})`);

  const body = `data=${encodeURIComponent(overpassQuery(scope))}`;
  const problems: string[] = [];
  for (const url of serverOrder(opts.server)) {
    const left = IMPORT_LIMITS.budgetMs - (Date.now() - started);
    if (left < 10_000) {
      say("out of time for another map server");
      break;
    }
    const name = host(url);
    const t = Date.now();
    const limit = Math.min(IMPORT_LIMITS.serverMs, left);
    let r: Response | null = null;
    try {
      r = await fetcher(url, {
        method: "POST",
        headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(limit),
      });
    } catch (e) {
      const why = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError") ? `no answer in ${secs(limit)}` : String(e);
      problems.push(`${name}: ${why}`);
      say(`${name} ${why}`);
      continue;
    }
    if (!r.ok) {
      const text = (await r.text().catch(() => ""))
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const why = `HTTP ${r.status}${r.status === 429 ? " (too many requests)" : r.status === 504 ? " (server busy)" : ""}`;
      problems.push(`${name}: ${why}`);
      say(`${name} ${why} after ${secs(Date.now() - t)}${text ? `: ${text.slice(0, 200)}` : ""}`);
      continue;
    }
    const j = (await r.json().catch(() => null)) as { elements?: OsmElement[]; remark?: string } | null;
    const remark = overpassFailure(j?.remark);
    if (!j?.elements || remark) {
      const why = remark ? `error: ${remark.slice(0, 200)}` : "answer wasn't map data";
      problems.push(`${name}: ${why}`);
      say(`${name} ${why} after ${secs(Date.now() - t)}`);
      continue;
    }
    say(`${name} ${secs(Date.now() - t)}: ${j.elements.length} map elements`);
    const skipped: OsmSkips = { unnamed: 0, private: 0, notGym: 0, duplicate: 0 };
    const drafts = placesFromOsm(j.elements, scope.area, skipped);
    say(
      `kept ${drafts.length}; left out ${skipped.unnamed} unnamed, ${skipped.private} private, ${skipped.notGym} without a gym, ${skipped.duplicate} repeated`,
    );
    const saved = await savePlaces(drafts, now);
    say(
      `database read ${secs(saved.readMs)}, wrote ${saved.statements} rows in ${secs(saved.writeMs)}: ${saved.added} new, ${saved.updated} changed, ${saved.unchanged} unchanged, ${saved.kept} claimed left alone`,
    );
    return finish({
      ok: true,
      id,
      area: areaName,
      found: drafts.length,
      added: saved.added,
      updated: saved.updated,
      unchanged: saved.unchanged,
      kept: saved.kept,
      skipped,
      server: name,
      ms: Date.now() - started,
      log,
    });
  }
  return fail("map", problems.join("; ") || "No map server answered in time.");
}

async function record(r: ImportResult, key: string, scope: Scope | null, now: number) {
  await run(
    `INSERT INTO gym_imports (id, query, area, scope, ok, error, found, added, updated, unchanged, kept, server, ms, log, at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.id,
      key,
      r.ok ? r.area : scope ? [scope.area.city, scope.area.region].filter(Boolean).join(", ") : "",
      scope ? JSON.stringify(scope) : "",
      r.ok ? 1 : 0,
      r.ok ? "" : `${r.error}: ${r.detail}`.slice(0, 1000),
      r.ok ? r.found : 0,
      r.ok ? r.added : 0,
      r.ok ? r.updated : 0,
      r.ok ? r.unchanged : 0,
      r.ok ? r.kept : 0,
      r.ok ? r.server : "",
      r.ms,
      r.log.join("\n").slice(0, 20_000),
      now,
    ],
  );
  await run("DELETE FROM gym_imports WHERE at < ?", [now - IMPORT_LIMITS.keepMs]);
}

export interface ImportRow {
  id: string;
  query: string;
  area: string;
  ok: boolean;
  error: string;
  found: number;
  added: number;
  updated: number;
  unchanged: number;
  kept: number;
  server: string;
  ms: number;
  log: string;
  at: number;
}

/** The latest imports, newest first, for Admin › Gyms. */
export async function recentImports(limit = 100): Promise<ImportRow[]> {
  const rows = await query(
    `SELECT id, query, area, ok, error, found, added, updated, unchanged, kept, server, ms, log, at FROM gym_imports ORDER BY at DESC LIMIT ?`,
    [Math.max(1, Math.min(500, Math.trunc(limit) || 100))],
  );
  return rows.map((r) => ({
    id: String(r.id),
    query: String(r.query),
    area: String(r.area),
    ok: Number(r.ok) === 1,
    error: String(r.error),
    found: Number(r.found),
    added: Number(r.added),
    updated: Number(r.updated),
    unchanged: Number(r.unchanged),
    kept: Number(r.kept),
    server: String(r.server),
    ms: Number(r.ms),
    log: String(r.log),
    at: Number(r.at),
  }));
}

/** When each of these places last imported cleanly (by import key), so a big run can skip recent ones. */
export async function lastImported(places: readonly string[]): Promise<Record<string, number>> {
  const keys = [...new Set(places.map(importKey).filter(Boolean))];
  const out: Record<string, number> = {};
  for (let i = 0; i < keys.length; i += 400) {
    const part = keys.slice(i, i + 400);
    const rows = await query(
      `SELECT query, MAX(at) AS at FROM gym_imports WHERE ok = 1 AND query IN (${part.map(() => "?").join(",")}) GROUP BY query`,
      part,
    );
    for (const r of rows) out[String(r.query)] = Number(r.at);
  }
  return out;
}
