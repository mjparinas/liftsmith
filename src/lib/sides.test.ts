// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultProfile } from "./defaults";
import { derive } from "./derive";
import { exercise, EXERCISES } from "./exercises";
import { countedReps, implementsFor, perSide, setVolume, totalReps, workingReps } from "./sides";
import { useApp } from "./store";
import type { SetEvent } from "./types";

// One dumbbell or a pair, one side at a time (competitor audit, Melvin 2026-11-09).

const NOW = new Date("2026-11-11T18:00:00").getTime();
let n = 0;
const set = (exerciseId: string, weight: number, reps: number, over: Partial<SetEvent> = {}): SetEvent => ({
  type: "set",
  id: `v${n++}`,
  at: NOW - 1000 + n,
  sessionId: "a",
  exerciseId,
  weight,
  reps,
  targetReps: reps,
  rir: 2,
  ...over,
});

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

  // Melvin, 2026-11-12: "make it clear that certain exercises require you to do one side and then the other".
  // The common one-side moves were missing (split squat, step-up, side plank, single-leg RDL, …), so they
  // showed plain "8 reps". Any move whose name says it's one-sided is flagged; the exceptions are listed.
  it("flags every move whose name says it's one side at a time", () => {
    const oneSided =
      /\b(single|one)[- ](arm|leg)\b|^one-|split squat|lunge|step-up|step-down|side plank|pistol|cossack|side-to-side squat|suitcase|archer|get-up|windmill|woodchop|pallof|anti-rotation|bird dog|kickstand|concentration|curtsy|copenhagen/i;
    const notOneSided = new Set([
      "one-and-a-half-squat", // "one-and-a-half" reps, both legs
    ]);
    const missing = EXERCISES.filter(
      (e) =>
        !e.cardio &&
        oneSided.test(e.name) &&
        !/carry|suitcase march|one-sided .*hold/i.test(e.name) &&
        !perSide(e.id) &&
        !notOneSided.has(e.id),
    ).map((e) => `${e.id} (${e.name})`);
    expect(missing).toEqual([]);
  });

  // Melvin, 2026-11-12: "dumbbell suitcase carry and most if not all carries are time based not side based,
  // don't say switch sides". Carries, marches and one-sided holds are one timed set.
  it("never treats a carry, march or one-sided hold as one side then the other", () => {
    const walked = EXERCISES.filter((e) => /carry|suitcase march|one-sided .*hold/i.test(e.name) && perSide(e.id)).map((e) => e.id);
    expect(walked).toEqual([]);
    for (const id of ["db-suitcase-carry", "kb-suitcase-carry", "kb-mixed-carry", "suitcase-hold", "suitcase-march"])
      expect(perSide(id), id).toBe(false);
  });

  it("halves what a rep counter saw on a one-side move, because it sees both sides", () => {
    expect(countedReps("split-squat", 16)).toBe(8);
    expect(countedReps("split-squat", 15)).toBe(8);
    expect(countedReps("back-squat", 5)).toBe(5);
  });

  it("flags the everyday one-side moves", () => {
    for (const id of ["split-squat", "reverse-lunge", "step-up", "single-leg-rdl", "side-plank", "bird-dog", "db-concentration-curl"])
      expect(perSide(id), id).toBe(true);
    expect(implementsFor(exercise("db-concentration-curl"))).toBe(1);
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
    useApp.setState({
      active: { ...a, plan: { ...a.plan, items: [first, ...a.plan.items.slice(1)] }, warm: undefined, weight: 30, reps: 10 },
    });
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
