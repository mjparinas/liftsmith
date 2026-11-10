import { describe, expect, it } from "vitest";

import { defaultProfile, makeGym } from "./defaults";
import { generate } from "./generator";
import { cleanRoutine, doneItems, moveItem, planFromRoutine, routineFrom, upsertRoutine } from "./routines";
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
