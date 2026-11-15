import { describe, expect, it } from "vitest";

import { defaultProfile } from "./defaults";
import { foodGoal, foodTargets, targetFor } from "./foodTargets";
import { localDayKey, nutritionReadings } from "./health";
import { t } from "./i18n";
import { insights } from "./insights";
import { foodDays, LOGGED_KCAL, measuredTdee, proteinOnly, proteinShort, underFuelled, weekIntake } from "./nutrition";
import { findPlateaus } from "./plateau";
import { healthSignals } from "./readiness";
import { currentTdee } from "./tdee";
import { healthExternal } from "./twin";
import type { AppEvent, BodyweightEvent, HealthEvent, Profile } from "./types";

// Food from a food app through Health Connect or Apple Health, turned into coach's notes (Melvin, 2026-11-11).

const D = 86_400_000;
const NOW = new Date("2026-11-11T18:00:00").getTime();
// 80 kg on a maintain goal: the protein target is 1.8 g per kg, 144 g; short is under 85% of it (122.4 g).
const base: Profile = {
  ...defaultProfile(NOW - 60 * D),
  onboarded: true,
  bodyweight: 80,
  sex: "male",
  heightCm: 180,
  birthYear: 1991,
  goal: "strength",
};

let n = 0;
const day = (ago: number) => localDayKey(NOW - ago * D);
const food = (ago: number, kcal: number, protein?: number): HealthEvent[] => {
  const d = day(ago);
  const at = NOW - ago * D;
  const out: HealthEvent[] = [{ type: "health", id: `k${n++}`, at, metric: "kcalIn", day: d, value: kcal }];
  if (protein !== undefined) out.push({ type: "health", id: `p${n++}`, at, metric: "protein", day: d, value: protein });
  return out;
};
const days = (list: [number, number, number?][]) => list.flatMap(([ago, kcal, protein]) => food(ago, kcal, protein));
const ids = (events: AppEvent[], profile = base) => insights({ events, profile, now: NOW }).map((i) => i.id);

describe("reading food from Health", () => {
  it("turns food days into calorie and protein readings, dropping junk", () => {
    const r = nutritionReadings([
      { day: "2026-11-10", kcal: 2312.4, protein: 141.6 },
      { day: "2026-11-09", kcal: 0, protein: 900 },
      { day: "not a day", kcal: 2000 },
    ]);
    expect(r.map((x) => [x.metric, x.day, x.value])).toEqual([
      ["kcalIn", "2026-11-10", 2312],
      ["protein", "2026-11-10", 142],
    ]);
    // The end of that local day, like steps.
    expect(localDayKey(r[0]!.at)).toBe("2026-11-10");
    expect(localDayKey(r[0]!.at + 1)).toBe("2026-11-11");
  });
});

describe("food days", () => {
  it("keeps finished, fully logged days, newest reading per day", () => {
    const events = [
      ...days([
        [0, 2500, 150], // today: still being logged
        [1, 600, 40], // half logged
        [2, 2100, 120],
        [30, 2000, 100], // too old
      ]),
      { type: "health", id: "late", at: NOW - 1.5 * D, metric: "protein", day: day(2), value: 90 } as HealthEvent,
    ];
    expect(foodDays(events, NOW)).toEqual([{ day: day(2), kcal: 2100, protein: 90 }]);
    expect(LOGGED_KCAL).toBe(1000);
  });

  it("finds a run of short protein days, ending recently", () => {
    const short = foodDays(
      days([
        [4, 2400, 140],
        [3, 2200, 90],
        [2, 2300, 100],
        [1, 2100, 80],
      ]),
      NOW,
    );
    expect(proteinShort(short, 128, NOW)).toEqual({ days: 3, avg: 90, target: 128, last: day(1) });
    // Two short days aren't a run yet.
    expect(proteinShort(short.slice(0, 3), 128, NOW)).toBeNull();
    // A near miss (115 g, over 85% of 128) breaks the run.
    expect(
      proteinShort(
        foodDays(
          days([
            [3, 2200, 90],
            [2, 2300, 115],
            [1, 2100, 80],
          ]),
          NOW,
        ),
        128,
        NOW,
      ),
    ).toBeNull();
    // A run that stopped a week ago has gone stale.
    expect(
      proteinShort(
        foodDays(
          days([
            [9, 2200, 90],
            [8, 2300, 90],
            [7, 2100, 80],
          ]),
          NOW,
        ),
        128,
        NOW,
      ),
    ).toBeNull();
  });

  it("averages the week once four days are logged", () => {
    expect(
      weekIntake(
        foodDays(
          days([
            [3, 2000],
            [2, 2200],
            [1, 2400],
          ]),
          NOW,
        ),
        NOW,
      ),
    ).toBeNull();
    expect(
      weekIntake(
        foodDays(
          days([
            [4, 1800],
            [3, 2000],
            [2, 2200],
            [1, 2400],
          ]),
          NOW,
        ),
        NOW,
      ),
    ).toEqual({ days: 4, avg: 2100, last: day(1) });
  });
});

