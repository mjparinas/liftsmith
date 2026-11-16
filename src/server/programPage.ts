// The website's pages for coaches' programs (Melvin, 2026-11-16: "build public seo pages for both", programs and their
// ratings; docs/decisions/coach-programs.md "Public pages"):
//   /coach-programs/                  every listed program, by goal, with its price and rating
//   /coach-programs/<slug>-<id>/      one program: who made it, level, weeks, days, what it costs, its rating and reviews
// Plain HTML with no scripts in the site's frame, like the trainer directory, in the reader's language. Only listed
// programs of adult coaches; an unlisted or removed one is a noindex 404. The website is where a paid program is bought,
// so its price and a Buy link (into the web app) show here; the phone apps never show them (coachPrograms.ts).
// A free program's page lists each day's exercises and sets; a paid one's lists only its days' sizes, because that's
// what's being sold. Ratings show once a program has PROGRAM_REVIEW_LIMITS.shown, with schema.org Course,
// AggregateRating and Review (the same reviews the page shows). Never a Product: Google reads that as a merchant
// listing wanting shipping, returns and a GTIN (appSchema.test.ts).
import type { MsgLang } from "@/lib/messageText";
import { SITE_URL } from "@/lib/site";
import * as cpg from "@/locales/text/cpg";
import * as rt from "@/locales/text/rt";

import { browsePrograms, coachIsTeen, codeItems, GOALS, programFor, type CoachProgram, type Goal } from "./coachPrograms";
import type { Rating, Review } from "./coachReviews";
import { crumbs, exName, GYM_STYLE, metaTags, say, type GpKey } from "./gymPage";
import { PROGRAM_REVIEW_LIMITS, programRating, programReviewsOf } from "./programReviews";
import { esc, framePage, icon } from "./siteFrame";

type CpgKey = keyof typeof cpg.en;
type RtKey = keyof typeof rt.en;
type Catalogue = Partial<Record<string, unknown>>;
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

/** A line from one of the app's catalogues, plurals included, so the page and the app say the same words. */
function line(lang: MsgLang, cat: Record<MsgLang, Catalogue>, key: string, vars: Record<string, string | number>): string {
  let m = cat[lang][key] ?? cat.en[key];
  if (m && typeof m === "object") {
    const forms = m as Record<string, string>;
    m = forms[new Intl.PluralRules(lang).select(Number(vars.count ?? 0))] ?? forms.other ?? "";
  }
  return String(m ?? "").replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));
}
/** A line from the program catalogue (cpg.*). */
export const sayP = (lang: MsgLang, key: CpgKey, vars: Record<string, string | number> = {}) => line(lang, CPG, key, vars);
const sayR = (lang: MsgLang, key: RtKey, vars: Record<string, string | number> = {}) => line(lang, RT, key, vars);

export interface PublicProgram {
  program: CoachProgram;
  rating: Rating;
  reviews: Review[];
}

/** "eight-weeks-to-a-bigger-bench": the title in plain Latin letters and digits, for the address. */
export function programSlug(title: string): string {
  const s = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return s || "program";
}

export const programsPath = (p?: Pick<CoachProgram, "id" | "title">) =>
  p ? `/coach-programs/${programSlug(p.title)}-${p.id}/` : "/coach-programs/";

/** The program id at the end of a page address ("eight-weeks-to-a-bigger-bench-AbC123xYz456" or just the id). */
export function programIdOf(slug: string): string | null {
  const m = /(?:^|-)([A-Za-z0-9]{12})$/.exec(slug);
  return m ? m[1]! : null;
}

