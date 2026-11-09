"use client";
import { calendarNative, defaultPrefs, downloadIcs, removeTrainingDays, requestCalendar, saveTrainingDays, trainingIcs, WEEKDAYS } from "@/lib/calendar";
import { useApp } from "@/lib/store";
import type { CalendarPrefs } from "@/lib/types";
import { useState } from "react";
import { t, weekday } from "@/lib/i18n";
import { Button, Chip, Section } from "./ui";

/**
 * Settings › Calendar. Writing training days and reading busy times are separate opt-ins. Busy times are
 * only start and end, read on the phone, never sent anywhere.
 */
export function CalendarSettings() {
  const { profile, setProfile } = useApp();
  const prefs = profile.calendar ?? defaultPrefs(profile.daysPerWeek);
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
    <Section title={t("cal.title")}>
      <div className="card space-y-4 p-4">
        <div>
          <p className="text-sm text-muted" id="cal-days">{t("cal.days")}</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="cal-days">
            {WEEKDAYS.map((d, i) => (
              <Chip key={d} active={prefs.days.includes(i)} onClick={() => update({ days: prefs.days.includes(i) ? prefs.days.filter((x) => x !== i) : [...prefs.days, i].sort() })}>
                {weekday(i)}
              </Chip>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted">{t("cal.time")}</span>
          <input type="time" value={prefs.time} onChange={(e) => e.target.value && update({ time: e.target.value })} className="num rounded-xl border border-line bg-surface px-3 py-2" />
        </label>
        <Button kind="ghost" className="w-full" disabled={busy || !prefs.days.length} onClick={() => void write()}>
          {t(!native ? "cal.download" : prefs.write ? "cal.update" : "cal.add")}
        </Button>
        {native && prefs.write && (
          <Button kind="quiet" className="w-full" onClick={() => void remove()}>{t("cal.remove")}</Button>
        )}
        {native && (
          <div className="border-t border-line pt-4">
            <p className="text-sm">{t("cal.fit")}</p>
            <p className="mt-1 text-xs text-muted">{t("cal.fitNote")}</p>
            <Button kind="ghost" className="mt-3 w-full" onClick={() => void toggleRead()}>{t(prefs.read ? "cal.onOff" : "cal.turnOn")}</Button>
          </div>
        )}
        {status && <p className="text-sm text-muted" role="status">{status}</p>}
      </div>
    </Section>
  );
}
