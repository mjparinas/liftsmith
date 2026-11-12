// The print sheet for a gym's poster order (docs/decisions/gyms.md, step 4), opened from Admin › Gyms and printed from
// the browser: plain HTML with no scripts, the QR code drawn as inline SVG (black on white, so it always scans).
//   1. A letter to the gym, with the mailing address placed for a #10 window envelope and, for an unclaimed gym, its
//      one-time claim code. It goes in the envelope, never on the wall.
//   2. The poster, one page (Letter in Canada and the US, else A4).
//   3. Two 4 × 6 in inserts for a table stand (an acrylic sign holder), side by side on a landscape page with crop marks.
// The QR code opens the gym's web page with ?from=qr, which counts the scan and offers "Add this gym to your Liftsmith".
// Text comes from the gym's order language (gp.print.*), with the app's own button labels quoted in the steps.
import { qrPath } from "@/components/QrCode";
import { BRAND } from "@/lib/brand";
import type { MsgLang } from "@/lib/messageText";
import { SITE_URL } from "@/lib/site";
import * as gym from "@/locales/text/gym";

import { gymPath, say } from "./gymPage";
import type { PosterRow } from "./gymPosters";
import { esc } from "./siteFrame";

type GymKey = keyof typeof gym.en;
const GYM: Record<MsgLang, Partial<Record<GymKey, unknown>>> = { en: gym.en, es: gym.es, fr: gym.fr, de: gym.de, it: gym.it, ja: gym.ja };
const appLabel = (lang: MsgLang, key: GymKey) => String(GYM[lang][key] ?? gym.en[key]);

/** Where the gym's QR code goes. */
export const qrTarget = (row: Pick<PosterRow, "citySlug" | "slug">) => `${SITE_URL}${gymPath(row)}?from=qr`;

/** Letter paper in Canada and the US (and where the country isn't known), A4 everywhere else. */
export const paperFor = (country: string) => (!country || ["CA", "US"].includes(country.toUpperCase()) ? "letter" : "A4");

export const PRINT_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex",
};

// The Liftsmith mark (public/icon.svg) without its tile, in the brand gradient.
const MARK = `<svg class="mark" viewBox="200 190 610 610" aria-hidden="true"><defs><linearGradient id="lg" gradientUnits="userSpaceOnUse" x1="206" y1="196" x2="804" y2="794"><stop offset="0" stop-color="#3b7cf0"/><stop offset=".55" stop-color="#6271ef"/><stop offset="1" stop-color="#7e66e8"/></linearGradient></defs><g fill="url(#lg)"><rect x="226" y="302" width="572" height="36" rx="18"/><rect x="280" y="196" width="68" height="248" rx="20"/><rect x="676" y="196" width="68" height="248" rx="20"/><rect x="358" y="236" width="40" height="168" rx="14"/><rect x="626" y="236" width="40" height="168" rx="14"/><path d="M206 478C206 470 214 466 224 466C300 466 340 458 372 458L788 458Q804 458 804 474L804 534Q804 550 788 550C724 550 676 572 652 612L644 646L712 680Q726 688 726 704L726 778Q726 794 710 794L314 794Q298 794 298 778L298 704Q298 688 312 680L380 646L372 612C356 580 320 560 276 546C232 532 206 506 206 478Z"/></g></svg>`;
const VERIFIED = `<svg class="tick" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#2563eb"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function qrSvg(text: string, cls: string): string {
  const { size, d } = qrPath(text);
  const q = 4;
  const edge = size + q * 2;
  return `<svg class="${cls}" viewBox="${-q} ${-q} ${edge} ${edge}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect x="${-q}" y="${-q}" width="${edge}" height="${edge}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

