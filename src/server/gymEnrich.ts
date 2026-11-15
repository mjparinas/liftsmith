// Filling in a gym's missing details from its own website (Melvin, 2026-11-14: "add all the information possible about
// a gym location … scrape it if you need to, including things like gym hours and phone numbers"; docs/decisions/gyms.md
// "More details per gym"). OpenStreetMap comes first (gymImport.ts); this reads only the website the map links to, never
// a directory or map site (their terms forbid it), and only to fill what's still empty.
//
// One visit per gym: its home page only, with a time limit and a size cap, saying who we are in the user agent.
// robots.txt isn't read (Melvin, 2026-11-14: "ignore robots.txt in the script"): it's one public home page a month. What we read, in order of trust: the page's structured data
// (schema.org JSON-LD: a LocalBusiness, ExerciseGym, HealthClub, SportsActivityLocation or Organization with its
// telephone, email, address and opening hours), then tel:, mailto: and Instagram or Facebook links on the page. An email
// counts only on the gym's own domain, so a web designer's address in the footer isn't taken for the gym's.
//
// A claimed gym is never touched (its owner keeps its details), a field already set is never replaced, and every gym
// read is stamped (`enriched_at`), so a run picks up where the last one stopped and a site is read again at most once
// a month.
import { randomBytes } from "node:crypto";

import { DAYS, formatHours, type Week } from "@/lib/openingHours";

import { query, run } from "./db";
import { clean, cleanEmail, socialUrl, UA } from "./gymPlaces";

export const ENRICH_LIMITS = {
  /** Gyms one request reads. */
  batch: 24,
  /** Sites read at once. */
  parallel: 6,
  /** Each fetch gets this long. */
  fetchMs: 8_000,
  /** Bytes of a page we read; the details are near the top or in the footer of any normal home page. */
  maxBytes: 1_500_000,
  /** Bytes of a site's icon we keep at most, and the fewest that make a real one. */
  iconBytes: 150_000,
  iconMinBytes: 100,
  /** A site is read again after this long. */
  againMs: 30 * 86_400_000,
};

/** The fields a website can fill. */
export interface SiteDetails {
  phone: string;
  email: string;
  hours: string;
  address: string;
  postcode: string;
  instagram: string;
  facebook: string;
}

const EMPTY: SiteDetails = { phone: "", email: "", hours: "", address: "", postcode: "", instagram: "", facebook: "" };

// --- Reading a page ---

const DAY_NAMES: Record<string, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
  mo: 0,
  tu: 1,
  we: 2,
  th: 3,
  fr: 4,
  sa: 5,
  su: 6,
};

const time = (x: unknown) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(typeof x === "string" ? x.trim() : "");
  if (!m) return null;
  const h = Number(m[1]);
  return h <= 24 ? `${String(h).padStart(2, "0")}:${m[2]}` : null;
};

/** schema.org openingHoursSpecification into OpenStreetMap's form ("Mo-Fr 06:00-22:00; Sa,Su 08:00-18:00"), or ''. */
export function hoursFromSpec(spec: unknown): string {
  const list = (Array.isArray(spec) ? spec : [spec]).filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
  const week: Week = DAYS.map(() => []);
  let any = false;
  for (const s of list) {
    const opens = time(s.opens);
    const closes = time(s.closes);
    if (!opens || !closes) continue;
    const range = `${opens}-${closes === "00:00" ? "24:00" : closes}`;
    const days = (Array.isArray(s.dayOfWeek) ? s.dayOfWeek : [s.dayOfWeek])
      .map(
        (d) =>
          DAY_NAMES[
            String(d ?? "")
              .replace(/^https?:\/\/schema\.org\//i, "")
              .toLowerCase()
          ],
      )
      .filter((d): d is number => d !== undefined);
    for (const d of days) {
      if (!week[d]!.includes(range)) week[d]!.push(range);
      any = true;
    }
  }
  return any ? formatHours(week.map((d) => d.sort())) : "";
}

/** schema.org openingHours strings ("Mo-Fr 06:00-22:00"), which use OpenStreetMap's own day names. */
function hoursFromText(x: unknown): string {
  const list = (Array.isArray(x) ? x : [x]).filter((v): v is string => typeof v === "string").map((v) => v.trim());
  const rule =
    /^(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))?(,(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))?)* \d{1,2}:\d{2}-\d{1,2}:\d{2}$/;
  const ok = list.filter((v) => rule.test(v));
  return ok.length && ok.length === list.length ? ok.join("; ") : "";
}

