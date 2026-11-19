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
// a month. It runs as the import job's second step (gymImportJobs.ts, `enrichBatch`), walking the `gym_places_web`
// index; what it can't find goes to the AI step (gymAutoFill.ts).
import { randomBytes } from "node:crypto";

import { DAYS, formatHours, type Week } from "@/lib/openingHours";

import { batch, query, run } from "./db";
import { km, postcodeFor, sameCity, tidyAddress } from "./gymAddress";
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

/** Where the gym is, from the map, so an address on its website can be checked against it. */
export interface Near {
  city?: string;
  region?: string;
  country?: string;
  lat?: number;
  lon?: number;
}

/** An address a page gives, with whatever it says about where that is. */
interface Found {
  street: string;
  postcode: string;
  locality: string;
  lat?: number;
  lon?: number;
  /** Text found next to the gym's city name (an <address> tag, the footer), not in marked-up data. */
  loose?: boolean;
}

const plain = (x: string) =>
  decode(x)
    .replace(/<br\s*\/?>|<\/(?:p|div|li|h[1-6]|tr|td|section|address)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/[ \t]+/g, " ");

/** A street address worth keeping: a letter and a number, not a phone number, link or email. */
export function looksLikeStreet(x: string): boolean {
  const v = x.trim();
  if (v.length < 5 || v.length > 120) return false;
  if (/@|https?:|www\.|\.com\b/i.test(v)) return false;
  if (!/\p{L}/u.test(v) || !/\d/.test(v)) return false;
  // A phone number with a word or two around it ("Call 604-555-0199").
  if ((v.match(/\d/g) ?? []).length >= 9 && !/\d+\s+\p{L}{3,}/u.test(v.replace(/[\d\s()+.-]{9,}/g, ""))) return false;
  return true;
}

/** PostalAddress objects (or a plain address string) from one JSON-LD item, with its geo when it has one. */
function ldAddresses(o: Record<string, unknown>): Found[] {
  const geo = (o.geo && typeof o.geo === "object" ? o.geo : {}) as Record<string, unknown>;
  const lat = Number(geo.latitude);
  const lon = Number(geo.longitude);
  const at = Number.isFinite(lat) && Number.isFinite(lon) && (lat || lon) ? { lat, lon } : {};
  const out: Found[] = [];
  const loc = o.location && typeof o.location === "object" ? (o.location as Record<string, unknown>).address : undefined;
  for (const a of [o.address, loc].flatMap((x) => (Array.isArray(x) ? x : [x]))) {
    if (typeof a === "string") {
      const parts = a.split(",").map((p) => p.trim());
      out.push({ street: parts[0] ?? "", postcode: "", locality: parts[1] ?? "", ...at });
    } else if (a && typeof a === "object") {
      const addr = a as Record<string, unknown>;
      out.push({
        street: str(addr.streetAddress),
        postcode: str(addr.postalCode),
        locality: str(addr.addressLocality),
        ...at,
      });
    }
  }
  return out;
}

/** schema.org microdata (itemprop="streetAddress" and friends), in page order. */
function microdata(html: string): Found[] {
  const prop = (name: string) =>
    [
      ...html.matchAll(
        new RegExp(`<([a-z0-9]+)[^>]*itemprop=["']${name}["'][^>]*?(?:content=["']([^"']*)["'][^>]*)?>([\\s\\S]*?)<\\/\\1>`, "gi"),
      ),
    ].map((m) =>
      plain(m[2] || m[3] || "")
        .replace(/\s+/g, " ")
        .trim(),
    );
  const streets = prop("streetAddress");
  const codes = prop("postalCode");
  const towns = prop("addressLocality");
  return streets.map((street, i) => ({ street, postcode: codes[i] ?? "", locality: towns[i] ?? "" }));
}

/**
 * Addresses written out in an <address> tag or the footer, kept only when the gym's own city is named right after
 * them ("100 Main St, Langley, BC V2Y 1A1"), so another branch or the web designer's address isn't taken.
 */
