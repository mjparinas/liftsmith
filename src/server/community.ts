// The Liftsmith community (Melvin, 2026-11-17: "a community for the app itself. like voting for features that are
// missing, adding comments, mentioning bugs"; docs/decisions/community.md). Built in-house, on the same database,
// filters and reports as Friends:
// - Anyone can read the board (the app and the website). Posting, voting, commenting and reporting need an account.
// - An idea or a bug has a title, optional details and, optionally, one screenshot. Only its author and staff ever see
//   the screenshot: a picture of someone's app can show their name, weights or health numbers.
// - One vote per account. Posting, voting and commenting follow the post: its status changes come as a push, and the
//   lifter can turn that off on the post. When an idea ships, everyone following it hears.
// - @handle in a comment names someone by their Friends handle, and tells them only if they're already part of that
//   post (its author, a voter or a commenter who didn't turn updates off), so a mention can't reach a stranger.
// - Teen-safe (school teams have lifters aged 13 to 18): an under-18's name and handle never show, and what they write
//   stays off the public website.
// - Everything people write goes through the Friends filter (no links, no slurs). Three reports from different people
//   hide a post or comment until staff look (kind 'feedback' in `reports`, ids "p:<post>" and "c:<comment>"), and the
//   admin Reports tab handles them with the rest. Staff move posts through their statuses, answer as the Liftsmith team,
//   merge duplicates and block an account from posting on Admin › Community.
import { randomBytes } from "node:crypto";

import {
  COMMUNITY_LIMITS,
  POST_KINDS,
  STAFF_STATUSES,
  type CommunityComment,
  type CommunityPost,
  type CommunityUpdate,
  type PostKind,
  type Status,
} from "@/lib/community";
import { REASONS_FOR, REPORT_NOTE_MAX } from "@/lib/socialTypes";

import { nameOf } from "./coach";
import { shortName } from "./coachReviews";
import { batch, query, rateLimit, run, type Row } from "./db";
import { checkText, tidy } from "./moderation";
import { notifyPlain, type CommunityPushKind } from "./push";
import { isMinor } from "./teams";

const DAY = 86_400_000;
const s = (v: unknown) => (v == null ? "" : String(v));
const n = (v: unknown) => Number(v ?? 0);

const B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
/** A 12-character id, the end of a post's web address. */
export function newPostId(bytes: Buffer = randomBytes(12)): string {
  return [...bytes].map((b) => B62[b % 62]).join("");
}
export const isPostId = (x: unknown): x is string => typeof x === "string" && /^[0-9A-Za-z]{12}$/.test(x);
const isCommentId = (x: unknown): x is string => typeof x === "string" && /^[0-9a-f]{16}$/.test(x);
const isKind = (x: unknown): x is PostKind => (POST_KINDS as readonly unknown[]).includes(x);
export const isStaffStatus = (x: unknown): x is (typeof STAFF_STATUSES)[number] => (STAFF_STATUSES as readonly unknown[]).includes(x);

/** The account staff write from: replies show as the Liftsmith team. */
export const STAFF_ACCOUNT = "liftsmith-team";

export type CommunityFailure = "slow" | "link" | "words" | "short" | "gone" | "blocked" | "image";
type Fail = { error: CommunityFailure };

/** How someone shows on what they write: their Friends name and handle, else their first name and last initial; nothing under 18. */
export async function byline(accountId: string, now = Date.now()): Promise<{ name: string; handle: string; teen: boolean }> {
  if (await isMinor(accountId, now)) return { name: "", handle: "", teen: true };
  const [p] = await query<{ name: string; handle: string }>(
    "SELECT name, handle FROM social_profiles WHERE account_id = ? AND suspended = 0",
    [accountId],
  );
  if (p) return { name: s(p.name).slice(0, 60), handle: s(p.handle), teen: false };
  return { name: shortName(await nameOf(accountId)), handle: "", teen: false };
}

/** Blocked from posting: by staff here, or banned or suspended on Friends. */
export async function blocked(accountId: string): Promise<boolean> {
  const [b] = await query("SELECT 1 AS x FROM community_bans WHERE account_id = ?", [accountId]);
  if (b) return true;
  const [p] = await query<{ suspended: number }>("SELECT suspended FROM social_profiles WHERE account_id = ?", [accountId]);
  return n(p?.suspended) === 1;
}

const POST_COLS = `p.id, p.account_id, p.kind, p.title, p.body, p.name, p.handle, p.status, p.votes, p.comments, p.created_at,
  p.status_at, p.merged_into, p.hidden, p.teen, p.platform, p.app_version`;

