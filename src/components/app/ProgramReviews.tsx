"use client";

// Ratings of a coach's program, under it on #/program/<id> (docs/decisions/coach-programs.md "Ratings"; server
// src/server/programReviews.ts). Three views of one list:
// - Anyone: the program's stars, count and latest reviews once it has three; before that, one line saying so.
// - A lifter who has had it two weeks: one tap on a star, an optional line, Post; then their own review with Edit and
//   Delete. Earlier, one line on when they can.
// - Its coach: every review from the first one, a reply box on each, and the count the public will see at three.
// Reporting a review or reply goes through the same sheet as reviews of coaches.
import { useState, type ReactNode } from "react";

import { track } from "@/lib/analytics";
import { AuthError } from "@/lib/auth";
import { PROGRAM_REVIEW_RULES, rateProgram, replyToProgramReview, unrateProgram, type ProgramPage } from "@/lib/coachPrograms";
import { reviewError } from "@/lib/coachReviews";
import { date, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";

import { RatingSummary, ReplyBox, ReportLink, ReviewItem, StarPicker } from "./CoachReviews";
import { Button, Section } from "./ui";

const input = "card w-full resize-none px-4 py-3";
const short = (ms: number) => date(ms, { month: "short", day: "numeric", year: "numeric" });

function errorText(e: unknown): string {
  if (e instanceof AuthError && e.message === "wait") return t("cpg.rev.early");
  if (e instanceof AuthError && e.message === "notOwner") return t("cpg.rev.notOwner");
  return reviewError(e);
}

export function ProgramReviews({
  id,
  page,
  coach,
  own,
  onChanged,
}: {
  id: string;
  page: Pick<ProgramPage, "rating" | "reviews" | "mine">;
  coach: string;
  own: boolean;
  onChanged: () => void;
}) {
  const { rating, reviews = [], mine } = page;
  const [editing, setEditing] = useState(false);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  if (!rating) return null;
  const review = mine?.review ?? null;
  const unrated = t("cpg.rev.unrated", { count: PROGRAM_REVIEW_RULES.shown });

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
      await rateProgram(id, stars, text);
      haptic("success");
      sound.done();
      track("feature", { name: "program_review", detail: review ? "edit" : String(stars) });
      setEditing(false);
      setNote(t("rev.posted"));
      onChanged();
    } catch (e) {
      oops();
      setNote(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      await unrateProgram(id);
      haptic("toggle");
      setNote(t("rev.deleted"));
      onChanged();
    } catch (e) {
      oops();
      setNote(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  // The lifter's own part: a form, their review, or a line on when (or why not).
  let yours: ReactNode = null;
  if (mine && !own) {
    if (review && !editing)
      yours = (
        <ReviewItem review={review} coach={coach} anon={t("cpg.rev.anon")}>
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
      );
    else if (editing || mine.can.ok)
      yours = (
        <li className="card p-4">
          <p className="font-semibold">{t("cpg.rev.rateTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("cpg.rev.rateLead")}</p>
          <div className="mt-3">
            <StarPicker
              value={editing ? stars : 0}
              onPick={(n) => {
                if (!editing) start();
                setStars(n);
              }}
            />
          </div>
          {editing && (
            <>
              <label htmlFor={`prev-text-${id}`} className="mt-3 block text-sm text-muted">
                {t("rev.textLabel")}
              </label>
              <textarea
                id={`prev-text-${id}`}
                rows={3}
                maxLength={PROGRAM_REVIEW_RULES.text}
                placeholder={t("cpg.rev.placeholder")}
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
            </>
          )}
        </li>
      );
    else if (!mine.can.ok && (mine.can.why === "wait" || mine.can.why === "teen"))
      yours = (
        <li className="card p-4 text-sm text-muted">
          {mine.can.why === "teen" ? t("rev.teen") : t("cpg.rev.wait", { date: short(mine.can.readyAt ?? 0) })}
        </li>
      );
  }

  // Everyone else's reviews (the lifter's own is above, so it isn't listed twice).
  const others = reviews.filter((r) => r.id !== review?.id);
  return (
    <Section title={t("cpg.rev.title")} icon="star">
      <div className="card p-4">
        <RatingSummary rating={rating} own={own} unrated={unrated} />
        {own && <p className="mt-2 text-sm text-muted">{t("cpg.rev.ownLead", { days: PROGRAM_REVIEW_RULES.days })}</p>}
      </div>
      {(yours || others.length > 0) && (
        <ul className="mt-3 space-y-2">
          {yours}
          {others.map((r) => (
            <ReviewItem key={r.id} review={r} coach={coach} anon={t("cpg.rev.anon")}>
              {own && <ReplyBox key={r.reply} review={r} onSaved={onChanged} save={replyToProgramReview} />}
              <div>
                <ReportLink id={r.id} part="review" />
              </div>
              {!own && r.reply && <ReportLink id={r.id} part="reply" />}
            </ReviewItem>
          ))}
        </ul>
      )}
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </Section>
  );
}
