import { describe, expect, it } from "vitest";

import { barSpeed, STOP_LOSS } from "./barSpeed";
import { summarise } from "./tracker";
import type { Rep } from "./types";

const rep = (speed: number, i: number, metres = true): Rep => ({
  index: i,
  kind: "full",
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
const set = (speeds: number[], metres = true) => summarise(speeds.map((v, i) => rep(v, i, metres)));

describe("camera bar speed", () => {
  it("shows nothing before the first full rep", () => {
    expect(barSpeed(set([]))).toBeUndefined();
  });

  it("shows the last rep's speed and its drop, with no advice for the first two reps", () => {
    expect(barSpeed(set([0.6, 0.5]))).toEqual({
      speed: 0.5,
      metres: true,
      loss: expect.closeTo(1 / 6, 5),
      rir: undefined,
      advice: undefined,
    });
  });

  it("says how many reps are left while the bar still moves well", () => {
    const r = barSpeed(set([0.6, 0.58, 0.5]))!;
    expect(r.loss).toBeCloseTo(0.167, 3);
    expect(r).toMatchObject({ rir: 3, advice: "left" });
  });

  it("says to end the set once speed is down by a third or so", () => {
    const r = barSpeed(set([0.6, 0.55, 0.6 * (1 - STOP_LOSS)]))!;
    expect(r.advice).toBe("stop");
    expect(barSpeed(set([0.6, 0.55, 0.3]))!.rir).toBe(0);
  });

  it("keeps relative speeds when the camera has no scale", () => {
    expect(barSpeed(set([90, 80, 85], false))).toMatchObject({ metres: false, speed: 85 });
  });
});
