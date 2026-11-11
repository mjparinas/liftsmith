// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeProfile, NOW } from "@/test/factories";

import { HR_REST_FLOOR, HR_REST_LEAD_S, hrRestCut } from "./restReady";
import { useApp } from "./store";

// Heart-rate rest timer (Labs, `labHrRest`; Melvin, 2026-11-11): rest ends early once the heart rate
// is back near where the set started, never below the floor, and at most once per rest.

const T0 = 1_000_000;
const setStart = T0;
const restStart = T0 + 30_000;
// 100 bpm when the set started, 150 at its end, then `end` 60 s into the rest; a 180 s rest planned.
const active = (end: number, restTotal = 180) => ({
  startedAt: T0,
  hr: [100, 150, 130, end],
  hrAt: [0, 30_000, 60_000, 90_000],
  restStart,
  restTotal,
  restUntil: restStart + restTotal * 1000,
});

describe("heart-rate rest cut", () => {
  it("leaves the rest alone while the heart rate is still up", () => {
    expect(hrRestCut(active(125), setStart, T0 + 90_000)).toBeNull();
  });

  it("cuts to the floor when the heart rate is back early", () => {
    // Back to 104 after 60 s of a 180 s rest: the floor (60%, 108 s) wins over 5 s from now.
    const cut = hrRestCut(active(104), setStart, T0 + 90_000)!;
    expect(cut.until).toBe(restStart + 180 * HR_REST_FLOOR * 1000);
    expect(cut.saved).toBe(72);
    expect(cut).toMatchObject({ bpm: 104, start: 100 });
  });

  it("leaves a few seconds on the clock once past the floor", () => {
    const a = { ...active(104, 90), hr: [100, 150, 130, 104], hrAt: [0, 30_000, 60_000, 85_000] };
    const now = restStart + 60_000;
    expect(hrRestCut(a, setStart, now)!.until).toBe(now + HR_REST_LEAD_S * 1000);
  });

  it("doesn't bother for a few seconds saved, or once the rest is over", () => {
    const a = active(104, 70);
    expect(hrRestCut(a, setStart, restStart + 60_000)).toBeNull();
    expect(hrRestCut({ ...active(104), restUntil: null }, setStart, T0 + 90_000)).toBeNull();
  });
});

describe("cutting the rest in the store", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...makeProfile(), activeGymId: id });
  });
  afterEach(() => vi.useRealTimers());

  it("moves the end and the total together, so the rest bar's start stays put, and records why", () => {
    const s = useApp.getState;
    s().start();
    s().skipWarmup();
    s().logSet();
    const a = s().active!;
    const from = a.restUntil! - a.restTotal * 1000;
    vi.setSystemTime(NOW + 20_000);
    s().cutRest(a.restUntil! - 30_000, { bpm: 104, start: 100 });
    const b = s().active!;
    expect(b.restUntil).toBe(a.restUntil! - 30_000);
    expect(b.restUntil! - b.restTotal * 1000).toBe(from);
    expect(b.hrCut).toEqual({ restStart: a.restStart, bpm: 104, start: 100, saved: 30 });
  });

  it("never lengthens a rest", () => {
    const s = useApp.getState;
    s().start();
    s().skipWarmup();
    s().logSet();
    const a = s().active!;
    s().cutRest(a.restUntil! + 10_000, { bpm: 104, start: 100 });
    expect(s().active!.restUntil).toBe(a.restUntil);
    expect(s().active!.hrCut).toBeUndefined();
  });
});
