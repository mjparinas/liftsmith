// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { defaultProfile } from "./defaults";
import { isShortcut, linkAction, runShortcut } from "./shortcuts";
import { useApp } from "./store";

// Voice and system shortcuts: Siri / App Intents, App Actions, the Quick Settings tile, launcher and
// web manifest shortcuts all run these three actions.

describe("shortcuts", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(Date.now()), onboarded: true, bodyweight: 80, activeGymId: id });
    useApp.getState().replan();
    useApp.setState({ ready: true });
  });

  it("starts today's workout, and reopens it instead of starting a second one", () => {
    expect(runShortcut("start")).toBe("workout");
    const id = useApp.getState().active!.sessionId;
    expect(runShortcut("start")).toBe("workout");
    expect(useApp.getState().active!.sessionId).toBe(id);
    expect(useApp.getState().events.filter((e) => e.type === "sessionStart")).toHaveLength(1);
  });

  it("logs a set and adds rest only during a workout", () => {
    expect(runShortcut("log")).toBe("today");
    expect(runShortcut("add30")).toBe("today");
    expect(useApp.getState().events.some((e) => e.type === "set")).toBe(false);

    runShortcut("start");
    expect(runShortcut("log")).toBe("workout");
    expect(useApp.getState().events.filter((e) => e.type === "set")).toHaveLength(1);
    const until = useApp.getState().active!.restUntil!;
    runShortcut("add30");
    expect(useApp.getState().active!.restUntil).toBe(until + 30_000);
  });

  it("does nothing before setup is done", () => {
    useApp.getState().setProfile({ ...useApp.getState().profile, onboarded: false });
    expect(runShortcut("start")).toBe("today");
    expect(useApp.getState().active).toBeNull();
  });

  it("reads web links and rejects anything else", () => {
    expect(linkAction("?do=start")).toBe("start");
    expect(linkAction("?do=log&x=1")).toBe("log");
    expect(linkAction("?do=delete")).toBeNull();
    expect(linkAction("")).toBeNull();
    expect(isShortcut("add30")).toBe(true);
    expect(isShortcut(3)).toBe(false);
  });
});
