import { describe, expect, it } from "vitest";

import { defaultProfile, makeGym } from "./defaults";
import { exercise } from "./exercises";
import { generate, itemSeconds, planSeconds, setSeconds } from "./generator";
import { loadBar } from "./plates";
import { ageFactor, FIRST_RIR, startE1rm, target, weightFor } from "./progression";
import type { Profile, SetEvent } from "./types";
import { fromKg, toKg } from "./units";
import { WARMUP_REST, warmupFor, withWarmups } from "./warmup";

const NOW = new Date("2026-11-11T18:00:00").getTime();
const H = 3600_000;
const profile = (p: Partial<Profile> = {}): Profile => ({ ...defaultProfile(NOW), onboarded: true, activeGymId: "g", ...p });

describe("first-session starting weights", () => {
  const lbGym = makeGym("commercial", "lb");
  const squat = exercise("back-squat");

  it("doesn't offer a 145 lb experienced lifter a 175 lb squat (Melvin, 2026-11-09)", () => {
    const p = profile({ bodyweight: toKg(145, "lb"), experience: "advanced", unit: "lb" });
    const lb = fromKg(target(squat, [], p, lbGym, NOW).weight, "lb");
    expect(lb).toBeLessThan(145);
    expect(lb).toBeGreaterThanOrEqual(95);
    // Even with sex given as male, the first squat stays under body weight.
    expect(fromKg(target(squat, [], { ...p, sex: "male" }, lbGym, NOW).weight, "lb")).toBeLessThan(145);
  });

  it("scales down with less experience, for women, and with age", () => {
    const base = profile({ bodyweight: 80, sex: "male", experience: "advanced" });
    const e = (p: Profile) => startE1rm(squat, p, NOW);
    expect(e({ ...base, experience: "intermediate" })).toBeLessThan(e(base));
    expect(e({ ...base, experience: "new" })).toBeLessThan(e({ ...base, experience: "intermediate" }));
    expect(e({ ...base, sex: "female" })).toBeLessThan(e(base));
    expect(e({ ...base, sex: undefined })).toBeLessThan(e(base));
    expect(e({ ...base, birthYear: 1966 })).toBeLessThan(e({ ...base, birthYear: 1996 }));
    // Women are scaled more on upper-body lifts than lower-body ones.
    const bench = exercise("bench-press");
    expect(startE1rm(bench, { ...base, sex: "female" }, NOW) / startE1rm(bench, base, NOW)).toBeLessThan(
      e({ ...base, sex: "female" }) / e(base),
    );
  });

  it("ages by decade", () => {
    expect(ageFactor(undefined, NOW)).toBe(1);
    expect(ageFactor(1996, NOW)).toBe(1);
    expect(ageFactor(1981, NOW)).toBeLessThan(1);
    expect(ageFactor(1951, NOW)).toBeLessThan(ageFactor(1971, NOW));
  });

  it("aims further from failure than the block on a first session", () => {
    const p = profile({ bodyweight: 80, sex: "male" });
    const gym = makeGym("commercial", "kg");
    const t = target(squat, [], p, gym, NOW);
    const e1 = startE1rm(squat, p, NOW);
    expect(t.weight).toBeLessThanOrEqual(weightFor(e1, t.reps, t.rir + FIRST_RIR) + 2.5);
  });

  it("starts from known maxes, and scales them to close relatives", () => {
    const gym = makeGym("commercial", "kg");
    const p = profile({ bodyweight: 70, knownMaxes: { "back-squat": 140 } });
    const t = target(squat, [], p, gym, NOW);
    expect(t.note).toMatch(/numbers you entered/);
    expect(t.weight).toBeCloseTo(Math.round(weightFor(140, t.reps, t.rir + FIRST_RIR) / 2.5) * 2.5, -1);
    const front = startE1rm(exercise("front-squat"), p, NOW);
    expect(front).toBeLessThan(140);
    expect(front).toBeGreaterThan(70);
  });

  it("catches up after a first session that was too light", () => {
    const gym = makeGym("commercial", "kg");
    const p = profile({ bodyweight: 80, goal: "muscle" });
    const s = (reps: number, i: number): SetEvent => ({
      type: "set",
      id: `c${i}`,
      at: NOW - 72 * H + i,
      sessionId: "first",
      exerciseId: "back-squat",
      weight: 60,
      reps,
      targetReps: 6,
      rir: 3,
      targetWeight: 60,
    });
    // Twelve reps when six were asked: the start was light, so it jumps more than one step.
    const t = target(squat, [s(12, 0), s(12, 1), s(11, 2)], p, gym, NOW);
    expect(t.weight).toBeGreaterThan(62.5);
    expect(t.weight).toBeLessThanOrEqual(75);
    expect(t.note).toMatch(/Calibrated/);
    // Hitting the target exactly is ordinary double progression.
    expect(target(squat, [s(6, 0), s(6, 1)], p, gym, NOW).note).not.toMatch(/Calibrated/);
  });
});

