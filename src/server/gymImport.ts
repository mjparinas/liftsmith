// Importing the world's gyms from OpenStreetMap (staff only; docs/decisions/gyms.md "One button: every gym in the
// world"). Melvin, 2026-11-16: "only import gyms from around the world using openstreetmap … should not overwrite or
// duplicate existing claimed gyms … get as much data from openstreetmap … one button … refreshed for new gyms found
// once a day". The job (gymImportJobs.ts) runs one item at a time per lane, and an item is one of:
//
// - `country:CA` asks OpenStreetMap for the country's regions (provinces, states, Länder: admin level 4 with an
//   ISO 3166-2 code) and splits into one item per region; a country without regions is imported whole.
// - `region:CA:<relation id>:BC` pulls every fitness centre (and rec centre with a gym) inside the region's boundary,
//   with the region's cities, towns and villages, so a gym whose map address has no city gets the nearest one.
// - `new:<ms>` (the daily refresh) asks for every gym added or edited on the map since then, anywhere, and finds the
//   country, region and town of each new one from the map's boundaries around it.
//
// Saving is savePlaces (gymPlaces.ts): keyed on the map's own id, so nothing is listed twice; only what changed is
// written; a claimed gym is never changed; and a new map gym next to a claimed or lifter-added gym of the same name is
// linked to that gym instead of listed again.
//
// Map servers (2026-11-14): every request's outcome is kept (`attempts`), the next import tries the server that has
// answered most lately first and a server that mostly hangs only after a busy round, and when every server says it's
// busy the import waits (8 s, doubling) and asks again instead of failing. Every item leaves a row in gym_imports with a
// step-by-step log (timings, which server, what it said), in the job's debug log.
//
// QLever first (2026-11-18, gymQlever.ts): countries and regions are asked of QLever's copy of the map, which answers
// a region in seconds where Overpass took minutes or said it was busy; Overpass is only asked when QLever can't answer.
import { randomBytes } from "node:crypto";

import { SHORT_REGION } from "@/lib/regions";

import { query, run } from "./db";
import { cityName, km } from "./gymAddress";
import { clean, deletedRefs, placesFromOsm, REC_NAME, savePlaces, UA, type Area, type OsmElement, type OsmSkips } from "./gymPlaces";
import { askQlever, gymsFrom, qGymShapes, qGymTags, QLEVER_HOST, qRegions, qTowns, regionsFrom, townsFrom } from "./gymQlever";

export const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export const IMPORT_LIMITS = {
  /** One item must finish inside this, with room to save. */
  budgetMs: 300_000,
  /** One Overpass server gets at most this long before the next is tried. */
  serverMs: 150_000,
  /** What Overpass is told, in seconds, so a busy server gives up on its own before our limit. */
  overpassTimeout: 140,
  /** The first pause when every map server is busy; it doubles each round. */
  waitMs: 8_000,
  /** Rounds over the map servers at most (8 + 16 + 32 + 64 seconds of waiting between five). */
  rounds: 5,
  /** How far back recent imports count when choosing which map server to try first. */
  healthMs: 30 * 60_000,
  /** How long import rows (and their logs) are kept. */
  keepMs: 90 * 86_400_000,
  /** New gyms located in one Overpass request (the daily refresh). */
  locateBatch: 60,
  /** One QLever query gets at most this long before the import falls back to Overpass. */
  qleverMs: 60_000,
};

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
      /** A country with regions: the items to import instead (the job adds them). */
      split?: string[];
    }
  | { ok: false; id: string; error: "where" | "map"; detail: string; ms: number; log: string[] };

/** "  Langley,  BC " → "langley, bc": one key per item, whatever the spacing or case. */
export const importKey = (where: string) =>
  clean(where, 120)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ");

const host = (url: string) => new URL(url).host;
const secs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

/** How one request to a map server went. Busy answers (429, 502, 503, 504) are worth another try a little later. */
export type Outcome = "ok" | "busy" | "timeout" | "error";
export interface Attempt {
  host: string;
  outcome: Outcome;
  ms: number;
}
export type Health = Record<string, Record<Outcome, number>>;

