"use client";

import { isNative } from "./juice";
import type { CalendarPrefs, Profile } from "./types";

export type { CalendarPrefs };

// Calendar (Melvin, 2026-11-09, roadmap MVP+2). Two separate opt-ins:
//  - Write: the lifter's training days go into their calendar as one weekly repeating event per
//    schedule. Native apps write to the default calendar (CalendarPlugin on Android and iOS); the web
//    build downloads a .ics file instead.
//  - Read: when the lifter allows it, Today looks at when they're busy in the next few hours and offers
//    a shorter workout that fits. Only start and end times are read, never titles, attendees or places,
//    and nothing leaves the phone.

export interface Busy {
  start: number;
  end: number;
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const ICS_DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;
const MIN = 60_000;

/** Spread the days-per-week goal across the week (3 → Mon, Wed, Fri). */
export function defaultDays(perWeek: number): number[] {
  const table: Record<number, number[]> = {
    1: [1],
    2: [1, 4],
    3: [1, 3, 5],
    4: [1, 2, 4, 5],
    5: [1, 2, 3, 4, 5],
    6: [1, 2, 3, 4, 5, 6],
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  return table[Math.min(7, Math.max(1, Math.round(perWeek)))];
}

export function defaultPrefs(perWeek: number): CalendarPrefs {
  return { days: defaultDays(perWeek), time: "18:00", write: false, read: false };
}

/**
 * The lifter's training days. Settings › Training sets the days and the days-a-week goal together (one
 * control, Melvin approved 2026-11-10), so they agree; if they don't (setup was run again with a new
 * days-a-week), the goal wins and the days are spread out again.
 */
export function trainingDays(profile: Pick<Profile, "calendar" | "daysPerWeek">): number[] {
  const days = profile.calendar?.days;
  return days?.length && days.length === profile.daysPerWeek ? days : defaultDays(profile.daysPerWeek);
}

/** The next start of a training session at or after `from`, in local time. */
export function nextStart(days: number[], time: string, from: number): number | null {
  if (!days.length) return null;
  const [h, m] = time.split(":").map(Number);
  for (let i = 0; i < 8; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    d.setHours(h, m, 0, 0);
    if (days.includes(d.getDay()) && d.getTime() >= from) return d.getTime();
  }
  return null;
}

const pad = (n: number) => String(n).padStart(2, "0");
const icsLocal = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
};
const icsUtc = (t: number) =>
  new Date(t)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

/** A calendar file with one weekly repeating event (floating local time, so it follows the lifter's zone). */
export function trainingIcs(p: Pick<CalendarPrefs, "days" | "time">, minutes: number, now: number, title = "Liftsmith workout"): string {
  const start = nextStart(p.days, p.time, now) ?? now;
  const byday = [...p.days]
    .sort()
    .map((d) => ICS_DAYS[d])
    .join(",");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Liftsmith//Training days//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:training-${now}@getliftsmith.com`,
    `DTSTAMP:${icsUtc(now)}`,
    `DTSTART:${icsLocal(start)}`,
    `DTEND:${icsLocal(start + minutes * MIN)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${byday}`,
    `SUMMARY:${title}`,
    "DESCRIPTION:Open Liftsmith to start today's workout.",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/**
 * How long the lifter is free from now until the next busy time, capped at `horizon` minutes. Zero when
 * they're busy right now.
 */
export function freeMinutes(busy: readonly Busy[], now: number, horizon = 180): { minutes: number; until: number | null } {
  if (busy.some((b) => b.start <= now && b.end > now)) return { minutes: 0, until: now };
  const next = busy.filter((b) => b.start > now).sort((a, b) => a.start - b.start)[0];
  if (!next) return { minutes: horizon, until: null };
  return { minutes: Math.min(horizon, Math.floor((next.start - now) / MIN)), until: next.start };
}

/**
 * The workout length to offer when the plan doesn't fit before the next busy time: the free time less
 * 10 minutes to change and get there, rounded down to 5 minutes, at least 15. Null when the plan already
 * fits or nothing useful does.
 */
export function fitLength(free: number, planned: number): number | null {
  if (free >= planned + 10) return null;
  const fit = Math.floor((free - 10) / 5) * 5;
  return fit >= 15 && fit < planned ? fit : null;
}

// Native side: CalendarPlugin.java (Android, CalendarContract) and CalendarPlugin.swift (iOS, EventKit).
type Plugin = {
  requestAccess(): Promise<{ granted: boolean }>;
  saveTrainingDays(o: { days: number[]; hour: number; minute: number; minutes: number; title: string }): Promise<{ saved: boolean }>;
  removeTrainingDays(): Promise<void>;
  busy(o: { from: number; to: number }): Promise<{ busy: Busy[] }>;
};
const plugin = (): Plugin | undefined =>
  typeof window !== "undefined"
    ? (window as unknown as { Capacitor?: { Plugins?: { Calendar?: Plugin } } }).Capacitor?.Plugins?.Calendar
    : undefined;

export const calendarNative = () => isNative() && !!plugin();

export async function requestCalendar(): Promise<boolean> {
  const p = plugin();
  if (!p || !isNative()) return false;
  try {
    return (await p.requestAccess()).granted;
  } catch {
    return false;
  }
}

/** Writes (or rewrites) the weekly training event. Replaces the one written before. */
export async function saveTrainingDays(prefs: Pick<CalendarPrefs, "days" | "time">, minutes: number): Promise<boolean> {
  const p = plugin();
  if (!p || !isNative() || !prefs.days.length) return false;
  const [hour, minute] = prefs.time.split(":").map(Number);
  try {
    return (await p.saveTrainingDays({ days: prefs.days, hour, minute, minutes, title: "Liftsmith workout" })).saved;
  } catch {
    return false;
  }
}

export async function removeTrainingDays(): Promise<void> {
  const p = plugin();
  if (p && isNative()) await p.removeTrainingDays().catch(() => {});
}

/** Busy times (start and end only) between now and `hours` from now, leaving out Liftsmith's own event. */
export async function busyTimes(now: number, hours = 3): Promise<Busy[]> {
  const p = plugin();
  if (!p || !isNative()) return [];
  try {
    return (await p.busy({ from: Math.round(now), to: Math.round(now + hours * 3_600_000) })).busy;
  } catch {
    return [];
  }
}

/** Web fallback for writing: download the .ics file. */
export function downloadIcs(ics: string) {
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "liftsmith-training.ics" });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
