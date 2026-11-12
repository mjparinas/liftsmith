// The website's header, footer and calls to try Liftsmith for the pages the server draws as plain HTML with no
// scripts: public profiles (/u/<handle>/, profilePage.ts) and share links (/w/<id>/, shareLinks.ts). Those pages can't
// load the site's React or stylesheet under their strict CSP (SHARE_PAGE_CSP), so the frame is redrawn here from the
// same lists and text as SiteChrome.tsx (`navFor`, `siteText().chrome`); the phone menu is a <details>, so it needs no
// script. Each page gets the site header, the big "Get the app" banner, the footer and a bar along the bottom on phones.
// Links to our own pages carry no UTM tags (each tag is a new address for crawlers); only store links do.
import { ICON_PATHS, type IconName } from "@/components/app/icons";
import { navFor } from "@/components/site/nav";
import { COMMIT } from "@/lib/build";
import type { MsgLang } from "@/lib/messageText";
import { APP_PATH, STORE_LINKS } from "@/lib/site";
import { fill, localPath } from "@/lib/siteLang";
import { siteText } from "@/locales/site";
import * as pub from "@/locales/text/pub";

/** Which page the frame is on, for the store links' referrer (the only links that carry a source). */
export type FrameSource = "profile" | "share" | "gym";

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

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function icon(name: IconName, size = 20, cls = ""): string {
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON_PATHS[name]}"/></svg>`;
}

export function storeBadges(lang: MsgLang, source: FrameSource): string {
  const b = siteText(lang).chrome.badges;
  const referrer = `utm_source=${source}&utm_medium=${source}_page&utm_campaign=${source === "profile" ? "public_profile" : source === "gym" ? "gym_page" : "share_link"}`;
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
function siteFooter(lang: MsgLang, source: FrameSource): string {
  const t = siteText(lang).chrome;
  const l = t.links;
  const col = (title: string, links: [string, string][]) =>
    `<nav aria-label="${esc(title)}"><p class="col-h">${esc(title)}</p><ul>${links.map(([href, label]) => `<li><a href="${esc(href)}">${esc(label)}</a></li>`).join("")}</ul></nav>`;
  return `<footer class="site-f"><div class="wrap foot-grid">
<div><p class="foot-brand">Liftsmith</p><p class="muted small">${esc(t.tagline)} ${esc(t.footerBlurb)}</p>${storeBadges(lang, source)}</div>
${col(t.cols.product, [
  [APP_PATH, l.openApp],
  ["/features/", l.features],
  ["/apps/", l.whoFor],
  ["/gyms/", l.gyms],
  [localPath(lang, "/pricing/"), l.pricing],
  ["/whats-new/", l.whatsNew],
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
function banner(lang: MsgLang, source: FrameSource): string {
  const t = siteText(lang).chrome;
  return `<section class="wrap" aria-labelledby="banner-h"><div class="banner">
<div><p class="kicker">${esc(t.banner.label)}</p><h2 id="banner-h" class="banner-h">${esc(t.tagline)}</h2>
<ul class="checks">${t.banner.points.map((x) => `<li>${icon("check", 18)}${esc(x)}</li>`).join("")}</ul></div>
<div class="banner-go"><a class="btn btn-primary btn-big" href="${APP_PATH}">${esc(t.banner.button)}</a>${storeBadges(lang, source)}
<a class="quiet" href="/tools/">${esc(say(lang, "pub.tools"))} ›</a></div></div></section>`;
}

/** The bar along the bottom on phones (StickyCta). */
function stickyBar(lang: MsgLang): string {
  const t = siteText(lang).chrome;
  return `<div class="sticky"><p>${esc(fill(t.sticky, { name: "Liftsmith" }))}</p><a class="btn btn-primary btn-sm" href="${APP_PATH}">${esc(t.startFree)}</a></div>`;
}

const head = (lang: MsgLang, title: string, extra: string, css: string) =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><link rel="icon" href="/icon.svg" type="image/svg+xml"><meta name="theme-color" content="#080b10">${extra}<style>${STYLE}${css}</style></head>`;

/** A whole page: the frame around `body`, with the page's own `css` after the shared sheet. */
export const framePage = (lang: MsgLang, title: string, extra: string, body: string, css = "", source: FrameSource = "profile") =>
  `${head(lang, title, extra, css)}
<body><a class="skip" href="#main">${esc(say(lang, "pub.skip"))}</a>${siteHeader(lang)}${body}${banner(lang, source)}${siteFooter(lang, source)}${stickyBar(lang)}</body></html>`;

// The site's tokens (globals.css, dark: the website is dark), written out because these pages can't load the stylesheet.
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
/* Shared cards */
.try-wide{display:none}
.try{background:linear-gradient(160deg,rgb(91 156 255/.16),rgb(155 134 255/.10) 60%,transparent),var(--surface);border-color:rgb(127 139 255/.35)}
.card .try-h{font-size:1.25rem;line-height:1.25;font-weight:800;letter-spacing:-.01em;text-transform:none;color:var(--ink);margin:0 0 8px;display:block}
.try p{margin-bottom:16px}.try .btn{width:100%}
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