describe("food coach's notes", () => {
  it("says protein has been short, by how much, and what to add", () => {
    const events = days([
      [3, 2600, 90],
      [2, 2600, 95],
      [1, 2600, 85],
    ]);
    const note = insights({ events, profile: base, now: NOW }).find((i) => i.id.startsWith("protein-short-"))!;
    expect(note.title).toBe(t("ins.proteinShort.title", { count: 3 }));
    expect(note.why).toBe(t("ins.proteinShort.why", { avg: 90, target: 144 }));
    expect(note.advice).toBe(t("ins.proteinShort.advice", { gap: 55 }));
    expect(note.action).toMatchObject({ kind: "go", route: "tools/macros" });
  });

  it("says nothing without food data, or when protein is on target", () => {
    expect(ids([]).some((id) => id.startsWith("protein") || id.startsWith("eat-"))).toBe(false);
    expect(
      ids(
        days([
          [3, 2600, 140],
          [2, 2600, 135],
          [1, 2600, 150],
        ]),
      ).some((id) => id.startsWith("protein")),
    ).toBe(false);
  });

  it("flags eating too little to build muscle against TDEE", () => {
    // About 2,720 kcal maintenance (80 kg, 180 cm, 35, moderate): 2,300 is 400 under, short of a cut's 2,220.
    const events = days([
      [4, 2300, 140],
      [3, 2250, 140],
      [2, 2350, 140],
      [1, 2300, 140],
    ]);
    const muscle = { ...base, goal: "muscle" as const };
    expect(ids(events, muscle).some((id) => id.startsWith("eat-low-muscle-"))).toBe(true);
    // The same food on a strength goal is a deficit, but not a very big one: no note.
    expect(ids(events).some((id) => id.startsWith("eat-low"))).toBe(false);
    // Without sex, age or height there's no TDEE to judge against.
    expect(ids(events, { ...muscle, heightCm: undefined }).some((id) => id.startsWith("eat-low"))).toBe(false);
  });

  it("flags a very big deficit on other goals", () => {
    const events = days([
      [4, 1200, 140],
      [3, 1300, 140],
      [2, 1100, 140],
      [1, 1250, 140],
    ]);
    expect(ids(events).some((id) => id.startsWith("eat-low-"))).toBe(true);
  });

  it("adds the food numbers to a weight-dropping note instead of a second note", () => {
    const weigh = (ago: number, kg: number): BodyweightEvent => ({ type: "bodyweight", id: `w${n++}`, at: NOW - ago * D, kg });
    const events = [
      weigh(28, 84),
      weigh(21, 83),
      weigh(14, 82),
      weigh(7, 81),
      weigh(1, 80),
      ...days([
        [4, 1200, 140],
        [3, 1300, 140],
        [2, 1100, 140],
        [1, 1250, 140],
      ]),
    ];
    const notes = insights({ events, profile: base, now: NOW });
    const drop = notes.find((i) => i.id.startsWith("weight-down-"))!;
    expect(drop.why).toContain("1210 kcal");
    expect(notes.some((i) => i.id.startsWith("eat-low-"))).toBe(false);
  });
});

