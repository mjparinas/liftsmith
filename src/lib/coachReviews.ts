"use client";

// Ratings and reviews of coaches, the app side (server: src/server/coachReviews.ts, /api/coach/reviews/;
// docs/decisions/coach-reviews.md). A client rates their coach after four weeks together or two sessions; nobody sees a
// coach's rating until they have three reviews; the coach replies once to each; anyone can report a review or reply.
import { api, AuthError, readAccount } from "./auth";
import { t } from "./i18n";

/** The server's REVIEW_LIMITS, for the words around the form. */
export const REVIEW_RULES = { days: 28, sessions: 2, shown: 3, text: 500, outcomeDays: 14 } as const;

export interface Review {
  id: string;
  stars: number;
  text: string;
  /** The reviewer's first name and last initial, or "" ("A client"). */
  name: string;
  at: number;
  reply: string;
  replyAt: number;
  /** Only on the coach's own list: hidden by reports until staff decide. */
  hidden?: boolean;
  /** Program reviews only: the writer paid for the program (programReviews.ts). */
  verified?: boolean;
}

export interface Rating {
  count: number;
  /** Null until the coach has REVIEW_RULES.shown reviews. */
  average: number | null;
  outcome: { clients: number; active: number } | null;
}

export type Eligibility = { ok: true } | { ok: false; why: "notClient" | "teen" | "wait"; readyAt?: number };

export interface CoachReviews {
  rating: Rating;
  reviews: Review[];
  /** For the coach's client: their own review and whether they can write one. */
  mine?: { review: Review | null; can: Eligibility } | null;
}

/** The fixed reasons for reporting a review or reply (REASONS_FOR.review in socialTypes.ts). */
export const REVIEW_REASONS = ["spam", "abuse", "hate", "sexual", "impersonation", "other"] as const;
export type ReviewReason = (typeof REVIEW_REASONS)[number];

function token(): string {
  const a = readAccount();
  if (!a) throw new AuthError("signedOut", 401);
  return a.token;
}

const PATH = "/api/coach/reviews/";
/** This coach's own rating and every review of them. */
export const loadMyReviews = async () => api<CoachReviews>(PATH, { token: token() });
/** Another coach's rating and reviews, and this lifter's own review of them if they're a client. */
export const loadCoachReviews = async (coach: string) =>
  api<CoachReviews>(`${PATH}?coach=${encodeURIComponent(coach)}`, { token: token() });
export const saveReview = async (coach: string, stars: number, text: string) =>
  (await api<{ review: Review }>(PATH, { token: token(), body: { action: "review", coach, stars, text } })).review;
export const deleteReview = async (coach: string) => void (await api(PATH, { token: token(), body: { action: "delete", coach } }));
export const replyToReview = async (id: string, text: string) =>
  (await api<{ reply: string }>(PATH, { token: token(), body: { action: "reply", id, text } })).reply;
export const reportReview = async (id: string, part: "review" | "reply", reason: ReviewReason, note = "") =>
  void (await api(PATH, { token: token(), body: { action: "report", id, part, reason, note } }));

/** The share of a coach's clients who trained in the last two weeks, as a whole percent. */
export const activeShare = (o: NonNullable<Rating["outcome"]>) => (o.clients ? Math.round((o.active / o.clients) * 100) : 0);

/** What went wrong, in the lifter's words. */
export function reviewError(e: unknown): string {
  if (e instanceof AuthError) {
    if (e.message === "offline") return t("trn.err.offline");
    if (e.message === "slow") return t("trn.err.slow");
    if (e.message === "link") return t("rev.err.link");
    if (e.message === "words") return t("rev.err.words");
    if (e.message === "teen") return t("rev.teen");
    if (e.message === "wait") return t("rev.err.wait");
    if (e.message === "gone" || e.message === "notClient") return t("trn.err.gone");
  }
  return t("trn.err.failed");
}
