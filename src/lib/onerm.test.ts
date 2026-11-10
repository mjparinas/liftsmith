import { describe, expect, it } from "vitest";

import { makeSet } from "@/test/factories";

import {
  allFormulas,
  allOneRms,
  detrain,
  dots,
  dotsBand,
  dotsFromData,
  estimate,
  formulasFor,
  marzagao,
  MAX_RTF,
  oneRm,
  qualityOf,
  repTable,
  rirOf,
  setEstimates,
  weightForReps,
} from "./onerm";
import { strength } from "./strength";
import type { AppEvent, SetEvent } from "./types";

const NOW = new Date("2026-11-11T18:00:00").getTime();
const DAY = 86400_000;

function set(over: Partial<SetEvent> & { exerciseId?: string } = {}): SetEvent {
  return makeSet({ at: NOW - DAY, sessionId: "a", weight: 100, reps: 5, targetReps: 5, rir: 0, startedAt: NOW - DAY, ...over });
}

describe("formulas", () => {
  it("a single is the max", () => {
    expect(estimate(140, 1)).toBe(140);
    for (const f of allFormulas(140, 1)) expect(f.e1rm).toBeCloseTo(140, 5);
  });

  it("matches the published equations", () => {
    const by = Object.fromEntries(allFormulas(100, 10).map((f) => [f.id, f.e1rm]));
    expect(by.epley).toBeCloseTo(133.33, 1);
    expect(by.brzycki).toBeCloseTo(133.33, 1);
    expect(by.lombardi).toBeCloseTo(125.89, 1);
    expect(by.oconner).toBeCloseTo(125, 1);
    // Marzagao 2026 at 100 kg × 5: k = −2.55 + 4.58 ln 100 = 18.54.
    expect(marzagao(100, 5)).toBeCloseTo(100 * (1 + Math.pow(4, 0.85) / (-2.55 + 4.58 * Math.log(100))), 6);
    // Its k(w) is floored at 0.5 for tiny loads.
    expect(marzagao(1, 5)).toBeCloseTo(1 * (1 + Math.pow(4, 0.85) / 0.5), 6);
  });

  it("picks formulas by rep range", () => {
    expect(formulasFor(5)).toEqual(["brzycki", "epley", "marzagao"]);
    expect(formulasFor(10)).toEqual(["brzycki", "epley", "marzagao"]);
    expect(formulasFor(11)).toEqual(["mayhew", "wathan", "marzagao"]);
    const used = allFormulas(80, 12)
      .filter((f) => f.used)
      .map((f) => f.id);
    expect(used).toEqual(["mayhew", "wathan", "marzagao"]);
  });

  it("rises with reps and weight", () => {
    for (let r = 1; r < MAX_RTF; r++) expect(estimate(100, r + 1)).toBeGreaterThan(estimate(100, r));
    expect(estimate(110, 5)).toBeGreaterThan(estimate(100, 5));
    expect(estimate(0, 5)).toBe(0);
    expect(estimate(100, 0)).toBe(0);
  });

  it("turns a max back into weights", () => {
    for (const reps of [1, 3, 5, 8, 12]) expect(estimate(weightForReps(150, reps), reps)).toBeCloseTo(150, 1);
    expect(weightForReps(150, 3, 2)).toBeCloseTo(weightForReps(150, 5), 3);
    const table = repTable(100);
    expect(table[0]).toEqual({ reps: 1, weight: 100, pct: 100 });
    expect(table.every((row, i) => i === 0 || row.weight < table[i - 1].weight)).toBe(true);
    expect(weightForReps(0, 5)).toBe(0);
  });
});

