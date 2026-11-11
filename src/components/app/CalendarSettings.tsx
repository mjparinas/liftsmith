"use client";

import { useState } from "react";

import {
  calendarNative,
  defaultPrefs,
  downloadIcs,
  removeTrainingDays,
  requestCalendar,
  saveTrainingDays,
  trainingDays,
  trainingIcs,
  WEEKDAYS,
} from "@/lib/calendar";
import { t, weekday } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import type { CalendarPrefs } from "@/lib/types";

import { TimeField } from "./TimeDial";
import { Button, Chip, Section } from "./ui";

/**
 * Settings › Training › Schedule. The weekday chips are the days-a-week goal too (one control, Melvin
 * approved 2026-11-10): picking days sets `daysPerWeek` to how many are picked, at least one. Writing
 * training days to the calendar and reading busy times are separate opt-ins. Busy times are only start
 * and end, read on the phone, never sent anywhere.
 */
export function CalendarSettings() {
  const { profile, setProfile } = useApp();
  const prefs = { ...(profile.calendar ?? defaultPrefs(profile.daysPerWeek)), days: trainingDays(profile) };
  const native = calendarNative();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const update = (p: Partial<CalendarPrefs>) => setProfile({ calendar: { ...prefs, ...p } });

  const write = async () => {
    setBusy(true);
    try {
      if (!native) {
        downloadIcs(trainingIcs(prefs, profile.minutes, Date.now()));
        setStatus(t("cal.downloaded"));
        return;
      }
      if (!(await requestCalendar())) {
        setStatus(t("cal.denied"));
        return;
      }
      const ok = await saveTrainingDays(prefs, profile.minutes);
      if (ok) update({ write: true });
      setStatus(t(ok ? "cal.saved" : "cal.failed"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    await removeTrainingDays();
    update({ write: false });
    setStatus(t("cal.removed"));
  };

  const toggleRead = async () => {
    if (prefs.read) return update({ read: false });
    if (await requestCalendar()) update({ read: true });
    else setStatus(t("cal.denied"));
  };

  return (
    <Section title={t("settings.schedule")}>
      <div className="card space-y-4 p-4">
        <div>
          <p className="text-sm text-muted" id="cal-days">
            {t("cal.days")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="cal-days">
            {WEEKDAYS.map((d, i) => (
              <Chip
                key={d}
                active={prefs.days.includes(i)}
                onClick={() => {
                  const days = prefs.days.includes(i) ? prefs.days.filter((x) => x !== i) : [...prefs.days, i].sort();
                  if (!days.length) return; // At least one training day.
                  setProfile({ calendar: { ...prefs, days }, daysPerWeek: days.length });
                }}
              >
                {weekday(i)}
              </Chip>
            ))}
          </div>
        </div>
        <TimeField label={t("cal.time")} value={prefs.time} onChange={(time) => update({ time })} />
        <Button kind="ghost" className="w-full" disabled={busy || !prefs.days.length} onClick={() => void write()}>
          {t(!native ? "cal.download" : prefs.write ? "cal.update" : "cal.add")}
        </Button>
        {native && prefs.write && (
          <Button kind="quiet" className="w-full" onClick={() => void remove()}>
            {t("cal.remove")}
          </Button>
        )}
        {native && (
          <div className="border-t border-line pt-4">
            <p className="text-sm">{t("cal.fit")}</p>
            <p className="mt-1 text-xs text-muted">{t("cal.fitNote")}</p>
            <Button kind="ghost" className="mt-3 w-full" onClick={() => void toggleRead()}>
              {t(prefs.read ? "cal.onOff" : "cal.turnOn")}
            </Button>
          </div>
        )}
        {status && (
          <p className="text-sm text-muted" role="status">
            {status}
          </p>
        )}
      </div>
    </Section>
  );
}
