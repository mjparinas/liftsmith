import { describe, expect, it } from "vitest";

import { DAY, makeProfile, makeSets, makeTestGym, NOW } from "@/test/factories";

import { blockWeek } from "./block";
import { englishName, EXERCISE_BY_ID, LADDER_ONLY } from "./exercises";
import { alternatives, generate, injuryPass, planSeconds, type Plan, type PlanItem } from "./generator";
import { t } from "./i18n";
import { activeInjuries, affects, effectFor } from "./injury";
import { recovery } from "./recovery";
import { BODY_PARTS, type AppEvent, type BodyPart, type Exercise, type Muscle } from "./types";

// The rules inside the daily plan that generator.test.ts didn't pin (mutation run round 3, 2026-11-13):
// split days and fatigued muscles, priorities and favourites, the 4-set first lifts, extra sets from
// leftover time and the trim back to the minutes asked for, injuries on a fixed plan, and how swaps
// are ranked.

const gym = makeTestGym();
const profile = makeProfile();
const ex = (id: string): Exercise => {
  const e = EXERCISE_BY_ID.get(id);
  if (!e) throw new Error(`no exercise ${id}`);
  return e;
};
const primaries = (p: Plan) => p.items.flatMap((i) => ex(i.exerciseId).primary);
const rank = (id: string) => {
  const e = ex(id);
  return e.pattern === "core" || e.pattern === "carry" ? 3 : e.compound ? (e.load === "bodyweight" ? 1 : 0) : 2;
};

let n = 0;
const hurt = (part: BodyPart, injuryId: string): AppEvent => ({ type: "injury", id: `inj${n++}`, at: NOW - DAY, injuryId, part });
const rule = (injuryId: string, action: "skip" | "light", pct?: number, exerciseId?: string): AppEvent => ({
  type: "injuryRule",
  id: `rule${n++}`,
  at: NOW - DAY + 1000,
  injuryId,
  action,
  pct,
  exerciseId,
  ack: true,
});

describe("split days and tired muscles", () => {
  const push: Muscle[] = ["chest", "triceps", "frontDelts"];

  it("a split day plans only its muscles, with exercises whose main muscles are all in it", () => {
    const plan = generate({ gym, profile, events: [], minutes: 45, now: NOW, muscles: push });
    expect(plan.items.length).toBeGreaterThan(1);
    for (const i of plan.items) {
      expect(push).toContain(i.focus);
      expect(ex(i.exerciseId).primary.every((m) => push.includes(m))).toBe(true);
    }
  });

  it("leaves out a muscle trained to exhaustion two hours ago, even on its split day", () => {
    const chest = makeSets(10, { exerciseId: "bench-press", at: NOW - 2 * 3600_000 });
    expect(recovery(chest, NOW).chest).toBeLessThan(40);
    const split = generate({ gym, profile, events: chest, minutes: 60, now: NOW, muscles: push });
    expect(split.items.length).toBeGreaterThan(0);
    expect(primaries(split)).not.toContain("chest");
    const full = generate({ gym, profile, events: chest, minutes: 90, now: NOW });
    expect(primaries(full)).not.toContain("chest");
  });

  it("never picks an exercise whose other main muscle is the tired one", () => {
    // Close-grip pressing works chest and triceps; with triceps spent, chest gets chest-only presses.
    const triceps = makeSets(10, { exerciseId: "skull-crusher", at: NOW - 2 * 3600_000 });
    const rec = recovery(triceps, NOW);
    expect(rec.triceps).toBeLessThan(40);
    for (let h = 0; h < 3; h++) {
      const plan = generate({ gym, profile, events: triceps, minutes: 60, now: NOW + h * DAY, muscles: push });
      expect(plan.items.length).toBeGreaterThan(0);
      for (const i of plan.items) expect(ex(i.exerciseId).primary.every((m) => recovery(triceps, NOW + h * DAY)[m] >= 40)).toBe(true);
    }
  });
});

