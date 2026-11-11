import { describe, expect, it } from "vitest";

import { fastestMetres, MAX_DOWN, speedMax, type WarmupSpeed } from "./speedMax";
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
