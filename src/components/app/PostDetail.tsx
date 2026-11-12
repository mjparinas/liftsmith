"use client";

// A friend's posted workout in full (Melvin, 2026-11-12, Friends gap list 2 item 3; docs/decisions/friends.md):
// every set of every exercise, the new bests by name, the reader's own last time on each lift, and Do this workout,
// which opens the shared-routine preview with Save.
import { useMemo } from "react";

import { track } from "@/lib/analytics";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { list as fmtList, inSentence, t } from "@/lib/i18n";
import { compareBest, lastTimes } from "@/lib/postDetail";
import { postRoutineCode } from "@/lib/social";
import type { FeedPost, PostExercise, PostSet } from "@/lib/socialTypes";
import { useApp } from "@/lib/store";
import type { Unit } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";

import { ago, clock, repsText, setText } from "./format";
import { Icon } from "./icons";
import { go } from "./router";
import { Button, Sheet } from "./ui";

/** One set in the reader's units and language. */
function setLine(e: PostExercise, s: PostSet, unit: Unit): string {
  const ex = EXERCISE_BY_ID.get(e.id);
  if (!ex) return s.w ? `${fmtNum(fromKg(s.w, unit))} ${unit} × ${s.r}` : `× ${s.r}`;
  if (ex.cardio) return setText(ex, 0, s.r, unit, s.d);
  if (s.w === null) return `× ${repsText(ex, s.r)}`;
  return setText(ex, s.w, s.r, unit, s.d);
}

export function PostDetailSheet({ post, onClose }: { post: FeedPost | null; onClose: () => void }) {
  return (
    <Sheet open={!!post} onClose={onClose} title={post ? t("social.post.title", { name: post.name }) : ""}>
      {post && <PostDetail post={post} />}
    </Sheet>
  );
}

function PostDetail({ post }: { post: FeedPost }) {
  const { events, profile } = useApp();
  const unit = profile.unit;
  const b = post.body;
  const mine = useMemo(
    () =>
      post.mine
        ? new Map()
        : lastTimes(
            events,
            b.exercises.map((e) => e.id),
          ),
    [events, b.exercises, post.mine],
  );
  const routine = postRoutineCode(post);
  const bests = b.exercises.filter((e) => e.pr);
  return (
    <div>
      <p className="text-sm text-muted">
        {ago(post.at)} · {clock(b.seconds)} · {t("social.post.sets", { count: b.sets })}
      </p>
      {bests.length > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium">
          <Icon name="trophy" size={16} className="shrink-0 text-violet" />
          {t("social.post.bests", { lifts: fmtList(bests.map((e) => EXERCISE_BY_ID.get(e.id)?.name ?? e.name)) })}
        </p>
      )}
      <ol className="mt-3 space-y-3">
        {b.exercises.map((e) => {
          const ex = EXERCISE_BY_ID.get(e.id);
          const last = mine.get(e.id);
          const diff = compareBest(e, last);
          const log = e.log?.length ? e.log : [{ w: e.w, r: e.r, ...(e.d ? { d: e.d } : {}) }];
          return (
            <li key={e.id} className="card p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 font-semibold">{ex?.name ?? (e.name || e.id)}</span>
                {e.pr && (
                  <span className="shrink-0 rounded-full bg-violet/15 px-2 py-0.5 text-xs font-semibold text-violet">
                    {t("social.post.newBest")}
                  </span>
                )}
              </div>
              <ol className="mt-2 space-y-0.5 text-sm">
                {log.map((s, i) => (
                  <li key={i} className="num flex justify-between gap-3">
                    <span className="text-muted">{t("social.post.set", { n: i + 1 })}</span>
                    <span>{setLine(e, s, unit)}</span>
                  </li>
                ))}
                {!e.log?.length && e.sets > 1 && <li className="text-xs text-muted">{t("social.post.bestOnly", { count: e.sets })}</li>}
              </ol>
              {last && ex && !ex.cardio && (
                <p className="mt-2 border-t border-line pt-2 text-xs text-muted">
                  {diff === null
                    ? t("social.post.yours", { set: setText(ex, last.w, last.r, unit), when: inSentence(ago(last.at)) })
                    : t(diff > 0 ? "social.post.yoursBelow" : diff < 0 ? "social.post.yoursAbove" : "social.post.yoursSame", {
                        set: setText(ex, last.w, last.r, unit),
                        when: inSentence(ago(last.at)),
                        pct: fmtNum(Math.abs(diff)),
                      })}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {routine && (
        <>
          <Button
            icon="layers"
            className="mt-4 w-full"
            onClick={() => {
              track("feature", { name: "social_save_workout" });
              go("routine", routine);
            }}
          >
            {t("social.post.doIt")}
          </Button>
          <p className="mt-1 px-1 text-xs text-muted">{t("social.post.doItHint")}</p>
        </>
      )}
    </div>
  );
}