function toPost(r: Row, viewer: string | null, shot = false): CommunityPost {
  const mine = !!viewer && s(r.account_id) === viewer;
  return {
    id: s(r.id),
    kind: (isKind(r.kind) ? r.kind : "idea") as PostKind,
    title: s(r.title),
    body: s(r.body),
    status: s(r.status) as Status,
    votes: n(r.votes),
    comments: n(r.comments),
    name: n(r.teen) ? "" : s(r.name),
    handle: n(r.teen) ? "" : s(r.handle),
    createdAt: n(r.created_at),
    statusAt: n(r.status_at) || n(r.created_at),
    ...(s(r.merged_into) ? { mergedInto: s(r.merged_into) } : {}),
    ...(mine ? { mine: true } : {}),
    ...(mine && shot ? { shot: true } : {}),
    ...(mine && n(r.hidden) ? { hidden: true } : {}),
  };
}

function toComment(r: Row, viewer: string | null): CommunityComment {
  const staff = !!n(r.staff);
  return {
    id: s(r.id),
    body: s(r.body),
    name: staff ? "Liftsmith" : n(r.teen) ? "" : s(r.name),
    handle: staff || n(r.teen) ? "" : s(r.handle),
    staff,
    at: n(r.created_at),
    ...(viewer && s(r.account_id) === viewer ? { mine: true } : {}),
  };
}

// --- Reading ---

export interface BoardOptions {
  /** The public website: nothing written by someone under 18. */
  web?: boolean;
  limit?: number;
}

/** The board: the most voted, plus the newest so a fresh post can be found, without hidden or merged ones. */
export async function board(viewer: string | null, opts: BoardOptions = {}) {
  const limit = opts.limit ?? COMMUNITY_LIMITS.board;
  const teen = opts.web ? " AND p.teen = 0" : "";
  const [top, fresh, own] = await Promise.all([
    query(`SELECT ${POST_COLS} FROM community_posts p WHERE p.hidden = 0 AND p.status != 'merged'${teen} ORDER BY p.votes DESC LIMIT ?`, [
      limit,
    ]),
    query(
      `SELECT ${POST_COLS} FROM community_posts p WHERE p.hidden = 0 AND p.status != 'merged'${teen} ORDER BY p.created_at DESC LIMIT 100`,
    ),
    viewer ? query(`SELECT ${POST_COLS} FROM community_posts p WHERE p.account_id = ? AND p.hidden = 1`, [viewer]) : Promise.resolve([]),
  ]);
  const seen = new Set<string>();
  const posts: CommunityPost[] = [];
  for (const r of [...top, ...fresh, ...own]) {
    if (seen.has(s(r.id))) continue;
    seen.add(s(r.id));
    posts.push(toPost(r, viewer));
  }
  if (!viewer) return { posts };
  const [voted, following] = await Promise.all([
    query<{ post_id: string }>("SELECT post_id FROM community_votes WHERE account_id = ?", [viewer]),
    query<{ post_id: string }>("SELECT post_id FROM community_follows WHERE account_id = ? AND on_ = 1", [viewer]),
  ]);
  return { posts, voted: voted.map((r) => s(r.post_id)), following: following.map((r) => s(r.post_id)) };
}

async function postRow(id: string): Promise<Row | undefined> {
  if (!isPostId(id)) return undefined;
  const [r] = await query(`SELECT ${POST_COLS} FROM community_posts p WHERE p.id = ?`, [id]);
  return r;
}

/** One post with its comments, its timeline and, for a signed-in lifter, their vote and whether they follow it. */
export async function thread(id: string, viewer: string | null, opts: { web?: boolean } = {}) {
  const r = await postRow(id);
  // A hidden post shows only to its author (marked), and a teen's post never on the website.
  if (!r || (n(r.hidden) && s(r.account_id) !== viewer) || (opts.web && n(r.teen))) return null;
  const [comments, updates, shot, merged, vote, follow] = await Promise.all([
    query("SELECT * FROM community_comments WHERE post_id = ? ORDER BY created_at LIMIT 500", [id]),
    query("SELECT post_id, status, note, at FROM community_updates WHERE post_id = ? ORDER BY at", [id]),
    viewer && s(r.account_id) === viewer ? query("SELECT 1 AS x FROM community_shots WHERE post_id = ?", [id]) : Promise.resolve([]),
    s(r.merged_into) ? query("SELECT id, title FROM community_posts WHERE id = ?", [s(r.merged_into)]) : Promise.resolve([]),
    viewer ? query("SELECT 1 AS x FROM community_votes WHERE post_id = ? AND account_id = ?", [id, viewer]) : Promise.resolve([]),
    viewer ? query("SELECT on_ FROM community_follows WHERE post_id = ? AND account_id = ?", [id, viewer]) : Promise.resolve([]),
  ]);
  return {
    post: toPost(r, viewer, shot.length > 0),
    comments: comments
      .filter((c) => (!n(c.hidden) || (viewer && s(c.account_id) === viewer)) && !(opts.web && n(c.teen)))
      .map((c) => toComment(c, viewer)),
    updates: updates.map((u): CommunityUpdate => ({ postId: s(u.post_id), status: s(u.status) as Status, note: s(u.note), at: n(u.at) })),
    merged: merged[0] ? { id: s(merged[0].id), title: s(merged[0].title) } : null,
    ...(viewer ? { voted: vote.length > 0, following: n(follow[0]?.on_) === 1 } : {}),
  };
}

