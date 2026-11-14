import { describe, expect, it } from "vitest";

import { CARDIO_FLOOR, hasOtherParts, LIFT_FLOOR, splitParts, splitSession, STRETCH_PART_MIN } from "./sessionSplit";

// Workout length covers the whole workout (Melvin, 2026-11-14; sessions-with-parts.md "Workout length").

describe("splitSession", () => {
  it("gives lifting the whole total when nothing else is on", () => {
    expect(splitSession({ total: 45 })).toEqual({ total: 45, warm: 0, lift: 45, rehab: 0, cardio: 0, cool: 0, cardioCut: 0, over: 0 });
    expect(splitSession({ total: 10 }).lift).toBe(10);
  });

  it("takes each part's minutes out of lifting: 45 with everything on is 25 of lifting", () => {
    const s = splitSession({ total: 45, warm: 5, cardio: 10, cool: 5 });
    expect(s).toEqual({ total: 45, warm: 5, lift: 25, rehab: 0, cardio: 10, cool: 5, cardioCut: 0, over: 0 });
    expect(splitParts(s)).toEqual([
      { kind: "warm", minutes: 5 },
      { kind: "lift", minutes: 25 },
      { kind: "cardio", minutes: 10 },
      { kind: "cool", minutes: 5 },
    ]);
  });

  it("counts rehab too, and keeps lifting at exactly the floor without cutting", () => {
    const s = splitSession({ total: 30, rehab: 10, cool: 5 });
    expect(s.lift).toBe(15);
    expect(s.cardioCut).toBe(0);
    expect(s.over).toBe(0);
    expect(splitParts(s).map((p) => p.kind)).toEqual(["lift", "rehab", "cool"]);
  });

  it("shrinks the cardio first so lifting keeps its floor", () => {
    const s = splitSession({ total: 40, warm: 5, cardio: 20, cool: 5 });
    expect(s).toMatchObject({ lift: 15, cardio: 15, cardioCut: 5, over: 0, total: 40 });
  });

  it("never cuts the cardio below its floor, and runs over after that", () => {
    const s = splitSession({ total: 25, warm: 5, cardio: 30, cool: 5 });
    expect(s).toMatchObject({ lift: 15, cardio: CARDIO_FLOOR, cardioCut: 25, over: 5, total: 30 });
    const t = splitSession({ total: 15, warm: 5, cardio: 10, cool: 5 });
    expect(t).toMatchObject({ lift: LIFT_FLOOR, cardio: 5, cardioCut: 5, over: 15, total: 30 });
  });

  it("leaves a cardio already at or under its floor alone", () => {
    const s = splitSession({ total: 20, cardio: 4, warm: 5 });
    expect(s).toMatchObject({ cardio: 4, cardioCut: 0, lift: 15, over: 4, total: 24 });
  });

  it("runs over when the parts without cardio leave too little", () => {
    const s = splitSession({ total: 15, warm: STRETCH_PART_MIN });
    expect(s).toMatchObject({ lift: 15, over: 5, total: 20, cardioCut: 0 });
  });

  it("reads missing, negative and fractional minutes as whole minutes", () => {
    expect(splitSession({ total: 45.4, warm: -3, cardio: 9.6 })).toMatchObject({ total: 45, warm: 0, cardio: 10, lift: 35 });
    expect(splitSession({ total: Number.NaN }).total).toBe(0);
  });

  it("says when the bar is worth showing", () => {
    expect(hasOtherParts(null)).toBe(false);
    expect(hasOtherParts(splitSession({ total: 45 }))).toBe(false);
    for (const k of ["warm", "rehab", "cardio", "cool"] as const) expect(hasOtherParts(splitSession({ total: 45, [k]: 5 }))).toBe(true);
  });
});
