// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { defaultProfile } from "@/lib/defaults";
import { partNow, useApp } from "@/lib/store";

// Workouts with parts, stage 5 (docs/decisions/sessions-with-parts.md): the physio's rehab beside the lifting and
// cardio after it, in the same workout. Their exercises go at the end of the plan, the part follows the exercise on
// screen, and the sets say which part they were done in.

const sets = () => useApp.getState().events.filter((e) => e.type === "set");
const ended = () => useApp.getState().events.find((e) => e.type === "sessionEnd");

describe("rehab and cardio beside the lifting", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(Date.now()), onboarded: true, bodyweight: 80, activeGymId: id });
    const now = Date.now();
    useApp.getState().saveRoutine({
      id: "knee",
      name: "Knee rehab",
      items: [
        { exerciseId: "glute-bridge", sets: 1 },
        { exerciseId: "wall-sit", sets: 1 },
      ],
      rehab: true,
      createdAt: now,
      updatedAt: now,
    });
    useApp.getState().replan();
    useApp.setState({ ready: true });
  });

  it("runs the lifting, then the rehab, then the cardio, and records each part", () => {
    const s = useApp.getState();
    s.pickPart("rehab", true);
    s.pickCardio({ exerciseId: "stationary-bike", minutes: 20 });
    s.start();
    const a = useApp.getState().active!;
    expect(a.parts?.map((p) => [p.kind, p.ref])).toEqual([
      ["lift", undefined],
      ["rehab", "knee"],
      ["cardio", "stationary-bike"],
    ]);
    const tail = a.plan.items.slice(-3).map((i) => [i.exerciseId, i.part]);
    expect(tail).toEqual([
      ["glute-bridge", "rehab"],
      ["wall-sit", "rehab"],
      ["stationary-bike", "cardio"],
    ]);
    expect(a.plan.items.at(-1)!.target.reps).toBe(1200);
    const start = useApp.getState().events.find((e) => e.type === "sessionStart");
    expect(start?.type === "sessionStart" && start.plan).toEqual([
      { kind: "lift" },
      { kind: "rehab", ref: "knee" },
      { kind: "cardio", ref: "stationary-bike" },
    ]);

    // Straight to the first rehab exercise: the part moves with it, and its set is marked.
    const first = a.plan.items.findIndex((i) => i.part === "rehab");
    useApp.getState().goTo(first);
    expect(partNow(useApp.getState().active)).toBe("rehab");
    useApp.getState().logSet();
    expect(sets().at(-1)).toMatchObject({ exerciseId: "glute-bridge", partId: "rehab" });

    useApp.getState().goTo(a.plan.items.length - 1);
    expect(partNow(useApp.getState().active)).toBe("cardio");
    useApp.getState().logSet();
    expect(sets().at(-1)).toMatchObject({ exerciseId: "stationary-bike", partId: "cardio" });

    useApp.getState().finish();
    const end = ended();
    expect(end?.type === "sessionEnd" && end.parts?.map((p) => [p.kind, p.ref])).toEqual([
      ["lift", undefined],
      ["rehab", "knee"],
      ["cardio", "stationary-bike"],
    ]);
  });

  it("goes straight to the cool-down from Finish, leaving out the parts not reached", () => {
    const s = useApp.getState();
    s.pickPart("cardio", true);
    s.pickPart("cool", true);
    s.start();
    expect(useApp.getState().active?.parts?.map((p) => p.kind)).toEqual(["lift", "cardio", "cool"]);
    useApp.getState().logSet();
    expect(useApp.getState().toCoolDown()).toBe(true);
    expect(partNow(useApp.getState().active)).toBe("cool");
    useApp.getState().finish();
    const end = ended();
    expect(end?.type === "sessionEnd" && end.parts?.map((p) => p.kind)).toEqual(["lift", "cool"]);
  });

  it("has no cool-down to go to without one", () => {
    useApp.getState().pickPart("cardio", true);
    useApp.getState().start();
    expect(useApp.getState().toCoolDown()).toBe(false);
  });

  it("adds no rehab beside a workout that is the rehab routine", () => {
    useApp.getState().pickRoutine("knee");
    useApp.getState().pickPart("rehab", true);
    useApp.getState().start();
    const a = useApp.getState().active!;
    expect(a.plan.rehab).toBe(true);
    expect(a.plan.items.some((i) => i.part === "rehab")).toBe(false);
  });

  it("leaves rehab off when there's no injury and cardio off unless picked", () => {
    useApp.getState().start();
    const a = useApp.getState().active!;
    expect(a.parts).toBeUndefined();
    expect(a.plan.items.some((i) => i.part)).toBe(false);
  });
});
