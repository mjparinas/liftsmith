// The worldwide gym import's fast path (Melvin, 2026-11-18: "this is really slow, this has been running for like a
// day already"). The first worldwide run asked the public Overpass servers for one region at a time: about half of
// its time went to servers answering "busy", and even a region with no gyms took about 90 seconds, so 3,111 areas
// needed days. QLever (University of Freiburg, https://qlever.cs.uni-freiburg.de) holds the whole OpenStreetMap planet
// with every area's contents worked out in advance, and answers the same questions, a region's gyms with all their
// tags and its towns, in a few seconds. Same map, same data, same licence; the import tries it first and falls back to
// Overpass when it can't answer (gymImport.ts askMap). The daily refresh ("new on the map since …") stays on Overpass,
// because QLever's copy of the map is refreshed about weekly.
import { REC_NAME, UA, type OsmElement } from "./gymPlaces";

export const QLEVER = "https://qlever.cs.uni-freiburg.de/api/osm-planet";
export const QLEVER_HOST = new URL(QLEVER).host;

const KEY = "https://www.openstreetmap.org/wiki/Key:";
const PREFIXES = [
  `PREFIX osmkey: <${KEY}>`,
  "PREFIX ogc: <http://www.opengis.net/rdf#>",
  "PREFIX geo: <http://www.opengis.net/ont/geosparql#>",
  "PREFIX osmrel: <https://www.openstreetmap.org/relation/>",
].join("\n");

const code = (cc: string) => cc.replace(/[^A-Z]/g, "").slice(0, 2);

/** A country's regions: admin level 4 boundaries with an ISO 3166-2 code that starts with the country's. */
export const qRegions = (cc: string) =>
  `${PREFIXES}
SELECT ?r ?iso ?name WHERE {
  ?r osmkey:boundary "administrative" ; osmkey:admin_level ?level ; osmkey:ISO3166-2 ?iso .
  FILTER(STR(?level) = "4" && STRSTARTS(?iso, "${code(cc)}-"))
  OPTIONAL { ?r osmkey:name ?name }
}`;

/** The area to search: a region's boundary by its relation id, or a whole country by its code. */
const area = (where: { relation: number } | { country: string }) =>
  "relation" in where
    ? `BIND(osmrel:${Math.trunc(where.relation)} AS ?a)`
    : `{ SELECT ?a WHERE {
    ?a osmkey:boundary "administrative" ; osmkey:admin_level ?level .
    { ?a osmkey:ISO3166-1 "${code(where.country)}" } UNION { ?a <${KEY}ISO3166-1:alpha2> "${code(where.country)}" }
    FILTER(STR(?level) = "2")
  } LIMIT 1 }`;

/** What counts as a gym on the map, as in gymImport.ts: fitness centres, and named sports and rec centres. */
const GYM = `{ ?g osmkey:leisure "fitness_centre" }
  UNION { ?g osmkey:leisure "sports_centre" ; osmkey:name ?sportsName }
  UNION { ?g osmkey:amenity "community_centre" ; osmkey:name ?recName FILTER(REGEX(?recName, "${REC_NAME}", "i")) }`;

/** Every tag of every gym in the area, one row per tag. */
export const qGymTags = (where: { relation: number } | { country: string }) =>
  `${PREFIXES}
SELECT ?g ?k ?v WHERE {
  ${area(where)}
  ?a ogc:sfContains ?g .
  ${GYM}
  ?g ?k ?v .
  FILTER(STRSTARTS(STR(?k), "${KEY}"))
}`;

/** Where each gym in the area is: its shape on the map (a point, or the outline of its building). */
export const qGymShapes = (where: { relation: number } | { country: string }) =>
  `${PREFIXES}
SELECT ?g ?w WHERE {
  ${area(where)}
  ?a ogc:sfContains ?g .
  ${GYM}
  ?g geo:hasGeometry/geo:asWKT ?w .
}`;

/** The area's cities, towns and villages, for gyms whose map address has no city. */
export const qTowns = (where: { relation: number } | { country: string }) =>
  `${PREFIXES}
SELECT ?t ?name ?place ?w WHERE {
  ${area(where)}
  ?a ogc:sfContains ?t .
  ?t osmkey:place ?place .
  FILTER(?place IN ("city", "town", "village"))
  ?t osmkey:name ?name ; geo:hasGeometry/geo:asWKT ?w .
}`;

