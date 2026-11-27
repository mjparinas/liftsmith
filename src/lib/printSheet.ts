// A printable one-page workout plan (docs/decisions/printable-plans.md): a program page on the website
// (/programs/<id>/print/), a routine in the public library (/routines/<slug>-<id>/print/) and a lifter's own routine
// printed from the app all go through this one sheet, so they look the same on paper. Pure: it takes the words and
// rows from its caller (the site's catalogues or the app's t()) and gives back HTML with its own styles, no scripts,
// the QR code drawn as inline SVG in black on white so it always scans. One page on Letter and on A4: the sheet is
// laid out for the smaller of the two (A4's width, Letter's height) and tightens its rows when there are many.
import { qrPath } from "@/components/QrCode";

import { BRAND } from "./brand";

export interface PrintWords {
  /** Above the title: "Printable workout plan". */
  kicker: string;
  exercise: string;
  /** "Sets × reps". */
  setsReps: string;
  rest: string;
  /** The app's own column: the weight and reps it plans next ("Next time"). */
  next: string;
  /** A column to write in: "Session {n}". */
  session: string;
  /** The first row under the session headers, for the date. */
  date: string;
  /** "Superset" beside an exercise done back to back with the next. */
  superset: string;
  howTitle: string;
  /** Big line beside the QR code. */
  scanTitle: string;
  scanBody: string;
  /** "Free on Android, iPhone and the web." */
  free: string;
  /** The QR code's alt text. */
  qrLabel: string;
  /** Under each split day: rows to write the exercises in. */
  writeIn: string;
  /** Ruled lines filling what's left of the page. */
  notes: string;
}

export interface PrintRow {
  name: string;
  /** "T1", "Main lift". */
  label?: string;
  scheme: string;
  rest?: string;
  /** The weight and reps the app plans next ("60 kg × 8"). */
  next?: string;
  /** Done back to back with the row after it. */
  superset?: boolean;
}

export interface PrintDay {
  /** Empty for a sheet with one workout, whose title already names it. */
  name: string;
  rows: PrintRow[];
  /** A split day: the muscles it trains, with blank rows to write the exercises in. */
  muscles?: string;
}

export interface PrintSheet {
  /** The page's language (`lang` on the sheet, so hyphens and fonts follow it). */
  lang: string;
  title: string;
  summary?: string;
  facts: { label: string; value: string }[];
  how?: string[];
  /** Under How it works: where the program comes from. */
  credit?: string;
  days: PrintDay[];
  /** The QR code's address, and how the address is printed under it (shorter, without https://). */
  qr: { url: string; shown: string };
  words: PrintWords;
}

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));

/** The Liftsmith mark (public/icon.svg) without its tile, in the brand gradient. */
export function brandMark(cls = "mark", id = "lg"): string {
  return `<svg class="${cls}" viewBox="200 190 610 610" aria-hidden="true"><defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="206" y1="196" x2="804" y2="794"><stop offset="0" stop-color="#3b7cf0"/><stop offset=".55" stop-color="#6271ef"/><stop offset="1" stop-color="#7e66e8"/></linearGradient></defs><g fill="url(#${id})"><rect x="226" y="302" width="572" height="36" rx="18"/><rect x="280" y="196" width="68" height="248" rx="20"/><rect x="676" y="196" width="68" height="248" rx="20"/><rect x="358" y="236" width="40" height="168" rx="14"/><rect x="626" y="236" width="40" height="168" rx="14"/><path d="M206 478C206 470 214 466 224 466C300 466 340 458 372 458L788 458Q804 458 804 474L804 534Q804 550 788 550C724 550 676 572 652 612L644 646L712 680Q726 688 726 704L726 778Q726 794 710 794L314 794Q298 794 298 778L298 704Q298 688 312 680L380 646L372 612C356 580 320 560 276 546C232 532 206 506 206 478Z"/></g></svg>`;
}