/** A price in the reader's language: "$29.99", "29,99 $". */
export function priceText(lang: MsgLang, amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(lang, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency.toUpperCase()}`;
  }
}

const priceOf = (lang: MsgLang, p: CoachProgram) => (p.price === 0 ? sayP(lang, "cpg.free") : priceText(lang, p.price, p.currency));
const byLine = (lang: MsgLang, p: CoachProgram) =>
  sayP(lang, "cpg.by", {
    name: p.coachName || sayP(lang, "cpg.aCoach"),
    role: say(lang, `gp.role.${p.role ?? "coach"}` as GpKey),
  });
const facts = (lang: MsgLang, p: CoachProgram) =>
  [
    sayP(lang, `cpg.level.${p.level}`),
    sayP(lang, "cpg.weeks", { count: p.weeks }),
    sayP(lang, "cpg.days", { count: p.days.length }),
    sayP(lang, `cpg.goal.${p.goal}`),
  ].join(" · ");
const starText = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

function starsHtml(lang: MsgLang, r: Rating): string {
  if (r.average === null) return "";
  const num = new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `<p class="rating"><span class="ember" aria-hidden="true">${starText(r.average)}</span> <span class="sr">${esc(say(lang, "gp.revStars", { rating: num.format(r.average) }))}</span><strong aria-hidden="true">${esc(num.format(r.average))}</strong> <span class="muted small">${esc(say(lang, "gp.revCount", { count: r.count }))}</span></p>`;
}

function reviewsHtml(lang: MsgLang, p: CoachProgram, reviews: Review[]): string {
  return reviews
    .map(
      (v) =>
        `<blockquote class="review"><p><span class="ember" aria-hidden="true">${starText(v.stars)}</span> <span class="sr">${esc(say(lang, "gp.revStars", { rating: v.stars }))}</span><span class="muted small">${esc(v.name || say(lang, "gp.cpgAnon"))}</span></p>${v.text ? `<p>${esc(v.text)}</p>` : ""}${v.reply ? `<p class="muted small">${esc(say(lang, "gp.revReply", { name: p.coachName || sayP(lang, "cpg.aCoach") }))}: ${esc(v.reply)}</p>` : ""}</blockquote>`,
    )
    .join("");
}

/** schema.org for one program: a Course its coach provides, with the rating and reviews the page shows. */
export function programLd(p: CoachProgram, r: Rating, reviews: Review[]): Record<string, unknown> {
  const url = `${SITE_URL}${programsPath(p)}`;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: p.title,
    description: p.about || facts("en", p),
    url,
    about: sayP("en", `cpg.goal.${p.goal}`),
    provider: { "@type": "Person", name: p.coachName || sayP("en", "cpg.aCoach") },
    offers: {
      "@type": "Offer",
      category: p.price > 0 ? "Paid" : "Free",
      price: p.price.toFixed(2),
      priceCurrency: p.currency.toUpperCase(),
      availability: "https://schema.org/InStock",
      url,
    },
    ...(r.average !== null
      ? {
          aggregateRating: { "@type": "AggregateRating", ratingValue: r.average, bestRating: 5, worstRating: 1, reviewCount: r.count },
          review: reviews.slice(0, 5).map((v) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: v.stars, bestRating: 5, worstRating: 1 },
            author: { "@type": "Person", name: v.name || say("en", "gp.cpgAnon") },
            datePublished: new Date(v.at).toISOString().slice(0, 10),
            ...(v.text ? { reviewBody: v.text } : {}),
          })),
        }
      : {}),
  };
}

function daysHtml(lang: MsgLang, p: CoachProgram): string {
  const n = new Intl.NumberFormat(lang);
  const rows = p.days
    .map((d, i) => {
      const size = sayR(lang, "rt.summary", {
        exercises: sayR(lang, "rt.exercises", { count: d.exercises }),
        sets: sayR(lang, "rt.sets", { count: d.sets }),
      });
      const items = d.code
        ? `<ul class="starter">${codeItems(d.code)
            .map((x) => `<li>${esc(`${x.sets} × ${exName(lang, x.id)}`)}</li>`)
            .join("")}</ul>`
        : "";
      return `<li><p class="li-name">${n.format(i + 1)}. ${esc(d.name)}</p><p class="muted small">${esc(size)}</p>${items}</li>`;
    })
    .join("");
  const locked = p.price > 0 ? `<p class="muted small">${esc(say(lang, "gp.cpgLocked"))}</p>` : "";
  return `<section class="card" aria-labelledby="days-h"><h2 id="days-h">${icon("layers", 16)}${esc(sayP(lang, "cpg.days.label"))}</h2><ul class="trainers">${rows}</ul>${locked}</section>`;
}

/** One program's page. */
export function programHtml(lang: MsgLang, x: PublicProgram, more: CoachProgram[]): string {
  const { program: p, rating, reviews } = x;
  const by = byLine(lang, p);
  const title = `${p.title} | ${by} | Liftsmith`;
  const desc = [p.title, facts(lang, p), priceOf(lang, p), p.about].filter(Boolean).join(" · ").slice(0, 300);
  const app = `/app/#/program/${encodeURIComponent(p.id)}`;
  const cta =
    p.price === 0
      ? `<a class="btn btn-primary wide" href="${esc(app)}" rel="nofollow">${esc(say(lang, "gp.cpgGetFree"))}</a>`
      : `<a class="btn btn-primary wide" href="${esc(app)}" rel="nofollow">${esc(sayP(lang, "cpg.buy", { price: priceOf(lang, p) }))}</a><p class="muted small add-note">${esc(sayP(lang, "cpg.buyWhy"))}</p>`;
  const ratingSection = `<section class="card" aria-labelledby="rating-h"><h2 id="rating-h">${icon("star", 16)}${esc(say(lang, "gp.cpgRatings"))}</h2>${
    rating.average !== null
      ? starsHtml(lang, rating) + reviewsHtml(lang, p, reviews.slice(0, 10))
      : `<p class="muted">${esc(say(lang, "gp.cpgNoRating", { count: PROGRAM_REVIEW_LIMITS.shown }))}</p>`
  }<p class="muted small">${esc(say(lang, "gp.cpgWhoRates", { days: PROGRAM_REVIEW_LIMITS.days }))}</p></section>`;
  const others = more.filter((o) => o.id !== p.id).slice(0, 5);
  const moreSection = others.length
    ? `<section class="card" aria-labelledby="more-h"><h2 id="more-h">${icon("layers", 16)}${esc(say(lang, "gp.cpgMore", { name: p.coachName || sayP(lang, "cpg.aCoach") }))}</h2><ul class="list">${others
        .map(
          (o) =>
            `<li><a href="${esc(programsPath(o))}"><span class="li-name">${esc(o.title)}</span><span class="muted small">${esc(facts(lang, o))} · ${esc(priceOf(lang, o))}</span></a></li>`,
        )
        .join("")}</ul></section>`
    : "";
  const body = `<main id="main" class="wrap page narrow">${crumbs(lang, [
    [say(lang, "gp.cpgKicker"), programsPath()],
    [p.title, null],
  ])}
<header class="head"><p class="kicker">${esc(by)}</p><h1>${esc(p.title)}</h1><p class="muted">${esc(facts(lang, p))}</p>${starsHtml(lang, rating)}</header>
<section class="card" aria-labelledby="about-h"><h2 id="about-h">${icon("info", 16)}${esc(say(lang, "gp.cpgAbout"))}</h2>${p.about ? `<p>${esc(p.about)}</p>` : ""}<p class="display">${esc(priceOf(lang, p))}</p>${cta}<p class="muted small add-note">${esc(say(lang, "gp.cpgHow"))}</p></section>
${daysHtml(lang, p)}
${ratingSection}
${moreSection}
<p><a class="quiet" href="${esc(programsPath())}">${esc(say(lang, "gp.cpgAll"))} ›</a></p></main>`;
  return framePage(
    lang,
    title,
    metaTags(title, desc, programsPath(p), programLd(p, rating, reviews)),
    body,
    `${GYM_STYLE}${STYLE}`,
    "programs",
  );
}

