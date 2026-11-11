import { describe, expect, it } from "vitest";

import {
  ffmi,
  ffmiBand,
  goalCalories,
  hrZones,
  ipfGl,
  leanToNextBand,
  macros,
  navyBodyFat,
  nextDotsLevel,
  tanakaMax,
  totalFor,
  waves,
  wilks,
  wilksCoefficient,
} from "./calculators";
import { changed, clampPlan, LEAD_IN, PRESETS, stateAt, totalSeconds } from "./intervals";
import { dots } from "./onerm";

describe("Wilks", () => {
  it("matches the published coefficient table", () => {
    // Wilks tables: 0.6086 for a 100 kg man, 1.1149 for a 60 kg woman.
    expect(wilksCoefficient(100, "male")).toBeCloseTo(0.6086, 3);
    expect(wilksCoefficient(60, "female")).toBeCloseTo(1.1149, 3);
    expect(wilks(700, 100, "male")).toBeCloseTo(426.0, 0);
  });
  it("clamps body weight at the ends instead of blowing up", () => {
    expect(wilksCoefficient(300, "male")).toBeCloseTo(wilksCoefficient(201.9, "male"), 9);
    expect(wilksCoefficient(20, "female")).toBeCloseTo(wilksCoefficient(26.51, "female"), 9);
    expect(wilks(0, 80, "male")).toBe(0);
  });
});

describe("IPF GL points", () => {
  it("scores a 700 kg classic total at 100 kg at about 88", () => {
    expect(ipfGl(700, 100, "male")).toBeCloseTo(88.43, 1);
  });
  it("scores bench only on its own scale, higher than the same weight in a three-lift total", () => {
    expect(ipfGl(200, 100, "male", "classicBench")).toBeGreaterThan(ipfGl(200, 100, "male"));
  });
  it("scores nothing under 35 kg or with no total", () => {
    expect(ipfGl(300, 30, "female")).toBe(0);
    expect(ipfGl(0, 80, "male")).toBe(0);
  });
});

describe("total for a score", () => {
  it("turns a DOTS target back into the total that scores it", () => {
    const t = totalFor(400, 80, (total, bw) => dots(total, bw, "male"));
    expect(dots(t, 80, "male")).toBeCloseTo(400, 6);
  });
  it("knows the next DOTS level", () => {
    expect(nextDotsLevel(150)).toBe(200);
    expect(nextDotsLevel(350)).toBe(400);
    expect(nextDotsLevel(520)).toBeNull();
  });
});

describe("macros", () => {
  it("puts protein first, fat at a quarter and carbs in the rest", () => {
    const m = macros(2500, 80, "cut");
    expect(m.protein).toBe(176);
    expect(m.fat).toBe(69);
    expect(m.carbs).toBe(294);
    expect(m.protein * 4 + m.fat * 9 + m.carbs * 4).toBeCloseTo(2500, -1);
    expect(m.split.protein + m.split.fat + m.split.carbs).toBeCloseTo(1, 6);
  });
  it("keeps fat at 0.6 g/kg or more when calories are low", () => {
    expect(macros(1800, 100, "maintain").fat).toBeGreaterThanOrEqual(60);
  });
  it("cuts 500 but never below BMR, and adds 250 for a lean bulk", () => {
    expect(goalCalories(2600, 1800, "cut")).toBe(2100);
    expect(goalCalories(2000, 1800, "cut")).toBe(1800);
    expect(goalCalories(2600, 1800, "bulk")).toBe(2850);
    expect(goalCalories(2600, 1800, "maintain")).toBe(2600);
  });
  it("gives nothing without calories or weight", () => {
    expect(macros(0, 80, "cut").kcal).toBe(0);
  });
});

describe("body fat from a tape measure", () => {
  it("uses waist and neck for men, and hips too for women", () => {
    expect(navyBodyFat("male", 180, 85, 38)).toBeCloseTo(16.1, 1);
    expect(navyBodyFat("female", 165, 75, 33, 100)).toBeCloseTo(29.4, 1);
    expect(navyBodyFat("female", 165, 75, 33)).toBeNull();
  });
  it("goes up with the waist", () => {
    expect(navyBodyFat("male", 180, 95, 38)!).toBeGreaterThan(navyBodyFat("male", 180, 85, 38)!);
  });
  it("refuses impossible measurements", () => {
    expect(navyBodyFat("male", 180, 38, 40)).toBeNull();
    expect(navyBodyFat("male", 0, 85, 38)).toBeNull();
  });
});

