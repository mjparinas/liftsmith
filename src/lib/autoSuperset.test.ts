import { describe, expect, it } from "vitest";

import { makeProfile, makeTestGym, NOW } from "@/test/factories";

import { autoPair, clashes, isBigLift, PAIR_REST_FLOOR, pairable, pairedRest, pairScore } from "./autoSuperset";
import { EXERCISE_BY_ID } from "./exercises";
import { generate, planSeconds, type PlanItem } from "./generator";
import { groupRange, SWITCH_REST, toggleLink } from "./superset";
import { pairWhy, workoutWhy } from "./why";

const ex = (id: string) => EXERCISE_BY_ID.get(id)!;
const item = (exerciseId: string, restSec = 120, over: Partial<PlanItem> = {}): PlanItem => ({
  exerciseId,
  sets: 3,
  restSec,
  focus: ex(exerciseId).primary[0]!,
  target: { weight: 40, reps: 10, rir: 2, note: "" },
  ...over,
});
const groups = (items: readonly PlanItem[]) => items.map((i) => i.group);
const ids = (items: readonly PlanItem[]) => items.map((i) => i.exerciseId);

describe("automatic supersets", () => {
  it("knows which exercises share muscles", () => {
    expect(clashes(ex("bench-press"), ex("barbell-row"))).toBe(false);
    // The overhead press helps with the triceps and front delts the bench press uses.
    expect(clashes(ex("bench-press"), ex("overhead-press"))).toBe(true);
    // The row's lower back is the deadlift's main muscle, either way round.
    expect(clashes(ex("barbell-row"), ex("deadlift"))).toBe(true);
    expect(clashes(ex("deadlift"), ex("barbell-row"))).toBe(true);
    // Both lean on the lower back, even with it only helping in each.
    expect(clashes(ex("romanian-deadlift"), ex("barbell-row"))).toBe(true);
    expect(clashes(ex("barbell-row"), ex("romanian-deadlift"))).toBe(true);
  });

  it("pairs opposite muscles best, then upper with lower, then core", () => {
    expect(pairScore(ex("db-bench-press"), ex("seated-cable-row"))).toBe(3);
    expect(pairScore(ex("lat-pulldown"), ex("leg-press"))).toBe(2);
    expect(pairScore(ex("plank"), ex("leg-press"))).toBe(1);
    // Two barbell lifts need two bars: one point less.
    expect(pairScore(ex("bench-press"), ex("barbell-row"))).toBe(2);
  });

  it("keeps heavy squats and hinges alone, and every barbell compound on a strength goal", () => {
    expect(isBigLift(ex("back-squat"), "muscle")).toBe(true);
    expect(isBigLift(ex("romanian-deadlift"), "muscle")).toBe(true);
    expect(isBigLift(ex("bench-press"), "muscle")).toBe(false);
    expect(isBigLift(ex("bench-press"), "strength")).toBe(true);
    expect(isBigLift(ex("leg-press"), "strength")).toBe(false);
    expect(pairable(item("back-squat"), { goal: "muscle" })).toBe(false);
    expect(pairable(item("back-squat"), { goal: "muscle", bigAlone: false })).toBe(true);
  });

  it("never pairs a challenge set, an injured lift, a carry or a part", () => {
    const o = { goal: "muscle" } as const;
    expect(pairable(item("db-bench-press", 120, { challenge: true }), o)).toBe(false);
    expect(pairable(item("db-bench-press", 120, { injuryPct: 70 }), o)).toBe(false);
    expect(pairable(item("farmers-carry"), o)).toBe(false);
    expect(pairable(item("db-bench-press", 120, { part: "rehab" }), o)).toBe(false);
    expect(pairable(item("db-bench-press"), o)).toBe(true);
  });

  it("cuts the rest by the partner's set and the switch, in 15 s steps, never below a minute", () => {
    expect(pairedRest(120, 40)).toBe(60); // 120 - 40 - 15 = 65, to the nearest 15 s
    expect(pairedRest(180, 45)).toBe(120);
    expect(pairedRest(90, 60)).toBe(PAIR_REST_FLOOR);
    // An exercise that already rests less than a minute keeps its own rest.
    expect(pairedRest(45, 30)).toBe(45);
    expect(SWITCH_REST).toBe(15);
  });

  it("pairs in plan order, moving the best partner up, and leaves the rest alone", () => {
    const plan = [
      item("back-squat", 120),
      item("db-bench-press", 120),
      item("leg-press", 120),
      item("seated-cable-row", 120),
      item("plank", 45),
    ];
    const out = autoPair(plan, { goal: "muscle" });
    // The squat stays alone; the press takes the row (opposite muscles) over the leg press; the leg press takes the plank.
    expect(ids(out)).toEqual(["back-squat", "db-bench-press", "seated-cable-row", "leg-press", "plank"]);
    expect(groups(out)).toEqual([undefined, "ss-db-bench-press", "ss-db-bench-press", "ss-leg-press", "ss-leg-press"]);
    // Shorter rest, with the solo rest kept for a split.
    expect(out[1]!.restSec).toBeLessThan(120);
    expect(out[1]!.soloRest).toBe(120);
    expect(out[4]!.restSec).toBe(45);
    expect(out[4]!.soloRest).toBeUndefined();
    // The plan's own items aren't changed.
    expect(plan[1]!.group).toBeUndefined();
  });

  it("keeps a rest the lifter set for that exercise", () => {
    const out = autoPair([item("db-bench-press", 150), item("seated-cable-row", 150)], {
      goal: "muscle",
      ownRest: (id) => id === "db-bench-press",
    });
    expect(out.map((i) => i.restSec)).toEqual([150, 75]);
    expect(out[0]!.soloRest).toBeUndefined();
  });

  it("gives a split exercise its own rest back", () => {
    const out = autoPair([item("db-bench-press", 120), item("seated-cable-row", 120)], { goal: "muscle" });
    const split = toggleLink(out, 0);
    expect(groups(split)).toEqual([undefined, undefined]);
    expect(split.map((i) => i.restSec)).toEqual([120, 120]);
    expect(split.every((i) => i.soloRest === undefined)).toBe(true);
  });

  it("says why each exercise is paired and why the rest is shorter", () => {
    const out = autoPair([item("db-bench-press", 120), item("seated-cable-row", 120), item("plank", 45)], { goal: "muscle" });
    expect(pairWhy(out, 0)).toMatch(/^Superset with .+: other muscles/);
    expect(pairWhy(out, 0)).toContain("1 min");
    // Said once per pair, on its first exercise.
    expect(pairWhy(out, 1)).toBeUndefined();
    // A superset the lifter linked keeps its own rest, so it gets no reason line.
    const manual = toggleLink([item("db-bench-press"), item("seated-cable-row")], 0);
    expect(pairWhy(manual, 0)).toBeUndefined();
    const week = generate({ gym: makeTestGym(), profile: makeProfile(), events: [], minutes: 45, now: NOW }).week;
    expect(workoutWhy(out[1]!, { week, call: "normal", items: out })).toMatch(/Rest is 1 min in this superset/);
  });
});

