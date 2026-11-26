import { describe, expect, it } from "vitest";

import { DAY, makeProfile, makeSets, makeTestGym, NOW } from "@/test/factories";

import { weekOf } from "./derive";
import { generate } from "./generator";
import type { Insight } from "./insights";
import { READY_AT } from "./nextUp";
import { readiness } from "./readiness";
import { recovery } from "./recovery";
import { MUSCLES } from "./types";
import { callWhy } from "./why";
import { AREAS, recoveryPart, weekPart, widgetSnapshot, type WeekInput, type WidgetInput } from "./widget";

// The home-screen widget (Melvin, 2026-11-10): what to do today and why, the weekly goal, and the top coach's note.

const profile = makeProfile({ onboarded: true, daysPerWeek: 4 });
const plan = generate({ gym: makeTestGym(), profile, events: [], minutes: 45, now: NOW });
const r = readiness([], profile, NOW);
const input = (over: Partial<WidgetInput> = {}): WidgetInput => ({
  plan,
  readiness: r,
  active: false,
  streak: { thisWeek: 2, needed: 2, weeks: 6 },
  goal: 4,
  notes: [],
  now: NOW,
  ...over,
});

describe("widgetSnapshot", () => {
  it("shows today's call and length with the same reason as Today, and a Start button", () => {
    const s = widgetSnapshot(input());
    expect(plan.items.length).toBeGreaterThan(0);
    expect(s.kind).toBe(plan.call);
    expect(s.title).toContain(`${plan.estMinutes} min`);
    expect(s.why).toBe(callWhy(r, plan.call, plan.week.deload));
    expect(s.start).toBe("Start");
    expect(s.log).toBe("");
  });

  it("turns the weekly goal into what's left to do", () => {
    expect(widgetSnapshot(input()).goal).toBe("2 of 4 this week. 2 more keep your 6-week streak.");
    expect(widgetSnapshot(input({ streak: { thisWeek: 3, needed: 1, weeks: 0 } })).goal).toBe("3 of 4 this week. 1 more to hit your goal.");
    expect(widgetSnapshot(input({ streak: { thisWeek: 4, needed: 0, weeks: 7 } })).goal).toMatch(/^Weekly goal met: 4 of 4/);
  });

  it("shows the top coach's note with its one action, and nothing when nothing needs doing", () => {
    const note: Insight = {
      id: "x",
      tone: "warn",
      title: "Fatigue is building",
      why: "",
      advice: "",
      action: { kind: "deload", label: "Start a deload" },
    };
    expect(widgetSnapshot(input({ notes: [note] })).note).toBe("Fatigue is building · Start a deload");
    expect(widgetSnapshot(input({ notes: [{ ...note, action: undefined }] })).note).toBe("Fatigue is building");
    expect(widgetSnapshot(input()).note).toBe("");
  });

  // The watch tile, complication and glance (2026-11-26): the call, the length and readiness, each short.
  it("gives the watches today's call, length and readiness in short pieces", () => {
    const signals = { ...r, signals: [{ points: 10, text: "Slept well" }], score: 82 };
    const s = widgetSnapshot(input({ readiness: signals }));
    expect(s.watch).toEqual({ call: expect.any(String), mins: `${plan.estMinutes} min`, ready: "Readiness 82" });
    expect(s.title).toBe(`${s.watch?.call} · ${s.watch?.mins}`);
  });

  it("leaves readiness off the watch while the score is only a placeholder, and on rest days and during a workout", () => {
    expect(widgetSnapshot(input({ readiness: { ...r, signals: [{ points: 0, text: "First workout" }] } })).watch?.ready).toBe("");
    expect(widgetSnapshot(input({ plan: { ...plan, items: [] } })).watch).toEqual({ call: "Rest day", mins: "", ready: "" });
    const active = widgetSnapshot(input({ active: true }));
    expect(active.watch).toEqual({ call: active.title, mins: "", ready: "" });
  });

  it("says rest day and why when nothing is planned", () => {
    const s = widgetSnapshot(input({ plan: { ...plan, items: [] } }));
    expect(s.kind).toBe("rest");
    expect(s.title).toBe("Rest day");
    expect(s.why).toMatch(/recovering/);
  });

  it("offers Resume and Log set while a workout runs", () => {
    const s = widgetSnapshot(input({ active: true }));
    expect(s.kind).toBe("active");
    expect(s.start).toBe("Resume");
    expect(s.log).toBe("Log set");
  });

  it("carries the day it was built for, so the widget knows when it's stale", () => {
    const a = widgetSnapshot(input());
    const b = widgetSnapshot(input({ now: NOW + 86_400_000 }));
    expect(a.day).not.toBe(b.day);
    expect(a.stale).toBe("Open Liftsmith for today's plan.");
  });
});