function looseAddresses(html: string, near: Near): Found[] {
  if (!near.city) return [];
  const blocks = [
    ...[...html.matchAll(/<address\b[^>]*>([\s\S]*?)<\/address>/gi)].map((m) => m[1]!),
    ...[...html.matchAll(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gi)].map((m) => m[1]!),
  ];
  const out: Found[] = [];
  for (const b of blocks) {
    const lines = plain(b)
      .split(/\n|\s{2,}|\s[|·•]\s/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      // The city on the same line after a comma, or on the next line.
      const line = lines[i]!;
      const parts = line.split(",").map((p) => p.trim());
      const at = parts.findIndex((p, j) => j > 0 && startsWithCity(p, near.city!));
      if (at > 0) {
        out.push({
          street: parts.slice(0, at).join(", "),
          postcode: postcodeIn(parts.slice(at).join(" "), near.country),
          locality: near.city,
          loose: true,
        });
        continue;
      }
      const next = lines[i + 1];
      if (next && startsWithCity(next, near.city))
        out.push({ street: line, postcode: postcodeIn(next, near.country), locality: near.city, loose: true });
    }
  }
  return out;
}

const startsWithCity = (text: string, city: string) => {
  const head = text.split(/[,\d]/)[0]!.trim();
  return !!head && sameCity(head, city);
};

/** The first thing in a bit of text that's a postcode for the country. */
function postcodeIn(text: string, country = ""): string {
  for (const m of text.matchAll(/[A-Z]\d[A-Z] ?\d[A-Z]\d|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|\d{3}-\d{4}|\d{4,6}(?:-\d{4})?/gi)) {
    const v = postcodeFor(m[0], country);
    if (v) return v;
  }
  return "";
}

/**
 * The page's address for this gym: marked-up data first, then text next to its city. One that names another city, or
 * whose map position is more than 15 km from the gym's, is someone else's (a chain's head office, another branch).
 * When the page lists several addresses and nothing says which is this gym's, none is taken.
 */
export function pickAddress(found: Found[], near: Near): { address: string; postcode: string } {
  const fits = found
    .map((f) => ({ ...f, street: tidyAddress(f.street, { city: near.city, region: near.region, postcode: f.postcode }) }))
    .filter((f) => looksLikeStreet(f.street))
    .filter((f) => !(near.city && f.locality && !sameCity(f.locality, near.city)))
    .filter(
      (f) =>
        !(
          near.lat !== undefined &&
          near.lon !== undefined &&
          f.lat !== undefined &&
          f.lon !== undefined &&
          km(f as { lat: number; lon: number }, near as { lat: number; lon: number }) > 15
        ),
    );
  const marked = fits.filter((f) => !f.loose);
  const pool = marked.length ? marked : fits;
  const streets = [...new Set(pool.map((f) => f.street.toLowerCase()))];
  if (streets.length !== 1) return { address: "", postcode: "" };
  const best = pool[0]!;
  const postcode = pool.map((f) => postcodeFor(f.postcode, near.country)).find(Boolean) ?? "";
  return { address: best.street, postcode };
}

/** What a gym's home page says about it. `site` is the page's address, for checking an email's domain; `near` is
 * where the map has the gym, for checking an address. */
/** An email address only when it's on the gym's own domain (never the web designer's in the footer), else ''. */
export function siteEmail(e: string, site: string): string {
  const domain = hostOf(site);
  const v = cleanEmail(e);
  if (!v || !domain) return "";
  const at = v.split("@")[1]!;
  return at === domain || at.endsWith(`.${domain}`) || domain.endsWith(`.${at}`) ? v : "";
}

