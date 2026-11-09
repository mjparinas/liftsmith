// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultProfile, makeGym } from "./defaults";
import { generate } from "./generator";
import { readiness, RECOVER_AT, PUSH_AT } from "./readiness";
import { AUTO_END_MS, hrWindow, useApp } from "./store";
import type { AppEvent, SetEvent } from "./types";

// "Win on data" (Melvin, 2026-11-09): every set and the whole heart rate stream are captured,
// a forgotten workout ends itself, and the data decides whether today is a push or an easy day.

const NOW = new Date("2026-11-11T18:00:00").getTime();
const H = 3600_000;
const D = 24 * H;
const profile = { ...defaultProfile(NOW - 3 * D), onboarded: true, bodyweight: 80 };
const gym = makeGym("commercial", "kg", "g1");

let n = 0;
const set = (at: number, sessionId: string, over: Partial<SetEvent> = {}): SetEvent => ({
  type: "set", id: `s${n++}`, at, sessionId, exerciseId: "back-squat", weight: 100, reps: 5, targetReps: 5, rir: 2, ...over,
});
const session = (at: number, id: string, over: Partial<SetEvent> = {}, count = 4): AppEvent[] => [
  { type: "sessionStart", id: `st-${id}`, at: at - 600_000, sessionId: id, gymId: "g1", minutes: 45 },
  ...Array.from({ length: count }, (_, i) => set(at + i * 1000, id, over)),
];

describe("readiness: rest or push", () => {
  it("is a normal day with no history", () => {
    expect(readiness([], profile, NOW)).toMatchObject({ call: "normal", score: 50, challenge: false });
  });

  it("calls an easy day after missed reps, hard feedback and three days in a row", () => {
    const ev: AppEvent[] = [
      ...session(NOW - 2 * D, "a", { reps: 3 }),
      ...session(NOW - D, "b", { reps: 2 }),
      ...session(NOW - 2 * H, "c", { reps: 3 }),
      { type: "feedback", id: "f1", at: NOW - H, sessionId: "c", exerciseId: "back-squat", rating: -1 },
      { type: "feedback", id: "f2", at: NOW - H, sessionId: "c", exerciseId: "bench-press", rating: -1 },
    ];
    const r = readiness(ev, profile, NOW);
    expect(r.score).toBeLessThanOrEqual(RECOVER_AT);
    expect(r.call).toBe("recover");
    expect(r.challenge).toBe(false);
    expect(r.signals.map((s) => s.text)).toEqual(expect.arrayContaining(["Missed reps lately", "Last workout felt hard", "Three workouts in three days"]));
  });

  it("calls a push day when rested, recovered and hitting every target", () => {
    const ev: AppEvent[] = [...session(NOW - 6 * D, "a"), ...session(NOW - 3 * D, "b")];
    const r = readiness(ev, profile, NOW);
    expect(r.score).toBeGreaterThanOrEqual(PUSH_AT);
    expect(r.call).toBe("push");
  });

  it("reads slower reps than usual as fatigue", () => {
    const ev: AppEvent[] = [
      ...session(NOW - 12 * D, "a", { durationSec: 15 }),
      ...session(NOW - 9 * D, "b", { durationSec: 15 }),
      ...session(NOW - 6 * D, "c", { durationSec: 15 }),
      ...session(NOW - 3 * D, "d", { durationSec: 25 }),
    ];
    expect(readiness(ev, profile, NOW).signals.map((s) => s.text)).toContain("Reps were slower than usual");
  });

  it("uses sleep, HRV and the check-in when they exist", () => {
    const ev = session(NOW - 3 * D, "a");
    const base = readiness(ev, profile, NOW);
    const low = readiness(ev, profile, NOW, { sleepHours: 5, hrvDelta: -0.2, checkIn: -1 });
    expect(low.score).toBe(base.score - 37);
    expect(low.call).not.toBe("push");
    expect(readiness(ev, profile, NOW, { sleepHours: 4, hrvDelta: -0.3, checkIn: -1, restingHrDelta: 9 }).call).toBe("recover");
    const high = readiness(ev, profile, NOW, { sleepHours: 8.5, hrvDelta: 0.1, checkIn: 1 });
    expect(high.score).toBeGreaterThan(low.score);
  });

  it("never pushes in a deload week", () => {
    const deload = { ...profile, blockStart: NOW - 4 * 7 * D - D, blockWeeks: 4 };
    const ev: AppEvent[] = [...session(NOW - 6 * D, "a"), ...session(NOW - 3 * D, "b")];
    const r = readiness(ev, deload, NOW);
    expect(r.call).not.toBe("push");
    expect(r.challenge).toBe(false);
  });
});

