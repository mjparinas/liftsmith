import { describe, expect, it } from "vitest";

import { UPPER_LOWER } from "./coachProgramTemplates";
import { autoArrange, draftFromWeek, emptyWeek, monthCells, weekFromDraft, weekFromProgram, workoutsIn } from "./programWeek";
import { encodeRoutine } from "./routineShare";
import type { Routine } from "./types";

const routine = (id: string, name: string, exercises: string[]): Routine => ({
  id,
  name,
  items: exercises.map((exerciseId) => ({ exerciseId, sets: 3 })),
  createdAt: 1,
  updatedAt: 1,
});

const upper = routine("u", "Upper", ["bench-press", "barbell-row"]);
const lower = routine("l", "Lower", ["back-squat", "romanian-deadlift"]);
const lower2 = routine("l2", "Lower 2", ["deadlift", "front-squat"]);
const upper2 = routine("u2", "Upper 2", ["overhead-press", "pull-up"]);

describe("draftFromWeek and weekFromDraft", () => {
  it("saves each routine once, in calendar order, with every weekday it runs on", () => {
    const week = emptyWeek();
    week[1] = "a";
    week[3] = "b";
    week[5] = "a";
    week[0] = "c";
    expect(draftFromWeek(week, 1)).toEqual({ routineIds: ["a", "b", "c"], weekdays: [[1, 5], [3], [0]] });
    expect(draftFromWeek(week, 0)).toEqual({ routineIds: ["c", "a", "b"], weekdays: [[0], [1, 5], [3]] });
  });

  it("round-trips, and lays out days without weekdays on the usual pattern", () => {
    const week = weekFromDraft(["a", "b", "c"], [[1, 5], [3], [0]]);
    expect(draftFromWeek(week, 1)).toEqual({ routineIds: ["a", "b", "c"], weekdays: [[1, 5], [3], [0]] });
    expect(weekFromDraft(["a", "b", "c"], undefined)).toEqual([null, "a", null, "b", null, "c", null]);
  });
});

describe("weekFromProgram", () => {
  it("finds the coach's routines by their share code, or gives up", () => {
    const days = [
      { code: encodeRoutine(upper), weekdays: [1] },
      { code: encodeRoutine(lower), weekdays: [2] },
    ];
    expect(weekFromProgram(days, [lower, upper])).toEqual([null, "u", "l", null, null, null, null]);
    expect(weekFromProgram(days, [upper])).toBeNull();
  });
});

describe("autoArrange", () => {
  it("never puts two leg days back to back when another routine can go between", () => {
    const { week } = autoArrange([lower, lower2, upper, upper2], 4);
    expect(workoutsIn(week)).toBe(4);
    // Mon, Tue, Thu, Fri: Monday and Tuesday must differ in muscles, and so must Thursday and Friday.
    const legs = new Set(["l", "l2"]);
    expect(legs.has(week[1]!) && legs.has(week[2]!)).toBe(false);
    expect(legs.has(week[4]!) && legs.has(week[5]!)).toBe(false);
  });

  it("gives every rest day between two workouts a reason", () => {
    const { week, why } = autoArrange([upper, lower], 3);
    expect(week).toEqual([null, "u", null, "l", null, "u", null]);
    expect(why[2]).toEqual({ kind: "after", before: "Upper" });
    expect(why[4]).toEqual({ kind: "after", before: "Lower" });
  });

  it("says when rest keeps the same muscles apart", () => {
    const { why } = autoArrange([lower, lower2], 2);
    expect(why[2]).toEqual({ kind: "same", before: "Lower", after: "Lower 2" });
  });

  it("repeats routines when there are more days than routines, and handles none", () => {
    expect(workoutsIn(autoArrange([upper], 3).week)).toBe(3);
    expect(workoutsIn(autoArrange([], 3).week)).toBe(0);
  });

  it("lays out the Upper / Lower template as upper and lower alternating", () => {
    const rs = UPPER_LOWER.days.map((d, i) =>
      routine(
        `t${i}`,
        d.name,
        d.items.map((x) => x.exerciseId),
      ),
    );
    const { week } = autoArrange(rs, 4);
    expect([week[1], week[2], week[4], week[5]].map((id) => rs.find((r) => r.id === id)!.name)).toEqual([
      "Upper A",
      "Lower A",
      "Upper B",
      "Lower B",
    ]);
  });
});

describe("monthCells", () => {
  it("starts on the first day of the program's week and stops after its last week", () => {
    const week = emptyWeek();
    week[1] = "u";
    // Wednesday 2026-12-02, Monday-first weeks: the grid starts Monday 2026-11-30.
    const cells = monthCells(week, new Date(2026, 11, 2, 15).getTime(), 2, 1);
    expect(cells).toHaveLength(42);
    expect(new Date(cells[0]!.at).getDate()).toBe(30);
    expect(cells[0]!.routineId).toBe("u");
    expect(cells[7]!.routineId).toBe("u");
    expect(cells[14]!.inside).toBe(false);
    expect(cells[14]!.routineId).toBeNull();
  });
});
