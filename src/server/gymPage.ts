// The website's gym pages (docs/decisions/gyms.md, step 2), drawn as plain HTML with no scripts inside the site's own
// header and footer (siteFrame.ts), like public profiles:
//   /gyms/                      every city with gyms
//   /gyms/<city>/               "Gyms in Langley, BC": official gyms first, then the most lifters, studios last
//   /gyms/<city>/<gym>/         one gym: address, map links, opening hours, equipment, lifters, add it to the app
// They're for search and for the QR posters (step 4), so the facts come first and every page says how to add the gym.
// Text: src/locales/text/gp.ts (gp.*), in the reader's language. Map credit: OpenStreetMap (ODbL).
import { decodeGym } from "@/lib/gymShare";
import { isMsgLang, MSG_LANGS, type MsgLang } from "@/lib/messageText";
import { allDay, parseHours } from "@/lib/openingHours";
import { SHARE_PAGE_CSP } from "@/lib/securityHeaders";
import { APP_PATH, SITE_URL } from "@/lib/site";
import { EQUIPMENT, type Equipment } from "@/lib/types";
import * as equipment from "@/locales/text/equipment";
import * as gp from "@/locales/text/gp";

import type { City, Place } from "./gymPlaces";
import { esc, framePage, icon } from "./siteFrame";

type GpKey = keyof typeof gp.en;
const GP: Record<MsgLang, Partial<Record<GpKey, unknown>>> = { en: gp.en, es: gp.es, fr: gp.fr, de: gp.de, it: gp.it, ja: gp.ja };
const EQ: Record<MsgLang, Partial<Record<string, unknown>>> = {
  en: equipment.en,
  es: equipment.es,
  fr: equipment.fr,
  de: equipment.de,
  it: equipment.it,
  ja: equipment.ja,
};

export const say = (lang: MsgLang, key: GpKey, vars: Record<string, string | number> = {}) =>
  String(GP[lang][key] ?? gp.en[key]).replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));
const equipName = (lang: MsgLang, e: Equipment) =>
  String(EQ[lang][`equipment.${e}`] ?? equipment.en[`equipment.${e}` as keyof typeof equipment.en] ?? e);

export const gymPath = (p: Pick<Place, "citySlug" | "slug">) => `/gyms/${p.citySlug}/${p.slug}/`;
export const cityPath = (citySlug: string) => `/gyms/${citySlug}/`;
/** Opens the app on this gym (GymPlace.tsx), where one tap adds it with its equipment. */
export const appGymPath = (id: string) => `${APP_PATH}#/gymplace/${id}`;
const cityName = (p: Pick<Place, "city" | "region">) => [p.city, p.region].filter(Boolean).join(", ");

export const GYM_PAGE_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy": SHARE_PAGE_CSP,
  Vary: "Accept-Language",
  // Short, so a city imported in admin or an owner's edit shows within two minutes.
  "Cache-Control": "public, max-age=60, s-maxage=120",
};
export const GYM_GONE_HEADERS = { ...GYM_PAGE_HEADERS, "X-Robots-Tag": "noindex" };

/** The reader's language from Accept-Language, one of the six, English when none match. */
export function pageLang(req: Request): MsgLang {
  for (const part of (req.headers.get("accept-language") ?? "").split(",")) {
    const tag = part.split(";")[0]!.trim().toLowerCase().slice(0, 2);
    if (isMsgLang(tag)) return tag;
  }
  return MSG_LANGS[0];
}

