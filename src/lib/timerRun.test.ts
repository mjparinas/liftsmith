// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runWatchTap } from "@/components/app/workout/watchAdjust";
import { buildCarry } from "@/components/app/workout/watchCarry";
import { defaultProfile } from "@/lib/defaults";
import { LEAD_SEC } from "@/lib/setTimer";
import { runShortcut } from "@/lib/shortcuts";
import { useApp } from "@/lib/store";
import { holdForLog, resetTimerRun, startFromWatch, startLabel, timerOffer, timerSnapshot, watchTimerOffer } from "@/lib/timerRun";
import { parseWatchResult, watchEvents } from "@/lib/watchWorkout";

// Start timer from a watch (docs/decisions/set-timer.md "Started from the watch"): the watch counts the hold, the phone
// starts the same timer from the tap, and Log set from the wrist or the lock screen saves the seconds actually held.

const s = (n: number) => n * 1000;
const clock = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;

/** Today's plan with a 40-second plank first, two sets, no warm-up. */
function plankFirst(exerciseId = "plank") {
  const p = useApp.getState().preview!;
  const hold = { ...p.items[0]!, exerciseId, sets: 2, warmup: undefined, target: { ...p.items[0]!.target, weight: 0, reps: 40 } };
  useApp.getState().setPlan({ ...p, items: [hold, ...p.items.slice(1).filter((it) => it.exerciseId !== exerciseId)] });
}

const offer = () => {
  const st = useApp.getState();
  return timerOffer(st.active, st.events, Date.now())!;
};
const lastSet = () =>
  useApp
    .getState()
    .events.filter((e) => e.type === "set")
    .at(-1);

describe("Start timer from a watch", () => {
  beforeEach(async () => {
    localStorage.clear();
    resetTimerRun();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(Date.now()), onboarded: true, bodyweight: 80, activeGymId: id });
    useApp.getState().replan();
    useApp.setState({ ready: true });
    plankFirst();
    useApp.getState().start();
  });

  afterEach(() => resetTimerRun());

  it("offers the plank's timer to the watches, in the words the workout screen uses", () => {
    const o = offer();
    expect(o.spec).toEqual({ target: 40, sides: 1, up: false });
    const w = watchTimerOffer(o, clock);
    expect(w).toMatchObject({ key: o.key, s: 40, d: 1, l: startLabel(o.spec, clock), o: "Time’s up" });
    expect(w.l).toBe("Start timer · 0:40");
    expect(w.lb).toEqual(["Get set", "Time left", "Switch sides", "Second side"]);
    expect(w.u).toBeUndefined();
  });

  it("starts at the moment of the tap, only for the set on screen, and only once", () => {
    const o = offer();
    const tap = Date.now() - s(3);
    expect(startFromWatch(useApp.getState().active, useApp.getState().events, "another:set", tap)).toBe(false);
    expect(startFromWatch(useApp.getState().active, useApp.getState().events, undefined, tap)).toBe(false);
    expect(timerSnapshot()).toBeNull();
    expect(startFromWatch(useApp.getState().active, useApp.getState().events, o.key, tap)).toBe(true);
    expect(timerSnapshot()).toMatchObject({ key: o.key, startAt: tap });
    expect(startFromWatch(useApp.getState().active, useApp.getState().events, o.key, tap + s(1))).toBe(false);
    expect(timerSnapshot()!.startAt).toBe(tap);
  });

  it("logs the seconds held when Log set comes from the watch", () => {
    const o = offer();
    const tap = Date.now();
    expect(runWatchTap("timer", tap, { key: o.key })).toBe(true);
    expect(timerSnapshot()?.key).toBe(o.key);
    holdForLog(useApp.getState(), tap + s(LEAD_SEC + 18.6));
    useApp.getState().logSet(tap + s(LEAD_SEC + 18.6));
    const set = lastSet();
    expect(set?.type === "set" && set.exerciseId === "plank" && set.reps).toBe(18);
    // The timer belonged to that set: it's gone, and the next set offers its own.
    expect(timerSnapshot()).toBeNull();
    const after = useApp.getState();
    expect(timerOffer(after.active, after.events, after.active!.restUntil! + 1)!.key).not.toBe(o.key);
  });

  it("logs the seconds held when Log set comes from the lock screen", () => {
    const tap = Date.now();
    startFromWatch(useApp.getState().active, useApp.getState().events, offer().key, tap);
    runShortcut("log", tap + s(LEAD_SEC + 12));
    const set = lastSet();
    expect(set?.type === "set" && set.reps).toBe(12);
  });

  it("logs the set as planned when Log set comes during the lead-in or with no timer", () => {
    runShortcut("log", Date.now());
    const set = lastSet();
    expect(set?.type === "set" && set.reps).toBe(40);
  });

  it("offers nothing while resting, or on a set lifted for reps", () => {
    runShortcut("log", Date.now());
    const st = useApp.getState();
    expect(st.active!.restUntil).toBeGreaterThan(Date.now());
    expect(timerOffer(st.active, st.events, Date.now())).toBeNull();
    expect(startFromWatch(st.active, st.events, "x", Date.now())).toBe(false);
  });
});

