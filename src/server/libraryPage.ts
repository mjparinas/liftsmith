// The website's pages for the public routine library (Melvin, 2026-11-19; docs/decisions/routine-library.md):
//   /routines/                 every listed routine, by goal, best rated first
//   /routines/<slug>-<id>/     one routine: its exercises and sets, what it needs, its rating, and Save it in the app
// Plain HTML with no scripts in the site's frame, like coaches' programs, in the reader's language (text: rl.* in the
// app's catalogue, so the page and the app say the same words). A hidden or removed routine is a noindex 404 with the
// list. Structured data is an ExercisePlan with a breadcrumb; no AggregateRating, because Google shows review stars
// only for its own list of types and an ExercisePlan isn't on it.
import type { MsgLang } from "@/lib/messageText";
import { esc as escSheet, PRINT_CSS, PRINT_PAGE_CSS, printPageHtml, type PrintSheet } from "@/lib/printSheet";
import { SITE_URL } from "@/lib/site";
import type { Equipment } from "@/lib/types";
import { printLine, printWords } from "@/locales/site/print";
import * as cpg from "@/locales/text/cpg";
import * as rl from "@/locales/text/rl";
import * as rt from "@/locales/text/rt";

import { codeItems } from "./coachPrograms";
import { crumbs, equipName, exName, GYM_STYLE, metaTags } from "./gymPage";
import { browseLibrary, GOALS, libraryRoutine, type Goal, type LibraryRoutine } from "./routineLibrary";
import { esc, framePage, icon } from "./siteFrame";

type Catalogue = Partial<Record<string, unknown>>;
const RL: Record<MsgLang, Catalogue> = {
  en: rl.en,
  es: rl.es,
  fr: rl.fr,
  de: rl.de,
  it: rl.it,
  ja: rl.ja,
  pt: rl.pt,
  ko: rl.ko,
  pl: rl.pl,
  tr: rl.tr,
};
const RT: Record<MsgLang, Catalogue> = {
  en: rt.en,
  es: rt.es,
  fr: rt.fr,
  de: rt.de,
  it: rt.it,
  ja: rt.ja,
  pt: rt.pt,
  ko: rt.ko,
  pl: rt.pl,
  tr: rt.tr,
};
const CPG: Record<MsgLang, Catalogue> = {
  en: cpg.en,
  es: cpg.es,
  fr: cpg.fr,
  de: cpg.de,
  it: cpg.it,
  ja: cpg.ja,
  pt: cpg.pt,
  ko: cpg.ko,
  pl: cpg.pl,
  tr: cpg.tr,
};

function line(lang: MsgLang, cat: Record<MsgLang, Catalogue>, key: string, vars: Record<string, string | number>): string {
  let m = cat[lang][key] ?? cat.en[key];
  if (m && typeof m === "object") {
    const forms = m as Record<string, string>;
    m = forms[new Intl.PluralRules(lang).select(Number(vars.count ?? 0))] ?? forms.other ?? "";
  }
  return String(m ?? "").replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));
}
/** A line from the library catalogue (rl.*). */
export const sayL = (lang: MsgLang, key: keyof typeof rl.en, vars: Record<string, string | number> = {}) => line(lang, RL, key, vars);
const goalName = (lang: MsgLang, g: Goal) => line(lang, CPG, `cpg.goal.${g}`, {});
const levelName = (lang: MsgLang, l: LibraryRoutine["level"]) => line(lang, CPG, `cpg.level.${l}`, {});

/** "push-day-for-beginners": the title in plain Latin letters and digits, for the address. */
export function routineSlug(title: string): string {
  const s = title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return s || "routine";
}

export const libraryPath = (r?: Pick<LibraryRoutine, "id" | "title">) => (r ? `/routines/${routineSlug(r.title)}-${r.id}/` : "/routines/");
/** A listed routine's printable page (docs/decisions/printable-plans.md). */
export const libraryPrintPath = (r: Pick<LibraryRoutine, "id" | "title">) => `${libraryPath(r)}print/`;

