// While billing isn't live everyone has Pro, so the planner sends no Pro offers (billing.ts).
import { billingLive as billingIsLive } from "./billing";
import { dayName, say, type MsgLang } from "./messageText";
import { LB, weightIn } from "./unitMath";

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

export type MessageKind =
  | "reminder"
  | "missed"
  | "streak"
  | "milestone"
  | "pro"
  | "tour"
  | "weekly"
  | "trial"
  | "recap"
  | "records"
  | "friends"
  | "rehab"
  | "season";
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
    label: "Pro offers",
    blurb: "Now and then what Pro adds. Never more than one every two weeks.",
    push: true,
    email: true,
  },
  // Two days before a free trial ends: what it means for you, on by default because it's about your account.
  trial: { label: "Trial ending", blurb: "Two days before a Pro trial ends.", push: true, email: true },
  // Sunday evening's week and the 1st of the month's month, from the numbers the phone sends.
  recap: {
    label: "Weekly and monthly recaps",
    blurb: "Sunday evening, your week; on the 1st, your month, ready to share.",
    push: false,
    email: true,
  },
  // A new personal best, at most one email a week (the app already celebrates it in the moment).
  records: { label: "Personal bests", blurb: "A new best on a lift, at most once a week.", push: false, email: true },
  // Thursday evening: which friends trained this week (Friends, server side).
  friends: { label: "Friend activity", blurb: "Thursday evening, which friends trained this week.", push: false, email: true },
  // The physio's rehab on a day without a workout reminder, when it's due (2026-11-15). Push only: the phone knows.
  rehab: { label: "Rehab reminders", blurb: "Your physio's exercises on days they're due.", push: true, email: false },
  // Training seasons (seasons.ts, 2026-11-18): the day one starts, its finale week and three days before it ends.
  season: {
    label: "Training seasons",
    blurb: "When a season starts, when its finale week begins and three days before it ends.",
    push: true,
    email: true,
  },
  // The feature tour: one email a day about one thing the app does, with a real screenshot (server/tour.ts).
  tour: {
    label: "Getting started tips",
    blurb: "One email a day for your first eight days, each about one thing the app does.",
    push: false,
    email: true,
  },
  // After Getting started: one email a week about one more thing the app does (server/weekly.ts).
  weekly: {
    label: "Weekly tips",
    blurb: "After Getting started, one email a week about something else the app can do.",
    push: false,
    email: true,
  },
};

export const KINDS = Object.keys(KIND_INFO) as MessageKind[];
export const PUSH_KINDS = KINDS.filter((k) => KIND_INFO[k].push);
export const EMAIL_KINDS = KINDS.filter((k) => KIND_INFO[k].email);

/** On unless the lifter turned them off. Pro offers are off until they turn them on (store rules and GDPR). */
export const DEFAULT_ON: Record<MessageKind, boolean> = {
  reminder: true,
  missed: true,
  streak: true,
  milestone: true,
  pro: false,
  tour: true,
  weekly: true,
  trial: true,
  recap: true,
  records: true,
  friends: true,
  rehab: true,
  season: true,
};

