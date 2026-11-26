import { trainingDays } from "./calendar";
import { weekOf } from "./derive";
import type { Streak } from "./game";
import type { Plan } from "./generator";
import { currentLang, date, t } from "./i18n";
import type { Insight } from "./insights";
import { isNative } from "./juice";
import { READY_AT } from "./nextUp";
import { dayKey } from "./random";
import { CALL_TEXT, type Readiness } from "./readiness";
import { recovery } from "./recovery";
import type { AppEvent, Muscle, Profile } from "./types";
import { callWhy } from "./why";

// The home-screen widget (Melvin, 2026-11-10). One resizable widget answers "what should I do today?":
// today's call and length, the one-line why, the weekly goal, and the top coach's note, with Start.
// The app builds every line here, in the lifter's language, and hands the finished snapshot to the
// native widget (Android WorkoutWidget.java, iOS QuickStartWidget.swift), which only draws it.
//
// Battery: the widget never polls or wakes the phone. The app sends a new snapshot only when one of its
// lines changes; Android adds one inexact, non-waking refresh after midnight so yesterday's plan isn't
// shown as today's (the snapshot's `day` tells the widget it's stale, and it shows `stale` instead).

export interface WidgetSnapshot {
  v: 1;
  /** The local day the snapshot was built for (random.ts dayKey). On another day the widget shows `stale`. */
  day: string;
  /** Colours the call: push, normal, recover, rest (nothing planned), active (a workout running), program. */
  kind: "push" | "normal" | "recover" | "rest" | "active" | "program";
  title: string;
  why: string;
  /** The weekly goal line; empty when there's nothing to say. */
  goal: string;
  /** The top coach's note and its one action, if any; empty when nothing needs doing. */
  note: string;
  /** Button labels: Start (or Resume while a workout runs), and Log set only while a workout runs. */
  start: string;
  log: string;
  /** Shown instead of the plan once the day has passed, until the app is opened. */
  stale: string;
  /** The This week widget (2026-11-15). Older apps leave it out, and the widget then shows only Start. */
  week?: WeekPart;
  /** The Recovery widget (2026-11-15). */
  rec?: RecoveryPart;
  /** Today's call on the watches (2026-11-26): the Wear OS tile and complication, the Apple Watch complication and the
   *  Garmin glance. The phones pass it on with `day`, `kind`, `title`, `why` and `stale` (WatchLink, GarminLink). */
  watch?: WatchPart;
}

/** The short pieces a watch face has room for: "Push", "45 min" and "Readiness 82". Empty strings are left out. */
export interface WatchPart {
  call: string;
  mins: string;
  /** Empty before readiness means anything (no signals yet), on rest days, programs and during a workout. */
  ready: string;
}

// ---------- This week and Recovery widgets (Melvin chose both, 2026-11-15)
// Two more widgets beside Today, each answering its own question with one action (Start): "am I on track this
// week?" and "what's ready to train?". They read the same snapshot, so the app still sends one thing.

export type DayMark = "done" | "stretch" | "plan" | "rest";

export interface WeekPart {
  /** "2 of 4 this week". */
  title: string;
  /** "6-week streak", or empty with no streak running. */
  streak: string;
  /** What to do about it: how many more days keep the streak, or that the goal is met. */
  why: string;
  /** Seven days from the lifter's first day of the week: the narrow day name, what happened or is planned, and today. */
  days: { l: string; m: DayMark; today: boolean }[];
}

export interface RecoveryPart {
  /** Headings, in the lifter's language. */
  ready: string;
  resting: string;
  /** Shown when every area is ready. */
  all: string;
  /** Joins names on one line (", ", or "、" in Japanese). */
  sep: string;
  /** Six body areas: the name, when it's ready (ms, 0 = now), and the line shown while it's still recovering. */
  areas: { n: string; at: number; line: string }[];
}

export interface WeekInput {
  sessions: readonly { start: number }[];
  stretchDays: readonly number[];
  profile: Pick<Profile, "calendar" | "daysPerWeek">;
  streak: Pick<Streak, "thisWeek" | "needed" | "weeks">;
  now: number;
}

