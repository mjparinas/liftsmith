// While billing isn't live everyone has Pro, so the planner sends no Pro offers (billing.ts).
import { billingLive as billingIsLive } from "./billing";

// Reminders and lifecycle messages (Melvin, 2026-11-09): workout reminders on training days, a nudge
// after a missed training day, streak alerts, comebacks, milestones and Pro offers, by push
// notification and by email. One pure planner serves both: the phone schedules local notifications
// from it (works offline, no server), and the server's daily job schedules emails from the same rules.
//
// The planner only needs a few numbers, never workout or health data: training days and time, the
// time zone, when the last and first workouts were, how many days this week had a workout, and the
// streak. Those are the same fields the email subscription sends to the server.
//
// Rules we hold (AGENTS.md, "Reminders and lifecycle messages"):
//  - At most one message a day on each channel, and none between 21:00 and 08:00 except the reminder at
//    the time the lifter picked (06:00 to 21:00).
//  - Streaks count weeks, so nothing nudges anyone to train on a rest day to "save" a daily streak.
//  - Pro offers only go to people who don't have Pro, are opt-in on both channels, and are rare.
//  - No message pretends to be something else (no fake urgency, no fake countdowns).

export type MessageKind = "reminder" | "missed" | "streak" | "milestone" | "pro";
export type Channel = "push" | "email";

export const KIND_INFO: Record<MessageKind, { label: string; blurb: string; push: boolean; email: boolean }> = {
  reminder: {
    label: "Workout reminders",
    blurb: "On your training days at your workout time. By email, one note on Monday with your week.",
    push: true,
    email: true,
  },
  missed: {
    label: "Missed workouts",
    blurb: "A nudge the day after a missed training day, and a check-in if a week goes by.",
    push: true,
    email: true,
  },
  streak: { label: "Streak alerts", blurb: "When this week's goal is still reachable but only just.", push: true, email: true },
  milestone: { label: "Milestones", blurb: "Your first workout, and streaks of 4, 8, 12, 26 and 52 weeks.", push: false, email: true },
  pro: {
    label: "Pro trial and offers",
    blurb: "When your trial is about to end, and now and then what Pro adds. Never more than one every two weeks.",
    push: true,
    email: true,
  },
};

export const KINDS = Object.keys(KIND_INFO) as MessageKind[];
export const PUSH_KINDS = KINDS.filter((k) => KIND_INFO[k].push);
export const EMAIL_KINDS = KINDS.filter((k) => KIND_INFO[k].email);

/** On unless the lifter turned them off. Pro offers are off until they turn them on (store rules and GDPR). */
export const DEFAULT_ON: Record<MessageKind, boolean> = { reminder: true, missed: true, streak: true, milestone: true, pro: false };

export type ProState =
  | { state: "pro" }
  | { state: "trial"; endsAt: number }
  /** No Pro: declined the trial, or the trial ended. `since` is when that happened. */
  | { state: "free"; since: number };

export interface PlanInput {
  /** IANA time zone, e.g. "America/Toronto". */
  tz: string;
  /** Training weekdays, 0 = Sunday. */
  days: number[];
  /** Workout time, "HH:MM", local. */
  time: string;
  daysPerWeek: number;
  /** When setup finished (ms). Comebacks count from here when there's no workout yet. */
  startedAt: number;
  lastWorkoutAt?: number;
  firstWorkoutAt?: number;
  /** Distinct days with a workout in the week (Monday to Sunday) that starts at weekStart. */
  weekDays: number;
  /** Local midnight of that Monday (ms). */
  weekStart: number;
  /** Weeks in a row before this one that met the goal (game.ts goalStreak, less this week). */
  streakWeeks: number;
  pro: ProState;
  kinds: Partial<Record<MessageKind, boolean>>;
}

export interface Message {
  /** Stable per message, e.g. "missed:2026-11-10", so a plan can be recomputed without repeats. */
  key: string;
  kind: MessageKind;
  at: number;
  title: string;
  body: string;
  /** Route to open on tap. */
  route: string;
}

