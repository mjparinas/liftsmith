import { describe, expect, it } from "vitest";

import { DAY, makeProfile, makeSet, makeSets, makeTestGym, NOW } from "@/test/factories";

import { EXERCISE_BY_ID, LADDER_ONLY } from "./exercises";
import {
  addLeftoverSets,
  applyCall,
  directGap,
  drawWeight,
  GAP_CAP,
  generate,
  LOADED_TWINS,
  orderRank,
  planSeconds,
  preferLoaded,
  rankMuscles,
  recentFor,
  setSeconds,
  trimToFit,
  weeklySets,
  type PlanItem,
} from "./generator";
import { t } from "./i18n";
import { recovery } from "./recovery";
import { MUSCLES, type AppEvent, type Exercise, type Muscle, type WarmupEvent } from "./types";

// The parts of the daily plan that ride on its seeded draw (mutation run round 4, 2026-11-13). Each one is
// now a plain function, so the weights, the muscle ranking, the extra sets and the trim are tested with
// fixed numbers instead of by counting what a random draw happened to pick over many days.

const gym = makeTestGym();
const ex = (id: string): Exercise => {
  const e = EXERCISE_BY_ID.get(id);
  if (!e) throw new Error(`no exercise ${id}`);
  return e;
};
const item = (exerciseId: string, over: Partial<PlanItem> = {}): PlanItem => ({
  exerciseId,
  sets: 3,
  restSec: 90,
  focus: ex(exerciseId).primary[0]!,
  target: { weight: 60, reps: 8, rir: 2, note: "" },
  ...over,
});
const all = (n: number) => Object.fromEntries(MUSCLES.map((m) => [m, n])) as Record<Muscle, number>;
const zero = () => 0;

describe("drawWeight", () => {
  it("leans to barbell compounds, then other compounds, in round one only", () => {
    expect(drawWeight(ex("bench-press"), true, gym, 1)).toBe(4);
    expect(drawWeight(ex("db-bench-press"), true, gym, 1)).toBe(3);
    expect(drawWeight(ex("barbell-curl"), true, gym, 1)).toBe(1); // a barbell, but not a compound
    expect(drawWeight(ex("bench-press"), false, gym, 1)).toBe(1);
  });

  it("halves bodyweight work in a gym with more than four kinds of equipment", () => {
    const small = { ...gym, equipment: gym.equipment.slice(0, 4) };
    const five = { ...gym, equipment: gym.equipment.slice(0, 5) };
    expect(drawWeight(ex("plank"), false, gym, 1)).toBe(0.5);
    expect(drawWeight(ex("plank"), false, five, 1)).toBe(0.5);
    expect(drawWeight(ex("plank"), false, small, 1)).toBe(1);
    expect(drawWeight(ex("push-up"), true, gym, 1)).toBe(1.5); // compound ×3, bodyweight ×0.5
    expect(drawWeight(ex("lateral-raise"), false, gym, 1)).toBe(1);
  });

  it("multiplies by the lifter's own pick weight", () => {
    expect(drawWeight(ex("bench-press"), true, gym, 0.25)).toBe(1);
    expect(drawWeight(ex("lateral-raise"), false, gym, 0.2)).toBe(0.2);
  });
});