// The This week and Recovery widgets (Melvin chose both, 2026-11-15).
describe("weekPart", () => {
  const week = (over: Partial<WeekInput> = {}) =>
    weekPart({
      sessions: [],
      stretchDays: [],
      profile: { daysPerWeek: 3, calendar: undefined },
      streak: { thisWeek: 0, needed: 3, weeks: 0 },
      now: NOW,
      ...over,
    });

  it("draws seven days from the first day of the week, with today marked once", () => {
    const w = week();
    expect(w.days).toHaveLength(7);
    expect(w.days.filter((d) => d.today)).toHaveLength(1);
    expect(new Date(weekOf(NOW) + DAY / 2).getDay()).toBe(1);
  });

  it("marks trained and stretch days, planned days from today on, and never a missed day in the past", () => {
    const todayIdx = Math.round((new Date(NOW).setHours(0, 0, 0, 0) - weekOf(NOW)) / DAY);
    const w = week({
      sessions: [{ start: NOW }],
      stretchDays: [NOW + DAY],
      profile: { daysPerWeek: 7, calendar: undefined },
    });
    expect(w.days[todayIdx]!.m).toBe("done");
    if (todayIdx < 6) expect(w.days[todayIdx + 1]!.m).toBe("stretch");
    if (todayIdx < 5) expect(w.days[todayIdx + 2]!.m).toBe("plan");
    for (const d of w.days.slice(0, todayIdx)) expect(d.m).toBe("rest");
  });

  it("says what keeps the streak going, or that the goal is met", () => {
    expect(week({ streak: { thisWeek: 1, needed: 2, weeks: 6 } }).why).toBe("2 more days keep your 6-week streak.");
    expect(week({ streak: { thisWeek: 2, needed: 1, weeks: 0 } }).why).toBe("1 more day hits your goal.");
    expect(week({ streak: { thisWeek: 3, needed: 0, weeks: 4 } }).why).toBe("Goal met. Anything more is a bonus.");
    expect(week({ streak: { thisWeek: 2, needed: 1, weeks: 6 } }).title).toBe("2 of 3 this week");
    expect(week({ streak: { thisWeek: 2, needed: 1, weeks: 6 } }).streak).toBe("6-week streak");
    expect(week().streak).toBe("");
  });
});

describe("recoveryPart", () => {
  it("says everything is ready with no recent training", () => {
    const r = recoveryPart([], NOW);
    expect(r.areas.map((a) => a.n)).toEqual(["Chest", "Shoulders", "Back", "Arms", "Core", "Legs"]);
    expect(r.areas.every((a) => a.at === 0)).toBe(true);
    expect(r.all).toMatch(/^Everything has recovered/);
  });

  it("gives a hard-trained area the hour it's ready again, on the same model as the recovery map", () => {
    const sets = makeSets(8, { exerciseId: "bench-press", rir: 0, at: NOW - 3600_000 });
    const r = recoveryPart(sets, NOW);
    const chest = r.areas.find((a) => a.n === "Chest")!;
    expect(chest.at).toBeGreaterThan(NOW);
    expect(chest.at % 3600_000).toBe(0);
    // Ready by then, not an hour before (rounded up to the hour).
    expect(recovery(sets, chest.at).chest).toBeGreaterThanOrEqual(READY_AT);
    expect(chest.line).toMatch(/^Chest · ready /);
    expect(r.areas.find((a) => a.n === "Legs")!.at).toBe(0);
  });

  it("covers every muscle in exactly one area", () => {
    const all = Object.values(AREAS).flat();
    expect([...all].sort()).toEqual([...MUSCLES].sort());
  });
});
