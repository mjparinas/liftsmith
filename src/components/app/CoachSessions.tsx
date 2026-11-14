"use client";

// Booking and scheduling sessions (2026-11-13; Melvin: "booking and scheduling sessions"; server:
// src/server/coachBooking.ts, docs/decisions/trainer-mode.md "Booking"). A coach or personal trainer opens times from
// Your clients (a day chip, the time, a length, once or every week, a place) and either leaves them open for clients to
// book or books one client straight in, also from that client's report. Clients book an open time under Your coach,
// add it to their calendar and can cancel; a session in the next day shows on Today. Everything is taps except the
// time (the phone's own time picker) and an optional place. The coach's Schedule is a month calendar (2026-11-14; Melvin:
// "this long list is not intuitive, can you make this a calendar view … switch between months").
import { useEffect, useMemo, useRef, useState } from "react";

import { track } from "@/lib/analytics";
import {
  addSlots,
  BOOK_AHEAD_DAYS,
  bookSlot,
  byDay,
  cancelSlot,
  clock,
  DAYS_AHEAD,
  daysFromToday,
  lastScheduleMonth,
  LENGTHS,
  nextSession,
  openingDay,
  REPEATS,
  sessionToCalendar,
  slotsByDayKey,
  startAt,
  when,
  type Sessions,
  type Slot,
} from "@/lib/booking";
import { dayKey, monthGrid, weekdayNames } from "@/lib/dashboard";
import { monthOf, monthsBetween, shiftMonth, type YearMonth } from "@/lib/history";
import { date, t } from "@/lib/i18n";
import { haptic, oops, sound } from "@/lib/juice";
import { trainerError, useCoachNotes, type Person, type Role } from "@/lib/trainer";
import { useNow } from "@/lib/useNow";

import { Icon } from "./icons";
import { Button, Chip, Section, Sheet } from "./ui";
import { useMonthSwipe } from "./useMonthSwipe";

const FIELD = "mt-1 w-full rounded-xl border border-line bg-raised px-3 py-2";
const dayLabel = (ms: number) => date(ms, { weekday: "long", month: "short", day: "numeric" });
const length = (m: number) => t("bk.minutes", { count: m });

/** One line for a time: when, how long and where. */
function SlotLine({ s }: { s: Slot }) {
  return <span className="block text-sm text-muted">{[clock(s.start), length(s.minutes), s.place].filter(Boolean).join(" · ")}</span>;
}

// --- The coach's side ---

