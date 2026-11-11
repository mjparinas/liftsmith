// Public profiles on the web (Melvin, 2026-11-11: "make public accounts available on the web through a link and it
// should be added to the sitemap … only public users should be in the sitemap"). A lifter who turns on Public
// profile in Friends gets a page at www.getliftsmith.com/u/<handle>/ with their name, counts and recent workout
// summaries, and the page is listed in the people sitemap (/sitemap-people.xml). Private profiles, suspended
// ones and unknown handles all get the same "isn't public" page with noindex, so the page never tells anyone
// whether a private handle exists. Like the share link page, it's plain HTML with no scripts and its own strict
// CSP (SHARE_PAGE_CSP), and everything the lifter typed is escaped. Decision record: docs/decisions/friends.md.
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { isMsgLang, MSG_LANGS, type MsgLang } from "@/lib/messageText";
import { SHARE_PAGE_CSP } from "@/lib/securityHeaders";
import { APP_PATH, SITE_URL } from "@/lib/site";
import { cleanHandle, HANDLE_RE, type PostBody } from "@/lib/socialTypes";
import * as pub from "@/locales/text/pub";

import { query } from "./db";

/** Workouts shown on the page, newest first. */
export const PAGE_POSTS = 12;
/** Exercises shown per workout before "+N more". */
const EXERCISES_SHOWN = 4;
/** Profiles in the people sitemap (Google's limit for one file is 50,000). */
export const SITEMAP_MAX = 45_000;

export const profilePageUrl = (handle: string) => `${SITE_URL}/u/${handle}/`;

export interface PublicPost {
  at: number;
  body: PostBody;
}
export interface PublicProfile {
  handle: string;
  name: string;
  followers: number;
  following: number;
  posts: number;
  recent: PublicPost[];
}

/** A public, unsuspended profile and its recent workouts, or null for anything else. */
export async function publicProfile(handle: string): Promise<PublicProfile | null> {
  const h = cleanHandle(handle);
  if (!HANDLE_RE.test(h)) return null;
  const [p] = await query<{ account_id: string; handle: string; name: string }>(
    "SELECT account_id, handle, name FROM social_profiles WHERE handle = ? AND public = 1 AND suspended = 0",
    [h],
  );
  if (!p) return null;
  const id = String(p.account_id);
  const [c] = await query(
    `SELECT
      (SELECT COUNT(*) FROM follows WHERE followee_id = ?1 AND accepted = 1) AS followers,
      (SELECT COUNT(*) FROM follows WHERE follower_id = ?1 AND accepted = 1) AS following,
      (SELECT COUNT(*) FROM posts WHERE account_id = ?1 AND hidden = 0) AS posts`,
    [id],
  );
  const rows = await query<{ at: number; body: string }>(
    `SELECT at, body FROM posts WHERE account_id = ? AND hidden = 0 ORDER BY at DESC LIMIT ${PAGE_POSTS}`,
    [id],
  );
  const recent: PublicPost[] = [];
  for (const r of rows) {
    try {
      recent.push({ at: Number(r.at), body: JSON.parse(String(r.body)) as PostBody });
    } catch {
      // a broken row is left out rather than breaking the page
    }
  }
  return {
    handle: String(p.handle),
    name: String(p.name),
    followers: Number(c?.followers ?? 0),
    following: Number(c?.following ?? 0),
    posts: Number(c?.posts ?? 0),
    recent,
  };
}

/** The handle in /u/<handle>/ (rewritten to ?handle=). */
export function handleFrom(req: Request): string {
  return cleanHandle(new URL(req.url).searchParams.get("handle") ?? "");
}

/** The reader's language from Accept-Language, one of the six, English when none match. */
export function langFrom(req: Request): MsgLang {
  const header = req.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const tag = part.split(";")[0]!.trim().toLowerCase().slice(0, 2);
    if (isMsgLang(tag)) return tag;
  }
  return MSG_LANGS[0];
}

/** Pounds for readers in the United States, kilograms for everyone else. */
export function unitFrom(req: Request): "kg" | "lb" {
  const first = (req.headers.get("accept-language") ?? "").split(",")[0]!.split(";")[0]!.trim().toLowerCase();
  return first === "en-us" ? "lb" : "kg";
}