describe("reps in reserve", () => {
  it("prefers what the lifter reported", () => {
    expect(rirOf(set({ rir: 2 }), 1)).toEqual({ rir: 1, source: "reported" });
    expect(rirOf(set({ rir: 2 }), 9)).toEqual({ rir: 4, source: "reported" });
  });
  it("treats all-out and missed sets as failure", () => {
    expect(rirOf(set({ amrap: true, rir: 2, reps: 9 })).source).toBe("failure");
    expect(rirOf(set({ challenge: true, rir: 2 })).rir).toBe(0);
    expect(rirOf(set({ reps: 3, targetReps: 5, rir: 2 }))).toEqual({ rir: 0, source: "failure" });
  });
  it("uses up planned reserve for extra reps", () => {
    expect(rirOf(set({ reps: 6, targetReps: 5, rir: 2 }))).toEqual({ rir: 1, source: "planned" });
    expect(rirOf(set({ reps: 9, targetReps: 5, rir: 2 }))).toEqual({ rir: 0, source: "planned" });
  });
  it("assumes 2 for web-logged and imported sets", () => {
    expect(rirOf(set({ startedAt: undefined, rir: 2 }))).toEqual({ rir: 2, source: "assumed" });
  });
  it("trusts low-rep, near-failure, known-RIR sets most", () => {
    expect(qualityOf(3, 0, "reported")).toBe(1);
    expect(qualityOf(3, 0, "reported")).toBeGreaterThan(qualityOf(10, 0, "reported"));
    expect(qualityOf(5, 0, "planned")).toBeGreaterThan(qualityOf(5, 3, "planned"));
    expect(qualityOf(5, 2, "planned")).toBeGreaterThan(qualityOf(5, 2, "assumed"));
    expect(qualityOf(20, 4, "assumed")).toBeGreaterThan(0);
  });
});

describe("estimates from history", () => {
  it("adds reported RIR and skips what can't count", () => {
    const events: AppEvent[] = [
      set({ id: "x1", weight: 100, reps: 5 }),
      { type: "effort", id: "ef", at: NOW - DAY, setId: "x1", rir: 2 },
      set({ weight: 0, reps: 10 }),
      set({ weight: 60, reps: 30, targetReps: 30 }),
      set({ weight: 80, reps: 5, injuryPct: 0.6 }),
      set({ exerciseId: "plank", weight: 10, reps: 40, targetReps: 40 }),
      { type: "warmup", id: "w", at: NOW - DAY, sessionId: "a", exerciseId: "bench-press", weight: 140, reps: 3 },
    ];
    const xs = setEstimates(events);
    expect(xs).toHaveLength(1);
    expect(xs[0].rtf).toBe(7);
    expect(xs[0].e1rm).toBeCloseTo(estimate(100, 7), 6);
  });

  it("weights recent sessions and fades old ones", () => {
    const old = [set({ sessionId: "o", at: NOW - 150 * DAY, weight: 140, reps: 3 })];
    const recent = [set({ sessionId: "r", at: NOW - 2 * DAY, weight: 120, reps: 3 })];
    const r = oneRm([...old, ...recent], "bench-press", NOW)!;
    // The old heavy session is marked down for detraining, so the recent one leads.
    expect(r.e1rm).toBeLessThan(estimate(140, 3));
    expect(r.e1rm).toBeGreaterThan(estimate(120, 3));
    expect(r.basis!.sessionId).toBe("r");
    expect(detrain(10)).toBe(1);
    expect(detrain(81)).toBeCloseTo(0.98, 5);
    expect(detrain(10_000)).toBe(0.85);
  });

  it("ignores sets older than six months, falling back to the setup max", () => {
    const events = [set({ at: NOW - 200 * DAY })];
    expect(oneRm(events, "bench-press", NOW)).toBeNull();
    const r = oneRm(events, "bench-press", NOW, { knownMaxes: { "bench-press": 110 } })!;
    expect(r.source).toBe("setup");
    expect(r.e1rm).toBe(110);
    expect(r.confidence).toBe("low");
    expect(r.trend).toHaveLength(1);
  });

  it("is confident with agreeing low-rep sessions and gives a range", () => {
    const events = [1, 4, 8].map((d, i) => set({ sessionId: `s${i}`, at: NOW - d * DAY, weight: 100, reps: 3, targetReps: 3 }));
    const r = oneRm(events, "bench-press", NOW)!;
    expect(r.confidence).toBe("high");
    expect(r.e1rm).toBeCloseTo(estimate(100, 3), 3);
    expect(r.low).toBeLessThan(r.e1rm);
    expect(r.high).toBeGreaterThan(r.e1rm);
    expect(r.sessions).toBe(3);
  });

  it("is less sure of high-rep, guessed-RIR sets", () => {
    const r = oneRm([set({ weight: 50, reps: 12, targetReps: 12, startedAt: undefined, rir: 2 })], "bench-press", NOW)!;
    expect(r.confidence).toBe("low");
  });

  it("lists every exercise with data, most sessions first", () => {
    const events = [
      set({ sessionId: "a", exerciseId: "back-squat", weight: 120 }),
      set({ sessionId: "b", exerciseId: "back-squat", weight: 125, at: NOW - 3 * DAY }),
      set({ sessionId: "a", exerciseId: "bench-press", weight: 90 }),
    ];
    const list = allOneRms(events, NOW, { knownMaxes: { deadlift: 180 } });
    expect(list.map((l) => l.exerciseId)).toEqual(["back-squat", "bench-press", "deadlift"]);
  });
});

