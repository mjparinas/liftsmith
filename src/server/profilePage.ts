// A public profile's web page (www.getliftsmith.com/u/<handle>/), drawn as plain HTML with no scripts (Melvin,
// 2026-11-12: "we really should have a desktop version that has the same or similar headers as the home page, with
// the header and footer and more emphasis at trying liftsmith for users not already logged in").
//
// The page wears the website's own header and footer: the same links, from the same lists and text as SiteChrome.tsx
// (`navFor`, `siteText().chrome`), redrawn here because the page can't load the site's React or its stylesheet under
// its strict CSP (SHARE_PAGE_CSP: no scripts, inline styles only). The phone menu is a <details>, so it needs no
// script either. On wide screens the profile sits in a column on the left (picture, counts, level and streak, best
// lifts, the 12-week training calendar) beside the workouts; on phones it stacks. Calls to try Liftsmith: a line
// under the header, a card in the profile column, the site's big banner at the end, and a bar along the bottom on
// phones. The page can't tell a signed-in reader without a script, so everyone sees them, beside "Follow in the app".
// Links to our own pages carry no UTM tags (each tag is a new address for crawlers); only store links do.
// Data: publicProfile.ts. Decision record: docs/decisions/friends.md ("Public profiles").
import { ICON_PATHS, type IconName } from "@/components/app/icons";
import { navFor } from "@/components/site/nav";
import { COMMIT } from "@/lib/build";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import type { MsgLang } from "@/lib/messageText";
import { APP_PATH, SITE_URL, STORE_LINKS } from "@/lib/site";
import { fill, localPath } from "@/lib/siteLang";
import { SOCIAL_LIMITS, type AvatarId, type PostBody, type ShowcaseLift } from "@/lib/socialTypes";
import { siteText } from "@/locales/site";
import * as pub from "@/locales/text/pub";

import type { PublicPost, PublicProfile } from "./publicProfile";

const DAY = 86_400_000;
/** Exercises shown per workout before "+N more". */
const EXERCISES_SHOWN = 8;

type PubKey = keyof typeof pub.en;
const CATALOG: Record<MsgLang, Partial<Record<PubKey, unknown>>> = {
  en: pub.en,
  es: pub.es,
  fr: pub.fr,
  de: pub.de,
  it: pub.it,
  ja: pub.ja,
};
export const say = (lang: MsgLang, key: PubKey, vars: Record<string, string | number> = {}) =>
  String(CATALOG[lang][key] ?? pub.en[key]).replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const LB = 2.20462;
function weight(kg: number, unit: "kg" | "lb", lang: MsgLang): string {
  const v = unit === "lb" ? Math.round(kg * LB) : Math.round(kg * 10) / 10;
  return `${new Intl.NumberFormat(lang).format(v)} ${unit}`;
}
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec) % 60).padStart(2, "0")}`;

/** One exercise's best set in a line: "100 kg × 5", "× 12" for bodyweight or hidden weights, or time and distance. */
export function bestSetText(e: PostBody["exercises"][number], unit: "kg" | "lb", lang: MsgLang): string {
  const ex = EXERCISE_BY_ID.get(e.id);
  if (ex?.cardio) {
    if (!e.d) return clock(e.r);
    const dist =
      unit === "lb"
        ? `${new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(e.d / 1609.344)} mi`
        : `${new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(e.d / 1000)} km`;
    return `${clock(e.r)} · ${dist}`;
  }
  return e.w ? `${weight(e.w, unit, lang)} × ${e.r}` : `× ${e.r}`;
}

// --- Pictures ---

function icon(name: IconName, size = 20, cls = ""): string {
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON_PATHS[name]}"/></svg>`;
}

/** The app's avatars (AvatarFace.tsx): one of our icons on a tinted disc, or the mascot kettlebell. */
const FACES: Record<AvatarId, { icon: IconName | "mascot"; hue: string }> = {
  "av-dumbbell": { icon: "dumbbell", hue: "var(--accent)" },
  "av-bolt": { icon: "bolt", hue: "var(--cyan)" },
  "av-leaf": { icon: "leaf", hue: "var(--mint)" },
  "av-moon": { icon: "moon", hue: "var(--violet)" },
  "av-target": { icon: "target", hue: "var(--ember)" },
  "av-heart": { icon: "heart", hue: "var(--bad)" },
  "av-stretch": { icon: "stretch", hue: "var(--mint)" },
  "av-mascot": { icon: "mascot", hue: "var(--violet)" },
  "av-trophy": { icon: "trophy", hue: "var(--gold)" },
  "av-flame": { icon: "flame", hue: "var(--ember)" },
  "av-pro": { icon: "sparkle", hue: "var(--violet)" },
};

