import { describe, expect, it } from "vitest";

import { NOW } from "../test/factories";
import { coolDownHome, doneParts, enterPart, hadCoolDown, joinStretches, partsOf, planParts, type WorkoutSpan } from "./sessions";
import type { StretchEvent } from "./types";

const MIN = 60_000;
let n = 0;
const stretch = (over: Partial<StretchEvent>): StretchEvent => ({
  type: "stretch",
  id: `st-${++n}`,
  at: NOW,
  moment: "pick",
  ids: ["childs-pose"],
  seconds: 300,
  ...over,
});
// A 45-minute workout starting at NOW.
const workout: WorkoutSpan = { sessionId: "w1", start: NOW, seconds: 45 * 60 };
const end = NOW + 45 * MIN;

describe("joinStretches", () => {
  it("reads old data as it is: a workout with no stretches is one lifting part", () => {
    const { bySession, loose } = joinStretches([], [workout]);
    expect(bySession.size).toBe(0);
    expect(loose).toEqual([]);
    expect(partsOf(workout, bySession.get("w1"))).toEqual([{ kind: "lift", seconds: 45 * 60 }]);
  });

  it("joins a warm-up that ended shortly before the start, and a cool-down shortly after the end", () => {
    const warm = stretch({ moment: "warm", at: NOW - 2 * MIN, seconds: 300 });
    const cool = stretch({ moment: "cool", at: end + 10 * MIN, seconds: 240 });
    const { bySession, loose } = joinStretches([warm, cool], [workout]);
    expect(loose).toEqual([]);
    expect(partsOf(workout, bySession.get("w1")).map((p) => [p.kind, p.seconds])).toEqual([
      ["warm", 300],
      ["lift", 45 * 60],
      ["cool", 240],
    ]);
  });

  it("leaves stretches far from any workout, and rest-day and library stretches, on their own", () => {
    const earlyWarm = stretch({ moment: "warm", at: NOW - 3 * 60 * MIN });
    const lateCool = stretch({ moment: "cool", at: end + 3 * 60 * MIN });
    const rest = stretch({ moment: "rest", at: end + 5 * MIN });
    const pick = stretch({ moment: "pick", at: NOW - 5 * MIN });
    const { bySession, loose } = joinStretches([earlyWarm, lateCool, rest, pick], [workout]);
    expect(bySession.size).toBe(0);
    expect(loose.map((s) => s.id)).toEqual([earlyWarm, pick, rest, lateCool].map((s) => s.id));
  });

  it("trusts a sessionId over time, and ignores one for a workout that's gone", () => {
    const tied = stretch({ moment: "cool", at: end + 5 * 60 * MIN, sessionId: "w1" });
    const orphan = stretch({ moment: "cool", at: NOW - 24 * 60 * MIN, sessionId: "deleted" });
    const { bySession, loose } = joinStretches([tied, orphan], [workout]);
    expect(bySession.get("w1")?.cool.map((s) => s.id)).toEqual([tied.id]);
    expect(loose.map((s) => s.id)).toEqual([orphan.id]);
  });

  it("gives a warm-up to the next workout and a cool-down to the last one when two are close", () => {
    const second: WorkoutSpan = { sessionId: "w2", start: end + 20 * MIN, seconds: 30 * 60 };
    const between = stretch({ moment: "warm", at: end + 15 * MIN });
    const cool = stretch({ moment: "cool", at: end + 10 * MIN, seconds: 60 });
    const { bySession } = joinStretches([between, cool], [second, workout]);
    expect(bySession.get("w2")?.warm).toHaveLength(1);
    expect(bySession.get("w1")?.cool).toHaveLength(1);
  });

  it("never loses or doubles a stretch", () => {
    const all = Array.from({ length: 40 }, (_, i) =>
      stretch({ moment: (["warm", "cool", "rest", "pick"] as const)[i % 4], at: NOW - 2 * 60 * MIN + i * 7 * MIN }),
    );
    const { bySession, loose } = joinStretches(all, [workout]);
    const placed = [...bySession.values()].flatMap((p) => [...p.warm, ...p.cool]);
    expect(new Set([...placed, ...loose].map((s) => s.id)).size).toBe(all.length);
    expect(placed.length + loose.length).toBe(all.length);
  });
});

describe("coolDownHome", () => {
  it("is the latest workout that ended within the hour before the cool-down began", () => {
    expect(coolDownHome([workout], end + 6 * MIN, 300)).toBe("w1");
    expect(coolDownHome([workout], end + 2 * 60 * MIN, 300)).toBeUndefined();
    expect(coolDownHome([], end, 300)).toBeUndefined();
  });
});

describe("parts of the workout in progress", () => {
  it("plans the warm-up and cool-down only when picked, around the lifting or rehab", () => {
    expect(planParts({ warm: true, cool: true }, false).map((p) => p.kind)).toEqual(["warm", "lift", "cool"]);
    expect(planParts({ warm: false, cool: true }, true).map((p) => p.kind)).toEqual(["rehab", "cool"]);
    expect(planParts({ warm: false, cool: false }, false).map((p) => p.kind)).toEqual(["lift"]);
  });

  it("closes the part before when the next one starts, and marks it skipped when asked", () => {
    let parts = enterPart(planParts({ warm: true, cool: true }, false), 0, NOW);
    parts = enterPart(parts, 1, NOW + 4 * MIN);
    expect(parts[0]).toEqual({ kind: "warm", start: NOW, end: NOW + 4 * MIN });
    expect(parts[1]).toEqual({ kind: "lift", start: NOW + 4 * MIN });
    parts = enterPart(parts, 2, NOW + 50 * MIN, true);
    expect(parts[1]).toMatchObject({ end: NOW + 50 * MIN, skipped: true });
  });

  it("records only the parts actually done, closing the open one at the end", () => {
    let parts = enterPart(planParts({ warm: true, cool: true }, false), 1, NOW, true);
    // The warm-up was never started: skipped straight to the lifting.
    expect(doneParts(parts, end)).toEqual([{ id: "lift", kind: "lift", start: NOW, end }]);
    parts = enterPart(parts, 2, end);
    expect(doneParts(parts, end + 5 * MIN).map((p) => [p.kind, p.end])).toEqual([
      ["lift", end],
      ["cool", end + 5 * MIN],
    ]);
  });

  it("knows when a workout already had a cool-down", () => {
    expect(hadCoolDown([{ kind: "lift" }, { kind: "cool" }])).toBe(true);
    expect(hadCoolDown([{ kind: "lift" }])).toBe(false);
    expect(hadCoolDown(undefined)).toBe(false);
  });

  it("uses the recorded times of a workout run with parts, and still lists its stretches", () => {
    const cool = stretch({ moment: "cool", sessionId: "w1", ids: ["childs-pose"], seconds: 200 });
    const parts = partsOf(workout, { warm: [], cool: [cool] }, [
      { id: "lift", kind: "lift", start: NOW, end },
      { id: "cool", kind: "cool", start: end, end: end + 5 * MIN },
    ]);
    expect(parts).toEqual([
      { kind: "lift", seconds: 45 * 60 },
      { kind: "cool", seconds: 300, stretchIds: ["childs-pose"] },
    ]);
  });
});
