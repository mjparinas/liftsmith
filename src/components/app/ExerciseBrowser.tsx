"use client";

import { useMemo, useState, type ReactNode } from "react";

import { searchExercises } from "@/lib/exerciseSearch";
import { t } from "@/lib/i18n";
import { MUSCLE_LABEL, MUSCLES, type Exercise, type Gym, type Muscle } from "@/lib/types";

import { muscleHue } from "./theme";
import { Chip, Switch } from "./ui";

/**
 * The one exercise browser (Melvin, 2026-11-11: "some kind of search or organization or both"): type a
 * few letters, or tap a main muscle (or Cardio), and keep "Only what this gym has" on to see what can be
 * done here. Typing is optional: the chips alone narrow 1,000 exercises to a short list. Used to add an
 * exercise to a routine or a workout, in the swap sheet and in exercise preferences.
 */
export function ExerciseBrowser({
  id,
  gym,
  skip = [],
  onPick,
  action,
  note,
  startGroup = null,
  waitForFilter = false,
  groupLabel,
}: {
  /** Unique on the screen, for the search box's label. */
  id: string;
  gym: Gym | null | undefined;
  skip?: readonly string[];
  onPick: (exerciseId: string) => void;
  /** What a row's tap does, shown at its end ("+", "Swap"). */
  action: ReactNode;
  /** An extra line on a row (an injury note, say). */
  note?: (e: Exercise) => string | undefined;
  startGroup?: Muscle | "cardio" | null;
  /** Show no list until something is typed or a chip is picked (for a browser that sits open on a page). */
  waitForFilter?: boolean;
  /** The chips' group name for screen readers, when the screen names it (default "Main muscle"). */
  groupLabel?: string;
}) {
  const [text, setText] = useState("");
  const [group, setGroup] = useState<Muscle | "cardio" | null>(startGroup);
  const [here, setHere] = useState(!!gym);
  const list = useMemo(
    () => searchExercises({ text, group, equipment: here && gym ? gym.equipment : null, skip }),
    [text, group, here, gym, skip],
  );
  const pick = (g: Muscle | "cardio") => setGroup(group === g ? null : g);
  return (
    <div>
      <label className="sr-only" htmlFor={`${id}-search`}>
        {t("wk.find.search")}
      </label>
      <input
        id={`${id}-search`}
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("wk.find.search")}
        autoComplete="off"
        className="w-full rounded-xl border border-line bg-raised px-3 py-3 text-base outline-none focus:border-accent"
      />
      <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={groupLabel ?? t("wk.find.groups")}>
        {MUSCLES.map((m) => (
          <Chip key={m} active={group === m} onClick={() => pick(m)}>
            {MUSCLE_LABEL[m]}
          </Chip>
        ))}
        <Chip active={group === "cardio"} onClick={() => pick("cardio")}>
          {t("wk.find.cardio")}
        </Chip>
      </div>
      {gym && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <span id={`${id}-here`} className="text-sm">
            {t("wk.find.here")}
          </span>
          <Switch on={here} onChange={setHere} labelledBy={`${id}-here`} />
        </div>
      )}
      {waitForFilter && !text.trim() && !group ? null : (
        <>
          <p className="mt-3 text-xs text-muted" aria-live="polite">
            {t("wk.find.count", { n: list.length, count: list.length })}
          </p>
          {list.length ? (
            <ul className="mt-1 max-h-[22rem] divide-y divide-line/70 overflow-y-auto" data-no-swipe>
              {list.map((e) => {
                const extra = note?.(e);
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => onPick(e.id)}
                      className="press flex min-h-12 w-full items-center justify-between gap-3 py-2 text-left"
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: muscleHue(e.primary[0]!) }} aria-hidden />
                        <span className="min-w-0">
                          <span className="block font-medium">{e.name}</span>
                          <span className="block text-sm text-muted">
                            {e.primary.map((m) => MUSCLE_LABEL[m]).join(", ")}
                            {extra ? ` · ${extra}` : ""}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-accent">{action}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">{t("wk.find.none")}</p>
          )}
        </>
      )}
    </div>
  );
}