describe("rankMuscles", () => {
  it("trains only muscles at 55% or more, or 40% or more on a split day that has them", () => {
    const rec = { ...all(100), chest: 55, quads: 54, lats: 40, biceps: 39 };
    const full = rankMuscles(rec, all(0), 10, new Set(), null, zero);
    expect(full).toContain("chest");
    expect(full).not.toContain("quads");
    expect(full).not.toContain("lats");
    const split = rankMuscles(rec, all(0), 10, new Set(), new Set<Muscle>(["lats", "biceps", "quads"]), zero);
    expect(split.sort()).toEqual(["lats", "quads"]);
  });

  it("puts big muscles ahead of arms and shoulders, then core/calves/traps/lower back, and forearms and adductors behind", () => {
    const order = rankMuscles(all(100), all(0), 10, new Set(), null, zero);
    expect(order.slice(0, 6).sort()).toEqual(["chest", "glutes", "hamstrings", "lats", "quads", "upperBack"]);
    expect(order.slice(6, 11).sort()).toEqual(["biceps", "frontDelts", "rearDelts", "sideDelts", "triceps"]);
    expect(order.slice(11, 16).sort()).toEqual(["abs", "calves", "lowerBack", "obliques", "traps"]);
    expect(order.slice(-2).sort()).toEqual(["adductors", "forearms"]);
    expect(order.indexOf("biceps")).toBeLessThan(order.indexOf("obliques"));
    expect(order.indexOf("triceps")).toBeLessThan(order.indexOf("calves"));
    expect(order.indexOf("biceps")).toBeLessThan(order.indexOf("forearms"));
  });

  it("boosts muscles that went recent sessions without direct work, capped at GAP_CAP", () => {
    const gap = { ...all(0), chest: 2, biceps: 3, triceps: 3 };
    const bigDay = new Set<Muscle>(["quads", "chest"]);
    expect(rankMuscles(all(100), all(0), 10, new Set(), bigDay, zero, gap)).toEqual(["chest", "quads"]);
    // Neglected biceps beat recently-trained quads even after recovery and weekly sets reset.
    const mix = new Set<Muscle>(["quads", "biceps"]);
    expect(rankMuscles(all(100), all(0), 10, new Set(), mix, zero, gap)).toEqual(["biceps", "quads"]);
    // The boost caps at GAP_CAP, so a huge gap never lifts a minor muscle past a fresh big muscle.
    const huge = { ...all(0), forearms: GAP_CAP + 20 };
    expect(rankMuscles(all(100), all(0), 10, new Set(), new Set<Muscle>(["chest", "forearms"]), zero, huge)).toEqual(["chest", "forearms"]);
  });

  it("ranks the muscle with more of this week's sets left first", () => {
    // Biceps has 8 of 10 sets done, triceps 2: triceps first.
    const order = rankMuscles(all(100), { ...all(0), biceps: 8, triceps: 2 }, 10, new Set(), new Set<Muscle>(["biceps", "triceps"]), zero);
    expect(order).toEqual(["triceps", "biceps"]);
    // Past the target counts as nothing left, not less than nothing: biceps at 30 of 10 ties with 10 of 10.
    const r = (doneBiceps: number) =>
      rankMuscles(
        { ...all(100), triceps: 99 },
        { ...all(0), biceps: doneBiceps, triceps: 10 },
        10,
        new Set(),
        new Set<Muscle>(["biceps", "triceps"]),
        zero,
      );
    expect(r(30)).toEqual(["biceps", "triceps"]);
    expect(r(9)).toEqual(["biceps", "triceps"]);
  });

  it("ranks the fresher muscle first when the sets left are the same", () => {
    const order = rankMuscles(
      { ...all(100), biceps: 60, triceps: 90 },
      all(0),
      10,
      new Set(),
      new Set<Muscle>(["biceps", "triceps"]),
      zero,
    );
    expect(order).toEqual(["triceps", "biceps"]);
  });

  it("puts a priority muscle ahead and gives it a third more sets to aim for", () => {
    const day = new Set<Muscle>(["biceps", "triceps"]);
    expect(rankMuscles(all(100), all(0), 10, new Set<Muscle>(["biceps"]), day, zero)[0]).toBe("biceps");
    expect(rankMuscles(all(100), all(0), 10, new Set<Muscle>(["triceps"]), day, zero)[0]).toBe("triceps");
    // With every regular set done, a priority muscle still has sets left and beats a fresher one.
    const done = { ...all(0), biceps: 10, triceps: 10 };
    expect(rankMuscles({ ...all(100), biceps: 70 }, done, 10, new Set<Muscle>(["biceps"]), day, zero)[0]).toBe("biceps");
  });

  it("adds a little noise from the seeded draw, never enough to swap clearly different muscles", () => {
    const day = new Set<Muscle>(["biceps", "triceps"]);
    // Equal scores: the draw decides, and it only ever adds.
    let k = 0;
    const seq = () => [0.9, 0.1][k++ % 2]!;
    expect(rankMuscles(all(100), all(0), 10, new Set(), day, seq)).toEqual(["biceps", "triceps"]);
    k = 1;
    expect(rankMuscles(all(100), all(0), 10, new Set(), day, seq)).toEqual(["triceps", "biceps"]);
    // A 10-point recovery gap outweighs the largest noise.
    let j = 0;
    const against = () => [0, 0.999][j++ % 2]!;
    expect(rankMuscles({ ...all(100), triceps: 90 }, all(0), 10, new Set(), day, against)).toEqual(["biceps", "triceps"]);
  });
});

