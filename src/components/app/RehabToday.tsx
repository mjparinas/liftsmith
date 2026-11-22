"use client";

// Rehab on Today (Melvin, 2026-11-15, from the rehab gaps review: "Do 1, 4, 3, 5"; docs/decisions/trainer-mode.md
// "Rehab that gets done"). Two cards:
//  - A program a coach or physio sent that isn't saved yet: save it in one tap (a rehab program also logs the
//    injury it's for, as the preview does), see it first, or Not now.
//  - The physio's rehab on a day without lifting (a rest day, or after today's workout), when it's due: one tap
//    picks it for today, so Start runs it on its own. Beside the lifting it's the Rehab row in Today's parts.
import { useMemo } from "react";

import { track } from "@/lib/analytics";
import { planSeconds } from "@/lib/generator";
import { inSentence, t } from "@/lib/i18n";
import { PART_LABEL } from "@/lib/injury";
import { haptic, sound } from "@/lib/juice";
import { rehabDue, rehabInjuries, rehabItems, rehabRoutine, type RehabDue } from "@/lib/partExtras";
import { MAX_ROUTINES } from "@/lib/routines";
import { decodeRoutine, sameItems } from "@/lib/routineShare";
import { useApp } from "@/lib/store";
import { dismissEnded, dismissPlan, endedPrograms, useCoachNotes, type ShownPlan } from "@/lib/trainer";
import type { Routine } from "@/lib/types";
import { useNow } from "@/lib/useNow";

import { Icon } from "./icons";
import { phaseLine } from "./RehabPhase";
import { go } from "./router";
import { Button } from "./ui";

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

/** The first program from a coach that isn't saved and wasn't put off, decoded. */
function waitingPlan(plans: readonly ShownPlan[], seen: readonly string[], routines: readonly Routine[]) {
  for (const p of plans) {
    if (seen.includes(p.id)) continue;
    const d = decodeRoutine(p.code);
    if (!d) continue;
    if (routines.some((r) => sameItems(r.items, d.items) && !!r.rehab === !!d.rehab)) continue;
    return { plan: p, routine: d };
  }
  return null;
}