const KETTLEBELL = `<svg width="62" height="62" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="kb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b9cff"/><stop offset=".55" stop-color="#7f8bff"/><stop offset="1" stop-color="#9b86ff"/></linearGradient></defs><path d="M25 56C18 30 24 10 50 10s32 20 25 46" fill="none" stroke="url(#kb)" stroke-width="11" stroke-linecap="round"/><path d="M50 36c20 0 33 12 33 29 0 9-3 17-9 24H26c-6-7-9-15-9-24 0-17 13-29 33-29z" fill="url(#kb)"/><circle cx="40" cy="62" r="3.5" fill="#06122a"/><circle cx="60" cy="62" r="3.5" fill="#06122a"/><path d="M43 72q7 6 14 0" fill="none" stroke="#06122a" stroke-width="3" stroke-linecap="round"/></svg>`;

function avatarHtml(name: string, avatar: string): string {
  const face = avatar in FACES ? FACES[avatar as AvatarId] : null;
  if (!face) return `<div class="avatar letter" aria-hidden="true">${esc([...(name.trim() || "@")][0]!.toLocaleUpperCase())}</div>`;
  const inner = face.icon === "mascot" ? KETTLEBELL : icon(face.icon, 44);
  return `<div class="avatar" style="--tint:${face.hue}" aria-hidden="true">${inner}</div>`;
}

// --- The training calendar (UTC: the page has no reader's time zone) ---

/** Midnight UTC on the Monday of the week `back` weeks before `now`'s. */
function mondayUtc(now: number, back = 0): number {
  const d = new Date(now);
  const midnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  return midnight - (sinceMonday + back * 7) * DAY;
}

/** The last `weeks` weeks, oldest first, Monday to Sunday, each day trained or not. Days after today are false. */
export function calendarUtc(
  trained: readonly number[],
  now: number,
  weeks = SOCIAL_LIMITS.calendarWeeks,
): { start: number; days: boolean[] }[] {
  const keys = new Set(trained.map((at) => Math.floor(at / DAY)));
  const today = Math.floor(now / DAY);
  const out: { start: number; days: boolean[] }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const start = mondayUtc(now, w);
    const days: boolean[] = [];
    for (let d = 0; d < 7; d++) {
      const key = Math.floor(start / DAY) + d;
      days.push(key <= today && keys.has(key));
    }
    out.push({ start, days });
  }
  return out;
}

/**
 * The weekdays someone usually trains (Sunday = 0), Monday first: days with a workout in at least a third of the
 * weeks they trained, and at least twice; none with fewer than four workouts (the app's usualDays, in UTC).
 */
export function usualDaysUtc(trained: readonly number[]): number[] {
  if (trained.length < 4) return [];
  const weeks = new Set(trained.map((at) => mondayUtc(at)));
  const count = new Array<number>(7).fill(0);
  const seen = new Set<number>();
  for (const at of trained) {
    const key = Math.floor(at / DAY);
    if (seen.has(key)) continue;
    seen.add(key);
    count[new Date(at).getUTCDay()]!++;
  }
  const need = Math.max(2, Math.ceil(weeks.size / 3));
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => count[d]! >= need);
}

/** A weekday's name: 2024-01-07 was a Sunday. */
const dayName = (d: number, lang: MsgLang, style: "long" | "narrow" = "long") =>
  new Intl.DateTimeFormat(lang, { weekday: style, timeZone: "UTC" }).format(Date.UTC(2024, 0, 7 + d));