const DAY = 86_400_000;

/** The week strip and the line under it. Past days without training are rest, never "missed": no guilt on a widget. */
export function weekPart({ sessions, stretchDays, profile, streak, now }: WeekInput): WeekPart {
  const start = weekOf(now);
  const today = new Date(now).toDateString();
  const trained = new Set(sessions.map((s) => new Date(s.start).toDateString()));
  const stretched = new Set(stretchDays.map((d) => new Date(d).toDateString()));
  const planned = new Set(trainingDays(profile));
  const days: WeekPart["days"] = [];
  let future = false;
  for (let i = 0; i < 7; i++) {
    // Noon steps across daylight saving safely.
    const d = new Date(start + i * DAY + DAY / 2);
    const key = d.toDateString();
    const isToday = key === today;
    const m: DayMark = trained.has(key)
      ? "done"
      : stretched.has(key)
        ? "stretch"
        : (future || isToday) && planned.has(d.getDay())
          ? "plan"
          : "rest";
    days.push({ l: date(d, { weekday: "narrow" }), m, today: isToday });
    if (isToday) future = true;
  }
  const goal = Math.max(1, profile.daysPerWeek);
  const n = { done: streak.thisWeek, goal };
  const why =
    streak.needed <= 0
      ? t("wdg.weekMet")
      : streak.weeks > 0
        ? t("wdg.weekKeep", { count: streak.needed, weeks: streak.weeks })
        : t("wdg.weekMore", { count: streak.needed });
  return {
    title: t("wdg.weekTitle", n),
    streak: streak.weeks > 0 ? t("wdg.streak", { count: streak.weeks }) : "",
    why,
    days,
  };
}

/** The six areas the Recovery widget names, each made of the app's muscles. */
export const AREAS: Record<"chest" | "shoulders" | "back" | "arms" | "core" | "legs", readonly Muscle[]> = {
  chest: ["chest"],
  shoulders: ["frontDelts", "sideDelts", "rearDelts"],
  back: ["upperBack", "lats", "lowerBack", "traps"],
  arms: ["biceps", "triceps", "forearms"],
  core: ["abs", "obliques"],
  legs: ["quads", "hamstrings", "glutes", "adductors", "calves"],
};

const HOUR = 3_600_000;

/**
 * When each area is ready again (every muscle in it back to READY_AT, the recovery map's "ready" band), from the
 * same recovery model as Body, run forward an hour at a time. The widget compares these times with the clock as
 * it draws, so an area moves to "ready" on its own without the app, and without the widget polling.
 */
export function recoveryPart(events: readonly AppEvent[], now: number): RecoveryPart {
  const at = {} as Record<Muscle, number>;
  const left = new Set(Object.values(AREAS).flat());
  // Four days is the longest any muscle needs (nextUp.ts hoursUntilReady).
  for (let h = 0; h <= 96 && left.size; h++) {
    const time = now + h * HOUR;
    const r = recovery(events, time);
    for (const m of [...left]) {
      if (r[m] >= READY_AT) {
        at[m] = h === 0 ? 0 : time;
        left.delete(m);
      }
    }
  }
  for (const m of left) at[m] = now + 96 * HOUR;
  const areas = (Object.keys(AREAS) as (keyof typeof AREAS)[]).map((k) => {
    const when = Math.max(...AREAS[k].map((m) => at[m]));
    // Rounded up to the hour, so "ready 6 PM" is never a few minutes early.
    const ready = when === 0 ? 0 : Math.ceil(when / HOUR) * HOUR;
    const n = t(`wdg.area.${k}`);
    const sameDay = ready > 0 && new Date(ready).toDateString() === new Date(now).toDateString();
    const time = ready ? date(ready, sameDay ? { hour: "numeric" } : { weekday: "short", hour: "numeric" }) : "";
    return { n, at: ready, line: ready ? t("wdg.readyAt", { name: n, time }) : n };
  });
  return {
    ready: t("wdg.ready"),
    resting: t("wdg.resting"),
    all: t("wdg.allReady"),
    sep: currentLang() === "ja" ? "、" : ", ",
    areas,
  };
}

