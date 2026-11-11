// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultProfile } from "./defaults";
import { setsCsv } from "./exportData";
import { readImport } from "./importCsv";
import { sessionsOf } from "./progression";
import { REST_PAUSE_SEC, useApp } from "./store";
import type { SetEvent } from "./types";

// Set types (competitor gaps, Melvin 2026-11-11): drop sets and rest-pause sets added between sets,
// and failure as a reps-left rating of 0.

const NOW = new Date("2026-11-11T18:00:00").getTime();
const profile = { ...defaultProfile(NOW - 3 * 86400_000), onboarded: true, bodyweight: 80 };
const sets = () => useApp.getState().events.filter((e): e is SetEvent => e.type === "set");

describe("bonus sets in a workout", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...profile, activeGymId: id });
    useApp.getState().replan();
  });
  afterEach(() => vi.useRealTimers());

  /** A workout whose first exercise is a plain three-set bench press, 100 kg × 8. */
  function onBench() {
    const s = useApp.getState;
    s().start();
    const a = s().active!;
    const first = {
      ...a.plan.items[0],
      exerciseId: "bench-press",
      sets: 3,
      warmup: undefined,
      setTargets: undefined,
      slot: undefined,
      group: undefined,
      target: { ...a.plan.items[0].target, weight: 100, reps: 8 },
    };
    useApp.setState({
      active: { ...a, index: 0, plan: { ...a.plan, items: [first, ...a.plan.items.slice(1)] }, warm: undefined, weight: 100, reps: 8 },
    });
    return s;
  }

  it("adds a lighter drop set straight away, then goes back to the planned sets", () => {
    const s = onBench();
    s().logSet();
    s().extraSet("drop");
    const a = s().active!;
    expect(a.tag).toBe("drop");
    expect(a.weight).toBeLessThan(100);
    expect(a.weight).toBeGreaterThanOrEqual(70);
    expect(a.restUntil).toBeNull();
    s().logSet();
    expect(sets().map((x) => x.tag)).toEqual([undefined, "drop"]);
    // Still on the bench press, back at the weight dialled in for set 2.
    expect(s().active!.index).toBe(0);
    expect(s().active!.weight).toBe(100);
    expect(s().active!.tag).toBeUndefined();
  });

  it("doesn't count a bonus set as one of the planned sets", () => {
    const s = onBench();
    s().logSet();
    s().extraSet("restPause");
    s().logSet();
    s().logSet();
    s().logSet();
    // Three planned sets plus the bonus: now on the next exercise.
    expect(sets()).toHaveLength(4);
    expect(s().active!.index).toBe(1);
  });

  it("takes the lifter back to the exercise just finished, and Cancel returns to where they were", () => {
    const s = onBench();
    s().logSet();
    s().logSet();
    s().logSet();
    expect(s().active!.index).toBe(1);
    const nextWeight = s().active!.weight;
    s().extraSet("drop");
    expect(s().active!.index).toBe(0);
    s().extraSet(undefined);
    expect(s().active!.index).toBe(1);
    expect(s().active!.weight).toBe(nextWeight);
    expect(s().active!.tag).toBeUndefined();
  });

  it("pauses briefly before a rest-pause set at the same weight, with fewer reps", () => {
    const s = onBench();
    s().logSet();
    s().extraSet("restPause");
    const a = s().active!;
    expect(a.weight).toBe(100);
    expect(a.reps).toBeLessThan(8);
    expect(a.restUntil).toBe(NOW + REST_PAUSE_SEC * 1000);
  });
});

describe("set types elsewhere", () => {
  const base: Omit<SetEvent, "id" | "at"> = {
    type: "set",
    sessionId: "a",
    exerciseId: "bench-press",
    weight: 100,
    reps: 8,
    targetReps: 8,
    rir: 2,
  };

  it("leaves bonus sets out of what progression reads", () => {
    const events: SetEvent[] = [
      { ...base, id: "1", at: NOW },
      { ...base, id: "2", at: NOW + 1, weight: 75, tag: "drop" },
    ];
    expect(sessionsOf(events, "bench-press")[0].map((x) => x.id)).toEqual(["1"]);
  });

  it("writes the type in the export, and reads it back", () => {
    const csv = setsCsv(
      [
        { ...base, id: "1", at: NOW },
        { ...base, id: "2", at: NOW + 1, weight: 75, tag: "drop" },
        { ...base, id: "3", at: NOW + 2, tag: "restPause" },
        { type: "effort", id: "e", at: NOW + 3, setId: "1", rir: 0 },
      ],
      "kg",
    );
    const lines = csv.trim().split("\n");
    expect(lines[1].endsWith(",failure,")).toBe(true);
    expect(lines[2].endsWith(",drop,")).toBe(true);
    expect(lines[3].endsWith(",rest-pause,")).toBe(true);
    const back = readImport(csv);
    expect(back?.workouts[0].sets.map((x) => x.tag)).toEqual([undefined, "drop", "restPause"]);
  });

  it("reads drop sets from Strong and Hevy files", () => {
    const strong = readImport(
      "Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds\n2026-11-01 10:00:00,Push,1h,Bench Press (Barbell),1,100,8,0,0\n2026-11-01 10:00:00,Push,1h,Bench Press (Barbell),D,70,10,0,0\n",
    );
    expect(strong?.workouts[0].sets.map((x) => x.tag)).toEqual([undefined, "drop"]);
    const hevy = readImport(
      'title,start_time,end_time,exercise_title,superset_id,set_type,weight_kg,reps,distance_km,duration_seconds\nPush,"1 Nov 2026, 10:00","1 Nov 2026, 11:00",Bench Press (Barbell),,normal,100,8,,\nPush,"1 Nov 2026, 10:00","1 Nov 2026, 11:00",Bench Press (Barbell),,dropset,70,10,,\n',
    );
    expect(hevy?.workouts[0].sets.map((x) => x.tag)).toEqual([undefined, "drop"]);
  });
});
