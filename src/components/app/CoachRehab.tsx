"use client";

// Physio support in trainer mode (Melvin, 2026-11-13: "add physios support"; docs/decisions/trainer-mode.md).
// The pieces that sit inside Coaching (Trainer.tsx): how a coach works (trainer or physio), a client's pain and
// injuries on their report when they share them, and the rehab programs and times a week in the assign sheet. The
// client's own "Share pain and injuries" switch sits with the other sharing switches (CoachShare.tsx). Liftsmith shows
// what the client logs; it never diagnoses or says what's safe for an injury, and every screen here says so.
import { useState } from "react";

import { date, t } from "@/lib/i18n";
import { PART_LABEL } from "@/lib/injury";
import {
  phaseBody,
  phaseItems,
  phaseRoutineName,
  PHASES,
  phaseTitle,
  protocolName,
  REHAB_PROGRAMS,
  rehabBody,
  type RehabProgram,
} from "@/lib/rehab";
import { PAIN_EASY, PAIN_HIGH, PHASE_MIN_SESSIONS, phaseTo } from "@/lib/rehabPhases";
import { liftName, type PlanProgress, type RehabInjury } from "@/lib/trainer";
import type { Routine } from "@/lib/types";

import { Sparkline } from "./Injuries";
import { phaseLine, phaseWhy } from "./RehabPhase";
import { Button, Chip, InlineSwitch, Section } from "./ui";

/** "Phase 2: Build strength", on the phase chips. */
const phaseLabel = (n: number) => t("rhp.chip", { phase: n, title: phaseTitle(n) });

/**
 * Under an assigned protocol on the client's report: its phase, what the pain rule says and why, and the one-tap move
 * to the phase it points to (which sends the client that phase, replacing this one).
 */
export function PlanPhase({ rehab, onMove }: { rehab: NonNullable<PlanProgress["rehab"]>; onMove: (phase: number) => void }) {
  const to = rehab.check ? phaseTo(rehab.check) : undefined;
  return (
    <span className="mt-0.5 block text-xs text-muted" data-testid="plan-phase">
      <span className="block">
        {phaseLine(rehab.phase)}
        {rehab.plan.self ? ` · ${t("rhp.selfShort")}` : ""}
      </span>
      <span className="block">{rehab.check ? phaseWhy(rehab.check) : t("rhp.noPain")}</span>
      {to !== undefined && (
        <Button kind="ghost" className="mt-1.5" onClick={() => onMove(to)}>
          {rehab.check!.status === "back" ? t("rhp.coach.back", { phase: to }) : t("rhp.coach.up", { phase: to })}
        </Button>
      )}
    </span>
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
                {i.lastWorkout && (
                  <p className="num mt-1 text-sm text-muted" data-testid="client-pain-workout">
                    {t("trn.painWorkout", {
                      before: i.lastWorkout.before,
                      after: i.lastWorkout.after,
                      date: date(i.lastWorkout.at, { month: "short", day: "numeric" }),
                    })}
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

/** A rehab protocol as it's assigned: its phase's name and exercises, the area, and the phase it starts in. */
export function protocolRoutine(
  p: RehabProgram,
  phase: number,
  self: boolean,
): Pick<Routine, "name" | "items" | "rehab" | "rehabPart" | "rehabPlan"> {
  return {
    name: phaseRoutineName(p, phase),
    items: phaseItems(p, phase),
    rehab: true,
    rehabPart: p.part,
    rehabPlan: { id: p.id, phase, ...(self ? { self: true as const } : {}) },
  };
}

/**
 * The rehab protocols a coach can assign in one tap (rehab.ts), with the phase to start in and whether the client may
 * move phases on their own when the pain rule says so (off by default: the physio decides).
 * `selfServe` is the lifter's own sheet (2026-11-22): phase 1, and they move phases when the pain rule says so.
 */
export function RehabPrograms({
  onPick,
  selfServe = false,
}: {
  onPick: (p: RehabProgram, phase: number, self: boolean) => void;
  selfServe?: boolean;
}) {
  const [phase, setPhase] = useState(1);
  const [self, setSelf] = useState(false);
  const programs = (
    <ul className="space-y-2">
      {REHAB_PROGRAMS.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => onPick(p, selfServe ? 1 : phase, selfServe ? true : self)}
            className="press card flex w-full items-center gap-3 px-4 py-3 text-left"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{protocolName(p)}</span>
              {(selfServe || phase === 1) && <span className="block text-sm text-muted">{rehabBody(p)}</span>}
              <span className="mt-0.5 block text-xs text-muted">
                {phaseItems(p, selfServe ? 1 : phase)
                  .map((i) => liftName(i.exerciseId, new Map()))
                  .join(", ")}
              </span>
            </span>
            <span aria-hidden className="text-faint">
              ›
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
  if (selfServe) return programs;
  return (
    <div className="mb-4">
      <p className="mb-1 text-sm font-semibold">{t("trn.rehabTitle")}</p>
      <p className="mb-2 text-xs text-muted">{t("trn.rehabHint")}</p>
      <p className="text-sm font-medium" id="rhp-start">
        {t("rhp.startAt")}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2" role="group" aria-labelledby="rhp-start">
        {Array.from({ length: PHASES }, (_, i) => i + 1).map((n) => (
          <Chip key={n} active={phase === n} onClick={() => setPhase(n)}>
            {phaseLabel(n)}
          </Chip>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">{phaseBody(phase)}</p>
      <InlineSwitch className="mt-2" label={t("rhp.selfLabel")} hint={t("rhp.selfHint")} on={self} onChange={setSelf} />
      <p className="mt-1 mb-2 text-xs text-muted">{t("rhp.rule", { need: PHASE_MIN_SESSIONS, easy: PAIN_EASY, high: PAIN_HIGH })}</p>
      {programs}
    </div>
  );
}
