import { describe, expect, it } from "vitest";

import { blockWeek } from "./block";
import { defaultProfile, makeGym } from "./defaults";
import { generate } from "./generator";
import { pairBody } from "./health";
import { t } from "./i18n";
import { insights, stalls } from "./insights";
import { readiness } from "./readiness";
import type { AppEvent, Profile, SetEvent } from "./types";
import { callWhy, itemWhy, whyContext, workoutWhy } from "./why";

// Action-oriented recommendations (Melvin, 2026-11-09): every recommendation says why, and the coach's
// notes say what we noticed and what to do about it.

const D = 86_400_000;
const W = 7 * D;
const NOW = new Date("2026-11-11T18:00:00").getTime();
const base: Profile = { ...defaultProfile(NOW - 2 * W), onboarded: true, bodyweight: 80 };
const gym = makeGym("commercial", "kg", "g1");

let n = 0;
const set = (at: number, sessionId: string, over: Partial<SetEvent> = {}): SetEvent => ({
  type: "set",
  id: `s${n++}`,
  at,
  sessionId,
  exerciseId: "back-squat",
  weight: 100,
  reps: 5,
  targetReps: 5,
  rir: 2,
  ...over,
});
const session = (at: number, id: string, over: Partial<SetEvent> = {}, count = 3): AppEvent[] =>
  Array.from({ length: count }, (_, i) => set(at + i * 1000, id, over));

describe("why: every recommendation explains itself", () => {
  it("says why each exercise, why that many sets and why that load", () => {
    const events = [...session(NOW - 3 * D, "a", { reps: 5, targetReps: 5 })];
    const plan = generate({ gym, profile: base, events, minutes: 45, now: NOW });
    const ctx = whyContext(plan, events, base, NOW);
    for (const item of plan.items) {
      const w = itemWhy(item, ctx);
      expect(w.pick).toMatch(/\d+% recovered, \d+ of \d+ sets this week/);
      expect(w.short.length).toBeGreaterThan(20);
      expect(w.load).toBe(item.target.note);
    }
    const squat = plan.items.find((i) => i.exerciseId === "back-squat");
    if (squat) expect(itemWhy(squat, ctx).load).toMatch(/Hit every set last time|top of your rep range/);
  });

  it("names the set change on an easy day and in a deload", () => {
    const plan = generate({ gym, profile: base, events: [], minutes: 45, now: NOW, call: "recover" });
    const ctx = whyContext(plan, [], base, NOW);
    expect(itemWhy(plan.items[0], ctx).sets).toBe("one set fewer for an easy day");
    expect(workoutWhy(plan.items[0], plan)).toMatch(/Easy day.*one set fewer/);
    const deload = { ...base, blockStart: NOW - 4 * W - D };
    expect(blockWeek(deload, NOW).deload).toBe(true);
    const dp = generate({ gym, profile: deload, events: [], minutes: 45, now: NOW });
    expect(itemWhy(dp.items[0], whyContext(dp, [], deload, NOW)).sets).toBe("half the sets for the deload");
  });

  it("calls out the lifter's own set count and leaves the pick out of fixed programs", () => {
    const p = { ...base, training: { sets: 5 } };
    const plan = generate({ gym, profile: p, events: [], minutes: 60, now: NOW });
    const ctx = whyContext(plan, [], p, NOW);
    expect(itemWhy(plan.items[0], ctx).sets).toBe("5 sets, your setting");
    expect(itemWhy(plan.items[0], { ...ctx, chosen: true }).pick).toBeUndefined();
  });

  it("explains the day's call with the signals behind it", () => {
    const hard: AppEvent[] = [
      ...session(NOW - 2 * D, "a", { reps: 2 }, 4),
      ...session(NOW - D, "b", { reps: 2 }, 4),
      ...session(NOW - 3600_000, "c", { reps: 2 }, 4),
    ];
    const r = readiness(hard, base, NOW);
    expect(r.call).toBe("recover");
    expect(callWhy(r, "recover", false)).toMatch(/^Go easy today: .*missed reps lately.*\(readiness \d+\)/i);
    expect(callWhy(r, "push", false)).toMatch(/^Your call today\. We suggested an easy day because/);
    const fresh = readiness([...session(NOW - 6 * D, "a", {}, 4), ...session(NOW - 3 * D, "b", {}, 4)], base, NOW);
    expect(callWhy(fresh, "push", false)).toMatch(/^Push today: .*one rep closer to failure/);
    const deload = { ...base, blockStart: NOW - 4 * W - D };
    const inDeload = readiness([...session(NOW - 6 * D, "a", {}, 4), ...session(NOW - 3 * D, "b", {}, 4)], deload, NOW);
    expect(inDeload.call).toBe("normal");
    expect(callWhy(inDeload, "normal", true)).toMatch(/^Deload week/);
  });
});