const STYLE = `
.display{font-size:1.75rem;font-weight:800;font-variant-numeric:tabular-nums;margin:12px 0 0}.ember{color:var(--ember)}`;

/** Every listed program, grouped by goal. */
export function programIndexHtml(lang: MsgLang, list: PublicProgram[]): string {
  const title = `${say(lang, "gp.cpgIndexTitle")} | Liftsmith`;
  const desc = say(lang, "gp.cpgIndexDescription");
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: say(lang, "gp.cpgIndexTitle"),
    url: `${SITE_URL}${programsPath()}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: list.map((x, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}${programsPath(x.program)}`,
        name: x.program.title,
      })),
    },
  };
  const byGoal = new Map<Goal, PublicProgram[]>();
  for (const x of list) byGoal.set(x.program.goal, [...(byGoal.get(x.program.goal) ?? []), x]);
  const sections = GOALS.filter((g) => byGoal.has(g))
    .map(
      (g) =>
        `<section class="card" aria-labelledby="goal-${g}"><h2 id="goal-${g}">${icon("layers", 16)}${esc(sayP(lang, `cpg.goal.${g}`))}</h2><ul class="list">${byGoal
          .get(g)!
          .map(
            ({ program: p, rating }) =>
              `<li><a href="${esc(programsPath(p))}"><span class="li-name">${esc(p.title)}</span><span class="muted small">${esc(byLine(lang, p))}</span><span class="muted small">${esc(facts(lang, p))} · ${esc(priceOf(lang, p))}</span>${
                rating.average !== null
                  ? `<span class="small"><span class="ember" aria-hidden="true">${starText(rating.average)}</span> <span class="sr">${esc(say(lang, "gp.revStars", { rating: rating.average }))}</span><span class="muted">${esc(say(lang, "gp.revCount", { count: rating.count }))}</span></span>`
                  : ""
              }</a></li>`,
          )
          .join("")}</ul></section>`,
    )
    .join("\n");
  const content = list.length
    ? sections
    : `<section class="card"><h2>${esc(say(lang, "gp.cpgEmpty"))}</h2><p>${esc(say(lang, "gp.cpgEmptyBody"))}</p></section>`;
  const body = `<main id="main" class="wrap page narrow">
<header class="head"><p class="kicker">${esc(say(lang, "gp.cpgKicker"))}</p><h1>${esc(say(lang, "gp.cpgIndexTitle"))}</h1><p class="muted">${esc(say(lang, "gp.cpgIndexBody"))}</p></header>
${content}
<p><a class="quiet" href="/trainers/">${esc(say(lang, "gp.dirIndexTitle"))} ›</a></p></main>`;
  return framePage(lang, title, metaTags(title, desc, programsPath(), ld, list.length > 0), body, `${GYM_STYLE}${STYLE}`, "programs");
}