describe("orderRank", () => {
  it("puts loaded compounds, bodyweight compounds, isolation work, then core and carries", () => {
    expect(orderRank(ex("back-squat"))).toBe(0);
    expect(orderRank(ex("pull-up"))).toBe(1);
    expect(orderRank(ex("barbell-curl"))).toBe(2);
    expect(orderRank(ex("plank"))).toBe(3);
    expect(orderRank(ex("farmers-carry"))).toBe(3); // a compound, but a carry
  });
});

describe("recentFor", () => {
  it("lists each muscle's exercises newest first, once each, from sets only", () => {
    const events: AppEvent[] = [
      makeSet({ exerciseId: "bench-press", at: NOW - 3 * DAY }),
      makeSet({ exerciseId: "db-bench-press", at: NOW - 2 * DAY }),
      makeSet({ exerciseId: "bench-press", at: NOW - DAY }),
      makeSet({ exerciseId: "no-such-lift", at: NOW - DAY }),
      { type: "warmup", id: "w1", at: NOW, sessionId: "s1", exerciseId: "push-up", weight: 0, reps: 5 } satisfies WarmupEvent,
    ];
    const recent = recentFor(events);
    expect(recent.get("chest")).toEqual(["bench-press", "db-bench-press"]);
    expect(recent.has("triceps")).toBe(false); // a helper muscle isn't a main one
    expect([...recent.keys()]).toEqual(["chest"]);
  });

  it("reads the very first event too", () => {
    expect(recentFor([makeSet({ exerciseId: "back-squat" })]).get("quads")).toEqual(["back-squat"]);
  });
});

describe("warm-up sets", () => {
  it("count for neither this week's sets nor recovery", () => {
    const warm: WarmupEvent = { type: "warmup", id: "w2", at: NOW, sessionId: "s1", exerciseId: "bench-press", weight: 40, reps: 5 };
    expect(weeklySets([warm], NOW - DAY).chest).toBe(0);
    expect(recovery([warm], NOW).chest).toBe(100);
  });
});

describe("addLeftoverSets", () => {
  const opts = { prio: new Set<Muscle>(), fixed: () => false, deload: false, call: "normal" as const, budget: 10_000, total: 0 };
  const extra = (i: PlanItem) => setSeconds(ex(i.exerciseId), i.target.reps) + i.restSec;

  it("adds one set to each exercise while time allows, and returns the new total", () => {
    const items = [item("bench-press"), item("barbell-curl")];
    const total = addLeftoverSets(items, opts);
    expect(items.map((i) => i.sets)).toEqual([4, 4]);
    expect(total).toBe(extra(items[0]!) + extra(items[1]!));
  });

  it("stops at five sets", () => {
    const items = [item("bench-press", { sets: 4 }), item("barbell-curl", { sets: 5 })];
    addLeftoverSets(items, opts);
    expect(items.map((i) => i.sets)).toEqual([5, 5]);
  });

  it("uses the time left exactly, and no more", () => {
    const a = item("bench-press");
    const cost = extra(a);
    const fits = [item("bench-press")];
    expect(addLeftoverSets(fits, { ...opts, budget: 1000 + cost, total: 1000 })).toBe(1000 + cost);
    expect(fits[0]!.sets).toBe(4);
    const short = [item("bench-press")];
    expect(addLeftoverSets(short, { ...opts, budget: 1000 + cost - 1, total: 1000 })).toBe(1000);
    expect(short[0]!.sets).toBe(3);
  });

  it("gives the one set there's time for to a priority muscle first", () => {
    const items = [item("bench-press"), item("barbell-curl")];
    const one = Math.max(extra(items[0]!), extra(items[1]!));
    addLeftoverSets(items, { ...opts, prio: new Set<Muscle>(["biceps"]), budget: one + 1 });
    expect(items.map((i) => i.sets)).toEqual([3, 4]);
    const plain = [item("bench-press"), item("barbell-curl")];
    addLeftoverSets(plain, { ...opts, budget: one + 1 });
    expect(plain.map((i) => i.sets)).toEqual([4, 3]);
  });

  it("adds nothing on a deload, an easy day, a lighter injured lift or a set count the lifter chose", () => {
    for (const o of [{ deload: true }, { call: "recover" as const }]) {
      const items = [item("bench-press")];
      expect(addLeftoverSets(items, { ...opts, ...o })).toBe(0);
      expect(items[0]!.sets).toBe(3);
    }
    const items = [item("bench-press", { injuryPct: 70 }), item("barbell-curl"), item("lateral-raise")];
    addLeftoverSets(items, { ...opts, fixed: (id) => id === "barbell-curl" });
    expect(items.map((i) => i.sets)).toEqual([3, 3, 4]);
    // A push day still gets them.
    const push = [item("bench-press")];
    addLeftoverSets(push, { ...opts, call: "push" });
    expect(push[0]!.sets).toBe(4);
  });
});

