import { describe, expect, it } from "vitest";

import { makeTestGym } from "@/test/factories";

import { EXERCISE_BY_ID } from "./exercises";
import { barFor, roundLoad, stepLoad } from "./loads";
import { toKg } from "./units";

// Rounding a wanted weight to one the gym can make, and the − / + steps on the workout screen
// (mutation run, 2026-11-13: only reached through other features' tests before).

const ex = (id: string) => {
  const e = EXERCISE_BY_ID.get(id);
  if (!e) throw new Error(`no exercise ${id}`);
  return e;
};
const gym = makeTestGym(); // kg: 20 kg bar, plates down to 1.25 kg, dumbbells 2 to 50 kg in 2s, kettlebells 8 to 32 in 4s, machines in 5s
const lbGym = makeTestGym("commercial", "lb");

describe("barFor", () => {
  it("picks the trap bar, the EZ bar or the Olympic bar from what the exercise needs", () => {
    expect(barFor(ex("trap-bar-deadlift"), gym).id).toBe("trap");
    expect(barFor(ex("ez-curl"), gym).id).toBe("ez");
    expect(barFor(ex("bench-press"), gym).id).toBe("olympic");
  });

  it("falls back to the gym's first bar, then a standard bar in the gym's unit", () => {
    const onlyEz = { ...gym, bars: [{ id: "ez", name: "EZ", weight: 10 }] };
    expect(barFor(ex("bench-press"), onlyEz).weight).toBe(10);
    expect(barFor(ex("bench-press"), { ...gym, bars: [] })).toMatchObject({ id: "olympic", weight: 20 });
    expect(barFor(ex("bench-press"), { ...lbGym, bars: [] })).toMatchObject({ id: "olympic", weight: 45 });
  });
});

describe("roundLoad", () => {
  it("loads a barbell to the nearest weight the plates make, never below the bar", () => {
    expect(roundLoad(100, ex("bench-press"), gym)).toMatchObject({ kg: 100, loading: { exact: true } });
    expect(roundLoad(61, ex("bench-press"), gym).kg).toBe(60); // 60 and 62.5 can be made; 61 is nearer 60
    expect(roundLoad(62, ex("bench-press"), gym).kg).toBe(62.5);
    expect(roundLoad(5, ex("bench-press"), gym).kg).toBe(20);
    expect(roundLoad(-10, ex("bench-press"), gym).kg).toBe(20);
    expect(roundLoad(30, ex("trap-bar-deadlift"), gym).kg).toBe(30); // 25 kg trap bar plus 2.5 a side
  });

  it("works in pounds and returns kilograms", () => {
    const r = roundLoad(toKg(135, "lb"), ex("bench-press"), lbGym);
    expect(r.loading?.total).toBe(135);
    expect(r.kg).toBeCloseTo(toKg(135, "lb"), 6);
  });

  it("picks the nearest dumbbell and kettlebell, the lighter on a tie", () => {
    expect(roundLoad(21, ex("db-bench-press"), gym).kg).toBe(20);
    expect(roundLoad(21.5, ex("db-bench-press"), gym).kg).toBe(22);
    expect(roundLoad(100, ex("db-bench-press"), gym).kg).toBe(50);
    expect(roundLoad(14, ex("kb-goblet-squat"), gym).kg).toBe(12);
    expect(roundLoad(15, ex("kb-goblet-squat"), gym).kg).toBe(16);
    expect(roundLoad(13, { ...ex("db-bench-press") }, { ...gym, dumbbells: [] }).kg).toBe(13);
  });

  it("rounds a machine to its step, at least one step, with a default step per unit", () => {
    expect(roundLoad(42, ex("machine-chest-press"), gym).kg).toBe(40);
    expect(roundLoad(43, ex("machine-chest-press"), gym).kg).toBe(45);
    expect(roundLoad(1, ex("machine-chest-press"), gym).kg).toBe(5);
    expect(roundLoad(41, ex("machine-chest-press"), { ...gym, machineStep: 0 }).kg).toBe(40);
    expect(roundLoad(41.4, ex("machine-chest-press"), { ...gym, machineStep: 0 }).kg).toBe(42.5);
    expect(roundLoad(toKg(97, "lb"), ex("machine-chest-press"), { ...lbGym, machineStep: 0 }).kg).toBeCloseTo(toKg(95, "lb"), 6);
  });

  it("gives bodyweight exercises no load", () => {
    expect(roundLoad(80, ex("push-up"), gym)).toEqual({ kg: 0 });
  });
});

describe("stepLoad", () => {
  it("steps dumbbells and kettlebells to the next one owned, and stays at the ends", () => {
    expect(stepLoad(20, 1, ex("db-bench-press"), gym)).toBe(22);
    expect(stepLoad(20, -1, ex("db-bench-press"), gym)).toBe(18);
    expect(stepLoad(21, 1, ex("db-bench-press"), gym)).toBe(22);
    expect(stepLoad(21, -1, ex("db-bench-press"), gym)).toBe(20);
    expect(stepLoad(50, 1, ex("db-bench-press"), gym)).toBe(50);
    expect(stepLoad(2, -1, ex("db-bench-press"), gym)).toBe(2);
    expect(stepLoad(16, 1, ex("kb-goblet-squat"), gym)).toBe(20);
    expect(stepLoad(16, -1, ex("kb-goblet-squat"), gym)).toBe(12);
    // Unsorted lists still step in order.
    expect(stepLoad(10, 1, ex("db-bench-press"), { ...gym, dumbbells: [30, 12, 20] })).toBe(12);
  });

  it("steps machines by their step, never below zero", () => {
    expect(stepLoad(40, 1, ex("machine-chest-press"), gym)).toBe(45);
    expect(stepLoad(40, -1, ex("machine-chest-press"), gym)).toBe(35);
    expect(stepLoad(3, -1, ex("machine-chest-press"), gym)).toBe(0);
    expect(stepLoad(40, 1, ex("machine-chest-press"), { ...gym, machineStep: 0 })).toBe(42.5);
    expect(stepLoad(toKg(100, "lb"), 1, ex("machine-chest-press"), { ...lbGym, machineStep: 0 })).toBeCloseTo(toKg(105, "lb"), 6);
  });

  it("steps a barbell to the next total the plates make", () => {
    expect(stepLoad(60, 1, ex("bench-press"), gym)).toBe(62.5);
    expect(stepLoad(60, -1, ex("bench-press"), gym)).toBe(57.5);
    // With only 5 kg plates the next step is 10 kg away.
    const fives = { ...gym, plates: [{ weight: 5, count: 12 }] };
    expect(stepLoad(60, 1, ex("bench-press"), fives)).toBe(70);
    expect(stepLoad(60, -1, ex("bench-press"), fives)).toBe(50);
    // Nothing lighter than the empty bar, and nothing heavier than every plate on.
    expect(stepLoad(20, -1, ex("bench-press"), gym)).toBe(20);
    expect(stepLoad(60, 1, ex("bench-press"), { ...gym, plates: [{ weight: 20, count: 2 }] })).toBe(60);
  });

  it("leaves bodyweight exercises alone", () => {
    expect(stepLoad(10, 1, ex("push-up"), gym)).toBe(10);
  });
});
