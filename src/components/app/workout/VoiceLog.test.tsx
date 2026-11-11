// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultProfile } from "@/lib/defaults";
import { useApp } from "@/lib/store";

import { applyVoice } from "./VoiceLog";

// Voice set logging (a lab): what a heard command does to the workout in progress, through the real store.

describe("applyVoice", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T18:00:00"));
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(Date.now()), onboarded: true, activeGymId: id });
    useApp.getState().start();
    useApp.getState().skipWarmup();
  });
  afterEach(() => vi.useRealTimers());

  const s = useApp.getState;
  const sets = () => s().events.filter((e) => e.type === "set");
  const log = () => s().logSet();

  it("logs the weight and reps said", () => {
    const out = applyVoice({ weight: 100, reps: 8 }, "100 for 8", "kg", log);
    expect(out.tone).toBe("ok");
    expect(sets()).toHaveLength(1);
    expect(sets()[0]).toMatchObject({ weight: 100, reps: 8 });
  });

  it("turns pounds into kilograms", () => {
    applyVoice({ weight: 225, reps: 5 }, "225 for 5", "lb", log);
    expect(sets()[0]!.type === "set" && Math.round(sets()[0]!.weight)).toBe(102);
  });

  it("keeps the planned weight when only reps are said", () => {
    const w = s().active!.weight;
    applyVoice({ reps: 6 }, "6 reps", "kg", log);
    expect(sets()[0]).toMatchObject({ weight: w, reps: 6 });
  });

  it("changes the next set without logging when only the weight is said", () => {
    applyVoice({ weight: 90 }, "90 kilos", "kg", log);
    expect(sets()).toHaveLength(0);
    expect(s().active!.weight).toBe(90);
  });

  it("rates the set just logged", () => {
    applyVoice({ weight: 100, reps: 8, rating: 1 }, "100 for 8 too easy", "kg", log);
    const effort = s().events.find((e) => e.type === "effort");
    expect(effort).toMatchObject({ setId: sets()[0]!.id, rir: 4 });
  });

  it("says so when there's nothing to rate yet", () => {
    expect(applyVoice({ rating: -1 }, "too hard", "kg", log).tone).toBe("warn");
  });

  it("logs during rest, the same as Log now", () => {
    applyVoice({ log: true }, "done", "kg", log);
    expect(s().active!.restUntil).not.toBeNull();
    applyVoice({ weight: 100, reps: 8 }, "100 for 8", "kg", log);
    expect(sets()).toHaveLength(2);
  });

  it("takes back the last set", () => {
    applyVoice({ weight: 100, reps: 8 }, "100 for 8", "kg", log);
    expect(applyVoice({ undo: true }, "undo", "kg", log).tone).toBe("ok");
    expect(sets()).toHaveLength(0);
    expect(applyVoice({ undo: true }, "undo", "kg", log).tone).toBe("warn");
  });
});
