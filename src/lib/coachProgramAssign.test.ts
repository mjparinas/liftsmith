import { describe, expect, it } from "vitest";

import { exerciseIdsFromCode, parseAssignDays } from "../server/coachProgramAssign";
import { coachProgramDayIndex, coachProgramEndAt, coachProgramWeek, followAssign, type ProgramAssign } from "./coachProgramAssign";
import { PROGRAM_TEMPLATES, templateOk } from "./coachProgramTemplates";

const assign = (over: Partial<ProgramAssign> = {}): ProgramAssign => ({
  id: "a1",
  coachId: "c1",
  clientId: "u1",
  programId: "p1",
  teamId: null,
  title: "Upper / Lower",
  weeks: 4,
  days: [
    { name: "Upper A", code: "r1~VXBwZXI~bench-press.4~barbell-row.3", weekdays: [1] },
    { name: "Lower A", code: "r1~TG93ZXI~back-squat.4~romanian-deadlift.3", weekdays: [2] },
  ],
  status: "pending",
  createdAt: 1,
  acceptedAt: null,
  startedAt: null,
  endedAt: null,
  ...over,
});

describe("coach program templates", () => {
  it("every template encodes and has non-overlapping weekdays", () => {
    for (const tpl of PROGRAM_TEMPLATES) expect(templateOk(tpl), tpl.id).toBe(true);
  });
});

describe("parseAssignDays", () => {
  it("reads weekdays and rejects overlaps", () => {
    const ok = parseAssignDays([
      { name: "A", code: "r1~QQ~bench-press.3", weekdays: [1, 4] },
      { name: "B", code: "r1~Qg~back-squat.3", weekdays: [2, 5] },
    ]);
    expect(ok?.map((d) => d.weekdays)).toEqual([
      [1, 4],
      [2, 5],
    ]);
    expect(
      parseAssignDays([
        { name: "A", code: "r1~QQ~bench-press.3", weekdays: [1] },
        { name: "B", code: "r1~Qg~back-squat.3", weekdays: [1] },
      ]),
    ).toBeNull();
  });

  it("accepts weekday overrides", () => {
    const days = parseAssignDays(
      [
        { name: "A", code: "r1~QQ~bench-press.3" },
        { name: "B", code: "r1~Qg~back-squat.3" },
      ],
      [[1], [2]],
    );
    expect(days?.[0]?.weekdays).toEqual([1]);
    expect(days?.[1]?.weekdays).toEqual([2]);
  });
});

describe("exerciseIdsFromCode", () => {
  it("reads exercise ids from a share code", () => {
    expect(exerciseIdsFromCode("r1~QQ~bench-press.4~barbell-row.3")).toEqual(["bench-press", "barbell-row"]);
  });
});

describe("followAssign and day index", () => {
  it("saves routines and picks today's weekday-bound day", () => {
    const { routines, planSource } = followAssign(assign(), 1_700_000_000_000);
    expect(routines).toHaveLength(2);
    expect(planSource.kind).toBe("coachProgram");
    expect(planSource.dayIds).toHaveLength(2);
    // Monday 2023-11-13 local — use a fixed Monday UTC noon that is Monday in most zones
    const monday = Date.UTC(2024, 0, 1, 18); // 2024-01-01 was Monday
    const src = { ...planSource, startedAt: monday - 86_400_000 };
    // If local getDay of that ms is 1, index 0; otherwise skip assert on exact day
    const i = coachProgramDayIndex(src, monday);
    if (new Date(monday).getDay() === 1) expect(i).toBe(0);
    if (new Date(monday).getDay() === 2) expect(i).toBe(1);
    expect(coachProgramWeek(src, monday + 8 * 86_400_000)).toBe(2);
    expect(coachProgramEndAt(src)).toBe(src.startedAt + 4 * 7 * 86_400_000);
  });
});