function calendarHtml(p: PublicProfile, lang: MsgLang, now: number): string {
  const weeks = calendarUtc(p.trained, now);
  const count = weeks.reduce((n, w) => n + w.days.filter(Boolean).length, 0);
  const fmt = new Intl.DateTimeFormat(lang, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const usual = usualDaysUtc(p.trained);
  const line =
    usual.length && usual.length < 7
      ? say(lang, "pub.usual", { days: new Intl.ListFormat(lang, { type: "conjunction" }).format(usual.map((d) => dayName(d, lang))) })
      : count
        ? say(lang, "pub.usualNone")
        : say(lang, "pub.calendarEmpty");
  const labels = [1, 2, 3, 4, 5, 6, 0].map((d, i) => `<span>${i % 2 ? "" : esc(dayName(d, lang, "narrow"))}</span>`).join("");
  const cells = weeks
    .flatMap((w) => w.days.map((on, i) => `<li class="${on ? "on" : ""}" title="${esc(fmt.format(w.start + i * DAY + DAY / 2))}"></li>`))
    .join("");
  return `<section class="card" aria-labelledby="cal-h"><h2 id="cal-h">${icon("calendar", 16)}${esc(say(lang, "pub.calendar"))}</h2>
<div class="cal"><div class="cal-days" aria-hidden="true">${labels}</div><ol aria-label="${esc(say(lang, "pub.calendarLabel", { count }))}">${cells}</ol></div>
<p class="muted small">${esc(line)}</p></section>`;
}

// --- Pieces of the page ---

const exerciseLink = (id: string, name: string) =>
  EXERCISE_BY_ID.has(id) ? `<a href="/exercises/${esc(id)}/">${esc(name)}</a>` : `<span>${esc(name)}</span>`;

function liftsHtml(lifts: ShowcaseLift[], lang: MsgLang, unit: "kg" | "lb"): string {
  const known = lifts.filter((l) => EXERCISE_BY_ID.has(l.id));
  if (!known.length) return "";
  const day = new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeZone: "UTC" });
  const rows = known
    .map((l) => {
      const ex = EXERCISE_BY_ID.get(l.id)!;
      return `<li><div>${exerciseLink(l.id, ex.name)}<time datetime="${new Date(l.at).toISOString().slice(0, 10)}">${esc(day.format(l.at))}</time></div>
<strong>${esc(`${weight(l.w, unit, lang)} × ${l.r}`)}</strong></li>`;
    })
    .join("");
  return `<section class="card" aria-labelledby="lifts-h"><h2 id="lifts-h">${icon("trophy", 16)}${esc(say(lang, "pub.lifts"))}</h2><ul class="lifts">${rows}</ul></section>`;
}

function postHtml(p: PublicPost, lang: MsgLang, unit: "kg" | "lb"): string {
  const b = p.body;
  const day = new Intl.DateTimeFormat(lang, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    p.at,
  );
  const n = new Intl.NumberFormat(lang);
  const stats: [string, string][] = [
    [say(lang, "pub.time"), `${n.format(Math.max(1, Math.round(b.seconds / 60)))} min`],
    [say(lang, "pub.sets"), n.format(b.sets)],
    ...(b.volume ? ([[say(lang, "pub.volume"), weight(b.volume, unit, lang)]] as [string, string][]) : []),
    ...(b.prs ? ([[say(lang, "pub.prs"), n.format(b.prs)]] as [string, string][]) : []),
  ];
  const shown = b.exercises.slice(0, EXERCISES_SHOWN);
  const rest = b.exercises.length - shown.length;
  const best = esc(say(lang, "pub.newBest"));
  return `<li><article class="card post"><time datetime="${new Date(p.at).toISOString().slice(0, 10)}">${esc(day)}</time>
${p.caption ? `<p class="caption">${esc(p.caption)}</p>` : ""}<dl class="stats">${stats.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
<ul class="exs">${shown
    .map(
      (e) =>
        `<li><span class="ex-name">${exerciseLink(e.id, e.name)}${e.pr ? ` <span class="tag">${best}</span>` : ""}</span><span class="ex-best">${esc(bestSetText(e, unit, lang))}</span></li>`,
    )
    .join("")}</ul>
${rest > 0 ? `<p class="more">${esc(say(lang, "pub.more", { count: rest }))}</p>` : ""}</article></li>`;
}

function storeBadges(lang: MsgLang): string {
  const b = siteText(lang).chrome.badges;
  const referrer = "utm_source=profile&utm_medium=profile_page&utm_campaign=public_profile";
  const badge = (href: string | null, store: string, small: string, big: string, logo: string) => {
    const body = `${logo}<span class="b-text"><span class="b-small">${esc(small)}</span><span class="b-big">${esc(big)}</span></span>`;
    if (href) return `<a class="badge" href="${esc(href)}" rel="noopener">${body}</a>`;
    return `<span class="badge-wrap" role="img" aria-label="${esc(fill(b.comingSoon, { store }))}"><span class="badge dim" aria-hidden="true">${body}</span><span class="soon" aria-hidden="true">${esc(b.soon)}</span></span>`;
  };
  let play = STORE_LINKS.googlePlay;
  if (play) {
    try {
      const u = new URL(play);
      u.searchParams.set("referrer", referrer);
      play = u.toString();
    } catch {
      // a malformed link is shown as it is
    }
  }
  const apple = STORE_LINKS.appStore;
  return `<div class="badges">${badge(play, "Google Play", b.playSmall, "Google Play", PLAY_LOGO)}${badge(apple, "App Store", b.appleSmall, "App Store", APPLE_LOGO)}</div>`;
}

