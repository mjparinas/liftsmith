// The website's pages for the Liftsmith community (Melvin, 2026-11-17; docs/decisions/community.md):
//   /community/                 top ideas, bugs being looked at and what just shipped
//   /community/roadmap/         in progress, planned and recently shipped
//   /community/changelog/       everything that shipped, newest first
//   /community/<slug>-<id>/     one idea or bug: its status, votes, details, the team's updates and the comments
// Plain HTML with no scripts in the site's frame, like the trainer directory, in the reader's language, with the same
// words as the app (cmty.*). Reading only: voting, posting and commenting happen in the app, which every page links to.
// Nothing an under-18 wrote is on these pages, screenshots never are, and a post hidden after reports is a noindex 404.
// A merged post redirects to the one it went into. A post with few votes and no answer yet is noindex, so the index
// isn't filled with one-line ideas nobody backed.
import {
  OPEN_STATUSES,
  postPath,
  sortPosts,
  type CommunityComment,
  type CommunityPost,
  type CommunityUpdate,
  type Status,
} from "@/lib/community";
import type { MsgLang } from "@/lib/messageText";
import { SITE_URL } from "@/lib/site";
import * as cmty from "@/locales/text/cmty";

import { board, changelog, thread } from "./community";
import { crumbs, GYM_STYLE, metaTags } from "./gymPage";
import { esc, framePage, icon } from "./siteFrame";

type Key = keyof typeof cmty.en;
const CAT: Record<MsgLang, Partial<Record<string, unknown>>> = {
  en: cmty.en,
  es: cmty.es,
  fr: cmty.fr,
  de: cmty.de,
  it: cmty.it,
  ja: cmty.ja,
  pt: cmty.pt,
  ko: cmty.ko,
  pl: cmty.pl,
  tr: cmty.tr,
};

/** A line from the app's community catalogue, plurals included. */
export function sayC(lang: MsgLang, key: Key, vars: Record<string, string | number> = {}): string {
  let m = CAT[lang][key] ?? cmty.en[key];
  if (m && typeof m === "object") {
    const forms = m as Record<string, string>;
    m = forms[new Intl.PluralRules(lang).select(Number(vars.count ?? 0))] ?? forms.other ?? "";
  }
  return String(m ?? "").replace(/\{(\w+)\}/g, (all, k: string) => (k in vars ? String(vars[k]) : all));
}

const ROADMAP = "/community/roadmap/";
const CHANGELOG = "/community/changelog/";
const APP = "/app/#/community";
/** Votes a post needs (or an answer from the team) before search engines are asked to index its page. */
export const INDEX_VOTES = 3;

const statusText = (lang: MsgLang, status: Status, kind: CommunityPost["kind"]) =>
  sayC(lang, status === "shipped" && kind === "bug" ? "cmty.status.fixed" : (`cmty.status.${status}` as Key));
const day = (lang: MsgLang, ms: number) => new Intl.DateTimeFormat(lang, { year: "numeric", month: "short", day: "numeric" }).format(ms);
const pill = (lang: MsgLang, p: Pick<CommunityPost, "status" | "kind">) =>
  `<span class="pill s-${p.status}">${esc(statusText(lang, p.status, p.kind))}</span>`;
const byName = (lang: MsgLang, x: { name: string }) => x.name || sayC(lang, "cmty.anon");

function postList(lang: MsgLang, posts: CommunityPost[]): string {
  return `<ul class="list">${posts
    .map(
      (p) =>
        `<li><a href="${esc(postPath(p))}"><span class="li-name">${esc(p.title)}</span><span class="muted small">${pill(lang, p)} ${esc(sayC(lang, "cmty.votes", { count: p.votes }))} · ${esc(sayC(lang, "cmty.comments", { count: p.comments }))}</span></a></li>`,
    )
    .join("")}</ul>`;
}

function updatesList(lang: MsgLang, updates: CommunityUpdate[]): string {
  return `<ul class="list">${updates
    .map(
      (u) =>
        `<li><a href="${esc(postPath({ id: u.postId, title: u.title ?? "" }))}"><span class="muted small">${esc(day(lang, u.at))} · ${esc(sayC(lang, u.kind === "bug" ? "cmty.status.fixed" : "cmty.status.shipped"))}</span><span class="li-name">${esc(u.title ?? "")}</span>${u.note ? `<span class="muted small">${esc(u.note)}</span>` : ""}</a></li>`,
    )
    .join("")}</ul>`;
}