/** A stretch of training, for the recaps: from the phone's own workouts (reminders.ts planInput). */
export interface Totals {
  /** Local midnight the stretch starts (a Monday, or the 1st of a month). */
  start: number;
  workouts: number;
  sets: number;
  volumeKg: number;
  prs: number;
  minutes: number;
}

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
  /** Distinct days with a workout in the week that starts at weekStart. */
  weekDays: number;
  /** Local midnight of the first day of that week (ms): Monday, or Sunday when `firstDay` is 0. */
  weekStart: number;
  /**
   * The lifter's first day of the week (Settings › Workout preferences): 1 Monday (default, and older apps), 0
   * Sunday. Weeks here follow it, so a streak warning or recap counts the same week as the app (number audit, 2026-11-15).
   */
  firstDay?: 0 | 1;
  /** Weeks in a row before this one that met the goal (game.ts goalStreak, less this week). */
  streakWeeks: number;
  pro: ProState;
  /** Under 18 by the birth year they gave (teen.ts): no promotional email (the feature tour, Pro offers). */
  teen?: boolean;
  kinds: Partial<Record<MessageKind, boolean>>;
  /** The app's language, for the words of each message. English when missing (older subscriptions). */
  lang?: MsgLang;
  /** For the recaps and personal bests: the lifter's unit, this week so far, last calendar month, the newest best. */
  unit?: "kg" | "lb";
  week?: Totals;
  lastMonth?: Totals;
  best?: { at: number; name: string; weightKg: number; reps: number };
  /** Before the first workout: today's planned exercises (in the app's language) and minutes, for the welcome. */
  next?: { names: string[]; minutes: number };
  /**
   * The physio's rehab program (push only, never sent to the server), while an injury it's for is active: its name,
   * the times a week asked for and when it was done (start times; the plan assumes it isn't done again after `from`).
   */
  rehab?: { name: string; perWeek?: number; times: number[] };
  /**
   * The training season running or about to start (seasons.ts seasonReminder), only while seasons are on and unlocked:
   * its title in the app's language, its weeks, its first day, the first day of its finale week, the day after it
   * ends (local midnights) and the tier now.
   */
  season?: { title: string; weeks: number; start: number; finale: number; end: number; tier: number };
}

/** Whether the rehab is due on the local day starting at `day`, from what was done before then (partExtras rehabDue). */
export function rehabDueOn(r: NonNullable<PlanInput["rehab"]>, day: number, tz: string): { due: boolean; done: number } {
  const before = r.times.filter((at) => at < day);
  const last = before.length ? Math.max(...before) : undefined;
  const gap = r.perWeek !== undefined && r.perWeek >= 4 ? 1 : 2;
  const waited = last === undefined || Math.round((day - dayStart(last, tz)) / DAY) >= gap;
  const from = addDays(day, -6, tz);
  const done = new Set(before.filter((at) => at >= from).map((at) => dayStart(at, tz))).size;
  return { due: waited && (r.perWeek === undefined || done < r.perWeek), done };
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
  /** Streak warnings and milestones: the weeks in a row and, for a warning, this week's workouts and goal (the email's streak card). */
  streak?: { weeks: number; done?: number; goal?: number };
}

const DAY = 86_400_000;
export const QUIET = { from: 21, to: 8 } as const;
export const REMINDER_HOURS = { min: 6, max: 21 } as const;
const COMEBACK_DAYS = [7, 14, 21, 30];
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
  return weekStartIn(ms, tz, 1);
}

