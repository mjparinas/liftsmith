"use client";

import { useState } from "react";

import { track } from "@/lib/analytics";
import { dayChoices, extraCopies } from "@/lib/coachProgramTemplates";
import { weekStartDay } from "@/lib/derive";
import { date, t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { autoArrange, monthCells, weekOrder, workoutsIn, type PhaseDraft, type RestWhy, type Week } from "@/lib/programWeek";
import { useApp } from "@/lib/store";
import type { Routine } from "@/lib/types";

import { RoutineEditor } from "./Routines";
import { Button, Chip, Sheet } from "./ui";

// The coach program builder's schedule (docs/decisions/coach-programs.md "The program builder", 2026-11-25): the
// program's week on the seven weekdays with rest days, a Month view of how it runs from this week, Auto-arrange, and
// the coach's routines beside it to make and edit without leaving the program.

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

/** A weekday's short name in the app's language (0 = Sunday). 2023-01-01 was a Sunday. */
const dayShort = (wd: number) => date(Date.UTC(2023, 0, 1 + wd), { weekday: "short", timeZone: "UTC" });
const dayLong = (wd: number) => date(Date.UTC(2023, 0, 1 + wd), { weekday: "long", timeZone: "UTC" });

const restLine = (why: RestWhy | undefined) =>
  !why
    ? null
    : why.kind === "same"
      ? t("cpg.auto.restSame", { a: why.before, b: why.after })
      : t("cpg.auto.restAfter", { name: why.before });

export function ProgramWeekEditor({
  week,
  onChange,
  weeks,
  phases,
}: {
  week: Week;
  onChange: (w: Week) => void;
  /** How many weeks the program runs, for the Month view. */
  weeks: number;
  /** The program's phases, when it has more than one, so the Month view shows each phase's week. */
  phases?: readonly PhaseDraft[];
}) {
  const { profile, saveRoutine, deleteRoutine, routineId: today } = useApp();
  const routines = profile.routines ?? [];
  const byId = new Map(routines.map((r) => [r.id, r]));
  const firstDay = weekStartDay();
  const order = weekOrder(firstDay);
  const [view, setView] = useState<"week" | "month">("week");
  const [picking, setPicking] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ routine: Routine; place?: number } | null>(null);
  const [arranging, setArranging] = useState(false);
  const [why, setWhy] = useState<Partial<Record<number, RestWhy>>>({});

  const set = (wd: number, id: string | null) => {
    haptic("select");
    const next = [...week];
    next[wd] = id;
    setWhy({});
    onChange(next);
  };

  const choices = dayChoices(
    routines,
    [...new Set(week.filter((x): x is string => !!x))].filter((id) => byId.has(id)),
  );
  const copies = extraCopies(routines, [...week.filter((x): x is string => !!x), ...(today ? [today] : [])]);
  const usedOn = (id: string) =>
    order
      .filter((wd) => week[wd] === id)
      .map(dayShort)
      .join(", ");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2" role="group" aria-label={t("cpg.view")}>
          <Chip active={view === "week"} onClick={() => setView("week")}>
            {t("cpg.view.week")}
          </Chip>
          <Chip active={view === "month"} onClick={() => setView("month")}>
            {t("cpg.view.month")}
          </Chip>
        </div>
        {routines.length > 0 && (
          <Button kind="ghost" icon="sparkle" onClick={() => setArranging(true)}>
            {t("cpg.auto")}
          </Button>
        )}
      </div>

      {view === "week" ? (
        <ol className="grid gap-2 desk:grid-cols-7" aria-label={t("cpg.view.week")}>
          {order.map((wd) => {
            const r = week[wd] ? byId.get(week[wd]!) : undefined;
            const line = r ? null : restLine(why[wd]);
            return (
              <li key={wd}>
                <button
                  type="button"
                  onClick={() => setPicking(wd)}
                  className={`press flex w-full items-center gap-3 rounded-2xl border p-3 text-left desk:min-h-28 desk:flex-col desk:items-start desk:gap-1 ${
                    r ? "border-line bg-raised" : "border-dashed border-line text-muted"
                  }`}
                >
                  <span className="w-12 shrink-0 text-xs font-bold tracking-wide text-faint uppercase desk:w-auto">{dayShort(wd)}</span>
                  <span className="min-w-0 flex-1">
                    {r ? (
                      <>
                        <span className="block font-semibold break-words">{r.name}</span>
                        <span className="block text-xs text-faint">{t("cpg.days.ex", { count: r.items.length })}</span>
                      </>
                    ) : (
                      <>
                        <span className="block">{t("cpg.rest")}</span>
                        {line && <span className="block text-xs text-faint">{line}</span>}
                      </>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        <MonthView week={week} weeks={weeks} byId={byId} firstDay={firstDay} phases={phases} />
      )}
      <p className="text-xs text-faint">{t("cpg.weekSummary", { count: workoutsIn(week) })}</p>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t("cpg.shelf")}</p>
        {choices.length ? (
          <ul className="grid gap-2 desk:grid-cols-2">
            {choices.map(({ routine: r, exercises }) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setEditing({ routine: r })}
                  aria-label={t("cpg.day.edit", { name: r.name })}
                  className="press flex w-full items-center justify-between gap-2 rounded-2xl border border-line bg-raised p-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold break-words">{r.name}</span>
                    <span className="block text-xs text-faint">
                      {t("cpg.days.ex", { count: exercises ?? r.items.length })}
                      {usedOn(r.id) ? ` · ${usedOn(r.id)}` : ""}
                    </span>
                  </span>
                  <span className="text-sm text-accent">{t("cpg.editShort")}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t("cpg.days.none")}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button kind="ghost" icon="plus" onClick={() => setEditing({ routine: blank() })}>
            {t("cpg.day.new")}
          </Button>
          {copies.length > 0 && (
            <Button
              kind="quiet"
              icon="trash"
              onClick={() => {
                for (const id of copies) deleteRoutine(id);
                haptic("toggle");
                track("feature", { name: "coach_program", detail: "tidy_copies" });
              }}
            >
              {t("cpg.days.tidy", { count: copies.length })}
            </Button>
          )}
        </div>
      </div>

      <Sheet
        open={picking !== null}
        onClose={() => setPicking(null)}
        title={picking !== null ? t("cpg.day.pick", { day: dayLong(picking) }) : ""}
      >
        {picking !== null && (
          <div className="space-y-2">
            {choices.map(({ routine: r, exercises }) => {
              const on = week[picking] === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    set(picking, r.id);
                    setPicking(null);
                  }}
                  className={`press flex w-full items-center justify-between gap-2 rounded-2xl border p-3 text-left ${
                    on ? "border-accent/50 bg-accent/10" : "border-line bg-raised"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block font-semibold break-words">{r.name}</span>
                    <span className="block text-xs text-faint">
                      {t("cpg.days.ex", { count: exercises ?? r.items.length })}
                      {usedOn(r.id) ? ` · ${t("cpg.day.used", { days: usedOn(r.id) })}` : ""}
                    </span>
                  </span>
                </button>
              );
            })}
            <Button
              kind="ghost"
              icon="plus"
              className="w-full"
              onClick={() => {
                setEditing({ routine: blank(), place: picking });
                setPicking(null);
              }}
            >
              {t("cpg.day.new")}
            </Button>
            {week[picking] && byId.get(week[picking]!) && (
              <Button
                kind="quiet"
                className="w-full"
                onClick={() => {
                  setEditing({ routine: byId.get(week[picking]!)! });
                  setPicking(null);
                }}
              >
                {t("cpg.day.edit", { name: byId.get(week[picking]!)!.name })}
              </Button>
            )}
            <Button
              kind="quiet"
              className="w-full"
              onClick={() => {
                set(picking, null);
                setPicking(null);
              }}
            >
              {t("cpg.day.rest")}
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet
        wide
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing && byId.has(editing.routine.id) ? t("rt.edit") : t("rt.new")}
      >
        {editing && (
          <RoutineEditor
            coachReps
            initial={editing.routine}
            onSave={(r) => {
              haptic("success");
              sound.tick();
              saveRoutine(r);
              if (editing.place !== undefined) set(editing.place, r.id);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Sheet>

      {arranging && (
        <AutoArrange
          open
          onClose={() => setArranging(false)}
          routines={choices.map((c) => c.routine)}
          start={[...new Set(order.map((wd) => week[wd]).filter((x): x is string => !!x && byId.has(x)))]}
          days={workoutsIn(week)}
          onArrange={(a) => {
            haptic("success");
            track("feature", { name: "coach_program", detail: "auto_arrange" });
            onChange(a.week);
            setWhy(a.why);
            setView("week");
            setArranging(false);
          }}
        />
      )}
    </div>
  );
}

function blank(): Routine {
  const at = Date.now();
  return { id: newId(), name: "", items: [], createdAt: at, updatedAt: at };
}

function AutoArrange({
  open,
  onClose,
  routines,
  start,
  days,
  onArrange,
}: {
  open: boolean;
  onClose: () => void;
  routines: Routine[];
  start: string[];
  days: number;
  onArrange: (a: ReturnType<typeof autoArrange>) => void;
}) {
  const [picked, setPicked] = useState<string[]>(() => (start.length ? start : routines.slice(0, 4).map((r) => r.id)));
  const [count, setCount] = useState(() => days || Math.min(7, Math.max(2, start.length || Math.min(4, routines.length))));
  const chosen = picked.map((id) => routines.find((r) => r.id === id)).filter((r): r is Routine => !!r);
  return (
    <Sheet open={open} onClose={onClose} title={t("cpg.auto.title")}>
      <div className="space-y-4">
        <p className="text-sm text-muted">{t("cpg.auto.hint")}</p>
        <div>
          <p className="text-sm font-medium">{t("cpg.auto.routines")}</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t("cpg.auto.routines")}>
            {routines.map((r) => {
              const at = picked.indexOf(r.id);
              return (
                <Chip
                  key={r.id}
                  active={at >= 0}
                  onClick={() => {
                    haptic("select");
                    setPicked((p) => (p.includes(r.id) ? p.filter((x) => x !== r.id) : p.length >= 7 ? p : [...p, r.id]));
                  }}
                >
                  {at >= 0 ? `${at + 1}. ` : ""}
                  {r.name}
                </Chip>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">{t("cpg.auto.days")}</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t("cpg.auto.days")}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <Chip
                key={n}
                active={count === n}
                onClick={() => {
                  haptic("select");
                  setCount(n);
                }}
              >
                {String(n)}
              </Chip>
            ))}
          </div>
        </div>
        <Button className="w-full" disabled={!chosen.length} onClick={() => onArrange(autoArrange(chosen, count))}>
          {t("cpg.auto.go")}
        </Button>
      </div>
    </Sheet>
  );
}

/** "Weeks 1 to 5: Build", one line per phase, for under the month. */
export function phaseRanges(phases: readonly Pick<PhaseDraft, "kind" | "weeks">[]): string[] {
  let from = 1;
  return phases.map((p) => {
    const to = from + p.weeks - 1;
    const name = t(`cpg.phase.${p.kind}`);
    const line = to === from ? t("cpg.phase.one", { from, name }) : t("cpg.phase.range", { from, to, name });
    from = to + 1;
    return line;
  });
}

function MonthView({
  week,
  weeks,
  byId,
  firstDay,
  phases,
}: {
  week: Week;
  weeks: number;
  byId: Map<string, Routine>;
  firstDay: 0 | 1;
  phases?: readonly PhaseDraft[];
}) {
  const [now] = useState(() => Date.now());
  const phased = phases && phases.length > 1 ? phases : undefined;
  const cells = monthCells(week, now, weeks, firstDay, 42, phased);
  const today = new Date(now).toDateString();
  return (
    <div>
      <div className="grid grid-cols-7 gap-1" aria-hidden="true">
        {weekOrder(firstDay).map((wd) => (
          <span key={wd} className="text-center text-xs font-bold text-faint uppercase">
            {dayShort(wd)}
          </span>
        ))}
      </div>
      <ol className="mt-1 grid grid-cols-7 gap-1" aria-label={t("cpg.view.month")}>
        {cells.map((c) => {
          const r = c.routineId ? byId.get(c.routineId) : undefined;
          const day = new Date(c.at);
          const what = r ? r.name : c.inside ? t("cpg.rest") : t("cpg.month.after");
          const phase = phased && c.inside ? t(`cpg.phase.${phased[c.phase]!.kind}`) : null;
          const label = `${date(c.at, { weekday: "long", month: "long", day: "numeric" })}: ${phase ? `${what} (${phase})` : what}`;
          const easy = phased && c.inside && phased[c.phase]!.kind !== "build";
          return (
            <li
              key={c.at}
              aria-label={label}
              className={`min-h-14 min-w-0 rounded-lg border p-1 text-xs ${
                r ? "border-line bg-raised" : "border-dashed border-line text-faint"
              } ${c.inside ? "" : "opacity-40"} ${day.toDateString() === today ? "outline-2 outline-accent" : ""}`}
            >
              <span className="num flex items-center justify-between text-faint">
                {day.getDate()}
                {/* A Deload or Peak week is marked with its first letter; the line under the month names it. */}
                {easy && c.routineId && (
                  <span className="text-[0.625rem] font-bold text-muted" aria-hidden="true">
                    {t(`cpg.phase.${phased[c.phase]!.kind}`).slice(0, 1)}
                  </span>
                )}
              </span>
              {r && <span className="block font-semibold leading-tight break-words text-[0.6875rem]">{r.name}</span>}
            </li>
          );
        })}
      </ol>
      {phased ? (
        <ul className="mt-2 space-y-0.5 text-xs text-faint">
          {phaseRanges(phased).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-faint">{t("cpg.month.hint", { count: weeks })}</p>
      )}
    </div>
  );
}
