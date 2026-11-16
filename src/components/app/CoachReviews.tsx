"use client";

// Ratings and reviews of coaches (docs/decisions/coach-reviews.md; server src/server/coachReviews.ts). Three places:
// - A client, on Coaching: "Rate <coach>" under each coach once they've worked together four weeks or two sessions
//   (`RateCoach`): one tap on a star, an optional line, Post. Their own review shows with Edit and Delete after that.
// - Someone about to join a coach sees the coach's rating, how their clients are training and the latest reviews
//   on the invite (`CoachRatingPreview`), once the coach has three reviews.
// - The coach, on Coaching › Setup, sees every review of them from the first one and replies once to each (`MyReviews`).
// Anyone can report a review or a reply (`ReportReview`); three reports hide it for staff to decide.
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { track } from "@/lib/analytics";
import {
  activeShare,
  deleteReview,
  loadCoachReviews,
  loadMyReviews,
  replyToReview,
  reportReview,
  REVIEW_REASONS,
  REVIEW_RULES,
  reviewError,
  saveReview,
  type CoachReviews,
  type Rating,
  type Review,
  type ReviewReason,
} from "@/lib/coachReviews";
import { date, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { liveRead } from "@/lib/liveRead";
import { useApp } from "@/lib/store";
import type { Person } from "@/lib/trainer";

import { Icon } from "./icons";
import { Button, Chip, EmptyState, Section, Sheet } from "./ui";

const input = "card w-full resize-none px-4 py-3";
/** An answer this screen can draw (an older server, or a copy kept from one, may not have every part). */
const valid = (d: CoachReviews | null | undefined): d is CoachReviews => !!d && !!d.rating && Array.isArray(d.reviews);
const short = (ms: number) => date(ms, { month: "short", day: "numeric", year: "numeric" });

/** Five stars, filled up to the rating (rounded to the nearest whole star), read out as "4.8 out of 5 stars". */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span role="img" aria-label={t("rev.starsLabel", { rating: value })} className="inline-flex items-center gap-0.5 text-ember">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} strokeWidth={1.6} filled={i <= full} className={i <= full ? "" : "opacity-50"} />
      ))}
    </span>
  );
}

/** The rating line: stars, average and count once there are enough reviews, and how the coach's clients are training. */
export function RatingSummary({ rating, own = false, unrated }: { rating: Rating; own?: boolean; unrated?: string }) {
  return (
    <div className="space-y-1">
      {rating.average !== null ? (
        <p className="flex flex-wrap items-center gap-2">
          <Stars value={rating.average} />
          <span className="num font-semibold">{rating.average.toFixed(1)}</span>
          <span className="text-sm text-muted">{t("rev.count", { count: rating.count })}</span>
        </p>
      ) : (
        <p className="text-sm text-muted">{own ? t("rev.mineHidden", { count: rating.count }) : (unrated ?? t("rev.newCoach"))}</p>
      )}
      {rating.outcome && (
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Icon name="flame" size={16} className="text-ember" />
          <span>
            {t("rev.outcome", { active: rating.outcome.active, clients: rating.outcome.clients })}
            <span className="sr-only"> ({activeShare(rating.outcome)}%)</span>
          </span>
        </p>
      )}
    </div>
  );
}

/** One review: stars, the words, who and when, and the coach's reply under it. */
export function ReviewItem({ review, coach, anon, children }: { review: Review; coach: string; anon?: string; children?: ReactNode }) {
  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Stars value={review.stars} size={14} />
        <span className="text-sm text-muted">
          {review.name || anon || t("rev.anon")} · {short(review.at)}
          {review.verified && <> · {t("cpg.rev.verified")}</>}
        </span>
      </div>
      {review.text && <p className="mt-2 whitespace-pre-line break-words">{review.text}</p>}
      {review.hidden && <p className="mt-2 text-sm text-warn">{t("rev.hidden")}</p>}
      {review.reply && (
        <div className="mt-3 border-l-2 border-line pl-3">
          <p className="text-sm font-semibold">{coach ? t("rev.replyFrom", { name: coach }) : t("rev.reply")}</p>
          <p className="mt-1 whitespace-pre-line break-words text-sm">{review.reply}</p>
        </div>
      )}
      {children}
    </li>
  );
}

