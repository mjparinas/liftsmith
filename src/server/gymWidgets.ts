// The website widgets an official gym puts on its own site (src/lib/gymWidgets.ts, docs/decisions/gyms.md "Website
// widgets"). Each is drawn here as one small, plain HTML page with no scripts (or, for the badge, one SVG image), in the
// language and look the owner picked, and every link on it opens the gym's page here in a new tab.
//
// They're fast and safe to embed: one database row per widget (two for a schedule, widgetPlace), cached at the edge, no
// scripts, cookies or tracking, styles inline, and a policy that lets any site frame them and nothing else run.
import {
  BADGE_HEIGHT,
  badgeWidth,
  isWidgetKind,
  isWidgetLang,
  isWidgetTheme,
  widgetGymUrl,
  type WidgetKind,
  type WidgetTheme,
} from "@/lib/gymWidgets";
import type { MsgLang } from "@/lib/messageText";
import { WIDGET_CSP } from "@/lib/securityHeaders";
import { SITE_URL } from "@/lib/site";

import { appGymPath, classDaysHtml, equipmentHtml, priceLines, say, type GpKey } from "./gymPage";
import type { Place } from "./gymPlaces";
import { esc, icon } from "./siteFrame";

/** Ten minutes in the browser, fifteen at the edge, then the old copy for a day while a fresh one is drawn. */
const WIDGET_CACHE = "public, max-age=600, s-maxage=900, stale-while-revalidate=86400";

export const WIDGET_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy": WIDGET_CSP,
  "Cache-Control": WIDGET_CACHE,
  // The gym's page is the one to rank; the widget is a piece of someone else's page.
  "X-Robots-Tag": "noindex",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
};

/** The badge names no gym, so it's the same for every gym: a week in the browser and at the edge. */
export const BADGE_HEADERS = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
  "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
  "X-Robots-Tag": "noindex",
  "X-Content-Type-Options": "nosniff",
};

/** What the address asked for, checked: an unknown language is English and an unknown look is light. */
export function widgetRequest(u: URLSearchParams): { id: string; kind: WidgetKind | null; lang: MsgLang; theme: WidgetTheme } {
  const lang = u.get("lang");
  const theme = u.get("theme");
  const kind = u.get("kind");
  return {
    id: u.get("id") ?? "",
    kind: isWidgetKind(kind) ? kind : null,
    lang: isWidgetLang(lang) ? lang : "en",
    theme: isWidgetTheme(theme) ? theme : "light",
  };
}

// The app icon's anvil and barbell (public/icon.svg), drawn at `size` px.
const MARK_DEFS = `<linearGradient id="lsg" gradientUnits="userSpaceOnUse" x1="206" y1="196" x2="804" y2="794"><stop offset="0" stop-color="#5b9cff"/><stop offset=".55" stop-color="#7f8bff"/><stop offset="1" stop-color="#9b86ff"/></linearGradient>`;
const MARK_SHAPES = `<rect x="226" y="302" width="572" height="36" rx="18"/><rect x="280" y="196" width="68" height="248" rx="20"/><rect x="676" y="196" width="68" height="248" rx="20"/><rect x="358" y="236" width="40" height="168" rx="14"/><rect x="626" y="236" width="40" height="168" rx="14"/><path d="M206 478C206 470 214 466 224 466C300 466 340 458 372 458L788 458Q804 458 804 474L804 534Q804 550 788 550C724 550 676 572 652 612L644 646L712 680Q726 688 726 704L726 778Q726 794 710 794L314 794Q298 794 298 778L298 704Q298 688 312 680L380 646L372 612C356 580 320 560 276 546C232 532 206 506 206 478Z"/>`;
const mark = (x: number, y: number, size: number) =>
  `<g transform="translate(${x} ${y}) scale(${size / 1024}) translate(7 17)" fill="url(#lsg)">${MARK_SHAPES}</g>`;

const COLOURS: Record<
  WidgetTheme,
  { bg: string; raised: string; line: string; ink: string; muted: string; accent: string; btnInk: string }
