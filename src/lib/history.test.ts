import { describe, expect, it } from "vitest";

import { makeWorkout } from "@/test/factories";

import { derive } from "./derive";
import { EXERCISE_BY_ID } from "./exercises";
import { monthOf, monthsBetween, monthSessions, musclesByDay, prSetIds, shiftMonth, workoutName } from "./history";
import { PROGRAM_BY_ID, programDayLabel, PROGRAMS } from "./programs";

const at = (y: number, m: number, d: number) => new Date(y, m, d, 18).getTime();

describe("history calendar", () => {
  it("steps months across the year in both directions", () => {
    expect(shiftMonth({ y: 2026, m: 0 }, -1)).toEqual({ y: 2025, m: 11 });
    expect(shiftMonth({ y: 2026, m: 11 }, 1)).toEqual({ y: 2027, m: 0 });
    expect(shiftMonth({ y: 2026, m: 5 }, -18)).toEqual({ y: 2024, m: 11 });
    expect(monthsBetween({ y: 2025, m: 11 }, { y: 2026, m: 1 })).toBe(2);
    expect(monthOf(at(2026, 10, 30))).toEqual({ y: 2026, m: 10 });
  });

  it("keeps each month's workouts and marks the muscles trained per day", () => {
    const events = [
      ...makeWorkout("a", at(2026, 9, 5), [{ exerciseId: "bench-press" }]),
      ...makeWorkout("b", at(2026, 10, 18), [{ exerciseId: "back-squat" }, { exerciseId: "barbell-row" }]),
    ];
    const stats = derive(events, at(2026, 10, 20));
    expect(monthSessions(stats.sessions, { y: 2026, m: 10 }).map((s) => s.sessionId)).toEqual(["b"]);
    const days = musclesByDay(events, stats.sessions, (id) => EXERCISE_BY_ID.get(id));
    expect([...days.get("2026-10-05")!]).toEqual(["chest"]);
    expect(days.get("2026-11-18")!.has("quads")).toBe(true);
    expect(days.get("2026-11-18")!.has("chest")).toBe(false);
  });

  it("leaves out sets from workouts that aren't in the history", () => {
    const events = makeWorkout("gone", at(2026, 10, 3), [{ exerciseId: "bench-press" }]);
    expect(musclesByDay(events, [], (id) => EXERCISE_BY_ID.get(id)).size).toBe(0);
  });

  it("finds the sets behind each personal record", () => {
    const events = [
      ...makeWorkout("a", at(2026, 10, 2), [{ weight: 60 }]),
      ...makeWorkout("b", at(2026, 10, 9), [{ weight: 50 }, { weight: 70 }]),
    ];
    const stats = derive(events, at(2026, 10, 20));
    const ids = prSetIds(events, stats.prs);
    const heavy = events.find((e) => e.type === "set" && e.weight === 70)!;
    const light = events.find((e) => e.type === "set" && e.weight === 50)!;
    expect(ids.has(heavy.id)).toBe(true);
    expect(ids.has(light.id)).toBe(false);
  });

  it("names a past workout by its routine, else its program day, else nothing", () => {
    const routines = [{ id: "r1", name: "Garage day", items: [], createdAt: 0, updatedAt: 0 }];
    expect(workoutName({ routine: "r1", program: { id: "ppl", day: 1 } }, routines)).toBe("Garage day");
    expect(workoutName({ program: { id: "classic-5x5", day: 0 } }, routines)).toBe(`${PROGRAM_BY_ID.get("classic-5x5")!.name} · Workout A`);
    expect(workoutName({ program: { id: "ppl", day: 1 } }, [])).toBe(`${PROGRAM_BY_ID.get("ppl")!.name} · Pull day`);
    // An adaptive workout, a removed routine and an unknown program have no name.
    expect(workoutName({}, routines)).toBeNull();
    expect(workoutName({ routine: "gone" }, routines)).toBeNull();
    expect(workoutName({ program: { id: "nope", day: 0 } }, routines)).toBeNull();
  });

  it("gives every day of every program a name", () => {
    for (const p of PROGRAMS) {
      for (let day = 0; day < 4; day++) expect(programDayLabel(p.id, day)?.day, `${p.id} day ${day}`).toMatch(/\S/);
    }
  });
});
