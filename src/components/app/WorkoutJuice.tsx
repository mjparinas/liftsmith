"use client";

import { useEffect, useMemo, useState } from "react";

import { exercise } from "@/lib/exercises";
import { COSMETICS, isPr, repsForPr } from "@/lib/game";
import { t } from "@/lib/i18n";
import { confetti, haptic, juice, sound } from "@/lib/juice";
import { prOfSet, prShare } from "@/lib/shareCards";
import { useApp } from "@/lib/store";
import type { SetEvent } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";

import { useGame } from "./Achievements";
import { Icon } from "./icons";
import { ShareSheet } from "./ShareSheet";

// Moments during a workout that never add a tap: a PR banner the instant a record set is logged, and an
// "almost there" line during rest when the next set could beat the best.

/** The phone asks for less motion (Lean mode is the app's own switch, checked separately). */
function reducedMotion(): boolean {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PrMoment() {
  const { profile } = useApp();
  const [shown, setShown] = useState<SetEvent | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Only sets logged while this screen is up, watched through the store.
    const unsub = useApp.subscribe((st, prev) => {
      if (st.events.length <= prev.events.length || !st.active) return;
      const last = st.events.at(-1);
      if (last?.type !== "set" || last.sessionId !== st.active.sessionId || !isPr(st.events, last)) return;
      setShown(last);
      haptic("celebrate");
      sound.pr();
      void confetti(false);
      clearTimeout(timer);
      timer = setTimeout(() => setShown(null), juice.lean ? 2500 : 3800);
    });
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  if (!shown) return null;
  return (
    <>
      {/* The gold flash: decoration only, under the banner, never in Lean mode or with reduced motion. */}
      {!juice.lean && !reducedMotion() && (
        <div aria-hidden data-testid="pr-flash" className="gold-flash pointer-events-none fixed inset-0 z-40" key={shown.id} />
      )}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-5 pt-[max(env(safe-area-inset-top),12px)]"
      >
        <div
          className={`${juice.lean ? "" : "animate-bump"} flex items-center gap-3 rounded-2xl border border-gold/50 bg-surface px-4 py-3 shadow-xl`}
          style={{ boxShadow: "0 10px 40px rgb(0 0 0 / 0.5), inset 0 0 0 1px var(--color-gold)" }}
        >
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
            <Icon name="trophy" size={22} />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">{t("pr.banner")}</p>
            <p className="num font-semibold">
              {exercise(shown.exerciseId).name} · {fmtNum(fromKg(shown.weight, profile.unit))} {profile.unit} × {shown.reps}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Shown under "Next up" during rest when a PR is one or two reps past the plan. Measured against the best from
 * before this workout (`since`), so the first workout of a lift never says a PR is in reach.
 */
export function AlmostThere({ exerciseId, weight, reps, since }: { exerciseId: string; weight: number; reps: number; since: number }) {
  const { events, profile } = useApp();
  const need = repsForPr(events, exerciseId, weight, since);
  if (need === null || need > reps + 2) return null;
  const at = `${fmtNum(fromKg(weight, profile.unit))} ${profile.unit}`;
  return (
    <p className="mt-2 flex items-start justify-center gap-1.5 text-center text-sm text-gold">
      <Icon name="trophy" size={16} className="mt-0.5 shrink-0" />
      {need <= reps ? t("pr.isNew", { reps, weight: at }) : t("pr.inReach", { reps: need, weight: at })}
    </p>
  );
}

/**
 * On the rest screen right after a new personal best: one button that opens the share card for it (the same card
 * the end-of-workout screen offers). Between sets only, so it never adds a tap during a set.
 */
export function RestPrShare({ set }: { set: SetEvent }) {
  const { events, profile } = useApp();
  const g = useGame();
  const [open, setOpen] = useState(false);
  const item = useMemo(() => {
    if (!isPr(events, set)) return null;
    const { pr, previous } = prOfSet(events, set);
    const accent = COSMETICS.find((c) => c.id === profile.cosmetics?.accent)?.value;
    return prShare(pr, previous, { unit: profile.unit, game: g, accent });
  }, [events, set, profile.unit, profile.cosmetics?.accent, g]);
  if (!item) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptic("tick");
          setOpen(true);
        }}
        className="press animate-rise mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-4 text-sm font-semibold text-gold"
      >
        <Icon name="trophy" size={16} />
        {t("pr.share")}
      </button>
      <ShareSheet open={open} onClose={() => setOpen(false)} items={[item]} />
    </>
  );
}
