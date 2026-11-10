// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeSet, makeSets } from "@/test/factories";

import { defaultProfile } from "./defaults";
import { hoursUntilReady, nextUp, READY_AT } from "./nextUp";
import { recovery } from "./recovery";
import { applyOrder, moveItem } from "./reorder";
import { hrReady, READY_MIN_REST_S } from "./restReady";
import { useApp } from "./store";
import { linksOf } from "./superset";
import { tipFor, TIPS, type TipContext } from "./tips";

// The polish pass (Melvin, 2026-11-10: "build it all"): undo, drag to reorder, heart-rate-ready rest,
// what's next on the summary and one tip at a time.

const ids = (xs: { exerciseId: string }[]) => xs.map((x) => x.exerciseId);
const item = (exerciseId: string, group?: string) => ({ exerciseId, ...(group ? { group } : {}) });

describe("moving an exercise", () => {
  it("moves it and leaves the others in order", () => {
    expect(ids(moveItem([item("a"), item("b"), item("c"), item("d")], 0, 2))).toEqual(["b", "c", "a", "d"]);
    expect(ids(moveItem([item("a"), item("b"), item("c"), item("d")], 3, 1))).toEqual(["a", "d", "b", "c"]);
  });
  it("does nothing for the same place or an index out of range", () => {
    const xs = [item("a"), item("b")];
    expect(ids(moveItem(xs, 1, 1))).toEqual(["a", "b"]);
    expect(ids(moveItem(xs, 0, 5))).toEqual(["a", "b"]);
  });
  it("keeps supersets the move doesn't touch", () => {
    const xs = [item("a", "ss-a"), item("b", "ss-a"), item("c"), item("d")];
    const out = moveItem(xs, 3, 2);
    expect(ids(out)).toEqual(["a", "b", "d", "c"]);
    expect(linksOf(out)).toEqual([true, false, false]);
  });
  it("takes the moved exercise out of its superset, and its partners stay together", () => {
    const xs = [item("a", "ss-a"), item("b", "ss-a"), item("c", "ss-a"), item("d")];
    const out = moveItem(xs, 1, 3);
    expect(ids(out)).toEqual(["a", "c", "d", "b"]);
    expect(linksOf(out)).toEqual([true, false, false]);
  });
  it("splits a superset it's dropped into", () => {
    const xs = [item("a"), item("b", "ss-b"), item("c", "ss-b")];
    const out = moveItem(xs, 0, 1);
    expect(ids(out)).toEqual(["b", "a", "c"]);
    expect(linksOf(out)).toEqual([false, false]);
  });
  it("puts a chosen order back on a rebuilt plan with the same exercises only", () => {
    const plan = [item("a"), item("b"), item("c")];
    expect(ids(applyOrder(plan, ["c", "a", "b"]))).toEqual(["c", "a", "b"]);
    expect(ids(applyOrder(plan, ["c", "a"]))).toEqual(["a", "b", "c"]);
    expect(ids(applyOrder(plan, ["c", "a", "x"]))).toEqual(["a", "b", "c"]);
  });
});

describe("heart-rate-ready rest", () => {
  const T0 = 1_000_000;
  // 100 bpm at the start of the set, 150 at its end, back down over the rest.
  const log = (end: number) => ({
    startedAt: T0,
    hr: [100, 150, 130, end],
    hrAt: [0, 30_000, 60_000, 90_000],
  });
  const setStart = T0;
  const restStart = T0 + 30_000;
  it("says ready once the heart rate is back near where the set started", () => {
    expect(hrReady(log(104), setStart, restStart, T0 + 90_000)).toEqual({ start: 100, peak: 150, bpm: 104 });
  });
  it("stays quiet while it's still up", () => {
    expect(hrReady(log(120), setStart, restStart, T0 + 90_000)).toBeNull();
  });
  it("waits for a minimum rest and needs a monitor", () => {
    expect(hrReady(log(100), setStart, restStart, restStart + (READY_MIN_REST_S - 1) * 1000)).toBeNull();
    expect(hrReady({ startedAt: T0, hr: [], hrAt: [] }, setStart, restStart, T0 + 90_000)).toBeNull();
  });
  it("needs the set to have raised the heart rate", () => {
    expect(hrReady({ startedAt: T0, hr: [100, 104, 102], hrAt: [0, 30_000, 90_000] }, setStart, restStart, T0 + 90_000)).toBeNull();
  });
});

