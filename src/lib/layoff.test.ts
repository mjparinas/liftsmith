import { describe, expect, it } from "vitest";

import { blockWeek } from "./block";
import { defaultProfile, makeGym } from "./defaults";
import { exercise } from "./exercises";
import { setLanguage, t } from "./i18n";
import { layoff } from "./layoff";
import { pickProgram, programPlan, type Ctx } from "./programs";
import { target } from "./progression";
import type { AppEvent, PlanSource, SetEvent } from "./types";

// Starting lighter after a break (competitor audit, Melvin 2026-11-09).

const NOW = new Date("2026-11-11T18:00:00").getTime();
const D = 86400_000;
const gym = makeGym("commercial", "kg", "g1");
// Started long enough ago, and checked below, so today isn't a deload week.
const profile = { ...defaultProfile(NOW - 9 * D), onboarded: true, bodyweight: 80, goal: "strength" as const, activeGymId: "g1" };
const bench = exercise("bench-press");

let n = 0;
/** One session of bench, three sets, all reps hit unless `reps` says otherwise. */
function session(at: number, weight: number, reps = 5, targetReps = 5, exerciseId = "bench-press"): SetEvent[] {
  const sid = `b${n++}`;
  return [0, 1, 2].map((i) => ({
    type: "set",
    id: `${sid}-${i}`,
    at: at + i * 1000,
    sessionId: sid,
    exerciseId,
    weight,
    reps,
    targetReps,
    targetWeight: weight,
    rir: 2,
  }));
}
/** Bench every three days, ending `daysAgo` before NOW. */
function history(daysAgo: number, weight = 100): AppEvent[] {
  return [9, 6, 3, 0].flatMap((d) => session(NOW - (daysAgo + d) * D, weight));
}

describe("break detection", () => {
  it("is quiet when the lifter has been training", () => {
    expect(blockWeek(profile, NOW).deload).toBe(false);
    expect(layoff(bench, history(3), NOW)).toBeNull();
    expect(target(bench, history(3), profile, gym, NOW).note).not.toMatch(/lighter/);
  });

  it("starts about 10% lighter for each week away, at most 30%", () => {
    expect(layoff(bench, history(11), NOW)).toMatchObject({ weeks: 1, cut: 0.1, done: 0, before: 100 });
    expect(layoff(bench, history(15), NOW)?.cut).toBeCloseTo(0.2);
    expect(layoff(bench, history(60), NOW)?.cut).toBeCloseTo(0.3);
    expect(target(bench, history(11), profile, gym, NOW).weight).toBe(90);
    expect(target(bench, history(22), profile, gym, NOW).weight).toBe(70);
  });

  it("says why on the target", () => {
    setLanguage("en");
    expect(target(bench, history(22), profile, gym, NOW).note).toBe(t("note.comeback", { count: 3, pct: 30 }));
    expect(t("note.comeback", { count: 1, pct: 10 })).toMatch(/a week off/);
  });

  it("doesn't count a break when the same muscles were trained another way", () => {
    const ev = [...history(20), ...[16, 12, 8, 4].flatMap((d) => session(NOW - d * D, 30, 10, 10, "db-bench-press"))];
    expect(layoff(bench, ev, NOW)).toBeNull();
  });

  it("leaves bodyweight exercises alone", () => {
    expect(
      layoff(
        exercise("push-up"),
        history(30).map((e) => ({ ...e, exerciseId: "push-up", weight: 0 }) as AppEvent),
        NOW,
      ),
    ).toBeNull();
  });
});

describe("building back", () => {
  it("closes the gap a third at a time, then progression takes over", () => {
    // Three weeks off, then back on bench every two days hitting every rep.
    let ev = history(30);
    const weights: number[] = [];
    for (let i = 0; i < 4; i++) {
      const at = NOW - (8 - i * 2) * D;
      const tg = target(bench, ev, profile, gym, at);
      weights.push(tg.weight);
      ev = [...ev, ...session(at, tg.weight, tg.reps, tg.reps)];
    }
    expect(weights.slice(0, 3)).toEqual([70, 80, 90]);
    // After three sessions back, the break is over and normal double progression applies.
    expect(layoff(bench, ev, NOW - 2 * D + 1)).toBeNull();
    expect(weights[3]).toBeLessThanOrEqual(92.5);
  });

  it("stops ramping when the first session back was a struggle", () => {
    const at = NOW - 6 * D;
    const ev = [...history(30), ...session(at, 70, 2, 5)];
    const tg = target(bench, ev, profile, gym, NOW - 4 * D);
    expect(tg.weight).toBeLessThanOrEqual(70);
    expect(tg.note).toBe(t("note.missedTwo"));
  });
});

describe("fixed programs", () => {
  it("starts the first session back lighter, then builds from there with the program's own jumps", () => {
    const ctx: Ctx = { profile, gym, events: [], now: NOW - 60 * D };
    const src = pickProgram("classic-5x5", ctx) as Extract<PlanSource, { kind: "program" }>;
    // A few sessions, then three weeks off.
    let events: AppEvent[] = [];
    let at = NOW - 50 * D;
    const play = (now: number) => {
      const plan = programPlan({ src, profile, gym, events, now })!;
      const sid = `p${n++}`;
      events = [
        ...events,
        {
          type: "sessionStart",
          id: `st-${sid}`,
          at: now,
          sessionId: sid,
          gymId: gym.id,
          minutes: plan.minutes,
          program: plan.program && { id: plan.program.id, day: plan.program.day },
        },
      ];
      plan.items.forEach((it) =>
        it.setTargets!.forEach((st, i) => {
          events.push({
            type: "set",
            id: `${sid}-${it.slot}-${i}`,
            at: now + i * 1000,
            sessionId: sid,
            exerciseId: it.exerciseId,
            weight: st.weight,
            reps: st.reps,
            targetReps: st.reps,
            targetWeight: st.weight,
            rir: 2,
            slot: it.slot,
            comeback: st.comeback,
          });
        }),
      );
      return plan;
    };
    for (let i = 0; i < 4; i++, at += 2 * D) play(at);
    const before = programPlan({ src, profile, gym, events, now: at })!;
    const squatBefore = before.items.find((i) => i.exerciseId === "back-squat")!.setTargets![0].weight;
    const back = play(at + 21 * D);
    const squatBack = back.items.find((i) => i.exerciseId === "back-squat")!;
    expect(squatBack.setTargets![0].weight).toBeLessThan(squatBefore * 0.8);
    expect(squatBack.setTargets![0].comeback).toBe(true);
    expect(squatBack.target.note).toMatch(/lighter/);
    const next = programPlan({ src, profile, gym, events, now: at + 23 * D })!;
    const squatNext = next.items.find((i) => i.exerciseId === "back-squat")!.setTargets![0].weight;
    expect(squatNext).toBeCloseTo(squatBack.setTargets![0].weight + 2.5);
  });
});
