import { describe, expect, it } from "vitest";

import { makeSet } from "@/test/factories";

import { blockWeek } from "./block";
import { defaultProfile, makeGym } from "./defaults";
import { derive } from "./derive";
import { exercise, EXERCISES } from "./exercises";
import { goalStreak, levelOf } from "./game";
import { alternatives, generate, itemSeconds } from "./generator";
import { loadBar, nearestLoads } from "./plates";
import { epley, target } from "./progression";
import { recovery } from "./recovery";
import type { AppEvent, SetEvent } from "./types";
import { toKg } from "./units";

const NOW = new Date("2026-11-11T18:00:00").getTime();
const H = 3600_000;

function profile() {
  return { ...defaultProfile(NOW), onboarded: true, activeGymId: "g" };
}

function set(exerciseId: string, at: number, weight: number, reps: number, targetReps = reps, sessionId = "s1"): SetEvent {
  return makeSet({ at, sessionId, exerciseId, weight, reps, targetReps });
}

describe("exercise library", () => {
  it("has unique ids and real muscles", () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    expect(EXERCISES.length).toBeGreaterThan(90);
    for (const e of EXERCISES) {
      expect(e.primary.length).toBeGreaterThan(0);
      expect(e.cues.length).toBeGreaterThan(0);
    }
  });
  it("has bodyweight exercises for every major muscle", () => {
    const bw = EXERCISES.filter((e) => e.needs.length === 0);
    for (const m of ["chest", "quads", "hamstrings", "glutes", "abs", "upperBack", "triceps", "frontDelts"]) {
      expect(
        bw.some((e) => e.primary.includes(m as never)),
        m,
      ).toBe(true);
    }
  });
});

describe("plates", () => {
  const kg = makeGym("commercial", "kg").plates;
  it("loads an exact weight with the fewest plates", () => {
    const l = loadBar(100, 20, kg);
    expect(l.exact).toBe(true);
    expect(l.perSide).toEqual([25, 15]);
  });
  it("uses only plates owned", () => {
    const l = loadBar(140, 20, [
      { weight: 20, count: 2 },
      { weight: 10, count: 4 },
    ]);
    expect(l.perSide).toEqual([20, 10, 10]);
    expect(l.total).toBe(100);
    expect(l.exact).toBe(false);
  });
  it("finds combinations a greedy fill misses", () => {
    // 2 x 15 per side makes 80 on a 20 bar; greedy 25 first would get stuck.
    const l = loadBar(80, 20, [
      { weight: 25, count: 2 },
      { weight: 15, count: 4 },
    ]);
    expect(l.exact).toBe(true);
    expect(l.perSide).toEqual([15, 15]);
  });
  it("works in pounds", () => {
    const l = loadBar(225, 45, makeGym("commercial", "lb").plates);
    expect(l.perSide).toEqual([45, 45]);
  });
  it("offers the nearest loads around an impossible weight", () => {
    expect(nearestLoads(101, 20, kg)).toEqual({ below: 100, above: 102.5 });
  });
});

describe("recovery", () => {
  it("drops after a hard session and comes back within three days", () => {
    const ev = [0, 1, 2, 3, 4].map((i) => set("back-squat", NOW - 2 * H + i, 100, 5));
    expect(recovery(ev, NOW).quads).toBeLessThan(45);
    expect(recovery(ev, NOW + 72 * H).quads).toBeGreaterThanOrEqual(90);
    expect(recovery(ev, NOW).biceps).toBe(100);
  });
});

describe("blocks", () => {
  it("steps RIR down and ends with a deload", () => {
    const p = profile();
    const weeks = [0, 1, 2, 3, 4].map((w) => blockWeek(p, p.blockStart + w * 7 * 24 * H + H));
    expect(weeks.map((w) => w.rir)).toEqual([3, 2, 1, 0, 4]);
    expect(weeks[4].deload).toBe(true);
    expect(weeks[0].setsPerMuscle).toBeLessThan(weeks[3].setsPerMuscle);
  });
});

