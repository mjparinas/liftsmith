// A gym's class schedule (Melvin, 2026-11-17, docs/decisions/gyms.md "Class schedules"). The owner or the gym's staff
// post classes that repeat every week (spin on Mondays and Wednesdays at 6 PM), and can mark a date it won't run.
// Members see the week on the gym's page in the app and on the website. Times are the gym's own wall-clock time, so a
// class at 18:00 is at 18:00 wherever the reader is; nothing is converted between time zones. Shared by the app and
// the server, so both tidy a class the same way. No booking: gyms already take bookings in their own software.

export const CLASS_KINDS = [
  "strength",
  "hiit",
  "bootcamp",
  "cycling",
  "yoga",
  "pilates",
  "boxing",
  "dance",
  "mobility",
  "aqua",
  "cardio",
  "other",
] as const;
export type ClassKind = (typeof CLASS_KINDS)[number];

/** Lengths offered when adding a class, in minutes. */
export const CLASS_LENGTHS = [30, 45, 60, 75, 90] as const;

export const CLASS_LIMITS = {
  name: 60,
  coach: 60,
  room: 40,
  note: 160,
  /** Classes one gym can list. */
  perGym: 80,
  /** A class's length, in minutes. */
  minutes: [10, 240] as const,
  /** Dates one class can be marked as not running. */
  off: 20,
  /** Adds, edits and removals a gym can make a day. */
  changesPerDay: 200,
};

/** A class on the gym's weekly schedule. */
export interface GymClass {
  id: string;
  name: string;
  kind: ClassKind;
  /** The weekdays it runs, Sunday = 0, in order. */
  days: number[];
  /** Its start on the gym's clock, "18:30". */
  start: string;
  minutes: number;
  /** Who leads it, if the gym says. */
  coach: string;
  /** Where in the gym ("Studio 2"), if the gym says. */
  room: string;
  /** A short line: level, what to bring, how to book. */
  note: string;
  /** Dates it won't run ("2026-12-24"), in order. */
  off: string[];
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const isClassKind = (x: unknown): x is ClassKind => typeof x === "string" && (CLASS_KINDS as readonly string[]).includes(x);
export const isClassTime = (x: unknown): x is string => typeof x === "string" && TIME_RE.test(x);
export const isDayKey = (x: unknown): x is string => typeof x === "string" && DAY_RE.test(x) && !Number.isNaN(Date.parse(`${x}T12:00:00Z`));

/** Weekdays as saved ("1,3") or sent (a list): known days, in order, without repeats. */
export function cleanDays(v: unknown): number[] {
  const list = typeof v === "string" ? v.split(",") : Array.isArray(v) ? v : [];
  const want = new Set(list.map((x) => Number(String(x).trim())));
  return [0, 1, 2, 3, 4, 5, 6].filter((d) => want.has(d));
}

/** Dates off as saved ("2026-12-24,2026-12-31") or sent: real dates, in order, without repeats, at most `CLASS_LIMITS.off`. */
export function cleanOff(v: unknown): string[] {
  const list = typeof v === "string" ? v.split(",") : Array.isArray(v) ? v : [];
  return [...new Set(list.map((x) => String(x).trim()).filter(isDayKey))].sort().slice(-CLASS_LIMITS.off);
}

/** A length in whole minutes within the limits, or null. */
export function cleanMinutes(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const m = Math.round(n);
  return m >= CLASS_LIMITS.minutes[0] && m <= CLASS_LIMITS.minutes[1] ? m : null;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** A date's key on this device's calendar ("2026-11-17"). */
export const dayKeyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** "18:30" plus 45 minutes → "19:15" (past midnight wraps, "00:15"). */
export function endTime(start: string, minutes: number): string {
  const end = (minutesOf(start) + minutes) % (24 * 60);
  return `${pad(Math.floor(end / 60))}:${pad(end % 60)}`;
}

/** Classes in the order a timetable lists them: by start time, then name. */
export const byStart = (a: GymClass, b: GymClass) => minutesOf(a.start) - minutesOf(b.start) || a.name.localeCompare(b.name);

export interface ScheduleDay {
  /** "2026-11-17" on the reader's calendar. */
  key: string;
  weekday: number;
  classes: { cls: GymClass; off: boolean }[];
}

/**
 * The next `count` days from `now` (today first), each with its classes in start order and whether the gym marked
 * that date off. Days without classes are left in, so the week reads in order; callers can drop empty ones.
 */
export function schedule(classes: readonly GymClass[], now: number | Date, count = 7): ScheduleDay[] {
  const base = new Date(now);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i, 12);
    const key = dayKeyOf(d);
    const weekday = d.getDay();
    return {
      key,
      weekday,
      classes: classes
        .filter((c) => c.days.includes(weekday))
        .sort(byStart)
        .map((cls) => ({ cls, off: cls.off.includes(key) })),
    };
  });
}

/** The next `count` dates the class runs on from `now` (today included), skipping none: for marking dates off. */
export function nextDates(cls: Pick<GymClass, "days">, now: number | Date, count = 8): string[] {
  if (!cls.days.length) return [];
  const base = new Date(now);
  const out: string[] = [];
  for (let i = 0; out.length < count && i < 7 * count; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i, 12);
    if (cls.days.includes(d.getDay())) out.push(dayKeyOf(d));
  }
  return out;
}

/**
 * The next time the class starts after `now` on this device's clock (the gym's clock, for a member nearby), skipping
 * dates marked off; null when it runs on no day.
 */
export function nextStart(cls: Pick<GymClass, "days" | "start" | "off">, now: number): number | null {
  if (!cls.days.length) return null;
  const at = minutesOf(cls.start);
  const base = new Date(now);
  for (let i = 0; i < 7 * (CLASS_LIMITS.off + 2); i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i, Math.floor(at / 60), at % 60);
    if (d.getTime() > now && cls.days.includes(d.getDay()) && !cls.off.includes(dayKeyOf(d))) return d.getTime();
  }
  return null;
}

/** The days of the week in a timetable's order: Monday first, or Sunday first when the reader's week starts then. */
export const weekOrder = (sundayFirst = false) => (sundayFirst ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0]);

/** Each weekday with its classes, in start order, for a whole-week timetable (the website). Empty days are left out. */
export function timetable(classes: readonly GymClass[], sundayFirst = false): { weekday: number; classes: GymClass[] }[] {
  return weekOrder(sundayFirst)
    .map((weekday) => ({ weekday, classes: classes.filter((c) => c.days.includes(weekday)).sort(byStart) }))
    .filter((d) => d.classes.length);
}

/** A class as saved or sent, tidied, without checking its words (the server checks those). Null when it can't be one. */
export function cleanClass(v: unknown): Omit<GymClass, "id"> | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  const line = (x: unknown, max: number) =>
    typeof x === "string"
      ? x
          .replace(/[\u0000-\u001f\u007f]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, max)
          .trim()
      : "";
  const name = line(r.name, CLASS_LIMITS.name);
  const days = cleanDays(r.days);
  const minutes = cleanMinutes(r.minutes);
  if (!name || !days.length || !isClassTime(r.start) || minutes === null) return null;
  return {
    name,
    kind: isClassKind(r.kind) ? r.kind : "other",
    days,
    start: r.start,
    minutes,
    coach: line(r.coach, CLASS_LIMITS.coach),
    room: line(r.room, CLASS_LIMITS.room),
    note: line(r.note, CLASS_LIMITS.note),
    off: cleanOff(r.off),
  };
}
