import { describe, expect, it } from "vitest";

import { printSheetHtml } from "@/lib/printSheet";
import type { Routine } from "@/lib/types";
import { makeProfile, makeTestGym, NOW } from "@/test/factories";

import { routinePrintSheet } from "./routinePrint";

const routine: Routine = {
  id: "r1",
  name: "Leg day",
  items: [
    { exerciseId: "back-squat", sets: 4 },
    { exerciseId: "push-up", sets: 3, group: "a" },
    { exerciseId: "plank", sets: 3, group: "a" },
    { exerciseId: "not-an-exercise", sets: 2 },
  ],
  createdAt: NOW,
  updatedAt: NOW,
};

const make = (over: Partial<Parameters<typeof routinePrintSheet>[0]> = {}) =>
  routinePrintSheet({
    routine,
    events: [],
    profile: makeProfile(),
    gym: makeTestGym("commercial", "kg"),
    now: NOW,
    link: "https://www.getliftsmith.com/app/?invite=abc#/routine/r1~x",
    shown: "getliftsmith.com/invite/abc",
    lang: "en",
    ...over,
  });

describe("Print routine", () => {
  it("lists each exercise it knows with its sets, reps, rest and the weight planned next", () => {
    const s = make();
    expect(s.title).toBe("Leg day");
    const rows = s.days[0]!.rows;
    expect(rows.map((r) => r.name)).toHaveLength(3);
    expect(rows[0]!.scheme).toMatch(/^4 × \d+$/);
    expect(rows[0]!.next).toMatch(/kg$/);
    expect(rows[0]!.rest).toMatch(/^\d+:\d\d$/);
    // A hold is in seconds, and bodyweight has no weight to write.
    expect(rows[2]!.scheme).toMatch(/^3 × \d+ s$/);
    expect(rows[1]!.next).toBeUndefined();
  });

  it("marks a superset on the first of the pair", () => {
    const rows = make().days[0]!.rows;
    expect(rows[1]!.superset).toBe(true);
    expect(rows[2]!.superset).toBeUndefined();
  });

  it("uses a coach's rep range as written", () => {
    const ranged = { ...routine, items: [{ exerciseId: "back-squat", sets: 3, reps: 8, repsTo: 10 }] };
    expect(make({ routine: ranged }).days[0]!.rows[0]!.scheme).toBe("3 × 8–10");
  });

  it("counts working sets and puts the share link in the QR code", () => {
    const s = make();
    expect(s.facts.map((f) => f.value)).toContain("10");
    expect(s.qr.url).toContain("#/routine/");
    expect(printSheetHtml(s)).toContain("getliftsmith.com/invite/abc");
  });

  it("prints without a gym, leaving out the planned weights", () => {
    const s = make({ gym: undefined });
    expect(s.days[0]!.rows.every((r) => !r.next)).toBe(true);
  });
});
