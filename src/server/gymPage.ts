// The website's gym pages (docs/decisions/gyms.md, step 2), drawn as plain HTML with no scripts inside the site's own
// header and footer (siteFrame.ts), like public profiles:
//   /gyms/                      every city with gyms
//   /gyms/<city>/               "Gyms in Langley, BC": official gyms first, then the most lifters, studios last
//   /gyms/<city>/<gym>/         one gym: address, map links, opening hours, equipment, lifters, add it to the app
// They're for search and for the QR posters (step 4), so the facts come first and every page says how to add the gym.
// Text: src/locales/text/gp.ts (gp.*), in the reader's language. Map credit: OpenStreetMap (ODbL).
import { endTime, timetable, type GymClass } from "@/lib/gymClasses";
import { money, PRICE_KINDS, type Prices } from "@/lib/gymExtras";
import { decodeGym } from "@/lib/gymShare";
import { readStarter } from "@/lib/gymStarter";
import { isMsgLang, MSG_LANGS, type MsgLang } from "@/lib/messageText";
import { allDay, parseHours } from "@/lib/openingHours";
import { SHARE_PAGE_CSP } from "@/lib/securityHeaders";
import { APP_PATH, SITE_URL } from "@/lib/site";
import { EQUIPMENT, type Equipment } from "@/lib/types";
import * as equipment from "@/locales/text/equipment";
import * as ex from "@/locales/text/ex";
import * as gp from "@/locales/text/gp";

import { km } from "./gymAddress";
import { AREA_PINS, areaMapPath } from "./gymMedia";
import { gymIndexable, type City, type Place } from "./gymPlaces";
import { NEAR_HEAD, NEAR_STYLE, nearSection } from "./gymsNear";
import { esc, framePage, icon } from "./siteFrame";

export type GpKey = keyof typeof gp.en;
const GP: Record<MsgLang, Partial<Record<GpKey, unknown>>> = {
  en: gp.en,
  es: gp.es,
  fr: gp.fr,
  de: gp.de,
  it: gp.it,
  ja: gp.ja,
  pt: gp.pt,
  ko: gp.ko,
  pl: gp.pl,
  tr: gp.tr,
};
const EQ: Record<MsgLang, Partial<Record<string, unknown>>> = {
  en: equipment.en,
  es: equipment.es,
  fr: equipment.fr,
  de: equipment.de,
  it: equipment.it,
  ja: equipment.ja,
  pt: equipment.pt,
  ko: equipment.ko,
  pl: equipment.pl,
  tr: equipment.tr,
};

export const say = (lang: MsgLang, key: GpKey, vars: Record<string, string | number> = {}) =>
  String(GP[lang][key] ?? gp.en[key]).replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));
export const equipName = (lang: MsgLang, e: Equipment) =>
  String(EQ[lang][`equipment.${e}`] ?? equipment.en[`equipment.${e}` as keyof typeof equipment.en] ?? e);

const EX: Record<MsgLang, Partial<Record<string, unknown>>> = {
  en: ex.en,
  es: ex.es,
  fr: ex.fr,
  de: ex.de,
  it: ex.it,
  ja: ex.ja,
  pt: ex.pt,
  ko: ex.ko,
  pl: ex.pl,
  tr: ex.tr,
};
export const exName = (lang: MsgLang, id: string) => {
  const m = EX[lang][`ex.${id}`] ?? (ex.en as Record<string, unknown>)[`ex.${id}`];
  return typeof m === "string" ? m : id;
};

/** The gym's starter program (gymStarter.ts): its name, "3 × Goblet squat" lines, and Save it in the app. */
function starterHtml(p: Place, lang: MsgLang): string {
  const st = readStarter(p.starter);
  if (!st) return "";
  const lines = st.items.map((i) => `<li>${esc(`${i.sets} × ${exName(lang, i.id)}`)}</li>`).join("");
  return `<section class="card" aria-labelledby="starter-h"><h2 id="starter-h">${icon("dumbbell", 16)}${esc(say(lang, "gp.starterTitle"))}</h2><p class="muted">${esc(say(lang, "gp.starterBody"))}</p>${st.name ? `<p class="li-name">${esc(st.name)}</p>` : ""}<ul class="starter">${lines}</ul><p><a href="${esc(`${APP_PATH}#/routine/${p.starter}`)}" rel="nofollow">${esc(say(lang, "gp.starterOpen"))} ›</a></p></section>`;
}

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

