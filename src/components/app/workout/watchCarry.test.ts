// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { defaultProfile } from "@/lib/defaults";
import { useApp } from "@/lib/store";
import { keepCarry, parseWatchResult, readCarries, watchEvents, watchSessionId, type WatchResult } from "@/lib/watchWorkout";

import { saveWatchWorkout } from "../WatchCarry";
import { buildCarry, carryId, carryItems } from "./watchCarry";

// Phone-free watch workouts (docs/decisions/watch-apps.md "Phone-free workouts"): the watch walks through the steps
// the phone worked out ahead, and the phone replays what the watch logged. The two must agree, set by set.

const T0 = Date.UTC(2026, 10, 26, 17, 0, 0);

function carry() {
  const s = useApp.getState();
  const gym = s.gyms[0]!;
  return buildCarry({ plan: s.preview, profile: s.profile, gym, readiness: s.readiness, now: T0 })!;
}

/** The watch's own run: every step logged as planned, a minute apart, answering "too hard" wherever it's asked. */
function runAll(c: ReturnType<typeof carry>, change?: { k: number; kg: number; reps: number }): WatchResult {
  const sets = c.carry.st.map((st, k) => {
    const item = c.carry.ex[st.e]!;
    const kg = change?.k === k ? change.kg : item.kg.length ? item.kg[st.i]! : -1;
    const reps = change?.k === k ? change.reps : st.r;
    return [k, T0 + 60_000 * (k + 1), kg, reps, T0 + 60_000 * (k + 1) - 30_000];
  });
  const rates = c.carry.st.flatMap((st, k) => (st.f ? [[k, -1]] : []));
  return parseWatchResult(
    { id: "w12345abc", c: c.carry.id, start: T0, end: T0 + 60_000 * (sets.length + 1), sets, rates, hr: [120, 160, 80] },
    T0 + 3600_000 * 4,
  )!;
}

describe("phone-free watch workouts", () => {
  beforeEach(async () => {
    localStorage.clear();
    await useApp.getState().reset();
    const id = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ ...defaultProfile(T0), onboarded: true, bodyweight: 80, activeGymId: id });
    useApp.getState().replan();
    useApp.setState({ ready: true });
  });

  it("carries every set of today's plan, warm-ups included, with the rest after each", () => {
    const c = carry();
    const plan = useApp.getState().preview!;
    const items = carryItems(plan);
    const working = items.reduce((n, i) => n + i.sets, 0);
    const warm = items.reduce((n, i) => n + (i.warmup?.length ?? 0), 0);
    expect(c.carry.st.length).toBe(working + warm);
    expect(c.carry.ex.length).toBe(items.length);
    expect(c.carry.st.at(-1)!.s).toBe(0);
    expect(c.carry.st.slice(0, -1).every((s) => s.s > 0)).toBe(true);
    // Every planned weight is on its exercise's ladder, so the watch can show it as is.
    for (const st of c.carry.st) {
      const item = c.carry.ex[st.e]!;
      if (item.kg.length) expect(item.w[st.i]).toBeTruthy();
    }
    // "How was …?" after each exercise's last set.
    expect(c.carry.st.filter((s) => s.f).length).toBe(items.length);
    expect(c.record.plan.items.length).toBe(items.length);
  });

  it("keeps the same id for the same plan, and a new one for another", () => {
    const a = carry();
    const b = carry();
    expect(a.carry.id).toBe(b.carry.id);
    expect(carryId("2026-11-26", "x")).not.toBe(carryId("2026-11-26", "y"));
  });

  it("replays a watch workout into the same sets a phone workout logs", () => {
    const c = carry();
    const r = runAll(c);
    const evs = watchEvents(c.record, r)!;
    const sets = evs.filter((e) => e.type === "set");
    const warm = evs.filter((e) => e.type === "warmup");
    expect(sets.length + warm.length).toBe(c.carry.st.length);
    expect(evs[0]).toMatchObject({ type: "sessionStart", source: "watch", sessionId: watchSessionId(r) });
    expect(evs.at(-1)).toMatchObject({ type: "sessionEnd", avgHr: 120, maxHr: 160, minHr: 80 });
    expect(evs.filter((e) => e.type === "feedback").every((e) => e.type === "feedback" && e.rating === -1)).toBe(true);
    expect(evs.filter((e) => e.type === "feedback").length).toBe(c.record.plan.items.length);
    // Each set is the step the watch showed: same exercise, weight and reps, at its own time.
    let k = 0;
    for (const e of evs) {
      if (e.type !== "set" && e.type !== "warmup") continue;
      const st = c.carry.st[k]!;
      const item = c.record.plan.items[st.e]!;
      expect(e.exerciseId).toBe(item.exerciseId);
      expect(e.reps).toBe(st.r);
      expect(e.at).toBe(T0 + 60_000 * (k + 1));
      k++;
    }
    // Every id comes from the watch's id, so the same result twice is the same events.
    expect(watchEvents(c.record, r)!.map((e) => e.id)).toEqual(evs.map((e) => e.id));
  });

  it("saves the weight and reps changed on the watch", () => {
    const c = carry();
    const k = c.carry.st.findIndex((s) => c.carry.ex[s.e]!.kg.length > 2 && s.a);
    const item = c.carry.ex[c.carry.st[k]!.e]!;
    const kg = item.kg[0]!;
    const evs = watchEvents(c.record, runAll(c, { k, kg, reps: 3 }))!;
    const logged = evs.filter((e) => e.type === "set" || e.type === "warmup")[k]!;
    expect(logged).toMatchObject({ weight: kg, reps: 3 });
  });

  it("saves a workout once, however often it arrives, and only with its plan", () => {
    const c = carry();
    const r = runAll(c);
    const raw = {
      id: r.id,
      c: r.c,
      start: r.start,
      end: r.end,
      sets: r.sets.map((s) => [s.k, s.at, s.kg ?? -1, s.reps, s.from]),
      rates: [],
    };
    expect(saveWatchWorkout(raw, T0 + 3600_000 * 4)).toBe(0); // no plan kept yet
    keepCarry(c.record, T0);
    expect(readCarries()).toHaveLength(1);
    const n = saveWatchWorkout(raw, T0 + 3600_000 * 4);
    expect(n).toBeGreaterThan(0);
    expect(saveWatchWorkout(raw, T0 + 3600_000 * 4)).toBe(0);
    const starts = useApp.getState().events.filter((e) => e.type === "sessionStart");
    expect(starts).toHaveLength(1);
    expect(useApp.getState().stats.sessions.length).toBe(1);
  });

  it("refuses results out of order, from the future or too old", () => {
    const base = { id: "w1abc", c: "c1", start: T0, end: T0 + 600_000, sets: [[0, T0 + 60_000, 50, 8, T0]] };
    expect(parseWatchResult(base, T0 + 700_000)).not.toBeNull();
    expect(parseWatchResult({ ...base, sets: [[1, T0 + 60_000, 50, 8, T0]] }, T0 + 700_000)).toBeNull();
    expect(parseWatchResult({ ...base, end: T0 + 9e6 }, T0 + 700_000)).toBeNull();
    expect(parseWatchResult(base, T0 + 30 * 86_400_000)).toBeNull();
    expect(parseWatchResult({ ...base, sets: [[0, T0 + 60_000, 5000, 8, T0]] }, T0 + 700_000)).toBeNull();
    expect(parseWatchResult({ ...base, id: "bad id!" }, T0 + 700_000)).toBeNull();
    expect(parseWatchResult("not json", T0)).toBeNull();
  });
});