const zero = (): Record<Outcome, number> => ({ ok: 0, busy: 0, timeout: 0, error: 0 });

/** How each map server did in the imports of the last half hour (their `attempts`). */
export async function serverHealth(now: number): Promise<Health> {
  const rows = await query("SELECT attempts FROM gym_imports WHERE at > ? AND attempts != '' ORDER BY at DESC LIMIT 80", [
    now - IMPORT_LIMITS.healthMs,
  ]);
  const health: Health = {};
  for (const row of rows) {
    let list: Attempt[] = [];
    try {
      list = JSON.parse(String(row.attempts)) as Attempt[];
    } catch {
      continue;
    }
    for (const a of Array.isArray(list) ? list : []) {
      if (!a || typeof a.host !== "string" || !(a.outcome in zero())) continue;
      (health[a.host] ??= zero())[a.outcome]++;
    }
  }
  return health;
}

/**
 * The servers in the order to try them. The one that has answered most lately goes first; a server that mostly hangs
 * lately is "slow" and is only tried once the others have been busy for a round, because each try of it costs the full
 * time limit (on 2026-11-14 one hung 39 times in an hour). Parallel imports pass a different `start`, which spreads them
 * over the healthy servers so two cities don't queue on one.
 */
export function planServers(health: Health = {}, start = 0): { order: string[]; slow: Set<string> } {
  const score = (url: string) => {
    const h = health[host(url)] ?? zero();
    return h.ok * 2 - h.timeout * 3 - h.busy * 0.5 - h.error;
  };
  const ranked = OVERPASS.map((url, i) => ({ url, i, s: score(url) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.url);
  const slow = new Set(
    ranked.filter((url) => {
      const h = health[host(url)] ?? zero();
      return h.timeout >= 2 && h.timeout > h.ok;
    }),
  );
  const fast = ranked.filter((url) => !slow.has(url));
  const n = Math.abs(Math.trunc(start));
  const spread = fast.length ? fast.map((_, i) => fast[(i + n) % fast.length]!) : [];
  return { order: [...spread, ...ranked.filter((url) => slow.has(url))], slow };
}

/** What's left of an item's time: its own budget, or the worker's, whichever ends first. */
const timeLeft = (r: Run, opts: ImportOptions) =>
  Math.min(IMPORT_LIMITS.budgetMs - (Date.now() - r.started), (opts.until ?? Infinity) - Date.now());

/** Overpass answers some failures with a 200 and a "remark" instead of an error status. */
const overpassFailure = (remark: unknown) =>
  typeof remark === "string" && /runtime error|timed out|out of memory|too busy|rate_limited/i.test(remark) ? remark : "";

export interface ImportOptions {
  /** Which Overpass server to try first (parallel imports pass different ones). */
  server?: number;
  /** How to wait between rounds (tests pass a quick one). */
  sleep?: (ms: number) => Promise<void>;
  /** Whether to ask QLever first (gymQlever.ts); on unless switched off. */
  qlever?: boolean;
  /** When the item must be done by (the worker's time), if sooner than its own budget. */
  until?: number;
}

/** One import's own state: its log, its time, and what each map server did. */
interface Run {
  started: number;
  log: string[];
  attempts: Attempt[];
  say: (line: string) => void;
}

/**
 * Asks the map servers one Overpass query, in the order planServers gives, waiting and asking again while they're all
 * busy, inside what's left of the import's time. Returns the map elements and the server that answered.
 */
export async function askOverpass(
  ql: string,
  r: Run,
  fetcher: typeof fetch,
  now: number,
  opts: ImportOptions = {},
): Promise<{ ok: true; elements: OsmElement[]; server: string } | { ok: false; detail: string }> {
  const body = `data=${encodeURIComponent(ql)}`;
  // The last thing each server said, for the error line.
  const problems = new Map<string, string>();
  const health = await serverHealth(now).catch(() => ({}) as Health);
  const { order, slow } = planServers(health, opts.server);
  const lately = Object.entries(health)
    .map(([h, c]) => `${h} ${c.ok} ok, ${c.busy} busy, ${c.timeout} hung`)
    .join("; ");
  r.say(
    `map servers in order: ${order.map(host).join(", ")}${slow.size ? ` (${[...slow].map(host).join(", ")} only after a busy round)` : ""}${lately ? `; last 30 min: ${lately}` : ""}`,
  );
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((ok) => setTimeout(ok, ms)));
  // Servers that hung or failed outright aren't asked again in this import; busy ones are, after a pause.
  const dropped = new Set<string>();
  const fastLeft = () => order.some((u) => !slow.has(u) && !dropped.has(u));
  let outOfTime = false;
  for (let round = 0; !outOfTime && round < IMPORT_LIMITS.rounds; round++) {
    for (const url of order) {
      if (dropped.has(url) || (round === 0 && slow.has(url) && fastLeft())) continue;
      const left = timeLeft(r, opts);
      if (left < 10_000) {
        r.say("out of time for another map server");
        outOfTime = true;
        break;
      }
      const name = host(url);
      const t = Date.now();
      const limit = Math.min(IMPORT_LIMITS.serverMs, left);
      const note = (outcome: Outcome, why: string, line: string) => {
        r.attempts.push({ host: name, outcome, ms: Date.now() - t });
        if (outcome !== "busy") dropped.add(url);
        problems.set(name, why);
        r.say(line);
      };
      let res: Response | null = null;
      try {
        res = await fetcher(url, {
          method: "POST",
          headers: { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded" },
          body,
          signal: AbortSignal.timeout(limit),
        });
      } catch (e) {
        const hung = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
        const why = hung ? `no answer in ${secs(limit)}` : String(e);
        note(hung ? "timeout" : "error", why, `${name} ${why}`);
        continue;
      }
      if (!res.ok) {
        const text = (await res.text().catch(() => ""))
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const why = `HTTP ${res.status}${res.status === 429 ? " (too many requests)" : res.status >= 502 && res.status <= 504 ? " (server busy)" : ""}`;
        const busy = res.status === 429 || (res.status >= 502 && res.status <= 504);
        note(busy ? "busy" : "error", why, `${name} ${why} after ${secs(Date.now() - t)}${text ? `: ${text.slice(0, 200)}` : ""}`);
        continue;
      }
      const j = (await res.json().catch(() => null)) as { elements?: OsmElement[]; remark?: string } | null;
      const remark = overpassFailure(j?.remark);
      if (!j?.elements || remark) {
        const why = remark ? `error: ${remark.slice(0, 200)}` : "answer wasn't map data";
        // Overpass running out of time or memory on this query is a slow server, not a busy one.
        note(remark && /timed out|out of memory/i.test(remark) ? "timeout" : "error", why, `${name} ${why} after ${secs(Date.now() - t)}`);
        continue;
      }
      r.attempts.push({ host: name, outcome: "ok", ms: Date.now() - t });
      r.say(`${name} ${secs(Date.now() - t)}: ${j.elements.length} map elements`);
      return { ok: true, elements: j.elements, server: name };
    }
    if (outOfTime || order.every((u) => dropped.has(u)) || round + 1 >= IMPORT_LIMITS.rounds) break;
    // Every server still in the running said it was busy: wait (longer each round) and ask again.
    const wait = Math.min(IMPORT_LIMITS.waitMs * 2 ** round, timeLeft(r, opts) - 20_000);
    if (wait <= 0) {
      r.say("out of time to wait for a busy map server");
      break;
    }
    r.say(`every map server busy; asking again in ${secs(wait)}`);
    await sleep(wait);
  }
  return { ok: false, detail: [...problems].map(([h, why]) => `${h}: ${why}`).join("; ") || "No map server answered in time." };
}

// ---------- The queries ----------

/** What counts as a gym on the map: fitness centres, and sports, rec and community centres whose name says gym. */
const GYM_FILTERS = [
  `nwr["leisure"="fitness_centre"]`,
  `nwr["leisure"="sports_centre"]["name"]`,
  `nwr["amenity"="community_centre"]["name"~"${REC_NAME}",i]`,
];
/** The places a gym's city can be named after (never a suburb or a hamlet). */
const TOWNS = `["place"~"^(city|town|village)$"]`;
/** A town as a small element: its name, kind and position (`convert` keeps Overpass from sending every name:xx tag). */
const TOWN_OUT = `convert town ::id=id(),name=t["name"],place=t["place"],lat=lat(),lon=lon();out;`;

const head = (timeout = IMPORT_LIMITS.overpassTimeout) => `[out:json][timeout:${timeout}];`;
const code = (cc: string) => cc.replace(/[^A-Z]/g, "").slice(0, 2);

/** A country's regions: admin level 4 boundaries with an ISO 3166-2 code that starts with the country's. */
export const regionsQuery = (cc: string) =>
  `${head()}rel["ISO3166-2"~"^${code(cc)}-"]["admin_level"="4"]["boundary"="administrative"];convert region ::id=id(),iso=t["ISO3166-2"],name=t["name"];out;`;

/** The area to search: a region's boundary by its relation id, or a whole country by its code. */
export const areaOf = (where: { relation: number } | { country: string }) =>
  "relation" in where
    ? `area(${3_600_000_000 + Math.trunc(where.relation)})->.a;`
    : `(area["ISO3166-1"="${code(where.country)}"]["admin_level"="2"];area["ISO3166-1:alpha2"="${code(where.country)}"]["admin_level"="2"];)->.a;`;

/** Every gym in an area, then the area's towns. */
export const gymsQuery = (area: string) =>
  `${head()}${area}(${GYM_FILTERS.map((f) => `${f}(area.a);`).join("")});out center tags;node${TOWNS}(area.a);${TOWN_OUT}`;

/** Every gym added or edited on the map since `since`, anywhere in the world (the daily refresh). */
export const newGymsQuery = (since: number) => {
  const iso = new Date(since).toISOString().replace(/\.\d+Z$/, "Z");
  return `${head()}(${GYM_FILTERS.map((f) => `${f}(newer:"${iso}");`).join("")});out center tags;`;
};

/**
 * Where each of these points is: its country and region (the boundaries around it) and the towns within 15 km, each
 * point's answers after a marker naming it (`make m i=…`), all in one request.
 */
export const locateQuery = (points: { lat: number; lon: number }[]) =>
  head() +
  points
    .map(
      (p, i) =>
        `make m i="${i}";out;is_in(${p.lat},${p.lon})->.a;area.a["admin_level"~"^(2|4)$"]["boundary"="administrative"];` +
        `convert boundary ::id=id(),level=t["admin_level"],cc=t["ISO3166-1"],cc2=t["ISO3166-1:alpha2"],iso=t["ISO3166-2"],name=t["name"];out;` +
        `node(around:15000,${p.lat},${p.lon})${TOWNS};${TOWN_OUT}`,
    )
    .join("");

// ---------- Reading the answers ----------

export interface Town {
  name: string;
  place: string;
  lat: number;
  lon: number;
}

/** Towns in an answer, whether Overpass sent them converted (`town`) or as plain nodes. */
export function townsOf(elements: OsmElement[]): Town[] {
  const out: Town[] = [];
  for (const e of elements) {
    const t = e.tags ?? {};
    if (e.type !== "town" && !(e.type === "node" && t.place)) continue;
    const lat = Number(t.lat ?? e.lat);
    const lon = Number(t.lon ?? e.lon);
    const name = cityName(t.name);
    if (name && Number.isFinite(lat) && Number.isFinite(lon)) out.push({ name, place: String(t.place ?? ""), lat, lon });
  }
  return out;
}

/** How far each kind of place reaches, in km: a gym this close belongs to it. */
const REACH: Record<string, number> = { city: 15, town: 8, village: 4 };

/**
 * The town a gym is in, from the towns around it: the nearest one whose reach covers it (a city reaches further than a
 * village, so a gym on a city's edge isn't filed under the hamlet next door), else simply the nearest.
 */
export function nearestTown(towns: Town[], lat: number, lon: number): string {
  let best: { name: string; score: number } | null = null;
  let nearest: { name: string; d: number } | null = null;
  for (const t of towns) {
    const d = km({ lat, lon }, t);
    if (!nearest || d < nearest.d) nearest = { name: t.name, d };
    const reach = REACH[t.place] ?? 4;
    if (d <= reach && (!best || d / reach < best.score)) best = { name: t.name, score: d / reach };
  }
  return best?.name ?? nearest?.name ?? "";
}

/** A region as gym pages name it: the code for Canada, the US and Australia ("BC"), else the map's own name. */
export function regionLabel(cc: string, iso: string, name: string): string {
  const short = /^(?:CA|US|AU)-([A-Z]{2,3})$/.exec(iso)?.[1];
  if (short && iso.startsWith(`${cc}-`)) return short;
  return SHORT_REGION[name] ?? clean(name, 60);
}

/** The country's regions from regionsQuery's answer, as items to import. */
export function regionItems(cc: string, elements: OsmElement[]): string[] {
  const out = new Map<number, string>();
  for (const e of elements) {
    const t = e.tags ?? {};
    const iso = String(t.iso ?? t["ISO3166-2"] ?? "");
    if (!e.id || !iso.startsWith(`${cc}-`)) continue;
    const label = regionLabel(cc, iso, String(t.name ?? "")).replace(/:/g, " ");
    if (label) out.set(e.id, `region:${cc}:${e.id}:${label}`);
  }
  return [...out.values()];
}

/** Gym elements in an answer (towns, markers and boundaries are for working out where they are). */
const gymsOf = (elements: OsmElement[]) => elements.filter((e) => e.type === "node" || e.type === "way" || e.type === "relation");
const isGym = (e: OsmElement) => !!(e.tags?.leisure || e.tags?.amenity);

export interface Located {
  country: string;
  region: string;
  city: string;
}

/** locateQuery's answer, point by point. A point outside every country (at sea, say) has no answer. */
export function locatedOf(elements: OsmElement[], points: { lat: number; lon: number }[]): (Located | null)[] {
  const groups: OsmElement[][] = points.map(() => []);
  let at = -1;
  for (const e of elements) {
    if (e.type === "m") at = Number(e.tags?.i ?? -1);
    else if (at >= 0 && at < groups.length) groups[at]!.push(e);
  }
  return groups.map((g, i) => {
    const country = g.find((e) => e.tags?.level === "2");
    const cc = clean(country?.tags?.cc || country?.tags?.cc2, 2).toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) return null;
    const region = g.find((e) => e.tags?.level === "4");
    const p = points[i]!;
    return {
      country: cc,
      region: region ? regionLabel(cc, String(region.tags?.iso ?? ""), String(region.tags?.name ?? "")) : "",
      city: nearestTown(townsOf(g), p.lat, p.lon),
    };
  });
}

// ---------- One item ----------

/** The admin setting that remembers how far the daily refresh got. */
export const SINCE_KEY = "gym_refresh_since";

export function describeItem(item: string): string {
  const [kind, cc, , ...rest] = item.split(":");
  if (kind === "country") return `country ${cc ?? "?"}`;
  if (kind === "region") return `${rest.join(":") || "?"}, ${cc ?? "?"}`;
  if (kind === "new") return `new on the map since ${new Date(Number(cc)).toISOString().slice(0, 16).replace("T", " ")} UTC`;
  return item;
}

/** Asks QLever, logging how it went. Null when it can't answer, so the caller asks Overpass instead. */
async function qlever(sparql: string, what: string, r: Run, fetcher: typeof fetch, opts: ImportOptions) {
  const limit = Math.min(IMPORT_LIMITS.qleverMs, timeLeft(r, opts) - 20_000);
  if (limit < 5_000) return null;
  const a = await askQlever(sparql, fetcher, limit);
  r.say(
    a.ok ? `${QLEVER_HOST} ${secs(a.ms)}: ${a.rows.length} rows of ${what}` : `${QLEVER_HOST} ${what}: ${a.detail} after ${secs(a.ms)}`,
  );
  return a.ok ? a.rows : null;
}

/**
 * An area's gyms (and its towns, when a gym's address has no city) from QLever. Null when QLever can't answer, or
 * when it finds neither a gym nor a town in the area, which means it doesn't know the area: Overpass is asked then.
 */
async function qleverArea(
  where: { relation: number } | { country: string },
  r: Run,
  fetcher: typeof fetch,
  opts: ImportOptions,
): Promise<OsmElement[] | null> {
  const [tags, shapes] = await Promise.all([
    qlever(qGymTags(where), "gym tags", r, fetcher, opts),
    qlever(qGymShapes(where), "gym places", r, fetcher, opts),
  ]);
  if (!tags || !shapes) return null;
  const gyms = gymsFrom(tags, shapes);
  const noCity = gyms.some((g) => !cityName(g.tags?.["addr:city"]) && !cityName(g.tags?.["is_in:city"]));
  if (!noCity && gyms.length) return gyms;
  const towns = await qlever(qTowns(where), "towns", r, fetcher, opts);
  if (!towns) return null;
  if (!gyms.length && !towns.length) {
    r.say(`${QLEVER_HOST} found nothing at all in this area; asking Overpass`);
    return null;
  }
  return [...gyms, ...townsFrom(towns)];
}

/** Imports one item of a job (see the top of this file). Every item leaves a row in gym_imports with its log. */
export async function importItem(
  item: string,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
  opts: ImportOptions = {},
): Promise<ImportResult> {
  const id = randomBytes(8).toString("hex");
  const r: Run = {
    started: Date.now(),
    log: [],
    attempts: [],
    say: (line) => r.log.push(`+${secs(Date.now() - r.started)} ${line}`),
  };
  const key = importKey(item);
  const label = describeItem(item);
  const finish = async (res: ImportResult) => {
    await record(res, key, label, now, r.attempts).catch(() => undefined);
    return res;
  };
  const fail = (error: "where" | "map", detail: string) => finish({ ok: false, id, error, detail, ms: Date.now() - r.started, log: r.log });
  const [kind, rawCc = "", rawRel = "", ...rest] = item.split(":");
  const cc = code(rawCc.toUpperCase());
  r.say(`import ${label}`);
  const save = async (drafts: ReturnType<typeof placesFromOsm>, skipped: OsmSkips, server: string, split?: string[]) => {
    r.say(
      `kept ${drafts.length}; left out ${skipped.unnamed} unnamed, ${skipped.private} private, ${skipped.notGym} without a gym, ${skipped.duplicate} repeated`,
    );
    const saved = await savePlaces(drafts, now);
    r.say(
      `database read ${secs(saved.readMs)}, wrote ${saved.statements} rows in ${secs(saved.writeMs)}: ${saved.added} new, ${saved.updated} changed, ${saved.unchanged} unchanged, ${saved.kept} claimed or added by lifters left alone`,
    );
    return finish({
      ok: true,
      id,
      area: label,
      found: drafts.length,
      added: saved.added,
      updated: saved.updated,
      unchanged: saved.unchanged,
      kept: saved.kept,
      skipped,
      server,
      ms: Date.now() - r.started,
      log: r.log,
      ...(split ? { split } : {}),
    });
  };
  const skipped = (): OsmSkips => ({ unnamed: 0, private: 0, notGym: 0, duplicate: 0 });

  if (kind === "country" || kind === "region") {
    if (!/^[A-Z]{2}$/.test(cc)) return fail("where", "No country code.");
    let where: { relation: number } | { country: string };
    let region = "";
    const fast = opts.qlever !== false;
    if (kind === "country") {
      const quick = fast ? await qlever(qRegions(cc), "regions", r, fetcher, opts) : null;
      const regions = quick
        ? { ok: true as const, elements: regionsFrom(quick), server: QLEVER_HOST }
        : await askOverpass(regionsQuery(cc), r, fetcher, now, opts);
      if (!regions.ok) return fail("map", regions.detail);
      const items = regionItems(cc, regions.elements);
      r.say(`${items.length} regions with a code`);
      if (items.length >= 2) {
        const nothing = skipped();
        return finish({
          ok: true,
          id,
          area: label,
          found: 0,
          added: 0,
          updated: 0,
          unchanged: 0,
          kept: 0,
          skipped: nothing,
          server: regions.server,
          ms: Date.now() - r.started,
          log: r.log,
          split: items,
        });
      }
      // One region (or none): the whole country is one area.
      region = items[0]?.split(":").slice(3).join(":") ?? "";
      where = { country: cc };
    } else {
      const relation = Number(rawRel);
      if (!Number.isSafeInteger(relation) || relation <= 0) return fail("where", "No region id.");
      region = rest.join(":");
      where = { relation };
    }
    const quick = fast ? await qleverArea(where, r, fetcher, opts) : null;
    const answer = quick
      ? { ok: true as const, elements: quick, server: QLEVER_HOST }
      : await askOverpass(gymsQuery(areaOf(where)), r, fetcher, now, opts);
    if (!answer.ok) return fail("map", answer.detail);
    const towns = townsOf(answer.elements);
    r.say(`${towns.length} towns to name gyms without a city after`);
    const sk = skipped();
    const home: Area = { city: "", region, country: cc };
    const drafts = placesFromOsm(gymsOf(answer.elements).filter(isGym), home, sk, (lat, lon) => nearestTown(towns, lat, lon));
    // A gym with no city on the map and no town anywhere in its region has no page to go on.
    const located = drafts.filter((d) => d.city);
    if (located.length < drafts.length) r.say(`${drafts.length - located.length} left out: no town on the map near them`);
    return save(located, sk, answer.server);
  }

  if (kind === "new") {
    const since = Number(rawCc);
    if (!Number.isFinite(since) || since <= 0) return fail("where", "No date to look from.");
    const asked = Date.now();
    const answer = await askOverpass(newGymsQuery(since), r, fetcher, now, opts);
    if (!answer.ok) return fail("map", answer.detail);
    const sk = skipped();
    // Gyms already listed keep their country, region and city (savePlaces); new ones are found on the map first.
    const all = placesFromOsm(gymsOf(answer.elements).filter(isGym), { city: "", region: "", country: "" }, sk);
    const known = new Set<string>();
    for (let i = 0; i < all.length; i += 400) {
      const part = all.slice(i, i + 400).map((d) => d.ref);
      for (const row of await query(`SELECT source_ref FROM gym_places WHERE source_ref IN (${part.map(() => "?").join(",")})`, part))
        known.add(String(row.source_ref));
    }
    // Gyms staff deleted aren't new: they're never looked up again, and savePlaces skips them.
    const gone = await deletedRefs(all.map((d) => d.ref));
    const fresh = all.filter((d) => !known.has(d.ref) && !gone.has(d.ref));
    r.say(`${all.length} gyms changed on the map, ${fresh.length} of them new to us`);
    const placed: typeof all = all.filter((d) => known.has(d.ref));
    let server = answer.server;
    for (let i = 0; i < fresh.length; i += IMPORT_LIMITS.locateBatch) {
      const part = fresh.slice(i, i + IMPORT_LIMITS.locateBatch);
      const where = await askOverpass(locateQuery(part), r, fetcher, now, opts);
      if (!where.ok) {
        // Save what's located so far; the item runs again later and finds the rest still new.
        if (placed.length) await savePlaces(placed, now);
        return fail("map", where.detail);
      }
      server = where.server;
      const found = locatedOf(where.elements, part);
      part.forEach((d, k) => {
        const at = found[k];
        if (!at || !(d.city || at.city)) {
          sk.notGym++;
          return;
        }
        placed.push({
          ...d,
          country: d.country || at.country,
          region: d.region || at.region,
          city: d.city || at.city,
          guessed: !d.city,
        });
      });
    }
    const res = await save(placed, sk, server);
    // Next time, look from a little before this request (the map servers lag the map by a few minutes).
    await run(
      `INSERT INTO admin_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [SINCE_KEY, String(asked - 3_600_000), Date.now()],
    );
    return res;
  }
  return fail("where", `Not an import item: ${item.slice(0, 80)}`);
}

async function record(r: ImportResult, key: string, label: string, now: number, attempts: Attempt[]) {
  await run(
    `INSERT INTO gym_imports (id, query, area, scope, ok, error, found, added, updated, unchanged, kept, server, ms, log, attempts, at)
     VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.id,
      key,
      label,
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
      attempts.length ? JSON.stringify(attempts) : "",
      now,
    ],
  );
  await run("DELETE FROM gym_imports WHERE at < ?", [now - IMPORT_LIMITS.keepMs]);
}
