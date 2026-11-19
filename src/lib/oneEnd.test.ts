import { describe, expect, it } from "vitest";

import { makeTestGym } from "@/test/factories";

import { EXERCISES, ONE_END } from "./exercises";
import { roundLoad, stepLoad } from "./loads";
import { toKg } from "./units";

// Landmine moves load one end of the bar (Melvin, 2026-11-19), tagged in the data, not by name.
describe("one-end barbell moves", () => {
  it("are all barbell moves, and every landmine move is one", () => {
    for (const id of ONE_END) expect(EXERCISES.find((e) => e.id === id)?.load, id).toBe("barbell");
    for (const e of EXERCISES) if (/landmine/.test(e.id)) expect(e.oneEnd, e.id).toBe(true);
    expect(EXERCISES.find((e) => e.id === "t-bar-row")?.oneEnd).toBe(true);
    expect(EXERCISES.find((e) => e.id === "barbell-row")?.oneEnd).toBeUndefined();
  });

  it("round and step with the plates on one end", () => {
    const gym = makeTestGym();
    const ex = EXERCISES.find((e) => e.id === "landmine-press")!;
    const r = roundLoad(toKg(gym.unit === "lb" ? 55 : 25, gym.unit), ex, gym);
    expect(r.loading?.oneEnd).toBe(true);
    // A one-end step is one of the lightest plate, half a two-sided bar's.
    const two = EXERCISES.find((e) => e.id === "barbell-row")!;
    const up1 = stepLoad(r.kg, 1, ex, gym) - r.kg;
    const up2 = stepLoad(r.kg, 1, two, gym) - r.kg;
    expect(up1).toBeCloseTo(up2 / 2, 5);
  });
});