> = {
  light: { bg: "#ffffff", raised: "#f3f6fb", line: "#dde3ec", ink: "#0f1722", muted: "#4e5b6c", accent: "#1d4fc4", btnInk: "#ffffff" },
  dark: { bg: "#10151d", raised: "#18202b", line: "#232d3a", ink: "#eef2f7", muted: "#a3afbf", accent: "#7fb0ff", btnInk: "#080b10" },
};

function style(theme: WidgetTheme): string {
  const c = COLOURS[theme];
  return `:root{color-scheme:${theme}}*{box-sizing:border-box}
html,body{margin:0;background:${c.bg};color:${c.ink};font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}
body{border:1px solid ${c.line};border-radius:16px;height:100vh;overflow:hidden;display:flex;flex-direction:column}
a{color:${c.accent}}.muted{color:${c.muted}}.small{font-size:.8125rem}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
header{display:flex;align-items:center;gap:10px;padding:14px 16px 10px}header img{width:40px;height:40px;border-radius:10px;object-fit:cover;flex:none}
h1{margin:0;font-size:1.0625rem;line-height:1.25;display:flex;align-items:center;gap:6px}h1 svg{color:${c.accent};flex:none}
.kicker{margin:0;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:${c.muted};font-weight:700}
main{flex:1;min-height:0;overflow:auto;padding:0 16px 12px}p{margin:6px 0}h2{margin:14px 0 6px;font-size:.8125rem;color:${c.muted};text-transform:uppercase;letter-spacing:.05em}
h3{margin:12px 0 4px;font-size:.875rem}.cl-day:first-child h3{margin-top:4px}
.classes{list-style:none;margin:0;padding:0}.classes li{display:flex;gap:10px;padding:7px 0;border-top:1px solid ${c.line}}.classes li:first-child{border-top:0}
.classes li>span:last-child{display:flex;flex-direction:column;gap:1px;min-width:0}.cl-time{flex:none;min-width:8.6rem;white-space:nowrap;font-size:.875rem;font-variant-numeric:tabular-nums;color:${c.muted}}
.li-name{font-weight:600}.cl-note,.cl-sub{overflow-wrap:anywhere}.cl-note{font-size:.8125rem}
.chips{display:flex;flex-wrap:wrap;gap:6px;list-style:none;padding:0;margin:0}.chips li{padding:4px 10px;border:1px solid ${c.line};border-radius:999px;font-size:.8125rem;background:${c.raised}}
.db{margin-top:8px}.prices{list-style:none;margin:0 0 8px;padding:0;font-weight:600}
.add{display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;margin:14px 0 2px;padding:0 14px;border-radius:12px;background:${c.accent};color:${c.btnInk};font-weight:700;text-decoration:none}
footer{display:flex;align-items:center;gap:8px;padding:10px 16px;border-top:1px solid ${c.line};font-size:.8125rem}footer a{display:inline-flex;align-items:center;min-height:32px;font-weight:600;text-decoration:none}
.off{padding:16px}`;
}

