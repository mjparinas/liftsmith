// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { cycleLength, cycleSignal, cycleState, startOfDay } from "./cycle";
import { defaultProfile, makeGym } from "./defaults";
import { readiness } from "./readiness";
import { useApp } from "./store";
import type { AppEvent } from "./types";

const DAY = 86_400_000;
const NOW = new Date("2026-11-20T09:00:00").getTime();
const T = startOfDay(NOW);
const period = (day: number, id = `c${day}`): AppEvent => ({ type: "cycle", id, at: day, day });

describe("cycle phase", () => {
  it("uses the lifter's own typical length, ignoring implausible gaps", () => {
    expect(cycleLength([])).toBe(28);
    expect(cycleLength([0, 30 * DAY, 60 * DAY, 92 * DAY])).toBe(30);
    expect(cycleLength([0, 10 * DAY, 40 * DAY])).toBe(30); // the 10-day gap is ignored
  });

  it("knows the day and phase, and says nothing when there's no recent log", () => {
    expect(cycleState([], NOW)).toBeNull();
    expect(cycleState([period(T)], NOW)).toMatchObject({ day: 1, phase: "period" });
    expect(cycleState([period(T - 8 * DAY)], NOW)).toMatchObject({ day: 9, phase: "follicular" });
    expect(cycleState([period(T - 14 * DAY)], NOW)).toMatchObject({ day: 15, phase: "ovulation" });
    expect(cycleState([period(T - 25 * DAY)], NOW)).toMatchObject({ day: 26, phase: "late-luteal" });
    expect(cycleState([period(T - 70 * DAY)], NOW)).toBeNull();
  });

  it("nudges readiness a little, and only when opted in", () => {
    expect(cycleSignal(cycleState([period(T)], NOW))?.points).toBe(-5);
    expect(cycleSignal(cycleState([period(T - 8 * DAY)], NOW))?.points).toBe(3);
    const ev: AppEvent[] = [period(T)];
    const profile = defaultProfile(NOW);
    expect(readiness(ev, profile, NOW, { cycle: false }).signals.some((s) => s.text.startsWith("Cycle"))).toBe(false);
  });
});

describe("logging and forgetting", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useApp.getState().reset();
    const g = makeGym("commercial", "kg", "g");
    useApp.setState({
      gyms: [g],
      profile: { ...defaultProfile(), onboarded: true, activeGymId: "g", cycle: { enabled: true, consentAt: 1 } },
    });
  });

  it("logs a period once per day and erases everything on turn-off", async () => {
    const s = useApp.getState;
    const today = startOfDay(Date.now());
    s().logPeriod(today);
    s().logPeriod(today);
    expect(s().events.filter((e) => e.type === "cycle")).toHaveLength(1);
    expect(s().readiness?.signals.some((x) => x.text.startsWith("Cycle day"))).toBe(true);
    await s().forgetCycle();
    expect(s().events.some((e) => e.type === "cycle")).toBe(false);
    expect(s().profile.cycle).toBeUndefined();
  });
});
