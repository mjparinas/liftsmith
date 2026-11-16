// Ratings and reviews of coaches, personal trainers and physios (Melvin, 2026-11-15: "a rating system for coaches";
// docs/decisions/coach-reviews.md). The rules:
// - Only a coach's own client can review them, and only once they've worked together long enough to know: four weeks
//   linked, or two sessions paid or held (coach_payments, booked coach_slots that have ended). One review per client
//   and coach, which they can change or delete; it stays after they stop working together.
// - Only adults: a client under 18 (by profile birth year or a school team, teams.ts isMinor) can't leave one.
// - One to five stars, and a short review that goes through the same word and link filter as Friends.
// - The coach can post one public reply to each review, and change or clear it.
// - Nobody sees a coach's rating or reviews until they have REVIEW_MIN, so one unhappy client can't sink a new coach.
//   The coach sees their own from the first one, so they can reply.
// - Anyone signed in can report a review or a reply; three people reporting hides it until staff decide on the admin
//   Reports tab (social.ts adminReports and resolveReports call reviewReport and resolveReview here).
// - With the rating goes something no review site has: how many of the coach's clients trained in the last two weeks,
//   from their synced workouts, once they have OUTCOME_MIN clients.
import { createHash } from "node:crypto";

import { REASONS_FOR, REPORT_NOTE_MAX } from "@/lib/socialTypes";

import { nameOf } from "./coach";
import { batch, query, rateLimit, run } from "./db";
import { checkText, tidy } from "./moderation";
import { notifyCoach } from "./push";
import { isMinor } from "./teams";

const DAY = 86_400_000;
const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => (v == null ? "" : String(v));

export const REVIEW_LIMITS = {
  /** Days linked before a client can review their coach. */
  days: 28,
  /** Or this many sessions paid for or held. */
  sessions: 2,
  /** Reviews a coach needs before their rating and reviews show to anyone else. */
  shown: 3,
  /** Longest review and reply, in characters. */
  text: 500,
  /** Reviews written or changed per account per day. */
  perDay: 20,
  /** Different people reporting a review or reply before it's hidden for staff to decide. */
  hideAfter: 3,
  /** Clients a coach needs before the "trained in the last two weeks" share shows. */
  outcomeClients: 3,
  /** The window for that share. */
  outcomeDays: 14,
} as const;

/** The public handle of one client's review of one coach: stable, and gives away neither account. */
export const reviewId = (coachId: string, clientId: string) =>
  createHash("sha256").update(`liftsmith-review:${coachId}:${clientId}`).digest("hex").slice(0, 20);
export const isReviewId = (x: unknown): x is string => typeof x === "string" && /^[0-9a-f]{20}$/.test(x);

/** "Jordan P." from "Jordan Park": a reviewer's first name and last initial, or "" (the page then says "A client"). */
export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0]!.slice(0, 30);
  const last = parts.length > 1 ? parts[parts.length - 1]! : "";
  return last ? `${first} ${[...last][0]!.toUpperCase()}.` : first;
}

export interface Review {
  id: string;
  stars: number;
  text: string;
  /** The reviewer's first name and last initial, or "". */
  name: string;
  at: number;
  reply: string;
  replyAt: number;
  /** Only for the coach looking at their own: hidden by reports until staff decide. */
  hidden?: boolean;
}

export interface Rating {
  /** Reviews that count (not hidden by reports). */
  count: number;
  /** The average, to one decimal, once there are REVIEW_LIMITS.shown reviews; null until then. */
  average: number | null;
  /** How many of the coach's clients trained in the last two weeks, once they have enough clients. */
  outcome: { clients: number; active: number } | null;
}

export type ReviewBlock = "notClient" | "teen" | "wait";
export type Eligibility = { ok: true } | { ok: false; why: ReviewBlock; readyAt?: number };

