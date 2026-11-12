"use client";

import { useEffect, useState } from "react";

import { exercise } from "@/lib/exercises";
import { isPr, repsForPr } from "@/lib/game";
import { t } from "@/lib/i18n";
import { confetti, haptic, juice, sound } from "@/lib/juice";
import { useApp } from "@/lib/store";
import type { SetEvent } from "@/lib/types";
import { fmtNum, fromKg } from "@/lib/units";

import { Icon } from "./icons";

// Moments during a workout that never add a tap: a PR banner the instant a record set is logged, and an
// "almost there" line during rest when the next set could beat the best.

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
  );
}

/** Shown under "Next up" during rest when a PR is one or two reps past the plan. */
export function AlmostThere({ exerciseId, weight, reps }: { exerciseId: string; weight: number; reps: number }) {
  const { events, profile } = useApp();
  const need = repsForPr(events, exerciseId, weight, Number.MAX_SAFE_INTEGER);
  if (need === null || need > reps + 2) return null;
  const at = `${fmtNum(fromKg(weight, profile.unit))} ${profile.unit}`;
  return (
    <p className="mt-2 text-center text-sm text-gold">
      {need <= reps ? t("pr.isNew", { reps, weight: at }) : t("pr.inReach", { reps: need, weight: at })}
    </p>
  );
}