export const metaTags = (title: string, desc: string, path: string, ld: unknown, index = true) => {
  const url = `${SITE_URL}${path}`;
  return `<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}">${index ? "" : '<meta name="robots" content="noindex">'}
<meta property="og:type" content="website"><meta property="og:site_name" content="Liftsmith"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${SITE_URL}/og/default.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
};

/**
 * The same trail as `crumbs` for search engines (a BreadcrumbList, so results show "Gyms › Toronto, ON" instead of
 * the address). The last item is the page itself at `path`.
 */
export const crumbsLd = (items: [string, string | null][], path: string) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, href], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE_URL}${href ?? path}` })),
});

export const crumbs = (lang: MsgLang, items: [string, string | null][]) =>
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

export function equipmentHtml(p: Pick<Place, "code">, lang: MsgLang): string {
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

/** "Part of Planet Fitness · See all 2,431 locations", linking to the chain's page (gymChainPage.ts). */
function chainLine(p: Place, lang: MsgLang): string {
  if (!p.chain) return "";
  const all = say(lang, "gp.chainAll", { count: new Intl.NumberFormat(lang).format(p.chain.places) });
  return `<p class="people">${icon("gym", 18)}<span>${esc(say(lang, "gp.chainPart", { chain: p.chain.name }))} · <a href="/gym-chains/${esc(p.chain.slug)}/">${esc(all)}</a></span></p>`;
}

/** Countries that give road distances in miles. */
const MILES = new Set(["US", "GB", "LR", "MM"]);

/** "1.2 km" or "0.8 mi", in the reader's language and the gym's country's unit. */
export function distanceText(kmAway: number, country: string, lang: MsgLang): string {
  const miles = MILES.has(country.toUpperCase());
  const value = miles ? kmAway / 1.609344 : kmAway;
  return new Intl.NumberFormat(lang, {
    style: "unit",
    unit: miles ? "mile" : "kilometer",
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value);
}

/** The other gyms in the city, closest to this one first, each with how far it is. */
export function closestOthers(p: Place, nearby: Place[], count = 8): { place: Place; km: number }[] {
  return nearby
    .filter((x) => x.id !== p.id && x.kind === "gym")
    .map((x) => ({ place: x, km: km(p, x) }))
    .sort((a, b) => a.km - b.km || a.place.name.localeCompare(b.place.name))
    .slice(0, count);
}

/**
 * A few plain sentences about this gym built only from its own facts: where it is, the chain it belongs to, when it's
 * open and the closest other gym (Search Console, 2026-11-27: gym pages were mostly the same template words, so Google
 * left many in "Crawled - currently not indexed"). Each is a whole catalogue line (gp.sum*); the first is also the page's
 * meta description, so a search result says something true about this gym rather than the same line for every gym.
 */
export function gymSummary(p: Place, others: { place: Place; km: number }[], lang: MsgLang): string[] {
  const city = p.city || cityName(p);
  const n = new Intl.NumberFormat(lang);
  const out = [
    p.address ? say(lang, "gp.sumAt", { name: p.name, address: p.address, city }) : say(lang, "gp.sumIn", { name: p.name, city }),
  ];
  if (p.chain && p.chain.places > 1) out.push(say(lang, "gp.sumChain", { count: n.format(p.chain.places), chain: p.chain.name }));
  const week = parseHours(p.hours);
  if (week) {
    const open = week.filter((d) => d.length).length;
    if (allDay(week)) out.push(say(lang, "gp.sumAllDay"));
    else if (open === 7) out.push(say(lang, "gp.sumEveryDay"));
    else if (open > 1) out.push(say(lang, "gp.sumDays", { count: n.format(open) }));
  }
  const near = others[0];
  if (near && near.km <= 50) out.push(say(lang, "gp.sumNear", { gym: near.place.name, distance: distanceText(near.km, p.country, lang) }));
  return out;
}

/** As many of the summary's sentences as fit a search result's description (158 characters), '' when none does. */
export function fitDescription(sentences: string[], max = 158): string {
  let out = "";
  for (const x of sentences) {
    const next = out ? `${out} ${x}` : x;
    if (next.length > max) break;
    out = next;
  }
  return out;
}

export function gymHtml(p: Place, nearby: Place[], lang: MsgLang): string {
  const city = cityName(p);
  const title = `${say(lang, "gp.title", { name: p.name, city: p.city || city })} | Liftsmith`;
  const closest = closestOthers(p, nearby);
  const summary = gymSummary(p, closest, lang);
  const desc = fitDescription(summary) || say(lang, "gp.description", { name: p.name, city: p.city || city });
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
      ...(p.postcode ? { postalCode: p.postcode } : {}),
      ...(p.country ? { addressCountry: p.country } : {}),
    },
    ...(p.website || p.instagram || p.facebook ? { sameAs: [p.website, p.instagram, p.facebook].filter(Boolean) } : {}),
    ...(p.logo ? { image: `${SITE_URL}/api/gyms/photo/?id=${p.logo}` } : {}),
    ...(p.chain ? { brand: { "@type": "Brand", name: p.chain.name, url: `${SITE_URL}/gym-chains/${p.chain.slug}/` } } : {}),
    ...(p.phone ? { telephone: p.phone } : {}),
    ...(p.email ? { email: p.email } : {}),
    ...(p.amenities.length
      ? {
          amenityFeature: p.amenities.map((a) => ({
            "@type": "LocationFeatureSpecification",
            name: say(lang, `gp.amen.${a}` as GpKey),
            value: true,
          })),
        }
      : {}),
    ...(p.prices ? { priceRange: priceLines(p.prices, lang).join(" · ") } : {}),
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
    p.email ? `<li>${icon("chat", 18)}<a href="mailto:${esc(p.email)}">${esc(p.email)}</a></li>` : "",
    p.instagram
      ? `<li>${icon("camera", 18)}<a href="${esc(p.instagram)}" rel="nofollow noopener">${esc(say(lang, "gp.instagram"))}</a></li>`
      : "",
    p.facebook
      ? `<li>${icon("link", 18)}<a href="${esc(p.facebook)}" rel="nofollow noopener">${esc(say(lang, "gp.facebook"))}</a></li>`
      : "",
  ].join("");
  const access = p.wheelchair ? `<p class="muted small">${esc(say(lang, `gp.wheelchair.${p.wheelchair}`))}</p>` : "";
  const hero = `<section class="card hero" aria-labelledby="gym-h">
${p.logo ? `<img class="gym-logo" src="/api/gyms/photo/?id=${esc(p.logo)}" alt="${esc(say(lang, "gp.logoAlt", { name: p.name }))}" width="64" height="64">` : ""}<p class="kicker">${esc(say(lang, "gp.kicker"))}</p>
<h1 id="gym-h"><span>${esc(p.name)}</span>${p.official ? officialMark(lang) : ""}</h1>
<p class="muted where">${icon("pin", 18)}<span>${esc([p.address, city].filter(Boolean).join(", "))}</span></p>
<p class="about">${esc(summary.join(" "))}</p>
<p class="status ${p.official ? "on" : ""}">${esc(p.official ? say(lang, "gp.officialNote") : say(lang, "gp.unofficial"))}</p>
<p class="people">${icon("people", 18)}<span>${esc(liftersLine(p, lang))}</span></p>${chainLine(p, lang)}
<a class="btn btn-primary wide" href="${esc(appGymPath(p.id))}">${icon("plus", 18)}${esc(say(lang, "gp.add"))}</a>
<p class="muted small add-note">${esc(say(lang, p.code ? "gp.addKit" : "gp.addNoKit"))}</p></section>`;
  const place = `<section class="card" aria-labelledby="addr-h"><h2 id="addr-h">${icon("pin", 16)}${esc(say(lang, "gp.address"))}</h2>
<p>${esc([p.address, city, p.postcode].filter(Boolean).join(", "))}</p>${access}${
    p.map
      ? `<figure class="map"><img src="${esc(p.map)}" alt="${esc(say(lang, "gp.mapAlt", { name: p.name }))}" width="640" height="320" loading="lazy"><figcaption>${esc(say(lang, "gp.mapCredit"))}</figcaption></figure>`
      : ""
  }
<ul class="links"><li>${icon("pin", 18)}<a href="${esc(directions)}" rel="nofollow noopener">${esc(say(lang, "gp.directions"))}</a></li>
<li>${icon("link", 18)}<a href="${esc(osm)}" rel="nofollow noopener">${esc(say(lang, "gp.map"))}</a></li>${contact}</ul></section>`;
  const hours = `<section class="card" aria-labelledby="hours-h"><h2 id="hours-h">${icon("clock", 16)}${esc(say(lang, "gp.hours"))}</h2>${hoursHtml(p.hours, lang)}</section>`;
  const kit = `<section class="card" aria-labelledby="kit-h"><h2 id="kit-h">${icon("dumbbell", 16)}${esc(say(lang, "gp.equipment"))}</h2>${equipmentHtml(p, lang)}</section>`;
  const claim = p.official
    ? ""
    : `<section class="card claim" aria-labelledby="claim-h"><h2 id="claim-h">${icon("verified", 16)}${esc(say(lang, "gp.unofficial"))}</h2><p class="muted">${esc(say(lang, "gp.claim"))}</p></section>`;
  const poster = `<section class="card" aria-labelledby="poster-h"><h2 id="poster-h">${icon("flag", 16)}${esc(say(lang, "gp.posterTitle"))}</h2><p class="muted">${esc(say(lang, "gp.posterBody"))}</p><p><a href="${esc(`${gymPath(p)}poster/`)}" rel="nofollow">${esc(say(lang, "gp.posterLink"))}</a></p></section>`;
  const photos = p.photos.length
    ? `<section class="card" aria-labelledby="photos-h"><h2 id="photos-h">${icon("image", 16)}${esc(say(lang, "gp.photos"))}</h2><ul class="photos">${p.photos
        .map(
          (id, i) =>
            `<li><img src="/api/gyms/photo/?id=${esc(id)}" alt="${esc(say(lang, "gp.photoAlt", { n: i + 1, name: p.name }))}" loading="lazy" width="800" height="600"></li>`,
        )
        .join("")}</ul></section>`
    : "";
  // The gym's own club and weekly leaderboard (social.ts gymClubStart), joined in the app.
  const club = p.club
    ? `<section class="card" aria-labelledby="club-h"><h2 id="club-h">${icon("trophy", 16)}${esc(say(lang, "gp.clubTitle"))}</h2><p class="muted">${esc(say(lang, "gp.clubBody"))}</p><p><a href="/app/#/club/${esc(encodeURIComponent(p.club))}">${esc(say(lang, "gp.clubJoin"))} ›</a></p></section>`
    : "";
  // Round 3 (gymExtras.ts): the owner's announcements, amenities and prices, trainers, and equipment reported out of order.
  const news = p.news.length
    ? `<section class="card" aria-labelledby="news-h"><h2 id="news-h">${icon("chat", 16)}${esc(say(lang, "gp.newsTitle"))}</h2><ul class="news">${p.news
        .map((x) => `<li><p>${esc(x.text)}</p><p class="muted small">${esc(dayName(x.at, lang))}</p></li>`)
        .join("")}</ul></section>`
    : "";
  const amenities =
    p.amenities.length || p.prices
      ? `<section class="card" aria-labelledby="amen-h"><h2 id="amen-h">${icon("sparkle", 16)}${esc(say(lang, "gp.amenities"))}</h2>${
          p.prices
            ? `<ul class="prices">${priceLines(p.prices, lang)
                .map((x) => `<li>${esc(x)}</li>`)
                .join("")}</ul>`
            : ""
        }${p.amenities.length ? `<ul class="chips">${p.amenities.map((a) => `<li>${esc(say(lang, `gp.amen.${a}` as GpKey))}</li>`).join("")}</ul>` : ""}</section>`
      : "";
  const trainers = p.trainers.length
    ? `<section class="card" aria-labelledby="trainers-h"><h2 id="trainers-h">${icon("people", 16)}${esc(say(lang, "gp.trainersTitle"))}</h2><p class="muted">${esc(say(lang, "gp.trainersBody"))}</p><ul class="trainers">${p.trainers
        .map(
          (x) =>
            `<li><p class="li-name">${esc(x.name)}</p>${x.role ? `<p class="muted small">${esc(say(lang, `gp.role.${x.role}` as GpKey))}</p>` : ""}${x.bio ? `<p>${esc(x.bio)}</p>` : ""}<p><a href="/app/#/trainer/${esc(x.code)}" rel="nofollow">${esc(say(lang, "gp.trainWith", { name: x.name }))} ›</a></p></li>`,
        )
        .join("")}</ul>${p.official ? "" : `<p class="muted small">${esc(say(lang, "gp.trainersUnofficial"))}</p>`}</section>`
    : "";
  const issues = p.issues.length
    ? `<section class="card" aria-labelledby="issues-h"><h2 id="issues-h">${icon("flag", 16)}${esc(say(lang, "gp.issuesTitle"))}</h2><ul class="chips">${p.issues
        .map((x) => `<li>${esc(say(lang, `gp.issue.${x.kind}`, { item: equipName(lang, x.equipment) }))}</li>`)
        .join("")}</ul><p class="muted small">${esc(say(lang, "gp.issuesNote"))}</p></section>`
    : "";
  const more = closest.length
    ? `<section class="card" aria-labelledby="more-h"><h2 id="more-h">${icon("gym", 16)}${esc(say(lang, "gp.more", { city: p.city || city }))}</h2>
<ul class="list">${closest.map((x) => listItem(x.place, lang, undefined, say(lang, "gp.away", { distance: distanceText(x.km, p.country, lang) }))).join("")}</ul><a class="quiet" href="${esc(cityPath(p.citySlug))}">${esc(say(lang, "gp.cityTitle", { city }))} ›</a></section>`
    : "";
  // Anyone can say the page is wrong, closed, listed twice or not a gym (gymReportPage.ts, gymPlaceReports.ts).
  const reportLink = `<p class="report-link"><a class="quiet" href="${esc(`${gymPath(p)}report/`)}" rel="nofollow">${icon("flag", 16)}${esc(say(lang, "gp.reportLink"))}</a></p>`;
  const credit = p.source === "osm" ? `<p class="credit">${esc(say(lang, "gp.osm"))}</p>` : "";
  const trail: [string, string | null][] = [
    [say(lang, "gp.crumbs"), "/gyms/"],
    [city, cityPath(p.citySlug)],
    [p.name, null],
  ];
  const body = `<div class="strip"><div class="wrap row strip-row"><p>${esc(say(lang, "gp.strip"))}</p></div></div>
<main id="main" class="wrap page">${crumbs(lang, trail)}
<div class="grid"><div class="col">${hero}${news}${starterHtml(p, lang)}${classesHtml(p.classes ?? [], lang)}${photos}${club}${trainers}${claim}${poster}</div><div class="col">${place}${hours}${amenities}${kit}${issues}${more}</div></div>${reportLink}${credit}</main>`;
  return framePage(lang, title, metaTags(title, desc, path, [ld, crumbsLd(trail, path)], gymIndexable(p)), body, GYM_STYLE, "gym");
}