/** Coaching › Schedule: a month calendar of times, open or booked; tap a day for its times. Add times opens on that day. */
export function CoachSessions({
  slots,
  clients,
  role,
  onChange,
}: {
  slots: Slot[];
  clients: Person[];
  role: Role | null;
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const now = useNow(60_000);
  const thisMonth = monthOf(now);
  const lastMonth = lastScheduleMonth(now, slots);
  const [ym, setYm] = useState<YearMonth>(thisMonth);
  const [picked, setPicked] = useState<string | null>(null);
  const days = useMemo(() => slotsByDayKey(slots), [slots]);
  const selected = picked ?? openingDay(slots, ym, now);
  const name = (id: string | null) => (id ? clients.find((c) => c.id === id)?.name || t("trn.noName") : null);
  const remove = async (s: Slot) => {
    try {
      await cancelSlot(s);
      haptic("toggle");
      track("feature", { name: "trainer", detail: "slotCancel" });
      setNote(s.clientId ? t("bk.cancelledFor", { name: name(s.clientId) ?? "" }) : t("bk.removed"));
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
    }
  };

  const canBack = monthsBetween(thisMonth, ym) > 0;
  const canNext = monthsBetween(ym, lastMonth) > 0;
  const shift = (by: number) => {
    if ((by < 0 && !canBack) || (by > 0 && !canNext)) return;
    haptic("select");
    setYm((cur) => shiftMonth(cur, by));
    setPicked(null);
  };
  const swipe = useMonthSwipe(shift);
  const pick = (key: string) => {
    haptic("select");
    setPicked(key);
  };

  const month = date(new Date(ym.y, ym.m, 1), { month: "long", year: "numeric" });
  const monthSlots = slots.filter((s) => monthsBetween(monthOf(s.start), ym) === 0);
  const counts = (list: readonly Slot[]) => {
    const b = list.filter((s) => s.clientId).length;
    return [...(b ? [t("bk.bookedN", { count: b })] : []), ...(list.length - b ? [t("bk.openN", { count: list.length - b })] : [])];
  };
  const todayKey = dayKey(now);
  const daySlots = selected ? (days.get(selected) ?? []) : [];
  const selectedMs = selected ? new Date(`${selected}T12:00:00`).getTime() : null;
  // Add times opens on the picked day when it's today or later; otherwise on tomorrow, as before.
  const firstDay = selectedMs === null ? 1 : daysFromToday(now, selectedMs);

  return (
    <Section title={t("bk.title")} icon="calendar">
      <div className="card p-4">
        <p className="text-sm text-muted">{role === "coach" ? t("bk.hintCoach") : t("bk.hint")}</p>
        <Button className="mt-3 w-full" icon="plus" onClick={() => setAdding(true)}>
          {t("bk.add")}
        </Button>
        {note && (
          <p className="mt-2 text-sm text-muted" role="status">
            {note}
          </p>
        )}
      </div>
      <div className="mt-2 desk:grid desk:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] desk:items-start desk:gap-3">
        <section className="card p-3" aria-label={month} data-testid="schedule-calendar" {...swipe}>
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
              <span className="num block text-sm text-muted">{monthSlots.length ? counts(monthSlots).join(" · ") : t("bk.monthNone")}</span>
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
                    const list = days.get(d.key) ?? [];
                    const b = list.filter((s) => s.clientId).length;
                    const o = list.length - b;
                    const on = selected === d.key;
                    const past = d.key < todayKey;
                    const label = [date(d.ms, { weekday: "long", month: "long", day: "numeric" }), ...counts(list)].join(", ");
                    return (
                      <td key={d.key}>
                        <button
                          type="button"
                          aria-pressed={on}
                          aria-label={label}
                          aria-current={d.key === todayKey ? "date" : undefined}
                          onClick={() => pick(d.key)}
                          className={`press flex h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl border ${on ? "border-accent" : "border-transparent"} ${list.length ? "bg-accent/15" : ""} ${d.key === todayKey ? "ring-2 ring-accent ring-inset" : ""}`}
                        >
                          <span className={`num text-sm ${list.length ? "font-semibold" : past ? "text-faint" : "text-muted"}`}>
                            {new Date(d.ms).getDate()}
                          </span>
                          <span aria-hidden className="flex h-1.5 gap-0.5">
                            {b > 0 && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                            {o > 0 && <span className="h-1.5 w-1.5 rounded-full border border-good" />}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted" aria-label={t("bk.legend")}>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
              {t("bk.legendBooked")}
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="h-2 w-2 rounded-full border border-good" />
              {t("bk.open")}
            </li>
          </ul>
        </section>
        {selectedMs !== null && (
          <div className="mt-3 desk:mt-0" data-testid="schedule-day">
            <p className="mb-1 px-1 text-sm font-semibold">{dayLabel(selectedMs)}</p>
            {daySlots.length > 0 ? (
              <ul key={selected} className="card fade divide-y divide-line">
                {daySlots.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 py-2 pl-4 pr-2">
                    <span className="min-w-0 flex-1 py-1">
                      <span className={`block truncate font-medium ${s.clientId ? "" : "text-good"}`}>
                        {name(s.clientId) ?? t("bk.open")}
                      </span>
                      <SlotLine s={s} />
                    </span>
                    <button
                      type="button"
                      aria-label={t("bk.removeAt", { when: when(s.start) })}
                      onClick={() => void remove(s)}
                      className="press grid h-11 w-11 shrink-0 place-items-center text-muted"
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="card px-4 py-3 text-sm text-muted">{slots.length ? t("bk.dayNone") : t("bk.none")}</p>
            )}
          </div>
        )}
      </div>
      {/* A fresh sheet each time it opens, so "Today" is today. */}
      <AddTimes
        key={String(adding)}
        open={adding}
        clients={clients}
        firstDay={firstDay >= 0 && firstDay < BOOK_AHEAD_DAYS ? firstDay : 1}
        onClose={() => setAdding(false)}
        onDone={(n) => {
          setAdding(false);
          setNote(n);
          onChange();
        }}
      />
    </Section>
  );
}

/** On a client's report: their next sessions and Book them in. */
export function ClientSessions({ client, slots, onChange }: { client: Person; slots: Slot[]; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const who = client.name || t("trn.noName");
  return (
    <Section title={t("bk.title")} icon="calendar">
      {slots.length > 0 ? (
        <ul className="card divide-y divide-line">
          {slots.map((s) => (
            <li key={s.id} className="px-4 py-3">
              <span className="block font-medium">{dayLabel(s.start)}</span>
              <SlotLine s={s} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-1 text-sm text-muted">{t("bk.noneWith", { name: who })}</p>
      )}
      <Button kind="ghost" className="mt-2 w-full" icon="plus" onClick={() => setAdding(true)}>
        {t("bk.bookIn", { name: who })}
      </Button>
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
      {/* A fresh sheet each time it opens, so "Today" is today. */}
      <AddTimes
        key={String(adding)}
        open={adding}
        clients={[client]}
        fixed={client.id}
        onClose={() => setAdding(false)}
        onDone={(n) => {
          setAdding(false);
          setNote(n);
          onChange();
        }}
      />
    </Section>
  );
}

/** The sheet that opens times: day, time, length, how often, where, and who (open, or one client). */
function AddTimes({
  open,
  clients,
  fixed,
  firstDay = 1,
  onClose,
  onDone,
}: {
  open: boolean;
  clients: Person[];
  /** Booking this client in, from their report. */
  fixed?: string;
  /** The day chip picked at first, in days from today (the schedule passes the day picked on its calendar). */
  firstDay?: number;
  onClose: () => void;
  onDone: (note: string) => void;
}) {
  const [now] = useState(() => Date.now());
  const [day, setDay] = useState(firstDay);
  // A day past the usual three weeks of chips (picked on the calendar) adds chips up to it, scrolled into view.
  const chips = Math.max(DAYS_AHEAD, firstDay + 1);
  const picked = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (open) picked.current?.closest("button")?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [open]);
  const [time, setTime] = useState("18:00");
  const [minutes, setMinutes] = useState(60);
  const [weeks, setWeeks] = useState(1);
  const [place, setPlace] = useState("");
  const [client, setClient] = useState<string | null>(fixed ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = startAt(now, day, time || "18:00");
  const past = start <= now;
  const save = async () => {
    setBusy(true);
    try {
      const made = await addSlots({ start, minutes, place, weeks, ...(client ? { client } : {}) });
      sound.done();
      haptic("success");
      track("feature", { name: "trainer", detail: client ? "slotBook" : "slotOpen" });
      setError(null);
      const who = clients.find((c) => c.id === client)?.name || t("trn.noName");
      onDone(client ? t("bk.bookedFor", { name: who, when: when(start) }) : t("bk.added", { count: made.length }));
    } catch (e) {
      oops();
      setError(trainerError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title={fixed ? t("bk.bookIn", { name: clients[0]?.name || t("trn.noName") }) : t("bk.add")}>
      <p id="bk-day" className="text-sm font-medium">
        {t("bk.day")}
      </p>
      <div className="no-scrollbar -mx-1 mt-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-labelledby="bk-day">
        {Array.from({ length: chips }, (_, i) => (
          <Chip key={i} active={day === i} onClick={() => setDay(i)}>
            <span ref={i === firstDay ? picked : undefined} className="whitespace-nowrap">
              {i === 0 ? t("bk.today") : i === 1 ? t("bk.tomorrow") : date(startAt(now, i, "12:00"), { weekday: "short", day: "numeric" })}
            </span>
          </Chip>
        ))}
      </div>
      <label htmlFor="bk-time" className="mt-3 block text-sm font-medium">
        {t("bk.time")}
      </label>
      <input id="bk-time" type="time" value={time} step={900} onChange={(e) => setTime(e.target.value)} className={`${FIELD} num`} />
      <p id="bk-len" className="mt-3 text-sm font-medium">
        {t("bk.length")}
      </p>
      <div className="mt-1 flex flex-wrap gap-2" role="group" aria-labelledby="bk-len">
        {LENGTHS.map((m) => (
          <Chip key={m} active={minutes === m} onClick={() => setMinutes(m)}>
            {length(m)}
          </Chip>
        ))}
      </div>
      <p id="bk-repeat" className="mt-3 text-sm font-medium">
        {t("bk.repeat")}
      </p>
      <div className="mt-1 flex flex-wrap gap-2" role="group" aria-labelledby="bk-repeat">
        {REPEATS.map((w) => (
          <Chip key={w} active={weeks === w} onClick={() => setWeeks(w)}>
            {w === 1 ? t("bk.once") : t("bk.weeks", { count: w })}
          </Chip>
        ))}
      </div>
      <label htmlFor="bk-place" className="mt-3 block text-sm font-medium">
        {t("bk.place")}
      </label>
      <input
        id="bk-place"
        value={place}
        maxLength={80}
        onChange={(e) => setPlace(e.target.value)}
        placeholder={t("bk.placeHint")}
        className={FIELD}
      />
      {!fixed && (
        <>
          <p id="bk-who" className="mt-3 text-sm font-medium">
            {t("bk.who")}
          </p>
          <div className="mt-1 flex flex-wrap gap-2" role="group" aria-labelledby="bk-who">
            <Chip active={client === null} onClick={() => setClient(null)}>
              {t("bk.openToAll")}
            </Chip>
            {clients.map((c) => (
              <Chip key={c.id} active={client === c.id} onClick={() => setClient(c.id)}>
                {c.name || t("trn.noName")}
              </Chip>
            ))}
          </div>
        </>
      )}
      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {past ? t("bk.past") : weeks > 1 ? t("bk.summaryWeekly", { when: when(start), count: weeks }) : when(start)}
      </p>
      {error && (
        <p className="mt-2 text-sm text-warn" role="status">
          {error}
        </p>
      )}
      <Button className="mt-3 w-full" disabled={busy || past} onClick={() => void save()}>
        {client ? t("bk.bookSave") : t("bk.openSave")}
      </Button>
    </Sheet>
  );
}

// --- The client's side: free ---

/** Under Your coach: booked sessions (add to calendar, cancel) and Book a session from the open times. */
export function YourSessions({ sessions, coaches, onChange }: { sessions: Sessions; coaches: Person[]; onChange: () => void }) {
  const [picking, setPicking] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!sessions.booked.length && !sessions.open.length) return null;
  const who = (id: string) => coaches.find((c) => c.id === id)?.name || t("trn.noName");
  const many = new Set(sessions.open.map((s) => s.coachId)).size > 1;
  const act = async (what: () => Promise<unknown>, done: string, detail: string) => {
    setBusy(true);
    try {
      await what();
      haptic("success");
      track("feature", { name: "trainer", detail });
      setNote(done);
      onChange();
    } catch (e) {
      oops();
      setNote(trainerError(e));
      onChange();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mb-3">
      <p className="mb-2 px-1 text-sm font-semibold">{t("bk.yours")}</p>
      {sessions.booked.length > 0 && (
        <ul className="card mb-2 divide-y divide-line">
          {sessions.booked.map((s) => (
            <li key={s.id} className="px-4 py-3">
              <span className="block font-medium">{t("bk.withName", { name: who(s.coachId) })}</span>
              <span className="block text-sm">{dayLabel(s.start)}</span>
              <SlotLine s={s} />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  kind="ghost"
                  icon="calendar"
                  className="!px-3 !py-2 text-sm"
                  onClick={() =>
                    void sessionToCalendar(s, who(s.coachId)).then((ok) => {
                      haptic(ok ? "success" : "warning");
                      setNote(ok ? t("bk.inCalendar") : t("bk.noCalendar"));
                    })
                  }
                >
                  {t("bk.toCalendar")}
                </Button>
                <Button
                  kind="quiet"
                  disabled={busy}
                  className="!px-3 !py-2 text-sm"
                  onClick={() => void act(() => cancelSlot(s), t("bk.cancelled"), "slotUnbook")}
                >
                  {t("bk.cancel")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {sessions.open.length > 0 && (
        <Button kind="ghost" icon="calendar" className="w-full" onClick={() => setPicking(true)}>
          {t("bk.book")}
        </Button>
      )}
      {note && (
        <p className="mt-2 text-sm text-muted" role="status">
          {note}
        </p>
      )}
      <Sheet open={picking} onClose={() => setPicking(false)} title={t("bk.book")}>
        <div className="space-y-3">
          {byDay(sessions.open).map((d) => (
            <div key={d.day}>
              <p className="mb-1 text-sm font-semibold">{dayLabel(d.day)}</p>
              <ul className="space-y-2">
                {d.slots.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setPicking(false);
                        void act(() => bookSlot(s), t("bk.booked", { when: when(s.start) }), "slotBooked");
                        sound.done();
                      }}
                      className="press card flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="num block font-semibold">{clock(s.start)}</span>
                        <span className="block text-sm text-muted">
                          {[length(s.minutes), s.place, many ? who(s.coachId) : ""].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-accent">{t("bk.pick")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

/** Today: a session with a coach in the next day (loaded with the coach's notes, so nothing is fetched here). */
export function SessionToday() {
  const sessions = useCoachNotes((s) => s.sessions);
  const [now] = useState(() => Date.now());
  const s = nextSession(sessions, now);
  if (!s) return null;
  const c = sessions.find((x) => x.id === s.id);
  const today = new Date(s.start).toDateString() === new Date(now).toDateString();
  return (
    <div className="card card-tint mt-3 flex items-center gap-3 px-4 py-3" style={{ ["--tint" as string]: "var(--color-cyan)" }}>
      <Icon name="calendar" />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{t("bk.withName", { name: c?.coach || t("trn.noName") })}</span>
        <span className="block text-sm text-muted">
          {[today ? t("bk.todayAt", { time: clock(s.start) }) : t("bk.tomorrowAt", { time: clock(s.start) }), s.place]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
    </div>
  );
}