const DAY = 86_400_000;
export const QUIET = { from: 21, to: 8 } as const;
export const REMINDER_HOURS = { min: 6, max: 21 } as const;
const COMEBACK_DAYS = [7, 14, 30];
/** Days after the trial ends or is declined that a Pro offer goes out. Four in all, then none. */
export const PRO_OFFER_DAYS = [3, 17, 31, 59];
export const MILESTONE_WEEKS = [4, 8, 12, 26, 52];

// --- Time zones, with no library: the offset of `tz` at an instant, from Intl. ---

interface Parts {
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  wd: number;
}
const fmtCache = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      weekday: "short",
    });
    fmtCache.set(tz, f);
  }
  return f;
}
const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function validTz(tz: string): boolean {
  try {
    fmt(tz);
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock parts of an instant in a time zone. */
export function parts(ms: number, tz: string): Parts {
  const p: Record<string, string> = {};
  for (const x of fmt(tz).formatToParts(new Date(ms))) p[x.type] = x.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, wd: WD[p.weekday] };
}

/** The instant of a wall-clock time in a time zone (the later one if it falls in a DST gap). */
export function zoned(y: number, m: number, d: number, h: number, mi: number, tz: string): number {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let t = guess;
  for (let i = 0; i < 3; i++) {
    const p = parts(t, tz);
    const seen = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
    t += guess - seen;
  }
  return t;
}

/** Local midnight of the day containing `ms`. */
export function dayStart(ms: number, tz: string): number {
  const p = parts(ms, tz);
  return zoned(p.y, p.m, p.d, 0, 0, tz);
}

/** Local midnight `n` days after the day containing `ms` (DST safe). */
export function addDays(ms: number, n: number, tz: string): number {
  const p = parts(ms, tz);
  const u = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
  return zoned(u.getUTCFullYear(), u.getUTCMonth() + 1, u.getUTCDate(), 0, 0, tz);
}

/** The instant of "HH:MM" on the local day that starts at `day`. */
export function atTime(day: number, hhmm: string, tz: string): number {
  const p = parts(day + 12 * 3600_000, tz); // midday: safely inside the same local day
  const [h, mi] = hhmm.split(":").map(Number);
  return zoned(p.y, p.m, p.d, h, mi, tz);
}

/** Local Monday midnight of the week containing `ms`. */
export function mondayIn(ms: number, tz: string): number {
  const p = parts(ms, tz);
  return addDays(ms, -((p.wd + 6) % 7), tz);
}

export const dateKey = (ms: number, tz: string) => {
  const p = parts(ms, tz);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
};

/** Keeps the reminder time inside waking hours. */
export function clampTime(hhmm: string): string {
  const [h, m] = (/^\d{1,2}:\d{2}$/.test(hhmm) ? hhmm : "18:00").split(":").map(Number);
  if (h < REMINDER_HOURS.min) return `${String(REMINDER_HOURS.min).padStart(2, "0")}:00`;
  if (h > REMINDER_HOURS.max || (h === REMINDER_HOURS.max && m > 0)) return `${REMINDER_HOURS.max}:00`;
  return `${String(h).padStart(2, "0")}:${String(Math.min(59, m)).padStart(2, "0")}`;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const PRO_FEATURES = [
  { title: "Workouts that adapt to you", body: "Pro plans each session from your recovery, your gym and how every set felt." },
  { title: "See what's recovered", body: "The recovery map shows which muscles are fresh before you pick a workout." },
  { title: "Know you're getting stronger", body: "Pro tracks your estimated max on every lift and your weekly sets per muscle." },
  { title: "Push days and easy days", body: "Pro reads your readiness and adjusts the day's workout. You can always override it." },
];

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

/**
 * Every message due in [from, to) on one channel, at most one a day, in time order. The phone calls it
 * for the next two weeks and schedules them; the server calls it for the next day and schedules email.
 * A plan assumes no workout happens after `from`: when one does, the plan is recomputed.
 */
export function plan(input: PlanInput, from: number, to: number, channel: Channel): Message[] {
  const { tz } = input;
  const on = (k: MessageKind) => KIND_INFO[k][channel] && (input.kinds[k] ?? DEFAULT_ON[k]);
  const email = channel === "email";
  const sendHour = email ? "08:00" : "09:00";
  const time = clampTime(input.time);
  const goal = Math.max(1, Math.min(7, input.daysPerWeek));
  const last = input.lastWorkoutAt ?? 0;
  const out: Message[] = [];

  for (let day = dayStart(from, tz); day < to; day = addDays(day, 1, tz)) {
    const wd = parts(day + 12 * 3600_000, tz).wd;
    const key = dateKey(day + 12 * 3600_000, tz);
    const monday = mondayIn(day + 12 * 3600_000, tz);
    const trainedToday = last >= day;
    const candidates: Message[] = [];
    const add = (kind: MessageKind, at: number, title: string, body: string, route = "today") => {
      if (at >= from && at < to && on(kind)) candidates.push({ key: `${kind}:${key}`, kind, at, title, body, route });
    };

    // Streak: this week's goal is reachable only if every day left has a workout.
    let streakLine: string | null = null;
    if (monday === mondayIn(from, tz) && input.streakWeeks >= 1) {
      const done = input.weekStart === monday ? input.weekDays : 0;
      const needed = goal - done;
      const daysLeft = 7 - ((wd + 6) % 7); // today included
      if (needed > 0 && needed === daysLeft && !trainedToday) {
        streakLine =
          needed === 1
            ? `One workout today keeps your ${input.streakWeeks}-week streak.`
            : `${needed} workouts left this week to keep your ${input.streakWeeks}-week streak.`;
      }
    }

    // Reminder: push on each training day at the lifter's time; email once a week, Monday morning.
    if (!email && input.days.includes(wd) && !trainedToday) {
      const first = !input.firstWorkoutAt;
      add(
        "reminder",
        atTime(day, time, tz),
        first ? "Your first workout is ready" : "Today's workout is ready",
        streakLine ??
          (first ? "It's planned around your gym and takes one tap a set." : "Planned from your recovery and last session. Tap to start."),
      );
    }
    if (email && wd === 1 && input.days.length) {
      const lastWeek = input.weekStart === addDays(monday, -7, tz) ? input.weekDays : null;
      const names = [...input.days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DAY_NAMES[d]);
      add(
        "reminder",
        atTime(day, sendHour, tz),
        "Your training week",
        `This week: ${names.join(", ")} at ${time}.${lastWeek !== null ? ` Last week you trained ${plural(lastWeek, "day")} of ${goal}.` : ""} Each workout is planned when you open the app.`,
      );
    }

    if (streakLine) add("streak", atTime(day, sendHour, tz), "Keep your streak", streakLine);

    // Missed: once per lapse, the day after the first missed training day (by email, the second), and
    // only if today isn't a training day itself (its reminder already says it). Longer lapses get the
    // comebacks below, not a nudge after every missed day.
    const since = Math.max(last, input.startedAt);
    const missedDays: number[] = [];
    for (let d = addDays(day, -1, tz); d > since && missedDays.length < 3; d = addDays(d, -1, tz)) {
      if (input.days.includes(parts(d + 12 * 3600_000, tz).wd)) missedDays.push(d);
      if (day - d > 8 * DAY) break;
    }
    const yesterday = addDays(day, -1, tz);
    if (!trainedToday && missedDays[0] === yesterday && missedDays.length === (email ? 2 : 1) && !input.days.includes(wd)) {
      add(
        "missed",
        atTime(day, sendHour, tz),
        email ? "Two training days slipped by" : "Missed yesterday? Today works too",
        "A short workout today picks your freshest muscles. Your streak counts weeks, so there's still time.",
      );
    }

    // Comebacks: 7, 14 and 30 days with no workout (or since setup, if none yet), then nothing.
    const quiet = Math.round((day - dayStart(since, tz)) / DAY);
    if (!trainedToday && since > 0 && COMEBACK_DAYS.includes(quiet)) {
      add(
        "missed",
        atTime(day, sendHour, tz),
        input.firstWorkoutAt ? "Ready when you are" : "Your first workout is still waiting",
        input.firstWorkoutAt
          ? `It's been ${quiet} days. Your next workout starts a little lighter so you can ease back in.`
          : "Pick a length, tap start, and the app does the planning.",
      );
    }

    // Pro: two days before a trial ends, then four offers spread over two months. proState() reports
    // everyone as Pro while billing is off, so none go out until it's live.
    if (input.pro.state === "trial") {
      if (day === addDays(input.pro.endsAt, -2, tz))
        add(
          "pro",
          atTime(day, "12:00", tz),
          "Your Pro trial ends in 2 days",
          "Keep adaptive workouts, the recovery map and full stats, or do nothing and stay on the free plan.",
          "settings",
        );
    }
    if (input.pro.state === "free") {
      const n = PRO_OFFER_DAYS.indexOf(Math.round((day - dayStart(input.pro.since, tz)) / DAY));
      if (n >= 0)
        add(
          "pro",
          atTime(day, "12:00", tz),
          PRO_FEATURES[n].title,
          `${PRO_FEATURES[n].body} Try Pro free, cancel in two taps.`,
          "settings",
        );
    }

    // One a day: the reminder (the lifter asked for it) wins, then streak, missed, Pro.
    const order: MessageKind[] = ["reminder", "streak", "missed", "pro"];
    const best = candidates.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))[0];
    if (best && (best.kind === "reminder" || !inQuiet(best.at, tz))) out.push(best);
  }
  return out.sort((a, b) => a.at - b.at);
}

