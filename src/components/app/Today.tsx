"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { Info } from "@/components/Info";
import { SCREEN_TITLE } from "@/components/titles";
import { useProMember } from "@/lib/billing";
import { busyTimes, fitLength, freeMinutes, type Busy } from "@/lib/calendar";
import { musicLink, openOutside } from "@/lib/connections";
import { can } from "@/lib/entitlements";
import { exercise } from "@/lib/exercises";
import { itemSeconds, planSeconds } from "@/lib/generator";
import { clockTime, inSentence, list, t } from "@/lib/i18n";
import { activeInjuries, PART_LABEL } from "@/lib/injury";
import { haptic, sound } from "@/lib/juice";
import { quoteIndexOfDay, QUOTES } from "@/lib/quotes";
import { dayKey } from "@/lib/random";
import { CALL_TEXT, todayFeel, type Call } from "@/lib/readiness";
import { recovery } from "@/lib/recovery";
import { useApp } from "@/lib/store";
import { linkedToNext, supersetLabel } from "@/lib/superset";
import { effortLabel } from "@/lib/training";
import { MUSCLE_LABEL, type Muscle } from "@/lib/types";
import { useNow } from "@/lib/useNow";
import { callWhy, itemWhy, whyContext } from "@/lib/why";
import type { MessageKey } from "@/locales/en";

import { useGame } from "./Achievements";
import { PlanExtras, TodayMoments } from "./Extras";
import { loadText, repsText } from "./format";
import { FriendsButton } from "./Friends";
import { Icon } from "./icons";
import { CoachNotes } from "./Insights";
import { programName } from "./Programs";
import { RecoveryMap } from "./RecoveryMap";
import { MoveButtons, useReorder } from "./Reorder";
import { go } from "./router";
import { SaveNudge } from "./Saving";
import { CALL_STYLE, FEEL_HUE, muscleHue } from "./theme";
import { TodayGame } from "./TodayGame";
import { Button, Chip, EmptyState, LinkToggle, ProBadge, ProTag, Ring, Section } from "./ui";

export function Flame({ weeks, freezes = 0 }: { weeks: number; freezes?: number }) {
  const lit = weeks > 0;
  return (
    <span
      className={`num inline-flex h-9 items-center gap-1 rounded-full border px-2.5 text-sm font-bold ${lit ? "border-ember/40 bg-ember/12 text-ember" : "border-line bg-surface text-faint"}`}
      title={
        freezes
          ? t("td.streakTitle", { streak: t("awards.streak", { count: weeks }), freezes: t("awards.freezes", { count: freezes }) })
          : t("awards.streak", { count: weeks })
      }
    >
      <Icon name="flame" size={16} filled={lit} strokeWidth={1.6} className={lit ? "drop-shadow-[0_0_6px_rgb(255_138_61/0.7)]" : ""} />
      {weeks}
      {freezes > 0 && (
        <span aria-label={t("td.freezeLabel", { count: freezes })}>
          {" 🧊"}
          {freezes > 1 ? freezes : ""}
        </span>
      )}
    </span>
  );
}

/**
 * The pre-workout check-in (Melvin, 2026-11-10): how the lifter feels today, in one tap. Low, sore and
 * unwell take today easier (unwell makes it an easy day outright), great nudges it up; the call above, the
 * plan and the playlist follow at once. Optional, and changeable all day.
 */
function FeelCheckIn({ now }: { now: number }) {
  const { events, feel } = useApp();
  const said = todayFeel(events, now);
  const energies = [
    { v: -1, key: "td.feelLow", hue: FEEL_HUE.low },
    { v: 0, key: "td.feelOk", hue: FEEL_HUE.ok },
    { v: 1, key: "td.feelGreat", hue: FEEL_HUE.great },
  ] as const;
  return (
    <div className="mt-3" role="group" aria-labelledby="feel-title">
      <p id="feel-title" className="text-sm font-medium">
        {t("td.feel")}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {energies.map((e) => (
          <Chip key={e.v} hue={e.hue} active={said?.energy === e.v} onClick={() => feel({ energy: e.v })}>
            {t(e.key)}
          </Chip>
        ))}
        <Chip hue={FEEL_HUE.sore} active={!!said?.sore} onClick={() => feel({ sore: !said?.sore })}>
          {t("td.feelSore")}
        </Chip>
        <Chip hue={FEEL_HUE.unwell} active={!!said?.unwell} onClick={() => feel({ unwell: !said?.unwell })}>
          {t("td.feelUnwell")}
        </Chip>
      </div>
    </div>
  );
}

