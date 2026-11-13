import type { Streak } from "./game";
import type { Plan } from "./generator";
import { t } from "./i18n";
import type { Insight } from "./insights";
import { isNative } from "./juice";
import { dayKey } from "./random";
import { CALL_TEXT, type Readiness } from "./readiness";
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
  if (active) return { ...base, kind: "active", title: t("td.inProgress"), why: t("wdg.activeWhy") };
  if (!plan || !plan.items.length) return { ...base, kind: "rest", title: t("td.restDay"), why: t("td.restBody") };
  const minutes = plan.estMinutes || plan.minutes;
  if (plan.program?.fixed) {
    return { ...base, kind: "program", title: t("wdg.title", { call: plan.program.dayName, minutes }), why: plan.program.note };
  }
  const why = plan.challenge ? t("td.challenge") : readiness ? callWhy(readiness, plan.call, plan.week.deload) : "";
  return { ...base, kind: plan.call, title: t("wdg.title", { call: CALL_TEXT[plan.call].label, minutes }), why };
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