describe("trimToFit", () => {
  it("leaves a plan that fits alone, and doesn't change the one it was given", () => {
    const items = [item("bench-press", { sets: 5 }), item("barbell-curl", { sets: 4 })];
    expect(trimToFit(items, planSeconds(items))).toEqual(items);
    const cut = trimToFit(items, planSeconds(items) - 1);
    expect(cut.map((i) => i.sets)).toEqual([5, 3]);
    expect(items.map((i) => i.sets)).toEqual([5, 4]);
  });

  it("takes sets off the last exercise down to two, then moves to the one before", () => {
    const items = [item("bench-press", { sets: 5 }), item("barbell-curl", { sets: 4 })];
    const twoOff = trimToFit(items, planSeconds([item("bench-press", { sets: 5 }), item("barbell-curl", { sets: 2 })]));
    expect(twoOff.map((i) => i.sets)).toEqual([5, 2]);
    const more = trimToFit(items, planSeconds([item("bench-press", { sets: 4 }), item("barbell-curl", { sets: 2 })]));
    expect(more.map((i) => i.sets)).toEqual([4, 2]);
  });

  it("never goes below two sets, even when the plan still doesn't fit", () => {
    const items = [item("bench-press", { sets: 3 }), item("barbell-curl", { sets: 2 })];
    expect(trimToFit(items, 0).map((i) => i.sets)).toEqual([2, 2]);
    expect(trimToFit([], 0)).toEqual([]);
  });
});

describe("applyCall on a push day", () => {
  it("takes the first loaded compound one rep closer to failure, skipping isolation, timed and injured lifts", () => {
    const items = [
      item("barbell-curl"),
      item("farmers-carry", { target: { weight: 20, reps: 40, rir: 2, note: "" } }),
      item("back-squat", { injuryPct: 70 }),
      item("bench-press", { target: { weight: 60, reps: 8, rir: 2, note: "Same as last time" } }),
      item("db-bench-press"),
    ];
    applyCall(items, "push", false, gym);
    expect(items.map((i) => i.target.rir)).toEqual([2, 2, 2, 1, 2]);
    expect(items[3]!.target.note).toBe(`Same as last time · ${t("note.push")}`);
    expect(items.some((i) => i.challenge)).toBe(false);
  });

  it("never goes past failure, but can still make it the challenge", () => {
    const items = [item("bench-press", { target: { weight: 60, reps: 8, rir: 0, note: "x" } })];
    applyCall(items, "push", false, gym);
    expect(items[0]!.target).toEqual({ weight: 60, reps: 8, rir: 0, note: "x" });
    applyCall(items, "push", true, gym);
    expect(items[0]!.challenge).toBe(true);
    expect(items[0]!.target.note).toBe(t("note.challenge"));
  });

  it("does nothing without a compound to push, or on a normal day", () => {
    const items = [item("barbell-curl"), item("lateral-raise")];
    applyCall(items, "push", true, gym);
    expect(items.map((i) => i.target.rir)).toEqual([2, 2]);
    expect(items.some((i) => i.challenge)).toBe(false);
    const normal = [item("bench-press")];
    applyCall(normal, "normal", true, gym);
    expect(normal[0]!.target.rir).toBe(2);
    expect(normal[0]!.challenge).toBeUndefined();
  });
});