/** "Day pass $15", "Membership from $49 a month": the prices the owner set, in the reader's language. */
export function priceLines(prices: Prices, lang: MsgLang): string[] {
  return PRICE_KINDS.flatMap((k) =>
    prices[k] === undefined ? [] : [say(lang, `gp.price.${k}`, { price: money(prices[k], prices.currency, lang) })],
  );
}

// --- Class schedule (gymClasses.ts) ---

/** "6:00 PM" or "18:00" in the reader's language, for a time on the gym's own clock. */
const classClock = (hhmm: string, lang: MsgLang) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat(lang, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(
    Date.UTC(2024, 0, 1, h ?? 0, m ?? 0),
  );
};

/** The gym's week of classes, Monday first; dates off show under the class until they're past. */
export function classesHtml(classes: readonly GymClass[], lang: MsgLang): string {
  if (!classes.length) return "";
  return `<section class="card" aria-labelledby="classes-h"><h2 id="classes-h">${icon("calendar", 16)}${esc(say(lang, "gp.classesTitle"))}</h2><p class="muted small">${esc(say(lang, "gp.classesLocal"))} ${esc(say(lang, "gp.classBook"))}</p>${classDaysHtml(classes, lang)}</section>`;
}

/** The week itself, one heading per day with classes (also the website widget's, gymWidgets.ts). */
export function classDaysHtml(classes: readonly GymClass[], lang: MsgLang): string {
  const names = dayNames(lang);
  const days = timetable(classes)
    .map(({ weekday, classes: list }) => {
      const items = list
        .map((c) => {
          const sub = [say(lang, `gp.classKind.${c.kind}` as GpKey), c.coach ? say(lang, "gp.classWith", { name: c.coach }) : "", c.room]
            .filter(Boolean)
            .join(" · ");
          const off = c.off.length
            ? `<p class="muted small">${esc(say(lang, "gp.classOffOn", { dates: new Intl.ListFormat(lang).format(c.off.map((d) => dayName(Date.parse(`${d}T12:00:00Z`), lang))) }))}</p>`
            : "";
          return `<li><span class="cl-time">${esc(`${classClock(c.start, lang)}–${classClock(endTime(c.start, c.minutes), lang)}`)}</span><span><span class="li-name">${esc(c.name)}</span><span class="muted small cl-sub">${esc(sub)}</span>${c.note ? `<span class="cl-note">${esc(c.note)}</span>` : ""}${off}</span></li>`;
        })
        .join("");
      // dayNames counts Monday as 0; a class's weekday counts Sunday as 0.
      return `<div class="cl-day"><h3>${esc(names[(weekday + 6) % 7]!)}</h3><ul class="classes">${items}</ul></div>`;
    })
    .join("");
  return days;
}