describe("insights: coach's notes", () => {
  const weekly = (weeks: number, weight: (i: number) => number, exerciseId = "back-squat", reps = 5) =>
    Array.from({ length: weeks }, (_, i) =>
      session(NOW - (weeks - i) * W + D, `${exerciseId}-${i}`, { exerciseId, weight: weight(i), reps, targetReps: reps }),
    ).flat();

  it("finds a lift with no new best in 3+ weeks while still training it", () => {
    // Three rising weeks, then four flat ones.
    const flat = [...weekly(7, (i) => (i < 3 ? 90 + i * 5 : 100))];
    expect(stalls(flat, NOW).map((s) => s.exerciseId)).toEqual(["back-squat"]);
    // With Pro, a single stall goes to the plateau detective: cause, three-week fix, one tap to start it.
    const notes = insights({ events: flat, profile: base, now: NOW });
    const s = notes.find((x) => x.id.startsWith("plateau-"))!;
    expect(s.title).toBe("Back squat has stalled");
    expect(s.why).toMatch(/No new best in \d weeks \(best estimated one-rep max [\d.]+ kg\)\. /);
    expect(s.advice).toMatch(/^Three-week fix: /);
    expect(s.action?.kind).toBe("plateau");
    // A running fix replaces the stall note with a note that it's in the plan.
    const p = (s.action as { plateau: import("./plateau").Plateau }).plateau;
    const running = insights({
      events: flat,
      profile: {
        ...base,
        plateauFixes: [{ exerciseId: p.exerciseId, kind: p.fix, startedAt: NOW - D, until: NOW + 20 * D, from: p.best }],
      },
      now: NOW,
    });
    expect(running.some((x) => x.id.startsWith("plateau-"))).toBe(false);
    expect(running.find((x) => x.id.startsWith("fix-live-"))?.advice).toMatch(/already includes it/);
  });

  it("doesn't call a climbing lift stalled, and says it's working", () => {
    const ev = weekly(5, (i) => 90 + i * 2.5);
    expect(stalls(ev, NOW)).toEqual([]);
    const good = insights({ events: ev, profile: base, now: NOW }).find((x) => x.id.startsWith("gain-"));
    expect(good?.tone).toBe("good");
    expect(good?.why).toMatch(/up \d+% in \d weeks/);
  });

  it("offers a deload when several lifts stall at once", () => {
    const p = { ...base, blockStart: NOW - 2 * W - D };
    const ev = [...weekly(7, (i) => (i < 2 ? 90 + i * 5 : 95)), ...weekly(7, (i) => (i < 2 ? 60 + i * 5 : 65), "bench-press")];
    const many = insights({ events: ev, profile: p, now: NOW }).find((x) => x.id.startsWith("stall-many"));
    expect(many?.title).toBe("2 lifts have stalled");
    expect(many?.action).toEqual({ kind: "deload", label: "Start a deload week" });
  });

  it("warns when reps were missed three workouts running", () => {
    const p = { ...base, blockStart: NOW - 2 * W - D };
    const ev = [
      ...session(NOW - 5 * D, "a", { reps: 3 }),
      ...session(NOW - 3 * D, "b", { reps: 3 }),
      ...session(NOW - D, "c", { reps: 2 }),
    ];
    const note = insights({ events: ev, profile: p, now: NOW })[0];
    expect(note.title).toBe("Fatigue is building up");
    expect(note.tone).toBe("warn");
    expect(note.action?.kind).toBe("deload");
  });

  it("doesn't read bonus sets or shorter cardio as missed reps", () => {
    const p = { ...base, blockStart: NOW - 2 * W - D };
    // Every planned set hit; each workout ends with rest-pause and drop sets (fewer reps by design) and a
    // run shorter than last time's.
    const extras = (at: number, id: string): AppEvent[] => [
      ...session(at, id, {}, 2),
      set(at + 5000, id, { reps: 2, tag: "restPause" }),
      set(at + 6000, id, { weight: 75, reps: 3, tag: "drop" }),
      set(at + 7000, id, { reps: 3, tag: "drop" }),
      set(at + 8000, id, { exerciseId: "treadmill-run", weight: 0, reps: 900, targetReps: 1200 }),
      set(at + 9000, id, { exerciseId: "treadmill-run", weight: 0, reps: 900, targetReps: 1200 }),
    ];
    const ev = [...extras(NOW - 5 * D, "a"), ...extras(NOW - 3 * D, "b"), ...extras(NOW - D, "c")];
    expect(insights({ events: ev, profile: p, now: NOW }).find((x) => x.id.startsWith("missed-"))).toBeUndefined();
    expect(readiness(ev, p, NOW).signals.map((x) => x.text)).not.toContain(t("sig.missed"));
  });

  it("folds stalled lifts into the fatigue note instead of offering a second deload", () => {
    const p = { ...base, blockStart: NOW - 2 * W - D };
    const flat = (id: string, w0: number) =>
      weekly(7, (i) => (i < 2 ? w0 + i * 5 : w0 + 5), id, 5).map((e, k, all) =>
        e.type === "set" && e.at > all.at(-1)!.at - 3 * W ? { ...e, reps: 2 } : e,
      );
    const notes = insights({ events: [...flat("back-squat", 90), ...flat("bench-press", 60)], profile: p, now: NOW });
    expect(notes.filter((x) => x.action?.kind === "deload")).toHaveLength(1);
    expect(notes[0].why).toMatch(/have had no new best in \d weeks or more, too/);
  });

  it("spots rising body fat and gives advice for the goal", () => {
    const ev: AppEvent[] = [0, 1, 2, 3, 4].map((i) => ({
      type: "bodyweight",
      id: `b${i}`,
      at: NOW - (5 - i) * W,
      kg: 80 + i * 0.3,
      bodyFat: 18 + i * 0.5,
    }));
    const cut = insights({ events: ev, profile: { ...base, goal: "general" }, now: NOW }).find((x) => x.id.startsWith("fat-up"))!;
    expect(cut.title).toBe("Body fat is creeping up");
    expect(cut.why).toMatch(/Up about 2 points in 4 weeks \(now 20%\)/);
    expect(cut.advice).toMatch(/300 fewer calories/);
    const bulk = insights({ events: ev, profile: { ...base, goal: "muscle" }, now: NOW }).find((x) => x.id.startsWith("fat-up"))!;
    expect(bulk.advice).toMatch(/building muscle/);
  });

  it("warns when weight drops faster than 1% a week", () => {
    const ev: AppEvent[] = [0, 1, 2, 3].map((i) => ({ type: "bodyweight", id: `b${i}`, at: NOW - (4 - i) * W, kg: 80 - i * 1.2 }));
    const note = insights({ events: ev, profile: base, now: NOW }).find((x) => x.id.startsWith("weight-down"));
    expect(note?.why).toMatch(/Down about 1\.2 kg a week/);
  });

  it("suggests prioritising a big muscle that has had too little work", () => {
    // Four lower-body sessions over the last 3 weeks, no chest at all.
    const ev = [0, 1, 2, 3].flatMap((i) => session(NOW - (20 - i * 5) * D, `l${i}`, { exerciseId: "back-squat" }, 8));
    const note = insights({ events: ev, profile: base, now: NOW }).find((x) => x.id.startsWith("volume-"));
    expect(note?.action?.kind).toBe("priority");
    expect(note?.why).toMatch(/sets a week for the last 2 weeks, against a goal of \d+/);
  });

  it("offers a short workout when the weekly goal is at risk", () => {
    const note = insights({ events: [], profile: { ...base, minutes: 60 }, now: NOW, streak: { needed: 2, atRisk: true, weeks: 4 } })[0];
    expect(note.title).toBe("Your 4-week streak needs 2 more");
    expect(note.action).toEqual({ kind: "minutes", minutes: 30, label: "Make today 30 minutes" });
  });

  it("says nothing when there's nothing to act on", () => {
    expect(insights({ events: [], profile: base, now: NOW })).toEqual([]);
  });
});

describe("health: weigh-ins and body fat", () => {
  it("keeps the latest reading each day and reads body fat as a percentage either way", () => {
    const r = pairBody(
      [
        { value: 81, startDate: "2026-11-01T07:00:00" },
        { value: 80.5, startDate: "2026-11-01T19:00:00" },
        { value: 80, startDate: "2026-11-02T07:00:00" },
      ],
      [
        { value: 0.19, startDate: "2026-11-01T07:00:00" },
        { value: 18.5, startDate: "2026-11-02T07:00:00" },
      ],
    );
    expect(r.map((x) => [x.kg, x.bodyFat])).toEqual([
      [80.5, 19],
      [80, 18.5],
    ]);
  });
});