export interface WidgetInput {
  plan: Plan | null;
  readiness: Readiness | null;
  active: boolean;
  streak: Pick<Streak, "thisWeek" | "needed" | "weeks">;
  goal: number;
  /** Coach's notes not dismissed on this device, most important first. */
  notes: readonly Insight[];
  now: number;
}

function goalLine(streak: WidgetInput["streak"], goal: number): string {
  const n = { done: streak.thisWeek, goal: Math.max(1, goal) };
  if (streak.needed <= 0) return t("wdg.goalMet", n);
  if (streak.weeks > 0) return t("wdg.goalStreak", { ...n, count: streak.needed, weeks: streak.weeks });
  return t("wdg.goal", { ...n, count: streak.needed });
}

function noteLine(notes: readonly Insight[]): string {
  const top = notes[0];
  if (!top) return "";
  return top.action ? t("wdg.note", { note: top.title, action: top.action.label }) : top.title;
}

/** Everything the widget shows, built from the same data as Today. Pure, so it's tested without a phone. */
export function widgetSnapshot({ plan, readiness, active, streak, goal, notes, now }: WidgetInput): WidgetSnapshot {
  const base = {
    v: 1 as const,
    day: dayKey(now),
    goal: goalLine(streak, goal),
    note: noteLine(notes),
    start: t(active ? "wdg.resume" : "wdg.start"),
    log: active ? t("wdg.log") : "",
    stale: t("wdg.stale"),
  };
  if (active) {
    const title = t("td.inProgress");
    return { ...base, kind: "active", title, why: t("wdg.activeWhy"), watch: { call: title, mins: "", ready: "" } };
  }
  if (!plan || !plan.items.length) {
    const title = t("td.restDay");
    return { ...base, kind: "rest", title, why: t("td.restBody"), watch: { call: title, mins: "", ready: "" } };
  }
  const minutes = plan.estMinutes || plan.minutes;
  const mins = t("wdg.mins", { minutes });
  if (plan.program?.fixed) {
    const call = plan.program.dayName;
    return { ...base, kind: "program", title: t("wdg.title", { call, minutes }), why: plan.program.note, watch: { call, mins, ready: "" } };
  }
  const why = plan.challenge ? t("td.challenge") : readiness ? callWhy(readiness, plan.call, plan.week.deload) : "";
  const call = CALL_TEXT[plan.call].label;
  // A score with no signal behind it is a placeholder (Today says so), so the watch leaves it out.
  const ready = readiness && readiness.signals.some((g) => g.points !== 0) ? t("td.readinessN", { n: readiness.score }) : "";
  return { ...base, kind: plan.call, title: t("wdg.title", { call, minutes }), why, watch: { call, mins, ready } };
}

type Plugin = { setWidget(o: { json: string }): Promise<void> };
const plugin = (): Plugin | undefined =>
  typeof window !== "undefined"
    ? (window as unknown as { Capacitor?: { Plugins?: { WorkoutSession?: Plugin } } }).Capacitor?.Plugins?.WorkoutSession
    : undefined;

let last = "";

/** Hands the snapshot to the native widget, only when it changed. Does nothing on the web (no browser widgets). */
export async function pushWidget(s: WidgetSnapshot): Promise<boolean> {
  const p = plugin();
  if (!p?.setWidget || !isNative()) return false;
  const json = JSON.stringify(s);
  if (json === last) return false;
  last = json;
  try {
    await p.setWidget({ json });
    return true;
  } catch {
    last = "";
    return false;
  }
}

/** Empties the native widget (signing out, erasing the device): an empty snapshot draws its plain Start and Log buttons
 *  on both Android (WorkoutWidget.snapshot needs "v": 1) and iOS (QuickStartWidget's Snapshot doesn't decode). */
export async function clearWidget(): Promise<void> {
  const p = plugin();
  last = "";
  if (!p?.setWidget || !isNative()) return;
  await p.setWidget({ json: "{}" }).catch(() => undefined);
}

/** Tests only. */
export function resetWidgetCache() {
  last = "";
}