const dayName = (at: number, lang: MsgLang) =>
  new Intl.DateTimeFormat(lang, { month: "short", day: "numeric", timeZone: "UTC" }).format(at);

/** `away`: how far it is from the gym whose page this is ("1.2 km"). A gym page that isn't offered to search engines
 * (gymIndexable) is linked with `nofollow`, so crawlers spend their visits on the pages that are (Search Console,
 * 2026-11-27: thousands of linked noindex gym pages sat in "Excluded by noindex"). */
function listItem(p: Place, lang: MsgLang, pin?: number, away = ""): string {
  const sub = [away, p.address, p.lifters > 0 ? liftersLine(p, lang) : ""].filter(Boolean).join(" · ");
  const badge = pin ? `<span class="pin" aria-hidden="true">${pin}</span>` : "";
  return `<li><a href="${esc(gymPath(p))}"${gymIndexable(p) ? "" : ' rel="nofollow"'}><span class="li-name">${badge}${esc(p.name)}${p.official ? officialMark(lang) : ""}</span>${sub ? `<span class="muted small">${esc(sub)}</span>` : ""}</a></li>`;
}

// --- A city ---

/** `trainers`: people listed at the city's gyms (trainerDirectory.ts); with any, the page links to the directory. */
export function cityHtml(citySlug: string, places: Place[], lang: MsgLang, trainers = 0): string {
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
  // A map of the city's gyms above the list (Melvin, 2026-11-13), its pins numbered as the gyms list numbers them.
  const map = areaMapPath(gyms.map((p) => p.id));
  const pinOf = (p: Place, i: number) => (map && p.kind === "gym" && i < AREA_PINS ? i + 1 : undefined);
  const figure = map
    ? `<figure class="map area"><img src="${esc(map)}" alt="${esc(say(lang, "gp.cityMapAlt", { city }))}" width="640" height="360"><figcaption>${esc(say(lang, "gp.mapCredit"))}</figcaption></figure>`
    : "";
  const section = (id: string, label: string, list: Place[]) =>
    list.length
      ? `<section class="card" aria-labelledby="${id}"><h2 id="${id}">${icon("gym", 16)}${esc(label)}</h2><ul class="list">${list.map((p, i) => listItem(p, lang, pinOf(p, i))).join("")}</ul></section>`
      : "";
  const credit = places.some((p) => p.source === "osm") ? `<p class="credit">${esc(say(lang, "gp.osm"))}</p>` : "";
  const trail: [string, string | null][] = [
    [say(lang, "gp.crumbs"), "/gyms/"],
    [city, null],
  ];
  const body = `<main id="main" class="wrap page narrow">${crumbs(lang, trail)}
<header class="head"><p class="kicker">${esc(say(lang, "gp.cityKicker"))}</p><h1>${esc(say(lang, "gp.cityTitle", { city }))}</h1><p class="muted">${esc(desc)}</p></header>
${figure}${section("gyms-h", say(lang, "gp.cityGyms"), gyms)}${section("studios-h", say(lang, "gp.studios"), studios)}${
    trainers ? `<p><a class="quiet" href="/trainers/${esc(citySlug)}/">${esc(say(lang, "gp.dirLink", { city }))} ›</a></p>` : ""
  }${missing(lang)}${credit}</main>`;
  return framePage(lang, title, metaTags(title, desc, path, [ld, crumbsLd(trail, path)], gyms.length > 0), body, GYM_STYLE, "gym");
}

