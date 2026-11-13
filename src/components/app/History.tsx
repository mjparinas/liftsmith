"use client";

import { useMemo, useRef, useState, type TouchEvent } from "react";

import { dayKey, monthGrid, sessionDetail, weekdayNames } from "@/lib/dashboard";
import type { SessionSummary } from "@/lib/derive";
import { sessionNoteOf } from "@/lib/editHistory";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { monthOf, monthsBetween, monthSessions, musclesByDay, prSetIds, shiftMonth, workoutName, type YearMonth } from "@/lib/history";
import { date, list, num, t } from "@/lib/i18n";
import { haptic } from "@/lib/juice";
import { joinStretches, partsOf, type PartView } from "@/lib/sessions";
import { sessionShares } from "@/lib/shareCards";
import { useApp } from "@/lib/store";
import { stretch } from "@/lib/stretches";
import type { StretchEvent, Unit } from "@/lib/types";
import { fmtVolume } from "@/lib/units";
import { useNow } from "@/lib/useNow";

import { useGame } from "./Achievements";
import { EditWorkoutSheet } from "./EditWorkout";
import { setText } from "./format";
import { Icon } from "./icons";
import { go } from "./router";
import { ShareSheet, useShareContext } from "./ShareSheet";
import { FAMILY_HUE, familyOf, type Family } from "./theme";
import { Button } from "./ui";

// Progress › History (Melvin, 2026-11-11: "a calendar view of past workouts … where we can review what we
// did"). A month grid with each workout day marked by the muscle families it trained; swipe or ‹ › to change
// month; tap a day and its workouts show in full under the grid. Pure web code: Android, iOS and the web app.

const FAMILIES: Family[] = ["push", "pull", "legs", "core"];
/** A horizontal swipe this long (px) changes month; touches this close to an edge belong to the phone's back gesture. */
const SWIPE = { distance: 48, edge: 24 };

const exName = (id: string) => EXERCISE_BY_ID.get(id)?.name ?? id;

