// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { defaultProfile, makeGym } from "./defaults";
import { exercise, EXERCISE_BY_ID, EXERCISES, registerCustom } from "./exercises";
import { generate } from "./generator";
import { effortSignal, target } from "./progression";
import { useApp } from "./store";
import type { AppEvent, SetEvent } from "./types";

// Table stakes (2026-11-09): notes on exercises, how hard a set really was, and the lifter's own exercises.

const NOW = new Date("2026-11-11T18:00:00").getTime();
const D = 86400_000;
const profile = { ...defaultProfile(NOW - 3 * D), onboarded: true, bodyweight: 80, goal: "muscle" as const };
const gym = makeGym("commercial", "kg", "g1");

const sets = (over: Partial<SetEvent> = {}): SetEvent[] =>
  [0, 1, 2].map((i) => ({
    type: "set",
    id: `s${i}`,
    at: NOW - D + i * 1000,
    sessionId: "a",
    exerciseId: "back-squat",
    weight: 100,
    reps: 7,
    targetReps: 7,
    rir: 2,
    ...over,
  }));
const effort = (setId: string, rir: number): AppEvent => ({ type: "effort", id: `e-${setId}`, at: NOW - D + 5000, setId, rir });

describe("set effort", () => {
  it("reads as easy when sets had two or more reps left beyond the plan", () => {
    const s = sets();
    expect(effortSignal([...s, effort("s0", 4), effort("s1", 4)], s)).toBe(1);
  });

  it("reads as hard when the lifter went closer to failure than planned", () => {
    const s = sets();
    expect(effortSignal([...s, effort("s0", 0), effort("s1", 1)], s)).toBe(-1);
  });

  it("says nothing without ratings, or when they match the plan", () => {
    const s = sets();
    expect(effortSignal(s, s)).toBe(0);
    expect(effortSignal([...s, effort("s0", 2)], s)).toBe(0);
    expect(effortSignal([...s, effort("other", 0)], s)).toBe(0);
  });

  it("moves the weight up when every set felt easy, before the top of the rep range", () => {
    const ex = exercise("back-squat");
    const s = sets();
    const plain = target(ex, s, profile, gym, NOW);
    expect(plain.weight).toBe(100);
    expect(plain.reps).toBe(8);
    const easy = target(ex, [...s, effort("s0", 4), effort("s1", 4), effort("s2", 4)], profile, gym, NOW);
    expect(easy.weight).toBeGreaterThan(100);
  });

  it("drops a step when the sets were harder than planned", () => {
    const ex = exercise("back-squat");
    const s = sets();
    const hard = target(ex, [...s, effort("s0", 0), effort("s1", 0)], profile, gym, NOW);
    expect(hard.weight).toBeLessThan(100);
  });
});

describe("custom exercises", () => {
  const ev: AppEvent = {
    type: "customExercise",
    id: "c1",
    at: NOW,
    exercise: { id: "custom-landmine", name: "Landmine press", primary: ["chest"], secondary: [], load: "barbell", compound: true },
  };

  it("registers once into the library, as a custom exercise", () => {
    const before = EXERCISES.length;
    registerCustom([ev]);
    registerCustom([ev]);
    expect(EXERCISES.length).toBe(before + 1);
    const ex = EXERCISE_BY_ID.get("custom-landmine")!;
    expect(ex).toMatchObject({ name: "Landmine press", custom: true, load: "barbell", pattern: "hpush" });
    expect(ex.needs).toContain("barbell");
  });

  it("is never planned by the generator", () => {
    registerCustom([ev]);
    for (let d = 0; d < 7; d++) {
      const plan = generate({ gym, profile, events: [], minutes: 90, now: NOW + d * D });
      expect(plan.items.some((i) => i.exerciseId.startsWith("custom-"))).toBe(false);
    }
  });

  it("gets a starting weight like any other lift", () => {
    registerCustom([ev]);
    const t = target(exercise("custom-landmine"), [], profile, gym, NOW);
    expect(t.weight).toBeGreaterThan(0);
  });
});

describe("store: notes, effort and custom exercises", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useApp.getState().reset();
  });

  it("keeps a trimmed note, at most 500 characters", () => {
    useApp.getState().addNote("back-squat", "  belt on the third set  ");
    useApp.getState().addNote("back-squat", "x".repeat(900));
    const notes = useApp.getState().events.filter((e) => e.type === "note");
    expect(notes.map((n) => (n.type === "note" ? n.text.length : 0))).toEqual([21, 500]);
  });

  it("rates a set once", () => {
    useApp.getState().rateEffort("s1", 9);
    useApp.getState().rateEffort("s1", 1);
    const e = useApp.getState().events.filter((x) => x.type === "effort");
    expect(e).toHaveLength(1);
    expect(e[0]).toMatchObject({ setId: "s1", rir: 4 });
  });

  it("adds an exercise that can be looked up straight away", () => {
    const id = useApp.getState().addCustomExercise({ name: "  Cable crunch ", primary: "abs", load: "machine", compound: false });
    expect(exercise(id)).toMatchObject({ name: "Cable crunch", primary: ["abs"], custom: true, pattern: "isolation" });
  });
});