export function detailsFromHtml(html: string, site: string, near: Near = {}): SiteDetails {
  const out = { ...EMPTY };
  const addresses: Found[] = [];
  const ownEmail = (e: string) => siteEmail(decode(e), site);
  for (const o of jsonLd(html)) {
    if (!BUSINESS.test(typeOf(o))) continue;
    out.phone ||= clean(str(o.telephone), 40);
    out.email ||= ownEmail(str(o.email));
    out.hours ||= hoursFromSpec(o.openingHoursSpecification) || hoursFromText(o.openingHours);
    addresses.push(...ldAddresses(o));
    for (const same of Array.isArray(o.sameAs) ? o.sameAs : [o.sameAs]) {
      out.instagram ||= /instagram\.com/i.test(str(same)) ? socialUrl(str(same), "instagram") : "";
      out.facebook ||= /facebook\.com|fb\.com/i.test(str(same)) ? socialUrl(str(same), "facebook") : "";
    }
  }
  const picked = pickAddress([...addresses, ...microdata(html), ...looseAddresses(html, near)], near);
  out.address = clean(picked.address, 120);
  out.postcode = clean(picked.postcode, 20);
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

export async function fetchText(
  fetcher: typeof fetch,
  url: string,
  accept: string,
  maxBytes?: number,
): Promise<{ status: number; text: string; type: string } | null> {
  const r = await fetchBytes(fetcher, url, accept, maxBytes);
  return r && { status: r.status, text: new TextDecoder().decode(r.bytes), type: r.type };
}

// --- The site's icon ---
//
// Melvin, 2026-11-19: "is it possible find higher resolution icons from the favicon? some websites have iphone / ios /
// tablet resolution icons". A gym's logo is drawn at 64 px, so a 16 or 32 px favicon looks blurry on a phone. Every
// place a site names an icon is a candidate: link rel icon and apple-touch-icon (with their sizes), the web app
// manifest's icons, Windows tile images, the /apple-touch-icon.png that iPhones ask for even when no page names it,
// /favicon.ico, and last of all a square og:image. Each one fetched is measured from its own bytes, and the sharpest
// square one wins (docs/decisions/gyms.md "Sharper icons").

/** An icon at least this big (its smaller side) is sharp enough at 64 px on a phone: no need to look further. */
export const ICON_SHARP_PX = 180;
/** An icon smaller than this is read again when the site is next due, in case a sharper one is there now. */
export const ICON_GOOD_PX = 128;
/** Icon files fetched for one gym at most, besides the page and its manifest. */
const ICON_TRIES = 5;

export interface IconCandidate {
  url: string;
  /** The size the page declares (or the usual one for its kind); the real size is measured from the bytes. */
  size: number;
  /** og:image: only when nothing else gave an icon, and only if it's square. */
  last?: boolean;
}

const tagAttr = (tag: string, name: string) => {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return decode(m?.[2] ?? m?.[3] ?? m?.[4] ?? "").trim();
};
const absolute = (href: string, base: string) => {
  try {
    const u = new URL(href, base);
    return /^https?:$/.test(u.protocol) ? u.toString() : "";
  } catch {
    return "";
  }
};
/** SVG is left out everywhere: it can carry script, and it's served from our own origin. */
const isSvg = (href: string, type: string) => /svg/i.test(type) || /\.svg(\?|#|$)/i.test(href);
const biggest = (sizes: string) => Math.max(0, ...[...sizes.matchAll(/(\d+)\s*x\s*(\d+)/gi)].map((m) => Math.min(+m[1]!, +m[2]!)));

/**
 * The order to try candidates in: sharp ones up to 512 px biggest first, then bigger ones smallest first (they cost
 * more to fetch and serve and look no better at 64 px), then the small ones biggest first. og:image stays last.
 */
export function rankIcons(list: IconCandidate[]): IconCandidate[] {
  const band = (c: IconCandidate) => (c.last ? 3 : c.size >= ICON_SHARP_PX && c.size <= 512 ? 0 : c.size > 512 ? 1 : 2);
  const seen = new Set<string>();
  return list
    .map((c, i) => ({ c, i }))
    .sort((a, b) => band(a.c) - band(b.c) || (band(a.c) === 1 ? a.c.size - b.c.size : b.c.size - a.c.size) || a.i - b.i)
    .map((x) => x.c)
    .filter((c) => !seen.has(c.url) && !!seen.add(c.url));
}

/** Where a page says its icons are, plus the usual places (/apple-touch-icon.png, /favicon.ico), best first. */
export function iconCandidates(html: string, site: string): IconCandidate[] {
  const found: IconCandidate[] = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = tagAttr(tag, "rel").toLowerCase();
    if (!/(^|\s)(icon|apple-touch-icon|apple-touch-icon-precomposed)(\s|$)/.test(rel)) continue;
    const href = tagAttr(tag, "href");
    if (!href || /^data:/i.test(href) || isSvg(href, tagAttr(tag, "type"))) continue;
    const url = absolute(href, site);
    if (!url) continue;
    // A touch icon with no sizes is 180 px on every iPhone since 2014; a plain icon with none is a favicon.
    found.push({ url, size: biggest(tagAttr(tag, "sizes")) || (rel.includes("apple-touch-icon") ? 180 : 16) });
  }
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = (tagAttr(tag, "name") || tagAttr(tag, "property")).toLowerCase();
    const content = tagAttr(tag, "content");
    if (!content || isSvg(content, "")) continue;
    // Windows' tile images: TileImage is 144 px, the square logos say their size in their name.
    const tile = name === "msapplication-tileimage" ? 144 : /^msapplication-square(\d+)x\d+logo$/.exec(name)?.[1];
    const url = absolute(content, site);
    if (!url) continue;
    if (tile) found.push({ url, size: Number(tile) });
    else if (name === "og:image" || name === "og:image:url" || name === "og:image:secure_url") found.push({ url, size: 0, last: true });
  }
  const guess = (path: string, size: number) => {
    const url = absolute(path, site);
    if (url) found.push({ url, size });
  };
  // iPhones ask for /apple-touch-icon.png whether or not a page names it, so many sites have one there.
  guess("/apple-touch-icon.png", 180);
  guess("/favicon.ico", 16);
  return rankIcons(found);
}