const PLAY_LOGO = `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="#4285F4" d="M3.6 1.8 13.5 12l-9.9 10.2c-.4-.2-.6-.6-.6-1.1V2.9c0-.5.2-.9.6-1.1z"/><path fill="#34A853" d="M3.6 1.8c.3-.2.8-.2 1.2.1l11.9 6.8-3.2 3.3z"/><path fill="#EA4335" d="m13.5 12 3.2 3.3-11.9 6.8c-.4.3-.9.3-1.2.1z"/><path fill="#FBBC04" d="m16.7 8.7 3.7 2.1c.9.5.9 1.9 0 2.4l-3.7 2.1-3.2-3.3z"/></svg>`;
const APPLE_LOGO = `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>`;

/** The website's header (SiteHeader in SiteChrome.tsx): logo, the one nav list, Sign in and Start free. */
function siteHeader(lang: MsgLang): string {
  const t = siteText(lang).chrome;
  const nav = navFor(lang);
  const links = nav.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("");
  return `<header class="site-h"><div class="wrap row">
<a class="logo" href="${esc(localPath(lang, "/"))}"><img src="/icon.svg" alt="" width="32" height="32">Liftsmith</a>
<nav aria-label="${esc(t.siteNav)}" class="row nav"><ul class="nav-wide">${links}</ul>
<a class="signin" href="${APP_PATH}#/account">${esc(t.signIn)}</a>
<a class="btn btn-primary btn-sm" href="${APP_PATH}">${esc(t.startFree)}</a>
<details class="menu"><summary aria-label="${esc(t.siteMenu)}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path class="m-open" d="M4 7h16M4 12h16M4 17h16"/><path class="m-close" d="M6 6l12 12M18 6L6 18"/></svg><span>${esc(t.menu)}</span></summary>
<ul class="menu-list">${links}<li class="narrow-only"><a href="${APP_PATH}#/account">${esc(t.signIn)}</a></li></ul></details></nav></div></header>`;
}

/** The website's footer (SiteFooter in SiteChrome.tsx): the blurb, the store badges and the link columns. */
function siteFooter(lang: MsgLang): string {
  const t = siteText(lang).chrome;
  const l = t.links;
  const col = (title: string, links: [string, string][]) =>
    `<nav aria-label="${esc(title)}"><p class="col-h">${esc(title)}</p><ul>${links.map(([href, label]) => `<li><a href="${esc(href)}">${esc(label)}</a></li>`).join("")}</ul></nav>`;
  return `<footer class="site-f"><div class="wrap foot-grid">
<div><p class="foot-brand">Liftsmith</p><p class="muted small">${esc(t.tagline)} ${esc(t.footerBlurb)}</p>${storeBadges(lang)}</div>
${col(t.cols.product, [
  [APP_PATH, l.openApp],
  ["/features/", l.features],
  ["/apps/", l.whoFor],
  [localPath(lang, "/pricing/"), l.pricing],
  ["/whats-new/", l.whatsNew],
  ["/me/", l.dashboard],
])}
${col(t.cols.learn, [
  ["/exercises/", l.exercises],
  ["/muscles/", l.muscles],
  ["/equipment/", l.equipment],
  ["/guides/", l.guides],
  ["/blog/", l.blog],
])}
${col(t.cols.tools, [
  ["/tools/plate-calculator/", l.plates],
  ["/tools/one-rep-max-calculator/", l.oneRm],
  ["/tools/warm-up-calculator/", l.warmUp],
  ["/tools/rpe-chart/", l.rpe],
  ["/tools/strength-standards/", l.standards],
  ["/tools/dots-calculator/", l.dots],
  ["/tools/tdee-calculator/", l.tdee],
])}
${col(t.cols.support, [
  ["/help/", l.help],
  ["/contact/", l.contact],
  ["/status/", l.status],
  ["/delete-account/", l.deleteAccount],
])}
${col(t.cols.company, [
  ["/about/", l.about],
  ["/compare/", l.compare],
  ["/import/strong/", l.fromStrong],
  ["/import/hevy/", l.fromHevy],
  ["/privacy/", l.privacy],
  ["/terms/", l.terms],
  ["/trust/", l.trust],
  ["/accessibility/", l.accessibility],
])}</div>
<div class="wrap fine"><p>© ${new Date().getFullYear()} Liftsmith · Build ${esc(COMMIT)}</p><p>${esc(t.trademarks)}</p></div></footer>`;
}

