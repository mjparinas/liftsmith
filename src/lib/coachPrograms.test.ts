import { beforeEach, describe, expect, it, vi } from "vitest";

import { canBuyHere, draftDays, programRoutines, shownHere, type CoachProgram } from "./coachPrograms";
import { decodeRoutine } from "./routineShare";
import type { Routine } from "./types";

let native = false;
vi.mock("./juice", () => ({ isNative: () => native }));

beforeEach(() => {
  native = false;
});

const routine = (id: string, name: string, items: Routine["items"]): Routine => ({ id, name, items, createdAt: 1, updatedAt: 1 });
const PUSH = routine("a", "Push", [
  { exerciseId: "bench-press", sets: 4 },
  { exerciseId: "overhead-press", sets: 3 },
]);
const LEGS = routine("b", "Legs", [{ exerciseId: "back-squat", sets: 5 }]);
const EMPTY = routine("c", "Empty", []);

describe("where a program can be bought (store billing rules)", () => {
  it("the web app shows everything and sells paid programs", () => {
    expect(canBuyHere()).toBe(true);
    expect(shownHere({ price: 30, owned: false })).toBe(true);
  });

  it("the phone apps never show a paid program the lifter doesn't have", () => {
    native = true;
    expect(canBuyHere()).toBe(false);
    expect(shownHere({ price: 30, owned: false })).toBe(false);
    expect(shownHere({ price: 30, owned: true })).toBe(true);
    expect(shownHere({ price: 0, owned: false })).toBe(true);
  });
});

describe("days", () => {
  it("a draft's days are the picked routines' codes, in the order picked, empty ones left out", () => {
    const days = draftDays({ routineIds: ["b", "c", "a", "gone"] }, [PUSH, LEGS, EMPTY]);
    expect(days.map((d) => d.name)).toEqual(["Legs", "Push"]);
    expect(decodeRoutine(days[1]!.code)?.items).toEqual(PUSH.items);
  });

  it("a program's days become routines with new ids; locked days are skipped", () => {
    const days = draftDays({ routineIds: ["a", "b"] }, [PUSH, LEGS]);
    const p = { days: [...days.map((d) => ({ ...d, exercises: 1, sets: 1 })), { name: "Locked", exercises: 2, sets: 6 }] } as CoachProgram;
    let n = 0;
    const out = programRoutines(p, 5, () => `id${++n}`);
    expect(out.map((r) => [r.id, r.name, r.items.length])).toEqual([
      ["id1", "Push", 2],
      ["id2", "Legs", 1],
    ]);
  });
});