/** Whether this client can review this coach now, and if not, why (and when, if it's a matter of time). */
export async function eligibility(coachId: string, clientId: string, now = Date.now()): Promise<Eligibility> {
  if (coachId === clientId) return { ok: false, why: "notClient" };
  const [link] = await query<{ created_at: number }>("SELECT created_at FROM coach_links WHERE coach_id = ? AND client_id = ?", [
    coachId,
    clientId,
  ]);
  if (!link) return { ok: false, why: "notClient" };
  if (await isMinor(clientId, now)) return { ok: false, why: "teen" };
  const readyAt = n(link.created_at) + REVIEW_LIMITS.days * DAY;
  if (readyAt <= now) return { ok: true };
  const [paid] = await query<{ n: number }>("SELECT COUNT(*) AS n FROM coach_payments WHERE coach_id = ? AND client_id = ?", [
    coachId,
    clientId,
  ]);
  const [held] = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM coach_slots WHERE coach_id = ? AND client_id = ? AND start_at + minutes * 60000 <= ?",
    [coachId, clientId, now],
  );
  if (n(paid?.n) + n(held?.n) >= REVIEW_LIMITS.sessions) return { ok: true };
  return { ok: false, why: "wait", readyAt };
}

type ReviewRow = {
  id: string;
  client_id: string;
  stars: number;
  body: string;
  created_at: number;
  updated_at: number;
  reply: string;
  reply_at: number;
  hidden: number;
  reply_hidden: number;
};

async function toReview(r: ReviewRow, own = false): Promise<Review> {
  return {
    id: s(r.id),
    stars: n(r.stars),
    text: s(r.body),
    name: shortName(await nameOf(s(r.client_id))),
    at: n(r.updated_at),
    // A reply hidden by reports isn't shown to anyone else; the coach still sees it, marked hidden with the review.
    reply: n(r.reply_hidden) && !own ? "" : s(r.reply),
    replyAt: n(r.reply_hidden) && !own ? 0 : n(r.reply_at),
    ...(own && (n(r.hidden) || n(r.reply_hidden)) ? { hidden: true } : {}),
  };
}

export type ReviewResult = { review: Review } | { error: ReviewBlock | "bad" | "slow" | "link" | "words" };

/** A client writes or changes their review. Stars are 1 to 5; the text is optional and filtered like Friends. */
export async function saveReview(
  clientId: string,
  coachId: string,
  stars: unknown,
  text: unknown,
  now = Date.now(),
): Promise<ReviewResult> {
  const st = Number(stars);
  if (!Number.isInteger(st) || st < 1 || st > 5) return { error: "bad" };
  const can = await eligibility(coachId, clientId, now);
  if (!can.ok) return { error: can.why };
  let body = "";
  if (tidy(text, REVIEW_LIMITS.text)) {
    const v = checkText(text, REVIEW_LIMITS.text);
    if (!v.ok) return { error: v.error === "empty" ? "bad" : v.error };
    body = v.text;
  }
  if (!(await rateLimit(`review:${clientId}`, REVIEW_LIMITS.perDay, DAY, now))) return { error: "slow" };
  const id = reviewId(coachId, clientId);
  const [had] = await query("SELECT 1 AS x FROM coach_reviews WHERE id = ?", [id]);
  await run(
    `INSERT INTO coach_reviews (coach_id, client_id, id, stars, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (coach_id, client_id) DO UPDATE SET stars = excluded.stars, body = excluded.body, updated_at = excluded.updated_at`,
    [coachId, clientId, id, st, body, now, now],
  );
  // A new review is told to the coach once; changing it later isn't.
  if (!had) await notifyCoach(coachId, "coachReview", { name: await nameOf(clientId), text: "★".repeat(st) }, "#/trainer/setup");
  const [row] = await query<ReviewRow>("SELECT * FROM coach_reviews WHERE id = ?", [id]);
  return { review: await toReview(row!) };
}

/** A client takes their review down. Any open reports on it go with it. */
export async function deleteReview(clientId: string, coachId: string): Promise<void> {
  const id = reviewId(coachId, clientId);
  await batch([
    { sql: "DELETE FROM coach_reviews WHERE coach_id = ? AND client_id = ?", args: [coachId, clientId] },
    { sql: "DELETE FROM reports WHERE kind = 'review' AND target_id IN (?, ?)", args: [id, `${id}.reply`] },
  ]);
}