/** The routine id at the end of a page address. */
export function libraryIdOf(slug: string): string | null {
  const m = /(?:^|-)([A-Za-z0-9]{12})$/.exec(slug);
  return m ? m[1]! : null;
}

const sets = (r: LibraryRoutine) => codeItems(r.code).reduce((k, x) => k + x.sets, 0);
const facts = (lang: MsgLang, r: LibraryRoutine) =>
  [
    goalName(lang, r.goal),
    levelName(lang, r.level),
    sayL(lang, "rl.minutes", { count: r.minutes }),
    line(lang, RT, "rt.summary", {
      exercises: line(lang, RT, "rt.exercises", { count: codeItems(r.code).length }),
      sets: line(lang, RT, "rt.sets", { count: sets(r) }),
    }),
  ].join(" · ");
const byLine = (lang: MsgLang, r: LibraryRoutine) => sayL(lang, "rl.by", { name: r.by || sayL(lang, "rl.aLifter") });
const starText = (x: number) => "★".repeat(Math.round(x)) + "☆".repeat(5 - Math.round(x));

function ratingHtml(lang: MsgLang, r: LibraryRoutine): string {
  if (r.rating.average === null) return "";
  const num = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `<span class="small"><span class="ember" aria-hidden="true">${starText(r.rating.average)}</span> <span class="sr">${esc(sayL(lang, "rl.stars", { rating: num.format(r.rating.average) }))}</span><strong aria-hidden="true">${esc(num.format(r.rating.average))}</strong> <span class="muted">${esc(sayL(lang, "rl.ratings", { count: r.rating.count }))}</span></span>`;
}

const savesHtml = (lang: MsgLang, r: LibraryRoutine) =>
  r.saves ? `<span class="muted small">${esc(sayL(lang, "rl.saves", { count: r.saves }))}</span>` : "";

