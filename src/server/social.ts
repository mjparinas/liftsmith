// Friends and the workout feed (Melvin, 2026-11-11; decision record docs/decisions/friends.md). A signed-in
// lifter can join with a handle, follow people, post finished workouts to their followers, and like and comment.
// Privacy by default: follow requests need approval unless the lifter opens their profile, nothing is posted
// unless they tap Post (or turn on posting every workout), and posts carry the workout summary only.
// Safety: blocking removes follows both ways and hides each from the other everywhere; posts, comments and
// profiles can be reported; three reports hide a post or comment until staff review it (adminReports below);
// staff can suspend a profile, which hides everything it wrote. Deleting the account deletes all of it.
import { randomBytes } from "node:crypto";

import {
  AUDIENCES,
  AVATAR_IDS,
  BOARD_METRICS,
  CHALLENGE_DAYS,
  cleanHandle,
  HANDLE_RE,
  REPORT_REASONS,
  SOCIAL_LIMITS,
  type ActivityItem,
  type Audience,
  type BoardMetric,
  type Challenge,
  type ClubDetail,
  type ClubPreview,
  type ClubSummary,
  type FeedComment,
  type FeedPost,
  type Partner,
  type PersonCard,
  type PersonRow,
  type PostBody,
  type PostExercise,
  type PostSet,
  type Relation,
  type ReportKind,
  type ShowcaseLift,
  type SocialProfile,
  type Suggestion,
  type SuggestReason,
} from "@/lib/socialTypes";

import { cleanCode, newCode } from "./coach";
import { batch, query, rateLimit, run, type Row } from "./db";
import { checkText, hasBlockedWord, tidy } from "./moderation";
import { dropToken, notify, saveToken } from "./push";

export type Result = { code: number; body: Record<string, unknown> };
const ok = (body: Record<string, unknown> = { ok: true }): Result => ({ code: 200, body });
const fail = (code: number, error: string): Result => ({ code, body: { error } });

/** Reports from this many different people hide a post or comment until it's reviewed. */
export const HIDE_AFTER = 3;
export const PAGE = 20;
/** Per account per day, so one account can't flood others. */
export const DAILY = {
  follow: 100,
  post: 20,
  comment: 100,
  like: 500,
  report: 30,
  lookup: 300,
  send: 50,
  invite: 30,
  challenge: 10,
  club: 5,
};
/** An invite link lasts 30 days and works for this many people. */
export const INVITE = { ttl: 30 * 86_400_000, uses: 50 };
/** Handles nobody can take: they'd look official. */
const RESERVED = new Set([
  "admin",
  "administrator",
  "liftsmith",
  "support",
  "help",
  "staff",
  "official",
  "moderator",
  "mod",
  "team",
  "root",
  "system",
  "coach",
  "me",
  "you",
  "null",
  "undefined",
]);

const newId = () => randomBytes(9).toString("base64url");
const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => (v == null ? "" : String(v));
const day = 86_400_000;

async function limit(me: string, what: keyof typeof DAILY, now: number) {
  return rateLimit(`social:${what}:${me}`, DAILY[what], day, now);
}

// --- Profiles ---

interface ProfileRow extends Row {
  account_id: string;
  handle: string;
  name: string;
  open: number;
  auto_post: number;
  weights: number;
  public: number;
  push_follows: number;
  push_comments: number;
  push_sent: number;
  push_likes: number;
  suspended: number;
  seen_at: number;
  avatar: string;
  audience: string;
  show_lifts: number;
  lifts: string;
  suggest: number;
  level: number;
  streak: number;
}

const AVATAR_SET = new Set<string>(AVATAR_IDS);
const avatarOf = (v: unknown) => (AVATAR_SET.has(s(v)) ? s(v) : "");
const audienceOf = (v: unknown): Audience => AUDIENCES.find((a) => a === v) ?? "all";

/** Checks the best lifts the app sends for the showcase: up to three, each a known shape, kilograms and reps. */
export function parseLifts(v: unknown): ShowcaseLift[] {
  const out: ShowcaseLift[] = [];
  for (const raw of (Array.isArray(v) ? v : []).slice(0, SOCIAL_LIMITS.lifts)) {
    if (!raw || typeof raw !== "object") continue;
    const e = raw as Record<string, unknown>;
    const id = s(e.id);
    const w = Number(e.w);
    const r = Number(e.r);
    const at = Number(e.at);
    if (!/^[\w.:-]{1,64}$/.test(id) || !(w > 0 && w <= 2000) || !(r >= 1 && r <= 100) || !Number.isFinite(at)) continue;
    out.push({ id, w: Math.round(w * 100) / 100, r: Math.round(r), at: Math.round(at) });
  }
  return out;
}

function liftsOf(r: { lifts?: unknown }): ShowcaseLift[] {
  try {
    return parseLifts(JSON.parse(s(r.lifts) || "[]"));
  } catch {
    return [];
  }
}

const toProfile = (r: ProfileRow): SocialProfile => ({
  handle: s(r.handle),
  name: s(r.name),
  open: !!n(r.open),
  autoPost: !!n(r.auto_post),
  weights: !!n(r.weights),
  public: !!n(r.public),
  push: { follows: !!n(r.push_follows), comments: !!n(r.push_comments), sent: !!n(r.push_sent), likes: !!n(r.push_likes) },
  avatar: avatarOf(r.avatar),
  audience: audienceOf(r.audience),
  showLifts: !!n(r.show_lifts),
  lifts: liftsOf(r),
  suggest: !!n(r.suggest),
  level: n(r.level),
  streak: n(r.streak),
});

/** A level (1 to 50) or a streak in weeks (0 to 520) from the app, or what was there. */
const clampInt = (v: unknown, lo: number, hi: number, was: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? Math.max(lo, Math.min(hi, Math.round(x))) : n(was);
};

async function profileOf(accountId: string): Promise<ProfileRow | null> {
  const [r] = await query<ProfileRow>("SELECT * FROM social_profiles WHERE account_id = ?", [accountId]);
  return r ?? null;
}

async function byHandle(handle: string): Promise<ProfileRow | null> {
  const h = cleanHandle(handle);
  if (!HANDLE_RE.test(h)) return null;
  const [r] = await query<ProfileRow>("SELECT * FROM social_profiles WHERE handle = ?", [h]);
  return r ?? null;
}

export function checkHandle(v: unknown): { ok: true; handle: string } | { ok: false; error: string } {
  const handle = cleanHandle(v);
  if (!HANDLE_RE.test(handle)) return { ok: false, error: "handle" };
  if (RESERVED.has(handle) || handle.includes("liftsmith") || hasBlockedWord(handle.replace(/_/g, " ")) || hasBlockedWord(handle))
    return { ok: false, error: "handleTaken" };
  return { ok: true, handle };
}

function checkName(v: unknown, fallback: string): { ok: true; name: string } | { ok: false; error: string } {
  const raw = tidy(v, SOCIAL_LIMITS.name);
  if (!raw) return { ok: true, name: fallback };
  const c = checkText(raw, SOCIAL_LIMITS.name);
  return c.ok ? { ok: true, name: c.text } : { ok: false, error: `name.${c.error}` };
}

/** The lifter's own state: their profile (null before joining), unread activity and waiting follow requests. */
export async function me(accountId: string): Promise<Result> {
  const p = await profileOf(accountId);
  if (!p) return ok({ profile: null });
  const [counts] = await query(
    `SELECT
      (SELECT COUNT(*) FROM follows WHERE followee_id = ?1 AND accepted = 1) AS followers,
      (SELECT COUNT(*) FROM follows WHERE follower_id = ?1 AND accepted = 1) AS following,
      (SELECT COUNT(*) FROM follows WHERE followee_id = ?1 AND accepted = 0) AS requests`,
    [accountId],
  );
  return ok({
    profile: toProfile(p),
    suspended: !!n(p.suspended),
    followers: n(counts?.followers),
    following: n(counts?.following),
    requests: n(counts?.requests),
    unread: await unreadCount(accountId, n(p.seen_at)),
  });
}