// --- The page ---

type PubKey = keyof typeof pub.en;
const CATALOG: Record<MsgLang, Partial<Record<PubKey, unknown>>> = {
  en: pub.en,
  es: pub.es,
  fr: pub.fr,
  de: pub.de,
  it: pub.it,
  ja: pub.ja,
};
const say = (lang: MsgLang, key: PubKey, vars: Record<string, string | number> = {}) =>
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

const STYLE = `
*{box-sizing:border-box}html{color-scheme:dark}body{margin:0;min-height:100vh;background:#0a0d12;color:#e8edf3;
font:16px/1.5 system-ui,-apple-system,Roboto,sans-serif;display:flex;flex-direction:column;align-items:center;padding:24px 16px 40px;
background-image:radial-gradient(60% 40% at 50% 0,#4c8dff33,transparent)}
main{width:100%;max-width:560px}
.brand{color:#4c8dff;font-weight:800;letter-spacing:.06em;text-decoration:none;font-size:15px}
header{text-align:center;margin:18px 0 8px}
.avatar{width:72px;height:72px;border-radius:50%;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;
font-size:30px;font-weight:800;color:#0a0d12;background:linear-gradient(135deg,#4c8dff,#a78bfa)}
h1{font-size:1.75rem;line-height:1.15;margin:0}h2{font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:#a3aebd;margin:28px 4px 10px}
.handle{color:#a3aebd;margin:2px 0 0}
dl{display:flex;justify-content:center;gap:28px;margin:16px 0 0}dl div{text-align:center}dt{font-size:13px;color:#a3aebd}
dd{margin:0;font-weight:800;font-size:20px;font-variant-numeric:tabular-nums}
dl.stats{justify-content:flex-start;gap:20px;margin:10px 0 0}dl.stats dd{font-size:16px}
ul{list-style:none;padding:0;margin:0}article ul{margin-top:10px}
article{background:#121722;border:1px solid #ffffff1a;border-radius:18px;padding:16px;margin:0 0 12px}
time{color:#a3aebd;font-size:14px}
li.ex{display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-top:1px solid #ffffff12}
li.ex:first-child{border-top:0}li.ex span:last-child{color:#a3aebd;font-variant-numeric:tabular-nums;white-space:nowrap}
.more{color:#a3aebd;font-size:14px;padding-top:6px}
.center{text-align:center}p{color:#a3aebd;margin:6px 0 18px}
a.cta{display:inline-block;min-height:48px;padding:13px 26px;border-radius:14px;font-weight:700;text-decoration:none;color:#0a0d12;
background:linear-gradient(135deg,#4c8dff,#a78bfa);margin:22px 0 0}
a:focus-visible{outline:3px solid #e8edf3;outline-offset:3px}`;

const head = (lang: MsgLang, title: string, extra: string) =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>${extra}<style>${STYLE}</style></head>`;

function postHtml(p: PublicPost, lang: MsgLang, unit: "kg" | "lb"): string {
  const b = p.body;
  const day = new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeZone: "UTC" }).format(p.at);
  const n = new Intl.NumberFormat(lang);
  const stats: [string, string][] = [
    [say(lang, "pub.time"), `${n.format(Math.max(1, Math.round(b.seconds / 60)))} min`],
    [say(lang, "pub.sets"), n.format(b.sets)],
    ...(b.volume ? ([[say(lang, "pub.volume"), weight(b.volume, unit, lang)]] as [string, string][]) : []),
    ...(b.prs ? ([[say(lang, "pub.prs"), n.format(b.prs)]] as [string, string][]) : []),
  ];
  const shown = b.exercises.slice(0, EXERCISES_SHOWN);
  const rest = b.exercises.length - shown.length;
  return `<li><article><time datetime="${new Date(p.at).toISOString().slice(0, 10)}">${esc(day)}</time>