/** schema.org for one routine: an ExercisePlan with its exercises. */
export function routineLd(r: LibraryRoutine): Record<string, unknown> {
  const url = `${SITE_URL}${libraryPath(r)}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ExercisePlan",
        name: r.title,
        description: r.about || facts("en", r),
        url,
        exerciseType: goalName("en", r.goal),
        activityDuration: `PT${r.minutes}M`,
        workload: codeItems(r.code).map((x) => `${x.sets} × ${exName("en", x.id)}`),
        ...(r.by ? { author: { "@type": "Person", name: r.by } } : {}),
        dateModified: new Date(r.updatedAt).toISOString().slice(0, 10),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: sayL("en", "rl.title"), item: `${SITE_URL}${libraryPath()}` },
          { "@type": "ListItem", position: 2, name: r.title, item: url },
        ],
      },
    ],
  };
}

const STYLE = `.ember{color:var(--ember)}.meta{display:flex;flex-wrap:wrap;gap:4px 12px;margin-top:8px}
.exes{list-style:none;margin:0;padding:0}.exes li{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-top:1px solid var(--line)}.exes li:first-child{border-top:0}
.exes .sets{color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}.wide{width:100%;margin-top:16px}`;

/** One routine's page. */
export function routineHtml(lang: MsgLang, r: LibraryRoutine, more: LibraryRoutine[]): string {
  const title = `${r.title} | ${sayL(lang, "rl.title")} | Liftsmith`;
  const desc = [r.title, facts(lang, r), r.about].filter(Boolean).join(" · ").slice(0, 300);
  const items = codeItems(r.code);
  const app = `/app/#/library/${encodeURIComponent(r.id)}`;
  const needs = r.equipment.length ? r.equipment.map((e) => equipName(lang, e as Equipment)).join(", ") : sayL(lang, "rl.bodyweight");
  const others = more.filter((o) => o.id !== r.id).slice(0, 5);
  const moreSection = others.length
    ? `<section class="card" aria-labelledby="more-h"><h2 id="more-h">${icon("layers", 16)}${esc(sayL(lang, "rl.page.more", { goal: goalName(lang, r.goal) }))}</h2><ul class="list">${others
        .map(
          (o) =>
            `<li><a href="${esc(libraryPath(o))}"><span class="li-name">${esc(o.title)}</span><span class="muted small">${esc(facts(lang, o))}</span>${ratingHtml(lang, o)}</a></li>`,
        )
        .join("")}</ul></section>`
    : "";
  const body = `<main id="main" class="wrap page narrow">${crumbs(lang, [
    [sayL(lang, "rl.title"), libraryPath()],
    [r.title, null],
  ])}
<header class="head"><p class="kicker">${esc(byLine(lang, r))}</p><h1>${esc(r.title)}</h1><p class="muted">${esc(facts(lang, r))}</p><p class="meta">${ratingHtml(lang, r)}${savesHtml(lang, r)}</p></header>
<section class="card" aria-labelledby="about-h"><h2 id="about-h">${icon("info", 16)}${esc(sayL(lang, "rl.page.about"))}</h2>${r.about ? `<p>${esc(r.about)}</p>` : ""}<p class="muted small">${esc(sayL(lang, "rl.needs", { list: needs }))}</p><a class="btn btn-primary wide" href="${esc(app)}" rel="nofollow">${esc(sayL(lang, "rl.page.save"))}</a><p class="muted small add-note">${esc(sayL(lang, "rl.page.how"))}</p></section>
<section class="card" aria-labelledby="ex-h"><h2 id="ex-h">${icon("layers", 16)}${esc(sayL(lang, "rl.page.exercises"))}</h2><ol class="exes">${items
    .map(
      (x) =>
        `<li><span>${esc(exName(lang, x.id))}</span><span class="sets">${esc(line(lang, RT, "rt.sets", { count: x.sets }))}</span></li>`,
    )
    .join("")}</ol></section>
${moreSection}
<p><a class="quiet" href="${esc(libraryPrintPath(r))}">${esc(printLine(lang, "prt.page.routineLink"))} ›</a></p>
<p><a class="quiet" href="${esc(libraryPath())}">${esc(sayL(lang, "rl.page.all"))} ›</a></p></main>`;
  return framePage(lang, title, metaTags(title, desc, libraryPath(r), routineLd(r)), body, `${GYM_STYLE}${STYLE}`, "library");
}