/** Report a review or the coach's reply: one tap on a reason, then Send. Mounted only while open. */
function ReportReview({ id, part, onClose }: { id: string; part: "review" | "reply"; onClose: () => void }) {
  const [reason, setReason] = useState<ReviewReason | null>(null);
  const [note, setNote] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const send = async () => {
    if (!reason) return;
    try {
      await reportReview(id, part, reason, reason === "other" ? note : "");
      haptic("success");
      setDone(t("friends.report.thanks"));
      track("feature", { name: "review_report", detail: `${part}:${reason}` });
    } catch (e) {
      oops();
      setDone(reviewError(e));
    }
  };
  return (
    <Sheet open onClose={onClose} title={t(part === "reply" ? "rev.reportReply" : "rev.reportReview")}>
      {done ? (
        <>
          <p role="status">{done}</p>
          <Button kind="ghost" className="mt-4 w-full" onClick={onClose}>
            {t("friends.done")}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">{t("friends.report.why")}</p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("friends.report.why")}>
            {REVIEW_REASONS.map((r) => (
              <Chip key={r} active={reason === r} onClick={() => setReason(r)}>
                {t(`friends.reason.${r}`)}
              </Chip>
            ))}
          </div>
          {reason === "other" && (
            <>
              <label htmlFor="review-report-note" className="mt-3 block text-sm text-muted">
                {t("friends.report.note")}
              </label>
              <textarea
                id="review-report-note"
                value={note}
                maxLength={280}
                rows={2}
                onChange={(e) => setNote(e.target.value)}
                className={`${input} mt-1`}
              />
            </>
          )}
          <p className="mt-3 text-xs text-muted">{t("rev.reportHint")}</p>
          <Button className="mt-4 w-full" disabled={!reason} onClick={() => void send()}>
            {t("friends.report.send")}
          </Button>
        </>
      )}
    </Sheet>
  );
}

/** A quiet Report link under a review or reply. */
export function ReportLink({ id, part }: { id: string; part: "review" | "reply" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="press mt-2 min-h-11 text-sm text-muted hover:text-ink" onClick={() => setOpen(true)}>
        {t(part === "reply" ? "rev.reportReply" : "rev.reportReview")}
      </button>
      {open && <ReportReview id={id} part={part} onClose={() => setOpen(false)} />}
    </>
  );
}

