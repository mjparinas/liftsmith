import { describe, expect, it } from "vitest";

import { defaultProfile } from "./defaults";
import {
  activityForDays,
  bmrKatch,
  bmrMifflin,
  bodyUpdates,
  calcTdee,
  changesSince,
  currentBodyFat,
  currentTdee,
  inferActivity,
  snapshotDue,
  tdeeHistory,
  validInputs,
} from "./tdee";
import type { AppEvent, Profile, TdeeEvent } from "./types";

const DAY = 86_400_000;
const NOW = new Date(2026, 10, 9, 12).getTime();
const profile = (p: Partial<Profile> = {}): Profile => ({
  ...defaultProfile(),
  bodyweight: 80,
  daysPerWeek: 3,
  sex: "male",
  birthYear: 1996,
  heightCm: 180,
  ...p,
});
const sessionsOn = (days: number[]) => days.map((d) => ({ start: NOW - d * DAY }));

describe("TDEE formulas", () => {
  it("Mifflin-St Jeor matches the published equation", () => {
    expect(bmrMifflin({ kg: 80, cm: 180, age: 30, sex: "male" })).toBe(1780);
    expect(bmrMifflin({ kg: 60, cm: 165, age: 30, sex: "female" })).toBeCloseTo(1320.25);
  });
  it("Katch-McArdle uses lean mass and takes over when body fat is known", () => {
    expect(bmrKatch(80, 15)).toBeCloseTo(370 + 21.6 * 68);
    const r = calcTdee({ kg: 80, cm: 180, age: 30, sex: "male", activity: "moderate", bodyFat: 15 });
    expect(r.formula).toBe("katch");
    expect(r.bmr).toBe(Math.round(370 + 21.6 * 68));
  });
  it("multiplies BMR by the activity factor and gives cut, bulk, BMI and protein", () => {
    const r = calcTdee({ kg: 80, cm: 180, age: 30, sex: "male", activity: "moderate" });
    expect(r.bmr).toBe(1780);
    expect(r.tdee).toBe(Math.round(1780 * 1.55));
    expect(r.levels.sedentary).toBe(Math.round(1780 * 1.2));
    expect(r.levels.athlete).toBe(Math.round(1780 * 1.9));
    expect(r.cut).toBe(r.tdee - 500);
    expect(r.bulk).toBe(r.tdee + 250);
    expect(r.bmi).toBe(24.7);
    expect(r.protein).toEqual([128, 176]);
  });
  it("never suggests cutting below BMR", () => {
    const r = calcTdee({ kg: 50, cm: 155, age: 60, sex: "female", activity: "sedentary" });
    expect(r.cut).toBe(r.bmr);
  });
  it("rejects incomplete or impossible inputs", () => {
    expect(validInputs({ kg: 80, cm: 180, age: 30, activity: "light" })).toBe(false);
    expect(validInputs({ kg: 80, cm: 18, age: 30, sex: "male", activity: "light" })).toBe(false);
    expect(validInputs({ kg: 80, cm: 180, age: 30, sex: "male", activity: "light", bodyFat: 80 })).toBe(false);
  });
});

describe("activity from training", () => {
  it("maps training days a week to the standard levels", () => {
    expect(activityForDays(0)).toBe("sedentary");
    expect(activityForDays(1)).toBe("light");
    expect(activityForDays(2)).toBe("light");
    expect(activityForDays(3)).toBe("moderate");
    expect(activityForDays(5)).toBe("moderate");
    expect(activityForDays(6)).toBe("heavy");
    expect(activityForDays(7)).toBe("heavy");
    expect(activityForDays(7, 12)).toBe("athlete");
  });
  it("uses the days-a-week goal until there are two weeks of history", () => {
    expect(inferActivity([], 4, NOW)).toEqual({ activity: "moderate", source: "plan", perWeek: 4 });
    expect(inferActivity(sessionsOn([1, 3, 5]), 6, NOW).source).toBe("plan");
  });
  it("once a week is light, six days a week is heavy", () => {
    expect(inferActivity(sessionsOn([1, 8, 15, 22]), 4, NOW)).toMatchObject({ activity: "light", source: "workouts", perWeek: 1 });
    const six = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26].map((d) => d + 0.1);
    expect(inferActivity(sessionsOn(six), 3, NOW)).toMatchObject({ activity: "heavy", source: "workouts" });
  });
  it("counts days, not sessions, so a double day doesn't inflate it", () => {
    const r = inferActivity(sessionsOn([1, 1.01, 8, 8.01, 15, 22]), 3, NOW);
    expect(r.perWeek).toBe(1);
  });
  it("a hand-picked level wins", () => {
    const cur = currentTdee([], sessionsOn([1, 8, 15, 22]), profile({ tdee: { activity: "athlete" } }), NOW);
    expect(cur.activity).toEqual({ activity: "athlete", source: "manual" });
  });
});