describe("the generator follows the call", () => {
  const base = { gym, profile, events: [] as AppEvent[], minutes: 45, now: NOW };

  it("drops a set and lightens loads on an easy day", () => {
    const normal = generate(base);
    const easy = generate({ ...base, call: "recover" });
    expect(easy.call).toBe("recover");
    const n0 = normal.items.reduce((s, i) => s + i.sets, 0);
    const e0 = easy.items.reduce((s, i) => s + i.sets, 0);
    expect(e0).toBeLessThan(n0);
    for (const i of easy.items) expect(i.sets).toBeGreaterThanOrEqual(2);
    expect(easy.items.every((i) => i.target.note.startsWith("Easy day"))).toBe(true);
  });

  it("takes the first compound one rep closer to failure on a push day, and marks a challenge", () => {
    const push = generate({ ...base, call: "push", challenge: true });
    const first = push.items.find((i) => i.challenge);
    expect(push.challenge).toBe(true);
    expect(first).toBeDefined();
    const normal = generate(base).items.find((i) => i.exerciseId === first!.exerciseId)!;
    expect(first!.target.rir).toBe(Math.max(0, normal.target.rir - 1));
    expect(push.items.filter((i) => i.challenge)).toHaveLength(1);
  });

  it("ignores a challenge on a normal day", () => {
    expect(generate({ ...base, challenge: true }).challenge).toBe(false);
  });
});

describe("data capture in a workout", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...profile, activeGymId: id });
    useApp.getState().replan();
  });
  afterEach(() => vi.useRealTimers());

  it("records duration, rest, heart rate and the plan for every set, and the stream at the end", () => {
    const s = useApp.getState;
    s().start();
    s().skipWarmup();
    const rest = s().active!.plan.items[0].restSec;
    // Warm-up, then the first set takes 40 s.
    vi.setSystemTime(NOW + 60_000);
    s().skipRest();
    for (let t = 0; t <= 40; t += 1) {
      vi.setSystemTime(NOW + 60_000 + t * 1000);
      s().pushHr(120 + t);
    }
    s().logSet();
    const first = s().events.find((e): e is SetEvent => e.type === "set")!;
    expect(first.durationSec).toBe(40);
    expect(first.targetWeight).toBe(s().active!.plan.items[0].target.weight);
    expect(first.hrMax).toBe(160);
    expect(first.hrEnd).toBe(160);
    expect(first.hrAvg).toBe(140);

    // Rest runs out, plus 20 s more, then a 30 s set.
    vi.setSystemTime(NOW + 100_000 + rest * 1000 + 20_000);
    s().skipRest();
    vi.setSystemTime(NOW + 100_000 + rest * 1000 + 50_000);
    s().logSet();
    const second = s().events.filter((e): e is SetEvent => e.type === "set")[1];
    expect(second.restSec).toBe(rest + 20);
    expect(second.durationSec).toBe(30);

    const end = s().finish();
    expect(end).toMatchObject({ type: "sessionEnd", workSec: 70, restSec: rest + 20, maxHr: 160, minHr: 120 });
    const series = s().events.find((e) => e.type === "hrSeries");
    expect(series).toMatchObject({ type: "hrSeries", bpm: expect.any(Array), t: expect.any(Array) });
    if (series?.type === "hrSeries") {
      expect(series.bpm).toHaveLength(41);
      expect(series.t[0]).toBe(60);
    }
  });

  it("leaves out set duration when the set was logged before the rest ended", () => {
    const s = useApp.getState;
    s().start();
    s().skipWarmup();
    vi.setSystemTime(NOW + 30_000);
    s().logSet();
    vi.setSystemTime(NOW + 50_000); // rest still running
    s().logSet();
    const sets = s().events.filter((e): e is SetEvent => e.type === "set");
    expect(sets[1].durationSec).toBeUndefined();
    expect(sets[1].restSec).toBe(20);
  });

  it("keeps one heart rate sample a second", () => {
    const s = useApp.getState;
    s().start();
    s().pushHr(100);
    s().pushHr(101);
    vi.setSystemTime(NOW + 1500);
    s().pushHr(102);
    expect(s().active!.hr).toEqual([101, 102]);
  });

  it("ends a forgotten workout where the lifter stopped", () => {
    const s = useApp.getState;
    s().start();
    vi.setSystemTime(NOW + 20 * 60_000);
    s().logSet();
    vi.setSystemTime(NOW + 20 * 60_000 + AUTO_END_MS - 1000);
    expect(s().autoEnd()).toBe(false);
    vi.setSystemTime(NOW + 20 * 60_000 + AUTO_END_MS + 1000);
    expect(s().autoEnd()).toBe(true);
    expect(s().active).toBeNull();
    const end = s().events.find((e) => e.type === "sessionEnd");
    expect(end).toMatchObject({ auto: true, seconds: 21 * 60 });
  });

  it("records the call and an override on the session", () => {
    const s = useApp.getState;
    const suggested = s().readiness!.call;
    const mine = suggested === "recover" ? "push" : "recover";
    s().setCall(mine);
    expect(s().preview!.call).toBe(mine);
    s().start();
    const st = s().events.find((e) => e.type === "sessionStart");
    expect(st).toMatchObject({ call: mine, callOverridden: true });
    expect(s().callOverride).toBeNull();
  });
});

describe("hrWindow", () => {
  it("summarises only the samples inside the set", () => {
    const a = { startedAt: 0, hr: [90, 120, 150, 100], hrAt: [0, 10_000, 20_000, 40_000] };
    expect(hrWindow(a, 5_000, 25_000)).toEqual({ hrAvg: 135, hrMax: 150, hrEnd: 150 });
    expect(hrWindow(a, 50_000, 60_000)).toEqual({});
  });
});
