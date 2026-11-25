import { describe, expect, it } from "vitest";

import { dayChoices, extraCopies, routinesFromTemplate, UPPER_LOWER } from "./coachProgramTemplates";
import type { Routine } from "./types";

const routine = (id: string, name: string, at: number, exerciseId = "bench-press"): Routine => ({
  id,
  name,
  items: [{ exerciseId, sets: 3 }],
  createdAt: at,
  updatedAt: at,
});

let n = 0;
const nextId = () => `new-${++n}`;

describe("routinesFromTemplate", () => {
  it("reuses day routines the coach already has instead of making more copies", () => {
    const first = routinesFromTemplate(UPPER_LOWER, 1, nextId);
    expect(first.routines).toHaveLength(4);
    const again = routinesFromTemplate(UPPER_LOWER, 2, nextId, first.routines);
    expect(again.routines).toHaveLength(0);
    expect(again.routineIds).toEqual(first.routineIds);
    expect(again.weekdays).toEqual(first.weekdays);
  });

  it("makes a new routine for a day the coach changed", () => {
    const first = routinesFromTemplate(UPPER_LOWER, 1, nextId);
    const edited = first.routines.map((r, i) => (i === 0 ? { ...r, items: r.items.slice(1) } : r));
    const again = routinesFromTemplate(UPPER_LOWER, 2, nextId, edited);
    expect(again.routines.map((r) => r.name)).toEqual(["Upper A"]);
    expect(again.routineIds.slice(1)).toEqual(first.routineIds.slice(1));
  });
});

describe("dayChoices", () => {
  const list = [
    routine("b2", "Upper B", 9),
    routine("a2", "Upper A", 8),
    routine("b1", "Upper B", 5),
    routine("a1", "Upper A", 4),
    routine("x", "Legs", 3, "back-squat"),
    routine("y", "Legs", 2, "deadlift"),
  ];

  it("puts picked days first in their order, then the rest A to Z, each identical copy once", () => {
    const c = dayChoices(list, ["a1", "b1"]);
    expect(c.map((x) => [x.routine.id, x.at])).toEqual([
      ["a1", 0],
      ["b1", 1],
      ["x", -1],
      ["y", -1],
    ]);
  });

  it("says how many exercises when two different routines share a name", () => {
    const c = dayChoices(list, []);
    expect(c.map((x) => x.routine.id)).toEqual(["x", "y", "a2", "b2"]);
    expect(c.find((x) => x.routine.id === "x")?.exercises).toBe(1);
    expect(c.find((x) => x.routine.id === "a2")?.exercises).toBeUndefined();
  });
});

describe("extraCopies", () => {
  const list = [routine("b2", "Upper B", 9), routine("a2", "Upper A", 8), routine("b1", "Upper B", 5), routine("a1", "Upper A", 4)];

  it("keeps the newest of each identical group", () => {
    expect(extraCopies(list, []).sort()).toEqual(["a1", "b1"]);
  });

  it("keeps a picked or protected copy instead", () => {
    expect(extraCopies(list, ["a1"]).sort()).toEqual(["a2", "b1"]);
  });

  it("never counts a coach-assigned day as a copy of a plain routine", () => {
    const tied = { ...routine("t", "Upper A", 10), assignedProgram: { assignId: "p", coachId: "c", dayIndex: 0 } };
    expect(extraCopies([tied, ...list], [])).not.toContain("t");
  });
});