/** The manifest a page links to, if any. */
export function manifestLink(html: string, site: string): string {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? [])
    if (/(^|\s)manifest(\s|$)/i.test(tagAttr(tag, "rel"))) return absolute(tagAttr(tag, "href"), site);
  return "";
}

/** A web app manifest's icons (never SVG or monochrome ones), as candidates. */
export function manifestIcons(json: string, manifestUrl: string): IconCandidate[] {
  let icons: unknown;
  try {
    icons = (JSON.parse(json) as { icons?: unknown }).icons;
  } catch {
    return [];
  }
  if (!Array.isArray(icons)) return [];
  const out: IconCandidate[] = [];
  for (const i of icons.slice(0, 30)) {
    if (!i || typeof i !== "object") continue;
    const { src, sizes, type, purpose } = i as Record<string, unknown>;
    if (typeof src !== "string" || !src || /^data:/i.test(src) || isSvg(src, typeof type === "string" ? type : "")) continue;
    const kinds = typeof purpose === "string" ? purpose.toLowerCase().split(/\s+/) : ["any"];
    if (!kinds.includes("any") && !kinds.includes("maskable")) continue;
    const url = absolute(src, manifestUrl);
    // A maskable icon has padding around the mark, so the same size counts a little less than a plain one.
    if (url) out.push({ url, size: biggest(typeof sizes === "string" ? sizes : "") - (kinds.includes("any") ? 0 : 1) });
  }
  return out;
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

/**
 * An image's width and height from its first bytes (an .ico: its biggest picture), or null when they can't be read.
 * Only the header is needed, so a stored icon is measured from its first few kilobytes (measureIcons).
 */
export function imageSize(b: Uint8Array): { w: number; h: number } | null {
  const type = imageType(b);
  const u16 = (i: number) => (b[i]! << 8) | b[i + 1]!;
  const le16 = (i: number) => b[i]! | (b[i + 1]! << 8);
  const u32 = (i: number) => ((b[i]! << 24) | (b[i + 1]! << 16) | (b[i + 2]! << 8) | b[i + 3]!) >>> 0;
  const ok = (w: number, h: number) => (w > 0 && h > 0 ? { w, h } : null);
  if (type === "image/png") return b.length >= 24 ? ok(u32(16), u32(20)) : null;
  if (type === "image/gif") return ok(le16(6), le16(8));
  if (type === "image/x-icon") {
    let best: { w: number; h: number } | null = null;
    const n = Math.min(le16(4), 64);
    for (let k = 0; k < n && 6 + k * 16 + 1 < b.length; k++) {
      const w = b[6 + k * 16] || 256;
      const h = b[7 + k * 16] || 256;
      if (!best || Math.min(w, h) > Math.min(best.w, best.h)) best = { w, h };
    }
    return best;
  }
  if (type === "image/webp") {
    const chunk = String.fromCharCode(...b.slice(12, 16));
    if (chunk === "VP8 " && b.length >= 30) return ok(le16(26) & 0x3fff, le16(28) & 0x3fff);
    if (chunk === "VP8L" && b.length >= 25) {
      const bits = b[21]! | (b[22]! << 8) | (b[23]! << 16) | (b[24]! << 24);
      return ok((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
    }
    if (chunk === "VP8X" && b.length >= 30)
      return ok((b[24]! | (b[25]! << 8) | (b[26]! << 16)) + 1, (b[27]! | (b[28]! << 8) | (b[29]! << 16)) + 1);
    return null;
  }
  if (type === "image/jpeg") {
    // Walk the markers to the frame header (SOF0 to SOF15, less DHT, JPG and DAC), which holds the size.
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const m = b[i + 1]!;
      if (m === 0xff) {
        i++;
        continue;
      }
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return ok(u16(i + 7), u16(i + 5));
      if (m === 0xd8 || (m >= 0xd0 && m <= 0xd7) || m === 0x01) {
        i += 2;
        continue;
      }
      i += 2 + u16(i + 2);
    }
    return null;
  }
  return null;
}

/** An icon's size in pixels (its smaller side) when it's square enough to be a logo, else 0. */
export function iconPx(b: Uint8Array, strict = false): number {
  const s = imageSize(b);
  if (!s) return 0;
  const ratio = Math.max(s.w, s.h) / Math.min(s.w, s.h);
  return ratio <= (strict ? 1.1 : 1.25) ? Math.min(s.w, s.h) : 0;
}

/**
 * The site's sharpest square icon, as bytes we're willing to keep and serve and its size, or null. Stops at the first
 * one of ICON_SHARP_PX or more; at most ICON_TRIES icon files, plus the manifest when the page names one and nothing
 * it names directly is sharp. Only one bigger than `beat` counts (the icon the gym has already).
 */
export async function siteIcon(
  fetcher: typeof fetch,
  html: string,
  site: string,
  beat = 0,
): Promise<{ bytes: Uint8Array; px: number } | null> {
  let list = iconCandidates(html, site);
  const named = list.filter((c) => !c.last && !/\/(apple-touch-icon\.png|favicon\.ico)$/.test(new URL(c.url).pathname));
  const manifest = manifestLink(html, site);
  if (manifest && !named.some((c) => c.size >= ICON_SHARP_PX)) {
    const m = await fetchText(fetcher, manifest, "application/manifest+json, application/json", 64_000);
    if (m && m.status < 400) list = rankIcons([...manifestIcons(m.text, manifest), ...list]);
  }
  let best: { bytes: Uint8Array; px: number } | null = null;
  let tries = 0;
  for (const c of list) {
    if (c.last && best) break;
    if (tries++ >= ICON_TRIES + (c.last ? 1 : 0)) break;
    const r = await fetchBytes(fetcher, c.url, "image/*", ENRICH_LIMITS.iconBytes);
    if (!r || r.status >= 400 || r.over || r.bytes.length < ENRICH_LIMITS.iconMinBytes || !imageType(r.bytes)) continue;
    const px = iconPx(r.bytes, c.last);
    if (!px || (c.last && px < ICON_GOOD_PX)) continue;
    if (!best || px > best.px) best = { bytes: r.bytes, px };
    if (px >= ICON_SHARP_PX) break;
  }
  return best && best.px > beat ? best : null;
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
  p: { id: string; name: string; website: string; iconPx?: number; near?: Near } & Partial<SiteDetails>,
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
  p: { id: string; website: string; iconPx?: number; near?: Near } & Partial<SiteDetails>,
  fetcher: typeof fetch,
  now: number,
  done: (filled: EnrichOne["filled"], skipped: string, set?: Partial<SiteDetails>) => Promise<EnrichOne>,
): Promise<EnrichOne> {
  const page = await fetchText(fetcher, p.website, "text/html");
  if (!page) return done([], "no answer");
  if (page.status >= 400) return done([], `HTTP ${page.status}`);
  if (!/html/i.test(page.type) && !/<html/i.test(page.text.slice(0, 2000))) return done([], "not a web page");
  const found = detailsFromHtml(page.text, p.website, p.near);
  const set: Partial<SiteDetails> = {};
  for (const k of Object.keys(found) as (keyof SiteDetails)[]) if (found[k] && !p[k]) set[k] = found[k];
  const filled: EnrichOne["filled"] = Object.keys(set) as (keyof SiteDetails)[];
  // The site's icon stands in for a logo until an owner adds one: kept only for an unclaimed gym with neither, and a
  // small one is swapped for a sharper one when the site has it (under a new id, since photos are cached for good).
  const have = p.iconPx ?? 0;
  if (have < ICON_GOOD_PX) {
    const icon = await siteIcon(fetcher, page.text, p.website, have);
    if (icon && (await keepIcon(p.id, icon, have > 0, now))) filled.push("icon");
  }
  return done(filled, filled.length ? "" : "nothing new on the page", set);
}

/** Keeps a site's icon for an unclaimed gym with no owner's logo: a new one, or in place of a smaller one. */
async function keepIcon(placeId: string, icon: { bytes: Uint8Array; px: number }, replace: boolean, now: number): Promise<boolean> {
  const id = randomBytes(8).toString("hex");
  if (replace)
    return (
      (await run(
        `UPDATE gym_photos SET id = ?, image = ?, px = ?, created_at = ? WHERE place_id = ? AND kind = 'icon' AND px < ?
           AND EXISTS (SELECT 1 FROM gym_places g WHERE g.id = ? AND g.claimed_by = '')
           AND NOT EXISTS (SELECT 1 FROM gym_photos m WHERE m.place_id = ? AND m.kind = 'logo')`,
        [id, icon.bytes, icon.px, now, placeId, icon.px, placeId, placeId],
      )) > 0
    );
  return (
    (await run(
      `INSERT INTO gym_photos (id, place_id, kind, image, px, created_at)
       SELECT ?, id, 'icon', ?, ?, ? FROM gym_places WHERE id = ? AND claimed_by = ''
         AND NOT EXISTS (SELECT 1 FROM gym_photos m WHERE m.place_id = ? AND m.kind IN ('logo', 'icon'))`,
      [id, icon.bytes, icon.px, now, placeId, placeId],
    )) > 0
  );
}

/**
 * Measures icons kept before their size was (px = 0), from their first 4 KB only, so neither Turso's rows nor its
 * bandwidth pay for whole images; one that can't be measured counts as 1 px. An unclaimed gym whose icon is small is
 * moved to the front of the website step's line (enriched_at = 1, which still counts as read for the AI step), so the
 * next import or daily refresh looks for a sharper one. Through the partial index gym_photos_unmeasured, which is
 * empty once every old icon is measured, so this costs nothing after that.
 */
export async function measureIcons(limit = 500): Promise<{ measured: number; small: number }> {
  const rows = await query<{ id: string; place_id: string; head: Uint8Array | ArrayBuffer }>(
    `SELECT id, place_id, substr(image, 1, 4096) AS head FROM gym_photos WHERE kind = 'icon' AND px = 0 LIMIT ?`,
    [limit],
  );
  if (!rows.length) return { measured: 0, small: 0 };
  const sized = rows.map((r) => {
    const head = r.head instanceof Uint8Array ? r.head : new Uint8Array(r.head);
    return { id: String(r.id), place: String(r.place_id), px: Math.max(1, iconPx(head)) };
  });
  const small = sized.filter((s) => s.px < ICON_GOOD_PX);
  await batch([
    ...sized.map((s) => ({ sql: "UPDATE gym_photos SET px = ? WHERE id = ?", args: [s.px, s.id] })),
    ...(small.length
      ? [
          {
            sql: `UPDATE gym_places SET enriched_at = 1 WHERE id IN (${small.map(() => "?").join(",")}) AND claimed_by = ''`,
            args: small.map((s) => s.place),
          },
        ]
      : []),
  ]);
  return { measured: sized.length, small: small.length };
}

// --- A batch, for the import job ---

export interface EnrichBatch {
  done: EnrichOne[];
  /** Gyms that had everything already, stamped without reading their site. */
  complete: number;
  /** Whether more gyms are due (the batch was full). */
  more: boolean;
}

/** The size of the gym's icon, an owner's logo counting as big enough; NULL for neither. */
const ICON_PX = `(SELECT MAX(CASE WHEN m.kind = 'logo' THEN 100000 ELSE m.px END) FROM gym_photos m
  WHERE m.place_id = gym_places.id AND m.kind IN ('logo', 'icon'))`;
/**
 * Gyms due a read, oldest read first, through the partial index gym_places_web (its WHERE repeated here, so the query
 * walks the index instead of the whole table; Turso bills every row read). A gym that has everything is stamped
 * without a visit, so it isn't read again for a month either.
 */
const DUE = `FROM gym_places WHERE claimed_by = '' AND hidden = 0 AND website <> '' AND enriched_at < ?`;
export const ENRICH_DUE_SQL = `SELECT id ${DUE} ORDER BY enriched_at LIMIT ?`;

/** Reads the next batch of gyms that have a website, several sites at once, and fills what each is missing. */
export async function enrichBatch(fetcher: typeof fetch = fetch, now = Date.now(), size = ENRICH_LIMITS.batch): Promise<EnrichBatch> {
  const since = now - ENRICH_LIMITS.againMs;
  // Old icons are measured first, so a small one is looked at again in this very batch.
  await measureIcons();
  const rows = await query(
    `SELECT id, name, website, phone, email, hours, address, postcode, instagram, facebook, city, region, country, lat, lon, ${ICON_PX} AS icon_px ${DUE} ORDER BY enriched_at LIMIT ?`,
    [since, size],
  );
  const all = rows.map((r) => ({
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
    // An icon not measured yet (px 0) counts as 1 px, so a sharper one replaces it.
    iconPx: r.icon_px === null || r.icon_px === undefined ? 0 : Math.max(1, Number(r.icon_px)),
    near: {
      city: String(r.city ?? ""),
      region: String(r.region ?? ""),
      country: String(r.country ?? ""),
      lat: Number(r.lat),
      lon: Number(r.lon),
    },
  }));
  const missing = (g: (typeof all)[number]) =>
    g.iconPx < ICON_GOOD_PX || (["phone", "email", "hours", "address", "postcode", "instagram", "facebook"] as const).some((k) => !g[k]);
  const complete = all.filter((g) => !missing(g));
  if (complete.length)
    await run(`UPDATE gym_places SET enriched_at = ? WHERE id IN (${complete.map(() => "?").join(",")}) AND claimed_by = ''`, [
      now,
      ...complete.map((g) => g.id),
    ]);
  const gyms = all.filter(missing);
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
  return { done, complete: complete.length, more: rows.length === size };
}