export function HistoryCalendar() {
  const { stats, events, profile } = useApp();
  const now = useNow(60_000);
  const sessions = stats.sessions;
  const thisMonth = monthOf(now);
  const firstMonth = sessions.length ? monthOf(sessions.at(-1)!.start) : thisMonth;
  const [ym, setYm] = useState<YearMonth>(() => (sessions.length ? monthOf(sessions[0]!.start) : thisMonth));
  const inMonth = monthSessions(sessions, ym);
  const [picked, setPicked] = useState<string | null>(null);
  // Warm-ups and cool-downs join the workout they were done with; the rest stand alone (sessions.ts).
  const joined = useMemo(
    () =>
      joinStretches(
        events.filter((e): e is StretchEvent => e.type === "stretch"),
        sessions,
      ),
    [events, sessions],
  );
  const looseByDay = useMemo(() => {
    const m = new Map<string, StretchEvent[]>();
    for (const s of joined.loose) m.set(dayKey(s.at), [...(m.get(dayKey(s.at)) ?? []), s]);
    return m;
  }, [joined]);
  const looseInMonth = joined.loose.filter((s) => {
    const d = new Date(s.at);
    return d.getFullYear() === ym.y && d.getMonth() === ym.m;
  });
  // Opens on the month's latest workout day, so the last workout is one glance away.
  const selected =
    picked && (inMonth.some((s) => dayKey(s.start) === picked) || looseByDay.has(picked))
      ? picked
      : inMonth[0]
        ? dayKey(inMonth[0].start)
        : looseInMonth.length
          ? dayKey(looseInMonth.at(-1)!.at)
          : null;

  const muscles = useMemo(() => musclesByDay(events, sessions, (id) => EXERCISE_BY_ID.get(id)), [events, sessions]);
  const prIds = useMemo(() => prSetIds(events, stats.prs), [events, stats.prs]);
  const byDay = useMemo(() => {
    const m = new Map<string, SessionSummary[]>();
    for (const s of sessions) m.set(dayKey(s.start), [...(m.get(dayKey(s.start)) ?? []), s]);
    return m;
  }, [sessions]);

  const canBack = monthsBetween(firstMonth, ym) > 0;
  const canNext = monthsBetween(ym, thisMonth) > 0;
  const shift = (by: number) => {
    if ((by < 0 && !canBack) || (by > 0 && !canNext)) return;
    haptic("select");
    setYm((cur) => shiftMonth(cur, by));
    setPicked(null);
  };

  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    const p = e.touches[0];
    touch.current = p && p.clientX > SWIPE.edge && p.clientX < window.innerWidth - SWIPE.edge ? { x: p.clientX, y: p.clientY } : null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current;
    const p = e.changedTouches[0];
    touch.current = null;
    if (!start || !p) return;
    const dx = p.clientX - start.x;
    const dy = p.clientY - start.y;
    if (Math.abs(dx) >= SWIPE.distance && Math.abs(dx) > Math.abs(dy) * 1.5) shift(dx < 0 ? 1 : -1);
  };

  const month = date(new Date(ym.y, ym.m, 1), { month: "long", year: "numeric" });
  const todayKey = dayKey(now);
  const familiesOn = (key: string) => {
    const set = new Set([...(muscles.get(key) ?? [])].map(familyOf));
    return FAMILIES.filter((f) => set.has(f));
  };
  const daySessions = selected ? [...(byDay.get(selected) ?? [])].reverse() : [];
  const dayStretches = selected ? [...(looseByDay.get(selected) ?? [])].reverse() : [];
  const pick = (key: string) => {
    haptic("select");
    setPicked(key);
  };

  return (
    <>
      <section className="card p-3" aria-label={month} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} data-testid="history-calendar">
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            disabled={!canBack}
            className="press grid h-11 w-11 place-items-center rounded-xl border border-line bg-raised disabled:opacity-40"
            aria-label={t("dash.prevMonth")}
          >
            <Icon name="chevronLeft" size={20} />
          </button>
          <h3 className="text-center leading-tight" aria-live="polite">
            <span className="block font-semibold">{month}</span>{" "}
            <span className="num block text-sm text-muted">{t("dash.workoutsN", { count: inMonth.length })}</span>
          </h3>
          <button
            type="button"
            onClick={() => shift(1)}
            disabled={!canNext}
            className="press grid h-11 w-11 place-items-center rounded-xl border border-line bg-raised disabled:opacity-40"
            aria-label={t("dash.nextMonth")}
          >
            <Icon name="chevronRight" size={20} />
          </button>
        </div>
        <table key={`${ym.y}-${ym.m}`} className="fade w-full table-fixed border-separate border-spacing-0.5">
          <thead>
            <tr>
              {weekdayNames().map((d) => (
                <th key={d} scope="col" className="pb-1 text-xs font-medium text-faint">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthGrid(ym.y, ym.m).map((row, i) => (
              <tr key={i}>
                {row.map((d, j) => {
                  if (!d) return <td key={j} />;
                  const day = byDay.get(d.key);
                  const isToday = d.key === todayKey;
                  const n = new Date(d.ms).getDate();
                  const ring = isToday ? "ring-2 ring-accent ring-inset" : "";
                  if (!day) {
                    const loose = looseByDay.get(d.key);
                    if (loose) {
                      const on = selected === d.key;
                      const label = [
                        date(d.ms, { weekday: "long", month: "long", day: "numeric" }),
                        t("hx.stretchDay"),
                        t("hx.stretchCount", { count: loose.reduce((a, s) => a + s.ids.length, 0) }),
                      ].join(", ");
                      return (
                        <td key={d.key}>
                          <button
                            type="button"
                            aria-pressed={on}
                            aria-label={label}
                            onClick={() => pick(d.key)}
                            className={`press flex h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl border ${on ? "border-accent" : "border-transparent"} ${ring}`}
                            data-testid="stretch-day"
                          >
                            <span className="num text-sm">{n}</span>
                            <span aria-hidden className="text-cyan">
                              <Icon name="stretch" size={10} />
                            </span>
                          </button>
                        </td>
                      );
                    }
                    return (
                      <td key={d.key}>
                        <div className={`num grid h-11 place-items-center rounded-xl text-sm text-faint ${ring}`}>{n}</div>
                      </td>
                    );
                  }
                  const fams = familiesOn(d.key);
                  const sets = day.reduce((a, s) => a + s.sets, 0);
                  const prs = day.reduce((a, s) => a + s.prs, 0);
                  const on = selected === d.key;
                  const label = [
                    date(d.ms, { weekday: "long", month: "long", day: "numeric" }),
                    t("progress.sessionSets", { count: sets }),
                    ...(prs ? [t("progress.sessionPrs", { count: prs })] : []),
                    ...(fams.length ? [list(fams.map((f) => t(`progress.fam.${f}`)))] : []),
                  ].join(", ");
                  return (
                    <td key={d.key}>
                      <button
                        type="button"
                        aria-pressed={on}
                        aria-label={label}
                        onClick={() => pick(d.key)}
                        className={`press relative flex h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl border bg-accent/15 ${on ? "border-accent" : "border-transparent"} ${ring}`}
                      >
                        <span className="num text-sm font-semibold">{n}</span>
                        <span aria-hidden className="flex h-1.5 gap-0.5">
                          {fams.map((f) => (
                            <span key={f} className="h-1.5 w-1.5 rounded-full" style={{ background: FAMILY_HUE[f] }} />
                          ))}
                        </span>
                        {prs > 0 && (
                          <span aria-hidden className="absolute right-0.5 top-0.5 text-gold">
                            <Icon name="trophy" size={10} />
                          </span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted" aria-label={t("progress.cal.legend")}>
          {FAMILIES.map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: FAMILY_HUE[f] }} />
              {t(`progress.fam.${f}`)}
            </li>
          ))}
        </ul>
      </section>
      {!inMonth.length && !looseInMonth.length && <p className="mt-3 px-1 text-sm text-muted">{t("progress.cal.none")}</p>}
      {daySessions.map((s) => (
        <WorkoutCard
          key={s.sessionId}
          summary={s}
          unit={profile.unit}
          prIds={prIds}
          parts={partsOf(s, joined.bySession.get(s.sessionId))}
        />
      ))}
      {dayStretches.map((s) => (
        <StretchCard key={s.id} event={s} />
      ))}
    </>
  );
}

const minutes = (seconds: number) => t("dash.min", { n: Math.max(1, Math.round(seconds / 60)) });

/** A stretch done on its own (a rest day or the library), in the day's list under the calendar. */
function StretchCard({ event }: { event: StretchEvent }) {
  const names = event.ids.map((id) => stretch(id)?.name).filter((n): n is string => !!n);
  return (
    <article className="card rise mt-3 p-4" aria-label={t("hx.stretchTitle")} data-testid="stretch-card">
      <h3 className="flex items-center gap-2 font-bold">
        <span className="text-cyan" aria-hidden>
          <Icon name="stretch" size={18} />
        </span>
        {t("hx.stretchTitle")}
        <span className="num text-sm font-normal text-muted">{date(event.at, { hour: "numeric", minute: "2-digit" })}</span>
      </h3>
      <p className="num mt-0.5 text-sm text-muted">
        {[minutes(event.seconds), t("hx.stretchCount", { count: event.ids.length })].join(" · ")}
      </p>
      {names.length > 0 && <p className="mt-2 text-sm">{list(names)}</p>}
    </article>
  );
}

/** "Warm-up: 5 min · Lifting: 42 min · Cool-down: 4 min", only when the workout had more than one part. */
function PartsLine({ parts }: { parts: PartView[] }) {
  if (parts.length < 2) return null;
  return (
    <p className="num mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted" data-testid="workout-parts">
      {parts.map((p) => (
        <span key={p.kind} className="inline-flex items-center gap-1">
          {p.kind !== "lift" && (
            <span className="text-cyan" aria-hidden>
              <Icon name="stretch" size={14} />
            </span>
          )}
          {t("hx.partTime", {
            part: t(`hx.part.${p.kind === "warm" ? "warm" : p.kind === "cool" ? "cool" : "lift"}`),
            time: minutes(p.seconds),
          })}
        </span>
      ))}
    </p>
  );
}

function WorkoutCard({ summary, unit, prIds, parts }: { summary: SessionSummary; unit: Unit; prIds: Set<string>; parts: PartView[] }) {
  const { events, stats, profile, active, repeatWorkout } = useApp();
  const detail = useMemo(() => sessionDetail(events, summary.sessionId), [events, summary.sessionId]);
  const ctx = useShareContext(useGame());
  const [sharing, setSharing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cant, setCant] = useState(false);
  if (!detail) return null;
  const own = sessionNoteOf(events, summary.sessionId);
  const name = own?.name ?? workoutName(detail, profile.routines);
  const when = date(summary.start, { weekday: "long", month: "long", day: "numeric" });
  const again = () => {
    haptic("tick");
    if (repeatWorkout(summary.sessionId)) go("today");
    else setCant(true);
  };
  const facts = [
    t("dash.min", { n: Math.max(1, Math.round(summary.seconds / 60)) }),
    t("progress.sessionSets", { count: summary.sets }),
    fmtVolume(summary.volume, unit),
    ...(summary.avgHr ? [`♥ ${num(summary.avgHr)}`] : []),
    ...(summary.prs ? [t("progress.sessionPrs", { count: summary.prs })] : []),
  ];
  return (
    <article className="card rise mt-3 p-4" aria-label={date(summary.start, { weekday: "long", month: "long", day: "numeric" })}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold">
          {date(summary.start, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </h3>
        <div className="-mr-2 -mt-2 flex shrink-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={t("hx.editLabel", { when })}
            aria-haspopup="dialog"
            className="press grid h-11 w-11 place-items-center rounded-xl text-muted hover:text-ink"
          >
            <Icon name="edit" size={20} />
          </button>
          <button
            type="button"
            onClick={() => setSharing(true)}
            aria-label={t("card.shareWorkout", { when })}
            className="press grid h-11 w-11 place-items-center rounded-xl text-muted hover:text-ink"
          >
            <Icon name="share" size={20} />
          </button>
        </div>
      </div>
      {name && (
        <p className="text-sm font-semibold text-accent" data-testid="workout-name">
          {name}
        </p>
      )}
      <ShareSheet open={sharing} onClose={() => setSharing(false)} items={sessionShares(summary, stats.prs, ctx)} />
      <p className="num mt-0.5 text-sm text-muted">
        {facts.join(" · ")}
        {detail.manual ? t("dash.byHand") : ""}
      </p>
      <PartsLine parts={parts} />
      {own?.text && (
        <p className="mt-2 whitespace-pre-line rounded-xl bg-raised px-3 py-2 text-sm" data-testid="workout-note">
          {own.text}
        </p>
      )}
      <div className="mt-3 space-y-3">
        {detail.exercises.map((g, i) => {
          const ex = EXERCISE_BY_ID.get(g.exerciseId);
          return (
            <div key={i}>
              {ex ? (
                <button
                  type="button"
                  onClick={() => go("exercise", g.exerciseId)}
                  className="press -mx-1 inline-flex min-h-11 items-center gap-1 rounded-lg px-1 text-left font-medium"
                >
                  {exName(g.exerciseId)}
                  <span className="text-accent" aria-hidden>
                    ›
                  </span>
                </button>
              ) : (
                <h4 className="font-medium">{exName(g.exerciseId)}</h4>
              )}
              <ol className="mt-1 text-sm">
                {g.sets.map((s, j) => (
                  <li key={s.id} className="num flex items-center gap-3 border-b border-line/60 py-1 last:border-0">
                    <span className="w-5 text-faint">{j + 1}</span>
                    <span className="flex-1">
                      {ex ? setText(ex, s.weight, s.reps, unit, s.distanceM, s) : num(s.reps)}
                      {s.powerW !== undefined && ` · ${t("lab.machines.power", { watts: s.powerW })}`}
                    </span>
                    {prIds.has(s.id) && (
                      <span className="flex items-center text-gold">
                        <Icon name="trophy" size={14} />
                        <span className="sr-only">{t("progress.cal.prSet")}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
      {!active && (
        <Button kind="ghost" icon="play" className="mt-4 w-full" onClick={again}>
          {t("hx.again")}
        </Button>
      )}
      {cant && (
        <p className="mt-2 text-sm text-muted" role="status">
          {t("hx.againNone")}
        </p>
      )}
      {editing && <EditWorkoutSheet sessionId={summary.sessionId} onClose={() => setEditing(false)} />}
    </article>
  );
}