const card = (id: string, ic: Parameters<typeof icon>[0], title: string, inner: string) =>
  `<section class="card" aria-labelledby="${id}"><h2 id="${id}">${icon(ic, 16)}${esc(title)}</h2>${inner}</section>`;
const none = (lang: MsgLang) => `<p class="muted">${esc(sayC(lang, "cmty.road.none"))}</p>`;
const nav = (lang: MsgLang) =>
  `<p class="links-row"><a class="quiet" href="/community/">${esc(sayC(lang, "cmty.page.all"))} ›</a> <a class="quiet" href="${ROADMAP}">${esc(sayC(lang, "cmty.page.roadmapTitle"))} ›</a> <a class="quiet" href="${CHANGELOG}">${esc(sayC(lang, "cmty.page.changelogTitle"))} ›</a></p>`;

const STYLE = `
.pill{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:1px 8px;font-size:.75rem;font-weight:700;color:var(--muted)}
.pill::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--faint)}
.s-planned::before{background:var(--violet)}.s-progress::before{background:var(--cyan)}.s-shipped::before{background:var(--mint)}
.links-row{display:flex;flex-wrap:wrap;gap:4px 16px}.links-row a{display:inline-flex;min-height:44px;align-items:center}
.votes{font-size:1.75rem;font-weight:800;font-variant-numeric:tabular-nums;margin:12px 0 0}
.body{white-space:pre-wrap;overflow-wrap:anywhere}
.comments{list-style:none;margin:0;padding:0;display:grid;gap:12px}.comments li{border-top:1px solid var(--line);padding-top:12px}
.comments li:first-child{border-top:0;padding-top:0}.team{color:var(--accent);font-weight:700}.mention{color:var(--accent);font-weight:600}
.add-note{margin-top:8px}`;

/** A comment's words with @mentions marked, escaped. */
function commentHtml(text: string): string {
  return esc(text).replace(/(^|[^\w@])(@[a-z0-9_]{3,20})\b/gi, (_, pre: string, m: string) => `${pre}<span class="mention">${m}</span>`);
}