type Binding = Record<string, { type: string; value: string } | undefined>;

/** "https://www.openstreetmap.org/way/42" → { type: "way", id: 42 }. */
export function osmRef(iri: string): { type: string; id: number } | null {
  const m = /^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/(\d+)$/.exec(iri);
  return m ? { type: m[1]!, id: Number(m[2]) } : null;
}

/**
 * A shape's middle: the point itself, or the middle of the box around an outline (gym buildings are small, so that's
 * inside or right beside them). Null when the text has no coordinates.
 */
export function middleOf(wkt: string): { lat: number; lon: number } | null {
  const nums = wkt.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/gi);
  if (!nums || nums.length < 2) return null;
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const lon = Number(nums[i]);
    const lat = Number(nums[i + 1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return { lat: (minLat + maxLat) / 2, lon: (minLon + maxLon) / 2 };
}

/** qRegions' answer as the region elements regionItems reads. */
export const regionsFrom = (rows: Binding[]): OsmElement[] =>
  rows.flatMap((b) => {
    const ref = osmRef(b.r?.value ?? "");
    return ref?.type === "relation" ? [{ type: "region", id: ref.id, tags: { iso: b.iso?.value ?? "", name: b.name?.value ?? "" } }] : [];
  });

/** qGymTags' and qGymShapes' answers as map elements, the way Overpass sends them (tags, and a centre for outlines). */
export function gymsFrom(tags: Binding[], shapes: Binding[]): OsmElement[] {
  const byIri = new Map<string, OsmElement>();
  const get = (iri: string) => {
    let e = byIri.get(iri);
    if (!e) {
      const ref = osmRef(iri);
      if (!ref) return null;
      e = { ...ref, tags: {} };
      byIri.set(iri, e);
    }
    return e;
  };
  for (const b of tags) {
    const e = get(b.g?.value ?? "");
    const k = b.k?.value ?? "";
    if (e && k.startsWith(KEY)) e.tags![k.slice(KEY.length)] = b.v?.value ?? "";
  }
  for (const b of shapes) {
    const iri = b.g?.value ?? "";
    const e = byIri.get(iri);
    const at = middleOf(b.w?.value ?? "");
    if (!e || !at) continue;
    if (e.type === "node") Object.assign(e, at);
    else e.center = at;
  }
  return [...byIri.values()];
}

/** qTowns' answer as the town elements townsOf reads. */
export const townsFrom = (rows: Binding[]): OsmElement[] =>
  rows.flatMap((b) => {
    const ref = osmRef(b.t?.value ?? "");
    const at = middleOf(b.w?.value ?? "");
    if (!ref || !at) return [];
    return [
      {
        type: "town",
        id: ref.id,
        tags: { name: b.name?.value ?? "", place: b.place?.value ?? "", lat: String(at.lat), lon: String(at.lon) },
      },
    ];
  });

/** Asks QLever one query. Rows, or why not (the caller falls back to Overpass). */
export async function askQlever(
  sparql: string,
  fetcher: typeof fetch,
  timeoutMs: number,
): Promise<{ ok: true; rows: Binding[]; ms: number } | { ok: false; detail: string; ms: number }> {
  const t = Date.now();
  try {
    const res = await fetcher(QLEVER, {
      method: "POST",
      headers: {
        "User-Agent": UA,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/sparql-results+json",
      },
      body: `query=${encodeURIComponent(sparql)}`,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      const text = (await res.text().catch(() => "")).replace(/\s+/g, " ").trim();
      return { ok: false, detail: `HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`, ms: Date.now() - t };
    }
    const j = (await res.json().catch(() => null)) as { results?: { bindings?: Binding[] } } | null;
    const rows = j?.results?.bindings;
    if (!Array.isArray(rows)) return { ok: false, detail: "answer wasn't query results", ms: Date.now() - t };
    return { ok: true, rows, ms: Date.now() - t };
  } catch (e) {
    const hung = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return { ok: false, detail: hung ? `no answer in ${(timeoutMs / 1000).toFixed(0)}s` : String(e), ms: Date.now() - t };
  }
}
