import { describe, expect, it } from "vitest";

import { DAY, makeProfile, makeTestGym, NOW } from "@/test/factories";

import { blockWeek } from "./block";
import { ENGLISH_ROWS, EXERCISE_BY_ID, EXERCISES } from "./exercises";
import { alternatives, generate, injuryPass, type Plan } from "./generator";
import {
  birthFromWeeks,
  bodyMode,
  CRUNCHES,
  dueFromWeeks,
  JUMPS,
  modeAvoids,
  modeSkipped,
  modeTarget,
  ON_BACK,
  ON_BELLY,
  RUNS,
  WEEK,
} from "./pregnancy";
import type { AppEvent, Profile, SetEvent } from "./types";

const gym = makeTestGym("commercial", "kg", { id: "g" });
const pregnantAt = (weeks: number): Profile =>
  makeProfile({ activeGymId: "g", pregnancy: { consentAt: NOW - DAY, due: dueFromWeeks(weeks, NOW) } });
const afterBirth = (weeks: number, csection = false): Profile =>
  makeProfile({ activeGymId: "g", pregnancy: { consentAt: NOW - DAY, birth: birthFromWeeks(weeks, NOW), csection } });

let n = 0;
const set = (exerciseId: string, at: number, weight: number, reps: number): SetEvent => ({
  type: "set",
  id: `p${n++}`,
  at,
  sessionId: `s${at}`,
  exerciseId,
  weight,
  reps,
  targetReps: reps,
  rir: 2,
});
// A month of bench and squats, so targets have a history to scale.
const history: AppEvent[] = [28, 21, 14, 7].flatMap((d) => [
  set("bench-press", NOW - d * DAY, 60, 8),
  set("back-squat", NOW - d * DAY, 80, 8),
]);

describe("bodyMode", () => {
  it("is off without consent or dates", () => {
    expect(bodyMode(makeProfile(), NOW)).toBeNull();
    expect(bodyMode(makeProfile({ pregnancy: { consentAt: NOW } }), NOW)).toBeNull();
  });

  it("follows the weeks of pregnancy through each trimester", () => {
    expect(bodyMode(pregnantAt(8), NOW)).toMatchObject({
      kind: "pregnant",
      week: 8,
      phase: "early",
      pct: 100,
      minRir: 2,
      avoid: [],
      nextAt: 14,
    });
    expect(bodyMode(pregnantAt(13), NOW)?.phase).toBe("early");
    expect(bodyMode(pregnantAt(14), NOW)).toMatchObject({ phase: "middle", pct: 90, minRir: 3, maxSets: 3, nextAt: 28 });
    expect(bodyMode(pregnantAt(14), NOW)?.avoid).toEqual(["back", "belly", "jump", "crunch"]);
    expect(bodyMode(pregnantAt(30), NOW)).toMatchObject({ phase: "late", pct: 80, nextAt: undefined });
  });

  it("moves on as days pass without anyone changing the setting", () => {
    const p = pregnantAt(13);
    expect(bodyMode(p, NOW + WEEK)?.phase).toBe("middle");
  });

  it("counts a due date two weeks past as a birth on the due date", () => {
    const p = pregnantAt(41);
    expect(bodyMode(p, NOW)?.kind).toBe("pregnant");
    expect(bodyMode(p, NOW + WEEK - DAY)?.kind).toBe("pregnant");
    expect(bodyMode(p, NOW + WEEK)).toMatchObject({ kind: "postpartum", week: 2, phase: "rest" });
  });

  it("builds back after birth, two weeks slower after a C-section", () => {
    expect(bodyMode(afterBirth(0), NOW)).toMatchObject({ kind: "postpartum", phase: "rest", pct: 50, maxSets: 2, minRir: 4 });
    expect(bodyMode(afterBirth(0), NOW)?.avoid).toEqual(["jump", "run", "crunch"]);
    expect(bodyMode(afterBirth(6), NOW)?.phase).toBe("rebuild");
    expect(bodyMode(afterBirth(6, true), NOW)?.phase).toBe("rest");
    expect(bodyMode(afterBirth(12), NOW)).toMatchObject({ phase: "build", pct: 85, avoid: [] });
    expect(bodyMode(afterBirth(12, true), NOW)?.phase).toBe("rebuild");
    expect(bodyMode(afterBirth(16), NOW)).toMatchObject({ phase: "settle", pct: 90, nextAt: undefined });
    expect(bodyMode(afterBirth(17, true), NOW)?.phase).toBe("build");
  });

  it("round-trips the weeks the stepper sets", () => {
    for (const w of [1, 14, 27, 28, 40]) expect(bodyMode(pregnantAt(w), NOW)?.week).toBe(w);
    for (const w of [0, 6, 12, 16, 52]) expect(bodyMode(afterBirth(w), NOW)?.week).toBe(w);
  });
});

