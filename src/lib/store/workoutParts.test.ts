// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { defaultProfile } from "@/lib/defaults";
import { partNow, useApp } from "@/lib/store";

// Workouts with parts (docs/decisions/sessions-with-parts.md, stage 2): Start runs the warm-up, the lifting and the
// cool-down in order, Skip moves on, and the sessionEnd records the parts actually done.

describe("a workout with parts", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(Date.now()), onboarded: true, bodyweight: 80, activeGymId: id });
    useApp.getState().replan();
    useApp.setState({ ready: true });
  });

  it("runs the warm-up first, ignores Log set while stretching, then lifts and cools down", () => {
    const s = useApp.getState();
    s.pickPart("warm", true);
    s.pickPart("cool", true);
    s.start();
    const a = useApp.getState().active!;
    expect(a.parts?.map((p) => p.kind)).toEqual(["warm", "lift", "cool"]);
    expect(partNow(a)).toBe("warm");
    const start = useApp.getState().events.find((e) => e.type === "sessionStart");
    expect(start?.type === "sessionStart" && start.plan?.map((p) => p.kind)).toEqual(["warm", "lift", "cool"]);

    // A tap on the lock screen's Log set during the warm-up logs nothing.
    useApp.getState().logSet();
    expect(useApp.getState().events.filter((e) => e.type === "set" || e.type === "warmup")).toHaveLength(0);

    expect(useApp.getState().nextPart()).toBe("lift");
    useApp.getState().logSet();
    expect(useApp.getState().events.filter((e) => e.type === "set" || e.type === "warmup")).toHaveLength(1);
    expect(useApp.getState().nextPart()).toBe("cool");
    useApp.getState().finish();

    const end = useApp.getState().events.find((e) => e.type === "sessionEnd");
    expect(end?.type === "sessionEnd" && end.parts?.map((p) => p.kind)).toEqual(["warm", "lift", "cool"]);
    // The picks are for one workout only.
    expect(useApp.getState().partPicks).toEqual({});
  });

  it("leaves a skipped warm-up out of the parts done", () => {
    useApp.getState().pickPart("warm", true);
    useApp.getState().pickPart("cool", false);
    useApp.getState().start();
    useApp.getState().nextPart(true);
    useApp.getState().logSet();
    useApp.getState().finish();
    const end = useApp.getState().events.find((e) => e.type === "sessionEnd");
    // The warm-up was skipped before it began, so only the lifting was done.
    expect(end?.type === "sessionEnd" && end.parts?.map((p) => p.kind)).toEqual(["lift"]);
  });

  it("starts a plain workout at the lifting when no warm-up or cool-down is picked", () => {
    useApp.getState().start();
    const a = useApp.getState().active!;
    expect(a.parts).toBeUndefined();
    expect(partNow(a)).toBe("lift");
  });
});