/** The pages worth indexing, for the sitemap and IndexNow: the list, and each program dated by its last change. */
export const programEntries = (list: PublicProgram[]) =>
  list.length
    ? [
        { path: programsPath(), lastModified: Math.max(...list.map((x) => x.program.updatedAt)) },
        ...list.map((x) => ({ path: programsPath(x.program), lastModified: x.program.updatedAt })),
      ]
    : [];

/** Most listed programs the index shows. */
export const INDEX_MAX = 500;

/** Every listed program of an adult coach, with its rating: most reviewed first, then newest. */
export async function publicPrograms(now = Date.now()): Promise<PublicProgram[]> {
  const list = await browsePrograms(null, { limit: INDEX_MAX }, now);
  const rated = await Promise.all(list.map(async (program) => ({ program, rating: await programRating(program.id), reviews: [] })));
  return rated.sort((a, b) => b.rating.count - a.rating.count || b.program.updatedAt - a.program.updatedAt);
}

/** One listed program's page data, its coach's other listed programs, or null when it isn't public. */
export async function publicProgram(id: string, now = Date.now()): Promise<{ page: PublicProgram; more: CoachProgram[] } | null> {
  const program = await programFor(id, null);
  if (!program || !program.listed || (await coachIsTeen(program.coachId, now))) return null;
  const [rating, reviews, more] = await Promise.all([
    programRating(program.id),
    programReviewsOf(program.id, false, 10),
    browsePrograms(null, { coach: program.coachId, limit: 6 }, now),
  ]);
  return { page: { program, rating, reviews }, more };
}
