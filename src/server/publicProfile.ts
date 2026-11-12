// Public profiles on the web (Melvin, 2026-11-11: "make public accounts available on the web through a link and it
// should be added to the sitemap … only public users should be in the sitemap"). A lifter who turns on Public
// profile in Friends gets a page at www.getliftsmith.com/u/<handle>/ with their name, counts and recent workout
// summaries, and the page is listed in the people sitemap (/sitemap-people.xml). Private profiles, suspended
// ones and unknown handles all get the same "isn't public" page with noindex, so the page never tells anyone
// whether a private handle exists. Like the share link page, it's plain HTML with no scripts and its own strict
// CSP (SHARE_PAGE_CSP), and everything the lifter typed is escaped. Decision record: docs/decisions/friends.md.
import { threaded } from "@/lib/commentThread";
import { isMsgLang, MSG_LANGS, type MsgLang } from "@/lib/messageText";
import { SHARE_PAGE_CSP } from "@/lib/securityHeaders";
import { SITE_URL } from "@/lib/site";
import { AVATAR_IDS, cleanHandle, HANDLE_RE, SOCIAL_LIMITS, type PostBody, type ShowcaseLift } from "@/lib/socialTypes";

import { query } from "./db";
import { parseLifts } from "./social";

const DAY = 86_400_000;
const AVATAR_SET = new Set<string>(AVATAR_IDS);

/** Workouts shown on the page, newest first. */
export const PAGE_POSTS = 12;
/** Profiles in the people sitemap (Google's limit for one file is 50,000). */
export const SITEMAP_MAX = 45_000;

export const profilePageUrl = (handle: string) => `${SITE_URL}/u/${handle}/`;

/** Comments shown under each workout on the web page; the rest are counted, and read in the app. */
export const PAGE_COMMENTS = 20;

/** A comment as the web page shows it: read-only, and linked to its writer only while their profile is public too. */
export interface PublicComment {
  id: string;
  name: string;
  /** The writer's handle while their own profile is public, else "" (no handle and no link). */
  handle: string;
  at: number;
  body: string;
  replyTo?: string;
}
export interface PublicPost {
  at: number;
  body: PostBody;
  caption: string;
  likes: number;
  cheers: number;
  /** Every visible comment, of which `comments` holds the first PAGE_COMMENTS in thread order. */
  commentCount: number;
  comments: { c: PublicComment; reply: boolean }[];
}
export interface PublicProfile {
  handle: string;
  name: string;
  followers: number;
  following: number;
  posts: number;
  recent: PublicPost[];
  /** An AVATAR_IDS id, or "" for the name's first letter. */
  avatar: string;
  /** The level and training-week streak the app last sent (0 when none yet). */
  level: number;
  streak: number;
  /** The best lifts, only while the lifter shows them and shows weights (the same rule as the app's person page). */
  lifts: ShowcaseLift[];
  /** When each workout posted for everyone in the calendar's weeks started (ms). */
  trained: number[];
}

/** A comment the page shows (`c` the comment, `cp` its writer, ?1 the profile's account). */
const SHOWN_COMMENT = "c.hidden = 0 AND cp.suspended = 0 AND c.account_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?1)";

