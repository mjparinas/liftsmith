import { describe, expect, it } from "vitest";

import { CARDIO_EXERCISE, cloudCardioEvents, cloudReadingEvents } from "./cloudImport";
import { EXERCISE_BY_ID } from "./exercises";

const DAY = "2026-11-10";

describe("cloud readings", () => {
  it("turns a scale's weight and body fat into one weigh-in, and the rest into health readings", () => {
    const ev = cloudReadingEvents(
      "withings",
      [
        { metric: "weight", day: DAY, value: 82, at: 100 },
        { metric: "bodyFat", day: DAY, value: 18.2, at: 100 },
        { metric: "bodyFat", day: "2026-11-11", value: 18, at: 200 },
        { metric: "sleep", day: DAY, value: 7.5, at: 50 },
      ],
      new Set(),
    );
    expect(ev).toContainEqual({ type: "bodyweight", id: `withings-bw-${DAY}`, at: 100, kg: 82, bodyFat: 18.2 });
    expect(ev).toContainEqual({ type: "health", id: `withings-sleep-${DAY}-75`, at: 50, metric: "sleep", day: DAY, value: 7.5 });
    // Body fat without a weight that day isn't a weigh-in.
    expect(ev).toHaveLength(2);
  });

  it("adds nothing the second time", () => {
    const r = [{ metric: "weight" as const, day: DAY, value: 82, at: 100 }];
    const first = cloudReadingEvents("withings", r, new Set());
    expect(cloudReadingEvents("withings", r, new Set(first.map((e) => e.id)))).toEqual([]);
  });
});

describe("Concept2 sessions", () => {
  it("map to library cardio exercises, logged with distance except the elliptical and stairs", () => {
    for (const [kind, id] of Object.entries(CARDIO_EXERCISE))
      expect(EXERCISE_BY_ID.get(id)?.cardio).toBe(kind === "elliptical" || kind === "stairs" ? "time" : "distance");
  });

  it("become a finished manual workout with one cardio set, once, and never in the future", () => {
    const s = { id: "77", kind: "rower" as const, start: 1_000_000, seconds: 480, distanceM: 2000 };
    const ev = cloudCardioEvents([s, { ...s, id: "78", start: 9_000_000_000 }], "gym1", 5_000_000, new Set());
    expect(ev.map((e) => e.type)).toEqual(["sessionStart", "set", "sessionEnd"]);
    expect(ev[0]).toMatchObject({ id: "c2-77-start", gymId: "gym1", source: "manual", minutes: 8 });
    expect(ev[1]).toMatchObject({ exerciseId: "rowing-machine", reps: 480, distanceM: 2000, weight: 0 });
    expect(ev[2]).toMatchObject({ seconds: 480, at: 1_480_000 });
    expect(cloudCardioEvents([s], "gym1", 5_000_000, new Set(ev.map((e) => e.id)))).toEqual([]);
  });
});

describe("Garmin sessions", () => {
  const run = { id: "991", kind: "run" as const, start: 1_000_000, seconds: 1800, distanceM: 5000 };

  it("get their own ids, so a Concept2 id can't collide", () => {
    const ev = cloudCardioEvents([run], "gym1", 5_000_000, new Set(), "garmin");
    expect(ev[0]).toMatchObject({ id: "garmin-991-start", sessionId: "garmin-991" });
    expect(ev[1]).toMatchObject({ exerciseId: "outdoor-run", reps: 1800, distanceM: 5000 });
  });

  it("leave distance out for a machine that doesn't measure it", () => {
    const ev = cloudCardioEvents([{ ...run, kind: "stairs", distanceM: 0 }], "gym1", 5_000_000, new Set(), "garmin");
    expect(ev[1]).toMatchObject({ exerciseId: "stair-climber" });
    expect(ev[1]).not.toHaveProperty("distanceM");
  });

  it("skip a session that overlaps a workout already on the device", () => {
    expect(cloudCardioEvents([run], "gym1", 5_000_000, new Set(), "garmin", [[1_500_000, 4_000_000]])).toEqual([]);
    expect(cloudCardioEvents([run], "gym1", 5_000_000, new Set(), "garmin", [[2_800_001, 4_000_000]])).toHaveLength(3);
  });
});