export async function join(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  if (b.agree !== true) return fail(400, "agree");
  if (await profileOf(accountId)) return update(accountId, b);
  const h = checkHandle(b.handle);
  if (!h.ok) return fail(400, h.error);
  const name = checkName(b.name, h.handle);
  if (!name.ok) return fail(400, name.error);
  if (await byHandle(h.handle)) return fail(409, "handleTaken");
  try {
    await run(
      `INSERT INTO social_profiles (account_id, handle, name, open, auto_post, weights, agreed_at, created_at, seen_at, suspended, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [
        accountId,
        h.handle,
        name.name,
        b.open === true ? 1 : 0,
        b.autoPost === true ? 1 : 0,
        b.weights === false ? 0 : 1,
        now,
        now,
        now,
        avatarOf(b.avatar),
      ],
    );
  } catch {
    return fail(409, "handleTaken"); // two people racing for one handle: the UNIQUE index decides
  }
  return me(accountId);
}

export async function update(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const p = await profileOf(accountId);
  if (!p) return fail(404, "notJoined");
  let handle = s(p.handle);
  if (b.handle !== undefined && cleanHandle(b.handle) !== handle) {
    const h = checkHandle(b.handle);
    if (!h.ok) return fail(400, h.error);
    if (await byHandle(h.handle)) return fail(409, "handleTaken");
    handle = h.handle;
  }
  let name = s(p.name);
  if (b.name !== undefined) {
    const c = checkName(b.name, handle);
    if (!c.ok) return fail(400, c.error);
    name = c.name;
  }
  const flag = (v: unknown, was: unknown) => (typeof v === "boolean" ? (v ? 1 : 0) : n(was));
  // Public means anyone can follow too, so turning it on opens the profile and closing the profile makes it private.
  const pub = b.open === false ? 0 : flag(b.public, p.public);
  const open = pub ? 1 : flag(b.open, p.open);
  try {
    const push = (b.push && typeof b.push === "object" ? b.push : {}) as Record<string, unknown>;
    await run(
      `UPDATE social_profiles SET handle = ?, name = ?, open = ?, auto_post = ?, weights = ?, public = ?,
         push_follows = ?, push_comments = ?, push_sent = ?, push_likes = ?, avatar = ?, audience = ?, show_lifts = ?, lifts = ?,
         suggest = ?, level = ?, streak = ?
       WHERE account_id = ?`,
      [
        handle,
        name,
        open,
        flag(b.autoPost, p.auto_post),
        flag(b.weights, p.weights),
        pub,
        flag(push.follows, p.push_follows),
        flag(push.comments, p.push_comments),
        flag(push.sent, p.push_sent),
        flag(push.likes, p.push_likes),
        b.avatar === undefined ? s(p.avatar) : avatarOf(b.avatar),
        b.audience === undefined ? s(p.audience) || "all" : audienceOf(b.audience),
        flag(b.showLifts, p.show_lifts),
        b.lifts === undefined ? s(p.lifts) || "[]" : JSON.stringify(parseLifts(b.lifts)),
        flag(b.suggest, p.suggest ?? 1),
        clampInt(b.level, 0, 50, p.level),
        clampInt(b.streak, 0, 520, p.streak),
        accountId,
      ],
    );
  } catch {
    return fail(409, "handleTaken");
  }
  // Opening the profile accepts everyone already waiting, as if they'd asked after it opened.
  if (open && !n(p.open)) await run("UPDATE follows SET accepted = 1 WHERE followee_id = ? AND accepted = 0", [accountId]);
  return me(accountId);
}

/** Every row of Friends this account made, for leaving Friends and for deleting the account. */
export function socialDeletes(accountId: string): { sql: string; args: string[] }[] {
  const a = [accountId];
  const mine = "SELECT id FROM posts WHERE account_id = ?";
  return [
    { sql: `DELETE FROM comment_mentions WHERE post_id IN (${mine})`, args: a },
    { sql: "DELETE FROM comment_mentions WHERE comment_id IN (SELECT id FROM post_comments WHERE account_id = ?)", args: a },
    { sql: "DELETE FROM comment_mentions WHERE account_id = ?", args: a },
    { sql: `DELETE FROM post_likes WHERE post_id IN (${mine})`, args: a },
    { sql: `DELETE FROM post_comments WHERE post_id IN (${mine})`, args: a },
    { sql: `DELETE FROM post_partners WHERE post_id IN (${mine})`, args: a },
    { sql: "DELETE FROM posts WHERE account_id = ?", args: a },
    { sql: "DELETE FROM post_partners WHERE account_id = ?", args: a },
    { sql: "DELETE FROM challenge_members WHERE challenge_id IN (SELECT id FROM challenges WHERE owner_id = ?)", args: a },
    { sql: "DELETE FROM challenges WHERE owner_id = ?", args: a },
    { sql: "DELETE FROM challenge_members WHERE account_id = ?", args: a },
    { sql: "DELETE FROM club_members WHERE club_id IN (SELECT id FROM clubs WHERE owner_id = ?)", args: a },
    { sql: "DELETE FROM clubs WHERE owner_id = ?", args: a },
    { sql: "DELETE FROM club_members WHERE account_id = ?", args: a },
    { sql: "DELETE FROM post_likes WHERE account_id = ?", args: a },
    { sql: "DELETE FROM post_comments WHERE account_id = ?", args: a },
    { sql: "DELETE FROM follows WHERE follower_id = ? OR followee_id = ?", args: [accountId, accountId] },
    { sql: "DELETE FROM blocks WHERE blocker_id = ? OR blocked_id = ?", args: [accountId, accountId] },
    { sql: "DELETE FROM mutes WHERE muter_id = ? OR muted_id = ?", args: [accountId, accountId] },
    { sql: "DELETE FROM social_invites WHERE account_id = ?", args: a },
    { sql: "DELETE FROM reports WHERE reporter_id = ?", args: a },
    { sql: "DELETE FROM sent_workouts WHERE from_id = ? OR to_id = ?", args: [accountId, accountId] },
    { sql: "DELETE FROM push_tokens WHERE account_id = ?", args: a },
    { sql: "DELETE FROM suggest_hides WHERE account_id = ? OR hidden_id = ?", args: [accountId, accountId] },
    { sql: "DELETE FROM social_profiles WHERE account_id = ?", args: a },
  ];
}

export async function leave(accountId: string): Promise<Result> {
  // A suspended profile stays, so leaving and joining again can't undo a suspension.
  const p = await profileOf(accountId);
  if (p && n(p.suspended)) {
    await batch(socialDeletes(accountId).filter((x) => !x.sql.startsWith("DELETE FROM social_profiles")));
    return ok();
  }
  await batch(socialDeletes(accountId));
  return ok();
}

// --- Who can see whom ---

async function blockedEither(a: string, b: string): Promise<boolean> {
  const [r] = await query(
    "SELECT 1 AS x FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?) LIMIT 1",
    [a, b, b, a],
  );
  return !!r;
}

async function follow(a: string, b: string): Promise<{ accepted: boolean } | null> {
  const [r] = await query("SELECT accepted FROM follows WHERE follower_id = ? AND followee_id = ?", [a, b]);
  return r ? { accepted: !!n(r.accepted) } : null;
}

async function isPublic(accountId: string): Promise<boolean> {
  const [r] = await query("SELECT public FROM social_profiles WHERE account_id = ? AND suspended = 0", [accountId]);
  return !!n(r?.public);
}

/** Whether `viewer` can see `author`'s posts: their own, an accepted follow or a public profile, with no block either way. */
async function canSee(viewer: string, author: string): Promise<boolean> {
  if (viewer === author) return true;
  const f = await follow(viewer, author);
  return (!!f?.accepted || (await isPublic(author))) && !(await blockedEither(viewer, author));
}

/**
 * Whether the reader (?2 in these statements) may see post `p` by its audience: their own, "all", or "friends"
 * when each follows the other. Blocks, suspension and following are checked around it.
 */
const seesPost = (v: string) => `(p.account_id = ${v} OR p.audience = 'all' OR (p.audience = 'friends'
  AND EXISTS (SELECT 1 FROM follows fa WHERE fa.follower_id = p.account_id AND fa.followee_id = ${v} AND fa.accepted = 1)
  AND EXISTS (SELECT 1 FROM follows fb WHERE fb.follower_id = ${v} AND fb.followee_id = p.account_id AND fb.accepted = 1)))`;
const SEES_POST = seesPost("?2");

/** A profile as `viewer` sees it, or null when it doesn't exist for them (suspended, or either blocked the other). */
async function card(viewer: string, p: ProfileRow, now = Date.now()): Promise<PersonCard | null> {
  const id = s(p.account_id);
  if (n(p.suspended) && id !== viewer) return null;
  const [theyBlocked] = await query("SELECT 1 AS x FROM blocks WHERE blocker_id = ? AND blocked_id = ?", [id, viewer]);
  if (theyBlocked) return null;
  const [iBlocked] = await query("SELECT 1 AS x FROM blocks WHERE blocker_id = ? AND blocked_id = ?", [viewer, id]);
  const [c] = await query(
    `SELECT
      (SELECT COUNT(*) FROM follows WHERE followee_id = ?1 AND accepted = 1) AS followers,
      (SELECT COUNT(*) FROM follows WHERE follower_id = ?1 AND accepted = 1) AS following,
      (SELECT COUNT(*) FROM posts p WHERE p.account_id = ?1 AND p.hidden = 0 AND ${SEES_POST}) AS posts`,
    [id, viewer],
  );
  const [muted] = await query("SELECT 1 AS x FROM mutes WHERE muter_id = ? AND muted_id = ?", [viewer, id]);
  const mine = await follow(viewer, id);
  const theirs = await follow(id, viewer);
  const relation: Relation = id === viewer ? "self" : iBlocked ? "blocked" : mine?.accepted ? "following" : mine ? "requested" : "none";
  const canSeePosts = relation === "self" || relation === "following" || (relation !== "blocked" && !!n(p.public));
  return {
    handle: s(p.handle),
    name: s(p.name),
    followers: n(c?.followers),
    following: n(c?.following),
    posts: n(c?.posts),
    relation,
    followsYou: !!theirs?.accepted,
    canSee: canSeePosts,
    open: !!n(p.open),
    public: !!n(p.public),
    avatar: avatarOf(p.avatar),
    muted: !!muted,
    lifts: canSeePosts && n(p.show_lifts) && n(p.weights) ? liftsOf(p) : [],
    level: canSeePosts ? n(p.level) : 0,
    streak: canSeePosts ? n(p.streak) : 0,
    trained: canSeePosts ? await trainedDays(viewer, id, now) : [],
  };
}

/** When each of `author`'s posts the reader may see started, over the training calendar's weeks. */
async function trainedDays(viewer: string, author: string, now: number): Promise<number[]> {
  const rows = await query(
    `SELECT p.at AS at FROM posts p WHERE p.account_id = ?1 AND p.hidden = 0 AND p.at >= ?3 AND ${SEES_POST}
     ORDER BY p.at LIMIT 200`,
    [author, viewer, now - (SOCIAL_LIMITS.calendarWeeks * 7 + 7) * day],
  );
  return rows.map((r) => n(r.at));
}

async function joined(accountId: string): Promise<ProfileRow | Result> {
  const p = await profileOf(accountId);
  if (!p) return fail(403, "notJoined");
  return p;
}
const isResult = (x: unknown): x is Result => !!x && typeof x === "object" && "code" in x && "body" in x;

/** Exact handle only: there's no list of everyone to browse or scrape. */
export async function lookup(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  if (!(await limit(accountId, "lookup", now))) return fail(429, "slow");
  const p = await byHandle(s(b.handle));
  const c = p ? await card(accountId, p, now) : null;
  return c ? ok({ person: c }) : fail(404, "noOne");
}

const toRow = (r: Row): PersonRow => ({ handle: s(r.handle), name: s(r.name), avatar: avatarOf(r.avatar) });
const NOT_BLOCKED = (col: string, v: string) => `${col} NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ${v})
  AND ${col} NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ${v})`;

/**
 * Finding people by name: public profiles only (they chose to be found, on the web too), by the start of their
 * name, a word in it, or their handle, plus whoever has exactly that handle, public or not. Rate-limited like lookups.
 */
export async function search(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const q = tidy(b.q, 40).replace(/^@/, "").toLowerCase();
  if (q.length < SOCIAL_LIMITS.searchMin) return ok({ people: [] });
  if (!(await limit(accountId, "lookup", now))) return fail(429, "slow");
  const like = q.replace(/[\\%_]/g, (c) => `\\${c}`);
  const rows = await query(
    `SELECT sp.account_id AS id, sp.handle AS handle, sp.name AS name, sp.avatar AS avatar
     FROM social_profiles sp
     WHERE sp.suspended = 0 AND sp.account_id != ?1 AND ${NOT_BLOCKED("sp.account_id", "?1")}
       AND (sp.handle = ?2 OR (sp.public = 1 AND (sp.handle LIKE ?3 ESCAPE '\\' OR lower(sp.name) LIKE ?3 ESCAPE '\\'
         OR lower(sp.name) LIKE ?4 ESCAPE '\\')))
     ORDER BY (sp.handle = ?2) DESC, sp.name LIMIT ${SOCIAL_LIMITS.suggestions}`,
    [accountId, cleanHandle(q), `${like}%`, `% ${like}%`],
  );
  return ok({ people: rows.map(toRow) });
}

/** Someone's followers or the people they follow, for a reader who may see their posts. Blocked people are left out. */
export async function personPeople(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const p = await byHandle(s(b.handle));
  if (!p || (n(p.suspended) && s(p.account_id) !== accountId)) return fail(404, "noOne");
  const them = s(p.account_id);
  if (!(await canSee(accountId, them))) return fail(403, "private");
  const followers = s(b.list) === "followers";
  const rows = await query(
    `SELECT sp.handle AS handle, sp.name AS name, sp.avatar AS avatar FROM follows f
     JOIN social_profiles sp ON sp.account_id = ${followers ? "f.follower_id" : "f.followee_id"}
     WHERE ${followers ? "f.followee_id" : "f.follower_id"} = ?1 AND f.accepted = 1 AND sp.suspended = 0
       AND ${NOT_BLOCKED("sp.account_id", "?2")}
     ORDER BY f.created_at DESC LIMIT 500`,
    [them, accountId],
  );
  return ok({ people: rows.map(toRow) });
}

const SUGGEST_WEIGHT: Record<SuggestReason, number> = { followsYou: 1000, partner: 500, club: 200, mutual: 10 };

/**
 * People the lifter may know, from real ties only: someone who follows them and they don't follow back, people
 * they've been tagged with as training partners, club mates, and people followed by several people they follow.
 * Never people they already follow or asked to, blocked either way, suspended, dismissed, or (except someone who
 * already follows them) people who turned suggestions off. There's still no list of everyone.
 */
export async function suggest(accountId: string): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const a = [accountId];
  const [followsYou, partners, clubMates, mutuals] = await Promise.all([
    query("SELECT follower_id AS id FROM follows WHERE followee_id = ? AND accepted = 1", a),
    query(
      // Tagged on the lifter's posts, the poster of a post they were tagged on, and anyone tagged alongside them.
      `SELECT pp.account_id AS id FROM post_partners pp JOIN posts p ON p.id = pp.post_id WHERE p.account_id = ?1
       UNION SELECT p.account_id FROM post_partners pp JOIN posts p ON p.id = pp.post_id WHERE pp.account_id = ?1
       UNION SELECT o.account_id FROM post_partners pp JOIN post_partners o ON o.post_id = pp.post_id
         WHERE pp.account_id = ?1 AND o.account_id != ?1`,
      a,
    ),
    query(
      `SELECT m.account_id AS id, MIN(c.name) AS via FROM club_members me JOIN club_members m ON m.club_id = me.club_id
       JOIN clubs c ON c.id = me.club_id WHERE me.account_id = ?1 AND m.account_id != ?1 GROUP BY m.account_id`,
      a,
    ),
    query(
      `SELECT f2.followee_id AS id, COUNT(*) AS n, MIN(sp.name) AS via FROM follows f1
       JOIN follows f2 ON f2.follower_id = f1.followee_id AND f2.accepted = 1
       JOIN social_profiles sp ON sp.account_id = f1.followee_id AND sp.suspended = 0
       WHERE f1.follower_id = ?1 AND f1.accepted = 1 AND f2.followee_id != ?1 GROUP BY f2.followee_id`,
      a,
    ),
  ]);
  const best = new Map<string, { reason: SuggestReason; count?: number; via?: string; score: number }>();
  const offer = (id: string, reason: SuggestReason, extra: { count?: number; via?: string } = {}) => {
    const score = SUGGEST_WEIGHT[reason] * (extra.count ?? 1);
    const had = best.get(id);
    if (!had || score > had.score) best.set(id, { reason, ...extra, score: Math.max(score, had?.score ?? 0) });
  };
  for (const r of mutuals) offer(s(r.id), "mutual", { count: n(r.n), via: s(r.via) });
  for (const r of clubMates) offer(s(r.id), "club", { via: s(r.via) });
  for (const r of partners) offer(s(r.id), "partner");
  for (const r of followsYou) offer(s(r.id), "followsYou");
  best.delete(accountId);
  if (!best.size) return ok({ people: [] });
  const ids = [...best.keys()];
  const rows = await query(
    `SELECT sp.account_id AS id, sp.handle AS handle, sp.name AS name, sp.avatar AS avatar, sp.open AS open, sp.suggest AS suggest
     FROM social_profiles sp
     WHERE sp.account_id IN (${ids.map(() => "?").join(",")}) AND sp.suspended = 0
       AND sp.account_id NOT IN (SELECT followee_id FROM follows WHERE follower_id = ?)
       AND sp.account_id NOT IN (SELECT hidden_id FROM suggest_hides WHERE account_id = ?)
       AND ${NOT_BLOCKED("sp.account_id", "?")}`,
    [...ids, accountId, accountId, accountId, accountId],
  );
  const people: Suggestion[] = rows
    .map((r) => ({ r, tie: best.get(s(r.id))! }))
    .filter(({ r, tie }) => tie.reason === "followsYou" || !!n(r.suggest))
    .sort((x, y) => y.tie.score - x.tie.score || s(x.r.name).localeCompare(s(y.r.name)))
    .slice(0, SOCIAL_LIMITS.suggestions)
    .map(({ r, tie }) => ({
      ...toRow(r),
      reason: tie.reason,
      ...(tie.count ? { count: tie.count } : {}),
      ...(tie.via ? { via: tie.via } : {}),
      open: !!n(r.open),
    }));
  return ok({ people });
}

/** Dismisses a suggestion: that person isn't suggested to the lifter again. */
export async function unsuggest(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const p = await byHandle(s(b.handle));
  if (p)
    await run("INSERT OR IGNORE INTO suggest_hides (account_id, hidden_id, created_at) VALUES (?, ?, ?)", [
      accountId,
      s(p.account_id),
      now,
    ]);
  return ok();
}

// --- Following ---

export async function followOp(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  if (n(mine.suspended)) return fail(403, "suspended");
  const p = await byHandle(s(b.handle));
  const them = p ? s(p.account_id) : "";
  if (!p || them === accountId || n(p.suspended) || (await blockedEither(accountId, them))) return fail(404, "noOne");
  if (await follow(accountId, them)) return lookup(accountId, b, now);
  if (!(await limit(accountId, "follow", now))) return fail(429, "slow");
  await run("INSERT OR IGNORE INTO follows (follower_id, followee_id, accepted, created_at) VALUES (?, ?, ?, ?)", [
    accountId,
    them,
    n(p.open) ? 1 : 0,
    now,
  ]);
  await notify(them, accountId, n(p.open) ? "follow" : "request");
  return lookup(accountId, b, now);
}

/** Stops following, or takes back a request. */
export async function unfollow(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const p = await byHandle(s(b.handle));
  if (p) await run("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?", [accountId, s(p.account_id)]);
  return ok();
}

/** Accepts or declines a follow request, or (`remove`) takes a follower off. */
export async function answer(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const p = await byHandle(s(b.handle));
  if (!p) return fail(404, "noOne");
  const them = s(p.account_id);
  if (b.accept === true) {
    const r = await run("UPDATE follows SET accepted = 1 WHERE follower_id = ? AND followee_id = ? AND accepted = 0", [them, accountId]);
    if (r) await notify(them, accountId, "accept");
  } else await run("DELETE FROM follows WHERE follower_id = ? AND followee_id = ?", [them, accountId]);
  return ok();
}

const PEOPLE = "sp.handle AS handle, sp.name AS name, sp.avatar AS avatar";

/** The lifter's own lists: waiting requests, followers, following, blocked. */
export async function people(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const which = s(b.list);
  const visible = "sp.suspended = 0";
  const sql =
    which === "requests"
      ? `SELECT ${PEOPLE}, f.created_at AS at FROM follows f JOIN social_profiles sp ON sp.account_id = f.follower_id
         WHERE f.followee_id = ? AND f.accepted = 0 AND ${visible} ORDER BY f.created_at DESC LIMIT 200`
      : which === "followers"
        ? `SELECT ${PEOPLE}, f.created_at AS at FROM follows f JOIN social_profiles sp ON sp.account_id = f.follower_id
         WHERE f.followee_id = ? AND f.accepted = 1 AND ${visible} ORDER BY f.created_at DESC LIMIT 500`
        : which === "following"
          ? `SELECT ${PEOPLE}, f.created_at AS at FROM follows f JOIN social_profiles sp ON sp.account_id = f.followee_id
         WHERE f.follower_id = ? AND ${visible} ORDER BY f.accepted, f.created_at DESC LIMIT 500`
          : which === "friends"
            ? // People who follow each other with the lifter: who a workout can be sent to.
              `SELECT ${PEOPLE}, f.created_at AS at FROM follows f JOIN social_profiles sp ON sp.account_id = f.followee_id
         WHERE f.follower_id = ?1 AND f.accepted = 1 AND ${visible}
           AND EXISTS (SELECT 1 FROM follows b WHERE b.follower_id = f.followee_id AND b.followee_id = ?1 AND b.accepted = 1)
         ORDER BY sp.name LIMIT 500`
            : which === "blocked"
              ? `SELECT ${PEOPLE}, bl.created_at AS at FROM blocks bl JOIN social_profiles sp ON sp.account_id = bl.blocked_id
         WHERE bl.blocker_id = ? ORDER BY bl.created_at DESC LIMIT 500`
              : which === "muted"
                ? `SELECT ${PEOPLE}, m.created_at AS at FROM mutes m JOIN social_profiles sp ON sp.account_id = m.muted_id
         WHERE m.muter_id = ? ORDER BY m.created_at DESC LIMIT 500`
                : "";
  if (!sql) return fail(400, "Bad request.");
  const rows = await query(sql, [accountId]);
  return ok({ people: rows.map((r) => ({ handle: s(r.handle), name: s(r.name), avatar: avatarOf(r.avatar), at: n(r.at) })) });
}

// --- Blocking and reporting ---

export async function block(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const p = await byHandle(s(b.handle));
  const them = p ? s(p.account_id) : "";
  if (!p || them === accountId) return fail(404, "noOne");
  await batch([
    { sql: "INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)", args: [accountId, them, now] },
    {
      sql: "DELETE FROM follows WHERE (follower_id = ? AND followee_id = ?) OR (follower_id = ? AND followee_id = ?)",
      args: [accountId, them, them, accountId],
    },
  ]);
  return ok();
}

export async function unblock(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const p = await byHandle(s(b.handle));
  if (p) await run("DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?", [accountId, s(p.account_id)]);
  return ok();
}

/** Mutes someone: their posts leave the lifter's feed. Following, their profile and Activity stay as they were. */
export async function mute(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const p = await byHandle(s(b.handle));
  const them = p ? s(p.account_id) : "";
  if (!p || them === accountId) return fail(404, "noOne");
  if (b.on === false) await run("DELETE FROM mutes WHERE muter_id = ? AND muted_id = ?", [accountId, them]);
  else await run("INSERT OR IGNORE INTO mutes (muter_id, muted_id, created_at) VALUES (?, ?, ?)", [accountId, them, now]);
  return lookup(accountId, b, now);
}

const REPORT_KINDS = new Set<ReportKind>(["post", "comment", "profile"]);

export async function report(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const kind = s(b.kind) as ReportKind;
  const reason = REPORT_REASONS.find((r) => r === b.reason);
  if (!REPORT_KINDS.has(kind) || !reason) return fail(400, "Bad request.");
  // Profiles are reported by handle and stored by account, so a new handle doesn't escape the report.
  let target = s(b.id);
  if (kind === "profile") {
    const p = await byHandle(target);
    if (!p) return fail(404, "noOne");
    target = s(p.account_id);
  } else {
    const [exists] = await query(`SELECT 1 AS x FROM ${kind === "post" ? "posts" : "post_comments"} WHERE id = ?`, [target]);
    if (!exists) return fail(404, "gone");
  }
  if (target === accountId) return fail(400, "Bad request.");
  if (!(await limit(accountId, "report", now))) return fail(429, "slow");
  await run(
    `INSERT OR IGNORE INTO reports (reporter_id, kind, target_id, reason, note, created_at, status) VALUES (?, ?, ?, ?, ?, ?, 'open')`,
    [accountId, kind, target, reason, tidy(b.note, 280), now],
  );
  if (kind !== "profile") {
    const [c] = await query("SELECT COUNT(DISTINCT reporter_id) AS n FROM reports WHERE kind = ? AND target_id = ? AND status = 'open'", [
      kind,
      target,
    ]);
    if (n(c?.n) >= HIDE_AFTER) await run(`UPDATE ${kind === "post" ? "posts" : "post_comments"} SET hidden = 1 WHERE id = ?`, [target]);
  }
  return ok();
}

// --- Posts ---

const num = (v: unknown, max: number) => {
  const x = Number(v);
  return Number.isFinite(x) && x >= 0 && x <= max ? x : null;
};

/** Each set of an exercise, checked: kilograms (dropped when the post hides weights), reps or seconds, metres. */
export function parseLog(v: unknown, weights: boolean): PostSet[] {
  const out: PostSet[] = [];
  for (const raw of (Array.isArray(v) ? v : []).slice(0, SOCIAL_LIMITS.setsEach)) {
    if (!raw || typeof raw !== "object") continue;
    const e = raw as Record<string, unknown>;
    const r = num(e.r, 100_000);
    if (r == null) continue;
    const w = weights && e.w != null ? num(e.w, 2_000) : null;
    const d = e.d == null ? undefined : (num(e.d, 1_000_000) ?? undefined);
    out.push({ w: w == null ? null : Math.round(w * 100) / 100, r: Math.round(r), ...(d ? { d: Math.round(d) } : {}) });
  }
  return out;
}

/** Checks a workout someone wants to post. Only the summary fields are kept; anything else is dropped. */
export function parsePost(
  v: unknown,
  now = Date.now(),
): { workoutId: string; at: number; body: PostBody; caption: string; audience: Audience | null } | { error: string } {
  if (!v || typeof v !== "object") return { error: "Bad request." };
  const b = v as Record<string, unknown>;
  const workoutId = s(b.workoutId);
  if (!/^[\w.:-]{1,80}$/.test(workoutId)) return { error: "Bad request." };
  const at = Number(b.at);
  // A workout from the last 90 days, not the future.
  if (!Number.isFinite(at) || at > now + day || at < now - 90 * day) return { error: "old" };
  const w = (b.body ?? {}) as Record<string, unknown>;
  const seconds = num(w.seconds, 6 * 3600);
  const sets = num(w.sets, 500);
  const prs = num(w.prs, 100);
  const volume = w.volume == null ? null : num(w.volume, 1_000_000);
  if (seconds == null || sets == null || prs == null || (w.volume != null && volume == null)) return { error: "Bad request." };
  const muscles = (Array.isArray(w.muscles) ? w.muscles : [])
    .filter((m): m is string => typeof m === "string" && /^[a-z_]{2,24}$/.test(m))
    .slice(0, SOCIAL_LIMITS.muscles);
  const exercises: PostExercise[] = [];
  for (const raw of (Array.isArray(w.exercises) ? w.exercises : []).slice(0, SOCIAL_LIMITS.exercises)) {
    if (!raw || typeof raw !== "object") continue;
    const e = raw as Record<string, unknown>;
    const id = s(e.id);
    if (!/^[\w.:-]{1,64}$/.test(id)) continue;
    // A custom exercise's name is the lifter's own text, so it gets the same filter as a comment.
    const name = checkText(e.name, 60);
    const r = num(e.r, 100_000);
    const setCount = num(e.sets, 100);
    if (r == null || setCount == null) continue;
    const kg = e.w == null ? null : num(e.w, 2_000);
    const d = e.d == null ? undefined : (num(e.d, 1_000_000) ?? undefined);
    const log = parseLog(e.log, kg !== null);
    exercises.push({
      id,
      name: name.ok ? name.text : "",
      sets: Math.round(setCount),
      w: kg,
      r: Math.round(r),
      ...(d ? { d } : {}),
      ...(log.length ? { log } : {}),
      ...(e.pr === true ? { pr: true } : {}),
    });
  }
  if (!exercises.length) return { error: "empty" };
  const caption = parseCaption(b.caption);
  if ("error" in caption) return caption;
  return {
    workoutId,
    at,
    caption: caption.text,
    audience: b.audience === undefined ? null : audienceOf(b.audience),
    body: { v: 1, seconds: Math.round(seconds), sets: Math.round(sets), volume, prs: Math.round(prs), muscles, exercises },
  };
}

/** A caption: optional, 280 characters, through the same filter as a comment (no links, no slurs). */
function parseCaption(v: unknown): { text: string } | { error: string } {
  if (!tidy(v, SOCIAL_LIMITS.caption)) return { text: "" };
  const c = checkText(v, SOCIAL_LIMITS.caption);
  return c.ok ? { text: c.text } : { error: `caption.${c.error}` };
}

export async function post(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  if (n(mine.suspended)) return fail(403, "suspended");
  const p = parsePost(b, now);
  if ("error" in p) return fail(400, p.error);
  // The same workout posted twice (two taps, or two devices) is one post.
  const [had] = await query("SELECT id FROM posts WHERE account_id = ? AND workout_id = ?", [accountId, p.workoutId]);
  if (had) return ok({ id: s(had.id) });
  if (!(await limit(accountId, "post", now))) return fail(429, "slow");
  const id = newId();
  await run(
    "INSERT OR IGNORE INTO posts (id, account_id, workout_id, created_at, at, body, hidden, caption, audience) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)",
    [id, accountId, p.workoutId, now, p.at, JSON.stringify(p.body), p.caption, p.audience ?? audienceOf(mine.audience)],
  );
  const [row] = await query("SELECT id FROM posts WHERE account_id = ? AND workout_id = ?", [accountId, p.workoutId]);
  const postId = s(row?.id ?? id);
  const audience = p.audience ?? audienceOf(mine.audience);
  if (audience !== "me") await tagPartners(accountId, postId, b.partners, now);
  return ok({ id: postId });
}

/** Handles of the lifter's mutual friends among `v` (up to five), as account ids. Anyone else is dropped. */
async function friendIds(accountId: string, v: unknown, max: number): Promise<string[]> {
  const handles = [...new Set((Array.isArray(v) ? v : []).map(cleanHandle).filter((h) => HANDLE_RE.test(h)))].slice(0, max);
  if (!handles.length) return [];
  const rows = await query(
    `SELECT sp.account_id AS id FROM social_profiles sp
     WHERE sp.handle IN (${handles.map((_, i) => `?${i + 2}`).join(",")}) AND sp.suspended = 0 AND sp.account_id != ?1
       AND EXISTS (SELECT 1 FROM follows a WHERE a.follower_id = ?1 AND a.followee_id = sp.account_id AND a.accepted = 1)
       AND EXISTS (SELECT 1 FROM follows b WHERE b.follower_id = sp.account_id AND b.followee_id = ?1 AND b.accepted = 1)
       AND NOT EXISTS (SELECT 1 FROM blocks bl WHERE (bl.blocker_id = ?1 AND bl.blocked_id = sp.account_id)
         OR (bl.blocker_id = sp.account_id AND bl.blocked_id = ?1))`,
    [accountId, ...handles],
  );
  return rows.map((r) => s(r.id));
}

/**
 * Sets who the lifter trained with on one of their posts: mutual friends only, up to five. Someone newly tagged
 * hears about it; someone left out is untagged. `undefined` leaves the tags as they are.
 */
async function tagPartners(accountId: string, postId: string, v: unknown, now: number) {
  if (v === undefined) return;
  const ids = await friendIds(accountId, v, SOCIAL_LIMITS.partners);
  const had = new Set((await query("SELECT account_id FROM post_partners WHERE post_id = ?", [postId])).map((r) => s(r.account_id)));
  await batch([
    { sql: "DELETE FROM post_partners WHERE post_id = ?", args: [postId] },
    ...ids.map((id) => ({
      sql: "INSERT OR IGNORE INTO post_partners (post_id, account_id, created_at) VALUES (?, ?, ?)",
      args: [postId, id, now] as (string | number)[],
    })),
  ]);
  for (const id of ids) if (!had.has(id)) await notify(id, accountId, "tag");
}

/** A tagged lifter takes themselves off someone's post. */
export async function untag(accountId: string, b: Record<string, unknown>): Promise<Result> {
  await run("DELETE FROM post_partners WHERE post_id = ? AND account_id = ?", [s(b.id), accountId]);
  return ok();
}

/** Changes the caption or who sees one of the lifter's own posts. */
export async function editPost(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  if (n(mine.suspended)) return fail(403, "suspended");
  const [row] = await query("SELECT id, caption, audience FROM posts WHERE account_id = ? AND (id = ? OR workout_id = ?)", [
    accountId,
    s(b.id),
    s(b.workoutId),
  ]);
  if (!row) return fail(404, "gone");
  const caption = b.caption === undefined ? { text: s(row.caption) } : parseCaption(b.caption);
  if ("error" in caption) return fail(400, caption.error);
  const audience = b.audience === undefined ? audienceOf(row.audience) : audienceOf(b.audience);
  await run("UPDATE posts SET caption = ?, audience = ? WHERE id = ?", [caption.text, audience, s(row.id)]);
  // A post only the lifter sees has no one to tag.
  await tagPartners(accountId, s(row.id), audience === "me" ? [] : b.partners, Date.now());
  const partners = await partnersOf(accountId, s(row.id));
  return ok({ id: s(row.id), caption: caption.text, audience, partners });
}

/** Deletes one of the lifter's own posts, by its id or the workout it came from. */
export async function unpost(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const ids = (
    await query("SELECT id FROM posts WHERE account_id = ? AND (id = ? OR workout_id = ?)", [accountId, s(b.id), s(b.workoutId)])
  ).map((r) => s(r.id));
  for (const id of ids)
    await batch([
      { sql: "DELETE FROM post_likes WHERE post_id = ?", args: [id] },
      { sql: "DELETE FROM post_comments WHERE post_id = ?", args: [id] },
      { sql: "DELETE FROM post_partners WHERE post_id = ?", args: [id] },
      { sql: "DELETE FROM posts WHERE id = ?", args: [id] },
    ]);
  return ok();
}

/** Which of these workouts the lifter has posted (Done and History show "Posted"). */
export async function posted(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const ids = (Array.isArray(b.workoutIds) ? b.workoutIds : [])
    .map(s)
    .filter((x) => x.length <= 80)
    .slice(0, 50);
  if (!ids.length) return ok({ posted: {}, details: {} });
  const rows = await query(
    `SELECT id, workout_id, caption, audience FROM posts WHERE account_id = ? AND workout_id IN (${ids.map(() => "?").join(",")})`,
    [accountId, ...ids],
  );
  const tags = await withPartners(
    accountId,
    rows.map((r) => ({ id: s(r.id) })),
  );
  const partners = new Map(tags.map((x) => [x.id, x.partners.map((pt) => pt.handle)]));
  return ok({
    posted: Object.fromEntries(rows.map((r) => [s(r.workout_id), s(r.id)])),
    details: Object.fromEntries(
      rows.map((r) => [
        s(r.workout_id),
        { caption: s(r.caption), audience: audienceOf(r.audience), partners: partners.get(s(r.id)) ?? [] },
      ]),
    ),
  });
}

async function partnersOf(viewer: string, postId: string): Promise<Partner[]> {
  const [p] = await withPartners(viewer, [{ id: postId }]);
  return p?.partners ?? [];
}

const POST_COLS = (viewer: string) => [
  `p.id AS id, p.at AS at, p.body AS body, p.account_id AS author, sp.handle AS handle, sp.name AS name, sp.avatar AS avatar,
   p.caption AS caption, p.audience AS audience,
   (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS likes,
   (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id AND l.account_id = ?) AS liked,
   (SELECT COUNT(*) FROM post_comments c JOIN social_profiles cp ON cp.account_id = c.account_id
     WHERE c.post_id = p.id AND c.hidden = 0 AND cp.suspended = 0) AS comments`,
  viewer,
];

function toPost(viewer: string, r: Row): FeedPost | null {
  let body: PostBody;
  try {
    body = JSON.parse(s(r.body)) as PostBody;
  } catch {
    return null;
  }
  return {
    id: s(r.id),
    handle: s(r.handle),
    name: s(r.name),
    at: n(r.at),
    body,
    likes: n(r.likes),
    liked: n(r.liked) > 0,
    comments: n(r.comments),
    mine: s(r.author) === viewer,
    avatar: avatarOf(r.avatar),
    caption: s(r.caption),
    audience: audienceOf(r.audience),
    partners: [],
    tagged: false,
  };
}

/** Fills in each post's training partners (one query for the page) and whether the reader is one of them. */
async function withPartners<T extends { id: string }>(
  viewer: string,
  posts: T[],
): Promise<(T & { partners: Partner[]; tagged: boolean })[]> {
  if (!posts.length) return [];
  const rows = await query(
    `SELECT pp.post_id AS post_id, pp.account_id AS id, tp.handle AS handle, tp.name AS name, tp.avatar AS avatar
     FROM post_partners pp JOIN social_profiles tp ON tp.account_id = pp.account_id
     WHERE pp.post_id IN (${posts.map(() => "?").join(",")}) AND tp.suspended = 0
       AND pp.account_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?)
       AND pp.account_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
     ORDER BY pp.created_at, tp.name`,
    [...posts.map((p) => p.id), viewer, viewer],
  );
  const by = new Map<string, Row[]>();
  for (const r of rows) by.set(s(r.post_id), [...(by.get(s(r.post_id)) ?? []), r]);
  return posts.map((p) => {
    const mine = by.get(p.id) ?? [];
    return {
      ...p,
      partners: mine.map((r) => ({ handle: s(r.handle), name: s(r.name), avatar: avatarOf(r.avatar) })),
      tagged: mine.some((r) => s(r.id) === viewer),
    };
  });
}

const cursor = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) && x > 0 ? x : Number.MAX_SAFE_INTEGER;
};

/** Workouts from people the lifter follows, and their own, newest first, 20 at a time (`before` is the last `at`). */
export async function feed(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const [cols, viewer] = POST_COLS(accountId);
  const rows = await query(
    `SELECT ${cols} FROM posts p JOIN social_profiles sp ON sp.account_id = p.account_id
     WHERE p.hidden = 0 AND sp.suspended = 0 AND p.at < ?
       AND (p.account_id = ? OR p.account_id IN (SELECT followee_id FROM follows WHERE follower_id = ? AND accepted = 1))
       AND p.account_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
       AND p.account_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?)
       AND p.account_id NOT IN (SELECT muted_id FROM mutes WHERE muter_id = ?)
       AND ${seesPost("?")}
     ORDER BY p.at DESC LIMIT ${PAGE}`,
    [viewer!, cursor(b.before), accountId, accountId, accountId, accountId, accountId, accountId, accountId, accountId],
  );
  const posts = await withPartners(
    accountId,
    rows.map((r) => toPost(accountId, r)).filter((p): p is FeedPost => !!p),
  );
  return ok({ posts, more: rows.length === PAGE });
}

/** One person's posts, when the lifter may see them. */
export async function personPosts(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const p = await byHandle(s(b.handle));
  if (!p || (n(p.suspended) && s(p.account_id) !== accountId)) return fail(404, "noOne");
  const author = s(p.account_id);
  if (!(await canSee(accountId, author))) return ok({ posts: [], more: false });
  const [cols, viewer] = POST_COLS(accountId);
  const rows = await query(
    `SELECT ${cols} FROM posts p JOIN social_profiles sp ON sp.account_id = p.account_id
     WHERE p.account_id = ? AND p.hidden = 0 AND p.at < ? AND ${seesPost("?")} ORDER BY p.at DESC LIMIT ${PAGE}`,
    [viewer!, author, cursor(b.before), accountId, accountId, accountId],
  );
  const posts = await withPartners(
    accountId,
    rows.map((r) => toPost(accountId, r)).filter((p): p is FeedPost => !!p),
  );
  return ok({ posts, more: rows.length === PAGE });
}

/** A post the lifter may see, with its author's id, or null. */
async function visiblePost(accountId: string, postId: string): Promise<{ author: string } | null> {
  const [r] = await query(
    `SELECT p.account_id AS author FROM posts p JOIN social_profiles sp ON sp.account_id = p.account_id
     WHERE p.id = ? AND p.hidden = 0 AND sp.suspended = 0 AND ${seesPost("?")}`,
    [postId, accountId, accountId, accountId],
  );
  if (!r) return null;
  const author = s(r.author);
  return (await canSee(accountId, author)) ? { author } : null;
}

/** One post and its comments. */
export async function thread(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const id = s(b.id);
  const vis = await visiblePost(accountId, id);
  if (!vis) return fail(404, "gone");
  const [cols, viewer] = POST_COLS(accountId);
  const [row] = await query(`SELECT ${cols} FROM posts p JOIN social_profiles sp ON sp.account_id = p.account_id WHERE p.id = ?`, [
    viewer!,
    id,
  ]);
  const rows = await query(
    `SELECT c.id AS id, c.account_id AS author, c.created_at AS at, c.body AS body, sp.handle AS handle, sp.name AS name,
       sp.avatar AS avatar, c.reply_to AS reply_to
     FROM post_comments c JOIN social_profiles sp ON sp.account_id = c.account_id
     WHERE c.post_id = ? AND c.hidden = 0 AND sp.suspended = 0
       AND c.account_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)
       AND c.account_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?)
     ORDER BY c.created_at LIMIT 300`,
    [id, accountId, accountId],
  );
  const comments: FeedComment[] = rows.map((r) => ({
    id: s(r.id),
    handle: s(r.handle),
    name: s(r.name),
    avatar: avatarOf(r.avatar),
    at: n(r.at),
    body: s(r.body),
    mine: s(r.author) === accountId,
    canDelete: s(r.author) === accountId || vis.author === accountId,
    ...(s(r.reply_to) ? { replyTo: s(r.reply_to) } : {}),
  }));
  const one = row ? toPost(accountId, row) : null;
  return ok({ post: one ? (await withPartners(accountId, [one]))[0] : null, comments });
}

export async function like(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const id = s(b.id);
  if (!(await visiblePost(accountId, id))) return fail(404, "gone");
  if (b.on === false) await run("DELETE FROM post_likes WHERE post_id = ? AND account_id = ?", [id, accountId]);
  else {
    if (!(await limit(accountId, "like", now))) return fail(429, "slow");
    const added = await run("INSERT OR IGNORE INTO post_likes (post_id, account_id, created_at) VALUES (?, ?, ?)", [id, accountId, now]);
    const author = await visiblePost(accountId, id);
    if (added && author) await notify(author.author, accountId, "like");
  }
  const [c] = await query("SELECT COUNT(*) AS n FROM post_likes WHERE post_id = ?", [id]);
  return ok({ likes: n(c?.n), liked: b.on !== false });
}

/** The handles named with @ in a comment, at most five, each once. */
export function mentionsIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/(?:^|[^\w@])@([a-z0-9_]{3,20})(?![\w])/gi)) {
    const h = m[1]!.toLowerCase();
    if (!out.includes(h)) out.push(h);
    if (out.length === 5) break;
  }
  return out;
}

/**
 * Adds a comment, or (with `replyTo`) a reply to a comment on the same post. Replies sit one level deep: a reply
 * to a reply joins the same top comment. People named with @handle who may see the post get an Activity line and
 * a push; so does the author of the comment replied to. Nobody is told twice about one comment.
 */
export async function comment(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  if (n(mine.suspended)) return fail(403, "suspended");
  const id = s(b.id);
  const post = await visiblePost(accountId, id);
  if (!post) return fail(404, "gone");
  const text = checkText(b.text, SOCIAL_LIMITS.comment);
  if (!text.ok) return fail(400, `comment.${text.error}`);
  let replyTo = "";
  let parentAuthor = "";
  if (b.replyTo) {
    const [parent] = await query(
      `SELECT c.id AS id, c.reply_to AS reply_to, c.account_id AS author FROM post_comments c
       JOIN social_profiles sp ON sp.account_id = c.account_id
       WHERE c.id = ? AND c.post_id = ? AND c.hidden = 0 AND sp.suspended = 0`,
      [s(b.replyTo), id],
    );
    if (!parent || (await blockedEither(accountId, s(parent.author)))) return fail(404, "gone");
    replyTo = s(parent.reply_to) || s(parent.id);
    parentAuthor = s(parent.author);
  }
  if (!(await limit(accountId, "comment", now))) return fail(429, "slow");
  const cid = newId();
  await run("INSERT INTO post_comments (id, post_id, account_id, created_at, body, hidden, reply_to) VALUES (?, ?, ?, ?, ?, 0, ?)", [
    cid,
    id,
    accountId,
    now,
    text.text,
    replyTo,
  ]);
  const told = new Set([accountId]);
  if (!told.has(post.author)) {
    told.add(post.author);
    await notify(post.author, accountId, "comment", { text: text.text });
  }
  for (const h of mentionsIn(text.text)) {
    const p = await byHandle(h);
    const them = p ? s(p.account_id) : "";
    if (!p || told.has(them) || n(p.suspended) || (await blockedEither(accountId, them)) || !(await visiblePost(them, id))) continue;
    told.add(them);
    await run("INSERT OR IGNORE INTO comment_mentions (comment_id, post_id, account_id, created_at) VALUES (?, ?, ?, ?)", [
      cid,
      id,
      them,
      now,
    ]);
    await notify(them, accountId, "mention", { text: text.text });
  }
  if (parentAuthor && !told.has(parentAuthor) && (await visiblePost(parentAuthor, id)))
    await notify(parentAuthor, accountId, "reply", { text: text.text });
  return ok({
    comment: {
      id: cid,
      handle: s(mine.handle),
      name: s(mine.name),
      avatar: avatarOf(mine.avatar),
      at: now,
      body: text.text,
      mine: true,
      canDelete: true,
      ...(replyTo ? { replyTo } : {}),
    },
  });
}

/** Who liked a post the lifter may see, newest first, without anyone blocked either way. */
export async function likers(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const id = s(b.id);
  if (!(await visiblePost(accountId, id))) return fail(404, "gone");
  const rows = await query(
    `SELECT sp.handle AS handle, sp.name AS name, sp.avatar AS avatar FROM post_likes l
     JOIN social_profiles sp ON sp.account_id = l.account_id
     WHERE l.post_id = ?1 AND sp.suspended = 0 AND ${NOT_BLOCKED("sp.account_id", "?2")}
     ORDER BY l.created_at DESC LIMIT 500`,
    [id, accountId],
  );
  return ok({ people: rows.map(toRow) });
}

/** Deletes a comment: the lifter's own, or any comment on their own post. */
export async function uncomment(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const gone = await run(
    `DELETE FROM post_comments WHERE id = ? AND (account_id = ? OR post_id IN (SELECT id FROM posts WHERE account_id = ?))`,
    [s(b.id), accountId, accountId],
  );
  if (gone) await run("DELETE FROM comment_mentions WHERE comment_id = ?", [s(b.id)]);
  return ok();
}

// --- Activity ---

const ACTIVITY = `
  SELECT 'follow' AS kind, f.follower_id AS who, f.created_at AS at, NULL AS post_id, NULL AS text
    FROM follows f WHERE f.followee_id = ?1 AND f.accepted = 1
  UNION ALL
  SELECT 'request', f.follower_id, f.created_at, NULL, NULL FROM follows f WHERE f.followee_id = ?1 AND f.accepted = 0
  UNION ALL
  SELECT 'like', l.account_id, l.created_at, l.post_id, NULL
    FROM post_likes l JOIN posts p ON p.id = l.post_id WHERE p.account_id = ?1 AND l.account_id != ?1
  UNION ALL
  SELECT 'comment', c.account_id, c.created_at, c.post_id, c.body
    FROM post_comments c JOIN posts p ON p.id = c.post_id WHERE p.account_id = ?1 AND c.account_id != ?1 AND c.hidden = 0
  UNION ALL
  SELECT 'sent', w.from_id, w.created_at, w.code, w.name FROM sent_workouts w WHERE w.to_id = ?1
  UNION ALL
  SELECT 'tag', p.account_id, pp.created_at, p.id, NULL
    FROM post_partners pp JOIN posts p ON p.id = pp.post_id WHERE pp.account_id = ?1 AND p.hidden = 0
  UNION ALL
  SELECT 'mention', c.account_id, m.created_at, m.post_id, c.body
    FROM comment_mentions m JOIN post_comments c ON c.id = m.comment_id WHERE m.account_id = ?1 AND c.hidden = 0
  UNION ALL
  SELECT 'reply', c.account_id, c.created_at, c.post_id, c.body
    FROM post_comments c JOIN post_comments pc ON pc.id = c.reply_to JOIN posts p ON p.id = c.post_id
    WHERE pc.account_id = ?1 AND c.account_id != ?1 AND p.account_id != ?1 AND c.hidden = 0
      AND NOT EXISTS (SELECT 1 FROM comment_mentions m WHERE m.comment_id = c.id AND m.account_id = ?1)
  UNION ALL
  SELECT 'challenge', c.owner_id, cm.created_at, NULL, c.name
    FROM challenge_members cm JOIN challenges c ON c.id = cm.challenge_id
    WHERE cm.account_id = ?1 AND cm.status = 'invited' AND c.owner_id != ?1`;
const ACTIVITY_VISIBLE = `a JOIN social_profiles sp ON sp.account_id = a.who
  WHERE sp.suspended = 0 AND a.who NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?1)`;

async function unreadCount(accountId: string, seenAt: number): Promise<number> {
  const [r] = await query(`SELECT COUNT(*) AS n FROM (${ACTIVITY}) ${ACTIVITY_VISIBLE} AND a.at > ?2`, [accountId, seenAt]);
  return n(r?.n);
}

/** What happened to the lifter lately (new followers, requests, likes, comments), and marks it all seen. */
export async function activity(accountId: string, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const rows = await query(
    `SELECT a.kind AS kind, a.at AS at, a.post_id AS post_id, a.text AS text, sp.handle AS handle, sp.name AS name, sp.avatar AS avatar
     FROM (${ACTIVITY}) ${ACTIVITY_VISIBLE} ORDER BY a.at DESC LIMIT 60`,
    [accountId],
  );
  const items: ActivityItem[] = rows.map((r) => ({
    kind: s(r.kind) as ActivityItem["kind"],
    handle: s(r.handle),
    name: s(r.name),
    avatar: avatarOf(r.avatar),
    at: n(r.at),
    // A sent workout carries its routine code where a like or comment carries the post.
    ...(r.post_id ? (s(r.kind) === "sent" ? { code: s(r.post_id) } : { postId: s(r.post_id) }) : {}),
    ...(r.text ? { text: s(r.text) } : {}),
  }));
  const seenAt = n(mine.seen_at);
  await run("UPDATE social_profiles SET seen_at = ? WHERE account_id = ?", [now, accountId]);
  return ok({ items, seenAt });
}

// --- The one route ---

type Op = (accountId: string, b: Record<string, unknown>, now?: number) => Promise<Result>;
// --- Sending a workout to a friend ---

/** A routine share code (routineShare.ts): `r1~<name>~<exercise>.<sets>[.s]~…`. The app checks the exercises when it opens. */
const CODE_RE = /^r1~[A-Za-z0-9_-]{0,220}(~[A-Za-z0-9_-]{1,80}\.(10|[1-9])(\.s)?){1,20}$/;

/**
 * Sends a workout (as a routine code, so nothing personal) to someone the lifter and they both follow. It shows in
 * their Activity with the name, and opening it shows the routine with Save. Blocking either way stops it.
 */
export async function send(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  if (n(mine.suspended)) return fail(403, "suspended");
  const code = s(b.code);
  if (!CODE_RE.test(code)) return fail(400, "code");
  // The name is read from the code itself, so what the friend sees when they open it went through the filter too.
  const raw = Buffer.from(code.split("~")[1] ?? "", "base64url").toString("utf8");
  const name = raw.trim() ? checkText(raw, SOCIAL_LIMITS.name) : ({ ok: true, text: "" } as const);
  if (!name.ok) return fail(400, `name.${name.error}`);
  const p = await byHandle(s(b.handle));
  const to = p ? s(p.account_id) : "";
  if (!p || n(p.suspended) || to === accountId || (await blockedEither(accountId, to))) return fail(404, "noOne");
  const there = await follow(accountId, to);
  const back = await follow(to, accountId);
  if (!there?.accepted || !back?.accepted) return fail(403, "notFriends");
  if (!(await limit(accountId, "send", now))) return fail(429, "slow");
  await run("INSERT INTO sent_workouts (id, from_id, to_id, name, code, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
    newId(),
    accountId,
    to,
    name.text,
    code,
    now,
  ]);
  await notify(to, accountId, "sent", { workout: name.text, code });
  return ok();
}

// --- Invite links ---

/** The lifter's invite code: the live one, or a new one. Anyone who accepts it and the lifter follow each other. */
export async function invite(accountId: string, _b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  if (n(mine.suspended)) return fail(403, "suspended");
  const [live] = await query("SELECT code, expires_at FROM social_invites WHERE account_id = ? AND expires_at > ? AND uses < ?", [
    accountId,
    now,
    INVITE.uses,
  ]);
  if (live) return ok({ code: s(live.code), expiresAt: n(live.expires_at) });
  if (!(await limit(accountId, "invite", now))) return fail(429, "slow");
  const code = newCode();
  await batch([
    { sql: "DELETE FROM social_invites WHERE account_id = ?", args: [accountId] },
    {
      sql: "INSERT INTO social_invites (code, account_id, created_at, expires_at, uses) VALUES (?, ?, ?, ?, 0)",
      args: [code, accountId, now, now + INVITE.ttl],
    },
  ]);
  return ok({ code, expiresAt: now + INVITE.ttl });
}

/** Who an invite is from, or null when it's unknown, used up, expired, or its owner is suspended or blocked. */
async function inviter(accountId: string, code: string, now: number): Promise<ProfileRow | null> {
  const c = cleanCode(code);
  if (!c) return null;
  const [r] = await query("SELECT account_id FROM social_invites WHERE code = ? AND expires_at > ? AND uses < ?", [c, now, INVITE.uses]);
  if (!r) return null;
  const p = await profileOf(s(r.account_id));
  if (!p || n(p.suspended) || (await blockedEither(accountId, s(p.account_id)))) return null;
  return p;
}

/** What the invite screen shows before the lifter accepts. Signed in is enough: they may not have joined yet. */
export async function inviteInfo(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  if (!(await limit(accountId, "lookup", now))) return fail(429, "slow");
  const p = await inviter(accountId, s(b.code), now);
  if (!p) return fail(404, "invite");
  const self = s(p.account_id) === accountId;
  return ok({ inviter: { handle: s(p.handle), name: s(p.name), avatar: avatarOf(p.avatar) }, self });
}

/**
 * Accepts an invite: the two lifters follow each other, accepted both ways, whatever their follow settings,
 * because one sent the link and the other chose to open and accept it. The inviter hears they have a new follower.
 */
export async function acceptInvite(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  if (n(mine.suspended)) return fail(403, "suspended");
  const p = await inviter(accountId, s(b.code), now);
  if (!p) return fail(404, "invite");
  const them = s(p.account_id);
  if (them === accountId) return fail(400, "self");
  if (!(await limit(accountId, "follow", now))) return fail(429, "slow");
  const had = await follow(accountId, them);
  await batch([
    {
      sql: "INSERT OR REPLACE INTO follows (follower_id, followee_id, accepted, created_at) VALUES (?, ?, 1, ?)",
      args: [accountId, them, now],
    },
    {
      sql: "INSERT OR REPLACE INTO follows (follower_id, followee_id, accepted, created_at) VALUES (?, ?, 1, ?)",
      args: [them, accountId, now],
    },
    { sql: "UPDATE social_invites SET uses = uses + 1 WHERE code = ?", args: [cleanCode(b.code)] },
  ]);
  if (!had?.accepted) await notify(them, accountId, "follow");
  return ok({ handle: s(p.handle) });
}

// --- The friends leaderboard ---

/**
 * This week's board: the lifter and everyone they follow, with the workouts each has posted since `from` (the
 * week's start in the lifter's own time zone) that the lifter may see, and their sets, minutes and volume.
 * Built from posts only, so an unposted workout never shows, and each post's audience still holds.
 */
export async function board(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const from = Number(b.from);
  if (!Number.isFinite(from) || from > now + day || from < now - 60 * day) return fail(400, "Bad request.");
  const rows = await query(
    `SELECT sp.account_id AS id, sp.handle AS handle, sp.name AS name, sp.avatar AS avatar,
       COUNT(p.id) AS workouts,
       COALESCE(SUM(json_extract(p.body, '$.sets')), 0) AS sets,
       COALESCE(SUM(json_extract(p.body, '$.seconds')), 0) AS seconds,
       COALESCE(SUM(json_extract(p.body, '$.volume')), 0) AS volume,
       COALESCE(SUM(json_extract(p.body, '$.prs')), 0) AS prs
     FROM social_profiles sp
     LEFT JOIN posts p ON p.account_id = sp.account_id AND p.hidden = 0 AND p.at >= ?2 AND p.at < ?3 AND ${seesPost("?1")}
     WHERE sp.suspended = 0
       AND (sp.account_id = ?1 OR sp.account_id IN (SELECT followee_id FROM follows WHERE follower_id = ?1 AND accepted = 1))
       AND sp.account_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?1)
       AND sp.account_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?1)
     GROUP BY sp.account_id LIMIT 201`,
    [accountId, from, from + 7 * day],
  );
  return ok({
    rows: rows.map((r) => ({
      handle: s(r.handle),
      name: s(r.name),
      avatar: avatarOf(r.avatar),
      me: s(r.id) === accountId,
      workouts: n(r.workouts),
      sets: n(r.sets),
      minutes: Math.round(n(r.seconds) / 60),
      volume: Math.round(n(r.volume)),
      prs: n(r.prs),
    })),
  });
}

// --- Friend challenges ---

/** How each measure is scored from a member's posts in the window (the same sums as the board). */
const SCORE: Record<BoardMetric, string> = {
  workouts: "COUNT(p.id)",
  sets: "COALESCE(SUM(json_extract(p.body, '$.sets')), 0)",
  minutes: "COALESCE(SUM(json_extract(p.body, '$.seconds')), 0) / 60",
  volume: "COALESCE(SUM(json_extract(p.body, '$.volume')), 0)",
};
/** Finished challenges stay on the list this long, so everyone sees who won. */
export const CHALLENGE_KEEP = 14 * day;

/**
 * Starts a challenge: a name, one measure, 1, 2 or 4 weeks from now, and mutual friends to invite (up to 19).
 * The starter is in it from the start; the others are invited and score once they join.
 */
export async function challengeCreate(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  if (n(mine.suspended)) return fail(403, "suspended");
  const name = checkText(b.name, SOCIAL_LIMITS.challengeName);
  if (!name.ok) return fail(400, `name.${name.error}`);
  if (!name.text) return fail(400, "Bad request.");
  const metric = BOARD_METRICS.find((m) => m === b.metric);
  const days = CHALLENGE_DAYS.find((d) => d === Number(b.days));
  if (!metric || !days) return fail(400, "Bad request.");
  const ids = await friendIds(accountId, b.handles, SOCIAL_LIMITS.challengeMembers - 1);
  if (!ids.length) return fail(400, "notFriends");
  const [running] = await query("SELECT COUNT(*) AS n FROM challenges WHERE owner_id = ? AND ends_at > ?", [accountId, now]);
  if (n(running?.n) >= SOCIAL_LIMITS.challengesActive) return fail(429, "tooMany");
  if (!(await limit(accountId, "challenge", now))) return fail(429, "slow");
  const id = newId();
  await batch([
    {
      sql: "INSERT INTO challenges (id, owner_id, name, metric, starts_at, ends_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [id, accountId, name.text, metric, now, now + days * day, now],
    },
    {
      sql: "INSERT INTO challenge_members (challenge_id, account_id, status, created_at) VALUES (?, ?, 'joined', ?)",
      args: [id, accountId, now],
    },
    ...ids.map((m) => ({
      sql: "INSERT INTO challenge_members (challenge_id, account_id, status, created_at) VALUES (?, ?, 'invited', ?)",
      args: [id, m, now] as (string | number)[],
    })),
  ]);
  for (const m of ids) await notify(m, accountId, "challenge", { workout: name.text });
  return ok({ id });
}

/**
 * The lifter's challenges, running and lately finished, with everyone's score so far. A joined member's score
 * comes from the workouts they posted in the window to anyone but themselves; joining says the totals are
 * shown to the other members (never the posts themselves). Someone blocked either way is left out.
 */
export async function challenges(accountId: string, _b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const list = await query(
    `SELECT c.id AS id, c.name AS name, c.metric AS metric, c.starts_at AS starts_at, c.ends_at AS ends_at, c.owner_id AS owner_id,
       op.handle AS owner_handle, op.name AS owner_name, cm.status AS status
     FROM challenge_members cm JOIN challenges c ON c.id = cm.challenge_id JOIN social_profiles op ON op.account_id = c.owner_id
     WHERE cm.account_id = ? AND c.ends_at > ? AND op.suspended = 0
     ORDER BY c.ends_at LIMIT 30`,
    [accountId, now - CHALLENGE_KEEP],
  );
  const out: Challenge[] = [];
  for (const c of list) {
    const metric = BOARD_METRICS.find((m) => m === c.metric) ?? "workouts";
    const rows = await query(
      `SELECT sp.account_id AS id, sp.handle AS handle, sp.name AS name, sp.avatar AS avatar, cm.status AS status,
         CASE WHEN cm.status = 'joined' THEN (SELECT ${SCORE[metric]} FROM posts p
           WHERE p.account_id = cm.account_id AND p.hidden = 0 AND p.audience != 'me' AND p.at >= ?2 AND p.at < ?3) ELSE 0 END AS value
       FROM challenge_members cm JOIN social_profiles sp ON sp.account_id = cm.account_id
       WHERE cm.challenge_id = ?1 AND sp.suspended = 0
         AND sp.account_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?4)
         AND sp.account_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?4)`,
      [s(c.id), n(c.starts_at), n(c.ends_at), accountId],
    );
    out.push({
      id: s(c.id),
      name: s(c.name),
      metric,
      startsAt: n(c.starts_at),
      endsAt: n(c.ends_at),
      owner: { handle: s(c.owner_handle), name: s(c.owner_name) },
      mine: s(c.owner_id) === accountId,
      status: s(c.status) === "joined" ? "joined" : "invited",
      members: rows.map((r) => ({
        handle: s(r.handle),
        name: s(r.name),
        avatar: avatarOf(r.avatar),
        me: s(r.id) === accountId,
        joined: s(r.status) === "joined",
        value: Math.round(n(r.value)),
      })),
    });
  }
  return ok({ challenges: out });
}

/** Joins a challenge the lifter was invited to, or declines it (which takes them off it). */
export async function challengeAnswer(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const [c] = await query(
    `SELECT c.ends_at AS ends_at FROM challenge_members cm JOIN challenges c ON c.id = cm.challenge_id
     WHERE cm.challenge_id = ? AND cm.account_id = ? AND cm.status = 'invited'`,
    [s(b.id), accountId],
  );
  if (!c || n(c.ends_at) <= now) return fail(404, "gone");
  if (b.accept === true)
    await run("UPDATE challenge_members SET status = 'joined' WHERE challenge_id = ? AND account_id = ?", [s(b.id), accountId]);
  else await run("DELETE FROM challenge_members WHERE challenge_id = ? AND account_id = ?", [s(b.id), accountId]);
  return ok();
}

/** Leaves a challenge. The starter leaving ends it for everyone. */
export async function challengeLeave(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const id = s(b.id);
  const [c] = await query("SELECT owner_id FROM challenges WHERE id = ?", [id]);
  if (!c) return ok();
  if (s(c.owner_id) === accountId)
    await batch([
      { sql: "DELETE FROM challenge_members WHERE challenge_id = ?", args: [id] },
      { sql: "DELETE FROM challenges WHERE id = ?", args: [id] },
    ]);
  else await run("DELETE FROM challenge_members WHERE challenge_id = ? AND account_id = ?", [id, accountId]);
  return ok();
}

// --- Clubs and gym crews ---

/** A free club code (8 characters, the same alphabet as invites), tried a few times in case of a clash. */
async function freeClubCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    const [had] = await query("SELECT 1 AS x FROM clubs WHERE code = ?", [code]);
    if (!had) return code;
  }
  return newCode();
}

async function clubCount(accountId: string): Promise<number> {
  const [r] = await query("SELECT COUNT(*) AS n FROM club_members WHERE account_id = ?", [accountId]);
  return n(r?.n);
}

/** Starts a club: a name, and the lifter is its first member and runs it. */
export async function clubCreate(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  if (n(mine.suspended)) return fail(403, "suspended");
  const name = checkText(b.name, SOCIAL_LIMITS.clubName);
  if (!name.ok) return fail(400, `name.${name.error}`);
  if (!name.text) return fail(400, "Bad request.");
  if ((await clubCount(accountId)) >= SOCIAL_LIMITS.clubsEach) return fail(429, "clubs");
  if (!(await limit(accountId, "club", now))) return fail(429, "slow");
  const id = newId();
  const code = await freeClubCode();
  await batch([
    { sql: "INSERT INTO clubs (id, owner_id, name, code, created_at) VALUES (?, ?, ?, ?, ?)", args: [id, accountId, name.text, code, now] },
    { sql: "INSERT INTO club_members (club_id, account_id, created_at) VALUES (?, ?, ?)", args: [id, accountId, now] },
  ]);
  return ok({ id, code });
}

/** The lifter's clubs, with how many are in each. */
export async function clubs(accountId: string): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const rows = await query(
    `SELECT c.id AS id, c.name AS name, c.owner_id AS owner_id,
       (SELECT COUNT(*) FROM club_members m JOIN social_profiles sp ON sp.account_id = m.account_id
         WHERE m.club_id = c.id AND sp.suspended = 0) AS members
     FROM club_members cm JOIN clubs c ON c.id = cm.club_id WHERE cm.account_id = ? ORDER BY c.name LIMIT 50`,
    [accountId],
  );
  const list: ClubSummary[] = rows.map((r) => ({
    id: s(r.id),
    name: s(r.name),
    members: n(r.members),
    mine: s(r.owner_id) === accountId,
  }));
  return ok({ clubs: list });
}

/**
 * One club, for a member: who's in it and this week's board from what each member posted to anyone but
 * themselves since `from` (the week's start in the lifter's time zone). Totals only, like a challenge; the
 * join screen says so. Someone blocked either way is left off the reader's view.
 */
export async function club(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  const from = Number(b.from);
  if (!Number.isFinite(from) || from > now + day || from < now - 60 * day) return fail(400, "Bad request.");
  const [c] = await query(
    `SELECT c.id AS id, c.name AS name, c.code AS code, c.owner_id AS owner_id, op.handle AS owner_handle, op.name AS owner_name
     FROM clubs c JOIN club_members cm ON cm.club_id = c.id AND cm.account_id = ? JOIN social_profiles op ON op.account_id = c.owner_id
     WHERE c.id = ?`,
    [accountId, s(b.id)],
  );
  if (!c) return fail(404, "gone");
  const rows = await query(
    `SELECT sp.account_id AS id, sp.handle AS handle, sp.name AS name, sp.avatar AS avatar,
       COUNT(p.id) AS workouts,
       COALESCE(SUM(json_extract(p.body, '$.sets')), 0) AS sets,
       COALESCE(SUM(json_extract(p.body, '$.seconds')), 0) AS seconds,
       COALESCE(SUM(json_extract(p.body, '$.volume')), 0) AS volume,
       COALESCE(SUM(json_extract(p.body, '$.prs')), 0) AS prs
     FROM club_members cm JOIN social_profiles sp ON sp.account_id = cm.account_id
     LEFT JOIN posts p ON p.account_id = cm.account_id AND p.hidden = 0 AND p.audience != 'me' AND p.at >= ?3 AND p.at < ?4
     WHERE cm.club_id = ?1 AND sp.suspended = 0
       AND sp.account_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?2)
       AND sp.account_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?2)
     GROUP BY sp.account_id LIMIT ${SOCIAL_LIMITS.clubMembers + 1}`,
    [s(c.id), accountId, from, from + 7 * day],
  );
  const detail: ClubDetail = {
    id: s(c.id),
    name: s(c.name),
    code: s(c.code),
    mine: s(c.owner_id) === accountId,
    owner: { handle: s(c.owner_handle), name: s(c.owner_name) },
    members: rows.length,
    rows: rows.map((r) => ({
      handle: s(r.handle),
      name: s(r.name),
      avatar: avatarOf(r.avatar),
      me: s(r.id) === accountId,
      workouts: n(r.workouts),
      sets: n(r.sets),
      minutes: Math.round(n(r.seconds) / 60),
      volume: Math.round(n(r.volume)),
      prs: n(r.prs),
    })),
  };
  return ok({ club: detail });
}

async function clubByCode(code: unknown): Promise<Row | null> {
  const c = cleanCode(code);
  if (!c) return null;
  const [r] = await query("SELECT id, name, owner_id FROM clubs WHERE code = ?", [c]);
  return r ?? null;
}

/** What a club link shows before joining. */
export async function clubInfo(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  if (!(await limit(accountId, "lookup", now))) return fail(429, "slow");
  const c = await clubByCode(b.code);
  const owner = c ? await profileOf(s(c.owner_id)) : null;
  if (!c || !owner || n(owner.suspended) || (await blockedEither(accountId, s(c.owner_id)))) return fail(404, "club");
  const [m] = await query(
    `SELECT COUNT(*) AS n, SUM(CASE WHEN cm.account_id = ? THEN 1 ELSE 0 END) AS me
     FROM club_members cm JOIN social_profiles sp ON sp.account_id = cm.account_id WHERE cm.club_id = ? AND sp.suspended = 0`,
    [accountId, s(c.id)],
  );
  const preview: ClubPreview = {
    id: s(c.id),
    name: s(c.name),
    members: n(m?.n),
    owner: { handle: s(owner.handle), name: s(owner.name) },
    joined: n(m?.me) > 0,
  };
  return ok({ club: preview });
}

/** Joins a club by its code. A club the lifter is blocked from (by its starter) can't be joined. */
export async function clubJoin(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  if (n(mine.suspended)) return fail(403, "suspended");
  const c = await clubByCode(b.code);
  if (!c || (await blockedEither(accountId, s(c.owner_id)))) return fail(404, "club");
  const id = s(c.id);
  const [had] = await query("SELECT 1 AS x FROM club_members WHERE club_id = ? AND account_id = ?", [id, accountId]);
  if (had) return ok({ id });
  if ((await clubCount(accountId)) >= SOCIAL_LIMITS.clubsEach) return fail(429, "clubs");
  const [size] = await query("SELECT COUNT(*) AS n FROM club_members WHERE club_id = ?", [id]);
  if (n(size?.n) >= SOCIAL_LIMITS.clubMembers) return fail(403, "clubFull");
  if (!(await limit(accountId, "follow", now))) return fail(429, "slow");
  await run("INSERT OR IGNORE INTO club_members (club_id, account_id, created_at) VALUES (?, ?, ?)", [id, accountId, now]);
  return ok({ id });
}

/** Leaves a club. The starter leaving deletes it for everyone. */
export async function clubLeave(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const id = s(b.id);
  const [c] = await query("SELECT owner_id FROM clubs WHERE id = ?", [id]);
  if (!c) return ok();
  if (s(c.owner_id) === accountId)
    await batch([
      { sql: "DELETE FROM club_members WHERE club_id = ?", args: [id] },
      { sql: "DELETE FROM clubs WHERE id = ?", args: [id] },
    ]);
  else await run("DELETE FROM club_members WHERE club_id = ? AND account_id = ?", [id, accountId]);
  return ok();
}

/** The starter's tools: remove a member, or give the club a new code (the old link stops working). */
export async function clubManage(accountId: string, b: Record<string, unknown>): Promise<Result> {
  const id = s(b.id);
  const [c] = await query("SELECT owner_id FROM clubs WHERE id = ?", [id]);
  if (!c || s(c.owner_id) !== accountId) return fail(404, "gone");
  if (b.newCode === true) {
    const code = await freeClubCode();
    await run("UPDATE clubs SET code = ? WHERE id = ?", [code, id]);
    return ok({ code });
  }
  const p = await byHandle(s(b.remove));
  if (!p || s(p.account_id) === accountId) return fail(404, "noOne");
  await run("DELETE FROM club_members WHERE club_id = ? AND account_id = ?", [id, s(p.account_id)]);
  return ok();
}

/** A phone's push token, so this account's Friends notifications reach it (push.ts). */
export async function pushToken(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  return (await saveToken(accountId, s(b.token), s(b.platform), s(b.lang), now)) ? ok() : fail(400, "token");
}

export const OPS: Record<string, Op> = {
  me: (a) => me(a),
  join,
  update: (a, b) => update(a, b),
  leave: (a) => leave(a),
  lookup,
  search,
  suggest: (a) => suggest(a),
  unsuggest,
  personPeople: (a, b) => personPeople(a, b),
  likers: (a, b) => likers(a, b),
  follow: followOp,
  unfollow: (a, b) => unfollow(a, b),
  answer: (a, b) => answer(a, b),
  people: (a, b) => people(a, b),
  block,
  unblock: (a, b) => unblock(a, b),
  mute,
  report,
  post,
  unpost: (a, b) => unpost(a, b),
  editPost: (a, b) => editPost(a, b),
  posted: (a, b) => posted(a, b),
  feed: (a, b) => feed(a, b),
  person: (a, b) => personPosts(a, b),
  thread: (a, b) => thread(a, b),
  like,
  comment,
  uncomment: (a, b) => uncomment(a, b),
  activity: (a, _b, now) => activity(a, now),
  send,
  invite,
  inviteInfo,
  acceptInvite,
  board,
  challengeCreate,
  challenges,
  challengeAnswer,
  challengeLeave: (a, b) => challengeLeave(a, b),
  untag: (a, b) => untag(a, b),
  clubCreate,
  clubs: (a) => clubs(a),
  club,
  clubInfo,
  clubJoin,
  clubLeave: (a, b) => clubLeave(a, b),
  clubManage: (a, b) => clubManage(a, b),
  pushToken,
  pushOff: async (a, b) => (await dropToken(a, s(b.token)), ok()),
};

export async function handle(accountId: string, body: unknown, now = Date.now()): Promise<Result> {
  if (!body || typeof body !== "object") return fail(400, "Bad request.");
  const b = body as Record<string, unknown>;
  const op = Object.prototype.hasOwnProperty.call(OPS, s(b.op)) ? OPS[s(b.op)] : undefined;
  if (!op) return fail(400, "Unknown op.");
  return op(accountId, b, now);
}

// --- Staff: the Reports queue on the admin panel ---

export interface ReportGroup {
  kind: ReportKind;
  targetId: string;
  reports: number;
  reasons: Record<string, number>;
  notes: string[];
  firstAt: number;
  lastAt: number;
  /** What was reported: the comment's text, the post's summary line, or the profile's name. */
  content: string;
  author: { accountId: string; handle: string; name: string; suspended: boolean } | null;
  hidden: boolean;
}

export async function adminReports(): Promise<ReportGroup[]> {
  const rows = await query(
    `SELECT kind, target_id, COUNT(*) AS n, MIN(created_at) AS first_at, MAX(created_at) AS last_at,
       GROUP_CONCAT(reason) AS reasons, GROUP_CONCAT(NULLIF(note, ''), ' | ') AS notes
     FROM reports WHERE status = 'open' GROUP BY kind, target_id ORDER BY n DESC, last_at DESC LIMIT 200`,
  );
  const out: ReportGroup[] = [];
  for (const r of rows) {
    const kind = s(r.kind) as ReportKind;
    const target = s(r.target_id);
    let content = "";
    let authorId = "";
    let hidden = false;
    if (kind === "post") {
      const [p] = await query("SELECT account_id, body, hidden FROM posts WHERE id = ?", [target]);
      authorId = s(p?.account_id);
      hidden = !!n(p?.hidden);
      try {
        const body = JSON.parse(s(p?.body)) as PostBody;
        content = body.exercises.map((e) => e.name || e.id).join(", ");
      } catch {
        content = p ? "" : "(deleted)";
      }
    } else if (kind === "comment") {
      const [c] = await query("SELECT account_id, body, hidden FROM post_comments WHERE id = ?", [target]);
      authorId = s(c?.account_id);
      hidden = !!n(c?.hidden);
      content = c ? s(c.body) : "(deleted)";
    } else authorId = target;
    const [a] = authorId ? await query("SELECT handle, name, suspended FROM social_profiles WHERE account_id = ?", [authorId]) : [];
    if (kind === "profile") content = a ? `@${s(a.handle)} · ${s(a.name)}` : "(left Friends)";
    const reasons: Record<string, number> = {};
    for (const x of s(r.reasons).split(",").filter(Boolean)) reasons[x] = (reasons[x] ?? 0) + 1;
    out.push({
      kind,
      targetId: target,
      reports: n(r.n),
      reasons,
      notes: s(r.notes).split(" | ").filter(Boolean).slice(0, 10),
      firstAt: n(r.first_at),
      lastAt: n(r.last_at),
      content,
      author: a ? { accountId: authorId, handle: s(a.handle), name: s(a.name), suspended: !!n(a.suspended) } : null,
      hidden,
    });
  }
  return out;
}

export type ReportAction = "remove" | "dismiss" | "suspend" | "unsuspend";

/**
 * Staff decide a group of reports: `remove` deletes the post or comment (for a profile, resets its name to its
 * handle), `dismiss` keeps it and shows it again, `suspend` hides everything its author wrote and stops them
 * posting, `unsuspend` undoes that.
 */
export async function resolveReports(kind: ReportKind, targetId: string, action: ReportAction): Promise<boolean> {
  if (!REPORT_KINDS.has(kind) || !targetId) return false;
  const table = kind === "post" ? "posts" : kind === "comment" ? "post_comments" : null;
  let author = kind === "profile" ? targetId : "";
  if (table) author = s((await query(`SELECT account_id FROM ${table} WHERE id = ?`, [targetId]))[0]?.account_id);
  const close = (status: string) => ({
    sql: "UPDATE reports SET status = ? WHERE kind = ? AND target_id = ? AND status = 'open'",
    args: [status, kind, targetId],
  });
  switch (action) {
    case "remove":
      if (kind === "post")
        await batch([
          { sql: "DELETE FROM post_likes WHERE post_id = ?", args: [targetId] },
          { sql: "DELETE FROM post_comments WHERE post_id = ?", args: [targetId] },
          { sql: "DELETE FROM posts WHERE id = ?", args: [targetId] },
          close("removed"),
        ]);
      else if (kind === "comment") await batch([{ sql: "DELETE FROM post_comments WHERE id = ?", args: [targetId] }, close("removed")]);
      else await batch([{ sql: "UPDATE social_profiles SET name = handle WHERE account_id = ?", args: [targetId] }, close("removed")]);
      return true;
    case "dismiss":
      await batch([...(table ? [{ sql: `UPDATE ${table} SET hidden = 0 WHERE id = ?`, args: [targetId] }] : []), close("dismissed")]);
      return true;
    case "suspend":
    case "unsuspend":
      if (!author) return false;
      await batch([
        { sql: "UPDATE social_profiles SET suspended = ? WHERE account_id = ?", args: [action === "suspend" ? 1 : 0, author] },
        ...(action === "suspend" ? [close("suspended")] : []),
      ]);
      return true;
    default:
      return false;
  }
}

/** For the admin Users page and the morning digest: how many reports wait. */
export async function openReportCount(): Promise<number> {
  const [r] = await query("SELECT COUNT(DISTINCT kind || ':' || target_id) AS n FROM reports WHERE status = 'open'");
  return n(r?.n);
}
