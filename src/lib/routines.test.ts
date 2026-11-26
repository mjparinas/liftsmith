import { describe, expect, it } from "vitest";

import { defaultProfile, makeGym } from "./defaults";
import { generate } from "./generator";
import {
  cleanParts,
  cleanRange,
  cleanRoutine,
  doneItems,
  moveItem,
  partDefaults,
  phaseSets,
  planFromRoutine,
  routineFrom,
  upsertRoutine,
} from "./routines";
import type { AppEvent, Routine } from "./types";

const NOW = Date.UTC(2026, 10, 9, 18);

const routine = (items: Routine["items"], id = "r1"): Routine => ({ id, name: "Push", items, createdAt: NOW, updatedAt: NOW });

describe("routines", () => {
  it("cleans names, set counts, unknown exercises and broken supersets", () => {
    const r = cleanRoutine(
      routine([
        { exerciseId: "bench-press", sets: 0, group: "x" },
        { exerciseId: "not-an-exercise", sets: 3, group: "x" },
        { exerciseId: "lateral-raise", sets: 40 },
      ]),
    );
    expect(r.items.map((i) => [i.exerciseId, i.sets, i.group])).toEqual([
      ["bench-press", 1, undefined],
      ["lateral-raise", 10, undefined],
    ]);
    expect(cleanRoutine({ ...r, name: "   " }).name).toBe("My routine");
  });

  it("clamps a physio's reps and trims a cue, and drops them when it isn't rehab", () => {
    const rehab = cleanRoutine({
      ...routine([{ exerciseId: "wall-sit", sets: 2, reps: 400, cue: "  Hold the wall.  " }]),
      rehab: true,
      rehabPart: "knee",
      perWeek: 3,
    });
    expect(rehab.items[0]).toMatchObject({ reps: 120, cue: "Hold the wall." });
    expect(rehab.rehabPart).toBe("knee");
    const plain = cleanRoutine({ ...rehab, rehab: undefined, rehabPart: "knee", perWeek: 9 });
    expect(plain.items[0]).not.toHaveProperty("reps");
    expect(plain.items[0]).not.toHaveProperty("cue");
    expect(plain.rehabPart).toBeUndefined();
    expect(plain.perWeek).toBeUndefined();
  });

  it("builds today's plan from a routine at this gym, with targets, warm-ups and supersets", () => {
    const gym = makeGym("commercial", "kg", "g");
    const profile = { ...defaultProfile(NOW), activeGymId: "g", onboarded: true };
    const base = generate({ gym, profile, events: [], minutes: 45, now: NOW });
    const r = routine([
      { exerciseId: "bench-press", sets: 4 },
      { exerciseId: "barbell-row", sets: 3, group: "ss" },
      { exerciseId: "lateral-raise", sets: 3, group: "ss" },
    ]);
    const out = planFromRoutine(base, r, [], profile, gym, NOW)!;
    expect(out.dropped).toEqual([]);
    expect(out.plan.routineId).toBe("r1");
    expect(out.plan.items.map((i) => [i.exerciseId, i.sets])).toEqual([
      ["bench-press", 4],
      ["barbell-row", 3],
      ["lateral-raise", 3],
    ]);
    expect(out.plan.items[0].target.weight).toBeGreaterThan(0);
    expect(out.plan.items[0].warmup?.length).toBeGreaterThan(0);
    expect(out.plan.items[1].group).toBeDefined();
    expect(out.plan.items[2].group).toBe(out.plan.items[1].group);
    expect(out.plan.estMinutes).toBeGreaterThan(10);
  });

  it("uses a physio's reps and cue on a rehab program", () => {
    const gym = makeGym("commercial", "kg", "g");
    const profile = { ...defaultProfile(NOW), activeGymId: "g", onboarded: true };
    const base = generate({ gym, profile, events: [], minutes: 45, now: NOW });
    const r = {
      ...routine([{ exerciseId: "bench-press", sets: 3, reps: 4, cue: "Soft knees" }]),
      rehab: true,
      rehabPart: "knee" as const,
    };
    const out = planFromRoutine(base, r, [], profile, gym, NOW)!;
    expect(out.plan.items[0]!.target.reps).toBe(4);
    expect(out.plan.items[0]!.target.note).toBe("Soft knees");
    const plain = planFromRoutine(base, { ...r, rehab: undefined }, [], profile, gym, NOW)!;
    expect(plain.plan.items[0]!.target.reps).not.toBe(4);
    expect(plain.plan.items[0]!.target.note).not.toBe("Soft knees");
  });

  it("keeps a coach's rep range on a plain routine, and uses it for the target", () => {
    expect(cleanRange(8, 10)).toEqual([8, 10]);
    expect(cleanRange(10, 8)).toBeUndefined();
    expect(cleanRange(0, 5)).toBeUndefined();
    expect(cleanRange(5, 60)).toBeUndefined();
    const kept = cleanRoutine(routine([{ exerciseId: "bench-press", sets: 3, reps: 12, repsTo: 15, cue: "x" }]));
    expect(kept.items[0]).toEqual({ exerciseId: "bench-press", sets: 3, reps: 12, repsTo: 15 });
    // A single number without a range stays a physio's thing: dropped off a plain routine.
    expect(cleanRoutine(routine([{ exerciseId: "bench-press", sets: 3, reps: 12 }])).items[0]).not.toHaveProperty("reps");
    const gym = makeGym("commercial", "kg", "g");
    const profile = { ...defaultProfile(NOW), activeGymId: "g", onboarded: true };
    const base = generate({ gym, profile, events: [], minutes: 45, now: NOW });
    const out = planFromRoutine(base, kept, [], profile, gym, NOW)!;
    expect(out.plan.items[0]!.target.reps).toBeGreaterThanOrEqual(12);
    expect(out.plan.items[0]!.target.reps).toBeLessThanOrEqual(15);
  });

  it("halves the sets and goes lighter on a deload phase, and trims them at a peak", () => {
    expect([phaseSets(4, "deload"), phaseSets(3, "deload"), phaseSets(1, "deload")]).toEqual([2, 2, 1]);
    expect([phaseSets(3, "peak"), phaseSets(4, "peak"), phaseSets(1, "peak")]).toEqual([2, 3, 1]);
    expect(phaseSets(4, "build")).toBe(4);
    const gym = makeGym("commercial", "kg", "g");
    const profile = { ...defaultProfile(NOW), activeGymId: "g", onboarded: true };
    const base = generate({ gym, profile, events: [], minutes: 45, now: NOW });
    const r = routine([{ exerciseId: "bench-press", sets: 4 }]);
    const build = planFromRoutine(base, r, [], profile, gym, NOW)!.plan.items[0]!;
    const deload = planFromRoutine(base, r, [], profile, gym, NOW, "deload")!.plan.items[0]!;
    const peak = planFromRoutine(base, r, [], profile, gym, NOW, "peak")!.plan.items[0]!;
    expect(deload.sets).toBe(2);
    expect(deload.target.weight).toBeLessThan(build.target.weight);
    expect(deload.target.note).toBe("Deload week: 10% lighter so you recover");
    expect(peak.sets).toBe(3);
    expect(peak.target.note).toBe("Peak week: fewer sets so you're fresh");
  });

  it("leaves out what the gym can't do, and a superset that loses a partner", () => {
    const gym = makeGym("bodyweight", "kg", "g");
    const profile = { ...defaultProfile(NOW), activeGymId: "g", onboarded: true };
    const base = generate({ gym, profile, events: [], minutes: 45, now: NOW });
    const r = routine([
      { exerciseId: "push-up", sets: 3, group: "ss" },
      { exerciseId: "bench-press", sets: 3, group: "ss" },
      { exerciseId: "superman", sets: 2 },
    ]);
    const out = planFromRoutine(base, r, [], profile, gym, NOW)!;
    expect(out.dropped).toEqual(["bench-press"]);
    expect(out.plan.items.map((i) => i.exerciseId)).toEqual(["push-up", "superman"]);
    expect(out.plan.items.every((i) => !i.group)).toBe(true);
    expect(planFromRoutine(base, routine([{ exerciseId: "bench-press", sets: 3 }]), [], profile, gym, NOW)).toBeNull();
  });

  it("reads what was done in a session, in order, with supersets", () => {
    const set = (exerciseId: string, at: number, superset?: string): AppEvent => ({
      type: "set",
      id: `${exerciseId}${at}`,
      at,
      sessionId: "s",
      exerciseId,
      weight: 50,
      reps: 8,
      targetReps: 8,
      rir: 2,
      superset,
    });
    const events = [
      set("barbell-row", 1, "g"),
      set("lateral-raise", 2, "g"),
      set("barbell-row", 3, "g"),
      set("lateral-raise", 4, "g"),
      set("deadlift", 5),
      { ...set("deadlift", 6), sessionId: "other" },
    ];
    expect(doneItems(events, "s")).toEqual([
      { exerciseId: "barbell-row", sets: 2, group: "g" },
      { exerciseId: "lateral-raise", sets: 2, group: "g" },
      { exerciseId: "deadlift", sets: 1 },
    ]);
    const r = routineFrom(doneItems(events, "s"), "Pull", "id", NOW);
    expect(r.items[0].group).toBe(r.items[1].group);
    expect(r.items[2].group).toBeUndefined();
  });

  it("moves items and breaks only the links around the move", () => {
    const items = cleanRoutine(
      routine([
        { exerciseId: "bench-press", sets: 3, group: "a" },
        { exerciseId: "barbell-row", sets: 3, group: "a" },
        { exerciseId: "lateral-raise", sets: 3 },
        { exerciseId: "db-curl", sets: 3, group: "b" },
        { exerciseId: "cable-pushdown", sets: 3, group: "b" },
      ]),
    ).items;
    const moved = moveItem(items, 2, -1);
    expect(moved.map((i) => i.exerciseId)).toEqual(["bench-press", "lateral-raise", "barbell-row", "db-curl", "cable-pushdown"]);
    expect(moved.map((i) => !!i.group)).toEqual([false, false, false, true, true]);
    expect(moveItem(items, 0, -1)).toEqual(items);
  });

  it("keeps newest first, replaces by id and caps the list", () => {
    let list: Routine[] = [];
    for (let i = 0; i < 55; i++) list = upsertRoutine(list, routine([{ exerciseId: "push-up", sets: 3 }], `r${i}`), NOW + i);
    expect(list).toHaveLength(50);
    expect(list[0].id).toBe("r54");
    list = upsertRoutine(list, { ...list[10], name: "Renamed" }, NOW + 100);
    expect(list[0].name).toBe("Renamed");
    expect(list).toHaveLength(50);
  });
});

describe("routine parts (workouts with parts, stage 3)", () => {
  it("keeps one warm-up then one cool-down, with known stretches of their own kind", () => {
    expect(
      cleanParts([
        { kind: "cool", stretches: ["doorway-chest", "march"] },
        { kind: "warm", stretches: ["jacks", "jacks"] },
        { kind: "warm" },
      ]),
    ).toEqual([
      { kind: "warm", stretches: ["jacks"] },
      { kind: "cool", stretches: ["doorway-chest"] },
    ]);
    expect(cleanParts([])).toBeUndefined();
  });

  it("starts a routine's parts as it says, and otherwise follows the warm-up setting", () => {
    expect(partDefaults({ parts: [{ kind: "cool" }] }, true)).toEqual({ warm: false, cool: true });
    expect(partDefaults(undefined, true)).toEqual({ warm: true, cool: false });
    expect(partDefaults({}, undefined)).toEqual({ warm: false, cool: false });
  });
});
