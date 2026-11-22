import { describe, expect, it } from "vitest";

import { DAY, NOW } from "@/test/factories";

import { rehabSelfNote, rehabSelfOffer } from "./rehabSelf";
import { endedPrograms } from "./trainer";
import type { AppEvent, InjuryEvent, Routine } from "./types";

const hurt = (part: InjuryEvent["part"], at: number, id: string = part): InjuryEvent => ({
  type: "injury",
  id: `e-${id}`,
  at,
  injuryId: id,
  part,
});

const knee: Routine = {
  id: "k",
  name: "Knee",
  items: [{ exerciseId: "wall-sit", sets: 2 }],
  rehab: true,
  rehabPart: "knee",
  createdAt: NOW,
  updatedAt: NOW,
};

describe("rehab without a physio", () => {
  it("offers an active injury that has no rehab routine for that area", () => {
    const events = [hurt("knee", NOW - 2 * DAY), hurt("shoulder", NOW - DAY)];
    expect(rehabSelfOffer(events, [], NOW).map((o) => o.part)).toEqual(["knee", "shoulder"]);
    expect(rehabSelfOffer(events, [knee], NOW).map((o) => o.part)).toEqual(["shoulder"]);
    expect(rehabSelfOffer([], [knee], NOW)).toEqual([]);
  });

  it("ignores a healed injury and a routine that isn't rehab", () => {
    const events: AppEvent[] = [hurt("knee", NOW - 3 * DAY), { type: "injuryHealed", id: "h", at: NOW - DAY, injuryId: "knee" }];
    expect(rehabSelfOffer(events, [], NOW)).toEqual([]);
    const plain = { ...knee, rehab: undefined, rehabPart: undefined };
    expect(rehabSelfOffer([hurt("knee", NOW - DAY)], [plain], NOW)).toHaveLength(1);
  });

  it("keeps the oldest injury in an area, and the note waits 7 days", () => {
    const events = [hurt("knee", NOW - 10 * DAY, "old"), hurt("knee", NOW - 2 * DAY, "new"), hurt("hip", NOW - 3 * DAY)];
    expect(rehabSelfOffer(events, [], NOW).find((o) => o.part === "knee")?.id).toBe("old");
    expect(rehabSelfNote(events, [], NOW)?.id).toBe("old");
    expect(rehabSelfNote(events, [], NOW)?.days).toBe(10);
    expect(rehabSelfNote([hurt("knee", NOW - 6 * DAY)], [], NOW)).toBeUndefined();
    expect(rehabSelfNote([hurt("knee", NOW - 7 * DAY)], [], NOW)?.days).toBe(7);
    expect(rehabSelfNote(events, [knee], NOW)).toBeUndefined();
    expect(rehabSelfNote([...events, hurt("hip", NOW - 8 * DAY, "hip-old")], [knee], NOW)?.part).toBe("hip");
  });
});

describe("a program the coach took back", () => {
  const routine = { id: "r", assignedPlan: { id: "p1", coachId: "c" } };
  it("shows only after plans have loaded, and not once it's answered or still assigned", () => {
    expect(endedPrograms([routine], [], false, [])).toEqual([]);
    expect(endedPrograms([routine], [], true, []).map((r) => r.id)).toEqual(["r"]);
    expect(endedPrograms([routine], [{ id: "p1" }], true, [])).toEqual([]);
    expect(endedPrograms([routine], [], true, ["p1"])).toEqual([]);
    const none: { assignedPlan?: { id: string } } = {};
    expect(endedPrograms([none], [], true, [])).toEqual([]);
  });
});