<dl class="stats">${stats.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
<ul>${shown.map((e) => `<li class="ex"><span>${esc(e.name)}</span><span>${esc(bestSetText(e, unit, lang))}</span></li>`).join("")}</ul>
${rest > 0 ? `<div class="more">${esc(say(lang, "pub.more", { count: rest }))}</div>` : ""}</article></li>`;
}

export function profileHtml(p: PublicProfile | null, lang: MsgLang, unit: "kg" | "lb" = "kg"): string {
  const home = `${SITE_URL}/?utm_source=profile&utm_medium=link&utm_campaign=public_profile`;
  if (!p) {
    return `${head(lang, `${say(lang, "pub.gone")} · Liftsmith`, '<meta name="robots" content="noindex">')}
<body><main class="center"><a class="brand" href="${home}">LIFTSMITH</a><h1 style="margin-top:24px">${esc(say(lang, "pub.gone"))}</h1>
<p>${esc(say(lang, "pub.goneBody"))}</p><a class="cta" href="${home}">${esc(say(lang, "pub.get"))}</a></main></body></html>`;
  }
  const title = say(lang, "pub.title", { name: p.name, handle: p.handle });
  const desc = say(lang, "pub.description", { name: p.name });
  const url = profilePageUrl(p.handle);
  const n = new Intl.NumberFormat(lang);
  const counts: [string, number][] = [
    [say(lang, "pub.workouts"), p.posts],
    [say(lang, "pub.followers"), p.followers],
    [say(lang, "pub.following"), p.following],
  ];
  const meta = `<meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="profile"><meta property="og:site_name" content="Liftsmith"><meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}"><meta property="profile:username" content="${esc(p.handle)}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">`;
  const initial = [...p.name.trim()][0]?.toUpperCase() ?? "@";
  const follow = `${SITE_URL}${APP_PATH}#/person/${p.handle}`;
  return `${head(lang, title, meta)}
<body><main><div class="center"><a class="brand" href="${home}">LIFTSMITH</a></div>
<header><div class="avatar" aria-hidden="true">${esc(initial)}</div><h1>${esc(p.name)}</h1><p class="handle">@${esc(p.handle)}</p>
<dl>${counts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${n.format(v)}</dd></div>`).join("")}</dl>
<a class="cta" href="${esc(follow)}">${esc(say(lang, "pub.follow"))}</a></header>
<h2>${esc(say(lang, "pub.recent"))}</h2>
${p.recent.length ? `<ul>${p.recent.map((x) => postHtml(x, lang, unit)).join("")}</ul>` : `<p class="center">${esc(say(lang, "pub.none"))}</p>`}
<div class="center"><a class="cta" href="${home}">${esc(say(lang, "pub.get"))}</a></div></main></body></html>`;
}

export const PROFILE_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy": SHARE_PAGE_CSP,
  // The language and units follow the reader's Accept-Language.
  Vary: "Accept-Language",
  // Short, so turning Public off takes a public page down within minutes.
  "Cache-Control": "public, max-age=60, s-maxage=300",
};
export const GONE_HEADERS = { ...PROFILE_HEADERS, "X-Robots-Tag": "noindex" };

// --- The people sitemap ---

/** Public profiles with at least one workout to show (an empty page would be thin), newest activity first. */
export async function sitemapPeople(): Promise<{ handle: string; lastModified: number }[]> {
  const rows = await query<{ handle: string; last: number }>(
    `SELECT sp.handle AS handle, MAX(p.at) AS last FROM social_profiles sp JOIN posts p ON p.account_id = sp.account_id AND p.hidden = 0
     WHERE sp.public = 1 AND sp.suspended = 0 GROUP BY sp.account_id ORDER BY last DESC LIMIT ${SITEMAP_MAX}`,
  );
  return rows.map((r) => ({ handle: String(r.handle), lastModified: Number(r.last) }));
}

export function sitemapXml(people: { handle: string; lastModified: number }[]): string {
  const urls = people.map(
    (p) =>
      `<url><loc>${esc(profilePageUrl(p.handle))}</loc><lastmod>${new Date(p.lastModified).toISOString().slice(0, 10)}</lastmod><changefreq>weekly</changefreq></url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
