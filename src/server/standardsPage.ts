// The strength standards pages drawn from real lifters (/strength-standards/ and /strength-standards/<lift>/; standards.ts,
// docs/decisions/public-pages-and-seo.md "Strength standards from lifters"). Plain HTML with no scripts in the site's
// frame, like the gym pages, in the reader's language. A lift with fewer than MIN_LIFT lifters of either sex is noindex
// and left out of the sitemap; one with no group big enough to show is a 404.
import type { MsgLang } from "@/lib/messageText";
import { SITE_URL } from "@/lib/site";
import { STANDARDS_TEXT } from "@/locales/site/standards";
import * as ex from "@/locales/text/ex";

import { crumbs, GYM_STYLE, metaTags } from "./gymPage";
import { esc, framePage } from "./siteFrame";
import { ALL, BANDS, bandsOf, MIN_CELL, MIN_LIFT, STANDARD_LIFTS, type Sex, type StandardLift, type StandardRow } from "./standards";

export const standardsPath = (lift?: StandardLift) => (lift ? `/strength-standards/${lift}/` : "/strength-standards/");

const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));

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
export const liftName = (lang: MsgLang, id: string) => {
  const m = EX[lang][`ex.${id}`] ?? (ex.en as Record<string, unknown>)[`ex.${id}`];
  return typeof m === "string" ? m : id;
};
/** Inside a sentence a lift starts in lower case, except in German and Japanese. */
const inSentence = (lang: MsgLang, s: string) =>
  lang === "de" || lang === "ja" ? s : /^\p{Lu}\p{Ll}/u.test(s) ? s.charAt(0).toLocaleLowerCase(lang) + s.slice(1) : s;

function bandLabel(lang: MsgLang, sex: Sex, band: number): string {
  const t = STANDARDS_TEXT[lang];
  if (band === ALL) return t.everyone;
  if (band < BANDS[sex].lo) return fill(t.under, { kg: BANDS[sex].lo });
  if (band >= BANDS[sex].hi) return fill(t.over, { kg: BANDS[sex].hi });
  return fill(t.range, { kg: band, to: band + 9 });
}

const kg = (lang: MsgLang, v: number) => {
  const n = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 });
  return `${n.format(v)} kg <span class="lb">${n.format(Math.round((v * 2.20462) / 5) * 5)} lb</span>`;
};

function table(lang: MsgLang, sex: Sex, rows: StandardRow[]): string {
  const t = STANDARDS_TEXT[lang];
  const mine = rows.filter((r) => r.sex === sex);
  const all = mine.find((r) => r.band === ALL);
  if (!all) return "";
  const order = [...bandsOf(sex).flatMap((b) => mine.filter((r) => r.band === b)), all];
  const n = new Intl.NumberFormat(lang);
  const id = `${sex}-h`;
  const body = order
    .map(
      (r) =>
        `<tr${r.band === ALL ? ' class="all"' : ""}><th scope="row">${esc(bandLabel(lang, sex, r.band))}</th><td>${n.format(r.n)}</td><td>${kg(lang, r.p25)}</td><td>${kg(lang, r.p50)}</td><td>${kg(lang, r.p75)}</td><td>${kg(lang, r.p90)}</td></tr>`,
    )
    .join("");
  return `<section class="card" aria-labelledby="${id}"><h2 id="${id}">${esc(sex === "male" ? t.men : t.women)}</h2><div class="scroll"><table><thead><tr><th scope="col">${esc(t.bodyweight)}</th><th scope="col">${esc(t.lifters)}</th><th scope="col">${esc(t.p25)}</th><th scope="col">${esc(t.p50)}</th><th scope="col">${esc(t.p75)}</th><th scope="col">${esc(t.p90)}</th></tr></thead><tbody>${body}</tbody></table></div></section>`;
}

/** Lifters behind a lift, both sexes. */
const totalOf = (rows: StandardRow[]) => rows.filter((r) => r.band === ALL).reduce((s, r) => s + r.n, 0);
export const indexable = (rows: StandardRow[]) => rows.some((r) => r.band === ALL && r.n >= MIN_LIFT);

