// Booking and scheduling sessions on the phone (Melvin, 2026-11-13; server: src/server/coachBooking.ts). A coach's open
// and booked times, a client's booked sessions and the open times they can book, and the calls.
import { api, AuthError, readAccount } from "./auth";
import { addEvent } from "./calendar";
import { date, t } from "./i18n";

export interface Slot {
  id: string;
  coachId: string;
  start: number;
  minutes: number;
  place: string;
  clientId: string | null;
  bookedAt: number | null;
}
export interface Sessions {
  booked: Slot[];
  open: Slot[];
}

/** Session lengths offered when opening times, in minutes. */
export const LENGTHS = [30, 45, 60, 90];
/** "Every week" choices: 1 is once. */
export const REPEATS = [1, 4, 8, 12];
/** How many days ahead the day chips go. */
export const DAYS_AHEAD = 21;

function token(): string {
  const a = readAccount();
  if (!a) throw new AuthError("signedOut", 401);
  return a.token;
}
const post = <T>(body: Record<string, unknown>) => api<T>("/api/coach/", { token: token(), body });

/** The time as this phone shows it, for lists and for the other side's notification. */
export const when = (ms: number) => date(ms, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
export const clock = (ms: number) => date(ms, { hour: "numeric", minute: "2-digit" });

export const addSlots = async (slot: { start: number; minutes: number; place: string; weeks: number; client?: string }) =>
  (await post<{ slots: Slot[] }>({ action: "slots", slot: { ...slot, label: when(slot.start) } })).slots;
export const bookSlot = async (s: Slot) => (await post<{ slot: Slot }>({ action: "book", id: s.id, label: when(s.start) })).slot;
export const cancelSlot = async (s: Slot) => void (await post({ action: "cancelSlot", id: s.id, label: when(s.start) }));

/** The start of a day `i` days from `now`, at `time` ("18:30") on this phone's clock. */
export function startAt(now: number, i: number, time: string): number {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(now);
  d.setDate(d.getDate() + i);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.getTime();
}

/** Slots grouped by the day they start on (this phone's calendar), in order. */
export function byDay(slots: readonly Slot[]): { day: number; slots: Slot[] }[] {
  const out: { day: number; slots: Slot[] }[] = [];
  for (const s of [...slots].sort((a, b) => a.start - b.start)) {
    const d = new Date(s.start);
    d.setHours(0, 0, 0, 0);
    const last = out.at(-1);
    if (last?.day === d.getTime()) last.slots.push(s);
    else out.push({ day: d.getTime(), slots: [s] });
  }
  return out;
}

/** The booked session to mention on Today: one starting within the next 24 hours, or that started in the last hour. */
export function nextSession(booked: readonly Slot[], now: number): Slot | null {
  return [...booked].sort((a, b) => a.start - b.start).find((s) => s.start > now - 3_600_000 && s.start < now + 86_400_000) ?? null;
}

/** Puts a booked session in the phone's calendar (or downloads a .ics on the web). */
export const sessionToCalendar = (s: Slot, who: string) =>
  addEvent({
    id: s.id,
    start: s.start,
    minutes: s.minutes,
    place: s.place,
    title: t("bk.calTitle", { name: who }),
    notes: t("bk.calNote"),
  });