/** Local midnight-ish start of the week holding `ms` in `tz`: Monday (1) or Sunday (0). */
export function weekStartIn(ms: number, tz: string, firstDay: 0 | 1 = 1): number {
  const p = parts(ms, tz);
  return addDays(ms, -((p.wd + 7 - firstDay) % 7), tz);
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

/** Pro offers in the order they go out (PRO_OFFER_DAYS). */
const PRO_FEATURES = ["rmd.pro1", "rmd.pro2", "rmd.pro3", "rmd.pro4"] as const;

/**
 * Every message due in [from, to) on one channel, at most one a day, in time order. The phone calls it
 * for the next two weeks and schedules them; the server calls it for the next day and schedules email.
 * A plan assumes no workout happens after `from`: when one does, the plan is recomputed.
 */
export function plan(input: PlanInput, from: number, to: number, channel: Channel): Message[] {
  const { tz, lang } = input;
  const on = (k: MessageKind) => KIND_INFO[k][channel] && (input.kinds[k] ?? DEFAULT_ON[k]);
  const email = channel === "email";
  const sendHour = email ? "08:00" : "09:00";
  const time = clampTime(input.time);
  const goal = Math.max(1, Math.min(7, input.daysPerWeek));
  const last = input.lastWorkoutAt ?? 0;
  const out: Message[] = [];
  const first = input.firstDay === 0 ? 0 : 1;
  /** The last day of the lifter's week: Sunday, or Saturday when weeks start on Sunday. */
  const lastDay = (first + 6) % 7;

  for (let day = dayStart(from, tz); day < to; day = addDays(day, 1, tz)) {
    const wd = parts(day + 12 * 3600_000, tz).wd;
    const key = dateKey(day + 12 * 3600_000, tz);
    const monday = weekStartIn(day + 12 * 3600_000, tz, first);
    const trainedToday = last >= day;
    const candidates: Message[] = [];
    const add = (kind: MessageKind, at: number, title: string, body: string, route = "today", tag = "", streak?: Message["streak"]) => {
      if (at >= from && at < to && on(kind))
        candidates.push({ key: `${kind}:${key}${tag}`, kind, at, title, body, route, ...(streak ? { streak } : {}) });
    };

    // Streak: this week's goal is reachable only if every day left has a workout.
    let streakLine: string | null = null;
    let streakDone = 0;
    if (monday === weekStartIn(from, tz, first) && input.streakWeeks >= 1) {
      const done = input.weekStart === monday ? input.weekDays : 0;
      const needed = goal - done;
      const daysLeft = 7 - ((wd + 7 - first) % 7); // today included
      if (needed > 0 && needed === daysLeft && !trainedToday) {
        streakDone = done;
        streakLine =
          needed === 1
            ? say(lang, "rmd.streakOne", { weeks: input.streakWeeks })
            : say(lang, "rmd.streakMany", { needed, weeks: input.streakWeeks });
      }
    }

    // Reminder: push on each training day at the lifter's time; email once a week, on the first morning of their week.
    if (!email && input.days.includes(wd) && !trainedToday) {
      const first = !input.firstWorkoutAt;
      add(
        "reminder",
        atTime(day, time, tz),
        first ? say(lang, "rmd.firstReady") : say(lang, "rmd.todayReady"),
        streakLine ?? (first ? say(lang, "rmd.firstReadyBody") : say(lang, "rmd.todayReadyBody")),
      );
    }
    if (email && wd === first && input.days.length) {
      const lastWeek = input.weekStart === addDays(monday, -7, tz) ? input.weekDays : null;
      const names = [...input.days].sort((a, b) => ((a + 7 - first) % 7) - ((b + 7 - first) % 7)).map((d) => dayName(lang, d));
      add(
        "reminder",
        atTime(day, sendHour, tz),
        say(lang, "rmd.week"),
        lastWeek !== null
          ? say(lang, "rmd.weekBodyLast", { days: names.join(", "), time, trained: say(lang, "rmd.days", { count: lastWeek }), goal })
          : say(lang, "rmd.weekBody", { days: names.join(", "), time }),
      );
    }

    if (streakLine)
      add("streak", atTime(day, sendHour, tz), say(lang, "rmd.keepStreak"), streakLine, "today", "", {
        weeks: input.streakWeeks,
        done: streakDone,
        goal,
      });

    // Training seasons: the day one starts, the first day of its finale week (points count twice) and three days
    // before it ends. Not a nudge to train more: points stop at the lifter's own weekly goal.
    const sz = input.season;
    if (sz) {
      const same = (ms: number) => dateKey(ms + 12 * 3600_000, tz) === key;
      const at = atTime(day, sendHour, tz);
      const tier = sz.tier;
      if (same(sz.start))
        add(
          "season",
          at,
          say(lang, "rmd.seasonStart", { season: sz.title }),
          say(lang, "rmd.seasonStartBody", { weeks: sz.weeks }),
          "season",
        );
      else if (same(sz.finale) && sz.finale > sz.start)
        add("season", at, say(lang, "rmd.seasonFinale", { season: sz.title }), say(lang, "rmd.seasonFinaleBody", { tier }), "season");
      else if (same(addDays(sz.end, -3, tz)))
        add("season", at, say(lang, "rmd.seasonEnding", { season: sz.title }), say(lang, "rmd.seasonEndingBody", { tier }), "season");
    }

    // Rehab (push): the physio's exercises at the workout time on a day without a workout reminder (that day's Today
    // offers the rehab beside the lifting), when they're due. Done today means it isn't.
    if (!email && input.rehab && !input.days.includes(wd)) {
      const r = input.rehab;
      const { due, done } = rehabDueOn(r, day, tz);
      const doneToday = r.times.some((at) => at >= day && at < addDays(day, 1, tz));
      if (due && !doneToday)
        add(
          "rehab",
          atTime(day, time, tz),
          say(lang, "rmd.rehab", { name: r.name }),
          r.perWeek !== undefined ? say(lang, "rmd.rehabWeek", { done, want: r.perWeek }) : say(lang, "rmd.rehabBody"),
        );
    }

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
        email ? say(lang, "rmd.missedTwo") : say(lang, "rmd.missedOne"),
        say(lang, "rmd.missedBody"),
      );
    }

    // Comebacks: 7, 14, 21 and 30 days with no workout (or since setup, if none yet), then nothing. From two weeks
    // it's a win-back: the plan starts lighter, so the first one back isn't a slog.
    const quiet = Math.round((day - dayStart(since, tz)) / DAY);
    if (!trainedToday && since > 0 && COMEBACK_DAYS.includes(quiet)) {
      const winback = !!input.firstWorkoutAt && quiet >= 14;
      const firstPlan = !input.firstWorkoutAt && email && input.next?.names.length ? input.next : null;
      add(
        "missed",
        atTime(day, sendHour, tz),
        winback ? say(lang, "rmd.winback") : input.firstWorkoutAt ? say(lang, "rmd.ready") : say(lang, "rmd.firstWaiting"),
        winback
          ? say(lang, "rmd.winbackBody", { days: quiet })
          : input.firstWorkoutAt
            ? say(lang, "rmd.comeback", { days: quiet })
            : firstPlan
              ? say(lang, "rmd.firstWaitingPlan", { list: listOf(lang, firstPlan.names), minutes: firstPlan.minutes })
              : say(lang, "rmd.firstWaitingBody"),
      );
    }

    // Recaps (email): the last day of the lifter's week (Sunday, or Saturday for Sunday weeks) at 19:00, the week so far; on the 1st at 09:00, last month. The key carries the numbers,
    // so a workout logged after the run replaces the scheduled recap with the new numbers.
    if (email && wd === lastDay && input.week && input.week.start === monday && input.week.workouts > 0) {
      const w = input.week;
      add(
        "recap",
        atTime(day, "19:00", tz),
        say(lang, "rmd.recapWeek"),
        totalsLine(lang, w, input.unit),
        "stats",
        `:${w.workouts}-${w.sets}-${w.prs}`,
      );
    }
    const local = parts(day + 12 * 3600_000, tz);
    if (email && local.d === 1 && input.lastMonth && input.lastMonth.workouts > 0) {
      const m = input.lastMonth;
      const prev = parts(m.start + 12 * 3600_000, tz);
      if ((prev.m % 12) + 1 === local.m && prev.d === 1) {
        const month = new Intl.DateTimeFormat(lang ?? "en", { month: "long", timeZone: tz }).format(m.start + 12 * 3600_000);
        add(
          "recap",
          atTime(day, "09:00", tz),
          say(lang, "rmd.recapMonth", { month }),
          `${totalsLine(lang, m, input.unit)} ${say(lang, "rmd.recapMonthShare")}`,
          "recap",
          `:month${m.workouts}-${m.sets}`,
        );
      }
    }

    // Pro: two days before a trial ends, then four offers spread over two months. proState() reports
    // everyone as Pro while billing is off, so none go out until it's live.
    if (input.pro.state === "trial") {
      if (day === addDays(input.pro.endsAt, -2, tz))
        add("trial", atTime(day, "12:00", tz), say(lang, "rmd.trialEnds"), say(lang, "rmd.trialEndsBody"), "settings");
    }
    if (input.pro.state === "free") {
      const n = PRO_OFFER_DAYS.indexOf(Math.round((day - dayStart(input.pro.since, tz)) / DAY));
      const offer = PRO_FEATURES[n];
      if (offer) add("pro", atTime(day, "12:00", tz), say(lang, offer), say(lang, `${offer}.body`), "settings");
    }

    // One a day: the reminder (the lifter asked for it) wins, then the physio's rehab, then the trial ending, recaps, streak, season, missed, Pro.
    const order: MessageKind[] = ["reminder", "rehab", "trial", "recap", "streak", "season", "missed", "pro"];
    const best = candidates.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))[0];
    // A season day that's also a reminder day says the season in the reminder, so it isn't lost to the one-a-day rule
    // (a season starts on the first day of the week, which is the weekly email's day too). A streak warning comes first.
    const season = candidates.find((c) => c.kind === "season");
    if (best?.kind === "reminder" && season && !streakLine) {
      const line = say(lang, "rmd.seasonFold", { title: season.title, body: season.body });
      best.body = email ? `${best.body} ${line}` : line;
      best.key += ":season";
    }
    if (best && (best.kind === "reminder" || best.kind === "rehab" || !inQuiet(best.at, tz))) out.push(best);
  }
  return out.sort((a, b) => a.at - b.at);
}

