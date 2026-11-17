"use client";

import { useState } from "react";

import { addEvent } from "@/lib/calendar";
import { weekStartDay } from "@/lib/derive";
import {
  CLASS_KINDS,
  CLASS_LENGTHS,
  CLASS_LIMITS,
  dayKeyOf,
  endTime,
  nextDates,
  nextStart,
  schedule,
  weekOrder,
  type ClassKind,
  type GymClass,
} from "@/lib/gymClasses";
import { deleteClass, saveClass } from "@/lib/gymExtrasApi";
import { clockTime, date, list, t, weekday } from "@/lib/i18n";
import { haptic, oops } from "@/lib/juice";
import { useNow } from "@/lib/useNow";

import { TimeField } from "./TimeDial";
import { Button, Chip, Section, Sheet } from "./ui";

// A gym's class schedule in the app (Melvin, 2026-11-17; shared rules in src/lib/gymClasses.ts, server in
// src/server/gymClasses.ts, docs/decisions/gyms.md "Class schedules"). Members see the next seven days on the gym's
// page, and tapping a class opens its details with Add to my calendar (the phone's calendar on Android and iOS, a
// .ics file on the web, calendar.ts). The owner and staff add and change classes on their gym's page (GymEdit.tsx).

const input = "card w-full px-4 py-3";

const clock = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return clockTime(h ?? 0, m ?? 0);
};
const span = (c: Pick<GymClass, "start" | "minutes">) => `${clock(c.start)}–${clock(endTime(c.start, c.minutes))}`;
const dayLabel = (key: string) => date(new Date(`${key}T12:00:00`), { weekday: "short", month: "short", day: "numeric" });
/** "Mon, Wed and Fri" in the gym's week order. */
const daysText = (days: number[], sundayFirst: boolean) =>
  list(
    weekOrder(sundayFirst)
      .filter((d) => days.includes(d))
      .map((d) => weekday(d)),
  );