describe("what's next", () => {
  // Monday 2 November 2026, 19:00 local; training Monday, Wednesday and Friday at 18:00.
  const now = new Date(2026, 10, 2, 19).getTime();
  const profile = { ...defaultProfile(now), daysPerWeek: 3, calendar: { days: [1, 3, 5], time: "18:00", write: false, read: false } };
  const bench = makeSets(4, { at: now - 3600_000, sessionId: "today", exerciseId: "bench-press", rir: 1 });
  it("gives the next training day from the schedule, never later today", () => {
    const n = nextUp(bench, "today", profile, now)!;
    expect(new Date(n.at).getDay()).toBe(3);
    expect(new Date(n.at).getHours()).toBe(18);
  });
  it("sorts today's muscles into ready by then and still recovering", () => {
    const heavy = makeSets(14, { at: now - 3600_000, sessionId: "today", exerciseId: "bench-press", rir: 0 });
    const n = nextUp(heavy, "today", profile, now)!;
    expect(n.waiting.map((w) => w.muscle)).toContain("chest");
    const chest = n.waiting.find((w) => w.muscle === "chest")!;
    expect(recovery(heavy, now + chest.hours * 3600_000).chest).toBeGreaterThanOrEqual(READY_AT);
    expect(n.fresh.every((m) => m !== "chest")).toBe(true);
  });
  it("counts hours until ready from the recovery model", () => {
    expect(hoursUntilReady([], "chest", now)).toBe(0);
    expect(hoursUntilReady(makeSets(10, { at: now - 900_000, rir: 0 }), "chest", now)).toBeGreaterThan(0);
  });
  it("has nothing to say without sets in the workout", () => {
    expect(nextUp([makeSet({ sessionId: "other" })], "today", profile, now)).toBeNull();
  });
});

describe("one tip at a time", () => {
  const ctx = (o: Partial<TipContext> = {}): TipContext => ({
    native: false,
    voice: false,
    oneHanded: false,
    upcoming: 3,
    setsLogged: 2,
    ...o,
  });
  it("never shows on the first rest", () => {
    expect(tipFor({ seen: [] }, "s1", ctx({ setsLogged: 1 })).tip).toBeNull();
  });
  it("shows one per workout and marks it seen at once", () => {
    const a = tipFor({ seen: [] }, "s1", ctx());
    expect(a.tip).toBe("undo");
    expect(a.state.seen).toEqual(["undo"]);
    // The same workout keeps the same tip; the next workout gets the next one.
    expect(tipFor(a.state, "s1", ctx({ setsLogged: 5 })).tip).toBe("undo");
    expect(tipFor(a.state, "s2", ctx()).tip).toBe("reorder");
  });
  it("stays hidden after Got it, and skips tips that don't apply", () => {
    expect(tipFor({ seen: ["undo"], session: "s1", shown: "undo", hidden: true }, "s1", ctx()).tip).toBeNull();
    const seen = TIPS.map((x) => x.id).filter((id) => id !== "handsFree" && id !== "voice");
    expect(tipFor({ seen }, "s3", ctx({ voice: true })).tip).toBeNull();
    expect(tipFor({ seen }, "s3", ctx({ native: true, voice: true })).tip).toBe("handsFree");
  });
});

describe("undo the last set", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T18:00:00"));
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(Date.now()), onboarded: true, activeGymId: id });
  });
  afterEach(() => vi.useRealTimers());

  const sets = () => useApp.getState().events.filter((e) => e.type === "set");

  it("deletes the set and puts the set card back as it was", () => {
    const s = useApp.getState;
    s().start();
    s().skipWarmup();
    const before = s().active!;
    s().adjust(before.weight, before.reps - 2);
    s().logSet();
    expect(sets()).toHaveLength(1);
    expect(s().undoable).not.toBeNull();
    s().undoLast();
    expect(sets()).toHaveLength(0);
    expect(s().active!.reps).toBe(before.reps - 2);
    expect(s().active!.restUntil).toBeNull();
    expect(s().undoable).toBeNull();
  });
  it("takes the set's reps-left rating with it", () => {
    const s = useApp.getState;
    s().start();
    s().skipWarmup();
    s().logSet();
    s().rateEffort(sets()[0]!.id, 2);
    s().undoLast();
    expect(s().events.some((e) => e.type === "effort")).toBe(false);
  });
  it("undoes a warm-up too", () => {
    const s = useApp.getState;
    s().start();
    expect(s().active!.plan.items[0]!.warmup?.length).toBeGreaterThan(0);
    s().logSet();
    expect(s().events.some((e) => e.type === "warmup")).toBe(true);
    s().undoLast();
    expect(s().events.some((e) => e.type === "warmup")).toBe(false);
    expect(s().active!.warm).toBe(0);
  });
  it("is gone once the rest is over", () => {
    const s = useApp.getState;
    s().start();
    s().skipWarmup();
    s().logSet();
    const until = s().undoable!.until;
    vi.setSystemTime(until + 1);
    s().undoLast();
    expect(sets()).toHaveLength(1);
  });
  it("moves only exercises still to come mid-workout", () => {
    const s = useApp.getState;
    s().start();
    const order = ids(s().active!.plan.items);
    expect(order.length).toBeGreaterThanOrEqual(3);
    s().moveExercise(0, 2);
    expect(ids(s().active!.plan.items)).toEqual(order);
    s().moveExercise(2, 1);
    expect(ids(s().active!.plan.items)).toEqual([order[0], order[2], order[1], ...order.slice(3)]);
  });
});

describe("reordering Today's plan", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T18:00:00"));
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(Date.now()), onboarded: true, activeGymId: id });
  });
  afterEach(() => vi.useRealTimers());

  it("keeps the order when the plan is rebuilt", () => {
    const s = useApp.getState;
    const order = ids(s().preview!.items);
    s().moveExercise(0, order.length - 1);
    const moved = ids(s().preview!.items);
    expect(moved).toEqual([...order.slice(1), order[0]]);
    s().replan();
    expect(ids(s().preview!.items)).toEqual(moved);
  });
});