const page = (lang: MsgLang, theme: WidgetTheme, title: string, body: string) =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title><style>${style(theme)}</style></head><body>${body}</body></html>`;

/** "See Steve Nash Fitness World on Liftsmith", with the mark, opening the gym's page in a new tab. */
const footer = (p: Place, kind: WidgetKind, lang: MsgLang) =>
  `<footer><svg width="20" height="20" viewBox="0 0 1024 1024" aria-hidden="true"><defs>${MARK_DEFS}</defs><g fill="url(#lsg)" transform="translate(7 17)">${MARK_SHAPES}</g></svg><a href="${esc(widgetGymUrl(p, kind))}" target="_blank" rel="noopener">${esc(say(lang, "gp.w.see", { name: p.name }))} ›</a></footer>`;

const header = (p: Place, kicker: string, lang: MsgLang) =>
  `<header>${p.logo ? `<img src="${esc(`${SITE_URL}/api/gyms/photo/?id=${p.logo}`)}" alt="${esc(say(lang, "gp.logoAlt", { name: p.name }))}" width="40" height="40">` : ""}<div><p class="kicker">${esc(kicker)}</p><h1>${esc(p.name)}${p.official ? `${icon("verified", 16)}<span class="sr">${esc(say(lang, "gp.official"))}</span>` : ""}</h1></div></header>`;

/**
 * One framed widget. A gym that isn't official (released, or never claimed) or is gone gets a short line and a link to
 * Liftsmith's gym finder instead of an error, so the owner's site never shows a broken box.
 */
export function widgetHtml(p: Place | null, kind: Exclude<WidgetKind, "badge">, lang: MsgLang, theme: WidgetTheme): string {
  if (!p || !p.official)
    return page(
      lang,
      theme,
      "Liftsmith",
      `<main class="off"><p class="muted">${esc(say(lang, "gp.w.off"))}</p><p><a href="${esc(`${SITE_URL}/gyms/?utm_source=gym_widget&utm_medium=widget&utm_campaign=off`)}" target="_blank" rel="noopener">${esc(say(lang, "gp.crumbs"))} ›</a></p></main>`,
    );
  if (kind === "schedule") {
    const week = p.classes.length
      ? `<p class="muted small">${esc(say(lang, "gp.classesLocal"))} ${esc(say(lang, "gp.classBook"))}</p>${classDaysHtml(p.classes, lang)}`
      : `<p class="muted">${esc(say(lang, "gp.w.noClasses"))}</p>`;
    return page(
      lang,
      theme,
      `${say(lang, "gp.classesTitle")} · ${p.name}`,
      `${header(p, say(lang, "gp.classesTitle"), lang)}<main>${week}</main>${footer(p, kind, lang)}`,
    );
  }
  const amenities =
    p.amenities.length || p.prices
      ? `<h2>${esc(say(lang, "gp.amenities"))}</h2>${
          p.prices
            ? `<ul class="prices">${priceLines(p.prices, lang)
                .map((x) => `<li>${esc(x)}</li>`)
                .join("")}</ul>`
            : ""
        }${
          p.amenities.length
            ? `<ul class="chips">${p.amenities.map((a) => `<li>${esc(say(lang, `gp.amen.${a}` as GpKey))}</li>`).join("")}</ul>`
            : ""
        }`
      : "";
  const add = `<a class="add" href="${esc(`${SITE_URL}${appGymPath(p.id)}`)}" target="_blank" rel="noopener">${esc(say(lang, "gp.add"))}</a>`;
  return page(
    lang,
    theme,
    `${say(lang, "gp.equipment")} · ${p.name}`,
    `${header(p, say(lang, "gp.equipment"), lang)}<main>${equipmentHtml(p, lang)}${amenities}${add}</main>${footer(p, kind, lang)}`,
  );
}

/** The "Find us on Liftsmith" badge, as an SVG image: the mark, then the two lines. */
export function badgeSvg(lang: MsgLang, theme: WidgetTheme): string {
  const small = say(lang, "gp.w.findUs");
  const big = "Liftsmith";
  const w = badgeWidth(small, big);
  const h = BADGE_HEIGHT;
  const c =
    theme === "dark"
      ? { bg: "#080b10", line: "#232d3a", ink: "#ffffff", muted: "#a3afbf" }
      : { bg: "#ffffff", line: "#cfd6e1", ink: "#0f1722", muted: "#4e5b6c" };
  const font = `system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(say(lang, "gp.w.badgeAlt"))}"><title>${esc(say(lang, "gp.w.badgeAlt"))}</title><defs>${MARK_DEFS}</defs><rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="11" fill="${c.bg}" stroke="${c.line}"/>${mark(9, 8, 32)}<text x="48" y="19" font-family="${font}" font-size="11" fill="${c.muted}">${esc(small)}</text><text x="48" y="37" font-family="${font}" font-size="18" font-weight="700" fill="${c.ink}">${big}</text></svg>`;
}
