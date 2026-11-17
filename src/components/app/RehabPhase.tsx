"use client";

// Rehab protocols on Today (2026-11-17, from the gap list: "Physio rehab protocols with pain tracking";
// docs/decisions/trainer-mode.md "Rehab protocols"). Two cards, each only when there's something to do:
//  - The day after a rehab workout: how the area feels now, one slider per injury it's for. A flare the next day is
//    what tells a physio to slow down, so it feeds the phase rule (rehabPhases.ts) and the physio's report.
//  - The phase rule's answer, when it has one: ready for the next phase, or back one. The lifter moves it themselves
//    only when their physio allowed it; otherwise the card says the physio decides. "Got it" hides it on this device
//    until the answer changes.
import { useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { t } from "@/lib/i18n";
import { PART_LABEL } from "@/lib/injury";
import { haptic, sound } from "@/lib/juice";
import { rehabRoutine } from "@/lib/partExtras";
import { PHASES, phaseTitle } from "@/lib/rehab";
import { nextDayDue, PAIN_EASY, PAIN_HIGH, phaseTo, routinePhase, type PhaseCheck } from "@/lib/rehabPhases";
import { useApp } from "@/lib/store";
import { useNow } from "@/lib/useNow";

import { Icon } from "./icons";
import { PainSelect } from "./Injuries";
import { Button } from "./ui";

const SEEN = "liftsmith.rehabPhase.seen";

function readSeen(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN) ?? "[]") as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeSeen(list: string[]) {
  try {
    localStorage.setItem(SEEN, JSON.stringify(list.slice(-20)));
  } catch {
    // Private windows: the card shows again next time, which is fine.
  }
}

/** Why the rule says what it says, in a short line built from the numbers behind it. */
export function phaseWhy(c: PhaseCheck): string {
  const pains = c.recent.join(", ");
  switch (c.status) {
    case "ready":
    case "last":
      return t("rhp.why.ready", { count: c.recent.length, easy: PAIN_EASY });
    case "back":
      return c.flare ? t("rhp.why.flare") : t("rhp.why.high", { high: PAIN_HIGH, pains });
    case "early":
      return t("rhp.why.early", { done: c.sessions, need: c.need });
    case "unrated":
      return t("rhp.why.unrated");
    case "hold":
      return t("rhp.why.hold", { pains, easy: PAIN_EASY });
  }
}

/** The day after a rehab workout: how does the area feel now? */
export function NextDayPain() {
  const { profile, events, active, ratePain } = useApp();
  const now = useNow();
  const routine = rehabRoutine(profile);
  const due = useMemo(() => (routine ? nextDayDue(events, routine, now) : undefined), [routine, events, now]);
  if (active || !routine || !due) return null;
  const hurt = due.injuryIds.flatMap((id) => {
    const inj = events.find((e) => e.type === "injury" && e.injuryId === id);
    return inj && inj.type === "injury" ? [{ id, part: inj.part }] : [];
  });
  if (!hurt.length) return null;
  return (
    <section className="card card-tint mt-3 p-4" style={{ ["--tint" as string]: "var(--color-violet)" }} data-testid="next-day-pain">
      <div className="flex items-start gap-3">
        <Icon name="bandage" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold break-words">{t("rhp.nextDay.title")}</h2>
          <p className="mt-1 text-sm text-muted">{t("rhp.nextDay.why")}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {hurt.map((i) => (
          <PainSelect
            key={i.id}
            label={t("rhp.nextDay.label", { part: PART_LABEL[i.part] })}
            onRate={(n) => {
              ratePain(i.id, n, { nextDay: due.sessionId });
              track("feature", { name: "trainer", detail: "rehabNextDay" });
            }}
          />
        ))}
      </div>
    </section>
  );
}

/** What the phase rule says about the lifter's rehab protocol, when it says something worth doing. */
export function RehabPhaseToday() {
  const { profile, events, active, moveRehabPhase } = useApp();
  const now = useNow();
  const routine = rehabRoutine(profile);
  const check = useMemo(() => (routine ? routinePhase(events, routine, now) : undefined), [routine, events, now]);
  const [seen, setSeen] = useState(readSeen);
  if (active || !routine?.rehabPlan || !check) return null;
  if (check.status !== "ready" && check.status !== "back" && check.status !== "last") return null;
  const key = `${routine.id}:${check.phase}:${check.status}:${routine.rehabPlan.since ?? 0}`;
  if (seen.includes(key)) return null;
  const to = phaseTo(check);
  const self = !!routine.rehabPlan.self;
  const hide = () => {
    haptic("tick");
    const next = [...seen, key];
    writeSeen(next);
    setSeen(next);
  };
  const move = () => {
    if (to === undefined) return;
    haptic("success");
    sound.done();
    moveRehabPhase(routine.id, to);
  };
  const title =
    check.status === "ready"
      ? t("rhp.today.ready", { phase: to!, title: phaseTitle(to!) })
      : check.status === "back"
        ? t("rhp.today.back", { phase: to!, title: phaseTitle(to!) })
        : t("rhp.today.last", { of: PHASES });
  const who = check.status === "last" ? t("rhp.today.lastWho") : self ? null : t("rhp.today.physio");
  return (
    <section
      className="card card-tint mt-3 p-4"
      style={{ ["--tint" as string]: check.status === "back" ? "var(--color-warn)" : "var(--color-good)" }}
      data-testid="rehab-phase"
    >
      <div className="flex items-start gap-3">
        <Icon name="bandage" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-muted">{routine.name}</p>
          <h2 className="font-semibold break-words">{title}</h2>
          <p className="mt-1 text-sm text-muted">{phaseWhy(check)}</p>
          {who && <p className="mt-1 text-sm text-muted">{who}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {self && to !== undefined && (
          <Button kind="ghost" icon={check.status === "back" ? "undo" : "check"} className="flex-1" onClick={move}>
            {check.status === "back" ? t("rhp.today.moveBack", { phase: to }) : t("rhp.today.moveUp", { phase: to })}
          </Button>
        )}
        <Button kind="quiet" onClick={hide}>
          {t("rhp.today.gotIt")}
        </Button>
      </div>
    </section>
  );
}

/** "Phase 2 of 3: Build strength", for a rehab routine that follows a protocol. */
export function phaseLine(phase: number): string {
  return t("rhp.phaseOf", { phase, of: PHASES, title: phaseTitle(phase) });
}
