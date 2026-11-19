import { describe, expect, it } from "vitest";

import { DAY, makeProfile, makeWorkout, NOW } from "@/test/factories";

import { t } from "./i18n";
import {
  countedOutside,
  hardOutside,
  MAX_SETS,
  outsideEvents,
  outsideKind,
  outsideSets,
  recentOutside,
  sessionWindows,
  type HealthWorkout,
} from "./outside";
import { readiness } from "./readiness";
import { recovery } from "./recovery";
import type { AppEvent, OutsideEvent } from "./types";

const HOUR = 3600_000;
const iso = (ms: number) => new Date(ms).toISOString();

/** A workout from Health: `minutes` long, ending at `end`. */
const hw = (workoutType: string, minutes: number, end: number, over: Partial<HealthWorkout> = {}): HealthWorkout => ({
  workoutType,
  duration: minutes * 60,
  startDate: iso(end - minutes * 60_000),
  endDate: iso(end),
  sourceId: "com.example.runner",
  sourceName: "Runner",
  platformId: `${workoutType}-${end}`,
  ...over,
});

const outside = (kind: OutsideEvent["kind"], minutes: number, end: number, id = `o-${kind}-${end}`): OutsideEvent => ({
  type: "outside",
  id,
  at: end - minutes * 60_000,
  kind,
  seconds: minutes * 60,
});

describe("Health's workout types", () => {
  it("map to our kinds, with unknown ones as other and non-exercise left out", () => {
    expect(outsideKind("running")).toBe("run");
    expect(outsideKind("soccer")).toBe("sport");
    expect(outsideKind("yoga")).toBe("mind");
    expect(outsideKind("highIntensityIntervalTraining")).toBe("hiit");
    expect(outsideKind("somethingNew")).toBe("other");
    expect(outsideKind("fishing")).toBeNull();
    expect(outsideKind("meditation")).toBeNull();
  });
});

describe("reading workouts from Health", () => {
  it("turns another app's workout into an outside event with its distance, calories and source", () => {
    const [e] = outsideEvents([hw("running", 45, NOW - HOUR, { totalDistance: 8012.4, totalEnergyBurned: 512.6 })], new Set(), [], NOW, 7);
    expect(e).toMatchObject({
      type: "outside",
      kind: "run",
      seconds: 2700,
      distanceM: 8012,
      kcal: 513,
      source: "Runner",
      at: NOW - HOUR - 45 * 60_000,
    });
    expect(e!.id).toBe(`hw-7-running-${NOW - HOUR}`);
  });

  it("leaves out Liftsmith's own workouts, short ones, unfinished ones and ones already in the log", () => {
    const mine = hw("traditionalStrengthTraining", 50, NOW - HOUR, { sourceId: "com.getliftsmith.app" });
    const short = hw("walking", 3, NOW - HOUR);
    const future = hw("running", 30, NOW + HOUR);
    const known = hw("cycling", 60, NOW - 2 * HOUR);
    const have = new Set([`hw-0-${known.platformId}`]);
    expect(outsideEvents([mine, short, future, known], have, [], NOW)).toEqual([]);
  });

  it("leaves out a workout that overlaps a Liftsmith workout (the watch saw the same session)", () => {
    const events = makeWorkout("s1", NOW - 2 * HOUR, [{}, {}, {}]);
    const windows = sessionWindows(events);
    const same = hw("traditionalStrengthTraining", 30, NOW - 2 * HOUR + 20 * 60_000);
    const later = hw("running", 30, NOW - 10 * 60_000);
    expect(outsideEvents([same, later], new Set(), windows, NOW).map((e) => e.kind)).toEqual(["run"]);
  });

  it("adds the same workout once even when Health sends it twice", () => {
    const w = hw("running", 30, NOW - HOUR);
    expect(outsideEvents([w, w], new Set(), [], NOW)).toHaveLength(1);
  });
});

describe("fatigue from outside workouts", () => {
  it("grows with the minutes and stops at a cap", () => {
    expect(outsideSets({ kind: "run", seconds: 30 * 60 })).toBeCloseTo(1.5);
    expect(outsideSets({ kind: "run", seconds: 60 * 60 })).toBeCloseTo(3);
    expect(outsideSets({ kind: "hike", seconds: 8 * 3600 })).toBe(MAX_SETS);
    expect(outsideSets({ kind: "mind", seconds: 90 * 60 })).toBe(0);
  });

  it("tires the legs after a long run, and less the longer ago it was", () => {
    const fresh = recovery([], NOW);
    expect(fresh.quads).toBe(100);
    const run = outside("run", 60, NOW - HOUR);
    const after = recovery([run], NOW);
    expect(after.quads).toBeLessThan(70);
    expect(after.chest).toBe(100);
    expect(recovery([run], NOW + 2 * DAY).quads).toBeGreaterThan(after.quads);
  });

  it("leaves yoga out of the map", () => {
    expect(recovery([outside("mind", 75, NOW - HOUR)], NOW)).toEqual(recovery([], NOW));
  });

  it("doesn't count one that overlaps a Liftsmith workout that came in later", () => {
    const run = outside("run", 40, NOW - HOUR);
    const workout = makeWorkout("s9", NOW - HOUR - 30 * 60_000, [{ exerciseId: "bench-press" }]);
    const events: AppEvent[] = [run, ...workout];
    expect(countedOutside(events)).toEqual([]);
    expect(recovery(events, NOW).quads).toBe(100);
  });
});

describe("the readiness signal", () => {
  it("names a hard outside workout from the last day and leans the call easier", () => {
    const lifting = makeWorkout("s1", NOW - 3 * DAY, [{}, {}, {}]);
    const match = outside("sport", 90, NOW - 3 * HOUR);
    const before = readiness(lifting, makeProfile(), NOW);
    const after = readiness([...lifting, match], makeProfile(), NOW);
    const text = t("sig.outside", { what: t("conn.outside.kind.sport"), minutes: 90 });
    expect(after.signals.map((s) => s.text)).toContain(text);
    expect(after.score).toBeLessThan(before.score);
  });

  it("says nothing for a walk or for a workout more than a day ago", () => {
    expect(hardOutside([outside("walk", 60, NOW - HOUR)], NOW)).toBeNull();
    expect(hardOutside([outside("run", 60, NOW - 30 * HOUR)], NOW)).toBeNull();
    expect(hardOutside([outside("run", 60, NOW - HOUR)], NOW)?.kind).toBe("run");
  });
});

describe("the list under the recovery map", () => {
  it("shows the last week's outside workouts, newest first", () => {
    const old = outside("ride", 60, NOW - 9 * DAY);
    const a = outside("run", 30, NOW - 2 * DAY);
    const b = outside("swim", 40, NOW - HOUR);
    expect(recentOutside([old, a, b], NOW).map((e) => e.kind)).toEqual(["swim", "run"]);
  });
});