describe("targets from a coach", () => {
  const coach = (kcal: number | null, protein: number | null) => ({ kcal, protein, coach: "Sam" });

  it("protein goes by the coach's target instead of the body-weight rule", () => {
    // 125 g a day is fine for 80 kg (144 g, short under 122.4 g) but short of a coach's 160 g.
    const events = days([
      [1, 2400, 125],
      [2, 2400, 125],
      [3, 2400, 125],
    ]);
    expect(ids(events).some((id) => id.startsWith("protein-short-"))).toBe(false);
    const note = insights({ events, profile: base, now: NOW, coachTargets: coach(null, 160) }).find((i) =>
      i.id.startsWith("protein-short-"),
    )!;
    expect(note.why).toBe(t("ins.proteinShort.whyCoach", { avg: 125, target: 160, name: "Sam" }));
    expect(proteinShort([], 0, NOW)).toBeNull();
  });

  it("calories are judged against the coach's target alone, 10% either way", () => {
    const week = (kcal: number) =>
      days([
        [1, kcal],
        [2, kcal],
        [3, kcal],
        [4, kcal],
      ]);
    const notes = (kcal: number, target: number) =>
      insights({ events: week(kcal), profile: base, now: NOW, coachTargets: coach(target, null) }).map((i) => i.id);
    expect(notes(1900, 2400).some((id) => id.startsWith("coach-kcal-") && id.endsWith("-under"))).toBe(true);
    expect(notes(2900, 2400).some((id) => id.startsWith("coach-kcal-") && id.endsWith("-over"))).toBe(true);
    expect(notes(2300, 2400).some((id) => id.startsWith("coach-kcal-"))).toBe(false);
    // With a coach's calorie target, the maintenance-based notes stay quiet.
    expect(notes(1200, 1300).some((id) => id.startsWith("eat-low"))).toBe(false);
  });
});

describe("one set of food targets (2026-11-15)", () => {
  const teen: Profile = { ...base, birthYear: new Date(NOW).getFullYear() - 15 };

  it("the goal picked in Macros wins over the training goal", () => {
    // Build-muscle training while deliberately cutting: no "eating too little to build muscle".
    const events = days([
      [4, 2300, 160],
      [3, 2250, 160],
      [2, 2350, 160],
      [1, 2300, 160],
    ]);
    const muscle = { ...base, goal: "muscle" as const };
    expect(foodGoal(muscle)).toBe("bulk");
    expect(ids(events, muscle).some((id) => id.startsWith("eat-low-muscle-"))).toBe(true);
    const cutting = { ...muscle, tdee: { goal: "cut" as const } };
    expect(foodGoal(cutting)).toBe("cut");
    expect(ids(events, cutting).some((id) => id.startsWith("eat-low"))).toBe(false);
    // Protein follows the goal: 2.2 g per kg on a cut.
    expect(foodTargets(events, [], cutting, NOW).protein).toBe(176);
  });

  it("under-18s never get a fat-loss goal, a calorie target or a calorie note, only protein", () => {
    expect(foodGoal({ ...teen, tdee: { goal: "cut" } }, NOW)).toBe("maintain");
    const low = days([
      [4, 1200, 60],
      [3, 1300, 60],
      [2, 1100, 60],
      [1, 1250, 60],
    ]);
    expect(ids(low).some((id) => id.startsWith("eat-low-"))).toBe(true);
    const notes = ids(low, teen);
    expect(notes.some((id) => id.startsWith("eat-low") || id.startsWith("coach-kcal"))).toBe(false);
    expect(notes.some((id) => id.startsWith("protein-short-"))).toBe(true);
    const ft = foodTargets(low, [], teen, NOW, { kcal: 1500, protein: 120, carbs: 200, fat: 50, coach: "Sam" });
    expect(ft).toMatchObject({ teen: true, protein: 120 });
    expect(ft.kcal).toBeUndefined();
    expect(ft.carbs).toBeUndefined();
    expect(
      insights({ events: low, profile: teen, now: NOW, coachTargets: { kcal: 2400, protein: null, coach: "Sam" } }).map((i) => i.id),
    ).not.toContain(expect.stringMatching(/^coach-kcal-/));
  });

  it("a rest-day number makes each logged day's own target", () => {
    const trained = new Set([day(1), day(3)]);
    const week = [{ day: day(1) }, { day: day(2) }, { day: day(3) }, { day: day(4) }];
    expect(targetFor(week, trained, 2800, 2200)).toBe(2500);
    expect(targetFor(week, trained, 2800)).toBe(2800);
  });
});

describe("protein-only logging (2026-11-15)", () => {
  it("counts a low-calorie day for protein when it was mostly protein, never for calories", () => {
    expect(proteinOnly(400, 80)).toBe(true);
    expect(proteinOnly(undefined, 60)).toBe(true);
    expect(proteinOnly(800, 40)).toBe(false); // a half-logged ordinary day
    expect(proteinOnly(100, 10)).toBe(false);
    const f = foodDays(
      days([
        [3, 450, 90],
        [2, 500, 95],
        [1, 400, 85],
      ]),
      NOW,
    );
    expect(f).toEqual([
      { day: day(3), protein: 90 },
      { day: day(2), protein: 95 },
      { day: day(1), protein: 85 },
    ]);
    expect(weekIntake(f, NOW)).toBeNull();
    expect(proteinShort(f, 144, NOW)).toMatchObject({ days: 3, avg: 90 });
  });
});