/** A public, unsuspended profile and its recent workouts, or null for anything else. */
export async function publicProfile(handle: string, now = Date.now()): Promise<PublicProfile | null> {
  const h = cleanHandle(handle);
  if (!HANDLE_RE.test(h)) return null;
  const [p] = await query<{
    account_id: string;
    handle: string;
    name: string;
    avatar: string;
    level: number;
    streak: number;
    show_lifts: number;
    weights: number;
    lifts: string;
  }>(
    `SELECT account_id, handle, name, avatar, level, streak, show_lifts, weights, lifts FROM social_profiles
     WHERE handle = ? AND public = 1 AND suspended = 0`,
    [h],
  );
  if (!p) return null;
  const id = String(p.account_id);
  const [c] = await query(
    `SELECT
      (SELECT COUNT(*) FROM follows WHERE followee_id = ?1 AND accepted = 1) AS followers,
      (SELECT COUNT(*) FROM follows WHERE follower_id = ?1 AND accepted = 1) AS following,
      (SELECT COUNT(*) FROM posts WHERE account_id = ?1 AND hidden = 0 AND audience = 'all') AS posts`,
    [id],
  );
  // Only posts for everyone: "friends" and "only me" posts never reach the web.
  // Counts are the app's (likes, visible comments) plus the cheers sent during that workout: a cheer carries the
  // workout's session id, which is the post's workout_id. Comments by suspended people, or people the lifter blocked,
  // are left out of both the count and the list.
  const rows = await query<{ id: string; at: number; body: string; caption: string; likes: number; cheers: number; comments: number }>(
    `SELECT p.id AS id, p.at AS at, p.body AS body, p.caption AS caption,
       (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS likes,
       (SELECT COUNT(*) FROM cheers ch WHERE ch.to_id = p.account_id AND ch.session_id = p.workout_id) AS cheers,
       (SELECT COUNT(*) FROM post_comments c JOIN social_profiles cp ON cp.account_id = c.account_id
         WHERE c.post_id = p.id AND ${SHOWN_COMMENT}) AS comments
     FROM posts p WHERE p.account_id = ?1 AND p.hidden = 0 AND p.audience = 'all' ORDER BY p.at DESC LIMIT ${PAGE_POSTS}`,
    [id],
  );
  const ids = rows.map((r) => String(r.id));
  const said = ids.length
    ? await query<{
        id: string;
        post_id: string;
        at: number;
        body: string;
        handle: string;
        name: string;
        public: number;
        reply_to: string;
      }>(
        `SELECT c.id AS id, c.post_id AS post_id, c.created_at AS at, c.body AS body, cp.handle AS handle, cp.name AS name,
           cp.public AS public, c.reply_to AS reply_to
         FROM post_comments c JOIN social_profiles cp ON cp.account_id = c.account_id
         WHERE c.post_id IN (${ids.map(() => "?").join(", ")}) AND ${SHOWN_COMMENT.replace(/\?1/g, "?")}
         ORDER BY c.created_at LIMIT 2000`,
        [...ids, id],
      )
    : [];
  const byPost = new Map<string, PublicComment[]>();
  for (const c of said) {
    const list = byPost.get(String(c.post_id)) ?? [];
    list.push({
      id: String(c.id),
      name: String(c.name),
      handle: Number(c.public) ? String(c.handle) : "",
      at: Number(c.at),
      body: String(c.body),
      ...(c.reply_to ? { replyTo: String(c.reply_to) } : {}),
    });
    byPost.set(String(c.post_id), list);
  }
  const days = await query<{ at: number }>(
    `SELECT at FROM posts WHERE account_id = ? AND hidden = 0 AND audience = 'all' AND at >= ? ORDER BY at LIMIT 200`,
    [id, now - (SOCIAL_LIMITS.calendarWeeks * 7 + 7) * DAY],
  );
  let lifts: ShowcaseLift[] = [];
  if (Number(p.show_lifts) && Number(p.weights)) {
    try {
      lifts = parseLifts(JSON.parse(String(p.lifts ?? "") || "[]"));
    } catch {
      lifts = [];
    }
  }
  const recent: PublicPost[] = [];
  for (const r of rows) {
    try {
      recent.push({
        at: Number(r.at),
        body: JSON.parse(String(r.body)) as PostBody,
        caption: String(r.caption ?? ""),
        likes: Number(r.likes ?? 0),
        cheers: Number(r.cheers ?? 0),
        commentCount: Number(r.comments ?? 0),
        comments: threaded(byPost.get(String(r.id)) ?? []).slice(0, PAGE_COMMENTS),
      });
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
    avatar: AVATAR_SET.has(String(p.avatar ?? "")) ? String(p.avatar) : "",
    level: Number(p.level ?? 0),
    streak: Number(p.streak ?? 0),
    lifts,
    trained: days.map((d) => Number(d.at)),
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

// --- The page (drawn in profilePage.ts) ---

export { bestSetText, profileHtml } from "./profilePage";

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
    `SELECT sp.handle AS handle, MAX(p.at) AS last FROM social_profiles sp JOIN posts p ON p.account_id = sp.account_id AND p.hidden = 0 AND p.audience = 'all'
     WHERE sp.public = 1 AND sp.suspended = 0 GROUP BY sp.account_id ORDER BY last DESC LIMIT ${SITEMAP_MAX}`,
  );
  return rows.map((r) => ({ handle: String(r.handle), lastModified: Number(r.last) }));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function sitemapXml(people: { handle: string; lastModified: number }[]): string {
  const urls = people.map(
    (p) =>
      `<url><loc>${esc(profilePageUrl(p.handle))}</loc><lastmod>${new Date(p.lastModified).toISOString().slice(0, 10)}</lastmod><changefreq>weekly</changefreq></url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}
