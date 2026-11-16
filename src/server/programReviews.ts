// Ratings and reviews of coaches' programs (Melvin, 2026-11-16: public pages "for both", programs and their ratings;
// docs/decisions/coach-programs.md "Ratings"). The same rules as reviews of coaches (coachReviews.ts), fitted to a
// program:
// - Only someone who has the program (bought it, or got it free) can rate it, and only after PROGRAM_REVIEW_LIMITS.days
//   with it, so a rating says how it went rather than how it looked. Never the coach who made it.
// - Only adults (teams.ts isMinor). One review per lifter and program, which they can change or delete; it stays if
//   they drop the program or it's refunded, because it was still true.
// - One to five stars and an optional short review through the same filter as Friends.
// - The coach can post one public reply to each review.
// - Nobody else sees a program's rating or reviews until it has PROGRAM_REVIEW_LIMITS.shown.
// - Reports go through the same path as coach reviews (kind 'review' in `reports`; coachReviews.ts reportReview,
//   reviewReport and resolveReview look in both tables), so the admin Reports tab handles them unchanged.
import { createHash } from "node:crypto";

import { nameOf } from "./coach";
import { shortName, type Rating, type Review } from "./coachReviews";
import { batch, query, rateLimit, run } from "./db";
import { checkText, tidy } from "./moderation";
import { notifyCoach } from "./push";
import { isMinor } from "./teams";

const DAY = 86_400_000;
const n = (v: unknown) => Number(v ?? 0);
const s = (v: unknown) => (v == null ? "" : String(v));

export const PROGRAM_REVIEW_LIMITS = {
  /** Days a lifter has had the program before they can rate it. */
  days: 14,
  /** Reviews a program needs before its rating and reviews show to anyone but its coach. */
  shown: 3,
  /** Longest review and reply, in characters. */
  text: 500,
  /** Reviews written or changed per account per day. */
  perDay: 20,
} as const;

/** The public handle of one lifter's review of one program: stable, and gives away neither account. */
export const programReviewId = (programId: string, accountId: string) =>
  createHash("sha256").update(`liftsmith-program-review:${programId}:${accountId}`).digest("hex").slice(0, 20);

export type ProgramReviewBlock = "notOwner" | "yours" | "teen" | "wait";
export type ProgramEligibility = { ok: true } | { ok: false; why: ProgramReviewBlock; readyAt?: number };

/** Whether this lifter can rate this program now, and if not, why (and when, if it's a matter of time). */
export async function programEligibility(programId: string, accountId: string, now = Date.now()): Promise<ProgramEligibility> {
  const [p] = await query<{ coach_id: string }>("SELECT coach_id FROM coach_programs WHERE id = ?", [programId]);
  if (!p) return { ok: false, why: "notOwner" };
  if (s(p.coach_id) === accountId) return { ok: false, why: "yours" };
  const [o] = await query<{ at: number }>("SELECT at FROM program_owners WHERE program_id = ? AND account_id = ?", [programId, accountId]);
  if (!o) return { ok: false, why: "notOwner" };
  if (await isMinor(accountId, now)) return { ok: false, why: "teen" };
  const readyAt = n(o.at) + PROGRAM_REVIEW_LIMITS.days * DAY;
  return readyAt <= now ? { ok: true } : { ok: false, why: "wait", readyAt };
}

type Row = {
  id: string;
  account_id: string;
  stars: number;
  body: string;
  updated_at: number;
  reply: string;
  reply_at: number;
  hidden: number;
  reply_hidden: number;
};

async function toReview(r: Row, own = false): Promise<Review> {
  return {
    id: s(r.id),
    stars: n(r.stars),
    text: s(r.body),
    name: shortName(await nameOf(s(r.account_id))),
    at: n(r.updated_at),
    reply: n(r.reply_hidden) && !own ? "" : s(r.reply),
    replyAt: n(r.reply_hidden) && !own ? 0 : n(r.reply_at),
    ...(own && (n(r.hidden) || n(r.reply_hidden)) ? { hidden: true } : {}),
  };
}

export type ProgramReviewResult = { review: Review } | { error: ProgramReviewBlock | "bad" | "slow" | "link" | "words" };