/** "Gym not listed? Add it in the app": the app's add form (GymAdd.tsx), which staff check. */
const missing = (lang: MsgLang) => `<p><a class="quiet" href="/app/#/gymadd">${esc(say(lang, "gp.missing"))} ›</a></p>`;

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
  // The map of the closest gyms leads (gymsNear.ts); the full directory stays in the page, folded, so search engines
  // still follow every city link (Melvin, 2026-11-15).
  const body = `<main id="main" class="wrap page">
<header class="head"><p class="kicker">${esc(say(lang, "gp.cityKicker"))}</p><h1>${esc(say(lang, "gp.indexTitle"))}</h1><p class="muted">${esc(say(lang, "gp.indexBody"))}</p></header>
${nearSection(lang)}
<div class="narrow">${
    list.length
      ? `<div class="find" id="find" hidden><label for="city-search">${esc(say(lang, "gp.searchLabel"))}</label><input id="city-search" type="search" autocomplete="off" enterkeyhint="search" placeholder="${esc(say(lang, "gp.searchHint"))}"></div>
<details class="dir" id="directory"><summary>${esc(say(lang, "gp.directoryShow", { count: n.format(list.length) }))}</summary><section class="card" aria-label="${esc(say(lang, "gp.directoryTitle"))}"><ul class="list" id="city-list">${items}</ul><p class="muted small" id="city-none" hidden>${esc(say(lang, "gp.searchNone"))}</p></section></details>`
      : ""
  }<p><a class="quiet" href="/gym-chains/">${esc(say(lang, "gp.chainsLink"))} ›</a></p>${missing(lang)}<p class="credit">${esc(say(lang, "gp.osm"))}</p></div></main>`;
  return framePage(lang, title, metaTags(title, desc, "/gyms/", ld) + NEAR_HEAD, body, GYM_STYLE + NEAR_STYLE, "gym");
}