/** A program from a coach or physio waiting to be saved. */
export function PlanToday() {
  const plans = useCoachNotes((s) => s.plans);
  const seen = useCoachNotes((s) => s.plansSeen);
  const { profile, events, saveShared } = useApp();
  const saved = profile.routines;
  const waiting = useMemo(() => waitingPlan(plans, seen, saved ?? []), [plans, seen, saved]);
  const routines = saved ?? [];
  if (!waiting) return null;
  const { plan, routine } = waiting;
  // A new phase of a protocol already saved replaces it (2026-11-17), so it fits even with the routine list full.
  const phase = routine.rehab ? routine.rehabPlan : undefined;
  const replaces = phase ? routines.find((r) => r.rehab && r.rehabPlan?.id === phase.id) : undefined;
  if (!replaces && routines.length >= MAX_ROUTINES) return null;
  const coach = plan.coach || t("trn.noName");
  const area = routine.rehab ? routine.rehabPart : undefined;
  const perWeek = routine.rehab ? (routine.perWeek ?? plan.perWeek) : undefined;
  const linked = !!area && rehabInjuries(events, routine).length > 0;
  const body = area
    ? linked
      ? t("trn.planToday.rehabLinked", { part: inSentence(PART_LABEL[area]) })
      : t("trn.planToday.rehabLog", { part: inSentence(PART_LABEL[area]) })
    : routine.rehab
      ? t("trn.planToday.rehab")
      : t("trn.planToday.plain");
  const save = () => {
    const at = Date.now();
    haptic("success");
    sound.tick();
    saveShared({
      id: newId(),
      name: routine.name,
      items: routine.items,
      createdAt: at,
      updatedAt: at,
      ...(routine.rehab ? { rehab: true } : {}),
      ...(area ? { rehabPart: area } : {}),
      ...(perWeek ? { perWeek } : {}),
      ...(routine.rehab && routine.rehabPlan ? { rehabPlan: routine.rehabPlan } : {}),
      ...(routine.parts ? { parts: routine.parts } : {}),
      assignedPlan: { id: plan.id, coachId: plan.coachId },
    });
    track("feature", { name: "trainer", detail: "planTodaySave" });
  };
  return (
    <section
      className="card card-tint mt-3 p-4"
      style={{ ["--tint" as string]: routine.rehab ? "var(--color-violet)" : "var(--color-accent)" }}
      data-testid="plan-today"
    >
      <div className="flex items-start gap-3">
        <Icon name={routine.rehab ? "bandage" : "layers"} />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold break-words">{t("trn.planToday.title", { name: coach, plan: plan.name })}</h2>
          <p className="mt-1 text-sm text-muted">{body}</p>
          {phase ? (
            <p className="mt-1 text-sm text-muted" data-testid="plan-today-phase">
              {phaseLine(phase.phase)}
              {replaces ? ` ${t("rhp.replaces", { name: replaces.name })}` : ""}
            </p>
          ) : null}
          {perWeek ? <p className="mt-1 text-sm text-muted">{t("trn.planToday.week", { name: coach, count: perWeek })}</p> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button kind="ghost" icon="plus" className="flex-1" onClick={save}>
          {t("trn.planToday.save")}
        </Button>
        <Button kind="quiet" onClick={() => go("routine", plan.code)}>
          {t("trn.planToday.see")}
        </Button>
        <Button kind="quiet" onClick={() => dismissPlan(plan.id)}>
          {t("trn.planToday.later")}
        </Button>
      </div>
    </section>
  );
}

/**
 * A program the coach took back (2026-11-22). The saved routine is still here; one tap stops it, the other keeps it
 * without the coach's plan. Shown only after an overview has loaded, so a cold start doesn't guess.
 */
export function PlanEnded() {
  const plans = useCoachNotes((s) => s.plans);
  const ready = useCoachNotes((s) => s.plansReady);
  const dismissed = useCoachNotes((s) => s.plansEnded);
  const coaches = useCoachNotes((s) => s.who.coaches);
  const { profile, saveRoutine, deleteRoutine } = useApp();
  const ended = useMemo(() => endedPrograms(profile.routines ?? [], plans, ready, dismissed), [profile.routines, plans, ready, dismissed]);
  const routine = ended[0];
  const planId = routine?.assignedPlan?.id;
  if (!routine || !planId || !routine.assignedPlan) return null;
  const coach = coaches.find((c) => c.id === routine.assignedPlan?.coachId)?.name || t("trn.noName");
  const stop = () => {
    haptic("tap");
    deleteRoutine(routine.id);
    dismissEnded(planId);
  };
  const keep = () => {
    haptic("tap");
    const rest = { ...routine };
    delete rest.assignedPlan;
    saveRoutine(rest);
    dismissEnded(planId);
  };
  return (
    <section className="card card-tint mt-3 p-4" style={{ ["--tint" as string]: "var(--color-violet)" }} data-testid="plan-ended">
      <div className="flex items-start gap-3">
        <Icon name="bandage" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold break-words">{t("trn.planEnd.title", { name: coach, plan: routine.name })}</h2>
          <p className="mt-1 text-sm text-muted">{t("trn.planEnd.body")}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button kind="ghost" className="flex-1" onClick={stop}>
          {t("trn.planEnd.stop")}
        </Button>
        <Button kind="quiet" onClick={keep}>
          {t("trn.planEnd.keep")}
        </Button>
      </div>
    </section>
  );
}

/** Why the rehab is offered today, in a short line (the physio's times a week when they set one). */
export function rehabDueWhy(due: RehabDue): string {
  if (due.want !== undefined) return t("str.rehabDay.week", { done: due.week, want: due.want });
  if (due.days === undefined) return t("str.rehabDay.new");
  return t("str.rehabDay.days", { count: due.days });
}

/** The physio's rehab on a day without lifting: a rest day, or once today's workout is done. */
export function RehabToday() {
  const { profile, gyms, events, active, pickRoutine, trainAgain } = useApp();
  const now = useNow();
  const routine = rehabRoutine(profile);
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const due = useMemo(() => (routine ? rehabDue(events, routine, now) : null), [routine, events, now]);
  const minutes = useMemo(
    () => (routine && gym ? Math.max(1, Math.round(planSeconds(rehabItems(routine, gym, events, profile, now)) / 60)) : 0),
    [routine, gym, events, profile, now],
  );
  if (active || !routine || !due?.due || !minutes) return null;
  const start = () => {
    haptic("tap");
    trainAgain();
    pickRoutine(routine.id);
    track("feature", { name: "trainer", detail: "rehabDay" });
  };
  return (
    <section className="card card-tint mt-3 p-4" style={{ ["--tint" as string]: "var(--color-violet)" }} data-testid="rehab-today">
      <div className="flex items-start gap-3">
        <Icon name="bandage" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold break-words">{t("str.rehabDay.title", { name: routine.name })}</h2>
          {routine.rehabPlan && <p className="mt-1 text-sm text-muted">{phaseLine(routine.rehabPlan.phase)}</p>}
          <p className="mt-1 text-sm text-muted">{rehabDueWhy(due)}</p>
          <p className="num mt-1 text-xs text-muted">{t("str.rehabDay.minutes", { count: minutes })}</p>
        </div>
      </div>
      <Button kind="ghost" icon="play" className="mt-3 w-full" onClick={start}>
        {t("str.rehabDay.start")}
      </Button>
    </section>
  );
}