/** "A, B and C" in the lifter's language. */
export function listOf(lang: MsgLang | undefined, items: readonly string[]): string {
  return new Intl.ListFormat(lang ?? "en", { style: "long", type: "conjunction" }).format(items);
}

/** A week's or month's numbers in one line: workouts, sets, weight lifted and new bests. */
export function totalsLine(lang: MsgLang | undefined, t: Totals, unit: "kg" | "lb" = "kg"): string {
  const n = new Intl.NumberFormat(lang ?? "en", { maximumFractionDigits: 0 });
  const volume = unit === "lb" ? t.volumeKg / LB : t.volumeKg;
  const line = say(lang, "rmd.recapLine", {
    workouts: say(lang, "rmd.workouts", { count: t.workouts }),
    sets: say(lang, "rmd.sets", { count: t.sets }),
    volume: `${n.format(volume)} ${unit}`,
  });
  return t.prs > 0 ? `${line} ${say(lang, "rmd.recapPrs", { count: t.prs })}` : line;
}

/**
 * A personal-best email for a best the phone just reported, or null: a new best since the last report, set in the
 * last day. At most one a week (the server checks its sends).
 */
export function record(
  prev: Pick<PlanInput, "best"> | null,
  next: Pick<PlanInput, "best" | "lang" | "unit">,
  now: number,
): { key: string; title: string; body: string } | null {
  const b = next.best;
  if (!b || b.at <= (prev?.best?.at ?? 0) || now - b.at > DAY) return null;
  const unit = next.unit ?? "kg";
  // The weight as the app shows it (unitMath.ts weightIn), in the email's language.
  const w = new Intl.NumberFormat(next.lang ?? "en", { maximumFractionDigits: 2, useGrouping: false }).format(weightIn(b.weightKg, unit));
  return {
    key: `records:${b.at}`,
    title: say(next.lang, "rmd.record", { name: b.name }),
    body: say(next.lang, "rmd.recordBody", { name: b.name, weight: `${w} ${unit}`, reps: b.reps }),
  };
}

export function inQuiet(at: number, tz: string): boolean {
  const h = parts(at, tz).h;
  return h >= QUIET.from || h < QUIET.to;
}

/** A milestone email for a change the phone just reported, or null. Sent right away, not scheduled. */
export function milestone(
  prev: Pick<PlanInput, "firstWorkoutAt" | "streakWeeks"> | null,
  next: Pick<PlanInput, "firstWorkoutAt" | "streakWeeks" | "lang">,
  now: number,
): { key: string; title: string; body: string; streak?: Message["streak"] } | null {
  const { lang } = next;
  if (next.firstWorkoutAt && !prev?.firstWorkoutAt && now - next.firstWorkoutAt < 3 * DAY) {
    return {
      key: "milestone:first",
      title: say(lang, "rmd.firstDone"),
      body: say(lang, "rmd.firstDoneBody"),
    };
  }
  const w = MILESTONE_WEEKS.find((m) => next.streakWeeks >= m && (prev?.streakWeeks ?? 0) < m);
  if (w)
    return {
      key: `milestone:streak${w}`,
      title: say(lang, "rmd.streakWeeks", { weeks: w }),
      body: say(lang, "rmd.streakWeeksBody", { weeks: w }),
      streak: { weeks: w },
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
