// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultProfile } from "./defaults";
import { derive } from "./derive";
import { exercise } from "./exercises";
import { implementsFor, perSide, setVolume, totalReps, workingReps } from "./sides";
import { useApp } from "./store";
import type { SetEvent } from "./types";

// One dumbbell or a pair, one side at a time (competitor audit, Melvin 2026-11-09).

const NOW = new Date("2026-11-11T18:00:00").getTime();
let n = 0;
const set = (exerciseId: string, weight: number, reps: number, over: Partial<SetEvent> = {}): SetEvent => ({ type: "set", id: `v${n++}`, at: NOW - 1000 + n, sessionId: "a", exerciseId, weight, reps, targetReps: reps, rir: 2, ...over });

describe("implements and sides", () => {
  it("knows which exercises use one dumbbell or kettlebell and which use a pair", () => {
    expect(implementsFor(exercise("db-bench-press"))).toBe(2);
    expect(implementsFor(exercise("bulgarian-split-squat"))).toBe(2);
    expect(implementsFor(exercise("db-row"))).toBe(1);
    expect(implementsFor(exercise("goblet-squat"))).toBe(1);
    expect(implementsFor(exercise("db-overhead-extension"))).toBe(1);
    expect(implementsFor(exercise("kb-swing"))).toBe(1);
    expect(implementsFor(exercise("bench-press"))).toBe(1);
  });

  it("knows which exercises are logged per side", () => {
    expect(perSide("db-row")).toBe(true);
    expect(perSide("bulgarian-split-squat")).toBe(true);
    expect(perSide("db-bench-press")).toBe(false);
    expect(perSide("back-squat")).toBe(false);
  });
});

describe("volume", () => {
  it("counts both dumbbells of a pair", () => {
    expect(setVolume(set("db-bench-press", 20, 10))).toBe(400);
  });

  it("counts both sides of a one-arm exercise", () => {
    expect(setVolume(set("db-row", 30, 10))).toBe(600);
    expect(totalReps(set("db-row", 30, 8, { repsL: 10, repsR: 8 }))).toBe(18);
    expect(setVolume(set("db-row", 30, 8, { repsL: 10, repsR: 8 }))).toBe(540);
  });

  it("counts a pair and both legs on split squats", () => {
    expect(setVolume(set("bulgarian-split-squat", 16, 8))).toBe(16 * 2 * 16);
  });

  it("leaves barbells and machines as weight times reps", () => {
    expect(setVolume(set("back-squat", 100, 5))).toBe(500);
  });

  it("goes by what the set recorded, not today's exercise list", () => {
    expect(setVolume(set("db-bench-press", 20, 10, { implements: 1 }))).toBe(200);
  });

  it("judges progression on the weaker side", () => {
    expect(workingReps(set("db-row", 30, 8, { repsL: 10, repsR: 8 }))).toBe(8);
    expect(workingReps(set("db-row", 30, 10))).toBe(10);
  });

  it("feeds session and total volume", () => {
    const stats = derive([set("db-bench-press", 20, 10), set("back-squat", 100, 5)], NOW);
    expect(stats.totalVolume).toBe(900);
    expect(stats.sessions[0].volume).toBe(900);
  });
});

describe("logging sides in a workout", () => {
  const profile = { ...defaultProfile(NOW - 3 * 86400_000), onboarded: true, bodyweight: 80 };
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...profile, activeGymId: id });
    useApp.getState().replan();
  });
  afterEach(() => vi.useRealTimers());

  function onRow() {
    const s = useApp.getState;
    s().start();
    const a = s().active!;
    const first = { ...a.plan.items[0], exerciseId: "db-row", warmup: undefined, setTargets: undefined, slot: undefined, group: undefined };
    useApp.setState({ active: { ...a, plan: { ...a.plan, items: [first, ...a.plan.items.slice(1)] }, warm: undefined, weight: 30, reps: 10 } });
    return s;
  }

  it("logs both sides the same with one tap, and records one dumbbell", () => {
    const s = onRow();
    s().logSet();
    const logged = s().events.find((e): e is SetEvent => e.type === "set")!;
    expect(logged).toMatchObject({ exerciseId: "db-row", weight: 30, reps: 10, implements: 1 });
    expect(logged.repsL).toBeUndefined();
  });

  it("logs left and right when the sides differ, with the weaker side as the reps", () => {
    const s = onRow();
    s().adjustRight(8);
    s().logSet();
    const logged = s().events.find((e): e is SetEvent => e.type === "set")!;
    expect(logged).toMatchObject({ reps: 8, repsL: 10, repsR: 8 });
    // The next set goes back to "both sides the same".
    expect(s().active!.repsR).toBeUndefined();
  });
});