describe("the exercise lists", () => {
  const lists = { ON_BACK, ON_BELLY, JUMPS, RUNS, CRUNCHES };

  it("name only real exercises", () => {
    for (const [name, ids] of Object.entries(lists)) for (const id of ids) expect(EXERCISE_BY_ID.has(id), `${name}: ${id}`).toBe(true);
  });

  it("list every exercise whose setup says it's done lying on the back or face down", () => {
    for (const row of ENGLISH_ROWS) {
      const s = row.setup.toLowerCase();
      if (/lie on your back|lie flat|on your back,/.test(s) && !/side/.test(s))
        expect(ON_BACK.has(row.id), `${row.id} lies on the back`).toBe(true);
      if (/lie (chest |face )down|lie face down|face down on/.test(s)) expect(ON_BELLY.has(row.id), `${row.id} lies face down`).toBe(true);
    }
  });

  it("keep the moves that suit pregnancy", () => {
    const mode = bodyMode(pregnantAt(30), NOW);
    for (const id of ["hip-thrust", "incline-bench-press", "plank", "goblet-squat", "side-lying-leg-raise", "brisk-walk"])
      if (EXERCISE_BY_ID.has(id)) expect(modeAvoids({ id }, mode), id).toBeNull();
  });
});

describe("the plan", () => {
  it("leaves out what the phase avoids and caps the sets", () => {
    const profile = pregnantAt(24);
    const mode = bodyMode(profile, NOW)!;
    const skipped = modeSkipped(EXERCISES, mode);
    for (const day of [0, 1, 2, 3, 4]) {
      const plan = generate({ gym, profile, events: history, minutes: 75, now: NOW + day * DAY, call: "push", challenge: true });
      expect(plan.items.length).toBeGreaterThan(0);
      expect(plan.call).toBe("normal");
      expect(plan.challenge).toBe(false);
      for (const item of plan.items) {
        expect(skipped.has(item.exerciseId), item.exerciseId).toBe(false);
        expect(item.sets).toBeLessThanOrEqual(3);
        expect(item.target.rir).toBeGreaterThanOrEqual(3);
        expect(item.mode).toBe("pregnant");
      }
    }
  });

  it("lightens loads to the phase's share and marks them so progression skips them", () => {
    const profile = afterBirth(8);
    const ex = EXERCISE_BY_ID.get("back-squat")!;
    const t = modeTarget({ weight: 100, reps: 8, rir: 1, note: "" }, ex, bodyMode(profile, NOW)!, gym);
    expect(t.pct).toBe(70);
    expect(t.target.weight).toBeLessThanOrEqual(70);
    expect(t.target.rir).toBeGreaterThanOrEqual(3);
    expect(t.target.note).toContain("70");
  });

  it("keeps the usual load in the first trimester but more reps in reserve", () => {
    const ex = EXERCISE_BY_ID.get("back-squat")!;
    const t = modeTarget({ weight: 100, reps: 5, rir: 0, note: "" }, ex, bodyMode(pregnantAt(10), NOW)!, gym);
    expect(t.pct).toBeUndefined();
    expect(t.target).toMatchObject({ weight: 100, rir: 2 });
  });

  it("swaps a routine's bench press for one that fits, set by set lighter", () => {
    const profile = pregnantAt(30);
    const routine: Plan = {
      gymId: "g",
      minutes: 60,
      estMinutes: 30,
      week: blockWeek(profile, NOW),
      call: "normal",
      challenge: true,
      items: [
        {
          exerciseId: "bench-press",
          sets: 5,
          restSec: 120,
          focus: "chest",
          target: { weight: 60, reps: 5, rir: 1, note: "" },
          setTargets: [1, 2, 3, 4, 5].map(() => ({ weight: 60, reps: 5, amrap: true })),
          challenge: true,
        },
      ],
    };
    const out = injuryPass(routine, history, profile, gym, NOW);
    expect(out.items).toHaveLength(1);
    const item = out.items[0]!;
    expect(ON_BACK.has(item.exerciseId)).toBe(false);
    expect(item.sets).toBe(3);
    expect(item.setTargets).toHaveLength(3);
    expect(item.setTargets!.every((x) => !x.amrap)).toBe(true);
    expect(item.injuryPct).toBe(80);
    expect(out.challenge).toBe(false);
  });

  it("keeps avoided exercises out of swap lists", () => {
    const mode = bodyMode(pregnantAt(30), NOW);
    const list = alternatives("incline-bench-press", gym, [], [], mode);
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((e) => ON_BACK.has(e.id))).toBe(false);
  });

  it("changes nothing with the mode off", () => {
    const a = generate({ gym, profile: makeProfile({ activeGymId: "g" }), events: history, minutes: 60, now: NOW });
    expect(a.items.every((i) => i.mode === undefined)).toBe(true);
  });
});