/** The site's big "get the app" banner (CtaBanner), above the footer. */
function banner(lang: MsgLang): string {
  const t = siteText(lang).chrome;
  return `<section class="wrap" aria-labelledby="banner-h"><div class="banner">
<div><p class="kicker">${esc(t.banner.label)}</p><h2 id="banner-h" class="banner-h">${esc(t.tagline)}</h2>
<ul class="checks">${t.banner.points.map((x) => `<li>${icon("check", 18)}${esc(x)}</li>`).join("")}</ul></div>
<div class="banner-go"><a class="btn btn-primary btn-big" href="${APP_PATH}">${esc(t.banner.button)}</a>${storeBadges(lang)}
<a class="quiet" href="/tools/">${esc(say(lang, "pub.tools"))} ›</a></div></div></section>`;
}

/** The bar along the bottom on phones (StickyCta). */
function stickyBar(lang: MsgLang): string {
  const t = siteText(lang).chrome;
  return `<div class="sticky"><p>${esc(fill(t.sticky, { name: "Liftsmith" }))}</p><a class="btn btn-primary btn-sm" href="${APP_PATH}">${esc(t.startFree)}</a></div>`;
}

const head = (lang: MsgLang, title: string, extra: string) =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><link rel="icon" href="/icon.svg" type="image/svg+xml"><meta name="theme-color" content="#080b10">${extra}<style>${STYLE}</style></head>`;

const page = (lang: MsgLang, title: string, extra: string, body: string) =>
  `${head(lang, title, extra)}
<body><a class="skip" href="#main">${esc(say(lang, "pub.skip"))}</a>${siteHeader(lang)}${body}${banner(lang)}${siteFooter(lang)}${stickyBar(lang)}</body></html>`;

export function profileHtml(p: PublicProfile | null, lang: MsgLang, unit: "kg" | "lb" = "kg", now = Date.now()): string {
  const t = siteText(lang).chrome;
  if (!p) {
    return page(
      lang,
      `${say(lang, "pub.gone")} · Liftsmith`,
      '<meta name="robots" content="noindex">',
      `<main id="main" class="wrap gone"><div class="card center">${icon("lock", 28, "gone-icon")}<h1>${esc(say(lang, "pub.gone"))}</h1>
<p class="muted">${esc(say(lang, "pub.goneBody"))}</p><a class="btn btn-primary" href="${APP_PATH}">${esc(t.startFree)}</a></div></main>`,
    );
  }
  const title = say(lang, "pub.title", { name: p.name, handle: p.handle });
  const desc = say(lang, "pub.description", { name: p.name });
  const url = `${SITE_URL}/u/${p.handle}/`;
  const n = new Intl.NumberFormat(lang);
  const counts: [string, number][] = [
    [say(lang, "pub.workouts"), p.posts],
    [say(lang, "pub.followers"), p.followers],
    [say(lang, "pub.following"), p.following],
  ];
  const ld = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    name: title,
    mainEntity: {
      "@type": "Person",
      name: p.name,
      alternateName: `@${p.handle}`,
      identifier: p.handle,
      url,
      interactionStatistic: [
        { "@type": "InteractionCounter", interactionType: "https://schema.org/FollowAction", userInteractionCount: p.followers },
        { "@type": "InteractionCounter", interactionType: "https://schema.org/WriteAction", userInteractionCount: p.posts },
      ],
    },
  };
  // A JSON-LD block is data, never run, so the page's no-script CSP leaves it alone.
  const meta = `<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="profile"><meta property="og:site_name" content="Liftsmith"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}"><meta property="profile:username" content="${esc(p.handle)}">
<meta property="og:image" content="${SITE_URL}/og/default.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE_URL}/og/default.jpg">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
  const follow = `${APP_PATH}#/person/${p.handle}`;
  const level = p.level > 0 ? `<li>${icon("sparkle", 16, "violet")}${esc(say(lang, "pub.level", { level: n.format(p.level) }))}</li>` : "";
  const streak = p.streak > 0 ? `<li>${icon("flame", 16, "ember")}${esc(say(lang, "pub.streak"))}: ${n.format(p.streak)}</li>` : "";
  const profileCard = `<section class="card hero" aria-labelledby="name-h">${avatarHtml(p.name, p.avatar)}
<p class="kicker">${esc(say(lang, "pub.kicker"))}</p><h1 id="name-h">${esc(p.name)}</h1><p class="muted handle">@${esc(p.handle)}</p>
<dl class="counts">${counts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${n.format(v)}</dd></div>`).join("")}</dl>
${level || streak ? `<ul class="chips">${level}${streak}</ul>` : ""}
<a class="btn btn-ghost" href="${esc(follow)}">${icon("plus", 18)}${esc(say(lang, "pub.follow"))}</a></section>`;
  const tryCard = `<section class="card try" aria-labelledby="try-h"><h2 id="try-h" class="try-h">${esc(say(lang, "pub.ctaTitle", { name: p.name }))}</h2>
