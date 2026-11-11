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
  cleanHandle,
  HANDLE_RE,
  REPORT_REASONS,
  SOCIAL_LIMITS,
  type ActivityItem,
  type Audience,
  type FeedComment,
  type FeedPost,
  type PersonCard,
  type PostBody,
  type PostExercise,
  type Relation,
  type ReportKind,
  type ShowcaseLift,
  type SocialProfile,
} from "@/lib/socialTypes";

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
export const DAILY = { follow: 100, post: 20, comment: 100, like: 500, report: 30, lookup: 300, send: 50 };
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
});

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
         push_follows = ?, push_comments = ?, push_sent = ?, push_likes = ?, avatar = ?, audience = ?, show_lifts = ?, lifts = ?
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
    { sql: `DELETE FROM post_likes WHERE post_id IN (${mine})`, args: a },
    { sql: `DELETE FROM post_comments WHERE post_id IN (${mine})`, args: a },
    { sql: "DELETE FROM posts WHERE account_id = ?", args: a },
    { sql: "DELETE FROM post_likes WHERE account_id = ?", args: a },
    { sql: "DELETE FROM post_comments WHERE account_id = ?", args: a },
    { sql: "DELETE FROM follows WHERE follower_id = ? OR followee_id = ?", args: [accountId, accountId] },
    { sql: "DELETE FROM blocks WHERE blocker_id = ? OR blocked_id = ?", args: [accountId, accountId] },
    { sql: "DELETE FROM mutes WHERE muter_id = ? OR muted_id = ?", args: [accountId, accountId] },
    { sql: "DELETE FROM reports WHERE reporter_id = ?", args: a },
    { sql: "DELETE FROM sent_workouts WHERE from_id = ? OR to_id = ?", args: [accountId, accountId] },
    { sql: "DELETE FROM push_tokens WHERE account_id = ?", args: a },
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
async function card(viewer: string, p: ProfileRow): Promise<PersonCard | null> {
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
  };
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
  const c = p ? await card(accountId, p) : null;
  return c ? ok({ person: c }) : fail(404, "noOne");
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
    exercises.push({ id, name: name.ok ? name.text : "", sets: Math.round(setCount), w: kg, r: Math.round(r), ...(d ? { d } : {}) });
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
  return ok({ id: s(row?.id ?? id) });
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
  return ok({ id: s(row.id), caption: caption.text, audience });
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
  return ok({
    posted: Object.fromEntries(rows.map((r) => [s(r.workout_id), s(r.id)])),
    details: Object.fromEntries(rows.map((r) => [s(r.workout_id), { caption: s(r.caption), audience: audienceOf(r.audience) }])),
  });
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
  };
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
  const posts = rows.map((r) => toPost(accountId, r)).filter((p): p is FeedPost => !!p);
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
  return ok({ posts: rows.map((r) => toPost(accountId, r)).filter(Boolean), more: rows.length === PAGE });
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
       sp.avatar AS avatar
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
  }));
  return ok({ post: row ? toPost(accountId, row) : null, comments });
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

export async function comment(accountId: string, b: Record<string, unknown>, now = Date.now()): Promise<Result> {
  const mine = await joined(accountId);
  if (isResult(mine)) return mine;
  if (n(mine.suspended)) return fail(403, "suspended");
  const id = s(b.id);
  if (!(await visiblePost(accountId, id))) return fail(404, "gone");
  const text = checkText(b.text, SOCIAL_LIMITS.comment);
  if (!text.ok) return fail(400, `comment.${text.error}`);
  if (!(await limit(accountId, "comment", now))) return fail(429, "slow");
  const cid = newId();
  await run("INSERT INTO post_comments (id, post_id, account_id, created_at, body, hidden) VALUES (?, ?, ?, ?, ?, 0)", [
    cid,
    id,
    accountId,
    now,
    text.text,
  ]);
  const post = await visiblePost(accountId, id);
  if (post) await notify(post.author, accountId, "comment", { text: text.text });
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
    },
  });
}

/** Deletes a comment: the lifter's own, or any comment on their own post. */
export async function uncomment(accountId: string, b: Record<string, unknown>): Promise<Result> {
  await run(`DELETE FROM post_comments WHERE id = ? AND (account_id = ? OR post_id IN (SELECT id FROM posts WHERE account_id = ?))`, [
    s(b.id),
    accountId,
    accountId,
  ]);
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
  SELECT 'sent', w.from_id, w.created_at, w.code, w.name FROM sent_workouts w WHERE w.to_id = ?1`;
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