/** The coach's one public reply to a review; empty text clears it. */
export async function replyToReview(
  coachId: string,
  id: unknown,
  text: unknown,
  now = Date.now(),
): Promise<{ reply: string } | { error: "gone" | "link" | "words" | "slow" }> {
  if (!isReviewId(id)) return { error: "gone" };
  const [r] = await query("SELECT 1 AS x FROM coach_reviews WHERE id = ? AND coach_id = ?", [id, coachId]);
  if (!r) return { error: "gone" };
  let reply = "";
  if (tidy(text, REVIEW_LIMITS.text)) {
    const v = checkText(text, REVIEW_LIMITS.text);
    if (!v.ok) return { error: v.error === "empty" ? "gone" : v.error };
    reply = v.text;
  }
  if (!(await rateLimit(`review:${coachId}`, REVIEW_LIMITS.perDay * 5, DAY, now))) return { error: "slow" };
  await run("UPDATE coach_reviews SET reply = ?, reply_at = ?, reply_hidden = 0 WHERE id = ? AND coach_id = ?", [
    reply,
    reply ? now : 0,
    id,
    coachId,
  ]);
  // Changing a reply that was reported starts it fresh; the old reports no longer describe it.
  await run("DELETE FROM reports WHERE kind = 'review' AND target_id = ? AND status = 'open'", [`${id}.reply`]);
  return { reply };
}

/** Anyone signed in reports a review (`part` "review") or the coach's reply to it. Three people hide it until staff decide. */
export async function reportReview(
  accountId: string,
  id: unknown,
  part: unknown,
  reason: unknown,
  note: unknown,
  now = Date.now(),
): Promise<{ ok: true } | { error: "gone" | "bad" | "slow" }> {
  if (!isReviewId(id)) return { error: "gone" };
  const why = REASONS_FOR.review.find((r) => r === reason);
  if (!why) return { error: "bad" };
  const reply = part === "reply";
  const [r] = await query<{ coach_id: string; client_id: string; reply: string }>(
    "SELECT coach_id, client_id, reply FROM coach_reviews WHERE id = ?",
    [id],
  );
  if (!r || (reply && !s(r.reply))) return { error: "gone" };
  // Nobody reports their own words.
  if (accountId === s(reply ? r.coach_id : r.client_id)) return { error: "bad" };
  if (!(await rateLimit(`reviewReport:${accountId}`, 30, DAY, now))) return { error: "slow" };
  const target = reply ? `${id}.reply` : id;
  await run(
    "INSERT OR IGNORE INTO reports (reporter_id, kind, target_id, reason, note, created_at, status) VALUES (?, 'review', ?, ?, ?, ?, 'open')",
    [accountId, target, why, tidy(note, REPORT_NOTE_MAX), now],
  );
  const [c] = await query<{ n: number }>(
    "SELECT COUNT(DISTINCT reporter_id) AS n FROM reports WHERE kind = 'review' AND target_id = ? AND status = 'open'",
    [target],
  );
  if (n(c?.n) >= REVIEW_LIMITS.hideAfter) await run(`UPDATE coach_reviews SET ${reply ? "reply_hidden" : "hidden"} = 1 WHERE id = ?`, [id]);
  return { ok: true };
}

/** How many of a coach's current clients trained in the last two weeks, or null with too few clients to say. */
export async function outcomeOf(coachId: string, now = Date.now()): Promise<Rating["outcome"]> {
  const [r] = await query<{ clients: number; active: number }>(
    `SELECT COUNT(*) AS clients,
       SUM(CASE WHEN EXISTS (SELECT 1 FROM sync_events e WHERE e.account_id = l.client_id AND e.at > ? AND e.body LIKE '%"type":"sessionEnd"%')
           THEN 1 ELSE 0 END) AS active
     FROM coach_links l WHERE l.coach_id = ?`,
    [now - REVIEW_LIMITS.outcomeDays * DAY, coachId],
  );
  const clients = n(r?.clients);
  return clients >= REVIEW_LIMITS.outcomeClients ? { clients, active: n(r?.active) } : null;
}