/** The coach's rating and latest reviews, on the invite a lifter is about to accept. Says nothing when it can't load. */
export function CoachRatingPreview({ coach }: { coach: Pick<Person, "id" | "name"> }) {
  const [data, setData] = useState<CoachReviews | null>(null);
  useEffect(() => {
    let live = true;
    loadCoachReviews(coach.id)
      .then((d) => live && setData(valid(d) ? d : null))
      .catch(() => live && setData(null));
    return () => {
      live = false;
    };
  }, [coach.id]);
  if (!data) return null;
  return (
    <div className="mt-3">
      <RatingSummary rating={data.rating} />
      {data.reviews.length > 0 && (
        <ul className="mt-3 space-y-2">
          {data.reviews.slice(0, 3).map((r) => (
            <ReviewItem key={r.id} review={r} coach={coach.name}>
              <ReportLink id={r.id} part="review" />
            </ReviewItem>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One tap per star: a row of five 44 px buttons, as a radio group. */
export function StarPicker({ value, onPick }: { value: number; onPick: (n: number) => void }) {
  return (
    <div role="radiogroup" aria-label={t("rev.starsGroup")} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={t("rev.starOption", { count: i })}
          onClick={() => {
            haptic("select");
            sound.tick();
            onPick(i);
          }}
          className="press grid h-11 w-11 place-items-center rounded-xl text-ember"
        >
          <Icon name="star" size={30} strokeWidth={1.6} filled={i <= value} className={i <= value ? "" : "opacity-50"} />
        </button>
      ))}
    </div>
  );
}

/**
 * A client's review of one coach, under that coach on Coaching. Shows nothing for someone who isn't the coach's
 * client; says when they can rate if it's early; says reviews are for adults to an under-18.
 */
export function RateCoach({ coach }: { coach: Person }) {
  const name = coach.name || t("trn.noName");
  const [data, setData] = useState<CoachReviews | null>(null);
  const [editing, setEditing] = useState(false);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const load = useCallback(() => {
    liveRead(
      `coach.reviews.${coach.id}`,
      () => loadCoachReviews(coach.id),
      (d) => setData(d),
    ).catch(() => setData(null));
  }, [coach.id]);
  useEffect(load, [load]);
  const mine = data?.mine;
  if (!mine) return null;
  const review = mine.review;
  const start = () => {
    setStars(review?.stars ?? 0);
    setText(review?.text ?? "");
    setNote(null);
    setEditing(true);
  };
  const post = async () => {
    if (!stars) return;
    setBusy(true);
    try {
      await saveReview(coach.id, stars, text);
      haptic("success");
      sound.done();
      track("feature", { name: "review", detail: review ? "edit" : String(stars) });
      setEditing(false);
      setNote(t("rev.posted"));
      load();
    } catch (e) {
      oops();
      setNote(reviewError(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await deleteReview(coach.id);
      haptic("toggle");
      setNote(t("rev.deleted"));
      load();
    } catch (e) {
      oops();
      setNote(reviewError(e));
    } finally {
      setBusy(false);
    }
  };
  const status = note && (
    <p className="mt-2 text-sm text-muted" role="status">
      {note}
    </p>
  );
  // Too early, or under 18, and nothing written yet: one line on when (or why not).
  if (!mine.can.ok && !review) {
    if (mine.can.why === "notClient") return null;
    return (
      <Section title={t("rev.rateTitle", { name })} icon="star">
        <p className="card p-4 text-sm text-muted">
          {mine.can.why === "teen" ? t("rev.teen") : t("rev.wait", { name, date: short(mine.can.readyAt ?? 0) })}
        </p>
      </Section>
    );
  }
  return (
    <Section title={review && !editing ? t("rev.yours") : t("rev.rateTitle", { name })} icon="star">
      {review && !editing ? (
        <ul>
          <ReviewItem review={review} coach={name}>
            <div className="mt-3 flex flex-wrap gap-2">
              {mine.can.ok && (
                <Button kind="ghost" icon="edit" disabled={busy} onClick={start}>
                  {t("rev.edit")}
                </Button>
              )}
              <Button kind="quiet" icon="trash" disabled={busy} onClick={() => void remove()}>
                {t("rev.delete")}
              </Button>
            </div>
            {review.reply && <ReportLink id={review.id} part="reply" />}
          </ReviewItem>
        </ul>
      ) : editing ? (
        <div className="card p-4">
          <p className="text-sm text-muted">{t("rev.rateLead", { name })}</p>
          <div className="mt-3">
            <StarPicker value={stars} onPick={setStars} />
          </div>
          <label htmlFor={`rev-text-${coach.id}`} className="mt-3 block text-sm text-muted">
            {t("rev.textLabel")}
          </label>
          <textarea
            id={`rev-text-${coach.id}`}
            rows={3}
            maxLength={REVIEW_RULES.text}
            placeholder={t("rev.textPlaceholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`${input} mt-1`}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button className="flex-1" disabled={busy || !stars} onClick={() => void post()}>
              {review ? t("rev.update") : t("rev.post")}
            </Button>
            <Button kind="ghost" onClick={() => setEditing(false)}>
              {t("rev.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="card p-4">
          <p className="text-sm text-muted">{t("rev.rateLead", { name })}</p>
          <div className="mt-3">
            <StarPicker
              value={0}
              onPick={(n) => {
                start();
                setStars(n);
              }}
            />
          </div>
        </div>
      )}
      {status}
    </Section>
  );
}

/** The coach's reply to one review: Reply opens a box; a reply already posted can be changed or removed. */
export function ReplyBox({
  review,
  onSaved,
  save: send = replyToReview,
}: {
  review: Review;
  onSaved: () => void;
  /** Where the reply goes: a review of the coach (the default) or of one of their programs. */
  save?: (id: string, text: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(review.reply);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const save = async (value: string) => {
    setBusy(true);
    try {
      await send(review.id, value);
      haptic("success");
      track("feature", { name: "review_reply", detail: value ? "post" : "clear" });
      setOpen(false);
      setNote(null);
      onSaved();
    } catch (e) {
      oops();
      setNote(reviewError(e));
    } finally {
      setBusy(false);
    }
  };
  if (!open)
    return (
      <Button kind="ghost" icon="chat" className="mt-3" onClick={() => setOpen(true)}>
        {review.reply ? t("rev.replyEdit") : t("rev.reply")}
      </Button>
    );
  return (
    <div className="mt-3">
      <label htmlFor={`rev-reply-${review.id}`} className="block text-sm text-muted">
        {t("rev.replyLabel")}
      </label>
      <textarea
        id={`rev-reply-${review.id}`}
        rows={2}
        maxLength={REVIEW_RULES.text}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={`${input} mt-1`}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button className="flex-1" disabled={busy || !text.trim()} onClick={() => void save(text)}>
          {t("rev.replySave")}
        </Button>
        {review.reply && (
          <Button kind="quiet" disabled={busy} onClick={() => void save("")}>
            {t("rev.replyClear")}
          </Button>
        )}
        <Button kind="ghost" onClick={() => setOpen(false)}>
          {t("rev.cancel")}
        </Button>
      </div>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </div>
  );
}

/** Coaching › Setup: the coach's rating (as others will see it), every review of them, a reply box and Report on each. */
export function MyReviews() {
  const name = useApp((s) => s.profile.name ?? "");
  const [data, setData] = useState<CoachReviews | null>(null);
  const load = useCallback(() => {
    liveRead("coach.reviews.mine", loadMyReviews, (d) => setData(valid(d) ? d : null)).catch(() => setData(null));
  }, []);
  useEffect(load, [load]);
  return (
    <Section title={t("rev.myTitle")} icon="star">
      <p className="mb-3 text-sm text-muted">{t("rev.myLead")}</p>
      {data && (
        <>
          {data.reviews.length > 0 && (
            <div className="card mb-3 p-4">
              <RatingSummary rating={data.rating} own />
            </div>
          )}
          {data.reviews.length === 0 ? (
            <div className="card">
              <EmptyState icon="star" tint="var(--color-ember)" title={t("rev.none")} body={t("rev.noneBody")} />
              {data.rating.outcome && (
                <div className="px-4 pb-4">
                  <RatingSummary rating={data.rating} own />
                </div>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {data.reviews.map((r) => (
                <ReviewItem key={r.id} review={r} coach={name}>
                  <ReplyBox key={r.reply} review={r} onSaved={load} />
                  <div>
                    <ReportLink id={r.id} part="review" />
                  </div>
                </ReviewItem>
              ))}
            </ul>
          )}
        </>
      )}
    </Section>
  );
}
