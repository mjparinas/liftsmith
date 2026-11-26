"use client";

// Today cards for a season program a coach assigned (coachProgramAssign.ts): Follow once, or finished / taken back.
import { useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import { WEEKDAYS } from "@/lib/calendar";
import {
  acceptProgramAssign,
  catchUpAssign,
  coachProgramDayIndex,
  coachProgramEndAt,
  coachProgramNext,
  coachProgramPhase,
  coachProgramWeek,
  endProgramAssign,
  followAssign,
} from "@/lib/coachProgramAssign";
import { date, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { MAX_ROUTINES, upsertRoutine } from "@/lib/routines";
import { useApp } from "@/lib/store";
import { dismissProgramAssign, useCoachNotes, type ShownProgramAssign } from "@/lib/trainer";
import { useNow } from "@/lib/useNow";

import { Icon } from "./icons";
import { AthleteProgramCalendar } from "./ProgramCalendar";
import { go } from "./router";
import { Button, Sheet } from "./ui";

function waitingAssign(assigns: readonly ShownProgramAssign[], seen: readonly string[], followingId: string | undefined) {
  for (const a of assigns) {
    if (a.status !== "pending") continue;
    if (seen.includes(a.id)) continue;
    if (followingId === a.id) continue;
    return a;
  }
  return null;
}

/** A season program from a coach waiting to be followed. */
export function ProgramAssignToday() {
  const assigns = useCoachNotes((s) => s.programAssigns);
  const seen = useCoachNotes((s) => s.programAssignsSeen);
  const { profile, setProfile, replan } = useApp();
  const following = profile.planSource?.kind === "coachProgram" ? profile.planSource.assignId : undefined;
  const waiting = useMemo(() => waitingAssign(assigns, seen, following), [assigns, seen, following]);
  if (!waiting) return null;
  const routines = profile.routines ?? [];
  if (routines.length + waiting.days.length > MAX_ROUTINES) return null;
  const coach = waiting.coach || t("trn.noName");

  const follow = async () => {
    try {
      haptic("success");
      sound.tick();
      const assign = await acceptProgramAssign(waiting.id);
      const { routines: days, planSource } = followAssign(assign);
      let list = routines;
      for (const r of days) list = upsertRoutine(list, r, Date.now());
      setProfile({ routines: list, planSource });
      replan();
      track("feature", { name: "trainer", detail: "followProgram" });
    } catch {
      oops();
    }
  };

  return (
    <section className="card card-tint mt-3 p-4" style={{ ["--tint" as string]: "var(--color-accent)" }} data-testid="program-assign-today">
      <div className="flex items-start gap-3">
        <Icon name="layers" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold break-words">{t("cpg.assignToday.title", { name: coach, plan: waiting.title })}</h2>
          <p className="mt-1 text-sm text-muted">{t("cpg.assignToday.body", { weeks: waiting.weeks, days: waiting.days.length })}</p>
          <p className="mt-1 text-sm text-muted">
            {waiting.days.map((d) => `${d.name} (${d.weekdays.map((w) => WEEKDAYS[w]).join("/")})`).join(" · ")}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => void follow()}>{t("cpg.assignToday.follow")}</Button>
        <Button kind="ghost" onClick={() => go("trainer")}>
          {t("cpg.assignToday.see")}
        </Button>
        <Button
          kind="ghost"
          onClick={() => {
            dismissProgramAssign(waiting.id);
            track("feature", { name: "trainer", detail: "followProgramLater" });
          }}
        >
          {t("cpg.assignToday.later")}
        </Button>
      </div>
    </section>
  );
}

/** Chip / line under Today's plan while following a season program. */
export function CoachProgramChip() {
  const { profile, setProfile, replan } = useApp();
  const [cal, setCal] = useState(false);
  const now = useNow(60_000);
  const src = profile.planSource;
  const assigns = useCoachNotes((s) => s.programAssigns);
  // The coach changed the program, or a day just for this lifter: bring the saved days up to date once.
  const followed = src?.kind === "coachProgram" ? assigns.find((a) => a.id === src.assignId) : undefined;
  useEffect(() => {
    const next = catchUpAssign(profile.routines ?? [], profile.planSource, followed);
    if (!next) return;
    setProfile({ routines: next.routines.slice(0, MAX_ROUTINES), planSource: next.planSource });
    replan();
  }, [followed, profile.routines, profile.planSource, setProfile, replan]);
  if (src?.kind !== "coachProgram") return null;
  if (now >= coachProgramEndAt(src)) {
    return (
      <p className="mt-2 text-sm text-muted" data-testid="coach-program-ended">
        {t("cpg.assignToday.ended", { plan: src.title })}
      </p>
    );
  }
  const dayI = coachProgramDayIndex(src, now);
  const nameOf = (i: number) => profile.routines?.find((r) => r.id === src.dayIds[i])?.name ?? src.title;
  const week = coachProgramWeek(src, now);
  const line =
    dayI === null
      ? t("cpg.assignToday.off", { plan: src.title, week, weeks: src.weeks })
      : t("cpg.assignToday.day", {
          plan: src.title,
          day: nameOf(dayI),
          week,
          weeks: src.weeks,
          weekday: WEEKDAYS[new Date(now).getDay()] ?? "",
        });
  const phase = src.phases && src.phases.length > 1 ? coachProgramPhase(src, now) : null;
  const next = coachProgramNext(src, now);
  const coach = followed?.coach || t("trn.noName");
  // "From your coach" (stage 4, 2026-11-26): whose plan this is, where in it today sits, and what's next.
  return (
    <section
      className="card card-tint mt-3 p-4"
      style={{ ["--tint" as string]: "var(--color-violet)" }}
      data-testid={dayI === null ? "coach-program-off" : "coach-program-day"}
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        <Icon name="layers" size={14} />
        {t("cpg.from.kicker", { name: coach })}
      </p>
      <p className="mt-1 text-sm">{line}</p>
      {phase && (
        <p className="text-sm font-medium" data-testid="coach-program-phase">
          {t("cpg.phase.now", { name: t(`cpg.phase.${phase.kind}`), week: phase.week, count: phase.weeks })}
        </p>
      )}
      {next && (
        <p className="mt-1 text-sm text-muted" data-testid="coach-program-next">
          {t("cpg.from.next", {
            day: nameOf(next.dayIndex),
            when: date(new Date(next.at), { weekday: "long", day: "numeric", month: "short" }),
          })}
        </p>
      )}
      <Button kind="ghost" className="mt-1 !px-0" onClick={() => setCal(true)}>
        {t("cpg.assignCalendar")}
      </Button>
      <Sheet open={cal} onClose={() => setCal(false)} title={t("cpg.cal.title")} wide>
        <AthleteProgramCalendar src={src} />
      </Sheet>
    </section>
  );
}

/** After the weeks end: stop following or keep days as ordinary routines. */
export function CoachProgramEndedToday() {
  const { profile, setProfile, replan } = useApp();
  const now = useNow(60_000);
  const src = profile.planSource;
  if (src?.kind !== "coachProgram") return null;
  if (now < coachProgramEndAt(src)) return null;

  const stop = async () => {
    try {
      await endProgramAssign(src.assignId).catch(() => null);
    } catch {
      /* already ended on the server */
    }
    const routines = (profile.routines ?? []).map((r) => {
      if (r.assignedProgram?.assignId !== src.assignId) return r;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- drop assignedProgram
      const { assignedProgram, ...rest } = r;
      return rest;
    });
    setProfile({ routines, planSource: { kind: "adaptive" } });
    replan();
    track("feature", { name: "trainer", detail: "endProgram" });
  };

  const keep = () => {
    const routines = (profile.routines ?? []).map((r) => {
      if (r.assignedProgram?.assignId !== src.assignId) return r;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- drop assignedProgram
      const { assignedProgram, ...rest } = r;
      return rest;
    });
    setProfile({ routines, planSource: { kind: "adaptive" } });
    replan();
    track("feature", { name: "trainer", detail: "keepProgramDays" });
  };

  return (
    <section className="card mt-3 p-4" data-testid="coach-program-finished">
      <h2 className="font-semibold">{t("cpg.assignToday.finishedTitle", { plan: src.title })}</h2>
      <p className="mt-1 text-sm text-muted">{t("cpg.assignToday.finishedBody")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => void stop()}>{t("cpg.assignToday.stop")}</Button>
        <Button kind="ghost" onClick={keep}>
          {t("cpg.assignToday.keep")}
        </Button>
      </div>
    </section>
  );
}