/** A coach's rating: the count, the average once there are enough reviews, and how their clients are training. */
export async function ratingOf(coachId: string, now = Date.now()): Promise<Rating> {
  const [r] = await query<{ c: number; a: number | null }>(
    "SELECT COUNT(*) AS c, AVG(stars) AS a FROM coach_reviews WHERE coach_id = ? AND hidden = 0",
    [coachId],
  );
  const count = n(r?.c);
  return {
    count,
    average: count >= REVIEW_LIMITS.shown ? Math.round(n(r?.a) * 10) / 10 : null,
    outcome: await outcomeOf(coachId, now),
  };
}

/**
 * A coach's reviews, newest first. Others see them only once the coach has enough, never hidden ones; the coach sees
 * all of their own, hidden ones marked.
 */
export async function reviewsOf(coachId: string, viewer: string | null, limit = 50): Promise<Review[]> {
  const own = viewer === coachId;
  const rows = await query<ReviewRow>(
    `SELECT * FROM coach_reviews WHERE coach_id = ?${own ? "" : " AND hidden = 0"} ORDER BY updated_at DESC LIMIT ?`,
    [coachId, limit],
  );
  if (!own && rows.length < REVIEW_LIMITS.shown) return [];
  return Promise.all(rows.map((r) => toReview(r, own)));
}

/** What a client sees about their own review of one coach: theirs (if written) and whether they can write one now. */
export async function mineFor(clientId: string, coachId: string, now = Date.now()): Promise<{ review: Review | null; can: Eligibility }> {
  const [row] = await query<ReviewRow>("SELECT * FROM coach_reviews WHERE coach_id = ? AND client_id = ?", [coachId, clientId]);
  return { review: row ? await toReview(row) : null, can: await eligibility(coachId, clientId, now) };
}

/** Whether an account has ever coached (made an invite) or is listed at a gym, so its reviews can be looked up. */
export async function isCoach(accountId: string): Promise<boolean> {
  const [r] = await query(
    "SELECT 1 AS x FROM coach_accounts WHERE account_id = ? UNION ALL SELECT 1 AS x FROM gym_trainers WHERE account_id = ? LIMIT 1",
    [accountId, accountId],
  );
  return !!r;
}

// ---------- Admin: the Reports tab (social.ts) ----------

/** What staff see for a reported review or reply: the words, who wrote them and whether reports hid them. */
export async function reviewReport(target: string): Promise<{ content: string; authorId: string; hidden: boolean } | null> {
  const reply = target.endsWith(".reply");
  const id = reply ? target.slice(0, -".reply".length) : target;
  const [r] = await query<ReviewRow & { coach_id: string }>("SELECT * FROM coach_reviews WHERE id = ?", [id]);
  if (!r) return null;
  const coach = (await nameOf(s(r.coach_id))) || "a coach";
  return reply
    ? { content: `Reply from ${coach}: ${s(r.reply)}`, authorId: s(r.coach_id), hidden: !!n(r.reply_hidden) }
    : {
        content: `${"★".repeat(n(r.stars))}${"☆".repeat(5 - n(r.stars))} for ${coach}${s(r.body) ? `: ${s(r.body)}` : ""}`,
        authorId: s(r.client_id),
        hidden: !!n(r.hidden),
      };
}

/** Staff decide: `remove` deletes the review (or clears the reply), `dismiss` shows it again. */
export async function resolveReview(target: string, action: "remove" | "dismiss", status: string): Promise<boolean> {
  const reply = target.endsWith(".reply");
  const id = reply ? target.slice(0, -".reply".length) : target;
  if (!isReviewId(id)) return false;
  const close = {
    sql: "UPDATE reports SET status = ? WHERE kind = 'review' AND target_id = ? AND status = 'open'",
    args: [status, target],
  };
  if (action === "remove")
    await batch([
      reply
        ? { sql: "UPDATE coach_reviews SET reply = '', reply_at = 0, reply_hidden = 0 WHERE id = ?", args: [id] }
        : { sql: "DELETE FROM coach_reviews WHERE id = ?", args: [id] },
      close,
    ]);
  else await batch([{ sql: `UPDATE coach_reviews SET ${reply ? "reply_hidden" : "hidden"} = 0 WHERE id = ?`, args: [id] }, close]);
  return true;
}
