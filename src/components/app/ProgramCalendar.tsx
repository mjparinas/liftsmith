"use client";

// Season program calendar for coaches (docs/decisions/coach-programs.md): month grid + Done / Not yet roster.
// Desktop: two columns like Coaching › Schedule; phone: grid with the day card under it.
// AthleteProgramCalendar is the lighter Follow view from local planSource (no roster).
import { useCallback, useEffect, useMemo, useState } from "react";

import { track } from "@/lib/analytics";
import {
  coachProgramDayIndex,
  coachProgramEndAt,
  loadProgramCalendar,
  type AttendanceState,
  type CalendarDay,
  type CalendarMonth,
} from "@/lib/coachProgramAssign";
import { dayKey, monthGrid, weekdayNames } from "@/lib/dashboard";
import { date, t } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { useApp } from "@/lib/store";
import { trainerError } from "@/lib/trainer";
import type { PlanSource } from "@/lib/types";
import { useNow } from "@/lib/useNow";

import { Icon } from "./icons";
import { Button, Chip, Skeleton } from "./ui";
import { useMonthSwipe } from "./useMonthSwipe";

type Filter = "all" | AttendanceState;

interface YearMonth {
  y: number;
  m: number;
}

const monthOf = (ms: number): YearMonth => {
  const d = new Date(ms);
  return { y: d.getFullYear(), m: d.getMonth() };
};
const shiftMonth = (ym: YearMonth, by: number): YearMonth => {
  const d = new Date(ym.y, ym.m + by, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
};

const STATE_ORDER: AttendanceState[] = ["notYet", "done", "scheduled", "off"];

export function ProgramCalendar({
  programId,
  teamId,
  /** When set, the roster shows only this athlete (client report month strip). */
  clientId,
  onClose,
}: {
  programId?: string;
  teamId?: string;
  clientId?: string;
  onClose?: () => void;
}) {
  const now = useNow(60_000);
  const [ym, setYm] = useState<YearMonth>(() => monthOf(now));
  const [data, setData] = useState<CalendarMonth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("notYet");

  const load = useCallback(() => {
    loadProgramCalendar({ programId, teamId, year: ym.y, month: ym.m })
      .then((r) => {
        setError(null);
        setData(r);
        track("feature", { name: "trainer", detail: "programCalendar" });
      })
      .catch((e: unknown) => {
        setData(null);
        setError(trainerError(e));
      });
  }, [programId, teamId, ym.y, ym.m]);

  useEffect(load, [load]);

  const byDate = useMemo(() => {
    const m = new Map<string, CalendarDay>();
    for (const d of data?.days ?? []) m.set(d.date, d);
    return m;
  }, [data]);

  const todayKey = dayKey(now);
  const selected = picked ?? data?.days.find((d) => d.date >= todayKey)?.date ?? data?.days[0]?.date ?? null;
  const day = selected ? byDate.get(selected) : null;

  const shift = (by: number) => {
    haptic("select");
    setYm((cur) => shiftMonth(cur, by));
    setPicked(null);
  };
  const swipe = useMonthSwipe(shift);
  const month = date(new Date(ym.y, ym.m, 1), { month: "long", year: "numeric" });

  const scopedDay = useMemo(() => {
    if (!day || !clientId) return day;
    return { ...day, people: day.people.filter((p) => p.id === clientId) };
  }, [day, clientId]);

  const people = useMemo(() => {
    if (!scopedDay) return [];
    const list = scopedDay.people.filter((p) => filter === "all" || p.state === filter);
    return list.sort((a, b) => STATE_ORDER.indexOf(a.state) - STATE_ORDER.indexOf(b.state) || a.name.localeCompare(b.name));
  }, [scopedDay, filter]);

  const doneCount = scopedDay?.people.filter((p) => p.state === "done").length ?? 0;
  const total = scopedDay?.people.filter((p) => p.state !== "off").length ?? 0;

  const mark = (d: CalendarDay | undefined) => {
    if (!d) return null;
    const peopleOn = clientId ? d.people.filter((p) => p.id === clientId) : d.people;
    const active = peopleOn.filter((p) => p.state !== "off");
    if (!active.length) return null;
    const done = active.filter((p) => p.state === "done").length;
    if (done === active.length) return "full";
    if (done > 0) return "partial";
    if (d.date > todayKey) return "soon";
    return "none";
  };

  return (
    <div className="desk:grid desk:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] desk:items-start desk:gap-x-3" data-testid="program-calendar">
      <div className="desk:col-start-1">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold">{data?.title ?? t("cpg.cal.title")}</h2>
          {onClose && (
            <Button kind="ghost" onClick={onClose}>
              {t("map.close")}
            </Button>
          )}
        </div>
        {error && (
          <p className="text-sm text-warn" role="status">
            {error}
          </p>
        )}
        {!data && !error && <Skeleton className="h-64" />}
        {data && (
          <section className="card p-3" aria-label={month} {...swipe}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => shift(-1)}
                className="press grid h-11 w-11 place-items-center rounded-xl border border-line bg-raised"
                aria-label={t("dash.prevMonth")}
              >
                <Icon name="chevronLeft" size={20} />
              </button>
              <h3 className="text-center font-semibold" aria-live="polite">
                {month}
              </h3>
              <button
                type="button"
                onClick={() => shift(1)}
                className="press grid h-11 w-11 place-items-center rounded-xl border border-line bg-raised"
                aria-label={t("dash.nextMonth")}
              >
                <Icon name="chevronRight" size={20} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
              {weekdayNames().map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {monthGrid(ym.y, ym.m).flatMap((row, ri) =>
                row.map((cell, ci) => {
                  if (!cell) return <div key={`${ri}-${ci}`} />;
                  const key = cell.key;
                  const cal = byDate.get(key);
                  const m = mark(cal);
                  const on = selected === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!cal}
                      onClick={() => {
                        if (!cal) return;
                        haptic("select");
                        setPicked(key);
                        if (key === todayKey) setFilter("notYet");
                      }}
                      className={`press relative flex min-h-11 flex-col items-center justify-center rounded-xl text-sm ${
                        cal ? "border border-line bg-raised" : "opacity-40"
                      } ${on ? "ring-2 ring-accent" : ""} ${key === todayKey ? "font-bold" : ""}`}
                      aria-label={cal ? `${key} ${cal.dayName}` : key}
                    >
                      <span className="num">{new Date(cell.ms).getDate()}</span>
                      {m && (
                        <span
                          className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                            m === "full"
                              ? "bg-good"
                              : m === "partial"
                                ? "bg-warn"
                                : m === "soon"
                                  ? "border border-good bg-transparent"
                                  : "border border-muted bg-transparent"
                          }`}
                          aria-hidden
                        />
                      )}
                      {cal && (
                        <span className="desk:block mt-0.5 hidden max-w-full truncate px-0.5 text-[0.65rem] text-faint">{cal.dayName}</span>
                      )}
                    </button>
                  );
                }),
              )}
            </div>
            {!data.days.length && <p className="mt-3 text-sm text-muted">{t("cpg.cal.empty")}</p>}
          </section>
        )}
      </div>
      <div className="mt-3 desk:mt-0 desk:col-start-2">
        {scopedDay ? (
          <section className="card p-4" data-testid="program-calendar-day">
            <h3 className="font-semibold">
              {date(new Date(`${scopedDay.date}T12:00:00`), { weekday: "long", month: "short", day: "numeric" })}
            </h3>
            <p className="text-sm text-muted">{scopedDay.dayName}</p>
            {!clientId && <p className="mt-1 text-sm font-medium">{t("cpg.cal.doneOf", { done: doneCount, total })}</p>}
            {!clientId && (
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["notYet", t("cpg.cal.notYet")],
                    ["done", t("cpg.cal.done")],
                    ["all", t("cpg.cal.filterAll")],
                  ] as const
                ).map(([id, label]) => (
                  <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>
                    {label}
                  </Chip>
                ))}
              </div>
            )}
            <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {people.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                  <span className="font-medium">{clientId ? scopedDay.dayName : p.name}</span>
                  <span
                    className={`text-xs font-semibold ${
                      p.state === "done" ? "text-good" : p.state === "notYet" ? "text-warn" : "text-muted"
                    }`}
                  >
                    {t(`cpg.cal.${p.state}`)}
                  </span>
                </li>
              ))}
              {!people.length && <li className="text-sm text-muted">{t("cpg.cal.empty")}</li>}
            </ul>
          </section>
        ) : data ? (
          <p className="text-sm text-muted">{t("cpg.cal.empty")}</p>
        ) : null}
        {error?.includes("gone") || (data === null && error) ? <p className="mt-2 text-sm text-muted">{t("cpg.cal.noAssign")}</p> : null}
        {error && (
          <Button kind="ghost" className="mt-2" onClick={() => (oops(), load())}>
            {t("friends.retry")}
          </Button>
        )}
      </div>
    </div>
  );
}

type AthleteDay = { date: string; dayName: string; state: AttendanceState };

/** Month view of the athlete's own standing program from local planSource (no roster). */
export function AthleteProgramCalendar({ src }: { src: Extract<PlanSource, { kind: "coachProgram" }> }) {
  const now = useNow(60_000);
  const { profile, events } = useApp();
  const [ym, setYm] = useState<YearMonth>(() => monthOf(now));
  const [picked, setPicked] = useState<string | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, AthleteDay>();
    const end = coachProgramEndAt(src);
    const today = dayKey(now);
    const from = new Date(ym.y, ym.m, 1).getTime();
    const to = new Date(ym.y, ym.m + 1, 1).getTime();
    const sessionsByDay = new Map<string, string[][]>();
    let sessionId: string | null = null;
    let start = 0;
    const exercises: string[] = [];
    const flush = () => {
      if (!sessionId || !start || start < from || start >= to) return;
      const key = dayKey(start);
      const list = sessionsByDay.get(key) ?? [];
      list.push([...exercises]);
      sessionsByDay.set(key, list);
    };
    for (const e of events) {
      if (e.type === "sessionStart") {
        flush();
        sessionId = e.sessionId;
        start = e.at;
        exercises.length = 0;
      } else if (e.type === "set" && sessionId && e.sessionId === sessionId) {
        if (!exercises.includes(e.exerciseId)) exercises.push(e.exerciseId);
      } else if (e.type === "sessionEnd" && sessionId && e.sessionId === sessionId) {
        flush();
        sessionId = null;
      }
    }
    flush();

    for (let day = 1; day <= 31; day++) {
      const d = new Date(ym.y, ym.m, day);
      if (d.getMonth() !== ym.m) break;
      const ms = d.getTime();
      const noon = ms + 12 * 3_600_000;
      const idx = coachProgramDayIndex(src, noon);
      if (idx === null) continue;
      if (noon < src.startedAt || noon >= end) continue;
      const key = dayKey(ms);
      const dayName = profile.routines?.find((r) => r.id === src.dayIds[idx])?.name ?? src.title;
      const want = new Set(profile.routines?.find((r) => r.id === src.dayIds[idx])?.items.map((i) => i.exerciseId) ?? []);
      const hits = sessionsByDay.get(key) ?? [];
      const done = want.size > 0 && hits.some((ex) => ex.filter((id) => want.has(id)).length >= Math.ceil(want.size * 0.6));
      const state: AttendanceState = done ? "done" : key > today ? "scheduled" : "notYet";
      map.set(key, { date: key, dayName, state });
    }
    return map;
  }, [events, profile.routines, src, ym.m, ym.y, now]);

  const todayKey = dayKey(now);
  const selected = picked ?? [...byDate.keys()].find((k) => k >= todayKey) ?? [...byDate.keys()][0] ?? null;
  const day = selected ? byDate.get(selected) : null;
  const shift = (by: number) => {
    haptic("select");
    setYm((cur) => shiftMonth(cur, by));
    setPicked(null);
  };
  const swipe = useMonthSwipe(shift);
  const month = date(new Date(ym.y, ym.m, 1), { month: "long", year: "numeric" });

  return (
    <div
      className="desk:grid desk:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] desk:items-start desk:gap-x-3"
      data-testid="athlete-program-calendar"
    >
      <section className="card p-3" aria-label={month} {...swipe}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="press grid h-11 w-11 place-items-center rounded-xl border border-line bg-raised"
            aria-label={t("dash.prevMonth")}
          >
            <Icon name="chevronLeft" size={20} />
          </button>
          <h3 className="text-center font-semibold" aria-live="polite">
            {month}
          </h3>
          <button
            type="button"
            onClick={() => shift(1)}
            className="press grid h-11 w-11 place-items-center rounded-xl border border-line bg-raised"
            aria-label={t("dash.nextMonth")}
          >
            <Icon name="chevronRight" size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
          {weekdayNames().map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthGrid(ym.y, ym.m).flatMap((row, ri) =>
            row.map((cell, ci) => {
              if (!cell) return <div key={`${ri}-${ci}`} />;
              const cal = byDate.get(cell.key);
              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={!cal}
                  onClick={() => {
                    if (!cal) return;
                    haptic("select");
                    setPicked(cell.key);
                  }}
                  className={`press relative flex min-h-11 flex-col items-center justify-center rounded-xl text-sm ${
                    cal ? "border border-line bg-raised" : "opacity-40"
                  } ${selected === cell.key ? "ring-2 ring-accent" : ""} ${cell.key === todayKey ? "font-bold" : ""}`}
                  aria-label={cal ? `${cell.key} ${cal.dayName}` : cell.key}
                >
                  <span className="num">{new Date(cell.ms).getDate()}</span>
                  {cal && (
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                        cal.state === "done"
                          ? "bg-good"
                          : cal.state === "scheduled"
                            ? "border border-good bg-transparent"
                            : "border border-muted bg-transparent"
                      }`}
                      aria-hidden
                    />
                  )}
                </button>
              );
            }),
          )}
        </div>
        {!byDate.size && <p className="mt-3 text-sm text-muted">{t("cpg.cal.empty")}</p>}
      </section>
      <div className="mt-3 desk:mt-0">
        {day ? (
          <section className="card p-4">
            <h3 className="font-semibold">{date(new Date(`${day.date}T12:00:00`), { weekday: "long", month: "short", day: "numeric" })}</h3>
            <p className="text-sm text-muted">{day.dayName}</p>
            <p
              className={`mt-2 text-sm font-semibold ${
                day.state === "done" ? "text-good" : day.state === "notYet" ? "text-warn" : "text-muted"
              }`}
            >
              {t(`cpg.cal.${day.state}`)}
            </p>
          </section>
        ) : (
          <p className="text-sm text-muted">{t("cpg.cal.empty")}</p>
        )}
      </div>
    </div>
  );
}