describe("DOTS", () => {
  it("matches published values", () => {
    // 100 kg man totalling 600 kg ≈ 369; 60 kg woman totalling 300 kg ≈ 332.6.
    expect(dots(600, 100, "male")).toBeCloseTo(369.3, 0);
    expect(dots(300, 60, "female")).toBeCloseTo(332.6, 0);
    expect(dots(0, 80, "male")).toBe(0);
    // Body weight is clamped to the formula's range.
    expect(dots(500, 30, "male")).toBe(dots(500, 40, "male"));
    expect(dots(500, 180, "female")).toBe(dots(500, 150, "female"));
  });

  it("bands", () => {
    expect(dotsBand(150)).toBe("Beginner");
    expect(dotsBand(250)).toBe("Novice");
    expect(dotsBand(350)).toBe("Intermediate");
    expect(dotsBand(450)).toBe("Advanced");
    expect(dotsBand(520)).toBe("Elite");
  });

  it("builds from the lifter's estimated maxes and latest weigh-in", () => {
    const events: AppEvent[] = [
      set({ exerciseId: "back-squat", weight: 150, reps: 1, targetReps: 1 }),
      set({ exerciseId: "bench-press", weight: 100, reps: 1, targetReps: 1 }),
      { type: "bodyweight", id: "b1", at: NOW - 30 * DAY, kg: 90 },
      { type: "bodyweight", id: "b2", at: NOW - DAY, kg: 85 },
    ];
    const profile = { bodyweight: 80, knownMaxes: {}, sex: undefined };
    const partial = dotsFromData(events, profile, NOW);
    expect(partial.score).toBeNull();
    expect(partial.bodyweight).toBe(85);
    const full = dotsFromData([...events, set({ exerciseId: "deadlift", weight: 200, reps: 1, targetReps: 1 })], profile, NOW);
    expect(full.total).toBeCloseTo(450, 5);
    expect(full.score).toBeCloseTo(dots(450, 85, "male"), 6);
    expect(dotsFromData(events, { ...profile, sex: "female" }, NOW).sex).toBe("female");
  });
});

describe("strength score", () => {
  it("uses the same estimate as the calculator", () => {
    const events = [set({ sessionId: "a", weight: 100, reps: 5 }), set({ sessionId: "b", at: NOW - 4 * DAY, weight: 95, reps: 6 })];
    const lift = strength(events, { bodyweight: 80 }, NOW).lifts.find((l) => l.exerciseId === "bench-press")!;
    expect(lift.e1rm).toBeCloseTo(oneRm(events, "bench-press", NOW)!.e1rm, 6);
  });
});