describe("warm-ups", () => {
  const gym = makeGym("commercial", "kg");

  it("ramps up to a heavy barbell lift on loadable weights, starting with the empty bar", () => {
    const w = warmupFor(exercise("back-squat"), 120, gym, new Set());
    expect(w[0]).toEqual({ weight: 20, reps: 10 });
    expect(w.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < w.length; i++) expect(w[i].weight).toBeGreaterThan(w[i - 1].weight);
    expect(w.at(-1)!.weight).toBeLessThan(120);
    for (const s of w) expect(loadBar(s.weight, 20, gym.plates).exact).toBe(true);
  });

  it("gives warm muscles one feeler set on the barbell, and nothing for bodyweight or isolation", () => {
    expect(warmupFor(exercise("front-squat"), 80, gym, new Set(["quads", "glutes"]))).toHaveLength(1);
    expect(warmupFor(exercise("push-up"), 0, gym, new Set())).toEqual([]);
    expect(warmupFor(exercise("lateral-raise"), 10, gym, new Set(["sideDelts"]))).toEqual([]);
    expect(warmupFor(exercise("lateral-raise"), 10, gym, new Set())).toHaveLength(1);
  });

  it("warms each muscle once across a workout", () => {
    const items: { exerciseId: string; target: { weight: number }; warmup?: { weight: number; reps: number }[] }[] = [
      { exerciseId: "back-squat", target: { weight: 100 } },
      { exerciseId: "front-squat", target: { weight: 70 } },
    ];
    const out = withWarmups(items, gym, exercise);
    expect(out[0].warmup!.length).toBeGreaterThan(1);
    expect(out[1].warmup).toHaveLength(1);
  });

  it("counts warm-ups and rest in exercise and workout length", () => {
    const base = { exerciseId: "back-squat", sets: 3, restSec: 120, target: { weight: 100, reps: 5, rir: 2, note: "" } };
    const warm = {
      ...base,
      warmup: [
        { weight: 20, reps: 10 },
        { weight: 60, reps: 5 },
      ],
    };
    const ex = exercise("back-squat");
    expect(itemSeconds(warm) - itemSeconds(base)).toBe(setSeconds(ex, 10) + setSeconds(ex, 5) + 2 * WARMUP_REST);
    expect(itemSeconds(base)).toBe(60 + 3 * setSeconds(ex, 5) + 2 * 120);
    expect(planSeconds([base, base])).toBe(2 * itemSeconds(base) + 120);
  });

  it("fits the plan, warm-ups included, in the minutes asked for", () => {
    for (const minutes of [20, 30, 45, 60, 90]) {
      const plan = generate({ gym, profile: profile(), events: [], minutes, now: NOW });
      expect(planSeconds(plan.items) / 60).toBeLessThanOrEqual(minutes);
      expect(plan.estMinutes).toBe(Math.round(planSeconds(plan.items) / 60));
      expect(plan.items.some((i) => i.warmup?.length)).toBe(true);
    }
  });
});
