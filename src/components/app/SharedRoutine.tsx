"use client";

import { useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { available, exercise } from "@/lib/exercises";
import { t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { MAX_ROUTINES } from "@/lib/routines";
import { decodeRoutine, sameItems } from "@/lib/routineShare";
import { useApp } from "@/lib/store";
import { MUSCLE_LABEL } from "@/lib/types";

import { go } from "./router";
import { Button, EmptyState, ScreenHeader } from "./ui";

// A routine someone shared (#/routine/<code>, routines.ts): a preview of its exercises and sets, then
// one tap saves it to this lifter's own routines. Weights and reps come from their own progression.

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

export function SharedRoutine({ code }: { code?: string }) {
  const { profile, gyms, active, saveRoutine, pickRoutine } = useApp();
  const shared = useMemo(() => (code ? decodeRoutine(code) : null), [code]);
  const [savedId, setSavedId] = useState<string | null>(null);
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const can = useMemo(() => new Set(available(gym?.equipment ?? []).map((e) => e.id)), [gym]);
  if (!shared) {
    return (
      <div className="pt-10">
        <EmptyState
          icon="layers"
          title={t("rt.linkBroken")}
          body={t("rt.linkBrokenBody")}
          action={<Button onClick={() => go("today")}>{t("remix.back")}</Button>}
        />
      </div>
    );
  }
  const routines = profile.routines ?? [];
  const existing = savedId ? routines.find((r) => r.id === savedId) : routines.find((r) => sameItems(r.items, shared.items));
  const full = !existing && routines.length >= MAX_ROUTINES;
  const missing = shared.items.filter((i) => !can.has(i.exerciseId)).length;
  const letters = new Map<string, string>();
  for (const it of shared.items) if (it.group && !letters.has(it.group)) letters.set(it.group, String.fromCharCode(65 + letters.size));
  const sets = shared.items.reduce((n, i) => n + i.sets, 0);
  const save = () => {
    const id = newId();
    const at = Date.now();
    haptic("success");
    sound.tick();
    saveRoutine({ id, name: shared.name, items: shared.items, createdAt: at, updatedAt: at });
    track("feature", { name: "routine_share", detail: "import" });
    setSavedId(id);
  };
  return (
    <div className="pb-2">
      <ScreenHeader title={t("rt.sharedTitle")} kicker={t("rt.sharedKicker")} />
      <section className="card card-tint mt-4 p-4" style={{ ["--tint" as string]: "var(--color-accent)" }}>
        <h2 className="text-xl font-bold break-words">{shared.name}</h2>
        <p className="num mt-1 text-sm text-muted">
          {t("rt.summary", { exercises: t("rt.exercises", { count: shared.items.length }), sets: t("rt.sets", { count: sets }) })}
        </p>
        <p className="mt-2 text-sm text-muted">{t("rt.sharedWhy")}</p>
      </section>
      <ol className="card mt-4 divide-y divide-line">
        {shared.items.map((it, i) => {
          const e = exercise(it.exerciseId);
          const here = can.has(it.exerciseId);
          return (
            <li key={`${it.exerciseId}-${i}`} className={`flex items-center gap-3 px-4 py-3 ${it.group ? "bg-accent/5" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="font-medium break-words">
                  {it.group && <span className="mr-1.5 text-xs font-bold text-accent">{letters.get(it.group)}</span>}
                  {e.name}
                </div>
                <div className="text-xs text-muted">
                  {e.primary.map((m) => MUSCLE_LABEL[m]).join(", ")}
                  {!here && <span className="text-warn"> · {t("rt.notHere")}</span>}
                </div>
              </div>
              <span className="num shrink-0 text-sm text-muted">{t("rt.sets", { count: it.sets })}</span>
            </li>
          );
        })}
      </ol>
      {missing > 0 && <p className="mt-3 text-sm text-muted">{t("rt.sharedMissing", { gym: gym?.name ?? t("remix.yourGym") })}</p>}
      <div className="mt-6 grid gap-2">
        {existing ? (
          <>
            <p className="text-center text-sm text-muted" role="status">
              {savedId ? t("rt.sharedSaved") : t("rt.sharedHave", { name: existing.name })}
            </p>
            {active ? (
              <p className="text-center text-sm text-muted">{t("remix.finishFirst")}</p>
            ) : (
              <Button
                icon="check"
                className="w-full py-4 text-lg"
                onClick={() => {
                  haptic("tap");
                  pickRoutine(existing.id);
                  go("today");
                }}
              >
                {t("rt.sharedUse")}
              </Button>
            )}
          </>
        ) : full ? (
          <p className="text-center text-sm text-muted" role="status">
            {t("rt.sharedFull", { count: MAX_ROUTINES })}
          </p>
        ) : (
          <Button icon="plus" className="w-full py-4 text-lg" onClick={save}>
            {t("rt.sharedSave")}
          </Button>
        )}
        <Button kind="quiet" className="w-full" onClick={() => go("today")}>
          {existing ? t("remix.back") : t("remix.notNow")}
        </Button>
      </div>
    </div>
  );
}