<p class="muted">${esc(say(lang, "pub.ctaBody"))}</p><a class="btn btn-primary" href="${APP_PATH}">${esc(t.startFree)}</a></section>`;
  const feed = p.recent.length
    ? `<ul class="feed">${p.recent.map((x) => postHtml(x, lang, unit)).join("")}</ul>`
    : `<div class="card center empty">${icon("dumbbell", 28, "gone-icon")}<p class="muted">${esc(say(lang, "pub.none"))}</p></div>`;
  return page(
    lang,
    title,
    meta,
    `<div class="strip"><div class="wrap row strip-row"><p>${esc(say(lang, "pub.strip", { name: p.name }))}</p><a class="quiet strip-link" href="${esc(localPath(lang, "/"))}#features">${esc(say(lang, "pub.ctaFeatures"))} ›</a></div></div>
<main id="main" class="wrap layout"><aside class="side">${profileCard}${liftsHtml(p.lifts, lang, unit)}${calendarHtml(p, lang, now)}<div class="try-wide">${tryCard}</div></aside>
<section class="main-col" aria-labelledby="recent-h"><h2 id="recent-h" class="section-h">${icon("progress", 16)}${esc(say(lang, "pub.recent"))}</h2>${feed}<div class="try-narrow">${tryCard.replace(/(id|aria-labelledby)="try-h"/g, '$1="try-h2"')}</div></section></main>`,
  );
}

// The site's tokens (globals.css, dark: the website is dark), written out because the page can't load the stylesheet.
const STYLE = `
:root{color-scheme:dark;--bg:#080b10;--surface:#10151d;--raised:#18202b;--line:#232d3a;--ink:#eef2f7;--muted:#94a1b2;--faint:#808c9d;
--accent:#4c8dff;--violet:#a78bfa;--cyan:#38d6e8;--ember:#ff8a3d;--mint:#34d399;--gold:#f2c14e;--bad:#f0605d;
--grad:linear-gradient(135deg,#5b9cff,#7f8bff 55%,#9b86ff);--btn-ink:#06122a}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
background-image:radial-gradient(60% 420px at 50% 0,rgb(76 141 255/.16),transparent),radial-gradient(40% 300px at 85% 0,rgb(167 139 250/.10),transparent);
background-repeat:no-repeat;padding-bottom:calc(76px + env(safe-area-inset-bottom))}
a{color:inherit}a:focus-visible,summary:focus-visible{outline:3px solid var(--ink);outline-offset:3px;border-radius:8px}
.skip{position:absolute;left:-999px;top:8px;z-index:50;background:var(--ink);color:var(--bg);padding:10px 14px;border-radius:10px}.skip:focus{left:8px}
.wrap{width:100%;max-width:72rem;margin:0 auto;padding:0 16px}.row{display:flex;align-items:center}
.muted{color:var(--muted)}.small{font-size:.875rem}.center{text-align:center}
.violet{color:var(--violet)}.ember{color:var(--ember)}
h1,h2,p{margin:0}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 22px;border-radius:14px;font-weight:700;text-decoration:none;white-space:nowrap}
.btn-primary{background:var(--grad);color:var(--btn-ink);box-shadow:0 6px 24px -8px rgb(91 156 255/.6)}
.btn-primary:hover{filter:brightness(1.08)}
.btn-sm{min-height:44px;padding:0 16px;border-radius:12px}
.btn-big{min-height:56px;padding:0 28px;font-size:1.0625rem}
.btn-ghost{border:1px solid var(--line);background:var(--raised);color:var(--ink);width:100%;margin-top:18px}.btn-ghost:hover{border-color:var(--accent)}
.quiet{display:inline-flex;min-height:44px;align-items:center;color:var(--muted);font-weight:600;text-decoration:none;font-size:.9375rem}.quiet:hover{color:var(--ink)}
.card{background:linear-gradient(180deg,rgb(255 255 255/.035),transparent 40%),var(--surface);border:1px solid var(--line);border-radius:20px;padding:20px}
.kicker{font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--violet)}
/* Header */
.site-h{position:sticky;top:0;z-index:30;border-bottom:1px solid rgb(35 45 58/.6);background:rgb(8 11 16/.85);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.site-h .wrap{justify-content:space-between;gap:8px;padding-top:12px;padding-bottom:12px}
.logo{display:flex;align-items:center;gap:8px;font-size:1.25rem;font-weight:700;letter-spacing:-.01em;text-decoration:none}.logo img{border-radius:8px}
.nav{gap:4px;font-size:.875rem;font-weight:600}
.nav-wide{display:none;list-style:none;margin:0;padding:0;gap:4px}.nav-wide a,.menu-list a{display:flex;align-items:center;min-height:44px;padding:0 12px;border-radius:8px;text-decoration:none}
.nav-wide a:hover,.menu-list a:hover,.signin:hover{background:var(--surface)}
.signin{display:none;min-height:44px;align-items:center;padding:0 12px;border-radius:8px;color:var(--muted);text-decoration:none}
.menu{position:relative}.menu summary{list-style:none;display:flex;align-items:center;gap:6px;min-height:44px;min-width:44px;padding:0 10px;border-radius:10px;cursor:pointer;color:var(--ink)}
.menu summary::-webkit-details-marker{display:none}.menu summary span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.menu[open] summary{background:var(--surface)}.m-close,.menu[open] .m-open{display:none}.menu[open] .m-close{display:inline}
.menu-list{position:absolute;right:0;top:calc(100% + 8px);min-width:220px;list-style:none;margin:0;padding:8px;background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:0 20px 40px -12px rgb(0 0 0/.6)}
@media (min-width:400px){.signin{display:inline-flex}.narrow-only{display:none}}
@media (min-width:1024px){.nav-wide{display:flex}.menu{display:none}}
/* Strip under the header */
.strip{border-bottom:1px solid var(--line);background:linear-gradient(90deg,rgb(91 156 255/.10),rgb(155 134 255/.10))}
.strip-row{justify-content:space-between;gap:12px;padding-top:10px;padding-bottom:10px}.strip p{font-weight:600;font-size:.9375rem}
.strip-link{color:var(--ink);white-space:nowrap}@media (max-width:599px){.strip-link{display:none}}
/* Layout */
.layout{display:grid;gap:16px;padding-top:24px;padding-bottom:48px}
.side{display:grid;gap:16px;align-content:start}
.main-col{min-width:0}
.try-wide{display:none}
@media (min-width:960px){.layout{grid-template-columns:360px minmax(0,1fr);gap:28px;padding-top:36px}.try-wide{display:block}.try-narrow{display:none}
.side{position:sticky;top:88px}}
.hero{text-align:center;padding:28px 20px}
.avatar{width:96px;height:96px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;font-size:2.5rem;font-weight:800;color:var(--ink);
background:color-mix(in srgb,var(--tint) 24%,var(--surface));box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--tint) 55%,transparent),0 10px 30px -10px color-mix(in srgb,var(--tint) 60%,transparent)}
.avatar.letter{--tint:var(--accent);background:linear-gradient(135deg,rgb(91 156 255/.35),rgb(155 134 255/.35))}
.hero h1{font-size:1.75rem;line-height:1.15;font-weight:800;letter-spacing:-.02em;margin-top:6px;overflow-wrap:anywhere}.handle{margin-top:2px}
.counts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:20px 0 0}.counts div{background:var(--raised);border-radius:14px;padding:10px 4px}
dt{font-size:.8125rem;color:var(--muted)}dd{margin:0;font-weight:800;font-size:1.375rem;font-variant-numeric:tabular-nums}
.chips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;list-style:none;padding:0;margin:14px 0 0}
.chips li{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid var(--line);border-radius:999px;font-size:.875rem;font-weight:600}
.card h2,.section-h{display:flex;align-items:center;gap:8px;font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 12px}
.section-h{margin:4px 4px 12px}
.lifts{list-style:none;padding:0;margin:0}.lifts li{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line)}
.lifts li:first-child{border-top:0;padding-top:0}.lifts a{font-weight:600;text-decoration:none}.lifts a:hover{text-decoration:underline}
.lifts time{display:block;font-size:.8125rem;color:var(--muted)}.lifts strong{font-variant-numeric:tabular-nums;white-space:nowrap}
.cal{display:grid;grid-template-columns:auto 1fr;gap:8px}.cal-days{display:grid;grid-template-rows:repeat(7,1fr);gap:4px;font-size:.625rem;line-height:1;color:var(--muted)}
.cal-days span{display:flex;align-items:center;justify-content:flex-end;min-height:14px}
.cal ol{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,1fr);gap:4px;list-style:none;margin:0;padding:0;justify-content:space-between}
.cal li{width:14px;height:14px;border-radius:4px;background:var(--raised)}.cal li.on{background:var(--mint);box-shadow:0 0 8px rgb(52 211 153/.4)}
.cal + p{margin-top:12px}
.try{background:linear-gradient(160deg,rgb(91 156 255/.16),rgb(155 134 255/.10) 60%,transparent),var(--surface);border-color:rgb(127 139 255/.35)}
.card .try-h{font-size:1.25rem;line-height:1.25;font-weight:800;letter-spacing:-.01em;text-transform:none;color:var(--ink);margin:0 0 8px;display:block}
.try p{margin-bottom:16px}.try .btn{width:100%}
.feed{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.post time{color:var(--muted);font-size:.875rem;font-weight:600}
.caption{margin-top:6px;white-space:pre-wrap;overflow-wrap:anywhere}
.stats{display:flex;flex-wrap:wrap;gap:8px 24px;margin:12px 0 0}.stats dd{font-size:1.0625rem}
.exs{list-style:none;padding:0;margin:14px 0 0}.exs li{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid var(--line)}
.ex-name a{text-decoration:none}.ex-name a:hover{text-decoration:underline}.ex-best{color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.tag{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;font-size:.6875rem;font-weight:700;color:var(--gold);background:rgb(242 193 78/.12);vertical-align:1px}
.more{color:var(--muted);font-size:.875rem;padding-top:8px}
.empty{padding:32px 20px}.gone-icon{color:var(--muted);margin-bottom:8px}
.gone{padding-top:56px;padding-bottom:56px;max-width:36rem}.gone h1{font-size:1.75rem;font-weight:800;margin:4px 0 8px}.gone p{margin-bottom:20px}
.try-narrow{margin-top:16px}
/* Banner */
.banner{display:grid;gap:24px;margin:8px 0 56px;padding:32px 24px;border-radius:28px;border:1px solid rgb(127 139 255/.35);
background:radial-gradient(80% 120% at 0 0,rgb(91 156 255/.22),transparent 60%),radial-gradient(60% 100% at 100% 100%,rgb(155 134 255/.18),transparent 60%),var(--surface)}
.banner-h{font-size:clamp(1.75rem,4vw,2.5rem);line-height:1.1;font-weight:800;letter-spacing:-.02em;margin-top:8px}
.checks{list-style:none;padding:0;margin:18px 0 0;display:grid;gap:8px}.checks li{display:flex;align-items:center;gap:10px}.checks svg{color:var(--mint);flex:none}
.banner-go{display:flex;flex-direction:column;align-items:flex-start;gap:16px}
@media (min-width:820px){.banner{grid-template-columns:1.3fr 1fr;align-items:center;padding:44px}.banner-go{align-items:stretch}}
.badges{display:flex;flex-wrap:wrap;gap:10px;margin-top:4px}
.badge{display:inline-flex;align-items:center;gap:10px;height:52px;min-width:164px;padding:0 14px;border-radius:10px;border:1px solid #a6a6a6;background:#000;color:#fff;text-decoration:none}
.badge.dim{opacity:.6}.badge-wrap{position:relative;display:inline-flex}.soon{position:absolute;top:-8px;right:-8px;border-radius:999px;padding:2px 8px;font-size:.625rem;font-weight:700;text-transform:uppercase;background:var(--accent);color:var(--btn-ink)}
.b-text{display:flex;flex-direction:column;line-height:1}.b-small{font-size:.625rem;font-weight:500;letter-spacing:.02em}.b-big{margin-top:2px;font-size:1.1875rem;font-weight:600;letter-spacing:-.01em}
/* Footer */
.site-f{border-top:1px solid var(--line)}
.foot-grid{display:grid;gap:32px;padding-top:40px;padding-bottom:40px}
@media (min-width:640px){.foot-grid{grid-template-columns:1fr 1fr}}@media (min-width:1024px){.foot-grid{grid-template-columns:1.5fr 1fr 1fr 1fr 1fr 1fr}}
.foot-brand{font-size:1.125rem;font-weight:700}.foot-grid .small{margin:8px 0 16px;max-width:24rem}
.col-h{font-weight:600}.site-f ul{list-style:none;padding:0;margin:8px 0 0;display:grid;gap:8px;font-size:.875rem}
.site-f nav a{color:var(--muted);text-decoration:none}.site-f nav a:hover{color:var(--ink)}
.fine{padding-bottom:32px;font-size:.75rem;color:var(--faint);display:grid;gap:4px}
/* Phone bar */
.sticky{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:12px;
padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:rgb(16 21 29/.95);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid var(--line)}
.sticky p{font-weight:600;font-size:.9375rem}
@media (min-width:960px){body{padding-bottom:0}.sticky{display:none}}
@media (prefers-reduced-motion:no-preference){.btn,.badge{transition:filter .15s,border-color .15s}}
@media (forced-colors:active){.card,.btn,.badge{border:1px solid CanvasText}}`;