/** A QR code as inline SVG, black on white with its quiet zone. */
export function qrSvg(text: string, cls: string, label: string): string {
  const { size, d } = qrPath(text);
  const q = 4;
  const edge = size + q * 2;
  return `<svg class="${cls}" viewBox="${-q} ${-q} ${edge} ${edge}" shape-rendering="crispEdges" role="img" aria-label="${esc(label)}"><rect x="${-q}" y="${-q}" width="${edge}" height="${edge}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

/** Rows a split day leaves blank to write in: more when there are only a few days on the sheet. */
export const writeInRows = (days: number) => (days <= 3 ? 7 : days <= 4 ? 5 : 4);

/** How many columns to write in: four sessions when there's room, fewer on a crowded sheet. */
export function logColumns(sheet: Pick<PrintSheet, "days">): number {
  if (sheet.days.every((d) => d.muscles !== undefined)) return 0;
  const rows = sheet.days.reduce((k, d) => k + d.rows.length, 0);
  return rows > 22 ? 3 : 4;
}

/** How tight the sheet is drawn: "roomy" for a short workout, "tight" for a long program. */
export function density(sheet: Pick<PrintSheet, "days" | "how">): "roomy" | "normal" | "tight" {
  const split = sheet.days.some((d) => d.muscles !== undefined);
  const rows = split
    ? Math.ceil(sheet.days.length / 2) * (writeInRows(sheet.days.length) + 2)
    : sheet.days.reduce((k, d) => k + d.rows.length + 3, 0) + (sheet.how?.length ?? 0);
  return rows <= 14 ? "roomy" : rows <= 24 ? "normal" : "tight";
}

/** Millimetres the sheet may take: what Letter holds inside its 12 mm margins (A4 holds more), less a little. */
export const PAGE_MM = 252;

/** The print scale that keeps a sheet of this height (mm, unscaled) on one page: 1, or less (never under 0.75). */
export const zoomFor = (mm: number) => (mm <= PAGE_MM ? 1 : Math.max(0.75, Math.floor((PAGE_MM / mm) * 100) / 100));

/** Styles that lay a copy of the sheet out the way it prints, for measuring it (public/print.js, src/lib/print.ts). */
export const MEASURE_CSS =
  ".ps-measure{position:absolute;left:-10000px;top:0;width:186mm;visibility:hidden}.ps-measure .ps-sheet{width:186mm;min-height:0!important;padding:0;zoom:1!important}";

function dayTable(day: PrintDay, words: PrintWords, cols: number, withNext: boolean, withRest: boolean, days: number): string {
  if (day.muscles !== undefined) {
    const blank = Array.from({ length: writeInRows(days) }, () => `<tr><td></td><td></td></tr>`).join("");
    return `<section class="ps-day ps-split"><h3>${esc(day.name)}</h3><p class="ps-muscles">${esc(day.muscles)}</p><table><thead><tr><th scope="col">${esc(words.writeIn)}</th><th scope="col" class="ps-n">${esc(words.setsReps)}</th></tr></thead><tbody>${blank}</tbody></table></section>`;
  }
  const sessions = Array.from(
    { length: cols },
    (_, i) => `<th scope="col" class="ps-log">${esc(fill(words.session, { n: i + 1 }))}</th>`,
  ).join("");
  const blanks = (cls = "ps-log") => Array.from({ length: cols }, () => `<td class="${cls}"></td>`).join("");
  const span = 2 + (withRest ? 1 : 0) + (withNext ? 1 : 0);
  const rows = day.rows
    .map((r) => {
      const tag = [
        r.label ? `<span class="ps-tag">${esc(r.label)}</span>` : "",
        r.superset ? `<span class="ps-tag ps-ss">${esc(words.superset)}</span>` : "",
      ].join("");
      return `<tr${r.superset ? ` class="ps-linked"` : ""}><th scope="row">${tag}${esc(r.name)}</th><td class="ps-n">${esc(r.scheme)}</td>${withRest ? `<td class="ps-n ps-dim">${esc(r.rest ?? "")}</td>` : ""}${withNext ? `<td class="ps-n">${esc(r.next ?? "")}</td>` : ""}${blanks()}</tr>`;
    })
    .join("");
  const dateRow = cols ? `<tr class="ps-date"><td colspan="${span}" class="ps-dim">${esc(words.date)}</td>${blanks("ps-log")}</tr>` : "";
  return `<section class="ps-day">${day.name ? `<h3>${esc(day.name)}</h3>` : ""}<table><thead><tr><th scope="col">${esc(words.exercise)}</th><th scope="col" class="ps-n">${esc(words.setsReps)}</th>${withRest ? `<th scope="col" class="ps-n">${esc(words.rest)}</th>` : ""}${withNext ? `<th scope="col" class="ps-n">${esc(words.next)}</th>` : ""}${sessions}</tr></thead><tbody>${dateRow}${rows}</tbody></table></section>`;
}

/**
 * The sheet itself, one `<article class="ps-sheet">`, for any page or print to put inside its body. `zoom` below 1
 * prints it smaller so it stays on one page (measured where it's drawn: public/print.js, src/lib/print.ts).
 */
export function printSheetHtml(sheet: PrintSheet, zoom = 1): string {
  const w = sheet.words;
  const cols = logColumns(sheet);
  const rows = sheet.days.flatMap((d) => d.rows);
  const withNext = rows.some((r) => r.next);
  const withRest = rows.some((r) => r.rest);
  const split = sheet.days.some((d) => d.muscles !== undefined);
  const facts = sheet.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join("");
  const how = sheet.how?.length
    ? `<section class="ps-how"><h2>${esc(w.howTitle)}</h2><ul>${sheet.how.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>${sheet.credit ? `<p class="ps-dim">${esc(sheet.credit)}</p>` : ""}</section>`
    : "";
  return `<article class="ps-sheet ps-${density(sheet)}" lang="${esc(sheet.lang)}"${zoom < 1 ? ` style="--ps-zoom:${zoom}"` : ""}>
<header class="ps-head"><div class="ps-brand">${brandMark("ps-mark", "ps-lg")}<span>${esc(BRAND.name)}</span></div><p class="ps-kicker">${esc(w.kicker)}</p></header>
<h1>${esc(sheet.title)}</h1>${sheet.summary ? `<p class="ps-summary">${esc(sheet.summary)}</p>` : ""}
${facts ? `<dl class="ps-facts">${facts}</dl>` : ""}
${how}
<div class="ps-days${split ? " ps-grid" : ""}">${sheet.days.map((d) => dayTable(d, w, cols, withNext, withRest, sheet.days.length)).join("")}</div>
${density(sheet) !== "roomy" ? "" : `<section class="ps-notes"><h2>${esc(w.notes)}</h2><div class="ps-lines"></div></section>`}
<footer class="ps-foot">${qrSvg(sheet.qr.url, "ps-qr", w.qrLabel)}<div><p class="ps-scan">${esc(w.scanTitle)}</p><p>${esc(w.scanBody)}</p><p class="ps-url">${esc(sheet.qr.shown)}</p><p class="ps-dim">${esc(w.free)}</p></div></footer>
</article>`;
}

/**
 * The sheet's styles. On screen it sits on a grey desk as a sheet of paper; printed, only the sheet is left, in black
 * and grey ink with the brand blue on the mark and the headings.
 */
export const PRINT_CSS = `.ps-sheet{--ink:#0b1220;--dim:#5a6474;--line:#c9d0da;--soft:#eef2f8;--blue:#1d4fc4;box-sizing:border-box;width:186mm;min-height:250mm;margin:0 auto;padding:10mm 11mm;background:#fff;color:var(--ink);font:9.5pt/1.35 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans","Noto Sans JP","Noto Sans KR","Hiragino Sans","Apple SD Gothic Neo",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;display:flex;flex-direction:column}
.ps-sheet *{box-sizing:border-box}
.ps-head{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--ink);padding-bottom:3mm;margin:0}
.ps-brand{display:flex;align-items:center;gap:2mm;font-weight:800;font-size:12pt;letter-spacing:-.01em}.ps-mark{width:7mm;height:7mm}
.ps-kicker{margin:0;font-size:8pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--blue)}
.ps-sheet h1{margin:4mm 0 0;font-size:20pt;line-height:1.1;font-weight:800;letter-spacing:-.02em}
.ps-summary{margin:1.5mm 0 0;color:var(--dim);font-size:9.5pt}
.ps-facts{display:flex;flex-wrap:wrap;gap:1.5mm 6mm;margin:3mm 0 0;padding:2mm 3mm;background:var(--soft);border-radius:2mm}
.ps-facts div{display:flex;gap:1.5mm;align-items:baseline}.ps-facts dt{color:var(--dim);font-size:8pt}.ps-facts dd{margin:0;font-weight:700}
.ps-how{margin-top:3mm}.ps-how h2{margin:0;font-size:10pt;color:var(--blue)}.ps-how ul{margin:1mm 0 0;padding-left:4.5mm;list-style:disc;columns:2;column-gap:7mm}.ps-how li{break-inside:avoid;margin:0 0 .6mm;font-size:8.5pt}.ps-how p{margin:1mm 0 0;font-size:7.5pt}
.ps-days{margin-top:3.5mm;display:flex;flex-direction:column;gap:3.5mm}
.ps-grid{display:grid;grid-template-columns:1fr 1fr;gap:3.5mm 5mm;align-content:start}
.ps-day{break-inside:avoid}.ps-day h3{margin:0 0 1mm;font-size:11pt;font-weight:800}
.ps-muscles{margin:0 0 1mm;color:var(--dim);font-size:8.5pt}
.ps-day table{width:100%;border-collapse:collapse;table-layout:auto}
.ps-day th,.ps-day td{border:1px solid var(--line);padding:0 1.6mm;height:6.6mm;text-align:left;vertical-align:middle;font-weight:400}
.ps-day thead th{background:var(--soft);height:5.6mm;font-size:7.5pt;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}
.ps-day tbody th{font-weight:600}
.ps-n{white-space:nowrap;font-variant-numeric:tabular-nums}.ps-dim{color:var(--dim)}
.ps-log{width:17mm}.ps-date td{height:5mm;font-size:7.5pt}
.ps-split td{height:7mm}.ps-split td:last-child{width:28mm}
.ps-tag{display:inline-block;margin-right:1.5mm;padding:0 1.2mm;border:1px solid var(--line);border-radius:1mm;font-size:6.5pt;font-weight:700;color:var(--dim);vertical-align:1px}
.ps-ss{color:var(--blue);border-color:var(--blue)}
.ps-notes{flex:1 1 0;min-height:16mm;display:flex;flex-direction:column;margin-top:4mm}.ps-notes h2{margin:0;font-size:10pt;color:var(--blue)}.ps-lines{flex:1;background:repeating-linear-gradient(to bottom,transparent 0,transparent 7.5mm,var(--line) 7.5mm,var(--line) calc(7.5mm + 1px))}
.ps-foot{display:flex;margin-top:auto;gap:5mm;align-items:center;margin-top:4mm;padding-top:3.5mm;border-top:2px solid var(--ink);break-inside:avoid}
.ps-qr{width:27mm;height:27mm;flex:none}.ps-foot p{margin:0 0 .8mm}.ps-scan{font-size:12pt;font-weight:800}
.ps-url{font-weight:700;color:var(--blue);word-break:break-all;font-feature-settings:"calt" 0,"liga" 0}
.ps-roomy .ps-day th,.ps-roomy .ps-day td{height:8mm}.ps-roomy .ps-split td{height:8.5mm}
.ps-tight{font-size:8.5pt}.ps-tight h1{font-size:17pt}.ps-tight .ps-day th,.ps-tight .ps-day td{height:5.6mm}.ps-tight .ps-day thead th{height:4.8mm}.ps-tight .ps-days{gap:2.5mm}.ps-tight .ps-split td{height:5.8mm}.ps-tight .ps-qr{width:23mm;height:23mm}
${MEASURE_CSS}
@page{margin:12mm}
@media print{.ps-sheet{width:auto;min-height:248mm;margin:0;padding:0;box-shadow:none!important;zoom:var(--ps-zoom,1)}}`;

/** A whole printable document: what the apps hand to the phone's print service, and what the web app prints. */
export function printDocument(sheet: PrintSheet, zoom = 1): string {
  return `<!doctype html><html lang="${esc(sheet.lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(sheet.title)}</title><style>html,body{margin:0;background:#fff}${PRINT_CSS}</style></head><body>${printSheetHtml(sheet, zoom)}</body></html>`;
}

