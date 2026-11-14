"use client";

import { useMemo, useState } from "react";

import { EXERCISE_BY_ID } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL } from "@/lib/types";
import { useNow } from "@/lib/useNow";

import { ExerciseBrowser } from "./ExerciseBrowser";
import { ago } from "./format";
import { go, goBack } from "./router";
import { muscleHue } from "./theme";
import { ScreenHeader, Section } from "./ui";

// The exercise library (Melvin, 2026-11-13: "a really nice feature for all of the exercises that are in the
// library"): every exercise opens its own page with its stats (ExercisePage.tsx). The lifter's own exercises
// come first, most sets first, then the shared browser over all 1,000. Opened from Progress. Pure web code.

/** Own exercises shown before "Show all". */
const FIRST = 8;

export function ExerciseLibrary() {
  const { events, gyms, profile } = useApp();
  const now = useNow(3600_000);
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const mine = useMemo(() => {
    const by = new Map<string, { sets: number; last: number }>();
    for (const e of events) {
      if (e.type !== "set" || !EXERCISE_BY_ID.has(e.exerciseId)) continue;
      const r = by.get(e.exerciseId) ?? { sets: 0, last: 0 };
      r.sets++;
      r.last = Math.max(r.last, e.at);
      by.set(e.exerciseId, r);
    }
    return [...by].sort((a, b) => b[1].sets - a[1].sets || b[1].last - a[1].last);
  }, [events]);
  const [all, setAll] = useState(false);
  const shown = all ? mine : mine.slice(0, FIRST);
  return (
    <div className="pb-2">
      <ScreenHeader back={{ label: t("lift.back"), onClick: goBack }} title={t("lift.lib.title")} />
      <p className="mt-1 px-1 text-sm text-muted">{t("lift.lib.intro")}</p>
      {mine.length > 0 && (
        <Section
          title={t("lift.lib.mine")}
          icon="dumbbell"
          right={
            mine.length > FIRST ? (
              <button type="button" onClick={() => setAll(!all)} className="press min-h-11 text-sm text-accent">
                {all ? t("lift.lib.fewer") : t("lift.lib.all", { count: mine.length })}
              </button>
            ) : undefined
          }
        >
          <ul className="card divide-y divide-line" data-testid="lib-mine">
            {shown.map(([id, r]) => {
              const ex = EXERCISE_BY_ID.get(id)!;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => go("exercise", id)}
                    className="press flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: muscleHue(ex.primary[0]!) }} aria-hidden />
                      <span className="min-w-0">
                        <span className="block font-medium">{ex.name}</span>
                        <span className="block text-sm text-muted">{ex.primary.map((m) => MUSCLE_LABEL[m]).join(", ")}</span>
                      </span>
                    </span>
                    <span className="num shrink-0 text-right text-sm text-muted">
                      {t("lift.lib.sets", { count: r.sets })}
                      <span className="block text-xs text-faint">{ago(r.last, now)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      )}
      <Section title={t("lift.lib.browse")} icon="layers">
        <div className="card p-4">
          <ExerciseBrowser
            id="library"
            gym={gym}
            onPick={(id) => go("exercise", id)}
            action={<span aria-hidden>›</span>}
            waitForFilter={mine.length > 0}
            startHere={false}
          />
        </div>
      </Section>
    </div>
  );
}