describe("FFMI", () => {
  it("is lean mass over height squared, normalized to 1.8 m", () => {
    const f = ffmi(80, 180, 15)!;
    expect(f.leanKg).toBeCloseTo(68, 6);
    expect(f.ffmi).toBeCloseTo(20.99, 2);
    expect(f.normalized).toBeCloseTo(f.ffmi, 6);
    expect(ffmi(80, 170, 15)!.normalized).toBeGreaterThan(ffmi(80, 170, 15)!.ffmi);
  });
  it("bands it, lower for women", () => {
    expect(ffmiBand(21, "male")).toBe("above");
    expect(ffmiBand(21, "female")).toBe("rare");
    expect(ffmiBand(26, "male")).toBe("rare");
    expect(ffmiBand(15, "male")).toBe("below");
  });
  it("says how much lean mass reaches the next band", () => {
    const f = ffmi(80, 180, 15)!;
    const next = leanToNextBand(f, 180, "male")!;
    expect(next.band).toBe("excellent");
    expect(ffmi(80 + next.kg, 180, (100 * (80 + next.kg - (f.leanKg + next.kg))) / (80 + next.kg))!.normalized).toBeCloseTo(22, 1);
    expect(leanToNextBand(ffmi(100, 175, 8)!, 175, "male")).toBeNull();
  });
});

describe("heart rate zones", () => {
  it("estimates max heart rate from age", () => {
    expect(tanakaMax(30)).toBe(187);
    expect(tanakaMax(60)).toBe(166);
  });
  it("splits max into five zones that meet without gaps", () => {
    const z = hrZones(190);
    expect(z[0]).toEqual({ zone: 1, low: 95, high: 113 });
    expect(z[4]!.high).toBe(190);
    for (let i = 1; i < z.length; i++) expect(z[i]!.low).toBe(z[i - 1]!.high + 1);
  });
  it("uses heart rate reserve when resting heart rate is known", () => {
    expect(hrZones(190, 60)[0]!.low).toBe(125);
    expect(hrZones(190, 60)[4]!.high).toBe(190);
  });
});

describe("training max waves", () => {
  it("builds four weeks from a training max, the last set of each hard week for max reps", () => {
    const w = waves(100, 0.9, 2.5);
    expect(w.tm).toBe(90);
    expect(w.weeks.map((x) => x.map((s) => s.weight))).toEqual([
      [57.5, 67.5, 77.5],
      [62.5, 72.5, 80],
      [67.5, 77.5, 85],
      [35, 45, 55],
    ]);
    expect(w.weeks[2]!.map((s) => s.reps)).toEqual([5, 3, 1]);
    expect(w.weeks[0]![2]!.amrap).toBe(true);
    expect(w.weeks[3]!.some((s) => s.amrap)).toBe(false);
  });
});

describe("interval timer", () => {
  const tabata = PRESETS.tabata;
  it("counts in, then works and rests round by round, with no rest after the last", () => {
    expect(stateAt(tabata, 0).phase).toBe("ready");
    expect(stateAt(tabata, LEAD_IN * 1000)).toMatchObject({ phase: "work", round: 1, left: 20_000 });
    expect(stateAt(tabata, (LEAD_IN + 25) * 1000)).toMatchObject({ phase: "rest", round: 1, left: 5_000 });
    expect(stateAt(tabata, (LEAD_IN + 30) * 1000)).toMatchObject({ phase: "work", round: 2 });
    expect(totalSeconds(tabata)).toBe(LEAD_IN + 8 * 20 + 7 * 10);
    expect(stateAt(tabata, totalSeconds(tabata) * 1000 - 1).phase).toBe("work");
    expect(stateAt(tabata, totalSeconds(tabata) * 1000).phase).toBe("done");
  });
  it("runs EMOM as back-to-back minutes", () => {
    const e = PRESETS.emom;
    expect(stateAt(e, (LEAD_IN + 61) * 1000)).toMatchObject({ phase: "work", round: 2, left: 59_000 });
    expect(totalSeconds(e)).toBe(LEAD_IN + 600);
  });
  it("notices a new phase or round", () => {
    expect(changed(stateAt(tabata, 4_000), stateAt(tabata, 5_000))).toBe(true);
    expect(changed(stateAt(tabata, 6_000), stateAt(tabata, 7_000))).toBe(false);
  });
  it("keeps a plan in range", () => {
    expect(clampPlan({ work: 0, rest: -3, rounds: 500 })).toEqual({ work: 5, rest: 0, rounds: 99 });
  });
});