describe("maintenance measured from food and weigh-ins (2026-11-15)", () => {
  const weigh = (ago: number, kg: number): BodyweightEvent => ({ type: "bodyweight", id: `w${n++}`, at: NOW - ago * D, kg });
  const daily = (kcal: number, from = 21) => days(Array.from({ length: from }, (_, i) => [i + 1, kcal] as [number, number]));

  it("is what was eaten plus the weight trend's gap, about 7,700 kcal a kg", () => {
    // Eating 2,500 a day and losing 0.5 kg a week: maintenance is about 2,500 + 550 = 3,050.
    const events = [...daily(2500), weigh(21, 81.5), weigh(14, 81), weigh(7, 80.5), weigh(0.5, 80)];
    const m = measuredTdee(events, NOW)!;
    expect(m.days).toBe(21);
    expect(m.kgPerWeek).toBeCloseTo(-0.5, 1);
    expect(m.kcal).toBeGreaterThan(3000);
    expect(m.kcal).toBeLessThan(3100);
    // It replaces the formula's maintenance everywhere, and the snapshots keep the formula's.
    const cur = currentTdee(events, [], base, NOW);
    expect(cur.result!.tdee).toBe(m.kcal);
    expect(cur.formulaResult!.tdee).not.toBe(m.kcal);
    expect(cur.result!.cut).toBe(m.kcal - 500);
  });

  it("needs two weeks of logged days and four weigh-ins spread over two weeks", () => {
    expect(measuredTdee([...daily(2500, 10), weigh(21, 81), weigh(14, 81), weigh(7, 80), weigh(1, 80)], NOW)).toBeNull();
    expect(measuredTdee([...daily(2500), weigh(3, 81), weigh(2, 81), weigh(1, 80)], NOW)).toBeNull();
    expect(measuredTdee([...daily(2500), weigh(8, 81), weigh(6, 81), weigh(4, 80), weigh(2, 80)], NOW)).toBeNull();
    // A wild answer is a logging gap, not a metabolism.
    expect(measuredTdee([...daily(1100), weigh(21, 80), weigh(14, 82), weigh(7, 84), weigh(1, 86)], NOW)).toBeNull();
  });
});

describe("food moves the training (2026-11-15)", () => {
  it("two very low days in a row read as under-fuelled for readiness", () => {
    const f = foodDays(
      days([
        [3, 2600],
        [2, 1500],
        [1, 1600],
      ]),
      NOW,
    );
    expect(underFuelled(f, 2700, NOW)).toBe(true);
    expect(underFuelled(f.slice(0, 2), 2700, NOW)).toBe(false);
    expect(underFuelled(f, 2000, NOW)).toBe(false);
    expect(underFuelled(f, undefined, NOW)).toBe(false);
    const ext = healthExternal(
      days([
        [2, 1500],
        [1, 1600],
      ]),
      NOW,
      base,
    );
    expect(ext.underFuelled).toBe(true);
    expect(healthSignals(ext).map((s) => s.text)).toContain(t("sig.underFuelled"));
  });

  it("eating well under maintenance is a plateau cause", () => {
    const sets: AppEvent[] = [];
    // Bench at 100 x 5 for nine weeks: the best was in the first week.
    for (let w = 9; w >= 0; w--)
      sets.push({
        type: "set",
        id: `s${w}`,
        at: NOW - w * 7 * D,
        sessionId: `x${w}`,
        exerciseId: "bench-press",
        weight: 100,
        reps: w === 9 ? 6 : 5,
        targetReps: 5,
        rir: 2,
      } as AppEvent);
    const ps = findPlateaus(sets, { ...base, blockStart: NOW - 2 * D }, NOW, [], { gap: 600, days: 6 });
    const p = ps.find((x) => x.exerciseId === "bench-press")!;
    expect(p.causes.some((c) => c.kind === "food")).toBe(true);
    expect(findPlateaus(sets, { ...base, blockStart: NOW - 2 * D }, NOW)[0]!.causes.some((c) => c.kind === "food")).toBe(false);
  });
});
