"use client";

import { useEffect, useState } from "react";

import {
  acceptCalendarInvite,
  clearScheduleDay,
  inviteCalendarAssistant,
  listCalendarAccess,
  loadScheduleMonth,
  loadTrainingActivity,
  revokeCalendarAccess,
  setScheduleDay,
  type AthleteActivity,
  type CalendarAccess,
  type ScheduleCell,
} from "@/lib/coachSchedule";
import { dayKey, monthGrid, weekdayNames } from "@/lib/dashboard";
import { exercise } from "@/lib/exercises";
import { date, list, t } from "@/lib/i18n";
import { haptic, sound } from "@/lib/juice";
import { encodeRoutine } from "@/lib/routineShare";
import { dateAllowed, routineFromSchedule } from "@/lib/scheduleDays";
import { partNow, useApp } from "@/lib/store";
import type { Team } from "@/lib/teams";
import type { Person } from "@/lib/trainer";

import { go } from "./router";
import { RoutinesSheet } from "./Routines";
import { Button, ScreenHeader } from "./ui";

export function CoachCalendar({
  clients,
  teams,
  access,
}: {
  clients: Person[];
  teams: Pick<Team, "id" | "name">[];
  access?: CalendarAccess;
}) {
  const [month, setMonth] = useState(() => new Date());
  const [scope, setScope] = useState(access?.scope ?? "all");
  const [picked, setPicked] = useState(() => dayKey(Date.now()));
  const [choice, setChoice] = useState("");
  const [days, setDays] = useState<ScheduleCell[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const routines = useApp((s) => s.profile.routines);
  const year = month.getFullYear();
  const index = month.getMonth();
  useEffect(() => {
    let current = true;
    void loadScheduleMonth(scope, year, index, access?.id).then(
      (result) => {
        if (current) setDays(result.days);
      },
      () => {
        if (current) setFailed(true);
      },
    );
    return () => {
      current = false;
    };
  }, [scope, year, index, access?.id]);

  function move(delta: number) {
    const next = new Date(year, index + delta, 1);
    setDays(null);
    setFailed(false);
    setMonth(next);
    setPicked(dayKey(next.getTime()));
    setChoice("");
  }

  async function save() {
    const routine = routines?.find((r) => r.id === choice);
    setBusy(true);
    setFailed(false);
    try {
      if (choice === "clear") {
        await clearScheduleDay(scope, picked, access?.id);
        setDays((old) => old?.filter((d) => d.date !== picked) ?? []);
      } else if (routine || choice === "rest") {
        const day = await setScheduleDay({
          scope,
          access: access?.id,
          date: picked,
          kind: routine ? "workout" : "rest",
          ...(routine ? { name: routine.name, code: encodeRoutine(routine) } : {}),
        });
        setDays((old) => [...(old?.filter((d) => d.date !== picked) ?? []), day]);
      }
      setChoice("");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const byDay = new Map(days?.map((d) => [d.date, d]));
  const selected = byDay.get(picked);
  return (
    <section className="card mb-4 space-y-3 p-4">
      <h2 className="font-semibold">{t("trn.calendar.title")}</h2>
      {!access && (
        <select
          aria-label={t("trn.calendar.audience")}
          value={scope}
          disabled={busy}
          onChange={(e) => {
            setDays(null);
            setFailed(false);
            setChoice("");
            setScope(e.target.value);
          }}
        >
          <option value="all">{t("trn.calendar.all")}</option>
          {teams.map((team) => (
            <option key={team.id} value={`team:${team.id}`}>
              {team.name}
            </option>
          ))}
          {clients.map((client) => (
            <option key={client.id} value={`client:${client.id}`}>
              {client.name || t("trn.noName")}
            </option>
          ))}
        </select>
      )}
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="min-h-11 min-w-11" aria-label={t("trn.calendar.prev")} disabled={busy} onClick={() => move(-1)}>
          ‹
        </button>
        <h3>{date(month, { month: "long", year: "numeric" })}</h3>
        <button type="button" className="min-h-11 min-w-11" aria-label={t("trn.calendar.next")} disabled={busy} onClick={() => move(1)}>
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekdayNames().map((name, i) => (
          <span className="text-center text-xs text-muted" key={i}>
            {name}
          </span>
        ))}
        {monthGrid(year, index)
          .flat()
          .map((day, i) => {
            if (!day) return <span key={i} />;
            const cell = byDay.get(day.key);
            const label = cell?.kind === "rest" ? t("trn.calendar.rest") : cell?.name;
            return (
              <button
                type="button"
                key={i}
                disabled={busy}
                aria-pressed={picked === day.key}
                aria-label={[date(day.ms, { dateStyle: "full" }), label].filter(Boolean).join(", ")}
                className={`min-h-12 min-w-0 rounded-lg border p-1 text-sm ${picked === day.key ? "border-ember" : "border-current/20"}`}
                onClick={() => {
                  setPicked(day.key);
                  setChoice("");
                }}
              >
                {date(day.ms, { day: "numeric" })}
                {label && <span className="block truncate text-xs">{label}</span>}
              </button>
            );
          })}
      </div>
      {failed && <p role="alert">{t("trn.calendar.failed")}</p>}
      {days && (
        <p className="text-sm">
          {picked} · {selected?.kind === "rest" ? t("trn.calendar.rest") : selected?.name || t("trn.calendar.empty")}
        </p>
      )}
      {days && dateAllowed(picked) && (
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label={t("trn.calendar.choose")} value={choice} disabled={busy} onChange={(e) => setChoice(e.target.value)}>
            <option value="">{t("trn.calendar.choose")}</option>
            <option value="rest">{t("trn.calendar.rest")}</option>
            {selected && <option value="clear">{t("trn.calendar.clear")}</option>}
            {routines
              ?.filter((r) => r.items.length > 0)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
          </select>
          <Button disabled={busy || !choice} onClick={() => void save()}>
            {t("trn.calendar.save")}
          </Button>
          <Button kind="ghost" onClick={() => setEditing(true)}>
            {t("trn.calendar.routines")}
          </Button>
        </div>
      )}
      {!access && <CalendarInvites key={scope} scope={scope} />}
      <RoutinesSheet open={editing} onClose={() => setEditing(false)} />
    </section>
  );
}

export function ScheduleToday({ cell }: { cell: ScheduleCell }) {
  const pick = useApp((s) => s.pickRoutine);
  const preview = useApp((s) => s.preview);
  const start = useApp((s) => s.start);
  const routine = routineFromSchedule(cell);
  if (cell.kind !== "rest" && !routine) return null;
  return (
    <section className="card-tint mt-4 space-y-2 p-4">
      <p className="text-sm text-muted">{t("trn.calendar.assigned")}</p>
      <h2 className="font-semibold">{routine?.name ?? t("trn.calendar.rest")}</h2>
      {routine && <p className="text-sm text-muted">{list(routine.items.map((item) => exercise(item.exerciseId).name))}</p>}
      {routine && (
        <Button
          onClick={() => {
            if (preview?.routineId !== routine.id) {
              pick(routine.id);
              return;
            }
            haptic("tap");
            sound.start();
            start();
            const active = useApp.getState().active;
            if (!active) return;
            if (partNow(active) === "warm") go("stretch", "warmup");
            else go("workout");
          }}
        >
          {t(preview?.routineId === routine.id ? "today.start" : "trn.calendar.preview")}
        </Button>
      )}
    </section>
  );
}

function CalendarInvites({ scope }: { scope: string }) {
  const [code, setCode] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  async function invite() {
    setBusy(true);
    setFailed(false);
    try {
      setCode(await inviteCalendarAssistant(scope));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button kind="ghost" disabled={busy} onClick={() => void invite()}>
        {t("trn.calendar.invite")}
      </Button>
      <Button kind="ghost" onClick={() => go("trainer", "calendar-access")}>
        {t("trn.calendar.access")}
      </Button>
      {code && (
        <label className="flex w-full flex-col gap-1 text-sm">
          {t("trn.calendar.shareCode")}
          <input value={code} readOnly onFocus={(e) => e.target.select()} />
        </label>
      )}
      {failed && <p role="alert">{t("trn.calendar.accessError")}</p>}
    </div>
  );
}

export function CalendarAccessScreen() {
  const [grants, setGrants] = useState<CalendarAccess[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    void listCalendarAccess().then(
      (result) => {
        if (live) setGrants(result);
      },
      () => {
        if (live) setFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, []);
  async function change(action: () => Promise<unknown>) {
    setFailed(false);
    setBusy(true);
    try {
      await action();
      setGrants(await listCalendarAccess());
      setCode("");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const grant = grants.find((g) => g.id === selected);
  return (
    <div className="desk-col space-y-3">
      <Button kind="ghost" onClick={() => go("trainer")}>
        {t("trn.back")}
      </Button>
      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">{t("trn.calendar.access")}</h2>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void change(() => acceptCalendarInvite(code.trim()));
          }}
        >
          <label className="flex min-w-0 flex-col gap-1 text-sm">
            {t("trn.calendar.inviteCode")}
            <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={48} autoComplete="off" />
          </label>
          <Button submit disabled={busy || code.trim().length !== 48}>
            {t("trn.calendar.accept")}
          </Button>
        </form>
        {failed && <p role="alert">{t("trn.calendar.accessError")}</p>}
        <ul className="divide-y divide-line">
          {grants.map((g) => (
            <li className="flex flex-wrap items-center justify-between gap-2 py-2" key={g.id}>
              <span>{g.name === null ? t("trn.calendar.pending") : g.name || t("trn.noName")}</span>
              <div className="flex flex-wrap gap-2">
                {!g.own && (
                  <Button kind="ghost" onClick={() => setSelected(g.id)}>
                    {t("trn.calendar.title")}
                  </Button>
                )}
                <Button kind="ghost" disabled={busy} onClick={() => void change(() => revokeCalendarAccess(g.id))}>
                  {t("trn.calendar.revoke")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      {grant && <CoachCalendar key={grant.id} clients={[]} teams={[]} access={grant} />}
    </div>
  );
}

export function TrainingActivityScreen() {
  const [athletes, setAthletes] = useState<AthleteActivity[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    void loadTrainingActivity().then(
      (rows) => {
        if (live) setAthletes(rows);
      },
      () => {
        if (live) setFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="desk-col space-y-3">
      <ScreenHeader back={{ label: t("trn.back"), onClick: () => go("trainer", "clients") }} title={t("trn.calendar.activity")} />
      {failed && <p role="alert">{t("trn.calendar.failed")}</p>}
      {!failed && !athletes && <p role="status">{t("trn.loading")}</p>}
      {athletes?.length === 0 && <p>{t("trn.noClients")}</p>}
      {!!athletes?.length && (
        <ul className="space-y-2">
          {athletes.map((athlete) => (
            <li className="card flex flex-wrap items-center justify-between gap-2 p-4" key={athlete.id}>
              <div>
                <h2 className="font-semibold">{athlete.name || t("trn.noName")}</h2>
                <p className="text-sm text-muted">{t("trn.calendar.activityCount", { count: athlete.workouts })}</p>
                {athlete.lastAt !== null && <p className="text-sm text-muted">{date(athlete.lastAt, { dateStyle: "medium" })}</p>}
              </div>
              <Button kind="ghost" onClick={() => go("trainer", `c.${athlete.id}`)}>
                {t("trn.calendar.openReport")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