const BUSINESS = /LocalBusiness|ExerciseGym|HealthClub|SportsActivityLocation|SportsClub|Organization|Place|Corporation/i;

/** Every JSON-LD object on the page, @graph entries included. */
function jsonLd(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const walk = (x: unknown) => {
    if (Array.isArray(x)) for (const y of x) walk(y);
    else if (x && typeof x === "object") {
      const o = x as Record<string, unknown>;
      out.push(o);
      if (Array.isArray(o["@graph"])) walk(o["@graph"]);
    }
  };
  for (const m of html.matchAll(/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1]!.trim()));
    } catch {
      // A broken block is skipped; the rest of the page still counts.
    }
  }
  return out;
}

const typeOf = (o: Record<string, unknown>) => (Array.isArray(o["@type"]) ? o["@type"].join(" ") : String(o["@type"] ?? ""));
const str = (x: unknown) => (typeof x === "string" ? x : typeof x === "number" ? String(x) : "");
const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};
const decode = (x: string) =>
  x
    .replace(/&amp;/g, "&")
    .replace(/&#64;|&commat;/g, "@")
    .replace(/%20/g, " ");
/** decodeURIComponent that keeps the text as it is when a site's link has a stray "%" (it throws otherwise). */
export const safeDecode = (x: string) => {
  try {
    return decodeURIComponent(x);
  } catch {
    return x;
  }
};

/** What a gym's home page says about it. `site` is the page's address, for checking an email's domain. */
export function detailsFromHtml(html: string, site: string): SiteDetails {
  const out = { ...EMPTY };
  const domain = hostOf(site);
  const ownEmail = (e: string) => {
    const v = cleanEmail(decode(e));
    if (!v || !domain) return "";
    const at = v.split("@")[1]!;
    return at === domain || at.endsWith(`.${domain}`) || domain.endsWith(`.${at}`) ? v : "";
  };
  for (const o of jsonLd(html)) {
    if (!BUSINESS.test(typeOf(o))) continue;
    out.phone ||= clean(str(o.telephone), 40);
    out.email ||= ownEmail(str(o.email));
    out.hours ||= hoursFromSpec(o.openingHoursSpecification) || hoursFromText(o.openingHours);
    const a = o.address;
    if (a && typeof a === "object" && !Array.isArray(a)) {
      const addr = a as Record<string, unknown>;
      out.address ||= clean(str(addr.streetAddress), 120);
      out.postcode ||= clean(str(addr.postalCode), 20);
    }
    for (const same of Array.isArray(o.sameAs) ? o.sameAs : [o.sameAs]) {
      out.instagram ||= /instagram\.com/i.test(str(same)) ? socialUrl(str(same), "instagram") : "";
      out.facebook ||= /facebook\.com|fb\.com/i.test(str(same)) ? socialUrl(str(same), "facebook") : "";
    }
  }
  // Then the page's own links.
  const tel = /href=["']tel:([^"']+)["']/i.exec(html)?.[1];
  if (!out.phone && tel) out.phone = clean(safeDecode(tel).replace(/[^\d+()\-.\s]/g, ""), 40);
  if (!out.email)
    for (const m of html.matchAll(/href=["']mailto:([^"'?]+)/gi)) {
      out.email = ownEmail(m[1]!);
      if (out.email) break;
    }
  for (const m of html.matchAll(/href=["'](https?:\/\/(?:www\.|m\.)?(?:instagram|facebook)\.com\/[^"']+)["']/gi)) {
    const url = decode(m[1]!);
    if (/instagram\.com/i.test(url)) out.instagram ||= socialUrl(url, "instagram");
    else out.facebook ||= socialUrl(url, "facebook");
  }
  return out;
}

// --- One gym ---

/** Only public web hosts: never an IP address, localhost or an internal name (a map entry could point anywhere). */
export function publicHost(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (u.port && u.port !== "80" && u.port !== "443") return false;
    const h = u.hostname.toLowerCase();
    if (!h.includes(".") || /^[\d.]+$/.test(h) || h.includes(":") || h.startsWith("[")) return false;
    return !/(^|\.)(localhost|local|internal|intranet|lan|home|corp)$/.test(h);
  } catch {
    return false;
  }
}

async function fetchBytes(
  fetcher: typeof fetch,
  url: string,
  accept: string,
  maxBytes = ENRICH_LIMITS.maxBytes,
): Promise<{ status: number; bytes: Uint8Array; type: string; over: boolean } | null> {
  try {
    // Redirects are followed by hand (http to https, to www), each one checked like the first.
    let r: Response | null = null;
    let here = url;
    for (let hop = 0; hop < 4; hop++) {
      if (!publicHost(here)) return null;
      r = await fetcher(here, {
        headers: { "User-Agent": UA, Accept: accept },
        redirect: "manual",
        signal: AbortSignal.timeout(ENRICH_LIMITS.fetchMs),
      });
      const to = r.status >= 300 && r.status < 400 ? r.headers.get("location") : null;
      if (!to) break;
      here = new URL(to, here).toString();
      r = null;
    }
    if (!r) return null;
    const type = r.headers.get("content-type") ?? "";
    if (!r.body) return { status: r.status, bytes: new Uint8Array(0), type, over: false };
    // Read at most maxBytes, then stop.
    const reader = r.body.getReader();
    const parts: Uint8Array[] = [];
    let size = 0;
    let over = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      parts.push(value);
      size += value.length;
      if (size >= maxBytes) {
        over = size > maxBytes;
        break;
      }
    }
    await reader.cancel().catch(() => undefined);
    const all = new Uint8Array(size);
    let at = 0;
    for (const p of parts) {
      all.set(p, at);
      at += p.length;
    }
    return { status: r.status, bytes: all, type, over };
  } catch {
    return null;
  }
}

async function fetchText(
  fetcher: typeof fetch,
  url: string,
  accept: string,
): Promise<{ status: number; text: string; type: string } | null> {
  const r = await fetchBytes(fetcher, url, accept);
  return r && { status: r.status, text: new TextDecoder().decode(r.bytes), type: r.type };
}

// --- The site's icon ---

/** Where a page's icons are, best first: the touch icon (usually 180 px), then the largest declared icon, then
 * /favicon.ico. SVG is left out (it can carry script, and it's served from our own origin). */
export function iconLinks(html: string, site: string): string[] {
  const found: { url: string; size: number }[] = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attr = (name: string) => new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
    const value = (name: string) => {
      const m = attr(name);
      return decode(m?.[2] ?? m?.[3] ?? m?.[4] ?? "").trim();
    };
    const rel = value("rel").toLowerCase();
    if (!/(^|\s)(icon|apple-touch-icon|apple-touch-icon-precomposed)(\s|$)/.test(rel)) continue;
    const href = value("href");
    if (!href || /^data:/i.test(href) || /svg/i.test(value("type")) || /\.svg(\?|#|$)/i.test(href)) continue;
    let url = "";
    try {
      url = new URL(href, site).toString();
    } catch {
      continue;
    }
    const sizes = /(\d+)x\d+/i.exec(value("sizes"));
    const size = sizes ? Number(sizes[1]) : rel.includes("apple-touch-icon") ? 180 : 16;
    found.push({ url, size });
  }
  found.sort((a, b) => b.size - a.size);
  let fallback = "";
  try {
    fallback = new URL("/favicon.ico", site).toString();
  } catch {
    // no fallback
  }
  return [...new Set([...found.map((f) => f.url), fallback].filter(Boolean))].slice(0, 4);
}

/** The image type from its first bytes: PNG, ICO, GIF, JPEG or WebP. Anything else (SVG, HTML) is refused. */
export function imageType(b: Uint8Array): string {
  if (b.length < 12) return "";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x01 && b[3] === 0x00) return "image/x-icon";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "image/webp";
  return "";
}

/** The site's icon, as bytes we're willing to keep and serve, or null. */
async function siteIcon(fetcher: typeof fetch, html: string, site: string): Promise<Uint8Array | null> {
  for (const url of iconLinks(html, site)) {
    const r = await fetchBytes(fetcher, url, "image/*", ENRICH_LIMITS.iconBytes);
    if (!r || r.status >= 400 || r.over || r.bytes.length < ENRICH_LIMITS.iconMinBytes) continue;
    if (imageType(r.bytes)) return r.bytes;
  }
  return null;
}

export interface EnrichOne {
  id: string;
  name: string;
  site: string;
  /** What was filled in, by field, and "icon" when the site's icon was kept. */
  filled: (keyof SiteDetails | "icon")[];
  /** Why nothing was read, when nothing was. */
  skipped: string;
  ms: number;
}

/** Reads one gym's website and fills its empty fields. */
export async function enrichPlace(
  p: { id: string; name: string; website: string; hasIcon?: boolean } & Partial<SiteDetails>,
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<EnrichOne> {
  const started = Date.now();
  const done = async (filled: EnrichOne["filled"], skipped: string, set: Partial<SiteDetails> = {}) => {
    const keys = Object.keys(set) as (keyof SiteDetails)[];
    // Empty fields only, unclaimed gyms only: the statement itself checks both, so a gym claimed meanwhile is safe.
    await run(
      `UPDATE gym_places SET ${keys.map((k) => `${k} = CASE WHEN ${k} = '' THEN ? ELSE ${k} END, `).join("")}enriched_at = ?${
        keys.length ? ", updated_at = ?" : ""
      } WHERE id = ? AND claimed_by = ''`,
      [...keys.map((k) => set[k]!), now, ...(keys.length ? [now] : []), p.id],
    );
    return { id: p.id, name: p.name, site: p.website, filled, skipped, ms: Date.now() - started };
  };
  if (!publicHost(p.website)) return done([], "not a public web address");
  try {
    return await readSite(p, fetcher, now, done);
  } catch (e) {
    // One odd page must never stop the batch, or the same gym would come first and fail every time.
    console.error("gym enrich", p.id, e);
    return done([], "couldn't read the page");
  }
}

async function readSite(
  p: { id: string; website: string; hasIcon?: boolean } & Partial<SiteDetails>,
  fetcher: typeof fetch,
  now: number,
  done: (filled: EnrichOne["filled"], skipped: string, set?: Partial<SiteDetails>) => Promise<EnrichOne>,
): Promise<EnrichOne> {
  const page = await fetchText(fetcher, p.website, "text/html");
  if (!page) return done([], "no answer");
  if (page.status >= 400) return done([], `HTTP ${page.status}`);
  if (!/html/i.test(page.type) && !/<html/i.test(page.text.slice(0, 2000))) return done([], "not a web page");
  const found = detailsFromHtml(page.text, p.website);
  const set: Partial<SiteDetails> = {};
  for (const k of Object.keys(found) as (keyof SiteDetails)[]) if (found[k] && !p[k]) set[k] = found[k];
  const filled: EnrichOne["filled"] = Object.keys(set) as (keyof SiteDetails)[];
  // The site's icon stands in for a logo until an owner adds one: kept only for an unclaimed gym with neither.
  if (!p.hasIcon) {
    const icon = await siteIcon(fetcher, page.text, p.website);
    if (
      icon &&
      (await run(
        `INSERT INTO gym_photos (id, place_id, kind, image, created_at)
         SELECT ?, id, 'icon', ?, ? FROM gym_places WHERE id = ? AND claimed_by = ''
           AND NOT EXISTS (SELECT 1 FROM gym_photos m WHERE m.place_id = ? AND m.kind IN ('logo', 'icon'))`,
        [randomBytes(8).toString("hex"), icon, now, p.id, p.id],
      )) > 0
    )
      filled.push("icon");
  }
  return done(filled, filled.length ? "" : "nothing new on the page", set);
}

// --- A batch, for Admin › Gyms ---

export interface EnrichBatch {
  done: EnrichOne[];
  /** Gyms still waiting for a read. */
  left: number;
}

const NO_ICON = `NOT EXISTS (SELECT 1 FROM gym_photos m WHERE m.place_id = gym_places.id AND m.kind IN ('logo', 'icon'))`;
const WAITING = `FROM gym_places WHERE claimed_by = '' AND hidden = 0 AND website <> '' AND enriched_at < ?
  AND (phone = '' OR email = '' OR hours = '' OR postcode = '' OR address = '' OR instagram = '' OR facebook = '' OR ${NO_ICON})`;

/** Reads the next batch of gyms that have a website and miss something, several sites at once. */
export async function enrichBatch(fetcher: typeof fetch = fetch, now = Date.now()): Promise<EnrichBatch> {
  const since = now - ENRICH_LIMITS.againMs;
  const rows = await query(
    `SELECT id, name, website, phone, email, hours, address, postcode, instagram, facebook, ${NO_ICON} AS no_icon ${WAITING} ORDER BY lifters DESC, enriched_at LIMIT ?`,
    [since, ENRICH_LIMITS.batch],
  );
  const gyms = rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    website: String(r.website),
    phone: String(r.phone),
    email: String(r.email),
    hours: String(r.hours),
    address: String(r.address),
    postcode: String(r.postcode),
    instagram: String(r.instagram),
    facebook: String(r.facebook),
    hasIcon: !Number(r.no_icon),
  }));
  const done: EnrichOne[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(ENRICH_LIMITS.parallel, gyms.length) }, async () => {
      while (next < gyms.length) {
        const g = gyms[next++]!;
        done.push(await enrichPlace(g, fetcher, now));
      }
    }),
  );
  const [left] = await query<{ n: number }>(`SELECT COUNT(*) AS n ${WAITING}`, [since]);
  return { done, left: Number(left?.n ?? 0) };
}