/** A lifter writes or changes their review of a program they have. */
export async function saveProgramReview(
  accountId: string,
  programId: string,
  stars: unknown,
  text: unknown,
  now = Date.now(),
): Promise<ProgramReviewResult> {
  const st = Number(stars);
  if (!Number.isInteger(st) || st < 1 || st > 5) return { error: "bad" };
  const can = await programEligibility(programId, accountId, now);
  if (!can.ok) return { error: can.why };
  let body = "";
  if (tidy(text, PROGRAM_REVIEW_LIMITS.text)) {
    const v = checkText(text, PROGRAM_REVIEW_LIMITS.text);
    if (!v.ok) return { error: v.error === "empty" ? "bad" : v.error };
    body = v.text;
  }
  if (!(await rateLimit(`review:${accountId}`, PROGRAM_REVIEW_LIMITS.perDay, DAY, now))) return { error: "slow" };
  const id = programReviewId(programId, accountId);
  const [had] = await query("SELECT 1 AS x FROM program_reviews WHERE id = ?", [id]);
  await run(
    `INSERT INTO program_reviews (program_id, account_id, id, stars, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (program_id, account_id) DO UPDATE SET stars = excluded.stars, body = excluded.body, updated_at = excluded.updated_at`,
    [programId, accountId, id, st, body, now, now],
  );
  if (!had) {
    const [p] = await query<{ coach_id: string; title: string }>("SELECT coach_id, title FROM coach_programs WHERE id = ?", [programId]);
    if (p)
      await notifyCoach(
        s(p.coach_id),
        "coachProgramReview",
        { name: await nameOf(accountId), text: `${"★".repeat(st)} ${s(p.title)}` },
        "#/trainer/programs",
      );
  }
  const [row] = await query<Row>("SELECT * FROM program_reviews WHERE id = ?", [id]);
  return { review: await toReview(row!) };
}

/** A lifter takes their review down, with any open reports on it. */
export async function deleteProgramReview(accountId: string, programId: string): Promise<void> {
  const id = programReviewId(programId, accountId);
  await batch([
    { sql: "DELETE FROM program_reviews WHERE program_id = ? AND account_id = ?", args: [programId, accountId] },
    { sql: "DELETE FROM reports WHERE kind = 'review' AND target_id IN (?, ?)", args: [id, `${id}.reply`] },
  ]);
}

/** The program's coach replies once to a review; empty text clears it. */
export async function replyToProgramReview(
  coachId: string,
  id: unknown,
  text: unknown,
  now = Date.now(),
): Promise<{ reply: string } | { error: "gone" | "link" | "words" | "slow" }> {
  if (typeof id !== "string" || !/^[0-9a-f]{20}$/.test(id)) return { error: "gone" };
  const [r] = await query(
    "SELECT 1 AS x FROM program_reviews r JOIN coach_programs p ON p.id = r.program_id WHERE r.id = ? AND p.coach_id = ?",
    [id, coachId],
  );
  if (!r) return { error: "gone" };
  let reply = "";
  if (tidy(text, PROGRAM_REVIEW_LIMITS.text)) {
    const v = checkText(text, PROGRAM_REVIEW_LIMITS.text);
    if (!v.ok) return { error: v.error === "empty" ? "gone" : v.error };
    reply = v.text;
  }
  if (!(await rateLimit(`review:${coachId}`, PROGRAM_REVIEW_LIMITS.perDay * 5, DAY, now))) return { error: "slow" };
  await run("UPDATE program_reviews SET reply = ?, reply_at = ?, reply_hidden = 0 WHERE id = ?", [reply, reply ? now : 0, id]);
  await run("DELETE FROM reports WHERE kind = 'review' AND target_id = ? AND status = 'open'", [`${id}.reply`]);
  return { reply };
}

/** A program's rating: how many reviews count, and the average once there are enough. No outcome line for programs. */
export async function programRating(programId: string): Promise<Rating> {
  const [r] = await query<{ c: number; a: number | null }>(
    "SELECT COUNT(*) AS c, AVG(stars) AS a FROM program_reviews WHERE program_id = ? AND hidden = 0",
    [programId],
  );
  const count = n(r?.c);
  return { count, average: count >= PROGRAM_REVIEW_LIMITS.shown ? Math.round(n(r?.a) * 10) / 10 : null, outcome: null };
}

/** A program's reviews, newest first: none for others until there are enough; its coach sees all, hidden ones marked. */
export async function programReviewsOf(programId: string, own: boolean, limit = 50): Promise<Review[]> {
  const rows = await query<Row>(
    `SELECT * FROM program_reviews WHERE program_id = ?${own ? "" : " AND hidden = 0"} ORDER BY updated_at DESC LIMIT ?`,
    [programId, limit],
  );
  if (!own && rows.length < PROGRAM_REVIEW_LIMITS.shown) return [];
  return Promise.all(rows.map((r) => toReview(r, own)));
}

/** A lifter's own review of a program (if written) and whether they can write one now. */
export async function myProgramReview(
  accountId: string,
  programId: string,
  now = Date.now(),
): Promise<{ review: Review | null; can: ProgramEligibility }> {
  const [row] = await query<Row>("SELECT * FROM program_reviews WHERE program_id = ? AND account_id = ?", [programId, accountId]);
  return { review: row ? await toReview(row) : null, can: await programEligibility(programId, accountId, now) };
}

/** Deleting an account: the reviews it wrote, and the reviews of its programs (before the programs go). */
export const programReviewCleanup = (accountId: string) => [
  { sql: "DELETE FROM program_reviews WHERE account_id = ?", args: [accountId] },
  { sql: "DELETE FROM program_reviews WHERE program_id IN (SELECT id FROM coach_programs WHERE coach_id = ?)", args: [accountId] },
];