describe("directGap", () => {
  it("is 0 for every muscle with no lifting history", () => {
    expect(directGap([], NOW)).toEqual(all(0));
  });

  it("counts sessions since each muscle's last direct (primary) set, capped at GAP_CAP", () => {
    const events: AppEvent[] = [
      // Oldest of 5 sessions: trained chest (falls past GAP_CAP = 4)
      makeSet({ sessionId: "s0", exerciseId: "bench-press", at: NOW - 10 * DAY }),
      // 4 sessions ago (index 3): trained biceps
      makeSet({ sessionId: "s1", exerciseId: "barbell-curl", at: NOW - 8 * DAY }),
      // 3 sessions ago (index 2): trained quads + glutes
      makeSet({ sessionId: "s2", exerciseId: "back-squat", at: NOW - 6 * DAY }),
      // 2 sessions ago (index 1): trained upperBack + lats (biceps is only secondary)
      makeSet({ sessionId: "s3", exerciseId: "barbell-row", at: NOW - 4 * DAY }),
      // Most recent (index 0): trained hamstrings + glutes
      makeSet({ sessionId: "s4", exerciseId: "romanian-deadlift", at: NOW - 2 * DAY }),
      // Ignored: rehab part, cardio, warm-up, and future set
      makeSet({ sessionId: "s5", exerciseId: "triceps-pushdown", at: NOW - DAY, partId: "rehab" }),
      makeSet({ sessionId: "s6", exerciseId: "cable-pushdown", at: NOW - DAY, partId: "rehab" }),
      makeSet({ sessionId: "s7", exerciseId: "treadmill-run", at: NOW - DAY }),
      makeSet({ sessionId: "s8", exerciseId: "bench-press", at: NOW + DAY }),
      {
        type: "warmup",
        id: "w-gap",
        at: NOW - DAY,
        sessionId: "s9",
        exerciseId: "bench-press",
        weight: 20,
        reps: 10,
      } satisfies WarmupEvent,
    ];
    const gap = directGap(events, NOW);
    expect(gap.hamstrings).toBe(0);
    expect(gap.glutes).toBe(0);
    expect(gap.upperBack).toBe(1);
    expect(gap.lats).toBe(1);
    expect(gap.quads).toBe(2);
    expect(gap.biceps).toBe(3); // secondary work on barbell-row does not reset direct gap
    expect(gap.chest).toBe(GAP_CAP); // s0 is older than the last GAP_CAP sessions
    expect(gap.triceps).toBe(GAP_CAP); // rehab set ignored
  });
});

