import { describe, expect, it } from "vitest";

import { DAY, makeSet, NOW } from "@/test/factories";

import type { AppEvent, SetEvent } from "../types";
import { fastestMetres, lastFullMetres, MAX_DOWN, MVT_RANGE, personalMvt, speedMax, type WarmupSpeed } from "./speedMax";
import { summarise } from "./tracker";
import type { Rep } from "./types";

// Back squat planned at 100 kg × 5 with 2 reps in reserve: Epley puts the planned max at about 123 kg.
const SQUAT = { pattern: "squat" as const, weight: 100, reps: 5, rir: 2 };
const plate = (kg: number) => Math.round(kg / 2.5) * 2.5;

/** Warm-ups on a straight line that reaches the squat's 0.3 m/s threshold at `max` kg. */
function warmups(max: number, kgs = [20, 60, 80], slope = -0.006): WarmupSpeed[] {
  const a = 0.3 - slope * max;
  return kgs.map((kg) => ({ kg, speed: a + slope * kg }));
}

describe("today's max from warm-up speed", () => {
  it("finds the max where the warm-up line reaches the lift's threshold speed", () => {
    const r = speedMax(warmups(135), SQUAT, plate)!;
    expect(r.max).toBeCloseTo(135, 6);
    expect(r.planned).toBeCloseTo(123.33, 1);
  });

  it("nudges up when the warm-ups moved fast, but never more than 5%", () => {
    const r = speedMax(warmups(135), SQUAT, plate)!;
    expect(r.call).toBe("up");
    expect(r.diff).toBeGreaterThan(0.05);
    expect(r.weight).toBe(105);
  });

  it("nudges down when they moved slowly, at most 10%", () => {
    const r = speedMax(warmups(105), SQUAT, plate)!;
    expect(r.call).toBe("down");
    expect(r.weight).toBe(100 * (1 - MAX_DOWN));
    const small = speedMax(warmups(115), SQUAT, plate)!;
    expect(small.call).toBe("down");
    expect(small.weight).toBe(92.5);
  });

  it("keeps the plan when the difference is within 5%", () => {
    const r = speedMax(warmups(126), SQUAT, plate)!;
    expect(r.call).toBe("hold");
    expect(r.weight).toBe(100);
  });

  it("keeps the plan when the gym can't make a small enough step", () => {
    const dumbbells = (kg: number) => [17.5, 20, 22.5, 25].reduce((b, x) => (Math.abs(x - kg) < Math.abs(b - kg) ? x : b));
    const press = { pattern: "hpush" as const, weight: 20, reps: 10, rir: 2 };
    const r = speedMax(
      [
        { kg: 10, speed: 0.9 },
        { kg: 15, speed: 0.75 },
      ],
      press,
      dumbbells,
    );
    expect(r?.call).toBe("hold");
    expect(r?.weight).toBe(20);
  });

  it("says nothing without two warm-up weights, a downward slope, or a lift with a known threshold", () => {
    expect(speedMax([{ kg: 60, speed: 0.8 }], SQUAT, plate)).toBeUndefined();
    expect(
      speedMax(
        [
          { kg: 60, speed: 0.8 },
          { kg: 60, speed: 0.7 },
        ],
        SQUAT,
        plate,
      ),
    ).toBeUndefined();
    expect(
      speedMax(
        [
          { kg: 40, speed: 0.6 },
          { kg: 80, speed: 0.7 },
        ],
        SQUAT,
        plate,
      ),
    ).toBeUndefined();
    expect(speedMax(warmups(135), { ...SQUAT, pattern: "core" }, plate)).toBeUndefined();
  });

  it("says nothing when the warm-ups were too light to judge", () => {
    expect(speedMax(warmups(135, [20, 40]), SQUAT, plate)).toBeUndefined();
  });

  it("says nothing when three warm-ups don't sit on a line", () => {
    const messy = [
      { kg: 20, speed: 1.0 },
      { kg: 60, speed: 0.4 },
      { kg: 80, speed: 0.9 },
    ];
    expect(speedMax(messy, SQUAT, plate)).toBeUndefined();
  });

  it("ignores impossible speeds and keeps the fastest of two warm-ups at one weight", () => {
    const r = speedMax([...warmups(135), { kg: 60, speed: 9 }, { kg: 80, speed: 0.5 }], SQUAT, plate)!;
    expect(r.max).toBeCloseTo(135, 6);
  });
});

describe("a warm-up's fastest rep", () => {
  const rep = (speed: number, i: number, metres = true, kind: Rep["kind"] = "full"): Rep => ({
    index: i,
    kind,
    start: i * 2000,
    turn: i * 2000 + 800,
    end: i * 2000 + 1600,
    rom: 90,
    depth: 1,
    concentricMs: 800,
    eccentricMs: 800,
    speed,
    speedIsMetres: metres,
    velocityLoss: 0,
    grinder: false,
    sticking: false,
  });

  it("takes the fastest full rep in m/s", () => {
    expect(fastestMetres(summarise([rep(0.8, 0), rep(0.95, 1), rep(2, 2, true, "partial")]))).toBe(0.95);
  });

  it("has nothing without a scale or a full rep", () => {
    expect(fastestMetres(summarise([rep(40, 0, false)]))).toBeUndefined();
    expect(fastestMetres(summarise([]))).toBeUndefined();
  });
});