const brand = `<div class="brand">${MARK}<span>${esc(BRAND.name)}</span></div>`;
const site = SITE_URL.replace(/^https?:\/\//, "");

function letter(row: Sheet, code: string | null, lang: MsgLang): string {
  const name = esc(row.placeName);
  const to = [row.shipTo, row.placeName, ...row.address.split("\n")].filter(Boolean).map(esc).join("<br>");
  const claim = code
    ? `<p>${esc(say(lang, "gp.print.letterClaim", { name: row.placeName, claim: appLabel(lang, "gym.claim.open"), poster: appLabel(lang, "gym.claim.posterTitle") }))}</p>
<p class="code">${esc(code)}</p>
<p>${esc(say(lang, "gp.print.letterWhy"))}</p>`
    : `<p>${esc(say(lang, "gp.print.letterOfficial", { name: row.placeName }))}</p>`;
  return `<section class="page portrait letter">
<header>${brand}<p class="from">${esc(site)}</p></header>
<address class="to">${to}</address>
<h1>${esc(say(lang, "gp.print.letterHello"))}</h1>
<p>${esc(say(lang, "gp.print.letterBody", { name: row.placeName }))}</p>
${claim}
<p>${esc(say(lang, "gp.print.letterThanks"))}</p>
<p class="sign">${esc(BRAND.name)} · ${esc(site)}</p>
<p class="ref">${name} · ${esc(row.id)}</p>
</section>`;
}

function poster(row: Sheet, lang: MsgLang): string {
  const steps = (["gp.print.step1", "gp.print.step2", "gp.print.step3"] as const)
    .map((k) => `<li>${esc(say(lang, k, { add: appLabel(lang, "gym.sharedAdd") }))}</li>`)
    .join("");
  return `<section class="page portrait poster">
${brand}
<h1>${esc(say(lang, "gp.print.headline"))}</h1>
<p class="gym">${esc(row.placeName)}${row.official ? VERIFIED : ""}</p>
${qrSvg(qrTarget(row), "qr")}
<p class="scan">${esc(say(lang, "gp.print.scan"))}</p>
<ol class="steps">${steps}</ol>
<p class="sub">${esc(say(lang, "gp.print.sub", { name: row.placeName }))}</p>
<footer><strong>${esc(site)}</strong> · ${esc(say(lang, "gp.print.free"))}</footer>
</section>`;
}

function insert(row: Sheet, lang: MsgLang): string {
  return `<div class="insert">
${brand}
<h2>${esc(say(lang, "gp.print.headline"))}</h2>
<p class="gym">${esc(row.placeName)}${row.official ? VERIFIED : ""}</p>
${qrSvg(qrTarget(row), "qr")}
<p class="scan">${esc(say(lang, "gp.print.scan"))}</p>
<p class="site">${esc(site)}</p>
</div>`;
}

const STYLE = (paper: string) => `
@page { size: ${paper}; margin: 0 }
@page stand { size: ${paper} landscape; margin: 0 }
* { box-sizing: border-box }
html { background: #e5e7eb }
body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Hiragino Sans", "Noto Sans JP", sans-serif; color: #0b1220; -webkit-print-color-adjust: exact; print-color-adjust: exact }
.help { max-width: 8.5in; margin: 16px auto; padding: 12px 16px; background: #fff; border-radius: 8px; font-size: 14px; line-height: 1.5 }
.help h1 { font-size: 18px; margin: 0 0 4px }
.page { background: #fff; margin: 16px auto; position: relative; overflow: hidden; break-after: page }
.page:last-child { break-after: auto }
.portrait { width: ${paper === "A4" ? "210mm" : "8.5in"}; height: ${paper === "A4" ? "297mm" : "11in"} }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 800; letter-spacing: -0.01em }
.mark { width: 1em; height: 1em }
.tick { width: 0.8em; height: 0.8em; margin-left: 0.25em; vertical-align: -0.05em }
.letter { padding: 0.75in 0.9in; font-size: 12pt; line-height: 1.5 }
.letter header { display: flex; justify-content: space-between; align-items: center; font-size: 16pt }
.letter .from { font-size: 10pt; color: #475569; margin: 0 }
.letter .to { position: absolute; left: 0.9in; top: 2.1in; width: 4in; font-style: normal; font-size: 12pt; line-height: 1.4 }
.letter h1 { margin: 2.4in 0 0.2in; font-size: 18pt }
.letter .code { font: 800 30pt/1.2 ui-monospace, "SF Mono", Menlo, Consolas, monospace; letter-spacing: 0.12em; text-align: center; border: 2px dashed #94a3b8; border-radius: 12px; padding: 0.15in; margin: 0.2in 0 }
.letter .sign { margin-top: 0.3in; font-weight: 700 }
.letter .ref { position: absolute; bottom: 0.5in; left: 0.9in; font-size: 8pt; color: #94a3b8 }
.poster { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0.7in 0.8in 0.6in }
.poster .brand { font-size: 26pt }
.poster h1 { font-size: 40pt; line-height: 1.05; letter-spacing: -0.02em; margin: 0.35in 0 0.15in; max-width: 6.6in }
.poster .gym { font-size: 22pt; font-weight: 700; color: #334155; margin: 0 0 0.3in }
.poster .qr { width: 4.2in; height: 4.2in }
.poster .scan { font-size: 14pt; font-weight: 600; margin: 0.1in 0 0.25in }
.poster .steps { display: flex; gap: 0.25in; padding: 0; margin: 0 0 0.25in; list-style: none; counter-reset: s; font-size: 12pt }
.poster .steps li { counter-increment: s; flex: 1; max-width: 2.1in }
.poster .steps li::before { content: counter(s); display: block; width: 0.38in; height: 0.38in; line-height: 0.38in; margin: 0 auto 6px; border-radius: 50%; background: #2563eb; color: #fff; font-weight: 800 }
.poster .sub { font-size: 11pt; color: #475569; max-width: 6in; margin: 0 }
.poster footer { margin-top: auto; font-size: 13pt; color: #334155 }
.stand { page: stand; width: ${paper === "A4" ? "297mm" : "11in"}; height: ${paper === "A4" ? "210mm" : "8.5in"}; display: flex; justify-content: center; align-items: center; gap: 0.5in }
.insert { width: 4in; height: 6in; outline: 1px dashed #cbd5e1; outline-offset: 0; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0.35in 0.3in 0.3in }
.insert .brand { font-size: 15pt }
.insert h2 { font-size: 17pt; line-height: 1.1; margin: 0.18in 0 0.08in }
.insert .gym { font-size: 12pt; font-weight: 700; color: #334155; margin: 0 0 0.14in }
.insert .qr { width: 2.5in; height: 2.5in }
.insert .scan { font-size: 10pt; font-weight: 600; margin: 0.06in 0 0 }
.insert .site { margin-top: auto; font-size: 10pt; color: #334155 }
@media print { html { background: #fff } .help { display: none } .page { margin: 0 } }
`;

/** What the sheet prints from: an order joined with its gym, or just a gym (the public poster page). */
type Sheet = Pick<PosterRow, "id" | "placeName" | "citySlug" | "slug" | "official" | "country" | "lang" | "items" | "shipTo" | "address">;

/**
 * The public poster page (/gyms/<city>/<gym>/poster/): the poster and stand inserts for any gym to print itself, free,
 * in the reader's language. No letter and no claim code, because anyone can open it.
 */
export function publicPosterHtml(p: Pick<Sheet, "id" | "placeName" | "citySlug" | "slug" | "official" | "country">, lang: MsgLang): string {
  const row: Sheet = { ...p, lang, items: "both", shipTo: "", address: "" };
  const paper = paperFor(p.country);
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(say(lang, "gp.print.headline"))}: ${esc(p.placeName)}</title><meta name="robots" content="noindex"><link rel="canonical" href="${esc(`${SITE_URL}${gymPath(p)}`)}"><style>${STYLE(paper)}</style></head><body>
<div class="help"><h1>${esc(p.placeName)}</h1>${esc(say(lang, "gp.print.help"))} <a href="${esc(gymPath(p))}">${esc(say(lang, "gp.print.back"))}</a></div>
${poster(row, lang)}
<section class="page stand">${insert(row, lang)}${insert(row, lang)}</section>
</body></html>`;
}

/** The whole sheet: the letter (when there's an order to mail), then the poster and stand pages it asked for. */
export function printHtml(row: Sheet, code: string | null, opts: { only?: "poster" | "stand" | "letter" } = {}): string {
  const lang = row.lang;
  const paper = paperFor(row.country);
  const want = (k: "poster" | "stand" | "letter") =>
    opts.only ? opts.only === k : k === "letter" || row.items === "both" || row.items === k;
  const pages = [
    want("letter") ? letter(row, code, lang) : "",
    want("poster") ? poster(row, lang) : "",
    want("stand") ? `<section class="page stand">${insert(row, lang)}${insert(row, lang)}</section>` : "",
  ].join("\n");
  const items = row.items === "both" ? "poster and stand" : row.items;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(row.placeName)}: ${items}</title><meta name="robots" content="noindex"><style>${STYLE(paper)}</style></head><body>
<div class="help"><h1>${esc(row.placeName)}: ${items}</h1>
Print with your browser (Ctrl+P or ⌘P) on ${paper === "A4" ? "A4" : "Letter"} paper at 100% scale, with margins off and background graphics on.
The letter goes in the envelope with the address in the window${code ? "; it has the gym's one-time claim code, so never put it on display" : ""}.
Stand inserts are 4 × 6 in: cut along the dashed lines. The QR code opens ${esc(qrTarget(row))}.</div>
${pages}
</body></html>`;
}