export function inQuiet(at: number, tz: string): boolean {
  const h = parts(at, tz).h;
  return h >= QUIET.from || h < QUIET.to;
}

/** A milestone email for a change the phone just reported, or null. Sent right away, not scheduled. */
export function milestone(
  prev: Pick<PlanInput, "firstWorkoutAt" | "streakWeeks"> | null,
  next: Pick<PlanInput, "firstWorkoutAt" | "streakWeeks">,
  now: number,
): { key: string; title: string; body: string } | null {
  if (next.firstWorkoutAt && !prev?.firstWorkoutAt && now - next.firstWorkoutAt < 3 * DAY) {
    return {
      key: "milestone:first",
      title: "Your first workout is in the books",
      body: "Nice work. Your next workout builds on today's weights and reps, and your recovery map now shows what you trained.",
    };
  }
  const w = MILESTONE_WEEKS.find((m) => next.streakWeeks >= m && (prev?.streakWeeks ?? 0) < m);
  if (w)
    return {
      key: `milestone:streak${w}`,
      title: `${w} weeks in a row`,
      body: `You've hit your training goal ${w} weeks running. That's how strength is built.`,
    };
  return null;
}

/** How a profile's Pro choice reads for messages (trial.ts records it; billing will own it). */
export function proState(
  pro: { trialStartedAt?: number; trialDays?: number; declinedAt?: number; subscribed?: boolean } | undefined,
  now: number,
  billingLive = billingIsLive(),
): ProState {
  if (!billingLive || pro?.subscribed) return { state: "pro" };
  if (pro?.trialStartedAt && pro.trialDays) {
    const endsAt = pro.trialStartedAt + pro.trialDays * DAY;
    return endsAt > now ? { state: "trial", endsAt } : { state: "free", since: endsAt };
  }
  if (pro?.declinedAt) return { state: "free", since: pro.declinedAt };
  return { state: "pro" };
}