describe("each lifter's own threshold from sets taken to failure", () => {
  const SQ = (id: string) => (id === "back-squat" ? ("squat" as const) : id === "bench-press" ? ("hpush" as const) : undefined);
  const hard = (endSpeed: number, over: Partial<SetEvent> = {}) =>
    makeSet({ exerciseId: "back-squat", endSpeed, failedRep: true, at: NOW - DAY, ...over });

  it("uses the textbook speed, and says how many hard sets it still needs, until it has three", () => {
    const r = personalMvt([hard(0.4), hard(0.4)], "squat", SQ, NOW)!;
    expect(r).toEqual({ mvt: 0.3, book: 0.3, sets: 0, needed: 1 });
  });

  it("learns the median end speed, pulled a little towards the textbook", () => {
    const r = personalMvt([hard(0.38), hard(0.4), hard(0.42), hard(0.9)], "squat", SQ, NOW)!;
    // Median 0.41 over 4 sets, textbook 0.30 counted as 2: (0.41·4 + 0.3·2) / 6.
    expect(r.sets).toBe(4);
    expect(r.mvt).toBeCloseTo(0.37, 2);
  });

  it("counts a set as hard from a failed rep, no reps left, an AMRAP set or missed reps, and nothing else", () => {
    const easy = makeSet({ exerciseId: "back-squat", endSpeed: 0.5, reps: 5, targetReps: 5, at: NOW - DAY });
    const noneLeft = makeSet({ exerciseId: "back-squat", endSpeed: 0.4, at: NOW - DAY });
    const effort: AppEvent = { type: "effort", id: "e1", at: NOW - DAY, setId: noneLeft.id, rir: 0 };
    const amrap = makeSet({ exerciseId: "back-squat", endSpeed: 0.4, amrap: true, at: NOW - DAY });
    const missed = makeSet({ exerciseId: "back-squat", endSpeed: 0.4, reps: 3, targetReps: 5, at: NOW - DAY });
    const injured = hard(0.9, { injuryPct: 0.7 });
    const r = personalMvt([easy, noneLeft, effort, amrap, missed, injured], "squat", SQ, NOW)!;
    expect(r.sets).toBe(3);
    expect(r.mvt).toBeCloseTo((0.4 * 3 + 0.3 * 2) / 5, 2);
  });

  it("keeps to the same movement, recent sets and believable speeds", () => {
    const events = [hard(0.4), hard(0.4), hard(0.4, { exerciseId: "bench-press" }), hard(0.4, { at: NOW - 200 * DAY }), hard(5)];
    expect(personalMvt(events, "squat", SQ, NOW)!.sets).toBe(0);
  });

  it("uses only the latest eight hard sets", () => {
    const old = Array.from({ length: 8 }, (_, i) => hard(0.6, { at: NOW - 30 * DAY - i }));
    const recent = Array.from({ length: 8 }, (_, i) => hard(0.33, { at: NOW - DAY - i }));
    expect(personalMvt([...old, ...recent], "squat", SQ, NOW)!.mvt).toBeCloseTo((0.33 * 8 + 0.3 * 2) / 10, 2);
  });

  it("never strays past the allowed range of the textbook speed", () => {
    const fast = Array.from({ length: 8 }, () => hard(2.5));
    expect(personalMvt(fast, "squat", SQ, NOW)!.mvt).toBeCloseTo(0.3 * MVT_RANGE.high, 6);
  });

  it("has nothing for a movement without a known threshold", () => {
    expect(personalMvt([], "carry", SQ, NOW)).toBeUndefined();
  });

  it("moves today's max: a lifter whose own threshold is faster gets a lower max from the same warm-ups", () => {
    const book = speedMax(warmups(123), SQUAT, plate)!;
    const own = speedMax(warmups(123), { ...SQUAT, mvt: 0.36 }, plate)!;
    expect(book.call).toBe("hold");
    expect(own.max).toBeCloseTo(113, 0);
    expect(own.call).toBe("down");
  });
});

describe("a working set's last full rep", () => {
  const rep = (index: number, kind: Rep["kind"], speed: number): Rep => ({
    index,
    kind,
    start: index * 3000,
    turn: index * 3000 + 1000,
    end: index * 3000 + 2000,
    rom: 90,
    depth: 1,
    concentricMs: 1000,
    eccentricMs: 1000,
    speed,
    speedIsMetres: true,
    velocityLoss: 0,
    grinder: false,
    sticking: false,
  });

  it("gives its speed, and whether a rep failed after it", () => {
    const base = { full: 2, partial: 0, failed: 1, grinders: 0, timeUnderLoadMs: 0 };
    expect(lastFullMetres({ ...base, reps: [rep(0, "full", 0.6), rep(1, "full", 0.35), rep(2, "failed", 0.1)] })).toEqual({
      speed: 0.35,
      failedAfter: true,
    });
    expect(lastFullMetres({ ...base, failed: 0, reps: [rep(0, "full", 0.6), rep(1, "full", 0.35)] })).toEqual({
      speed: 0.35,
      failedAfter: false,
    });
    expect(lastFullMetres({ ...base, reps: [] })).toBeUndefined();
  });
});