/** One routine's one-page sheet: its exercises and sets, four sessions to log and a QR code back to its page. */
export function routineSheet(lang: MsgLang, r: LibraryRoutine): PrintSheet {
  const items = codeItems(r.code);
  const url = `${SITE_URL}${libraryPath(r)}`;
  const needs = r.equipment.length ? r.equipment.map((e) => equipName(lang, e as Equipment)).join(", ") : sayL(lang, "rl.bodyweight");
  return {
    lang,
    title: r.title,
    ...(r.about ? { summary: r.about } : {}),
    facts: [
      { label: sayL(lang, "rl.goal"), value: goalName(lang, r.goal) },
      { label: sayL(lang, "rl.level"), value: levelName(lang, r.level) },
      { label: printLine(lang, "prt.fact.time"), value: printLine(lang, "prt.minutes", { n: r.minutes }) },
      { label: printLine(lang, "prt.fact.exercises"), value: String(items.length) },
      { label: printLine(lang, "prt.fact.sets"), value: String(sets(r)) },
      { label: printLine(lang, "prt.fact.equipment"), value: needs },
    ],
    days: [
      {
        name: "",
        rows: items.map((x) => ({ name: exName(lang, x.id), scheme: line(lang, RT, "rt.sets", { count: x.sets }) })),
      },
    ],
    qr: { url: `${url}?from=print`, shown: url.replace(/^https?:\/\//, "") },
    words: printWords(lang, "routine"),
  };
}

/** A listed routine's print page: the sheet on its own, kept out of search (the routine's own page is the one to find). */
export function routinePrintHtml(lang: MsgLang, r: LibraryRoutine): string {
  const sheet = routineSheet(lang, r);
  const title = `${printLine(lang, "prt.page.routineTitle", { name: r.title })} | Liftsmith`;
  const body = printPageHtml({
    sheet,
    back: { href: libraryPath(r), label: printLine(lang, "prt.page.back", { name: r.title }) },
    printLabel: printLine(lang, "prt.page.print"),
    hint: printLine(lang, "prt.page.hint"),
  });
  return `<!doctype html><html lang="${escSheet(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escSheet(title)}</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="${escSheet(`${SITE_URL}${libraryPath(r)}`)}"><link rel="icon" href="/icon.svg" type="image/svg+xml"><style>${PRINT_CSS}\n${PRINT_PAGE_CSS}</style></head><body><div class="pp-desk">${body}</div><script src="/print.js" defer></script></body></html>`;
}

/** Every listed routine, grouped by goal. */
export function libraryIndexHtml(lang: MsgLang, list: LibraryRoutine[]): string {
  const title = `${sayL(lang, "rl.page.indexTitle")} | Liftsmith`;
  const desc = sayL(lang, "rl.page.indexDescription");
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: sayL(lang, "rl.title"),
    url: `${SITE_URL}${libraryPath()}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: list.map((r, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${libraryPath(r)}`, name: r.title })),
    },
  };
  const byGoal = new Map<Goal, LibraryRoutine[]>();
  for (const r of list) byGoal.set(r.goal, [...(byGoal.get(r.goal) ?? []), r]);
  const sections = GOALS.filter((g) => byGoal.has(g))
    .map(
      (g) =>
        `<section class="card" aria-labelledby="goal-${g}"><h2 id="goal-${g}">${icon("layers", 16)}${esc(goalName(lang, g))}</h2><ul class="list">${byGoal
          .get(g)!
          .map(
            (r) =>
              `<li><a href="${esc(libraryPath(r))}"><span class="li-name">${esc(r.title)}</span><span class="muted small">${esc(byLine(lang, r))}</span><span class="muted small">${esc(facts(lang, r))}</span>${ratingHtml(lang, r)}</a></li>`,
          )
          .join("")}</ul></section>`,
    )
    .join("\n");
  const content = list.length
    ? sections
    : `<section class="card"><h2>${esc(sayL(lang, "rl.empty"))}</h2><p>${esc(sayL(lang, "rl.emptyBody"))}</p></section>`;
  const body = `<main id="main" class="wrap page narrow">
<header class="head"><p class="kicker">${esc(sayL(lang, "rl.kicker"))}</p><h1>${esc(sayL(lang, "rl.title"))}</h1><p class="muted">${esc(sayL(lang, "rl.page.indexBody"))}</p></header>
${content}
<p><a class="quiet" href="/coach-programs/">${esc(sayL(lang, "rl.page.coachPrograms"))} ›</a></p></main>`;
  return framePage(lang, title, metaTags(title, desc, libraryPath(), ld, list.length > 0), body, `${GYM_STYLE}${STYLE}`, "library");
}

/** Most routines the index page lists. */
export const INDEX_MAX = 500;

/** Every listed routine, best first, for the index page, the sitemap and IndexNow. */
export const publicRoutines = (now = Date.now()) => browseLibrary(null, { limit: INDEX_MAX }, now);

/** One listed routine and others with its goal, or null when it isn't public. */
export async function publicRoutine(id: string, now = Date.now()): Promise<{ routine: LibraryRoutine; more: LibraryRoutine[] } | null> {
  const routine = await libraryRoutine(id, null);
  if (!routine) return null;
  return { routine, more: await browseLibrary(null, { goal: routine.goal, limit: 6 }, now) };
}

/** The pages worth indexing: the list, and each routine dated by its last change. */
export const libraryEntries = (list: LibraryRoutine[]) =>
  list.length
    ? [
        { path: libraryPath(), lastModified: Math.max(...list.map((r) => r.updatedAt)) },
        ...list.map((r) => ({ path: libraryPath(r), lastModified: r.updatedAt })),
      ]
    : [];