/** How tall a drawn sheet prints, in millimetres at full size: a copy laid out as on paper, measured and removed. */
export function measureSheet(doc: Document): number | null {
  const sheet = doc.querySelector(".ps-sheet");
  if (!sheet) return null;
  const box = doc.createElement("div");
  box.className = "ps-measure";
  box.appendChild(sheet.cloneNode(true));
  doc.body.appendChild(box);
  const mm = (box.getBoundingClientRect().height * 25.4) / 96;
  box.remove();
  return mm;
}

/** A short fingerprint of a sheet, so a saved PDF can tell when its page has changed (scripts/program-pdfs.mjs). */
export function sheetHash(html: string): string {
  // FNV-1a, 32 bits, twice with different seeds: no crypto in the browser bundle, and a collision only means a
  // stale PDF waits for the next run.
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < html.length; i++) {
    const c = html.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x01000193 ^ 0x9e3779b9) >>> 0;
  }
  return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
}

export interface PrintPage {
  sheet: PrintSheet;
  /** The page the sheet came from, and the words of the link back to it ("‹ Back to Classic 5×5"). */
  back: { href: string; label: string };
  /** "Print or save as PDF": a button the page's one script (public/print.js) wires to the print window. */
  printLabel: string;
  /** A ready PDF of the same sheet, where there is one. */
  pdf?: { href: string; label: string };
  hint: string;
}