/** What shipped, newest first, with each post's title: the changelog. */
export async function changelog(opts: { web?: boolean; limit?: number } = {}): Promise<CommunityUpdate[]> {
  const rows = await query(
    `SELECT u.post_id, u.status, u.note, u.at, p.title, p.kind FROM community_updates u JOIN community_posts p ON p.id = u.post_id
     WHERE u.status = 'shipped' AND p.hidden = 0${opts.web ? " AND p.teen = 0" : ""} ORDER BY u.at DESC LIMIT ?`,
    [opts.limit ?? 100],
  );
  return rows.map((u) => ({
    postId: s(u.post_id),
    status: "shipped",
    note: s(u.note),
    at: n(u.at),
    title: s(u.title),
    kind: (isKind(u.kind) ? u.kind : "idea") as PostKind,
  }));
}

// --- Writing ---

/** A JPEG data URL, checked: the bytes start like a JPEG and fit the limit. */
export function readShot(v: unknown): Buffer | "bad" | null {
  if (v == null || v === "") return null;
  const m = typeof v === "string" ? /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(v) : null;
  if (!m?.[1]) return "bad";
  const image = Buffer.from(m[1], "base64");
  if (image.length < 4 || image[0] !== 0xff || image[1] !== 0xd8 || image[2] !== 0xff) return "bad";
  if (image.length > COMMUNITY_LIMITS.shot) return "bad";
  return image;
}

