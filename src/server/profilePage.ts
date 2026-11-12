// A public profile's web page (www.getliftsmith.com/u/<handle>/), drawn as plain HTML with no scripts (Melvin,
// 2026-11-12: "we really should have a desktop version that has the same or similar headers as the home page, with
// the header and footer and more emphasis at trying liftsmith for users not already logged in").
//
// The page wears the website's own header and footer (siteFrame.ts, shared with share links). On wide screens the profile sits in a column on the left (picture, counts, level and streak, best
// lifts, the 12-week training calendar) beside the workouts; on phones it stacks. Calls to try Liftsmith: a line
// under the header, a card in the profile column, the site's big banner at the end, and a bar along the bottom on
// phones. The page can't tell a signed-in reader without a script, so everyone sees them, beside "Follow in the app".
// Links to our own pages carry no UTM tags (each tag is a new address for crawlers); only store links do.
// Data: publicProfile.ts. Decision record: docs/decisions/friends.md ("Public profiles").
import type { IconName } from "@/components/app/icons";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import type { MsgLang } from "@/lib/messageText";
import { APP_PATH, SITE_URL } from "@/lib/site";
import { localPath } from "@/lib/siteLang";
import { SOCIAL_LIMITS, type AvatarId, type PostBody, type ShowcaseLift } from "@/lib/socialTypes";
import { siteText } from "@/locales/site";

import type { PublicPost, PublicProfile } from "./publicProfile";
import { esc, framePage, icon, say } from "./siteFrame";

const DAY = 86_400_000;
/** Exercises shown per workout before "+N more". */
const EXERCISES_SHOWN = 8;

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

/** Likes, cheers and comments on a workout, then its comments: read-only (no forms, no scripts). Liking, cheering and
 * commenting happen in the app; the one link goes to the lifter's profile there when there are more comments than shown. */
function reactionsHtml(p: PublicPost, lang: MsgLang, appLink: string): string {
  const n = new Intl.NumberFormat(lang);
  const counts: [IconName, string, number, string][] = [
    ["heart", say(lang, "pub.likes"), p.likes, "bad"],
    ["flame", say(lang, "pub.cheers"), p.cheers, "ember"],
    ["chat", say(lang, "pub.comments"), p.commentCount, "cyan"],
  ];
  const row = `<ul class="reacts">${counts
    .map(
      ([i, label, v, tint]) =>
        `<li class="${v ? "" : "zero"}" title="${esc(label)}">${icon(i, 18, tint)}<span class="n">${n.format(v)}</span><span class="sr"> ${esc(label)}</span></li>`,
    )
    .join("")}</ul>`;
  if (!p.comments.length) return row;
  const when = new Intl.DateTimeFormat(lang, { month: "short", day: "numeric", timeZone: "UTC" });
  const list = p.comments
    .map(({ c, reply }) => {
      const who = c.handle ? `<a href="/u/${esc(c.handle)}/">${esc(c.name)}</a>` : esc(c.name);
      return `<li${reply ? ' class="reply"' : ""}><p class="c-head"><strong>${who}</strong> <time datetime="${new Date(c.at).toISOString().slice(0, 10)}">${esc(when.format(c.at))}</time></p><p class="c-body">${esc(c.body)}</p></li>`;
    })
    .join("");
  const more =
    p.commentCount > p.comments.length
      ? `<p class="more"><a class="quiet" href="${esc(appLink)}">${esc(say(lang, "pub.allComments", { count: n.format(p.commentCount) }))} ›</a></p>`
      : "";
  return `${row}<ul class="comments" aria-label="${esc(say(lang, "pub.comments"))}">${list}</ul>${more}`;
}

function postHtml(p: PublicPost, lang: MsgLang, unit: "kg" | "lb", appLink: string): string {
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
${rest > 0 ? `<p class="more">${esc(say(lang, "pub.more", { count: rest }))}</p>` : ""}${reactionsHtml(p, lang, appLink)}</article></li>`;
}

export function profileHtml(p: PublicProfile | null, lang: MsgLang, unit: "kg" | "lb" = "kg", now = Date.now()): string {
  const t = siteText(lang).chrome;
  if (!p) {
    return framePage(
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
  const feed = p.recent.length
    ? `<ul class="feed">${p.recent.map((x) => postHtml(x, lang, unit, follow)).join("")}</ul>`
    : `<div class="card center empty">${icon("dumbbell", 28, "gone-icon")}<p class="muted">${esc(say(lang, "pub.none"))}</p></div>`;
  return framePage(
    lang,
    title,
    meta,
    `<div class="strip"><div class="wrap row strip-row"><p>${esc(say(lang, "pub.strip", { name: p.name }))}</p><a class="quiet strip-link" href="${esc(localPath(lang, "/"))}#features">${esc(say(lang, "pub.ctaFeatures"))} ›</a></div></div>
<main id="main" class="wrap layout"><aside class="side">${profileCard}${liftsHtml(p.lifts, lang, unit)}${calendarHtml(p, lang, now)}</aside>
<section class="main-col" aria-labelledby="recent-h"><h2 id="recent-h" class="section-h">${icon("progress", 16)}${esc(say(lang, "pub.recent"))}</h2>${feed}</section></main>`,
    PROFILE_STYLE,
  );
}

const PROFILE_STYLE = `
/* Layout */
.layout{display:grid;gap:16px;padding-top:24px;padding-bottom:48px}
.side{display:grid;gap:16px;align-content:start}
.main-col{min-width:0}
@media (min-width:960px){.layout{grid-template-columns:360px minmax(0,1fr);gap:28px;padding-top:36px}
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
.feed{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.post time{color:var(--muted);font-size:.875rem;font-weight:600}
.caption{margin-top:6px;white-space:pre-wrap;overflow-wrap:anywhere}
.stats{display:flex;flex-wrap:wrap;gap:8px 24px;margin:12px 0 0}.stats dd{font-size:1.0625rem}
.exs{list-style:none;padding:0;margin:14px 0 0}.exs li{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid var(--line)}
.ex-name a{text-decoration:none}.ex-name a:hover{text-decoration:underline}.ex-best{color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.tag{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:999px;font-size:.6875rem;font-weight:700;color:var(--gold);background:rgb(242 193 78/.12);vertical-align:1px}
.more{color:var(--muted);font-size:.875rem;padding-top:8px}
.reacts{display:flex;flex-wrap:wrap;gap:6px 22px;list-style:none;margin:14px 0 0;padding:12px 0 0;border-top:1px solid var(--line)}
.reacts li{display:inline-flex;align-items:center;gap:6px;font-size:.875rem;color:var(--muted)}.reacts .n{font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums}
.reacts li.zero svg{opacity:.5}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.bad{color:var(--bad)}.cyan{color:var(--cyan)}
.comments{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:10px}
.comments li{background:var(--raised);border-radius:14px;padding:10px 14px}.comments li.reply{margin-left:28px}
.c-head{font-size:.875rem}.c-head a{text-decoration:none}.c-head a:hover{text-decoration:underline}.c-head time{color:var(--muted);font-size:.8125rem;margin-left:4px}
.c-body{margin-top:2px;white-space:pre-wrap;overflow-wrap:anywhere}`;
