import { describe, expect, it } from "vitest";
import { ageForVo2, expectedVo2, fitnessAge, HUNT_REFERENCE, MAX_AGE, MIN_AGE, strengthWeek } from "./fitnessAge";
import { dayOf } from "./twin";
import type { AppEvent } from "./types";

const DAY = 86_400_000;
const NOW = new Date("2026-11-09T09:00:00").getTime();
const vo2 = (value: number, ago: number): AppEvent => {
  const at = NOW - ago * DAY;
  return { type: "health", id: `v-${ago}-${value}`, at, metric: "vo2max", day: dayOf(at), value };
};
const man45 = { birthYear: 1981, sex: "male" as const };

describe("reference values", () => {
  it("are Loe et al. 2013's HUNT 3 means and fall with age", () => {
    expect(HUNT_REFERENCE.male[0]).toEqual([25, 54.4]);
    expect(HUNT_REFERENCE.female[5]).toEqual([75, 28.3]);
    for (const sex of ["male", "female"] as const) {
      for (let a = MIN_AGE; a < MAX_AGE; a++) expect(expectedVo2(sex, a + 1)).toBeLessThan(expectedVo2(sex, a));
    }
  });

  it("hits the published means at each group's middle and interpolates between", () => {
    expect(expectedVo2("male", 45)).toBeCloseTo(47.2);
    expect(expectedVo2("female", 55)).toBeCloseTo(34.4);
    expect(expectedVo2("male", 40)).toBeCloseTo((49.1 + 47.2) / 2);
  });

  it("inverts: the age for a typical reading is that age", () => {
    for (const a of [22, 31, 47, 58, 69, 78]) {
      expect(ageForVo2("male", expectedVo2("male", a))).toBeCloseTo(a, 1);
      expect(ageForVo2("female", expectedVo2("female", a))).toBeCloseTo(a, 1);
    }
  });

  it("stays within 20 to 80", () => {
    expect(ageForVo2("male", 75)).toBe(MIN_AGE);
    expect(ageForVo2("female", 12)).toBe(MAX_AGE);
  });
});

describe("fitness age", () => {
  it("says what's missing instead of guessing", () => {
    expect(fitnessAge([], {}, NOW)).toEqual({ ok: false, missing: ["vo2", "age", "sex"] });
    expect(fitnessAge([vo2(45, 3)], { birthYear: 1981 }, NOW)).toEqual({ ok: false, missing: ["sex"] });
    // Readings older than 120 days don't count.
    expect(fitnessAge([vo2(45, 130)], man45, NOW)).toEqual({ ok: false, missing: ["vo2"] });
  });

  it("matches age for a typical reading and gives a range around it", () => {
    const r = fitnessAge([vo2(47.2, 2)], man45, NOW);
    if (!r.ok) throw new Error("expected a result");
    expect(r.value.age).toBe(45);
    expect(r.value.fitnessAge).toBe(45);
    expect(r.value.verdict).toBe("typical");
    expect(r.value.low).toBeLessThan(45);
    expect(r.value.high).toBeGreaterThan(45);
  });

  it("is younger for a fitter reading and older for a lower one", () => {
    const fit = fitnessAge([vo2(52, 1)], man45, NOW);
    const low = fitnessAge([vo2(40, 1)], man45, NOW);
    if (!fit.ok || !low.ok) throw new Error("expected results");
    expect(fit.value.verdict).toBe("younger");
    expect(fit.value.fitnessAge).toBeLessThan(40);
    expect(low.value.verdict).toBe("older");
    expect(low.value.fitnessAge).toBeGreaterThan(55);
  });

  it("uses the median of the newest five readings, so one odd reading doesn't swing it", () => {
    const evs = [vo2(30, 100), vo2(47, 20), vo2(47.5, 15), vo2(60, 10), vo2(47.2, 5), vo2(46.8, 1)];
    const r = fitnessAge(evs, man45, NOW);
    if (!r.ok) throw new Error("expected a result");
    expect(r.value.readings).toBe(5);
    expect(r.value.vo2).toBe(47.2);
    expect(r.value.day).toBe(dayOf(NOW - DAY));
  });

  it("uses the women's reference for women", () => {
    const r = fitnessAge([vo2(38.4, 1)], { birthYear: 1981, sex: "female" }, NOW);
    if (!r.ok) throw new Error("expected a result");
    expect(r.value.fitnessAge).toBe(45);
  });

  it("flags the ends of the reference", () => {
    const r = fitnessAge([vo2(70, 1)], man45, NOW);
    if (!r.ok) throw new Error("expected a result");
    expect(r.value.atFloor).toBe(true);
    expect(r.value.fitnessAge).toBe(MIN_AGE);
  });
});

describe("strength training this week", () => {
  it("counts distinct days and minutes in the last 7 days", () => {
    const s = (ago: number, min: number) => ({ start: NOW - ago * DAY, seconds: min * 60 });
    expect(strengthWeek([s(0.1, 50), s(0.2, 20), s(3, 60), s(8, 60)], NOW)).toEqual({ days: 2, minutes: 130 });
  });
});