describe("current TDEE and snapshots", () => {
  const weigh = (kg: number, at: number): AppEvent => ({ type: "bodyweight", id: `w${at}`, at, kg });

  it("takes the latest weigh-in over the profile weight, and age from birth year", () => {
    const cur = currentTdee([weigh(82, NOW - 5 * DAY), weigh(81, NOW - DAY)], [], profile(), NOW);
    expect(cur.inputs.kg).toBe(81);
    expect(cur.inputs.age).toBe(30);
    expect(cur.result?.tdee).toBeGreaterThan(0);
  });
  it("lists what is missing instead of guessing", () => {
    const cur = currentTdee([], [], profile({ sex: undefined, heightCm: undefined }), NOW);
    expect(cur.result).toBeUndefined();
    expect(cur.missing).toEqual(["sex", "height"]);
  });
  it("records a first snapshot, then only when something that matters changes", () => {
    const p = profile();
    const first = snapshotDue(currentTdee([], [], p, NOW), [], NOW, "a")!;
    expect(first.changes).toEqual(["first"]);
    expect(snapshotDue(currentTdee([first], [], p, NOW), [first], NOW, "b")).toBeNull();
    const small = [first, weigh(80.3, NOW + 1)];
    expect(snapshotDue(currentTdee(small, [], p, NOW + 2), small, NOW + 2, "c")).toBeNull();
    const big = [first, weigh(78.5, NOW + 1)];
    const next = snapshotDue(currentTdee(big, [], p, NOW + 2), big, NOW + 2, "d")!;
    expect(next.changes).toEqual(["weight"]);
    expect(next.kcal).toBeLessThan(first.kcal);
  });
  it("records an activity change when training frequency moves the level", () => {
    const p = profile({ daysPerWeek: 3 });
    const first = snapshotDue(currentTdee([], [], p, NOW), [], NOW, "a")!;
    const later = NOW + 30 * DAY;
    const six = Array.from({ length: 28 }, (_, i) => i)
      .filter((d) => d % 7 !== 6)
      .map((d) => ({ start: later - d * DAY - 3600_000 }));
    const next = snapshotDue(currentTdee([first], six, p, later), [first], later, "b")!;
    expect(next.changes).toContain("activity");
    expect(next.activity).toBe("heavy");
    expect(next.activitySource).toBe("workouts");
  });
  it("notices age, height, sex and body fat changes", () => {
    const prev = { kg: 80, cm: 180, age: 30, sex: "male", activity: "moderate" } as TdeeEvent;
    expect(changesSince(prev, { kg: 80, cm: 182, age: 31, sex: "female", activity: "moderate", bodyFat: 20 })).toEqual([
      "age",
      "height",
      "sex",
      "bodyFat",
    ]);
  });
  it("a manual save records even without a change", () => {
    const p = profile();
    const first = snapshotDue(currentTdee([], [], p, NOW), [], NOW, "a")!;
    expect(snapshotDue(currentTdee([first], [], p, NOW), [first], NOW, "b", "manual")?.changes).toEqual(["recheck"]);
  });
  it("history keeps the last snapshot of each day, oldest first, and survives sync duplicates", () => {
    const ev = (id: string, at: number, kcal: number) => ({ type: "tdee", id, at, kcal }) as TdeeEvent;
    const h = tdeeHistory([ev("c", NOW, 2700), ev("a", NOW - 2 * DAY, 2800), ev("b", NOW - 1000, 2750), ev("c", NOW, 2700)]);
    expect(h.map((e) => e.id)).toEqual(["a", "c"]);
  });
});

describe("autofill from Health Connect / Apple Health", () => {
  it("fills height, skipping nonsense", () => {
    expect(bodyUpdates({ height: { value: 175.4, at: NOW } }, profile({ heightCm: undefined }))).toEqual({ heightCm: 175 });
    expect(bodyUpdates({ height: { value: 12, at: NOW } }, profile())).toEqual({});
  });
  it("takes body fat from the newest weigh-in that has one, or the value entered by hand if that's newer", () => {
    const ev: AppEvent[] = [
      { type: "bodyweight", id: "a", at: NOW - 2 * DAY, kg: 80, bodyFat: 19.04 },
      { type: "bodyweight", id: "b", at: NOW - DAY, kg: 80 },
    ];
    expect(currentBodyFat(ev, profile())).toBe(19);
    expect(currentBodyFat(ev, profile({ bodyFat: { pct: 17, at: NOW } }))).toBe(17);
    expect(currentBodyFat(ev, profile({ bodyFat: { pct: 17, at: NOW - 5 * DAY } }))).toBe(19);
    expect(currentBodyFat([], profile())).toBeUndefined();
  });
});