describe("progression", () => {
  const gym = makeGym("commercial", "kg");
  const bench = exercise("bench-press");
  it("adds a rep after hitting every set", () => {
    const ev = [set("bench-press", NOW - 72 * H, 80, 8, 8), set("bench-press", NOW - 72 * H + 1, 80, 8, 8)];
    const t = target(bench, ev, { ...profile(), goal: "muscle" }, gym, NOW);
    expect(t.weight).toBe(80);
    expect(t.reps).toBe(9);
  });
  it("adds weight at the top of the range", () => {
    const ev = [set("bench-press", NOW - 72 * H, 80, 10, 10)];
    const t = target(bench, ev, { ...profile(), goal: "muscle" }, gym, NOW);
    expect(t.weight).toBeCloseTo(82.5);
    expect(t.reps).toBe(6);
  });
  it("drops a step after a big miss", () => {
    const ev = [set("bench-press", NOW - 72 * H, 80, 5, 8)];
    expect(target(bench, ev, profile(), gym, NOW).weight).toBeCloseTo(77.5);
  });
  it("always suggests a weight the plates can make", () => {
    const lbGym = makeGym("home", "lb");
    const t = target(bench, [], { ...profile(), bodyweight: 77 }, lbGym, NOW);
    const lbs = t.weight / 0.45359237;
    expect(loadBar(lbs, 45, lbGym.plates).exact).toBe(true);
  });
  it("Epley matches the usual table", () => {
    expect(Math.round(epley(100, 5))).toBe(117);
  });
});

describe("generator", () => {
  it("fits the time asked for and grows with it", () => {
    const gym = makeGym("commercial", "kg");
    const p = profile();
    const short = generate({ gym, profile: p, events: [], minutes: 25, now: NOW });
    const long = generate({ gym, profile: p, events: [], minutes: 75, now: NOW });
    for (const plan of [short, long]) {
      const secs = plan.items.reduce((s, i) => s + itemSeconds(i), 0);
      expect(secs / 60).toBeLessThanOrEqual(plan.minutes);
      expect(plan.items.length).toBeGreaterThan(1);
    }
    expect(long.items.length).toBeGreaterThan(short.items.length);
  });
  it("uses only the gym's equipment", () => {
    const gym = makeGym("bodyweight", "kg");
    const plan = generate({ gym, profile: profile(), events: [], minutes: 45, now: NOW });
    for (const i of plan.items) expect(exercise(i.exerciseId).needs).toEqual([]);
  });
  it("steers away from fatigued muscles", () => {
    const gym = makeGym("commercial", "kg");
    const ev: AppEvent[] = [];
    for (let i = 0; i < 8; i++) ev.push(set("bench-press", NOW - 3 * H + i, 80, 8));
    const plan = generate({ gym, profile: profile(), events: ev, minutes: 45, now: NOW });
    expect(plan.items.some((i) => exercise(i.exerciseId).primary.includes("chest"))).toBe(false);
  });
  it("offers swaps that hit the same muscles", () => {
    const gym = makeGym("dumbbells", "kg");
    const alts = alternatives("bench-press", gym);
    expect(alts[0].primary).toContain("chest");
    expect(alts.every((a) => a.needs.every((n) => gym.equipment.includes(n)))).toBe(true);
  });
});

describe("stats and game", () => {
  it("counts PRs and dedupes merged events", () => {
    const a = set("bench-press", NOW - 96 * H, 80, 5, 5, "a");
    const b = set("bench-press", NOW - 24 * H, 85, 5, 5, "b");
    const s = derive([a, b, a], NOW);
    expect(s.totalSets).toBe(2);
    expect(s.prs).toHaveLength(1);
  });
  it("never calls a longer carry or sled push a PR: their reps are seconds", () => {
    const carry = [set("farmers-carry", NOW - 96 * H, 32, 30, 30, "a"), set("farmers-carry", NOW - 24 * H, 32, 60, 60, "b")];
    const sled = [set("sled-push", NOW - 72 * H, 100, 60, 60, "c"), set("sled-push", NOW - 12 * H, 100, 90, 90, "d")];
    const s = derive([...carry, ...sled], NOW);
    expect(s.prs).toEqual([]);
    expect(s.e1rmSeries.size).toBe(0);
  });
  it("levels up", () => {
    expect(levelOf(0).title).toBe("Rookie");
    expect(levelOf(600).title).toBe("Regular");
  });
  it("streak counts weeks that met the goal", () => {
    const ev: AppEvent[] = [];
    for (let w = 1; w <= 3; w++)
      for (let d = 0; d < 3; d++) ev.push(set("plank", NOW - w * 7 * 24 * H + d * 24 * H, 0, 30, 30, `w${w}d${d}`));
    const st = goalStreak(derive(ev, NOW), { daysPerWeek: 3 }, NOW);
    expect(st.weeks).toBe(3);
  });
  it("kg conversion", () => {
    expect(toKg(45, "lb")).toBeCloseTo(20.41, 2);
  });
});