describe("the lifter's priorities, favourites and variety", () => {
  it("a priority muscle makes a short plan it wouldn't otherwise", () => {
    const plain = generate({ gym, profile, events: [], minutes: 20, now: NOW });
    expect(plain.items.map((i) => i.focus)).not.toContain("calves");
    const prio = generate({ gym, profile: makeProfile({ training: { priorities: ["calves"] } }), events: [], minutes: 20, now: NOW });
    expect(prio.items.map((i) => i.focus)).toContain("calves");
  });

  it("sorts the plan after picking, so a priority core muscle still comes last", () => {
    const p = makeProfile({ training: { priorities: ["abs"] } });
    const plan = generate({ gym, profile: p, events: [], minutes: 45, now: NOW, muscles: ["abs", "obliques", "chest"] });
    const ranks = plan.items.map((i) => rank(i.exerciseId));
    expect(ranks).toContain(3);
    expect(ranks).toContain(0);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it("picks a favourite on most days its muscle is trained (pickWeights.ts)", () => {
    const p = makeProfile({ training: { favourites: ["front-squat"] } });
    let quads = 0;
    let fav = 0;
    for (let d = 0; d < 20; d++) {
      const plan = generate({ gym, profile: p, events: [], minutes: 45, now: NOW + d * DAY });
      const q = plan.items.filter((x) => x.focus === "quads");
      quads += Number(q.length > 0);
      fav += Number(q.some((i) => i.exerciseId === "front-squat"));
    }
    expect(quads).toBeGreaterThan(0);
    expect(fav / quads).toBeGreaterThan(0.6);
  });

  it("a consistent lifter keeps last time's exercises more often than a lifter who likes variety", () => {
    const kept = (variability: "consistent" | "variable") => {
      let same = 0;
      for (let d = 0; d < 12; d++) {
        const now = NOW + d * 7 * DAY;
        const p = makeProfile({ variability });
        const last = generate({ gym, profile: p, events: [], minutes: 45, now: now - 4 * DAY });
        // Last time's workout, four days ago, so every muscle has recovered.
        const events = last.items.flatMap((i, k) => makeSets(2, { exerciseId: i.exerciseId, at: now - 4 * DAY + k * 600_000 }));
        const today = generate({ gym, profile: p, events, minutes: 45, now });
        const before = new Set(last.items.map((i) => i.exerciseId));
        same += today.items.filter((i) => before.has(i.exerciseId)).length;
      }
      return same;
    };
    expect(kept("consistent")).toBeGreaterThan(kept("variable"));
  });
});

describe("set counts", () => {
  it("gives the first two compound lifts a fourth set from 45 minutes", () => {
    // On an easy day there are no extra sets from leftover time, so the counts show the base: 4 − 1 and 3 − 1.
    const at45 = generate({ gym, profile, events: [], minutes: 45, now: NOW, call: "recover" });
    expect(at45.items.slice(0, 2).map((i) => i.sets)).toEqual([3, 3]);
    expect(at45.items.slice(2).every((i) => i.sets === 2)).toBe(true);
    const at44 = generate({ gym, profile, events: [], minutes: 44, now: NOW, call: "recover" });
    expect(at44.items.every((i) => i.sets === 2)).toBe(true);
  });

  it("adds sets from leftover time, at most five, never on an easy day or a deload", () => {
    const plain = generate({ gym, profile, events: [], minutes: 90, now: NOW });
    const sum = (p: Plan) => p.items.reduce((s, i) => s + i.sets, 0);
    expect(plain.items.some((i) => i.sets > 3)).toBe(true);
    const split = generate({ gym, profile, events: [], minutes: 90, now: NOW, muscles: ["chest", "triceps", "frontDelts"] });
    expect(split.items.some((i) => i.sets === 5)).toBe(true);
    expect(split.items.every((i) => i.sets <= 5)).toBe(true);
    const easy = generate({ gym, profile, events: [], minutes: 90, now: NOW, call: "recover" });
    expect(easy.items.every((i) => i.sets <= 3)).toBe(true);
    expect(sum(easy)).toBeLessThan(sum(plain));
    const build = Math.min(6, Math.max(3, profile.blockWeeks));
    const deload = makeProfile({ blockStart: NOW - build * 7 * DAY - DAY });
    expect(blockWeek(deload, NOW).deload).toBe(true);
    const light = generate({ gym, profile: deload, events: [], minutes: 90, now: NOW });
    expect(light.items.every((i) => i.sets <= 3)).toBe(true);
  });

  it("keeps the set count the lifter chose, for every exercise or for one", () => {
    const three = generate({ gym, profile: makeProfile({ training: { sets: 3 } }), events: [], minutes: 90, now: NOW });
    expect(three.items.length).toBeGreaterThan(2);
    expect(three.items.every((i) => i.sets === 3)).toBe(true);
    const plain = generate({ gym, profile, events: [], minutes: 90, now: NOW });
    const first = plain.items[0]!.exerciseId;
    const one = generate({
      gym,
      profile: makeProfile({ training: { exercises: { [first]: { sets: 2 } } } }),
      events: [],
      minutes: 90,
      now: NOW,
    });
    expect(one.items.find((i) => i.exerciseId === first)?.sets).toBe(2);
  });

  it("an exercise kept lighter for an injury gets no extra sets", () => {
    const evs = [hurt("chest", "c"), rule("c", "light", 70)];
    const plan = generate({ gym, profile, events: evs, minutes: 90, now: NOW });
    const lit = plan.items.filter((i) => i.injuryPct);
    expect(lit.length).toBeGreaterThan(0);
    expect(lit.every((i) => i.sets <= 4 && i.injuryPct === 70)).toBe(true);
  });

  it("trims sets off the end when the final warm-ups tip a short plan over its time", () => {
    // Day 15 at 20 minutes is a plan whose warm-ups, worked out again after sorting, ran over (found by a scan).
    for (const d of [15, 19])
      for (const minutes of [15, 20]) {
        const plan = generate({ gym, profile, events: [], minutes, now: NOW + d * DAY });
        expect(plan.items.every((i) => i.sets >= 2)).toBe(true);
        if (plan.items.some((i) => i.sets > 2)) expect(planSeconds(plan.items)).toBeLessThanOrEqual(minutes * 60);
        expect(plan.estMinutes).toBe(Math.round(planSeconds(plan.items) / 60));
      }
    for (let d = 0; d < 30; d++) {
      const plan = generate({ gym, profile, events: [], minutes: 20, now: NOW + d * DAY });
      if (plan.items.some((i) => i.sets > 2)) expect(planSeconds(plan.items)).toBeLessThanOrEqual(20 * 60);
    }
  });

  it("leaves short plans with room for at least one exercise and never past the time", () => {
    for (const minutes of [10, 12, 15]) {
      const plan = generate({ gym, profile, events: [], minutes, now: NOW });
      expect(plan.items.length).toBeGreaterThan(0);
      expect(plan.items.length).toBeLessThanOrEqual(2);
    }
  });
});

describe("the day's call with an injury", () => {
  const evs = [hurt("chest", "c"), rule("c", "light", 70)];

  it("never pushes or challenges a lift kept lighter, and takes the next compound instead", () => {
    const plan = generate({ gym, profile, events: evs, minutes: 60, now: NOW, call: "push", challenge: true });
    for (const i of plan.items.filter((x) => x.injuryPct)) {
      expect(i.challenge).toBeFalsy();
      expect(i.target.note).toBe(t("note.injury", { pct: 70 }));
    }
    const first = plan.items.find((i) => ex(i.exerciseId).compound && !i.injuryPct)!;
    expect(first.challenge).toBe(true);
    expect(plan.challenge).toBe(true);
  });

  it("on an easy day an injured lift loses a set but no more load", () => {
    // The first day whose plan has a lift kept lighter (which lifts come up depends on the day's draw).
    const day = Array.from({ length: 14 }, (_, d) => NOW + d * DAY).find((now) =>
      generate({ gym, profile, events: evs, minutes: 60, now, call: "recover" }).items.some((i) => i.injuryPct),
    )!;
    const normal = generate({ gym, profile, events: evs, minutes: 60, now: day });
    const easy = generate({ gym, profile, events: evs, minutes: 60, now: day, call: "recover" });
    const lit = easy.items.find((i) => i.injuryPct)!;
    const before = normal.items.find((i) => i.exerciseId === lit.exerciseId)!;
    expect(lit.target.weight).toBe(before.target.weight);
    expect(lit.target.note).toBe(t("note.injury", { pct: 70 }));
    expect(lit.sets).toBe(Math.max(2, before.sets - 1));
  });
});

describe("injuries on a plan built elsewhere", () => {
  const week = blockWeek(profile, NOW);
  const item = (exerciseId: string, over: Partial<PlanItem> = {}): PlanItem => ({
    exerciseId,
    sets: 5,
    restSec: 180,
    focus: ex(exerciseId).primary[0]!,
    target: { weight: 100, reps: 5, rir: 2, note: "program note" },
    warmup: [{ weight: 20, reps: 10 }],
    ...over,
  });
  const plan = (items: PlanItem[]): Plan => ({
    gymId: gym.id,
    minutes: 60,
    estMinutes: 60,
    week,
    call: "normal",
    challenge: items.some((i) => i.challenge),
    items,
  });

  it("leaves a plan alone without an active injury", () => {
    const p = plan([item("back-squat")]);
    expect(injuryPass(p, [], profile, gym, NOW)).toBe(p);
  });

  it("swaps a skipped lift for one the injury spares, keeping its sets, reps, note and program slot", () => {
    const p = plan([
      item("back-squat", {
        slot: "squat",
        setTargets: [
          { weight: 100, reps: 5 },
          { weight: 100, reps: 5, amrap: true },
        ],
      }),
      item("leg-press"),
    ]);
    const evs = [hurt("knee", "k")];
    const out = injuryPass(p, evs, profile, gym, NOW);
    const swapped = out.items.find((i) => i.slot === "squat")!;
    expect(swapped.exerciseId).not.toBe("back-squat");
    expect(swapped.exerciseId).not.toBe("leg-press");
    expect(LADDER_ONLY.has(swapped.exerciseId)).toBe(false);
    expect(affects("knee", ex(swapped.exerciseId))).toBe(false);
    expect(swapped.sets).toBe(5);
    expect(swapped.target.reps).toBe(5);
    expect(swapped.target.note).toBe("program note");
    expect(swapped.warmup).toBeUndefined();
    // Every set takes the new exercise's own weight; the amrap set stays amrap.
    expect(swapped.setTargets).toEqual([
      { weight: swapped.target.weight, reps: 5 },
      { weight: swapped.target.weight, reps: 5, amrap: true },
    ]);
  });

  it("drops a skipped lift with nothing left to swap to", () => {
    const everything = BODY_PARTS.map((part, k) => hurt(part, `p${k}`));
    const out = injuryPass(plan([item("back-squat"), item("bench-press")]), everything, profile, gym, NOW);
    expect(out.items).toEqual([]);
    expect(out.challenge).toBe(false);
  });

  it("keeps a lighter lift at the share chosen, set by set, without warm-ups, amrap or a challenge", () => {
    const p = plan([
      item("bench-press", {
        challenge: true,
        setTargets: [
          { weight: 100, reps: 5 },
          { weight: 90, reps: 8, amrap: true },
        ],
      }),
      item("back-squat", { challenge: true }),
    ]);
    expect(p.challenge).toBe(true);
    const out = injuryPass(p, [hurt("chest", "c"), rule("c", "light", 50)], profile, gym, NOW);
    const bench = out.items[0]!;
    expect(bench.injuryPct).toBe(50);
    expect(bench.target.weight).toBeLessThanOrEqual(50);
    expect(bench.target.weight).toBeGreaterThan(40);
    expect(bench.target.note).toBe(t("note.injury", { pct: 50 }));
    expect(bench.warmup).toBeUndefined();
    expect(bench.challenge).toBeUndefined();
    expect(bench.setTargets!.map((s) => s.reps)).toEqual([5, 8]);
    expect(bench.setTargets!.every((s) => s.amrap === undefined)).toBe(true);
    expect(bench.setTargets![0]!.weight).toBeLessThanOrEqual(50);
    expect(bench.setTargets![1]!.weight).toBeLessThanOrEqual(45);
    expect(bench.setTargets![1]!.weight).toBeLessThan(bench.setTargets![0]!.weight);
    // The squat isn't touched by a chest injury, so it keeps its challenge, and so does the plan.
    expect(out.items[1]).toEqual(p.items[1]);
    expect(out.challenge).toBe(true);
  });
});

describe("how swaps are ranked", () => {
  // 3 points per shared main muscle, 1 per shared helper, 2 for the same movement, 1 for the same kind (compound or not).
  const score = (from: Exercise, e: Exercise) =>
    e.primary.filter((m) => from.primary.includes(m)).length * 3 +
    e.secondary.filter((m) => from.secondary.includes(m)).length +
    (e.pattern === from.pattern ? 2 : 0) +
    (e.compound === from.compound ? 1 : 0);

  it("puts the closest match first and breaks ties by name", () => {
    for (const id of ["bench-press", "back-squat", "barbell-row", "db-curl"]) {
      const from = ex(id);
      const alts = alternatives(id, gym);
      expect(alts.length).toBeGreaterThan(3);
      for (let k = 1; k < alts.length; k++) {
        const a = score(from, alts[k - 1]!);
        const b = score(from, alts[k]!);
        expect(a).toBeGreaterThanOrEqual(b);
        if (a === b) expect(englishName(alts[k - 1]!).localeCompare(englishName(alts[k]!))).toBeLessThanOrEqual(0);
      }
    }
  });

  it("includes exercises sharing any main muscle, not only all of them", () => {
    const alts = alternatives("bench-press", gym);
    expect(alts.some((e) => e.primary.length > 1)).toBe(true);
    expect(alts.some((e) => e.primary.some((m) => !ex("bench-press").primary.includes(m)))).toBe(true);
  });

  it("with an injury, lists exercises it doesn't touch before ones it keeps lighter", () => {
    const active = activeInjuries([hurt("shoulder", "s"), rule("s", "light", 70)], NOW);
    const alts = alternatives("bench-press", gym, [], active);
    const touched = alts.map((e) => effectFor(e, active) !== null);
    expect(touched).toContain(true);
    expect(touched).toContain(false);
    expect(touched.indexOf(true)).toBeGreaterThan(touched.lastIndexOf(false));
    // Without an injury the same list mixes them.
    const plain = alternatives("bench-press", gym).map((e) => effectFor(e, active) !== null);
    expect(plain.indexOf(true)).toBeLessThan(plain.lastIndexOf(false));
  });
});