/** The next seven days of classes on a gym's page; nothing when the gym lists none. */
export function ClassSchedule({ classes, gymName }: { classes: GymClass[] | undefined; gymName: string }) {
  const [open, setOpen] = useState<GymClass | null>(null);
  const now = useNow();
  const sundayFirst = weekStartDay() === 0;
  if (!classes?.length) return null;
  const days = schedule(classes, now).filter((d) => d.classes.length);
  return (
    <Section title={t("gp.classesTitle")} icon="calendar">
      <p className="mb-2 px-1 text-sm text-muted">{t("gp.classesLocal")}</p>
      <div className="grid gap-3">
        {days.map((d) => (
          <div key={d.key} className="card overflow-hidden">
            <h3 className="px-4 pt-3 text-sm font-semibold">{d.key === dayKeyOf(new Date(now)) ? t("gp.today") : dayLabel(d.key)}</h3>
            <ul className="divide-y divide-line">
              {d.classes.map(({ cls, off }) => (
                <li key={cls.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(cls)}
                    className="press flex min-h-11 w-full items-start gap-3 px-4 py-3 text-left"
                  >
                    <span className={`num w-28 shrink-0 text-sm ${off ? "text-faint line-through" : "text-muted"}`}>{span(cls)}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block font-semibold break-words ${off ? "text-faint line-through" : ""}`}>{cls.name}</span>
                      <span className="block text-sm text-muted">
                        {off ? t("gp.classOff") : [cls.coach, cls.room].filter(Boolean).join(" · ") || t(`gp.classKind.${cls.kind}`)}
                      </span>
                    </span>
                    <span aria-hidden className="text-muted">
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {open && <ClassSheet cls={open} gymName={gymName} sundayFirst={sundayFirst} onClose={() => setOpen(null)} />}
    </Section>
  );
}

function ClassSheet({ cls, gymName, sundayFirst, onClose }: { cls: GymClass; gymName: string; sundayFirst: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<string | null>(null);
  const now = useNow();
  const next = nextStart(cls, now);
  const offSoon = cls.off.filter((d) => nextDates(cls, now, 8).includes(d));
  const add = async () => {
    if (next === null) return;
    const ok = await addEvent({
      id: `class-${cls.id}-${next}`,
      start: next,
      minutes: cls.minutes,
      title: cls.name,
      notes: [cls.coach && t("gp.classWith", { name: cls.coach }), cls.room, cls.note].filter(Boolean).join("\n"),
      place: gymName,
    });
    if (ok) haptic("success");
    else oops();
    setStatus(t(ok ? "gp.classAdded" : "gp.classAddFailed"));
  };
  return (
    <Sheet open onClose={onClose} title={cls.name}>
      <dl className="grid gap-2 text-sm">
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt className="text-muted">{t("gp.classWhen")}</dt>
          <dd className="num text-right">
            {daysText(cls.days, sundayFirst)}, {span(cls)}
          </dd>
        </div>
        <div className="flex flex-wrap justify-between gap-x-3">
          <dt className="text-muted">{t("gp.classType")}</dt>
          <dd>{t(`gp.classKind.${cls.kind}`)}</dd>
        </div>
        {cls.coach && (
          <div className="flex flex-wrap justify-between gap-x-3">
            <dt className="text-muted">{t("gp.classCoach")}</dt>
            <dd className="break-words">{cls.coach}</dd>
          </div>
        )}
        {cls.room && (
          <div className="flex flex-wrap justify-between gap-x-3">
            <dt className="text-muted">{t("gp.classRoom")}</dt>
            <dd className="break-words">{cls.room}</dd>
          </div>
        )}
      </dl>
      {cls.note && <p className="mt-3 text-sm break-words">{cls.note}</p>}
      {offSoon.length > 0 && <p className="mt-3 text-sm text-warn">{t("gp.classOffOn", { dates: list(offSoon.map(dayLabel)) })}</p>}
      <p className="mt-3 text-xs text-muted">{t("gp.classBook")}</p>
      {next !== null && (
        <Button icon="calendar" className="mt-4 w-full" onClick={() => void add()}>
          {t("gp.classCalendar")}
        </Button>
      )}
      {next !== null && (
        <p className="mt-2 text-xs text-muted">
          {t("gp.classNext", { when: date(next, { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) })}
        </p>
      )}
      {status && (
        <p className="mt-2 text-sm text-muted" role="status">
          {status}
        </p>
      )}
    </Sheet>
  );
}

// --- The owner's side ---

type Draft = Omit<GymClass, "id"> & { id?: string };
const blank = (): Draft => ({ name: "", kind: "strength", days: [], start: "18:00", minutes: 60, coach: "", room: "", note: "", off: [] });

/** The owner's and staff's class list, with Add a class; each class opens the same editor. */
export function OwnerClassesSection({ place, classes, onChange }: { place: string; classes: GymClass[] | null; onChange: () => void }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const sundayFirst = weekStartDay() === 0;
  const full = (classes?.length ?? 0) >= CLASS_LIMITS.perGym;
  return (
    <Section title={t("gp.classesTitle")} icon="calendar">
      <p className="mb-2 text-sm text-muted">{t("gym.cls.note")}</p>
      {classes && classes.length > 0 && (
        <ul className="card mb-3 divide-y divide-line">
          {classes.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setDraft({ ...c })}
                className="press flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold break-words">{c.name}</span>
                  <span className="num block text-sm text-muted">
                    {daysText(c.days, sundayFirst)}, {span(c)}
                  </span>
                </span>
                <span aria-hidden className="text-muted">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {classes && !classes.length && <p className="mb-2 text-sm text-muted">{t("gym.cls.none")}</p>}
      <Button kind="ghost" icon="plus" className="w-full" disabled={!classes || full} onClick={() => setDraft(blank())}>
        {t("gym.cls.add")}
      </Button>
      {full && <p className="mt-2 text-sm text-muted">{t("gym.cls.full")}</p>}
      {draft && (
        <ClassEditor
          place={place}
          draft={draft}
          sundayFirst={sundayFirst}
          onClose={() => setDraft(null)}
          onSaved={() => {
            setDraft(null);
            onChange();
          }}
        />
      )}
    </Section>
  );
}

function ClassEditor({
  place,
  draft: start,
  sundayFirst,
  onClose,
  onSaved,
}: {
  place: string;
  draft: Draft;
  sundayFirst: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [d, setD] = useState<Draft>(start);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());
  const set = (x: Partial<Draft>) => setD((v) => ({ ...v, ...x }));
  const lengths = CLASS_LENGTHS.includes(d.minutes as (typeof CLASS_LENGTHS)[number])
    ? [...CLASS_LENGTHS]
    : [...CLASS_LENGTHS, d.minutes].sort((a, b) => a - b);
  const dates = nextDates(d, now, 8);
  const pickKind = (k: ClassKind) =>
    // A class with no name yet takes the type's name, so most classes need no typing.
    set({ kind: k, name: !d.name.trim() || CLASS_KINDS.some((x) => d.name === t(`gp.classKind.${x}`)) ? t(`gp.classKind.${k}`) : d.name });
  const save = async () => {
    if (busy || !d.name.trim() || !d.days.length) return;
    setBusy(true);
    const r = await saveClass(place, { ...d, name: d.name.trim(), coach: d.coach.trim(), room: d.room.trim(), note: d.note.trim() });
    setBusy(false);
    if ("error" in r) {
      oops();
      return setStatus(
        t(
          r.error === "words" || r.error === "link"
            ? "gym.claim.err.words"
            : r.error === "slow"
              ? "gym.cls.slow"
              : r.error === "full"
                ? "gym.cls.full"
                : r.error === "offline"
                  ? "gym.near.offline"
                  : "gym.near.failed",
          { count: CLASS_LIMITS.perGym },
        ),
      );
    }
    haptic("success");
    onSaved();
  };
  const remove = async () => {
    if (!d.id || busy) return;
    setBusy(true);
    const ok = await deleteClass(place, d.id);
    setBusy(false);
    if (!ok) {
      oops();
      return setStatus(t("gym.near.failed"));
    }
    haptic("toggle");
    onSaved();
  };
  return (
    <Sheet open onClose={onClose} title={d.id ? t("gym.cls.edit") : t("gym.cls.add")}>
      <p className="mb-2 text-sm text-muted">{t("gym.cls.type")}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("gym.cls.type")}>
        {CLASS_KINDS.map((k) => (
          <Chip key={k} active={d.kind === k} onClick={() => pickKind(k)}>
            {t(`gp.classKind.${k}`)}
          </Chip>
        ))}
      </div>
      <label htmlFor="gc-name" className="mt-4 mb-1 block text-sm text-muted">
        {t("gym.cls.name")}
      </label>
      <input id="gc-name" maxLength={CLASS_LIMITS.name} value={d.name} onChange={(e) => set({ name: e.target.value })} className={input} />
      <p className="mt-4 mb-2 text-sm text-muted">{t("gym.cls.days")}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("gym.cls.days")}>
        {weekOrder(sundayFirst).map((w) => (
          <Chip
            key={w}
            active={d.days.includes(w)}
            onClick={() => set({ days: d.days.includes(w) ? d.days.filter((x) => x !== w) : [...d.days, w].sort((a, b) => a - b) })}
          >
            {weekday(w)}
          </Chip>
        ))}
      </div>
      <div className="card mt-4 px-4 py-3">
        <TimeField label={t("gym.cls.start")} value={d.start} onChange={(v) => set({ start: v })} />
      </div>
      <p className="mt-4 mb-2 text-sm text-muted">{t("gym.cls.length")}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("gym.cls.length")}>
        {lengths.map((m) => (
          <Chip key={m} active={d.minutes === m} onClick={() => set({ minutes: m })}>
            {t("bk.minutes", { count: m })}
          </Chip>
        ))}
      </div>
      <label htmlFor="gc-coach" className="mt-4 mb-1 block text-sm text-muted">
        {t("gym.cls.coach")}
      </label>
      <input
        id="gc-coach"
        maxLength={CLASS_LIMITS.coach}
        value={d.coach}
        onChange={(e) => set({ coach: e.target.value })}
        className={input}
      />
      <label htmlFor="gc-room" className="mt-4 mb-1 block text-sm text-muted">
        {t("gym.cls.room")}
      </label>
      <input id="gc-room" maxLength={CLASS_LIMITS.room} value={d.room} onChange={(e) => set({ room: e.target.value })} className={input} />
      <label htmlFor="gc-note" className="mt-4 mb-1 block text-sm text-muted">
        {t("gym.cls.noteLabel")}
      </label>
      <input
        id="gc-note"
        maxLength={CLASS_LIMITS.note}
        placeholder={t("gym.cls.notePlaceholder")}
        value={d.note}
        onChange={(e) => set({ note: e.target.value })}
        className={input}
      />
      {dates.length > 0 && (
        <>
          <p className="mt-4 mb-2 text-sm text-muted">{t("gym.cls.off")}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("gym.cls.off")}>
            {dates.map((k) => (
              <Chip
                key={k}
                active={d.off.includes(k)}
                onClick={() => set({ off: d.off.includes(k) ? d.off.filter((x) => x !== k) : [...d.off, k].sort() })}
              >
                {dayLabel(k)}
              </Chip>
            ))}
          </div>
        </>
      )}
      <Button className="mt-5 w-full" disabled={busy || !d.name.trim() || !d.days.length} onClick={() => void save()}>
        {t("gym.cls.save")}
      </Button>
      {!d.days.length && <p className="mt-2 text-xs text-muted">{t("gym.cls.pickDays")}</p>}
      {d.id && (
        <Button kind="danger" icon="trash" className="mt-3 w-full" disabled={busy} onClick={() => void remove()}>
          {t("gym.cls.remove")}
        </Button>
      )}
      {status && (
        <p className="mt-2 text-sm text-muted" role="status">
          {status}
        </p>
      )}
    </Sheet>
  );
}