describe("the whole plan", () => {
  const profile = makeProfile();
  const days = Array.from({ length: 14 }, (_, d) => NOW + d * DAY);

  it("never plans the same exercise twice", () => {
    for (const now of days)
      for (const minutes of [45, 90]) {
        const ids = generate({ gym, profile, events: [], minutes, now }).items.map((i) => i.exerciseId);
        expect(new Set(ids).size).toBe(ids.length);
      }
  });

  it("adds second exercises for a muscle once every ranked muscle has one", () => {
    const plan = generate({ gym, profile, events: [], minutes: 90, now: NOW, muscles: ["chest"] });
    expect(plan.items.length).toBeGreaterThan(1);
    expect(plan.items.every((i) => i.focus === "chest")).toBe(true);
  });

  it("on a split day takes only exercises whose main muscles are all in it", () => {
    // A back squat works quads and glutes, so a quads-only day leaves it out.
    for (const now of days) {
      const plan = generate({ gym, profile, events: [], minutes: 60, now, muscles: ["quads"] });
      for (const i of plan.items) expect(ex(i.exerciseId).primary).toEqual(["quads"]);
    }
  });

  it("never plans cardio or ladder-only steps", () => {
    for (const now of days)
      for (const plan of [
        generate({ gym, profile, events: [], minutes: 90, now }),
        generate({ gym, profile, events: [], minutes: 60, now, muscles: ["abs", "obliques"] }),
      ])
        for (const i of plan.items) {
          expect(ex(i.exerciseId).pattern).not.toBe("cardio");
          expect(LADDER_ONLY.has(i.exerciseId)).toBe(false);
        }
  });

  it("only makes a challenge on a push day that asked for one", () => {
    for (const now of days.slice(0, 5)) {
      expect(generate({ gym, profile, events: [], minutes: 45, now, call: "push" }).challenge).toBe(false);
      expect(generate({ gym, profile, events: [], minutes: 45, now, call: "push", challenge: true }).challenge).toBe(true);
    }
  });

  it("leaves out a muscle under 55%, even with an hour and a half to fill", () => {
    const tired = makeSets(6, { exerciseId: "back-squat", at: NOW - 16 * 3600_000 });
    expect(recovery(tired, NOW).quads).toBe(53);
    expect(generate({ gym, profile, events: tired, minutes: 90, now: NOW }).items.map((i) => i.focus)).not.toContain("quads");
  });

  it("includes direct chest, biceps and triceps work across several spaced-out workouts", () => {
    for (const [minutes, gapDays, sessions] of [
      [45, 2, 4],
      [45, 3, 5],
      [30, 2, 5],
    ] as const) {
      const seen = new Set<Muscle>();
      const evs: AppEvent[] = [];
      for (let i = 0; i < sessions; i++) {
        const now = NOW + i * gapDays * DAY;
        const plan = generate({ gym, profile: makeProfile({ minutes }), events: evs, minutes, now });
        const sessionId = `sim-${minutes}-${gapDays}-${i}`;
        for (const it of plan.items) {
          for (const m of ex(it.exerciseId).primary) seen.add(m);
          evs.push(...makeSets(it.sets, { sessionId, exerciseId: it.exerciseId, at: now + 60_000 }));
        }
      }
      expect(seen.has("chest"), `${minutes}m every ${gapDays}d should train chest`).toBe(true);
      expect(seen.has("biceps"), `${minutes}m every ${gapDays}d should train biceps`).toBe(true);
      expect(seen.has("triceps"), `${minutes}m every ${gapDays}d should train triceps`).toBe(true);
    }
  });
});

describe("preferLoaded", () => {
  const none = () => false;
  const ids = (list: ReturnType<typeof preferLoaded>) => list.map((e) => e.id);

  it("knows the loaded versions of bodyweight moves", () => {
    expect(LOADED_TWINS.get("reverse-lunge")).toEqual(["db-reverse-lunge", "barbell-reverse-lunge"]);
    expect(LOADED_TWINS.get("step-up")).toContain("db-step-up");
    for (const [id, twins] of LOADED_TWINS) {
      expect(ex(id).load).toBe("bodyweight");
      for (const twin of twins) {
        expect(ex(twin).load).not.toBe("bodyweight");
        expect(ex(twin).pattern).toBe(ex(id).pattern);
      }
    }
  });

  it("drops a bodyweight move when its loaded version is on offer", () => {
    expect(ids(preferLoaded([ex("reverse-lunge"), ex("db-reverse-lunge"), ex("back-squat")], none))).toEqual([
      "db-reverse-lunge",
      "back-squat",
    ]);
  });

  it("keeps it when no loaded version is on offer, the lifter keeps it, or never beside its loaded version", () => {
    expect(ids(preferLoaded([ex("reverse-lunge"), ex("back-squat")], none))).toEqual(["reverse-lunge", "back-squat"]);
    expect(ids(preferLoaded([ex("reverse-lunge"), ex("db-reverse-lunge")], (id) => id === "reverse-lunge"))).toEqual([
      "reverse-lunge",
      "db-reverse-lunge",
    ]);
    expect(ids(preferLoaded([ex("reverse-lunge")], none, new Set(["db-reverse-lunge"])))).toEqual([]);
  });

  it("a dumbbell gym never plans a bodyweight move that has a dumbbell version", () => {
    const dbGym = makeTestGym("dumbbells");
    const profile = makeProfile();
    for (let d = 0; d < 28; d++)
      for (const muscles of [undefined, ["quads", "glutes"] as const]) {
        const plan = generate({ gym: dbGym, profile, events: [], minutes: 60, now: NOW + d * DAY, muscles: muscles && [...muscles] });
        for (const i of plan.items) {
          const twins = LOADED_TWINS.get(i.exerciseId) ?? [];
          expect(twins.filter((id) => id.startsWith("db-"))).toEqual([]);
        }
      }
  });
});