describe("the adaptive plan with supersets on", () => {
  const gym = makeTestGym();
  const on = makeProfile({ training: { supersets: true } });
  const off = makeProfile();

  it("pairs exercises, fits the time asked for and fits at least as much work", () => {
    for (const minutes of [30, 45, 60, 75]) {
      const a = generate({ gym, profile: on, events: [], minutes, now: NOW });
      const b = generate({ gym, profile: off, events: [], minutes, now: NOW });
      expect(a.items.some((i) => i.group)).toBe(true);
      expect(planSeconds(a.items)).toBeLessThanOrEqual(minutes * 60 + 60);
      const sets = (p: typeof a) => p.items.reduce((n, i) => n + i.sets, 0);
      expect(sets(a)).toBeGreaterThanOrEqual(sets(b));
      // Every superset is a pair of neighbours that don't share muscles.
      a.items.forEach((x, i) => {
        if (!x.group) return;
        const [s, e] = groupRange(a.items, i);
        expect(e - s).toBe(1);
        expect(clashes(ex(a.items[s]!.exerciseId), ex(a.items[e]!.exerciseId))).toBe(false);
      });
    }
  });

  it("keeps heavy squats and hinges alone unless the lifter lets them pair", () => {
    for (const minutes of [45, 60, 90]) {
      const plan = generate({ gym, profile: on, events: [], minutes, now: NOW });
      for (const i of plan.items) if (i.group) expect(isBigLift(ex(i.exerciseId), on.goal)).toBe(false);
    }
  });

  it("changes nothing with supersets off", () => {
    const plan = generate({ gym, profile: off, events: [], minutes: 60, now: NOW });
    expect(plan.items.some((i) => i.group || i.soloRest)).toBe(false);
  });

  it("drops warm-up sets when they're off", () => {
    const withWarm = generate({ gym, profile: off, events: [], minutes: 60, now: NOW });
    const without = generate({ gym, profile: makeProfile({ training: { warmups: false } }), events: [], minutes: 60, now: NOW });
    expect(withWarm.items.some((i) => i.warmup)).toBe(true);
    expect(without.items.some((i) => i.warmup)).toBe(false);
  });
});
