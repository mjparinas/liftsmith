"use client";

// Physio support in trainer mode (Melvin, 2026-11-13: "add physios support"; docs/decisions/trainer-mode.md).
// The pieces that sit inside Coaching (Trainer.tsx): how a coach works (trainer or physio), a client's pain and
// injuries on their report when they share them, the rehab programs and times a week in the assign sheet, and the
// client's own "Share pain and injuries" switch. Liftsmith shows what the client logs; it never diagnoses or says
// what's safe for an injury, and every screen here says so.
import { useState } from "react";

import { track } from "@/lib/analytics";
import { date, t } from "@/lib/i18n";
import { PART_LABEL } from "@/lib/injury";
import { haptic, oops } from "@/lib/juice";
import { REHAB_PROGRAMS, rehabBody, rehabName, type RehabProgram } from "@/lib/rehab";
import { liftName, setPainShare, trainerError, type Person, type RehabInjury } from "@/lib/trainer";

import { Sparkline } from "./Injuries";
import { Chip, Section, SwitchRow } from "./ui";

/** The client's switch, one per coach: share pain ratings and injuries, off until they turn it on. */
export function PainShareSwitch({ coach, on, onChange }: { coach: Person; on: boolean; onChange: () => void }) {
  const [note, setNote] = useState<string | null>(null);
  const flip = async (v: boolean) => {
    try {
      await setPainShare(coach.id, v);
      haptic("toggle");
      track("feature", { name: "trainer", detail: v ? "sharePain" : "unsharePain" });
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
  };
  return (
    <>
      <SwitchRow
        label={t("trn.sharePain", { name: coach.name || t("trn.noName") })}
        hint={t("trn.sharePainHint")}
        on={on}
        onChange={(v) => void flip(v)}
      />
      {note && (
        <p className="mt-1 px-1 text-sm text-muted" role="status">
          {note}
        </p>
      )}
    </>
  );
}

/** On a client's report: each injury with its pain trend and the latest rating on each exercise. */
export function ClientPain({ name, rehab, names }: { name: string; rehab: RehabInjury[] | null; names: ReadonlyMap<string, string> }) {
  const who = name || t("trn.noName");
  return (
    <Section title={t("trn.painTitle")} icon="bandage">
      {rehab === null ? (
        <p className="px-1 text-sm text-muted">{t("trn.painNotShared", { name: who })}</p>
      ) : rehab.length === 0 ? (
        <p className="px-1 text-sm text-muted">{t("trn.painNone", { name: who })}</p>
      ) : (
        <ul className="space-y-2">
          {rehab.map((i) => {
            const part = PART_LABEL[i.part];
            return (
              <li key={i.id} className="card p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{part}</span>
                  <span className="text-xs text-muted">
                    {i.healedAt !== undefined
                      ? t("trn.painHealed", { date: date(i.healedAt, { month: "short", day: "numeric" }) })
                      : t("trn.painSince", { date: date(i.since, { month: "short", day: "numeric" }) })}
                  </span>
                </div>
                {i.latest !== undefined ? (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="display num text-2xl">
                      {i.latest}
                      <span className="text-sm text-muted">/10</span>
                    </span>
                    {i.points.length > 1 && (
                      <Sparkline points={i.points} label={t("inj.pain.spark", { part, points: i.points.join(", ") })} />
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted">{t("trn.painNoRatings")}</p>
                )}
                {i.change !== undefined && i.change !== 0 && (
                  <p className="mt-1 text-sm text-muted">
                    {t(i.change > 0 ? "trn.painWorse" : "trn.painBetter", { count: Math.abs(i.change) })}
                  </p>
                )}
                {i.byExercise.length > 0 && (
                  <ul className="mt-2 divide-y divide-line border-t border-line">
                    {i.byExercise.map((x) => (
                      <li key={x.exerciseId} className="flex items-baseline justify-between gap-2 py-1.5 text-sm">
                        <span className="min-w-0 truncate">{liftName(x.exerciseId, names)}</span>
                        <span className="num shrink-0 text-muted">
                          {x.score}/10 · {date(x.at, { month: "short", day: "numeric" })}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-2 px-1 text-xs text-muted">{t("trn.painDisclaimer")}</p>
    </Section>
  );
}

/** Times a week for what's assigned next, as chips (none picked means the coach didn't say). */
export function PerWeekPicker({ value, onChange }: { value: number | undefined; onChange: (v: number | undefined) => void }) {
  return (
    <div className="mb-3">
      <p className="text-sm font-medium" id="trn-per-week">
        {t("trn.perWeek")}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-labelledby="trn-per-week">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <Chip key={d} active={value === d} onClick={() => onChange(value === d ? undefined : d)}>
            <span className="num">{d}</span>
          </Chip>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">{t("trn.perWeekHint")}</p>
    </div>
  );
}

/** The rehab programs a coach can assign in one tap (rehab.ts). */
export function RehabPrograms({ onPick }: { onPick: (p: RehabProgram) => void }) {
  return (
    <div className="mb-4">
      <p className="mb-1 text-sm font-semibold">{t("trn.rehabTitle")}</p>
      <p className="mb-2 text-xs text-muted">{t("trn.rehabHint")}</p>
      <ul className="space-y-2">
        {REHAB_PROGRAMS.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => onPick(p)} className="press card flex w-full items-center gap-3 px-4 py-3 text-left">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{rehabName(p)}</span>
                <span className="block text-sm text-muted">{rehabBody(p)}</span>
                <span className="mt-0.5 block text-xs text-muted">{p.items.map((i) => liftName(i.exerciseId, new Map())).join(", ")}</span>
              </span>
              <span aria-hidden className="text-faint">
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
