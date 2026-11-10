import { describe, expect, it } from "vitest";

import { makeProfile, makeTestGym, NOW } from "@/test/factories";

import { generate } from "./generator";
import type { Insight } from "./insights";
import { readiness } from "./readiness";
import { callWhy } from "./why";
import { widgetSnapshot, type WidgetInput } from "./widget";

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