/** /community/: top ideas, bugs being looked at, recently shipped. */
export function communityIndexHtml(lang: MsgLang, posts: CommunityPost[], shipped: CommunityUpdate[]): string {
  const title = `${sayC(lang, "cmty.page.title")} | Liftsmith`;
  const open = posts.filter((p) => OPEN_STATUSES.includes(p.status));
  const ideas = sortPosts(
    open.filter((p) => p.kind === "idea"),
    "top",
  ).slice(0, 30);
  const bugs = sortPosts(
    open.filter((p) => p.kind === "bug"),
    "top",
  ).slice(0, 15);
  const ld = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: sayC(lang, "cmty.page.title"),
    url: `${SITE_URL}/community/`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: ideas.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${postPath(p)}`, name: p.title })),
    },
  };
  const body = `<main id="main" class="wrap page narrow">
<header class="head"><p class="kicker">${esc(sayC(lang, "cmty.title"))}</p><h1>${esc(sayC(lang, "cmty.page.title"))}</h1><p class="muted">${esc(sayC(lang, "cmty.page.lead"))}</p>
<a class="btn btn-primary wide" href="${APP}/new" rel="nofollow">${esc(sayC(lang, "cmty.page.cta"))}</a></header>
${card("ideas-h", "lightbulb", sayC(lang, "cmty.page.topIdeas"), ideas.length ? postList(lang, ideas) : `<p class="muted">${esc(sayC(lang, "cmty.page.emptyBody"))}</p>`)}
${bugs.length ? card("bugs-h", "flag", sayC(lang, "cmty.page.openBugs"), postList(lang, bugs)) : ""}
${card("shipped-h", "check", sayC(lang, "cmty.road.shipped"), shipped.length ? updatesList(lang, shipped.slice(0, 10)) : none(lang))}
${nav(lang)}</main>`;
  return framePage(
    lang,
    title,
    metaTags(title, sayC(lang, "cmty.page.desc"), "/community/", ld, posts.length > 0),
    body,
    `${GYM_STYLE}${STYLE}`,
    "community",
  );
}

/** /community/roadmap/: in progress, planned, recently shipped. */
export function roadmapHtml(lang: MsgLang, posts: CommunityPost[], shipped: CommunityUpdate[]): string {
  const title = `${sayC(lang, "cmty.page.roadmapTitle")} | Liftsmith`;
  const column = (status: Status) =>
    sortPosts(
      posts.filter((p) => p.status === status),
      "top",
    );
  const progress = column("progress");
  const planned = column("planned");
  const body = `<main id="main" class="wrap page narrow">${crumbs(lang, [
    [sayC(lang, "cmty.title"), "/community/"],
    [sayC(lang, "cmty.tab.roadmap"), null],
  ])}
<header class="head"><h1>${esc(sayC(lang, "cmty.page.roadmapTitle"))}</h1><p class="muted">${esc(sayC(lang, "cmty.page.roadmapDesc"))}</p></header>
${card("progress-h", "bolt", sayC(lang, "cmty.road.progress"), progress.length ? postList(lang, progress) : none(lang))}
${card("planned-h", "calendar", sayC(lang, "cmty.road.planned"), planned.length ? postList(lang, planned) : none(lang))}
${card("shipped-h", "check", sayC(lang, "cmty.road.shipped"), shipped.length ? updatesList(lang, shipped.slice(0, 15)) : none(lang))}
${nav(lang)}</main>`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: sayC(lang, "cmty.page.roadmapTitle"),
    url: `${SITE_URL}${ROADMAP}`,
  };
  return framePage(
    lang,
    title,
    metaTags(title, sayC(lang, "cmty.page.roadmapDesc"), ROADMAP, ld, progress.length + planned.length + shipped.length > 0),
    body,
    `${GYM_STYLE}${STYLE}`,
    "community",
  );
}

/** /community/changelog/: what shipped, newest first. */
export function changelogHtml(lang: MsgLang, shipped: CommunityUpdate[]): string {
  const title = `${sayC(lang, "cmty.page.changelogTitle")} | Liftsmith`;
  const body = `<main id="main" class="wrap page narrow">${crumbs(lang, [
    [sayC(lang, "cmty.title"), "/community/"],
    [sayC(lang, "cmty.changelog"), null],
  ])}
<header class="head"><h1>${esc(sayC(lang, "cmty.page.changelogTitle"))}</h1><p class="muted">${esc(sayC(lang, "cmty.page.changelogDesc"))}</p></header>
${card("log-h", "check", sayC(lang, "cmty.changelog"), shipped.length ? updatesList(lang, shipped) : none(lang))}
${nav(lang)}</main>`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: sayC(lang, "cmty.page.changelogTitle"),
    url: `${SITE_URL}${CHANGELOG}`,
  };
  return framePage(
    lang,
    title,
    metaTags(title, sayC(lang, "cmty.page.changelogDesc"), CHANGELOG, ld, shipped.length > 0),
    body,
    `${GYM_STYLE}${STYLE}`,
    "community",
  );
}

/** Whether a post's page is worth indexing: backed by a few votes, or answered by the team. */
export const indexable = (p: CommunityPost) => p.votes >= INDEX_VOTES || (p.status !== "review" && p.status !== "merged");

/** schema.org for one post: a DiscussionForumPosting with its votes and comments. */
export function postLd(p: CommunityPost, comments: CommunityComment[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: p.title,
    ...(p.body ? { text: p.body } : {}),
    url: `${SITE_URL}${postPath(p)}`,
    datePublished: new Date(p.createdAt).toISOString(),
    author: { "@type": "Person", name: p.name || sayC("en", "cmty.anon") },
    interactionStatistic: [
      { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: p.votes },
      { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: comments.length },
    ],
    comment: comments.slice(0, 20).map((c) => ({
      "@type": "Comment",
      text: c.body,
      datePublished: new Date(c.at).toISOString(),
      author: c.staff ? { "@type": "Organization", name: "Liftsmith" } : { "@type": "Person", name: c.name || sayC("en", "cmty.anon") },
    })),
  };
}

/** One idea or bug. */
export function postHtml(lang: MsgLang, p: CommunityPost, comments: CommunityComment[], updates: CommunityUpdate[]): string {
  const title = `${p.title} | ${sayC(lang, "cmty.title")} | Liftsmith`;
  const desc = [statusText(lang, p.status, p.kind), sayC(lang, "cmty.votes", { count: p.votes }), p.body]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 300);
  const timeline = updates.filter((u) => u.status !== "merged");
  const body = `<main id="main" class="wrap page narrow">${crumbs(lang, [
    [sayC(lang, "cmty.title"), "/community/"],
    [p.title, null],
  ])}
<header class="head"><p class="kicker">${esc(sayC(lang, p.kind === "bug" ? "cmty.kind.bug" : "cmty.kind.idea"))}</p><h1>${esc(p.title)}</h1>
<p class="muted small">${pill(lang, p)} ${esc(byName(lang, p))} · ${esc(day(lang, p.createdAt))}</p>
<p class="votes">${esc(sayC(lang, "cmty.votes", { count: p.votes }))}</p>
<a class="btn btn-primary wide" href="${APP}/${encodeURIComponent(p.id)}" rel="nofollow">${esc(sayC(lang, "cmty.page.voteCta"))}</a></header>
${p.body ? `<section class="card"><p class="body">${esc(p.body)}</p></section>` : ""}
${
  timeline.length
    ? card(
        "timeline-h",
        "bell",
        sayC(lang, "cmty.timeline"),
        `<ul class="comments">${timeline.map((u) => `<li><p class="muted small">${pill(lang, { status: u.status, kind: p.kind })} ${esc(day(lang, u.at))}</p>${u.note ? `<p class="body">${esc(u.note)}</p>` : ""}</li>`).join("")}</ul>`,
      )
    : ""
}
${card(
  "comments-h",
  "chat",
  sayC(lang, "cmty.commentsTitle"),
  comments.length
    ? `<ul class="comments">${comments
        .map(
          (c) =>
            `<li><p class="small">${c.staff ? `<span class="team">${esc(sayC(lang, "cmty.team"))}</span>` : `<strong>${esc(byName(lang, c))}</strong>`} <span class="muted">${esc(day(lang, c.at))}</span></p><p class="body">${commentHtml(c.body)}</p></li>`,
        )
        .join("")}</ul>`
    : `<p class="muted">${esc(sayC(lang, "cmty.noComments"))}</p>`,
)}
${nav(lang)}</main>`;
  return framePage(
    lang,
    title,
    metaTags(title, desc, postPath(p), postLd(p, comments), indexable(p)),
    body,
    `${GYM_STYLE}${STYLE}`,
    "community",
  );
}

/** The page when a post isn't there (or isn't public). */
export function goneHtml(lang: MsgLang): string {
  const title = `${sayC(lang, "cmty.page.gone")} | Liftsmith`;
  const body = `<main id="main" class="wrap page narrow"><header class="head"><h1>${esc(sayC(lang, "cmty.page.gone"))}</h1></header>${nav(lang)}</main>`;
  return framePage(
    lang,
    title,
    metaTags(
      title,
      sayC(lang, "cmty.page.desc"),
      "/community/",
      { "@context": "https://schema.org", "@type": "WebPage", name: title },
      false,
    ),
    body,
    `${GYM_STYLE}${STYLE}`,
    "community",
  );
}

/** The post id at the end of a page address ("rest-timer-on-my-watch-AbC123xYz456" or just the id). */
export function postIdOf(slug: string): string | null {
  const m = /(?:^|-)([A-Za-z0-9]{12})$/.exec(slug);
  return m ? m[1]! : null;
}

/** What the website shows: the board and the changelog without anything an under-18 wrote. */
export async function publicBoard() {
  const [b, shipped] = await Promise.all([board(null, { web: true }), changelog({ web: true })]);
  return { posts: b.posts, shipped };
}
export const publicThread = (id: string) => thread(id, null, { web: true });

/** The pages worth indexing, for the sitemap and IndexNow: the three lists, and each post worth it, dated by its last change. */
export function communityEntries(posts: CommunityPost[], shipped: CommunityUpdate[]): { path: string; lastModified: number }[] {
  const latest = Math.max(0, ...posts.map((p) => Math.max(p.createdAt, p.statusAt)), ...shipped.map((u) => u.at));
  if (!posts.length) return [];
  return [
    { path: "/community/", lastModified: latest },
    { path: ROADMAP, lastModified: latest },
    ...(shipped.length ? [{ path: CHANGELOG, lastModified: Math.max(...shipped.map((u) => u.at)) }] : []),
    ...posts.filter(indexable).map((p) => ({ path: postPath(p), lastModified: Math.max(p.createdAt, p.statusAt) })),
  ];
}