/**
 * The website's print page around a sheet: a slim bar with the way back, the print button, the PDF and a hint, then
 * the sheet as paper, for the caller to put in its `<div class="pp-desk">` (a child of `<body>`). Printed, only the sheet is left. No inline script: the button is wired by
 * /print.js, and without it the hint says how to print.
 */
export function printPageHtml(p: PrintPage): string {
  const pdf = p.pdf ? `<a class="pp-btn" href="${esc(p.pdf.href)}" download>${esc(p.pdf.label)}</a>` : "";
  return `<nav class="pp-bar" aria-label="${esc(BRAND.name)}"><a class="pp-brand" href="/">${brandMark("pp-mark", "pp-lg")}<span>${esc(BRAND.name)}</span></a><a class="pp-back" href="${esc(p.back.href)}">‹ ${esc(p.back.label)}</a></nav>
<main id="main" class="pp-main"><div class="pp-tools"><button type="button" class="pp-btn pp-primary" data-print>${esc(p.printLabel)}</button>${pdf}<p class="pp-hint">${esc(p.hint)}</p></div>
<div class="pp-paper">${printSheetHtml(p.sheet)}</div></main>`;
}

/** The print page's own styles, beside PRINT_CSS. Its colours are fixed: it's a sheet of paper whatever the theme. */
export const PRINT_PAGE_CSS = `html,body{margin:0;background:#dfe4eb}.pp-desk{min-height:100vh;padding:0 16px 48px;background:#dfe4eb;color:#0b1220;font:16px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.pp-bar{max-width:186mm;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px;padding:14px 0}
.pp-brand{display:flex;align-items:center;gap:8px;font-weight:800;color:#0b1220;text-decoration:none;min-height:44px}.pp-mark{width:28px;height:28px}
.pp-back{color:#1d4fc4;font-weight:600;min-height:44px;display:flex;align-items:center}
.pp-main{display:block}.pp-tools{max-width:186mm;margin:0 auto 16px;display:flex;flex-wrap:wrap;align-items:center;gap:10px 12px}
.pp-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:12px;border:1px solid #9aa6b8;background:#fff;color:#0b1220;font:600 16px/1 inherit;font-family:inherit;text-decoration:none;cursor:pointer}
.pp-primary{border:0;background:linear-gradient(135deg,#3b7cf0,#7e66e8);color:#fff}.pp-btn:focus-visible,.pp-back:focus-visible,.pp-brand:focus-visible{outline:3px solid #1d4fc4;outline-offset:2px}
.pp-hint{flex-basis:100%;margin:0;color:#3d4757;font-size:14px}
.pp-paper{max-width:186mm;margin:0 auto}.pp-paper .ps-sheet{box-shadow:0 10px 30px -12px rgb(11 18 32/.35)}
@media (max-width:760px){.pp-paper .ps-sheet{width:100%;min-height:0;padding:16px}.ps-day{overflow-x:auto}.ps-how ul{columns:1}}
@media print{:root{color-scheme:light!important}html,body{background:#fff!important}body>*:not(.pp-desk){display:none!important}.pp-bar,.pp-tools{display:none!important}.pp-desk{padding:0;min-height:0;background:#fff}.pp-paper{max-width:none}.pp-paper .ps-sheet{box-shadow:none}}`;