export function goneHtml(lang: MsgLang): string {
  const body = `<main id="main" class="wrap gone">${icon("gym", 28, "gone-icon")}<h1>${esc(say(lang, "gp.gone"))}</h1><p class="muted">${esc(say(lang, "gp.goneBody"))}</p>
<a class="btn btn-primary" href="/gyms/">${esc(say(lang, "gp.indexTitle"))}</a></main>`;
  return framePage(lang, `${say(lang, "gp.gone")} | Liftsmith`, '<meta name="robots" content="noindex">', body, GYM_STYLE, "gym");
}

// --- The gym sitemap ---

/** How many addresses one part of the gym sitemap holds: well under the 50,000 (and 50 MB) a sitemap may have. */
export const SITEMAP_PART = 20_000;

/**
 * The gym sitemap in parts (2026-11-20: it had reached 46,745 of the 50,000 addresses one sitemap may hold, and
 * Google skips a sitemap over the limit whole). Part 1 is the hubs (/gyms/, cities, chains, trainers, programs,
 * community, routines), then the gym pages `SITEMAP_PART` at a time.
 */
export function sitemapParts<T>(hubs: T[], gyms: T[]): T[][] {
  const parts = [hubs];
  for (let i = 0; i < gyms.length; i += SITEMAP_PART) parts.push(gyms.slice(i, i + SITEMAP_PART));
  return parts;
}