/** The greeting, by local time of day, with the lifter's first name when they've given one. */
export function greeting(hour: number, name: string): string {
  const part = t(hour < 5 ? "today.evening" : hour < 12 ? "today.morning" : hour < 18 ? "today.afternoon" : "today.evening");
  const first = name.trim().split(/\s+/)[0];
  return first ? t("today.hello", { greeting: part, name: first }) : part;
}

export function Today() {
  const { profile, gyms, preview, events, setProfile, start, active, readiness, callOverride, setCall, pickedByLocation, toggleSuperset } =
    useApp();
  const [lenKey, setLenKey] = useState(0);
  const gym = gyms.find((g) => g.id === profile.activeGymId) ?? gyms[0];
  const moveExercise = useApp((st) => st.moveExercise);
  // Press and hold an exercise to drag it, or tap its number to move it with buttons (Reorder.tsx).
  const reorder = useReorder(moveExercise, { min: 0, max: (preview?.items.length ?? 1) - 1 });
  const now = useNow();
  const rec = useMemo(() => recovery(events, now), [events, now]);
  const g = useGame();
  const member = useProMember();
  const streak = g.streak;
  const lvl = g.level;
  const focus = [...new Set(preview?.items.map((i) => i.focus) ?? [])] as Muscle[];
  const hurt = useMemo(() => activeInjuries(events), [events]);
  const hello = greeting(new Date(now).getHours(), profile.name);
  const call = preview ? CALL_STYLE[preview.call] : null;
  const fill = `${((profile.minutes - 15) / 75) * 100}%`;
  const fixed = !!preview?.program?.fixed;
  // Every recommendation says why (why.ts): one line per exercise, one sentence for the day's call.
  const why = useMemo(() => (preview ? whyContext(preview, events, profile, now) : null), [preview, events, profile, now]);
  // While a workout runs, the list shows the live workout and can't be changed here: linking and
  // reordering what's left happen in one place, Coming up on the workout screen.
  const live = !!active;
  const items = active?.plan.items ?? preview?.items ?? [];

  return (
    <div className="pb-28">
      <header className="pt-3">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium text-muted">{hello}</p>
          <div className="flex shrink-0 items-center gap-2">
            <Flame weeks={streak.weeks} freezes={streak.freezes} />
            <FriendsButton />
            <button
              type="button"
              onClick={() => go("achievements")}
              className="press num inline-flex h-9 items-center rounded-full border border-violet/40 bg-violet/12 px-2.5 text-sm font-bold text-violet"
              title={t("td.lvlTitle", { title: lvl.title, into: lvl.into, span: lvl.span, next: lvl.next ?? t("td.max") })}
            >
              {t("td.lv", { n: lvl.level })}
            </button>
            <button
              type="button"
              aria-label={t("td.settings")}
              onClick={() => go("settings")}
              className="press grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted hover:text-ink"
            >
              <Icon name="settings" size={18} />
            </button>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2.5">
          <h1 className={SCREEN_TITLE}>{t("td.title")}</h1>
          {member && <ProBadge />}
        </div>
      </header>

      {active && (
        <button
          type="button"
          onClick={() => go("workout")}
          className="press btn-primary animate-glow mt-4 flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left font-semibold"
        >
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-accent-ink" />
            {t("td.inProgress")}
          </span>
          <span className="flex items-center gap-1">
            {t("td.resume")} <Icon name="chevronRight" size={18} strokeWidth={2.6} />
          </span>
        </button>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          onClick={() => go("gym")}
          className="press inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5"
        >
          <Icon name="pin" size={15} className="text-accent" />
          {gym?.name ?? t("td.addGym")}
          {gym && pickedByLocation === gym.id ? t("td.here") : ""}
        </button>
        {preview?.program && (
          <button
            type="button"
            onClick={() => go("programs")}
            className="press inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5"
          >
            <Icon name="layers" size={15} className="text-accent" />
            {programName(preview.program.id)} · {preview.program.dayName}
          </button>
        )}
        {preview && fixed && (
          <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-muted">{preview.program!.note}</span>
        )}
        {preview?.program && !can("adaptive") && (
          // Free lifters follow a fixed program; this shows what Pro would plan instead and opens the paywall there.
          <button
            type="button"
            onClick={() => go("pro", "today")}
            aria-label={t("pro.locked", { what: t("pro.ft.adaptive") })}
            className="press inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-muted"
          >
            <Icon name="sparkle" size={15} className="text-violet" />
            {t("pro.ft.adaptive")}
            <ProTag />
          </button>
        )}
        {preview && !fixed && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${preview.week.deload ? "border-warn/40 bg-warn/12 text-warn" : "border-line bg-surface text-muted"}`}
          >
            <Icon name="layers" size={15} className={preview.week.deload ? "" : "text-violet"} />
            {preview.week.label} · {effortLabel(preview.week.rir, profile.training?.effort)}
            <Info term={preview.week.deload ? "deload" : profile.training?.effort === "rpe" ? "rpe" : "rir"} className="-mr-3" />
          </span>
        )}
        {streak.needed > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-muted">
            <Icon name="target" size={15} className="text-ember" />
            {t("today.goalMore", { count: streak.needed })}
          </span>
        )}
        {preview && !active && profile.connections?.music && (
          <button
            type="button"
            onClick={() => openOutside(musicLink(profile.connections!.music!, preview.call))}
            className="press inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5"
          >
            <Icon name="play" size={15} className="text-cyan" />
            {t("conn.music.play", { mood: t(`conn.music.${preview.call}`) })}
          </button>
        )}
        <button
          type="button"
          onClick={() => go("injuries")}
          className={`press inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${hurt.length ? "border-warn/40 bg-warn/15 text-warn" : "border-line bg-surface text-muted"}`}
        >
          <Icon name="bandage" size={15} className={hurt.length ? "" : "text-ember"} />
          {hurt.length
            ? t("today.trainingAround", { parts: list(hurt.map((i) => inSentence(PART_LABEL[i.part], true))) })
            : t("today.somethingHurts")}
        </button>
      </div>

      <TodayMoments />

      {readiness && preview && call && !active && !fixed && (
        <section className="card-tint mt-4 p-4" style={{ "--tint": call.hue } as CSSProperties} aria-labelledby="call-title">
          <div className="flex items-center gap-4">
            <Ring
              value={readiness.score / 100}
              size={64}
              stroke={6}
              from={call.hue}
              to={call.hue}
              track="color-mix(in srgb, var(--color-ink) 8%, transparent)"
            >
              <span className="display text-xl" aria-label={t("td.readinessN", { n: readiness.score })}>
                {readiness.score}
              </span>
            </Ring>
            <div className="min-w-0 flex-1">
              <div
                className="flex flex-wrap items-center gap-x-1.5 text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: call.hue }}
              >
                <Icon name={call.icon} size={14} strokeWidth={2.4} />
                <span>{t("td.readiness")}</span>
                <Info term="readiness" />
              </div>
              <h2 id="call-title" className="mt-0.5 text-xl font-bold">
                {CALL_TEXT[preview.call].label}
                <Info term="call" />
              </h2>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">
            {preview.challenge ? t("td.challenge") : callWhy(readiness, preview.call, preview.week.deload)}
          </p>
          {readiness.signals.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {readiness.signals.slice(0, 3).map((g) => (
                <li
                  key={g.text}
                  className={`flex items-center gap-2 ${g.points > 0 ? "text-mint" : g.points < 0 ? "text-warn" : "text-muted"}`}
                >
                  <span aria-hidden className="grid h-4 w-4 place-items-center text-[0.625rem]">
                    {g.points > 0 ? "▲" : g.points < 0 ? "▼" : "•"}
                  </span>
                  <span className="text-ink/90">{g.text}</span>
                </li>
              ))}
            </ul>
          )}
          <FeelCheckIn now={now} />
          <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-bg/60 p-1" role="group" aria-label={t("td.call")}>
            {(["recover", "normal", "push"] as Call[]).map((c) => {
              const on = preview.call === c;
              const hue = CALL_STYLE[c].hue;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    haptic("select");
                    sound.tick();
                    setCall(c === readiness.call ? null : c);
                  }}
                  className={`press inline-flex min-h-11 min-w-0 flex-wrap items-center justify-center gap-x-1.5 rounded-xl px-1 text-center text-sm leading-tight font-semibold ${on ? "text-ink" : "text-muted"}`}
                  style={
                    on
                      ? {
                          background: `color-mix(in srgb, ${hue} 30%, var(--color-surface))`,
                          boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${hue} 75%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <span className="inline-flex" style={{ color: hue }}>
                    <Icon name={CALL_STYLE[c].icon} size={15} strokeWidth={2.4} />
                  </span>
                  {c === "recover" ? t("td.goEasy") : c === "normal" ? t("td.asPlanned") : t("td.push")}
                </button>
              );
            })}
          </div>
          {callOverride && (
            <p className="mt-2 text-xs text-faint">{t("td.yourCall", { call: inSentence(CALL_TEXT[readiness.call].label, true) })}</p>
          )}
        </section>
      )}

      {profile.quotes !== false && <DailyQuote now={now} />}

      {!active && <CoachNotes limit={2} />}
      {!active && <SaveNudge />}

      {!active && <TodayGame />}

      {!fixed && (
        <div className="card mt-4 p-4">
          <div className="flex items-baseline justify-between">
            <label htmlFor="len" className="flex items-center gap-1.5 text-sm font-medium text-muted">
              <Icon name="clock" size={16} className="text-cyan" />
              {t("td.length")}
            </label>
            <span className="display text-[1.875rem]">
              <span key={lenKey} className={`inline-block ${lenKey ? "animate-nudge" : ""}`}>
                {profile.minutes}
              </span>
              <span className="ml-1 text-base font-semibold tracking-normal text-muted">{t("td.min")}</span>
            </span>
          </div>
          <input
            id="len"
            type="range"
            min={15}
            max={90}
            step={5}
            value={profile.minutes}
            onChange={(e) => {
              haptic("select");
              sound.tick();
              setLenKey((k) => k + 1);
              setProfile({ minutes: Number(e.target.value), minutesDay: dayKey(Date.now()) });
            }}
            className="slider mt-4 w-full"
            style={{ "--fill": fill } as CSSProperties}
          />
          <div className="mt-1.5 flex justify-between text-xs text-faint num">
            <span>15</span>
            <span>45</span>
            <span>90</span>
          </div>
          <FitAroundCalendar />
        </div>
      )}
      {!fixed && <PlanExtras />}

      {preview && preview.items.length > 0 ? (
        <>
          <Section title={t("td.planTitle", { count: items.length, min: (active?.plan ?? preview).estMinutes })} icon="dumbbell">
            <ol className="stagger card overflow-hidden" data-testid="plan-list">
              {items.map((it, i) => {
                const ex = exercise(it.exerciseId);
                const hue = muscleHue(it.focus);
                const ss = supersetLabel(items, i);
                const joinsPrev = i > 0 && linkedToNext(items, i - 1);
                const joinsNext = linkedToNext(items, i);
                const look = live ? { className: "", css: {} } : reorder.style(i);
                const picked = !live && reorder.picked === i;
                // Supersets read as one block: a shared tint, one accent bracket down the left that runs
                // across the rows, and a dashed join where the link button sits on the line between them.
                return (
                  <li
                    key={it.exerciseId}
                    {...(live ? {} : reorder.row(i))}
                    data-superset={it.group ?? undefined}
                    className={`animate-rise relative flex select-none items-center gap-3 px-4 py-3.5 transition-shadow ${i > 0 ? (joinsPrev ? "border-t border-dashed border-accent/40" : "border-t border-line/70") : ""} ${ss ? "bg-accent/10" : ""} ${look.className}`}
                    style={{ animationDelay: `${i * 40}ms`, ...look.css }}
                  >
                    <span
                      className={`absolute left-0 ${ss ? "w-1 bg-accent" : "w-[3px] rounded-r-full"} ${joinsPrev ? "top-0" : "top-3"} ${joinsNext ? "bottom-0" : "bottom-3"} ${ss && !joinsPrev ? "rounded-tr-full" : ""} ${ss && !joinsNext ? "rounded-br-full" : ""}`}
                      style={ss ? undefined : { background: hue }}
                      aria-hidden
                    />
                    {/* The number is the button for moving this exercise without dragging (and by keyboard). */}
                    {live ? (
                      <span
                        className="num grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold"
                        style={{ background: `color-mix(in srgb, ${hue} 16%, transparent)`, color: hue }}
                      >
                        {i + 1}
                      </span>
                    ) : (
                      <button
                        type="button"
                        data-no-drag
                        onClick={() => reorder.setPicked(picked ? null : i)}
                        aria-label={t("pol.moveNumbered", { n: i + 1, name: ex.name })}
                        aria-pressed={picked}
                        className={`press num grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold ${picked ? "ring-2 ring-accent" : ""}`}
                        style={{ background: `color-mix(in srgb, ${hue} 16%, transparent)`, color: hue }}
                      >
                        {i + 1}
                      </button>
                    )}
                    <div className={`min-w-0 flex-1 ${items.length > 1 && !live ? "max-[389px]:pr-9" : ""}`}>
                      {ss && (
                        <div className="flex items-center gap-1 truncate text-xs font-semibold uppercase tracking-[0.08em] text-accent">
                          <Icon name="link" size={12} />
                          {ss}
                        </div>
                      )}
                      <div className="truncate font-semibold">{ex.name}</div>
                      <div className="text-sm text-muted num">
                        {it.label ? `${it.label} · ` : ""}
                        {it.scheme ?? `${it.sets} × ${repsText(ex, it.target.reps)}`} ·{" "}
                        {(it.setTargets ?? []).some((st) => st.weight > it.target.weight) ? t("td.upTo") : ""}
                        {loadText(ex, Math.max(it.target.weight, ...(it.setTargets ?? []).map((st) => st.weight)), profile.unit)}
                        {" · "}
                        {it.warmup ? t("td.warmups", { count: it.warmup.length }) : ""}
                        {t("td.mins", { n: Math.max(1, Math.round(itemSeconds(it) / 60)) })}
                      </div>
                      {why && (
                        <p className="mt-0.5 text-xs leading-snug text-faint" data-testid="item-why">
                          {itemWhy(it, why).short}
                        </p>
                      )}
                    </div>
                    {picked ? (
                      <MoveButtons
                        name={ex.name}
                        canUp={i > 0}
                        canDown={i < items.length - 1}
                        onUp={() => reorder.step(i, -1)}
                        onDown={() => reorder.step(i, 1)}
                        onDone={() => reorder.setPicked(null)}
                      />
                    ) : it.injuryPct ? (
                      <span className="shrink-0 rounded-full bg-warn/15 px-2.5 py-0.5 text-xs font-medium text-warn">
                        {t("td.injury", { n: it.injuryPct })}
                      </span>
                    ) : (
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${items.length > 1 && !live ? "hidden min-[390px]:inline" : ""}`}
                        style={{ borderColor: `color-mix(in srgb, ${hue} 35%, transparent)`, color: hue }}
                      >
                        {MUSCLE_LABEL[it.focus]}
                      </span>
                    )}
                    {/* Sits on the line between this exercise and the one above, which is the pair it joins. */}
                    {i > 0 && !live && (
                      <LinkToggle
                        className="absolute -top-[22px] right-3 z-10"
                        on={joinsPrev}
                        first={exercise(items[i - 1]!.exerciseId).name}
                        second={ex.name}
                        onToggle={() => toggleSuperset(i - 1)}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
            {items.length > 1 &&
              (() => {
                const grouped = items.some((x) => x.group);
                const saved = grouped
                  ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    Math.round((planSeconds(items.map(({ group: _g, ...x }) => x)) - planSeconds(items)) / 60)
                  : 0;
                return (
                  <p className="mt-2 flex items-start gap-1.5 px-1 text-sm text-muted" data-testid="superset-hint">
                    <Icon name="link" size={14} className="mt-[3px] shrink-0" />
                    <span>
                      {live
                        ? t("td.ssLive", { section: t("workout.comingUp") })
                        : grouped
                          ? saved > 0
                            ? t("td.ssLinkedSaves", { n: saved })
                            : t("td.ssLinked")
                          : t("td.ssHint")}
                      <Info term="superset" />
                    </span>
                  </p>
                );
              })()}
          </Section>
          <Section title={t("td.whyMuscles")} icon="recovery">
            <div className="card p-4">
              <RecoveryMap rec={rec} focus={focus} compact chips={false} />
              {preview.program && !preview.routineId ? (
                <p className="mt-3 text-sm text-muted">
                  {t(fixed ? "td.programDay" : "td.programDayAdaptive", {
                    day: preview.program.dayName ?? "",
                    program: programName(preview.program.id) ?? "",
                    sets: preview.week.setsPerMuscle,
                    note: preview.program.note ?? "",
                  })}
                </p>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  {preview.routineId
                    ? t("td.routineWorks", { muscles: list(focus.slice(0, 4).map((m) => inSentence(MUSCLE_LABEL[m], true))) })
                    : t("td.targets", {
                        muscles: list(focus.slice(0, 4).map((m) => inSentence(MUSCLE_LABEL[m], true))),
                        sets: preview.week.setsPerMuscle,
                      })}
                </p>
              )}
            </div>
          </Section>
        </>
      ) : (
        <div className="card mt-6">
          <EmptyState
            icon="moon"
            mascot="sleepy"
            tint="var(--color-cyan)"
            title={t("td.restDay")}
            body={t("td.restBody")}
            action={
              <Button kind="ghost" icon="stretch" onClick={() => go("stretch", "rest")}>
                {t("str.restCard")}
              </Button>
            }
          />
        </div>
      )}

      {!active && preview && preview.items.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[var(--nav-h,4rem)] z-30 pb-3 bg-gradient-to-t from-bg via-bg/90 to-transparent px-5 pt-8">
          <div className="pointer-events-auto mx-auto max-w-lg">
            <Button
              icon="play"
              className="w-full py-4 text-lg"
              onClick={() => {
                haptic("tap");
                // Settings › Workout › "Warm up before every workout": the warm-up comes first, and can be skipped.
                if (profile.training?.warmFirst) return go("stretch", "warmup");
                sound.start();
                start();
                go("workout");
              }}
            >
              {t("today.start")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** One quote a day from quotes.ts, with its author. Turned off in Settings › Daily quote. */
function DailyQuote({ now }: { now: number }) {
  const i = quoteIndexOfDay(now);
  const q = QUOTES[i];
  return (
    <figure
      className="card-tint relative mt-4 overflow-hidden p-4 pl-12"
      style={{ "--tint": "var(--color-violet)" } as CSSProperties}
      aria-label={t("td.quote")}
    >
      <span className="absolute left-4 top-4 text-violet" aria-hidden>
        <Icon name="quote" size={20} strokeWidth={2.4} />
      </span>
      <blockquote className="text-[0.9375rem] font-medium leading-snug text-ink">{t(`quote.${i}` as MessageKey)}</blockquote>
      <figcaption className="mt-2 text-xs text-muted">
        <span className="font-semibold text-ink/80">{q.by}</span>
        {q.source && <span>, {q.source}</span>}
      </figcaption>
    </figure>
  );
}

/**
 * Calendar (MVP+2): when the lifter allowed reading busy times and something starts before the planned
 * workout could finish, offer a length that fits. Only start and end times are read, on the phone.
 */
function FitAroundCalendar() {
  const { profile, setProfile, active } = useApp();
  const on = !!profile.calendar?.read && !active;
  const now = useNow(60_000);
  const bucket = Math.floor(now / 300_000); // look again every 5 minutes
  const [busy, setBusy] = useState<Busy[] | null>(null);
  useEffect(() => {
    if (!on) return;
    let live = true;
    void busyTimes(Date.now()).then((b) => live && setBusy(b));
    return () => {
      live = false;
    };
  }, [on, bucket]);
  if (!on || !busy) return null;
  const free = freeMinutes(busy, now);
  const fit = fitLength(free.minutes, profile.minutes);
  if (!fit || !free.until) return null;
  const until = new Date(free.until);
  const at = clockTime(until.getHours(), until.getMinutes());
  return (
    <button
      type="button"
      onClick={() => {
        haptic("tick");
        setProfile({ minutes: fit, minutesDay: dayKey(now) });
      }}
      className="press mt-3 flex w-full items-center gap-2 rounded-xl border border-cyan/30 bg-cyan/8 px-3 py-2.5 text-left text-sm"
    >
      <Icon name="calendar" size={16} className="text-cyan" />
      <span>
        {t("td.busy", { at })}
        <span className="font-semibold text-cyan">{t("td.fit", { n: fit })}</span>
      </span>
    </button>
  );
}
