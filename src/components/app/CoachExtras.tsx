"use client";

import { useState } from "react";

import { SECTION_LABEL } from "@/components/titles";
import { can } from "@/lib/entitlements";
import { exercise } from "@/lib/exercises";
import { explain } from "@/lib/explain";
import type { PlanItem } from "@/lib/generator";
import { gymName } from "@/lib/gymNames";
import { list, t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { presetLabels, settingsFor, settingsLine, type Setting } from "@/lib/machineSettings";
import { activeInjuries } from "@/lib/injury";
import { pickWeights } from "@/lib/pickWeights";
import { bodyMode } from "@/lib/pregnancy";
import { target } from "@/lib/progression";
import { minutesLeft } from "@/lib/replan";
import { useApp } from "@/lib/store";
import { takenEquipment, takenSwaps, takenTarget } from "@/lib/takenSwap";
import { EQUIPMENT_LABEL, type Gym } from "@/lib/types";
import { useNow } from "@/lib/useNow";
import { itemWhy, whyContext } from "@/lib/why";

import { setText } from "./format";
import { go } from "./router";
import { Button, ProTag, Sheet } from "./ui";

// Optional workout helpers that live between sets: "why this weight", changing the plan when time or
// equipment runs out, and machine settings. None of them adds a tap to logging a set.

/** The reasons behind the suggested weight and reps. */
export function WhySheet({ open, onClose, item, gym }: { open: boolean; onClose: () => void; item: PlanItem | undefined; gym: Gym }) {
  const { events, profile, active, readiness } = useApp();
  const now = useNow();
  if (!open || !item || !active) return null;
  const ex = exercise(item.exerciseId);
  const why = explain({
    ex,
    target: item.target,
    events,
    profile,
    gym,
    now,
    call: active.plan.call,
    readiness: readiness?.score,
    sessionId: active.sessionId,
    item: itemWhy(item, whyContext(active.plan, events, profile, now)),
  });
  return (
    <Sheet open onClose={onClose} title={t("coach.whyTitle", { name: ex.name })}>
      <p className="font-semibold">{why.title}</p>
      <ul className="mt-3 space-y-2.5">
        {why.lines.map((l) => (
          <li key={l} className="flex gap-3 text-sm text-muted">
            <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {l}
          </li>
        ))}
      </ul>
      <Button kind="ghost" className="mt-5 w-full" onClick={onClose}>
        {t("coach.gotIt")}
      </Button>
    </Sheet>
  );
}

/** "Short on time" and "equipment taken": rebuilds the rest of the session. */
export function ReplanSheet({
  open,
  onClose,
  gym,
  doneOnCurrent,
}: {
  open: boolean;
  onClose: () => void;
  gym: Gym;
  doneOnCurrent: number;
}) {
  const s = useApp();
  const [changes, setChanges] = useState<string[] | null>(null);
  const now = useNow(60_000);
  const a = s.active;
  if (!open || !a) return null;
  const hurt = activeInjuries(s.events);
  const mode = bodyMode(s.profile, now);
  const weights = pickWeights(s.events, s.profile, now);
  const item = a.plan.items[a.index];
  const left = minutesLeft(a.plan.items, a.index, doneOnCurrent);
  const options = [10, 15, 20, 30, 45].filter((m) => m < left);
  // "Machine taken" (takenSwap.ts): the same pick the watch's one tap makes goes first, with its weight and why.
  const busy = item && !item.part ? takenEquipment(item.exerciseId) : [];
  const free = item && busy.length ? takenSwaps(item.exerciseId, gym, a.plan.items.map((i) => i.exerciseId), hurt, mode, weights).slice(0, 5) : [];
  const best = free[0];
  const bestEx = best ? exercise(best) : undefined;
  const bestTarget = bestEx ? takenTarget(bestEx.id, target(bestEx, s.events, s.profile, gym, now), hurt, gym, mode) : undefined;
  const close = () => {
    setChanges(null);
    onClose();
  };
  return (
    <Sheet open onClose={close} title={t("coach.changePlan")}>
      {changes ? (
        <div>
          <p className="font-semibold">{t("coach.fits")}</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {changes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <Button className="mt-5 w-full" onClick={close}>
            {t("coach.back")}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <h3 className={SECTION_LABEL}>{t("coach.short")}</h3>
            <p className="mt-1 text-sm text-faint">{t("coach.shortHint", { min: left })}</p>
            {options.length ? (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {options.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="press min-h-11 rounded-xl border border-line bg-raised text-sm"
                    onClick={() => {
                      haptic("tick");
                      setChanges(s.shortOnTime(m));
                    }}
                  >
                    {t("coach.minLeft", { min: m })}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">{t("coach.alreadyShort")}</p>
            )}
          </div>
          {item && busy.length > 0 && !can("replan") && (
            // Working around taken equipment is Pro: the section shows, and its one button opens the paywall.
            <div>
              <h3 className={SECTION_LABEL}>
                {t("coach.taken", {
                  items: list(
                    busy.map((e) => EQUIPMENT_LABEL[e]),
                    "disjunction",
                  ),
                })}
              </h3>
              <Button
                kind="ghost"
                className="mt-2 w-full"
                label={t("pro.locked", { what: t("pro.ft.replan") })}
                onClick={() => {
                  close();
                  go("pro", "replan");
                }}
              >
                {t("pro.ft.replan")} <ProTag className="ml-1" />
              </Button>
            </div>
          )}
          {item && busy.length > 0 && can("replan") && (
            <div>
              <h3 className={SECTION_LABEL}>
                {t("coach.taken", {
                  items: list(
                    busy.map((e) => EQUIPMENT_LABEL[e]),
                    "disjunction",
                  ),
                })}
              </h3>
              {doneOnCurrent === 0 && a.index < a.plan.items.length - 1 && (
                <Button
                  kind="ghost"
                  className="mt-2 w-full"
                  onClick={() => {
                    s.later();
                    close();
                  }}
                >
                  {t("coach.later", { name: exercise(item.exerciseId).name })}
                </Button>
              )}
              {bestEx && bestTarget && (
                <Button
                  className="mt-2 w-full"
                  icon="swap"
                  onClick={() => {
                    haptic("tap");
                    s.swap(bestEx.id, false, true);
                    close();
                  }}
                >
                  {t("coach.takenSwap", { name: bestEx.name })}
                </Button>
              )}
              {bestEx && bestTarget && (
                <p className="mt-1.5 text-sm text-muted">
                  {setText(bestEx, bestTarget.weight, bestTarget.reps, s.profile.unit)} · {t("coach.takenWhy")}
                </p>
              )}
              {free.length > 1 && <p className="mt-3 text-sm text-faint">{t("coach.swapOther")}</p>}
              <ul className="mt-1 divide-y divide-line">
                {free.slice(1).map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      className="press flex min-h-11 w-full items-center justify-between py-2.5 text-left"
                      onClick={() => {
                        haptic("tap");
                        s.swap(id, false, true);
                        close();
                      }}
                    >
                      <span className="font-medium">{exercise(id).name}</span>
                      <span className="text-accent">{t("coach.swap")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

/** Saved machine settings for this exercise at this gym, with an editor. Hidden for exercises with nothing to set. */
export function MachineSettings({ exerciseId, gym }: { exerciseId: string; gym: Gym }) {
  const { setMachineSettings } = useApp();
  const [open, setOpen] = useState(false);
  const labels = presetLabels(exerciseId);
  const saved = settingsFor(gym, exerciseId);
  const [draft, setDraft] = useState<Setting[]>([]);
  if (!labels.length) return null;
  const line = settingsLine(saved);
  const edit = () => {
    setDraft(labels.map((l) => ({ label: l, value: saved.find((x) => x.label === l)?.value ?? "" })));
    setOpen(true);
  };
  return (
    <>
      <button
        type="button"
        onClick={edit}
        className="press mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm text-muted"
      >
        <span aria-hidden>⚙</span>
        {line ? <span className="text-ink">{line}</span> : t("coach.saveSetup")}
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t("coach.setupTitle", { name: exercise(exerciseId).name, gym: gymName(gym.name) })}
      >
        <p className="mb-3 text-sm text-muted">{t("coach.setupHint")}</p>
        <div className="space-y-3">
          {draft.map((d, i) => (
            <label key={d.label} className="flex items-center justify-between gap-3">
              <span>{d.label}</span>
              <input
                value={d.value}
                maxLength={16}
                inputMode="text"
                placeholder={t("coach.placeholder")}
                aria-label={d.label}
                onChange={(e) => setDraft(draft.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                className="w-32 rounded-xl border border-line bg-raised px-3 py-2 text-right"
              />
            </label>
          ))}
        </div>
        <Button
          className="mt-5 w-full"
          onClick={() => {
            setMachineSettings(exerciseId, draft, gym.id);
            setOpen(false);
          }}
        >
          {t("coach.save")}
        </Button>
      </Sheet>
    </>
  );
}