const metaTags = (title: string, desc: string, path: string, ld: unknown, index = true) => {
  const url = `${SITE_URL}${path}`;
  return `<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}">${index ? "" : '<meta name="robots" content="noindex">'}
<meta property="og:type" content="website"><meta property="og:site_name" content="Liftsmith"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${SITE_URL}/og/default.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
};

const crumbs = (lang: MsgLang, items: [string, string | null][]) =>
  `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items
    .map(
      ([label, href]) => `<li>${href ? `<a href="${esc(href)}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`}</li>`,
    )
    .join("")}</ol></nav>`;

const officialMark = (lang: MsgLang) =>
  `<span class="tick" title="${esc(say(lang, "gp.official"))}">${icon("verified", 20)}<span class="sr">${esc(say(lang, "gp.official"))}</span></span>`;

// --- Opening hours ---

/** "Mon", "Tue"… in the reader's language, Monday first (2024-01-01 was a Monday). */
const dayNames = (lang: MsgLang) =>
  Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(lang, { weekday: "long", timeZone: "UTC" }).format(Date.UTC(2024, 0, 1 + i)));

export function hoursHtml(raw: string, lang: MsgLang): string {
  if (!raw) return `<p class="muted">${esc(say(lang, "gp.hoursNone"))}</p>`;
  const week = parseHours(raw);
  if (!week) return `<p>${esc(raw)}</p>`;
  if (allDay(week)) return `<p>${esc(say(lang, "gp.allDay"))}</p>`;
  const names = dayNames(lang);
  const range = (r: string) => r.replace("-", "–");
  return `<dl class="hours">${week
    .map(
      (d, i) =>
        `<div><dt>${esc(names[i]!)}</dt><dd>${d.length ? esc(d.map(range).join(", ")) : `<span class="muted">${esc(say(lang, "gp.closed"))}</span>`}</dd></div>`,
    )
    .join("")}</dl>`;
}

// --- One gym ---

function equipmentHtml(p: Place, lang: MsgLang): string {
  const kit = p.code ? decodeGym(p.code) : null;
  if (!kit || !kit.equipment.length) return `<p class="muted">${esc(say(lang, "gp.equipmentNone"))}</p>`;
  const order = (e: Equipment) => EQUIPMENT.indexOf(e);
  const chips = [...kit.equipment].sort((a, b) => order(a) - order(b)).map((e) => `<li>${esc(equipName(lang, e))}</li>`);
  const n = new Intl.NumberFormat(lang);
  const db = kit.dumbbells.length
    ? `<p class="muted small db">${esc(say(lang, "gp.dumbbells", { from: n.format(kit.dumbbells[0]!), to: n.format(kit.dumbbells.at(-1)!), unit: kit.unit }))}</p>`
    : "";
  return `<ul class="chips">${chips.join("")}</ul>${db}`;
}

function liftersLine(p: Place, lang: MsgLang): string {
  if (p.lifters <= 0) return say(lang, "gp.liftersNone");
  if (p.lifters === 1) return say(lang, "gp.lifters1");
  return say(lang, "gp.liftersN", { count: new Intl.NumberFormat(lang).format(p.lifters) });
}

export function gymHtml(p: Place, nearby: Place[], lang: MsgLang): string {
  const city = cityName(p);
  const title = `${say(lang, "gp.title", { name: p.name, city: p.city || city })} | Liftsmith`;
  const desc = say(lang, "gp.description", { name: p.name, city: p.city || city });
  const path = gymPath(p);
  const week = parseHours(p.hours);
  const ld = {
    "@context": "https://schema.org",
    "@type": "ExerciseGym",
    name: p.name,
    url: `${SITE_URL}${path}`,
    geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lon },
    address: {
      "@type": "PostalAddress",
      ...(p.address ? { streetAddress: p.address } : {}),
      addressLocality: p.city,
      ...(p.region ? { addressRegion: p.region } : {}),
      ...(p.country ? { addressCountry: p.country } : {}),
    },
    ...(p.website ? { sameAs: [p.website] } : {}),
    ...(p.phone ? { telephone: p.phone } : {}),
    ...(week && p.hours
      ? {
          openingHours: p.hours
            .split(";")
            .map((x) => x.trim())
            .filter((x) => x && !/^(PH|SH)\b/.test(x)),
        }
      : {}),
  };
  const osm = `https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lon}#map=18/${p.lat}/${p.lon}`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;
  const contact = [
    p.website ? `<li>${icon("link", 18)}<a href="${esc(p.website)}" rel="nofollow noopener">${esc(say(lang, "gp.website"))}</a></li>` : "",
    p.phone ? `<li>${icon("phone", 18)}<a href="tel:${esc(p.phone.replace(/[^\d+]/g, ""))}">${esc(p.phone)}</a></li>` : "",
  ].join("");
  const hero = `<section class="card hero" aria-labelledby="gym-h">
<p class="kicker">${esc(say(lang, "gp.kicker"))}</p>
<h1 id="gym-h"><span>${esc(p.name)}</span>${p.official ? officialMark(lang) : ""}</h1>
<p class="muted where">${icon("pin", 18)}<span>${esc([p.address, city].filter(Boolean).join(", "))}</span></p>
<p class="status ${p.official ? "on" : ""}">${esc(p.official ? say(lang, "gp.officialNote") : say(lang, "gp.unofficial"))}</p>
<p class="people">${icon("people", 18)}<span>${esc(liftersLine(p, lang))}</span></p>
<a class="btn btn-primary wide" href="${esc(appGymPath(p.id))}">${icon("plus", 18)}${esc(say(lang, "gp.add"))}</a>
<p class="muted small add-note">${esc(say(lang, p.code ? "gp.addKit" : "gp.addNoKit"))}</p></section>`;
  const place = `<section class="card" aria-labelledby="addr-h"><h2 id="addr-h">${icon("pin", 16)}${esc(say(lang, "gp.address"))}</h2>
<p>${esc([p.address, city].filter(Boolean).join(", "))}</p>
<ul class="links"><li>${icon("pin", 18)}<a href="${esc(directions)}" rel="nofollow noopener">${esc(say(lang, "gp.directions"))}</a></li>
<li>${icon("link", 18)}<a href="${esc(osm)}" rel="nofollow noopener">${esc(say(lang, "gp.map"))}</a></li>${contact}</ul></section>`;
  const hours = `<section class="card" aria-labelledby="hours-h"><h2 id="hours-h">${icon("clock", 16)}${esc(say(lang, "gp.hours"))}</h2>${hoursHtml(p.hours, lang)}</section>`;
  const kit = `<section class="card" aria-labelledby="kit-h"><h2 id="kit-h">${icon("dumbbell", 16)}${esc(say(lang, "gp.equipment"))}</h2>${equipmentHtml(p, lang)}</section>`;
  const claim = p.official
    ? ""
    : `<section class="card claim" aria-labelledby="claim-h"><h2 id="claim-h">${icon("verified", 16)}${esc(say(lang, "gp.unofficial"))}</h2><p class="muted">${esc(say(lang, "gp.claim"))}</p></section>`;
  const poster = `<section class="card" aria-labelledby="poster-h"><h2 id="poster-h">${icon("flag", 16)}${esc(say(lang, "gp.posterTitle"))}</h2><p class="muted">${esc(say(lang, "gp.posterBody"))}</p><p><a href="${esc(`${gymPath(p)}poster/`)}" rel="nofollow">${esc(say(lang, "gp.posterLink"))}</a></p></section>`;
  const others = nearby.filter((x) => x.id !== p.id && x.kind === "gym").slice(0, 8);
  const more = others.length
    ? `<section class="card" aria-labelledby="more-h"><h2 id="more-h">${icon("gym", 16)}${esc(say(lang, "gp.more", { city: p.city || city }))}</h2>
<ul class="list">${others.map((x) => listItem(x, lang)).join("")}</ul><a class="quiet" href="${esc(cityPath(p.citySlug))}">${esc(say(lang, "gp.cityTitle", { city }))} ›</a></section>`
    : "";
  const credit = p.source === "osm" ? `<p class="credit">${esc(say(lang, "gp.osm"))}</p>` : "";
  const body = `<div class="strip"><div class="wrap row strip-row"><p>${esc(say(lang, "gp.strip"))}</p></div></div>
<main id="main" class="wrap page">${crumbs(lang, [
    [say(lang, "gp.crumbs"), "/gyms/"],
    [city, cityPath(p.citySlug)],
    [p.name, null],
  ])}
<div class="grid"><div class="col">${hero}${claim}${poster}</div><div class="col">${place}${hours}${kit}${more}</div></div>${credit}</main>`;
  return framePage(lang, title, metaTags(title, desc, path, ld, p.kind === "gym"), body, GYM_STYLE, "gym");
}