export function liftHtml(lang: MsgLang, lift: StandardLift, rows: StandardRow[], others: StandardLift[]): string {
  const t = STANDARDS_TEXT[lang];
  const name = liftName(lang, lift);
  const n = new Intl.NumberFormat(lang).format(totalOf(rows));
  const vars = { lift: name, n, app: "Liftsmith", min: MIN_CELL };
  const title = `${fill(t.title, vars)} | Liftsmith`;
  const desc = fill(t.description, { ...vars, lift: inSentence(lang, name) });
  const path = standardsPath(lift);
  const updatedAt = Math.max(...rows.map((r) => r.updatedAt));
  const date = new Intl.DateTimeFormat(lang, { dateStyle: "long", timeZone: "UTC" }).format(updatedAt);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: fill(t.h1, vars),
    description: desc,
    url: `${SITE_URL}${path}`,
    inLanguage: lang,
    isAccessibleForFree: true,
    creator: { "@type": "Organization", name: "Liftsmith", url: SITE_URL },
    dateModified: new Date(updatedAt).toISOString().slice(0, 10),
    temporalCoverage: `${new Date(updatedAt - 365 * 86_400_000).toISOString().slice(0, 10)}/${new Date(updatedAt).toISOString().slice(0, 10)}`,
    measurementTechnique: "Epley formula",
    variableMeasured: ["Estimated one-rep max (kg)", "Body weight (kg)", "Sex"],
  };
  const otherLinks = others.length
    ? `<section class="card" aria-labelledby="others-h"><h2 id="others-h">${esc(t.others)}</h2><ul class="links">${others
        .map((o) => `<li><a href="${esc(standardsPath(o))}">${esc(fill(t.h1, { lift: liftName(lang, o) }))}</a></li>`)
        .join("")}</ul></section>`
    : "";
  const body = `<main id="main" class="wrap page narrow">${crumbs(lang, [
    [t.crumbs, standardsPath()],
    [name, null],
  ])}
<header class="head"><h1>${esc(fill(t.h1, vars))}</h1><p class="muted">${esc(fill(t.intro, vars))}</p><p class="muted small">${esc(fill(t.updated, { date }))}</p></header>
<div class="col">${table(lang, "male", rows)}${table(lang, "female", rows)}
<section class="card" aria-labelledby="read-h"><h2 id="read-h">${esc(t.readTitle)}</h2><p>${esc(t.read)}</p></section>
<section class="card" aria-labelledby="yours-h"><h2 id="yours-h">${esc(t.yoursTitle)}</h2><p>${esc(t.yoursBody)}</p><ul class="links"><li><a href="/tools/strength-standards/">${esc(t.yoursLink)} ›</a></li><li><a href="/tools/one-rep-max-calculator/">${esc(t.oneRmLink)} ›</a></li></ul></section>
<section class="card" aria-labelledby="method-h"><h2 id="method-h">${esc(t.methodTitle)}</h2><p>${esc(fill(t.method, vars))}</p><p class="muted">${esc(fill(t.countBody, vars))}</p></section>
${otherLinks}</div></main>`;
  return framePage(lang, title, metaTags(title, desc, path, ld, indexable(rows)), body, GYM_STYLE + STYLE, "standards");
}

export function standardsIndexHtml(lang: MsgLang, lifts: { lift: StandardLift; n: number }[]): string {
  const t = STANDARDS_TEXT[lang];
  const title = `${t.index.title} | Liftsmith`;
  const desc = fill(t.index.description, { app: "Liftsmith" });
  const num = new Intl.NumberFormat(lang);
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: t.index.title, url: `${SITE_URL}${standardsPath()}` };
  const list = lifts.length
    ? `<section class="card"><ul class="list">${lifts
        .map(
          (l) =>
            `<li><a href="${esc(standardsPath(l.lift))}"><span class="li-name">${esc(liftName(lang, l.lift))}</span><span class="muted small">${esc(fill(t.index.count, { n: num.format(l.n) }))}</span></a></li>`,
        )
        .join("")}</ul></section>`
    : `<section class="card"><h2>${esc(t.index.empty)}</h2><p>${esc(fill(t.index.emptyBody, { n: MIN_LIFT }))}</p><ul class="links"><li><a href="/tools/strength-standards/">${esc(t.yoursLink)} ›</a></li></ul></section>`;
  const body = `<main id="main" class="wrap page narrow">
<header class="head"><h1>${esc(t.index.h1)}</h1><p class="muted">${esc(t.index.intro)}</p></header>${list}
<p class="muted small">${esc(fill(t.countBody, { app: "Liftsmith", min: MIN_CELL }))}</p></main>`;
  return framePage(lang, title, metaTags(title, desc, standardsPath(), ld, lifts.length > 0), body, GYM_STYLE + STYLE, "standards");
}

export function standardsGoneHtml(lang: MsgLang): string {
  const t = STANDARDS_TEXT[lang];
  const body = `<main id="main" class="wrap gone"><h1>${esc(t.gone)}</h1><p class="muted">${esc(t.goneBody)}</p>
<a class="btn btn-primary" href="${standardsPath()}">${esc(t.index.title)}</a></main>`;
  return framePage(lang, `${t.gone} | Liftsmith`, '<meta name="robots" content="noindex">', body, GYM_STYLE + STYLE, "standards");
}

export const isLiftSlug = (x: string | null): x is StandardLift => !!x && (STANDARD_LIFTS as readonly string[]).includes(x);

const STYLE = `
.scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:.9375rem}
th,td{padding:10px 8px;text-align:right;border-top:1px solid var(--line);white-space:nowrap}thead th{border-top:0;color:var(--muted);font-weight:600;font-size:.8125rem}
th[scope=row],thead th:first-child{text-align:left}tr.all th,tr.all td{font-weight:700}.lb{display:block;color:var(--muted);font-size:.75rem}
.col{display:grid;gap:16px}`;
