import { describe, expect, it } from "vitest";

import { AVERAGE, canShape, factors, LIMITS, shapeBody, statsFrom } from "./bodyShape";
import { BODIES } from "./demo/rig";
import type { AppEvent } from "./types";

const avgMale = { heightCm: 176, weightKg: 24 * 1.76 ** 2 };

describe("body shape", () => {
  it("leaves the average figure as drawn", () => {
    const f = factors("male", { ...avgMale, bodyFat: AVERAGE.male.bodyFat });
    for (const [k, v] of Object.entries(f)) expect(v, k).toBeCloseTo(1, 5);
  });

  it("gets wider with a higher BMI and narrower with a lower one", () => {
    const heavy = factors("male", { heightCm: 176, weightKg: 100 });
    const light = factors("male", { heightCm: 176, weightKg: 60 });
    expect(heavy.waist).toBeGreaterThan(1);
    expect(heavy.thigh).toBeGreaterThan(1);
    expect(light.waist).toBeLessThan(1);
  });

  it("puts extra body fat on the waist first, and shows less definition", () => {
    const f = factors("female", { bodyFat: 38 });
    expect(f.waist).toBeGreaterThan(f.hips);
    expect(f.hips).toBeGreaterThan(f.shoulders);
    expect(f.def).toBeLessThan(1);
    expect(factors("female", { bodyFat: 18 }).def).toBeGreaterThan(1);
  });

  it("lets a tape measurement set its own part, against height", () => {
    const f = factors("male", { heightCm: 176, measures: { arm: 40, waist: 80 } });
    expect(f.arm).toBeCloseTo(40 / 33, 5);
    expect(f.waist).toBeCloseTo(80 / 88, 5);
    // The same arm on a taller lifter is relatively thinner.
    expect(factors("male", { heightCm: 196, measures: { arm: 40 } }).arm).toBeLessThan(f.arm);
  });

  it("never draws a stick or a ball from a typo", () => {
    const f = factors("male", { heightCm: 176, weightKg: 400, bodyFat: 60, measures: { waist: 290, arm: 6 } });
    for (const k of ["hips", "waist", "chest", "shoulders", "neck", "arm", "forearm", "thigh", "calf"] as const) {
      expect(f[k]).toBeGreaterThanOrEqual(LIMITS[0]);
      expect(f[k]).toBeLessThanOrEqual(LIMITS[1]);
    }
  });

  it("changes girth only, never bone lengths", () => {
    const base = BODIES.male;
    const b = shapeBody("male", { heightCm: 176, weightKg: 100, bodyFat: 30 });
    expect(b.shW).toBeGreaterThan(base.shW);
    expect(b.torsoFront.map((r) => r[0])).toEqual(base.torsoFront.map((r) => r[0]));
    expect(b.side.thigh.length).toBe(base.side.thigh.length);
    expect(b.torsoFront[2]![1]!).toBeGreaterThan(base.torsoFront[2]![1]!);
  });

  it("needs a weight with a height, a body fat or a measurement", () => {
    expect(canShape({})).toBe(false);
    expect(canShape({ weightKg: 80 })).toBe(false);
    expect(canShape({ weightKg: 80, heightCm: 180 })).toBe(true);
    expect(canShape({ bodyFat: 20 })).toBe(true);
    expect(canShape({ measures: { waist: 80 } })).toBe(true);
  });

  it("reads the latest weigh-in, body fat and measurement of each site", () => {
    const events: AppEvent[] = [
      { id: "a", at: 1, type: "bodyweight", kg: 90, bodyFat: 25 },
      { id: "b", at: 3, type: "bodyweight", kg: 85 },
      { id: "c", at: 2, type: "measure", site: "waist", cm: 90 },
      { id: "d", at: 4, type: "measure", site: "waist", cm: 86 },
    ];
    expect(statsFrom({ sex: "male", heightCm: 180, bodyweight: 70 }, events)).toEqual({
      sex: "male",
      heightCm: 180,
      weightKg: 85,
      bodyFat: 25,
      measures: { waist: 86 },
    });
  });
});
