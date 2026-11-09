"use client";
import { calendarNative, defaultPrefs, downloadIcs, removeTrainingDays, requestCalendar, saveTrainingDays, trainingIcs, WEEKDAYS } from "@/lib/calendar";
import { useApp } from "@/lib/store";
import type { CalendarPrefs } from "@/lib/types";
import { useState } from "react";
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
        setStatus("Calendar file downloaded. Open it to add your training days.");
        return;
      }
      if (!(await requestCalendar())) {
        setStatus("Calendar access is off. You can allow it in your phone's settings.");
        return;
      }
      const ok = await saveTrainingDays(prefs, profile.minutes);
      if (ok) update({ write: true });
      setStatus(ok ? "Your training days are in your calendar." : "That didn't work. Check that this phone has a calendar you can add to.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    await removeTrainingDays();
    update({ write: false });
    setStatus("Removed from your calendar.");
  };

  const toggleRead = async () => {
    if (prefs.read) return update({ read: false });
    if (await requestCalendar()) update({ read: true });
    else setStatus("Calendar access is off. You can allow it in your phone's settings.");
  };

  return (
    <Section title="Calendar">
      <div className="card space-y-4 p-4">
        <div>
          <p className="text-sm text-muted" id="cal-days">Training days</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="cal-days">
            {WEEKDAYS.map((d, i) => (
              <Chip key={d} active={prefs.days.includes(i)} onClick={() => update({ days: prefs.days.includes(i) ? prefs.days.filter((x) => x !== i) : [...prefs.days, i].sort() })}>
                {d}
              </Chip>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted">Time</span>
          <input type="time" value={prefs.time} onChange={(e) => e.target.value && update({ time: e.target.value })} className="num rounded-xl border border-line bg-surface px-3 py-2" />
        </label>
        <Button kind="ghost" className="w-full" disabled={busy || !prefs.days.length} onClick={() => void write()}>
          {!native ? "Download calendar file" : prefs.write ? "Update my calendar" : "Add to my calendar"}
        </Button>
        {native && prefs.write && (
          <Button kind="quiet" className="w-full" onClick={() => void remove()}>Remove from my calendar</Button>
        )}
        {native && (
          <div className="border-t border-line pt-4">
            <p className="text-sm">Fit workouts around my calendar</p>
            <p className="mt-1 text-xs text-muted">When something&apos;s coming up soon, Today offers a shorter workout that fits. Liftsmith only sees when you&apos;re busy, never what the events are, and it stays on this phone.</p>
            <Button kind="ghost" className="mt-3 w-full" onClick={() => void toggleRead()}>{prefs.read ? "On · Turn off" : "Turn on"}</Button>
          </div>
        )}
        {status && <p className="text-sm text-muted" role="status">{status}</p>}
      </div>
    </Section>
  );
}