function listItem(p: Place, lang: MsgLang): string {
  const sub = [p.address, p.lifters > 0 ? liftersLine(p, lang) : ""].filter(Boolean).join(" · ");
  return `<li><a href="${esc(gymPath(p))}"><span class="li-name">${esc(p.name)}${p.official ? officialMark(lang) : ""}</span>${sub ? `<span class="muted small">${esc(sub)}</span>` : ""}</a></li>`;
}

// --- A city ---

export function cityHtml(citySlug: string, places: Place[], lang: MsgLang): string {
  const first = places[0]!;
  const city = cityName(first);
  const gyms = places.filter((p) => p.kind === "gym");
  const studios = places.filter((p) => p.kind === "studio");
  const title = `${say(lang, "gp.cityTitle", { city })} | Liftsmith`;
  const desc = say(lang, "gp.cityDescription", { count: gyms.length, city });
  const path = cityPath(citySlug);
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: say(lang, "gp.cityTitle", { city }),
    itemListElement: gyms.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${gymPath(p)}`, name: p.name })),
  };
  const section = (id: string, label: string, list: Place[]) =>
    list.length
      ? `<section class="card" aria-labelledby="${id}"><h2 id="${id}">${icon("gym", 16)}${esc(label)}</h2><ul class="list">${list.map((p) => listItem(p, lang)).join("")}</ul></section>`
      : "";
  const credit = places.some((p) => p.source === "osm") ? `<p class="credit">${esc(say(lang, "gp.osm"))}</p>` : "";
  const body = `<main id="main" class="wrap page narrow">${crumbs(lang, [
    [say(lang, "gp.crumbs"), "/gyms/"],
    [city, null],
  ])}
<header class="head"><p class="kicker">${esc(say(lang, "gp.cityKicker"))}</p><h1>${esc(say(lang, "gp.cityTitle", { city }))}</h1><p class="muted">${esc(desc)}</p></header>
${section("gyms-h", say(lang, "gp.cityGyms"), gyms)}${section("studios-h", say(lang, "gp.studios"), studios)}${credit}</main>`;
  return framePage(lang, title, metaTags(title, desc, path, ld, gyms.length > 0), body, GYM_STYLE, "gym");
}

// --- Every city ---

export function indexHtml(list: City[], lang: MsgLang): string {
  const title = `${say(lang, "gp.indexTitle")} | Liftsmith`;
  const desc = say(lang, "gp.indexDescription");
  const n = new Intl.NumberFormat(lang);
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: say(lang, "gp.indexTitle"), url: `${SITE_URL}/gyms/` };
  const items = list
    .map(
      (c) =>
        `<li><a href="${esc(cityPath(c.citySlug))}"><span class="li-name">${esc([c.city, c.region].filter(Boolean).join(", "))}</span><span class="muted small">${esc(
          c.gyms === 1 ? say(lang, "gp.cityCount1") : say(lang, "gp.cityCountN", { count: n.format(c.gyms) }),
        )}</span></a></li>`,
    )
    .join("");
  const body = `<main id="main" class="wrap page narrow">
<header class="head"><p class="kicker">${esc(say(lang, "gp.cityKicker"))}</p><h1>${esc(say(lang, "gp.indexTitle"))}</h1><p class="muted">${esc(say(lang, "gp.indexBody"))}</p></header>
${list.length ? `<section class="card"><ul class="list">${items}</ul></section>` : ""}<p class="credit">${esc(say(lang, "gp.osm"))}</p></main>`;
  return framePage(lang, title, metaTags(title, desc, "/gyms/", ld), body, GYM_STYLE, "gym");
}

export function goneHtml(lang: MsgLang): string {
  const body = `<main id="main" class="wrap gone">${icon("gym", 28, "gone-icon")}<h1>${esc(say(lang, "gp.gone"))}</h1><p class="muted">${esc(say(lang, "gp.goneBody"))}</p>
<a class="btn btn-primary" href="/gyms/">${esc(say(lang, "gp.indexTitle"))}</a></main>`;
  return framePage(lang, `${say(lang, "gp.gone")} | Liftsmith`, '<meta name="robots" content="noindex">', body, GYM_STYLE, "gym");
}

// --- The gym sitemap ---

export function gymSitemapXml(entries: { path: string; lastModified: number }[]): string {
  const urls = entries.map(
    (e) =>
      `<url><loc>${esc(`${SITE_URL}${e.path}`)}</loc>${e.lastModified ? `<lastmod>${new Date(e.lastModified).toISOString().slice(0, 10)}</lastmod>` : ""}</url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

const GYM_STYLE = `
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.page{padding-top:20px;padding-bottom:48px}.narrow{max-width:48rem}
.crumbs ol{display:flex;flex-wrap:wrap;gap:4px 8px;list-style:none;margin:0 0 16px;padding:0;font-size:.875rem;color:var(--muted)}
.crumbs li+li::before{content:"›";margin-right:8px}.crumbs a{text-decoration:none;display:inline-flex;min-height:44px;align-items:center}.crumbs a:hover{color:var(--ink)}
.crumbs span{display:inline-flex;min-height:44px;align-items:center}
.grid{display:grid;gap:16px}.col{display:grid;gap:16px;align-content:start}
@media (min-width:960px){.grid{grid-template-columns:400px minmax(0,1fr);gap:28px}.grid>.col:first-child{position:sticky;top:88px}}
.hero h1{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:1.75rem;line-height:1.15;font-weight:800;letter-spacing:-.02em;margin:6px 0 8px;overflow-wrap:anywhere}
.tick{display:inline-flex;color:var(--accent);flex:none}
.where,.people{display:flex;gap:8px;align-items:flex-start;margin-top:8px}.where svg,.people svg{flex:none;margin-top:2px}
.status{margin-top:12px;font-size:.875rem;color:var(--muted)}.status.on{color:var(--accent);font-weight:600}
.wide{width:100%;margin-top:18px}.add-note{margin-top:10px}
.card h2,.head .kicker{display:flex;align-items:center;gap:8px;font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 12px}
.head{margin-bottom:16px}.head h1{font-size:1.75rem;line-height:1.15;font-weight:800;letter-spacing:-.02em;margin:6px 0 8px}
.links,.list{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:4px}.links li{display:flex;align-items:center;gap:10px}
.links a{display:inline-flex;min-height:44px;align-items:center;font-weight:600}
.list{margin:0}.list li a{display:flex;flex-direction:column;gap:2px;min-height:44px;justify-content:center;padding:10px 0;border-top:1px solid var(--line);text-decoration:none}
.list li:first-child a{border-top:0;padding-top:0}.list a:hover .li-name{text-decoration:underline}
.li-name{display:inline-flex;align-items:center;gap:6px;font-weight:600}
.hours{display:grid;gap:0;margin:0}.hours div{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid var(--line)}
.hours div:first-child{border-top:0;padding-top:0}.hours dd{margin:0;font-variant-numeric:tabular-nums;text-align:right}
.chips{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:0}
.chips li{padding:6px 12px;border:1px solid var(--line);border-radius:999px;font-size:.875rem}
.db{margin-top:12px}.claim{border-style:dashed}
.credit{margin-top:24px;font-size:.75rem;color:var(--faint)}`;
