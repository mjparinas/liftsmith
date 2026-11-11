import { describe, expect, it } from "vitest";

import { defaultProfile } from "./defaults";
import { localDayKey, nutritionReadings } from "./health";
import { t } from "./i18n";
import { insights } from "./insights";
import { foodDays, LOGGED_KCAL, proteinShort, weekIntake } from "./nutrition";
import type { AppEvent, BodyweightEvent, HealthEvent, Profile } from "./types";

// Food from a food app through Health Connect or Apple Health, turned into coach's notes (Melvin, 2026-11-11).

const D = 86_400_000;
const NOW = new Date("2026-11-11T18:00:00").getTime();
// 80 kg: the protein target is 128 g, short is under 85% of it (108.8 g).
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
    expect(proteinShort(short, 80, NOW)).toEqual({ days: 3, avg: 90, target: 128, last: day(1) });
    // Two short days aren't a run yet.
    expect(proteinShort(short.slice(0, 3), 80, NOW)).toBeNull();
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
        80,
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
        80,
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
    expect(note.why).toBe(t("ins.proteinShort.why", { avg: 90, target: 128 }));
    expect(note.advice).toBe(t("ins.proteinShort.advice", { gap: 40 }));
    expect(note.action).toMatchObject({ kind: "go", route: "tools/tdee" });
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