/** /sitemap-gyms.xml: a sitemap index naming /sitemap-gyms-1.xml and on, each with its newest change. */
export function gymSitemapIndexXml(parts: { lastModified: number }[][]): string {
  const items = parts.map((part, i) => {
    const newest = Math.max(0, ...part.map((e) => e.lastModified));
    return `<sitemap><loc>${esc(`${SITE_URL}/sitemap-gyms-${i + 1}.xml`)}</loc>${newest ? `<lastmod>${new Date(newest).toISOString().slice(0, 10)}</lastmod>` : ""}</sitemap>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join("\n")}\n</sitemapindex>\n`;
}

export function gymSitemapXml(entries: { path: string; lastModified: number }[]): string {
  const urls = entries.map(
    (e) =>
      `<url><loc>${esc(`${SITE_URL}${e.path}`)}</loc>${e.lastModified ? `<lastmod>${new Date(e.lastModified).toISOString().slice(0, 10)}</lastmod>` : ""}</url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export const GYM_STYLE = `
.gym-logo{width:64px;height:64px;border-radius:14px;object-fit:contain;background:#fff;margin-bottom:8px}
.page>section.card+section.card{margin-top:16px}
.map{margin:12px 0 0}.map.area{margin:0 0 16px}.map img{display:block;width:100%;height:auto;border-radius:12px}.map figcaption{font-size:.75rem;color:var(--muted);margin-top:4px}
.photos{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;list-style:none;margin:0;padding:0}.photos img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.page{padding-top:20px;padding-bottom:48px}.narrow{max-width:48rem}
.crumbs ol{display:flex;flex-wrap:wrap;gap:4px 8px;list-style:none;margin:0 0 16px;padding:0;font-size:.875rem;color:var(--muted)}
.crumbs li+li::before{content:"›";margin-right:8px}.crumbs a{text-decoration:none;display:inline-flex;min-height:44px;align-items:center}.crumbs a:hover{color:var(--ink)}
.crumbs span{display:inline-flex;min-height:44px;align-items:center}
.grid{display:grid;gap:16px}.col{display:grid;gap:16px;align-content:start}
@media (min-width:960px){.grid{grid-template-columns:400px minmax(0,1fr);gap:28px}.grid>.col:first-child{position:sticky;top:88px}}
.hero h1{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:1.75rem;line-height:1.15;font-weight:800;letter-spacing:-.02em;margin:6px 0 8px;overflow-wrap:anywhere}
.tick{display:inline-flex;color:var(--accent);flex:none}
.about{margin-top:12px}
.where,.people{display:flex;gap:8px;align-items:flex-start;margin-top:8px}.where svg,.people svg{flex:none;margin-top:2px}
.status{margin-top:12px;font-size:.875rem;color:var(--muted)}.status.on{color:var(--accent);font-weight:600}
.wide{width:100%;margin-top:18px}.add-note{margin-top:10px}
.card h2,.head .kicker{display:flex;align-items:center;gap:8px;font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 12px}
.head{margin-bottom:16px}.head h1{font-size:1.75rem;line-height:1.15;font-weight:800;letter-spacing:-.02em;margin:6px 0 8px}
.links,.list{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:4px}.links li{display:flex;align-items:center;gap:10px}
.links a{display:inline-flex;min-height:44px;align-items:center;font-weight:600}
.list{margin:0}.list li a{display:flex;flex-direction:column;gap:2px;min-height:44px;justify-content:center;padding:10px 0;border-top:1px solid var(--line);text-decoration:none}
.list li:first-child a{border-top:0;padding-top:0}.list a:hover .li-name{text-decoration:underline}
.li-name{display:inline-flex;align-items:center;gap:6px;font-weight:600}.pin{display:inline-grid;place-items:center;min-width:24px;height:24px;padding:0 4px;border-radius:12px;background:var(--accent);color:var(--bg);font-size:.75rem;font-weight:700;font-variant-numeric:tabular-nums}
.hours{display:grid;gap:0;margin:0}.hours div{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid var(--line)}
.hours div:first-child{border-top:0;padding-top:0}.hours dd{margin:0;font-variant-numeric:tabular-nums;text-align:right}
.chips{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:0}
.news,.trainers,.prices{list-style:none;margin:0;padding:0;display:grid;gap:12px}.starter{margin:8px 0;padding-left:20px}.news p,.trainers p{margin:0}
.trainers li{border-top:1px solid var(--line);padding-top:12px}.trainers li:first-child{border-top:0;padding-top:0}
.rating{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px}.review{margin:8px 0 0;padding-left:10px;border-left:2px solid var(--line)}.review p{margin:2px 0}
.trainers a{display:inline-flex;min-height:44px;align-items:center;font-weight:600}.prices{gap:4px;margin-bottom:12px;font-weight:600}
.chips li{padding:6px 12px;border:1px solid var(--line);border-radius:999px;font-size:.875rem}
.db{margin-top:12px}.claim{border-style:dashed}
.credit{margin-top:24px;font-size:.75rem;color:var(--faint)}
.report-link{margin-top:16px}.report-link .quiet{gap:6px}
.cl-day{margin-top:12px}.cl-day h3{margin:0 0 6px;font-size:.875rem}.classes{list-style:none;margin:0;padding:0;display:grid;gap:0}
.classes li{display:flex;gap:12px;padding:8px 0;border-top:1px solid var(--line)}.classes li:first-child{border-top:0;padding-top:0}
.classes li>span:last-child{display:flex;flex-direction:column;gap:2px;min-width:0}.cl-time{flex:0 0 7.5rem;font-variant-numeric:tabular-nums;color:var(--muted)}
.cl-note{font-size:.875rem;overflow-wrap:anywhere}.cl-sub{overflow-wrap:anywhere}`;