describe("timed holds on a phone-free watch workout", () => {
  const T0 = Date.UTC(2026, 10, 27, 17, 0, 0);

  beforeEach(async () => {
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(T0), onboarded: true, bodyweight: 80, activeGymId: id });
    useApp.getState().replan();
    useApp.setState({ ready: true });
  });

  it("carries a hold with its seconds, sides and Start timer words, and saves what the watch held", () => {
    plankFirst();
    const st = useApp.getState();
    const c = buildCarry({ plan: st.preview, profile: st.profile, gym: st.gyms[0]!, readiness: st.readiness, now: T0 })!;
    const k = c.carry.st.findIndex((x) => x.m);
    const step = c.carry.st[k]!;
    expect(step).toMatchObject({ r: 40, m: 1, tt: "Start timer · 0:40" });
    expect(c.carry.tl).toEqual(["Get set", "Time left", "First side", "Switch sides", "Second side", "Time’s up"]);
    // Reps steps carry no timer.
    expect(c.carry.st.filter((x) => !x.m).every((x) => x.tt === undefined)).toBe(true);

    const sets = c.carry.st.map((x, i) => [i, T0 + 60_000 * (i + 1), -1, i === k ? 31 : x.r, T0 + 60_000 * i]);
    const r = parseWatchResult(
      { id: "w12345abc", c: c.carry.id, start: T0, end: T0 + 60_000 * (sets.length + 1), sets, rates: [], hr: [] },
      T0 + s(3600 * 4),
    )!;
    const held = watchEvents(c.record, r)!.find((e) => e.type === "set" && e.exerciseId === "plank");
    expect(held?.type === "set" && held.reps).toBe(31);
  });

  it("keeps a one-sided hold's second side when it was stopped short", () => {
    const st = useApp.getState();
    const c = buildCarry({ plan: st.preview, profile: st.profile, gym: st.gyms[0]!, readiness: st.readiness, now: T0 })!;
    const sets = c.carry.st
      .slice(0, 2)
      .map((x, i) => [i, T0 + 60_000 * (i + 1), -1, Math.min(x.r, 600), T0 + 60_000 * i, ...(i === 0 ? [12] : [])]);
    const r = parseWatchResult(
      { id: "w12345abd", c: c.carry.id, start: T0, end: T0 + 60_000 * (sets.length + 1), sets, rates: [], hr: [] },
      T0 + s(3600 * 4),
    )!;
    expect(r.sets[0]!.repsR).toBe(12);
    expect(r.sets[1]!.repsR).toBeUndefined();
    // Out of range seconds are dropped, never saved.
    const bad = parseWatchResult(
      { id: "w12345abe", c: c.carry.id, start: T0, end: T0 + 60_000 * 3, sets: [[0, T0 + 60_000, -1, 10, T0, 9999]], rates: [], hr: [] },
      T0 + s(3600 * 4),
    )!;
    expect(bad.sets[0]!.repsR).toBeUndefined();
  });
});