export async function createPost(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<{ post: CommunityPost } | Fail> {
  if (!isKind(b.kind)) return { error: "short" };
  const title = checkText(b.title, COMMUNITY_LIMITS.title);
  if (!title.ok) return { error: title.error === "empty" ? "short" : title.error };
  if ([...title.text].length < COMMUNITY_LIMITS.titleMin) return { error: "short" };
  let body = "";
  if (tidyLong(b.body, COMMUNITY_LIMITS.body)) {
    const v = checkText(tidyLong(b.body, COMMUNITY_LIMITS.body), COMMUNITY_LIMITS.body);
    if (!v.ok) return { error: v.error === "empty" ? "short" : v.error };
    body = tidyLong(b.body, COMMUNITY_LIMITS.body);
  }
  const shot = readShot(b.shot);
  if (shot === "bad") return { error: "image" };
  if (await blocked(accountId)) return { error: "blocked" };
  if (!(await rateLimit(`community:post:${accountId}`, COMMUNITY_LIMITS.postsPerDay, DAY, now))) return { error: "slow" };
  const who = await byline(accountId, now);
  const id = newPostId();
  const platform = ["android", "ios", "web"].includes(s(b.platform)) ? s(b.platform) : "";
  await batch([
    {
      sql: `INSERT INTO community_posts (id, account_id, kind, title, body, name, handle, status, votes, comments, created_at, updated_at,
              status_at, teen, platform, app_version) VALUES (?, ?, ?, ?, ?, ?, ?, 'review', 1, 0, ?, ?, ?, ?, ?, ?)`,
      args: [id, accountId, b.kind, title.text, body, who.name, who.handle, now, now, now, who.teen ? 1 : 0, platform, tidy(b.version, 40)],
    },
    { sql: "INSERT INTO community_votes (post_id, account_id, at) VALUES (?, ?, ?)", args: [id, accountId, now] },
    { sql: "INSERT INTO community_follows (post_id, account_id, on_) VALUES (?, ?, 1)", args: [id, accountId] },
    ...(shot ? [{ sql: "INSERT INTO community_shots (post_id, image, created_at) VALUES (?, ?, ?)", args: [id, shot, now] }] : []),
  ]);
  const r = await postRow(id);
  return { post: toPost(r!, accountId, !!shot) };
}

/** Like `tidy`, but keeps line breaks (details and comments can have paragraphs). */
function tidyLong(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f​-‏‪-‮⁦-⁩]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

/** A post others can act on: there, not hidden, not merged away. */
async function livePost(id: unknown): Promise<Row | null> {
  if (!isPostId(id)) return null;
  const r = await postRow(id);
  return r && !n(r.hidden) && s(r.status) !== "merged" ? r : null;
}

export async function vote(accountId: string, id: unknown, on: boolean, now = Date.now()): Promise<{ votes: number } | Fail> {
  const r = await livePost(id);
  if (!r) return { error: "gone" };
  if (!(await rateLimit(`community:vote:${accountId}`, COMMUNITY_LIMITS.votesPerDay, DAY, now))) return { error: "slow" };
  const pid = s(r.id);
  if (on) {
    const added = await run("INSERT OR IGNORE INTO community_votes (post_id, account_id, at) VALUES (?, ?, ?)", [pid, accountId, now]);
    if (added) {
      await batch([
        { sql: "UPDATE community_posts SET votes = votes + 1 WHERE id = ?", args: [pid] },
        // A vote follows the post, unless the lifter turned its updates off before.
        { sql: "INSERT OR IGNORE INTO community_follows (post_id, account_id, on_) VALUES (?, ?, 1)", args: [pid, accountId] },
      ]);
    }
  } else if (await run("DELETE FROM community_votes WHERE post_id = ? AND account_id = ?", [pid, accountId])) {
    await run("UPDATE community_posts SET votes = MAX(0, votes - 1) WHERE id = ?", [pid]);
  }
  const [c] = await query("SELECT votes FROM community_posts WHERE id = ?", [pid]);
  return { votes: n(c?.votes) };
}

/** Updates on a post (status changes, replies to it) on or off. */
export async function setFollow(accountId: string, id: unknown, on: boolean): Promise<boolean> {
  if (!isPostId(id) || !(await postRow(id))) return false;
  await run(
    "INSERT INTO community_follows (post_id, account_id, on_) VALUES (?, ?, ?) ON CONFLICT (post_id, account_id) DO UPDATE SET on_ = excluded.on_",
    [id, accountId, on ? 1 : 0],
  );
  return true;
}

/** The accounts a mention may reach: in this post's conversation (its author or following it), by Friends handle. */
async function mentioned(postId: string, author: string, text: string, from: string): Promise<string[]> {
  const handles = [...new Set([...text.matchAll(/(?:^|[^\w@])@([a-z0-9_]{3,20})\b/gi)].map((m) => m[1]!.toLowerCase()))].slice(0, 5);
  const out: string[] = [];
  for (const h of handles) {
    const [p] = await query<{ account_id: string }>("SELECT account_id FROM social_profiles WHERE handle = ? AND suspended = 0", [h]);
    const id = s(p?.account_id);
    if (!id || id === from) continue;
    if (id === author) {
      out.push(id);
      continue;
    }
    const [f] = await query("SELECT 1 AS x FROM community_follows WHERE post_id = ? AND account_id = ? AND on_ = 1", [postId, id]);
    if (f) out.push(id);
  }
  return out;
}

export async function comment(
  accountId: string,
  id: unknown,
  text: unknown,
  now = Date.now(),
  staff = false,
): Promise<{ comment: CommunityComment } | Fail> {
  const r = await livePost(id);
  if (!r) return { error: "gone" };
  const body = tidyLong(text, COMMUNITY_LIMITS.comment);
  const v = checkText(body, COMMUNITY_LIMITS.comment);
  if (!v.ok) return { error: v.error === "empty" ? "short" : v.error };
  if (!staff) {
    if (await blocked(accountId)) return { error: "blocked" };
    if (!(await rateLimit(`community:comment:${accountId}`, COMMUNITY_LIMITS.commentsPerDay, DAY, now))) return { error: "slow" };
  }
  const who = staff ? { name: "Liftsmith", handle: "", teen: false } : await byline(accountId, now);
  const cid = randomBytes(8).toString("hex");
  const pid = s(r.id);
  await batch([
    {
      sql: `INSERT INTO community_comments (id, post_id, account_id, body, name, handle, staff, teen, hidden, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      args: [cid, pid, accountId, body, who.name, who.handle, staff ? 1 : 0, who.teen ? 1 : 0, now],
    },
    { sql: "UPDATE community_posts SET comments = comments + 1, updated_at = ? WHERE id = ?", args: [now, pid] },
    ...(staff
      ? []
      : [{ sql: "INSERT OR IGNORE INTO community_follows (post_id, account_id, on_) VALUES (?, ?, 1)", args: [pid, accountId] }]),
  ]);
  // The author hears about a reply (if they follow their post), and anyone mentioned who's part of it hears they were named.
  const author = s(r.account_id);
  const tell = new Set<string>();
  const name = who.name || "";
  const [af] = await query("SELECT on_ FROM community_follows WHERE post_id = ? AND account_id = ?", [pid, author]);
  if (author !== accountId && n(af?.on_) === 1) {
    tell.add(author);
    await notifyPlain(author, staff ? "communityTeam" : "communityComment", { name, text: s(r.title) }, `#/community/${pid}`);
  }
  for (const to of await mentioned(pid, author, body, accountId))
    if (!tell.has(to)) await notifyPlain(to, "communityMention", { name, text: s(r.title) }, `#/community/${pid}`);
  const [row] = await query("SELECT * FROM community_comments WHERE id = ?", [cid]);
  return { comment: toComment(row!, accountId) };
}

/** A lifter deletes their own comment. */
export async function deleteComment(accountId: string, id: unknown): Promise<boolean> {
  if (!isCommentId(id)) return false;
  const [c] = await query<{ post_id: string }>("SELECT post_id FROM community_comments WHERE id = ? AND account_id = ?", [id, accountId]);
  if (!c) return false;
  await batch([
    { sql: "DELETE FROM community_comments WHERE id = ?", args: [id] },
    { sql: "UPDATE community_posts SET comments = MAX(0, comments - 1) WHERE id = ?", args: [s(c.post_id)] },
    { sql: "DELETE FROM reports WHERE kind = 'feedback' AND target_id = ?", args: [`c:${id}`] },
  ]);
  return true;
}

/** Everything about one post goes: its votes, comments, followers, screenshot, timeline and reports. */
const postDeletes = (id: string) => [
  { sql: "DELETE FROM community_votes WHERE post_id = ?", args: [id] },
  {
    sql: "DELETE FROM reports WHERE kind = 'feedback' AND (target_id = ? OR target_id IN (SELECT 'c:' || id FROM community_comments WHERE post_id = ?))",
    args: [`p:${id}`, id],
  },
  { sql: "DELETE FROM community_comments WHERE post_id = ?", args: [id] },
  { sql: "DELETE FROM community_follows WHERE post_id = ?", args: [id] },
  { sql: "DELETE FROM community_shots WHERE post_id = ?", args: [id] },
  { sql: "DELETE FROM community_updates WHERE post_id = ?", args: [id] },
  { sql: "DELETE FROM community_posts WHERE id = ?", args: [id] },
];

/** A lifter takes their own post down while it's still under review; after that it belongs to everyone who voted. */
export async function deletePost(accountId: string, id: unknown): Promise<boolean> {
  if (!isPostId(id)) return false;
  const [p] = await query("SELECT status FROM community_posts WHERE id = ? AND account_id = ?", [id, accountId]);
  if (!p || s(p.status) !== "review") return false;
  await batch(postDeletes(id));
  return true;
}

/** A report on a post or comment. Three people hide it until staff look. */
export async function report(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<{ ok: true } | Fail> {
  const reason = REASONS_FOR.feedback.find((r) => r === b.reason);
  if (!reason) return { error: "short" };
  let target = "";
  let author = "";
  if (isPostId(b.post)) {
    const [p] = await query("SELECT account_id FROM community_posts WHERE id = ?", [b.post]);
    if (p) [target, author] = [`p:${b.post}`, s(p.account_id)];
  } else if (isCommentId(b.comment)) {
    const [c] = await query("SELECT account_id FROM community_comments WHERE id = ?", [b.comment]);
    if (c) [target, author] = [`c:${b.comment}`, s(c.account_id)];
  }
  if (!target) return { error: "gone" };
  if (author === accountId) return { error: "gone" };
  if (!(await rateLimit(`community:report:${accountId}`, 30, DAY, now))) return { error: "slow" };
  await run(
    "INSERT OR IGNORE INTO reports (reporter_id, kind, target_id, reason, note, created_at, status) VALUES (?, 'feedback', ?, ?, ?, ?, 'open')",
    [accountId, target, reason, tidy(b.note, REPORT_NOTE_MAX), now],
  );
  const [c] = await query(
    "SELECT COUNT(DISTINCT reporter_id) AS n FROM reports WHERE kind = 'feedback' AND target_id = ? AND status = 'open'",
    [target],
  );
  if (n(c?.n) >= COMMUNITY_LIMITS.hideAfter) {
    const [table, id] = target.startsWith("p:") ? ["community_posts", target.slice(2)] : ["community_comments", target.slice(2)];
    await run(`UPDATE ${table} SET hidden = 1 WHERE id = ? AND hidden = 0`, [id]);
  }
  return { ok: true };
}

/** The screenshot's bytes, for its author or staff. */
export async function shotFor(postId: unknown, viewer: string | "staff"): Promise<Buffer | null> {
  if (!isPostId(postId)) return null;
  if (viewer !== "staff") {
    const [p] = await query("SELECT 1 AS x FROM community_posts WHERE id = ? AND account_id = ?", [postId, viewer]);
    if (!p) return null;
  }
  const [r] = await query<{ image: ArrayBuffer | Uint8Array }>("SELECT image FROM community_shots WHERE post_id = ?", [postId]);
  if (!r?.image) return null;
  return Buffer.from(r.image instanceof Uint8Array ? r.image : new Uint8Array(r.image));
}

/** The ops the app sends to POST /api/community/. */
export async function handle(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<{ status: number; body: unknown }> {
  const ok = (body: unknown) => ({ status: 200, body });
  const failed = (r: Fail) => ({ status: r.error === "slow" ? 429 : r.error === "gone" ? 404 : 400, body: r });
  const done = <T extends object>(r: T | Fail) => ("error" in r ? failed(r as Fail) : ok(r));
  switch (b.op) {
    case "create":
      return done(await createPost(accountId, b, now));
    case "vote":
    case "unvote":
      return done(await vote(accountId, b.id, b.op === "vote", now));
    case "follow":
      return (await setFollow(accountId, b.id, b.on === true)) ? ok({ ok: true }) : failed({ error: "gone" });
    case "comment":
      return done(await comment(accountId, b.id, b.body, now));
    case "uncomment":
      return (await deleteComment(accountId, b.id)) ? ok({ ok: true }) : failed({ error: "gone" });
    case "delete":
      return (await deletePost(accountId, b.id)) ? ok({ ok: true }) : failed({ error: "gone" });
    case "report":
      return done(await report(accountId, b, now));
    default:
      return { status: 400, body: { error: "Bad request." } };
  }
}

// --- Staff: Admin › Community ---

/** The push for each status a post moves to (a bug that ships is "fixed"). */
export function statusPush(status: Status, kind: PostKind): CommunityPushKind | null {
  if (status === "shipped") return kind === "bug" ? "communityFixed" : "communityShipped";
  if (status === "planned") return "communityPlanned";
  if (status === "progress") return "communityProgress";
  if (status === "wont") return "communityWont";
  return null;
}

/** Tells everyone following a post, twenty at a time. */
export async function notifyFollowers(postId: string, kind: CommunityPushKind, title: string, except = ""): Promise<number> {
  const rows = await query<{ account_id: string }>("SELECT account_id FROM community_follows WHERE post_id = ? AND on_ = 1", [postId]);
  const to = rows.map((r) => s(r.account_id)).filter((a) => a !== except);
  for (let i = 0; i < to.length; i += 20)
    await Promise.all(to.slice(i, i + 20).map((a) => notifyPlain(a, kind, { name: "Liftsmith", text: title }, `#/community/${postId}`)));
  return to.length;
}

export interface AdminPost extends CommunityPost {
  accountId: string;
  hiddenBy: "" | "reports" | "staff";
  teen: boolean;
  platform: string;
  version: string;
  hasShot: boolean;
  reports: number;
}

/** Every post, newest first, hidden and merged ones included. */
export async function adminPosts(limit = 1000): Promise<AdminPost[]> {
  const rows = await query(
    `SELECT ${POST_COLS}, EXISTS(SELECT 1 FROM community_shots s WHERE s.post_id = p.id) AS shot,
       (SELECT COUNT(*) FROM reports r WHERE r.kind = 'feedback' AND r.target_id = 'p:' || p.id AND r.status = 'open') AS reports
     FROM community_posts p ORDER BY p.created_at DESC LIMIT ?`,
    [limit],
  );
  return rows.map((r) => ({
    ...toPost(r, null),
    name: s(r.name),
    handle: s(r.handle),
    accountId: s(r.account_id),
    hiddenBy: n(r.hidden) === 2 ? "staff" : n(r.hidden) ? "reports" : "",
    teen: !!n(r.teen),
    platform: s(r.platform),
    version: s(r.app_version),
    hasShot: !!n(r.shot),
    reports: n(r.reports),
  }));
}

/** One post for staff: every comment, hidden ones too, with who wrote it. */
export async function adminThread(id: string) {
  const r = await postRow(id);
  if (!r) return null;
  const [comments, updates] = await Promise.all([
    query("SELECT * FROM community_comments WHERE post_id = ? ORDER BY created_at", [id]),
    query("SELECT post_id, status, note, at FROM community_updates WHERE post_id = ? ORDER BY at", [id]),
  ]);
  return {
    comments: comments.map((c) => ({
      ...toComment(c, null),
      name: s(c.name),
      handle: s(c.handle),
      accountId: s(c.account_id),
      hidden: !!n(c.hidden),
      teen: !!n(c.teen),
    })),
    updates: updates.map((u) => ({ postId: s(u.post_id), status: s(u.status) as Status, note: s(u.note), at: n(u.at) })),
  };
}

/**
 * Staff move a post to a status, with an optional note that shows on its timeline (and, for "shipped", the changelog).
 * Returns who to tell, so the route can send the pushes after answering.
 */
export async function setStatus(
  id: unknown,
  status: unknown,
  note: unknown,
  now = Date.now(),
): Promise<{ post: { id: string; title: string; kind: PostKind }; push: CommunityPushKind | null } | null> {
  if (!isPostId(id) || !isStaffStatus(status)) return null;
  const r = await postRow(id);
  if (!r || s(r.status) === "merged") return null;
  const changed = s(r.status) !== status;
  const text = tidyLong(note, 600);
  if (!changed && !text) return null;
  await batch([
    {
      sql: "UPDATE community_posts SET status = ?, status_at = ?, updated_at = ? WHERE id = ?",
      args: [status, changed ? now : n(r.status_at), now, id],
    },
    { sql: "INSERT INTO community_updates (post_id, status, note, at) VALUES (?, ?, ?, ?)", args: [id, status, text, now] },
  ]);
  const kind = (isKind(r.kind) ? r.kind : "idea") as PostKind;
  return { post: { id, title: s(r.title), kind }, push: changed ? statusPush(status, kind) : null };
}

/**
 * A duplicate goes into the post it repeats: its voters' votes and followers move over (each counted once), it's marked
 * merged with a link to the other, and its comments stay where they were written.
 */
export async function merge(from: unknown, into: unknown, now = Date.now()): Promise<boolean> {
  if (!isPostId(from) || !isPostId(into) || from === into) return false;
  const [a, b] = await Promise.all([postRow(from), postRow(into)]);
  if (!a || !b || s(a.status) === "merged" || s(b.status) === "merged") return false;
  await batch([
    {
      sql: "INSERT OR IGNORE INTO community_votes (post_id, account_id, at) SELECT ?, account_id, at FROM community_votes WHERE post_id = ?",
      args: [into, from],
    },
    {
      sql: "INSERT OR IGNORE INTO community_follows (post_id, account_id, on_) SELECT ?, account_id, on_ FROM community_follows WHERE post_id = ?",
      args: [into, from],
    },
    {
      sql: "UPDATE community_posts SET votes = (SELECT COUNT(*) FROM community_votes WHERE post_id = ?), updated_at = ? WHERE id = ?",
      args: [into, now, into],
    },
    {
      sql: "UPDATE community_posts SET status = 'merged', merged_into = ?, status_at = ?, updated_at = ? WHERE id = ?",
      args: [into, now, now, from],
    },
    { sql: "INSERT INTO community_updates (post_id, status, note, at) VALUES (?, 'merged', ?, ?)", args: [from, s(b.title), now] },
    // Posts already merged into the duplicate point at the one it went into.
    { sql: "UPDATE community_posts SET merged_into = ? WHERE merged_into = ?", args: [into, from] },
  ]);
  return true;
}

/** Staff hide a post or comment (2), or show it again (0), which also closes its open reports. */
export async function setHidden(target: { post?: unknown; comment?: unknown }, hidden: boolean): Promise<boolean> {
  const [table, id, rid] = isPostId(target.post)
    ? ["community_posts", target.post, `p:${target.post}`]
    : isCommentId(target.comment)
      ? ["community_comments", target.comment, `c:${target.comment}`]
      : [null, "", ""];
  if (!table) return false;
  const changed = await run(`UPDATE ${table} SET hidden = ? WHERE id = ?`, [hidden ? 2 : 0, id]);
  if (!hidden) await run("UPDATE reports SET status = 'dismissed' WHERE kind = 'feedback' AND target_id = ? AND status = 'open'", [rid]);
  return changed > 0;
}

/** Staff delete a post (everything about it) or a comment. */
export async function removeTarget(target: { post?: unknown; comment?: unknown }): Promise<boolean> {
  if (isPostId(target.post)) {
    if (!(await postRow(target.post))) return false;
    await batch(postDeletes(target.post));
    return true;
  }
  if (isCommentId(target.comment)) {
    const [c] = await query<{ post_id: string }>("SELECT post_id FROM community_comments WHERE id = ?", [target.comment]);
    if (!c) return false;
    await batch([
      { sql: "DELETE FROM community_comments WHERE id = ?", args: [target.comment] },
      { sql: "UPDATE community_posts SET comments = MAX(0, comments - 1) WHERE id = ?", args: [s(c.post_id)] },
      {
        sql: "UPDATE reports SET status = 'removed' WHERE kind = 'feedback' AND target_id = ? AND status = 'open'",
        args: [`c:${target.comment}`],
      },
    ]);
    return true;
  }
  return false;
}

/** Staff stop an account posting, voting and commenting here (or let it again). */
export async function setBlocked(accountId: unknown, on: boolean, now = Date.now()): Promise<boolean> {
  if (typeof accountId !== "string" || !/^[\w:-]{1,80}$/.test(accountId)) return false;
  if (on) await run("INSERT OR IGNORE INTO community_bans (account_id, at) VALUES (?, ?)", [accountId, now]);
  else await run("DELETE FROM community_bans WHERE account_id = ?", [accountId]);
  return true;
}

// --- The admin Reports tab (social.ts adminReports and resolveReports) ---

const splitTarget = (target: string) =>
  target.startsWith("p:") ? { post: target.slice(2) } : target.startsWith("c:") ? { comment: target.slice(2) } : {};

/** What a report on the community points at, for the Reports tab. */
export async function feedbackReport(
  target: string,
): Promise<{ authorId: string; content: string; hidden: boolean; banned: boolean } | null> {
  const t = splitTarget(target);
  const [r] = t.post
    ? await query("SELECT account_id, title AS content, hidden FROM community_posts WHERE id = ?", [t.post])
    : t.comment
      ? await query("SELECT account_id, body AS content, hidden FROM community_comments WHERE id = ?", [t.comment])
      : [];
  if (!r) return null;
  const [ban] = await query("SELECT 1 AS x FROM community_bans WHERE account_id = ?", [s(r.account_id)]);
  return { authorId: s(r.account_id), content: s(r.content), hidden: !!n(r.hidden), banned: !!ban };
}

/** Remove, dismiss, or block the author from the community ("Ban author"), from the Reports tab. */
export async function resolveFeedback(target: string, action: "remove" | "dismiss" | "suspend" | "unsuspend"): Promise<boolean> {
  const t = splitTarget(target);
  const close = (status: string) =>
    run("UPDATE reports SET status = ? WHERE kind = 'feedback' AND target_id = ? AND status = 'open'", [status, target]);
  if (action === "remove") {
    if (!(await removeTarget(t))) return false;
    await close("removed");
    return true;
  }
  if (action === "dismiss") {
    if (!(await setHidden(t, false))) return false;
    await close("dismissed");
    return true;
  }
  const about = await feedbackReport(target);
  if (!about) return false;
  await setBlocked(about.authorId, action === "suspend");
  if (action === "suspend") await close("suspended");
  return true;
}

/** Deleting an account: everything it wrote here, and its votes taken off the counts. */
export const communityCleanup = (accountId: string) => [
  {
    sql: "UPDATE community_posts SET votes = MAX(0, votes - 1) WHERE id IN (SELECT post_id FROM community_votes WHERE account_id = ?)",
    args: [accountId],
  },
  { sql: "DELETE FROM community_votes WHERE account_id = ?", args: [accountId] },
  {
    sql: "UPDATE community_posts SET comments = MAX(0, comments - (SELECT COUNT(*) FROM community_comments c WHERE c.post_id = community_posts.id AND c.account_id = ?)) WHERE id IN (SELECT post_id FROM community_comments WHERE account_id = ?)",
    args: [accountId, accountId],
  },
  { sql: "DELETE FROM community_comments WHERE account_id = ?", args: [accountId] },
  { sql: "DELETE FROM community_follows WHERE account_id = ?", args: [accountId] },
  // Their screenshots always go. A post still under review goes with them; one staff already planned, built or answered
  // belongs to everyone who voted and stays on the roadmap, with no name on it.
  { sql: "DELETE FROM community_shots WHERE post_id IN (SELECT id FROM community_posts WHERE account_id = ?)", args: [accountId] },
  ...(["community_votes", "community_comments", "community_follows", "community_updates"] as const).map((t) => ({
    sql: `DELETE FROM ${t} WHERE post_id IN (SELECT id FROM community_posts WHERE account_id = ? AND status = 'review')`,
    args: [accountId],
  })),
  { sql: "DELETE FROM community_posts WHERE account_id = ? AND status = 'review'", args: [accountId] },
  { sql: "UPDATE community_posts SET account_id = '', name = '', handle = '' WHERE account_id = ?", args: [accountId] },
  { sql: "DELETE FROM community_bans WHERE account_id = ?", args: [accountId] },
];
