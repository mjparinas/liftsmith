// Ratings and reviews of coaches (src/server/coachReviews.ts, docs/decisions/coach-reviews.md). Signed in only. Server build only.
// GET: this account's own rating and every review of it (a coach looking at theirs, hidden ones marked).
// GET ?coach=<id>: that coach's rating and reviews (none until they have enough), and, for their client, `mine`: the
// client's own review and whether they can write one now.
// POST { action }: "review" (a client: `coach`, `stars` 1 to 5, `text`), "delete" (a client takes theirs down: `coach`),
// "reply" (the coach: `id` of the review, `text`; empty clears it) and "report" (anyone: `id`, `part` "review" or
// "reply", `reason`, `note`).
import { preflight, readJson, reply, signedIn } from "@/server/accountHttp";
import { isAccountId } from "@/server/coach";
import { deleteReview, isCoach, mineFor, ratingOf, replyToReview, reportReview, reviewsOf, saveReview } from "@/server/coachReviews";

export const OPTIONS = preflight;

export async function GET(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const coach = new URL(req.url).searchParams.get("coach");
  if (coach === null || coach === s.accountId) {
    const [rating, reviews] = await Promise.all([ratingOf(s.accountId), reviewsOf(s.accountId, s.accountId)]);
    return reply(req, 200, { rating, reviews });
  }
  if (!isAccountId(coach) || !(await isCoach(coach))) return reply(req, 404, { error: "gone" });
  const [rating, reviews, mine] = await Promise.all([ratingOf(coach), reviewsOf(coach, s.accountId, 20), mineFor(s.accountId, coach)]);
  // `mine` only matters to the coach's own clients (or former clients with a review still up).
  const own = mine.review || mine.can.ok || (!mine.can.ok && mine.can.why !== "notClient") ? mine : null;
  return reply(req, 200, { rating, reviews, mine: own });
}

export async function POST(req: Request) {
  const s = await signedIn(req);
  if (s instanceof Response) return s;
  const body = (await readJson(req)) as Record<string, unknown> | undefined;
  if (!body || typeof body !== "object") return reply(req, 400, { error: "Bad request." });
  const coach = body.coach;
  switch (body.action) {
    case "review": {
      if (!isAccountId(coach)) return reply(req, 400, { error: "bad" });
      const r = await saveReview(s.accountId, coach, body.stars, body.text);
      if ("error" in r)
        return reply(req, r.error === "slow" ? 429 : r.error === "notClient" || r.error === "teen" || r.error === "wait" ? 403 : 400, r);
      return reply(req, 200, r);
    }
    case "delete":
      if (!isAccountId(coach)) return reply(req, 400, { error: "bad" });
      await deleteReview(s.accountId, coach);
      return reply(req, 200, { ok: true });
    case "reply": {
      const r = await replyToReview(s.accountId, body.id, body.text);
      if ("error" in r) return reply(req, r.error === "gone" ? 404 : r.error === "slow" ? 429 : 400, r);
      return reply(req, 200, r);
    }
    case "report": {
      const r = await reportReview(s.accountId, body.id, body.part, body.reason, body.note);
      if ("error" in r) return reply(req, r.error === "gone" ? 404 : r.error === "slow" ? 429 : 400, r);
      return reply(req, 200, r);
    }
    default:
      return reply(req, 400, { error: "Bad request." });
  }
}
