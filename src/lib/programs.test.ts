import { describe, expect, it } from "vitest";
import { defaultProfile, makeGym } from "./defaults";
import { available, exercise, LADDER_ONLY } from "./exercises";
import { generate, type Plan } from "./generator";
import { loadBar } from "./plates";
import { barFor } from "./loads";
import { missingFor, pickProgram, programPlan, PROGRAMS, SPLITS, weeklyPreview, type Ctx, type ProgramId } from "./programs";
import type { AppEvent, Gym, PlanSource, Profile, SetEvent } from "./types";
import { fromKg, toKg } from "./units";

// Built-in programs (Melvin, 2026-11-09): each one's real progression rules, replayed from the
// logged sets, with descriptive names and credit to the originals.

const NOW = new Date("2026-11-11T18:00:00").getTime();
const D = 24 * 3600_000;
const profile: Profile = { ...defaultProfile(NOW - 30 * D), onboarded: true, bodyweight: 80, experience: "intermediate", sex: "male" };
const kgGym = makeGym("commercial", "kg", "g1");
const lbGym = makeGym("commercial", "lb", "g2");
const homeGym: Gym = { ...makeGym("bodyweight", "kg", "g3"), equipment: ["pullupBar"] };

type Src = Extract<PlanSource, { kind: "program" }>;

let n = 0;
/** Plays one session of the plan: `reps` decides what was logged for each set (default: the target). */
function play(events: AppEvent[], plan: Plan, at: number, reps: (slot: string, i: number, target: number, amrap: boolean) => number = (_s, _i, t) => t, weight?: (slot: string, w: number) => number): AppEvent[] {
  const sid = `s${n++}`;
  const out: AppEvent[] = [...events, { type: "sessionStart", id: `st${sid}`, at, sessionId: sid, gymId: plan.gymId, minutes: plan.minutes, program: plan.program && { id: plan.program.id, day: plan.program.day } }];
  let t = at;
  for (const it of plan.items) {
    (it.setTargets ?? Array.from({ length: it.sets }, () => ({ weight: it.target.weight, reps: it.target.reps, amrap: undefined }))).forEach((st, i) => {
      t += 1000;
      const w = weight ? weight(it.slot ?? it.exerciseId, st.weight) : st.weight;
      const ev: SetEvent = { type: "set", id: `x${n++}`, at: t, sessionId: sid, exerciseId: it.exerciseId, weight: w, reps: reps(it.slot ?? it.exerciseId, i, st.reps, !!st.amrap), targetReps: st.reps, targetWeight: st.weight, rir: 2, amrap: st.amrap, slot: it.slot };
      out.push(ev);
    });
  }
  return out;
}

function run(id: ProgramId, sessions: number, opts: { gym?: Gym; reps?: Parameters<typeof play>[3]; weight?: Parameters<typeof play>[4]; prof?: Profile } = {}) {
  const gym = opts.gym ?? kgGym;
  const prof = opts.prof ?? profile;
  const ctx: Ctx = { profile: prof, gym, events: [], now: NOW - 60 * D };
  const src = pickProgram(id, ctx) as Src;
  let events: AppEvent[] = [];
  const plans: Plan[] = [];
  for (let i = 0; i < sessions; i++) {
    const at = NOW - 60 * D + (i + 1) * 2 * D;
    const plan = programPlan({ src, profile: prof, gym, events, now: at })!;
    plans.push(plan);
    events = play(events, plan, at, opts.reps, opts.weight);
  }
  const next = programPlan({ src, profile: prof, gym, events, now: NOW })!;
  return { src, plans, next, events };
}

const item = (p: Plan, slot: string) => p.items.find((i) => i.slot === slot)!;
const top = (p: Plan, slot: string) => Math.max(...item(p, slot).setTargets!.map((s) => s.weight));

describe("program list", () => {
  it("has every program Melvin asked for, with a credit and plain steps", () => {
    expect(PROGRAMS.map((p) => p.id)).toEqual(["classic-5x5", "novice-3x5", "5x5-plus", "ramping-5x5", "tiered", "waves", "calisthenics", "ppl", "upper-lower"]);
    for (const p of PROGRAMS) {
      expect(p.basedOn.length).toBeGreaterThan(10);
      expect(p.how.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("never uses a trademarked program name as the name", () => {
    for (const p of PROGRAMS) expect(p.name).not.toMatch(/starting strength|5\/3\/1|stronglifts|madcow|gzcl|ice cream/i);
  });

  it("makes the fixed programs free and the adaptive splits Pro", () => {
    for (const p of PROGRAMS) expect(p.tier).toBe(p.kind === "split" ? "pro" : "free");
  });

  it("tells you what a gym is missing for the main lifts", () => {
    expect(missingFor("classic-5x5", kgGym)).toEqual([]);
    expect(missingFor("classic-5x5", homeGym)).toEqual(["barbell", "rack", "bench"]);
    expect(missingFor("calisthenics", homeGym)).toEqual([]);
  });
});

describe("classic 5×5", () => {
  it("alternates A and B and adds 2.5 kg a session, 5 kg on the deadlift", () => {
    const { plans, next } = run("classic-5x5", 4);
    expect(plans.map((p) => p.program!.dayName)).toEqual(["Workout A", "Workout B", "Workout A", "Workout B"]);
    expect(plans[0].items.map((i) => i.exerciseId)).toEqual(["back-squat", "bench-press", "barbell-row"]);
    expect(plans[1].items.map((i) => i.exerciseId)).toEqual(["back-squat", "overhead-press", "deadlift"]);
    expect(item(plans[0], "back-squat").setTargets).toHaveLength(5);
    expect(item(plans[1], "deadlift").setTargets).toHaveLength(1);
    const sq = plans.map((p) => top(p, "back-squat"));
    expect(sq[1] - sq[0]).toBeCloseTo(2.5);
    expect(sq[3] - sq[0]).toBeCloseTo(7.5);
    expect(top(plans[3], "deadlift") - top(plans[1], "deadlift")).toBeCloseTo(5);
    expect(top(next, "bench-press") - top(plans[0], "bench-press")).toBeCloseTo(5);
  });

  it("keeps the weight after a miss, and drops 10% after three misses in a row", () => {
    const { plans, next } = run("classic-5x5", 4, { reps: (slot, i, t) => (slot === "back-squat" && i === 4 ? t - 2 : t) });
    const sq = plans.map((p) => top(p, "back-squat"));
    expect(sq[1]).toBe(sq[0]);
    expect(sq[2]).toBe(sq[0]);
    expect(plans[2].items[0].target.note).toMatch(/2 of 3 misses/);
    // 10% lighter, to the nearest weight the plates make.
    expect(Math.abs(sq[3] - sq[0] * 0.9)).toBeLessThanOrEqual(1.25);
    expect(top(next, "back-squat")).toBe(sq[3]);
  });

  it("builds on what was lifted when the lifter changes the weight", () => {
    const { plans } = run("classic-5x5", 2, { weight: (slot, w) => (slot === "back-squat" ? w + 10 : w) });
    expect(top(plans[1], "back-squat")).toBeCloseTo(top(plans[0], "back-squat") + 12.5);
  });

  it("jumps 5 lb in a pound gym and every weight is loadable", () => {
    const { plans } = run("classic-5x5", 3, { gym: lbGym });
    const lb = plans.map((p) => fromKg(top(p, "back-squat"), "lb"));
    expect(lb[1] - lb[0]).toBeCloseTo(5);
    for (const p of plans)
      for (const it of p.items) {
        const ex = exercise(it.exerciseId);
        for (const st of it.setTargets!) {
          const l = loadBar(fromKg(st.weight, "lb"), barFor(ex, lbGym).weight, lbGym.plates);
          expect(l.total).toBeCloseTo(fromKg(st.weight, "lb"));
        }
      }
  });

  it("freezes the starting weights when it's picked", () => {
    const { src } = run("classic-5x5", 0);
    const heavier = { ...profile, bodyweight: 120 };
    const a = programPlan({ src, profile, gym: kgGym, events: [], now: NOW })!;
    const b = programPlan({ src, profile: heavier, gym: kgGym, events: [], now: NOW })!;
    expect(top(b, "back-squat")).toBe(top(a, "back-squat"));
  });

  it("starts from the lifter's own logged sets when there are some", () => {
    const history: AppEvent[] = [{ type: "set", id: "h", at: NOW - 70 * D, sessionId: "h", exerciseId: "back-squat", weight: 140, reps: 5, targetReps: 5, rir: 1 }];
    const src = pickProgram("classic-5x5", { profile, gym: kgGym, events: history, now: NOW }) as Src;
    // e1RM 168 kg; sets of 5 with 3 reps in reserve is about 133 kg.
    expect(src.start["back-squat"]).toBeGreaterThan(128);
    expect(src.start["back-squat"]).toBeLessThan(137);
  });

  it("adds warm-ups and a time estimate", () => {
    const { plans } = run("classic-5x5", 1);
    expect(plans[0].items[0].warmup?.length).toBeGreaterThan(0);
    expect(plans[0].estMinutes).toBeGreaterThan(30);
  });
});

describe("novice 3×5", () => {
  it("squats every session, adds 5 kg to squats, and brings in power cleans on B after six sessions", () => {
    const { plans } = run("novice-3x5", 8);
    for (const p of plans) expect(p.items[0].exerciseId).toBe("back-squat");
    expect(top(plans[1], "back-squat") - top(plans[0], "back-squat")).toBeCloseTo(5);
    expect(top(plans[2], "bench-press") - top(plans[0], "bench-press")).toBeCloseTo(2.5);
    expect(plans[5].items.map((i) => i.exerciseId)).toContain("deadlift");
    expect(plans[7].items.map((i) => i.exerciseId)).toContain("power-clean");
    expect(item(plans[7], "power-clean").scheme).toBe("5 × 3");
  });
});

describe("5×5 plus arms", () => {
  it("adds the accessories, and swaps one the gym can't do for the closest match", () => {
    const noCable: Gym = { ...kgGym, equipment: kgGym.equipment.filter((e) => e !== "cable") };
    const { plans } = run("5x5-plus", 3, { gym: noCable });
    expect(plans[0].items.map((i) => i.exerciseId)).toEqual(["back-squat", "bench-press", "barbell-row", "barbell-shrug", "skull-crusher", "barbell-curl"]);
    const crunch = item(plans[1], "cable-crunch");
    expect(crunch.exerciseId).not.toBe("cable-crunch");
    expect(crunch.target.note).toMatch(/In place of Cable crunch/);
    // Curls are on both days; with 2.5 kg the smallest plate the bar moves 5 kg every other session.
    expect(item(plans[2], "barbell-curl").setTargets![0].weight).toBeGreaterThan(item(plans[0], "barbell-curl").setTargets![0].weight);
  });
});

describe("ramping 5×5", () => {
  it("ramps to the top set, triples 2.5% above it, and starts next week from the triple", () => {
    const { plans, next } = run("ramping-5x5", 3);
    const mon = item(plans[0], "back-squat").setTargets!;
    expect(mon.map((s) => s.reps)).toEqual([5, 5, 5, 5, 5]);
    expect(mon[0].weight).toBeLessThan(mon[4].weight * 0.6);
    const wed = item(plans[1], "back-squat").setTargets!;
    expect(wed).toHaveLength(4);
    expect(Math.max(...wed.map((s) => s.weight))).toBeLessThan(mon[4].weight);
    expect(plans[1].items.map((i) => i.exerciseId)).toEqual(["back-squat", "overhead-press", "deadlift"]);
    const fri = item(plans[2], "back-squat").setTargets!;
    expect(fri.map((s) => s.reps)).toEqual([5, 5, 5, 5, 3, 8]);
    expect(fri[4].weight).toBeGreaterThan(mon[4].weight);
    expect(top(next, "back-squat")).toBeCloseTo(fri[4].weight, 0);
    expect(next.program!.note).toBe("Week 2");
  });

  it("repeats the week when the triple is missed", () => {
    const { plans, next } = run("ramping-5x5", 6, { reps: (slot, i, t) => (slot === "back-squat" && i === 4 ? 2 : t) });
    expect(top(next, "back-squat")).toBe(top(plans[0], "back-squat"));
    expect(top(next, "bench-press")).toBeGreaterThan(top(plans[0], "bench-press"));
  });
});

describe("tiered progression", () => {
  it("runs four days of T1, T2 and T3 with the last T1 and T3 sets as many as you can", () => {
    const { plans } = run("tiered", 4);
    expect(plans.map((p) => p.items.map((i) => i.label))).toEqual(Array(4).fill(["T1", "T2", "T3"]));
    expect(plans[0].items.map((i) => i.exerciseId)).toEqual(["back-squat", "bench-press", "lat-pulldown"]);
    expect(plans[3].items.map((i) => i.exerciseId)).toEqual(["deadlift", "overhead-press", "db-row"]);
    const t1 = item(plans[0], "T1:back-squat").setTargets!;
    expect(t1.map((s) => [s.reps, !!s.amrap])).toEqual([[3, false], [3, false], [3, false], [3, false], [3, true]]);
  });

  it("moves a stalled T1 from 5×3 to 6×2 to 10×1, then restarts at 85%", () => {
    const miss = (slot: string, i: number, t: number) => (slot === "T1:back-squat" && i === 0 ? t - 1 : t);
    const { plans, next } = run("tiered", 13, { reps: miss });
    const squatDays = plans.filter((p) => p.items[0].slot === "T1:back-squat");
    expect(squatDays.map((p) => item(p, "T1:back-squat").scheme)).toEqual(["5 × 3+", "6 × 2+", "10 × 1+", "5 × 3+"]);
    expect(top(squatDays[1], "T1:back-squat")).toBe(top(squatDays[0], "T1:back-squat"));
    expect(Math.abs(top(squatDays[3], "T1:back-squat") - top(squatDays[0], "T1:back-squat") * 0.85)).toBeLessThanOrEqual(1.25);
    expect(next.items[0].slot).toBe("T1:overhead-press");
  });

  it("moves a stalled T2 from 3×10 to 3×8, and adds T3 weight once the last set reaches 25", () => {
    const { plans } = run("tiered", 5, { reps: (slot, i, t, amrap) => (slot === "T2:bench-press" ? t - 2 : slot.startsWith("T3") && amrap ? 25 : t) });
    expect(item(plans[4], "T2:bench-press").scheme).toBe("3 × 8");
    expect(item(plans[4], "T3:lat-pulldown").setTargets![0].weight).toBeGreaterThan(item(plans[0], "T3:lat-pulldown").setTargets![0].weight);
  });

  it("adds weight to T1 when every set is made", () => {
    const { plans } = run("tiered", 5);
    expect(top(plans[4], "T1:back-squat") - top(plans[0], "T1:back-squat")).toBeCloseTo(5);
  });
});

describe("training max waves", () => {
  it("waves 65/75/85, 70/80/90, 75/85/95 and a deload, with 5×10 at 50% after", () => {
    const { plans, src } = run("waves", 16);
    const squat = plans.filter((p) => p.items[0].slot === "tm:back-squat");
    expect(squat).toHaveLength(4);
    const tm = src.start["tm:back-squat"];
    const main = (p: Plan) => item(p, "tm:back-squat").setTargets!;
    // Rounded to the plates, so within a couple of kilos.
    expect(main(squat[0]).slice(0, 3).map((s) => s.weight / tm)).toEqual([expect.closeTo(0.65, 1), expect.closeTo(0.75, 1), expect.closeTo(0.85, 1)]);
    expect(main(squat[0])[2].amrap).toBe(true);
    expect(main(squat[0]).slice(3).map((s) => s.reps)).toEqual([10, 10, 10, 10, 10]);
    expect(main(squat[2]).slice(0, 3).map((s) => s.reps)).toEqual([5, 3, 1]);
    expect(main(squat[3])).toHaveLength(3);
    expect(squat[3].program!.note).toMatch(/Deload/);
    expect(plans.map((p) => p.items[0].exerciseId).slice(0, 4)).toEqual(["overhead-press", "deadlift", "bench-press", "back-squat"]);
  });

  it("raises the training max each cycle, or drops it 10% after a short last set", () => {
    // After 16 sessions the next day is press day, week 1 of cycle 2: the heaviest set is 85%.
    const good = run("waves", 16);
    const tm = good.src.start["tm:overhead-press"];
    expect(good.next.items[0].slot).toBe("tm:overhead-press");
    expect(good.next.program!.note).toMatch(/Cycle 2/);
    expect(Math.abs(top(good.next, "tm:overhead-press") - 0.85 * (tm + 2.5))).toBeLessThanOrEqual(1.25);
    const deadTm = good.src.start["tm:deadlift"];
    expect(good.events.length).toBeGreaterThan(0);
    const bad = run("waves", 16, { reps: (slot, _i, t, amrap) => (slot === "tm:overhead-press" && amrap ? t - 1 : t) });
    expect(Math.abs(top(bad.next, "tm:overhead-press") - 0.85 * 0.9 * tm)).toBeLessThanOrEqual(1.25);
    expect(deadTm).toBeGreaterThan(tm);
  });
});

describe("bodyweight skills", () => {
  it("plans the pairs and core from what the gym has, skipping steps it can't do", () => {
    const { plans } = run("calisthenics", 1, { gym: homeGym });
    const ids = plans[0].items.map((i) => i.exerciseId);
    expect(ids).toContain("negative-pull-up");
    expect(ids).toContain("split-squat");
    // No bench or dip bars: the dip ladder has nothing, the row ladder falls back to the doorway row.
    expect(plans[0].items.find((i) => i.slot === "ladder:dip")).toBeUndefined();
    expect(ids).toContain("towel-row");
    for (const it of plans[0].items) {
      expect(it.target.weight).toBe(0);
      expect(available(homeGym.equipment, [exercise(it.exerciseId)])).toHaveLength(1);
    }
  });

  it("adds a rep each time, then moves up a step at 3×5 after 3×8", () => {
    const { plans } = run("calisthenics", 5, { gym: homeGym });
    const push = plans.map((p) => item(p, "ladder:push"));
    expect(push.map((i) => i.target.reps)).toEqual([5, 6, 7, 8, 5]);
    // No box for incline push-ups at this gym: wall push-ups, then straight on to full push-ups.
    expect(push[0].exerciseId).toBe("wall-push-up");
    expect(push[4].exerciseId).toBe("push-up");
    const plank = plans.map((p) => item(p, "ladder:core-front"));
    expect(plank.map((i) => i.target.reps)).toEqual([20, 25, 30, 35, 40]);
  });

  it("moves to whichever step the lifter swapped to", () => {
    const ctx: Ctx = { profile: { ...profile, experience: "new" }, gym: kgGym, events: [], now: NOW };
    const src = pickProgram("calisthenics", ctx) as Src;
    const plan = programPlan({ src, ...ctx })!;
    expect(item(plan, "ladder:pull").exerciseId).toBe("scapular-pull");
    const swapped = { ...plan, items: plan.items.map((i) => (i.slot === "ladder:pull" ? { ...i, exerciseId: "pull-up" } : i)) };
    const events = play([], swapped, NOW + D);
    expect(item(programPlan({ src, ...ctx, events, now: NOW + 2 * D })!, "ladder:pull").exerciseId).toBe("pull-up");
  });

  it("keeps ladder steps out of adaptive plans", () => {
    for (const p of [profile, { ...profile, experience: "new" as const }]) {
      const plan = generate({ gym: homeGym, profile: p, events: [], minutes: 60, now: NOW });
      for (const it of plan.items) expect(LADDER_ONLY.has(it.exerciseId)).toBe(false);
    }
  });
});

describe("splits", () => {
  it("push/pull/legs trains only each day's muscles, in turn", () => {
    const { plans } = run("ppl", 3);
    expect(plans.map((p) => p.program!.dayName)).toEqual(["Push day", "Pull day", "Leg day"]);
    plans.forEach((p, i) => {
      const day = new Set(SPLITS.ppl[i].muscles);
      expect(p.items.length).toBeGreaterThan(2);
      for (const it of p.items) for (const m of exercise(it.exerciseId).primary) expect(day.has(m)).toBe(true);
      expect(p.program!.fixed).toBe(false);
    });
  });

  it("upper/lower alternates and still follows the training block", () => {
    const { plans } = run("upper-lower", 2);
    expect(plans.map((p) => p.program!.dayName)).toEqual(["Upper day", "Lower day"]);
    expect(plans[0].week.label).toMatch(/Week|Deload/);
  });
});

describe("weekly preview", () => {
  it("counts hard sets per muscle for a typical week", () => {
    const ctx: Ctx = { profile, gym: kgGym, events: [], now: NOW };
    const five = weeklyPreview("classic-5x5", ctx);
    // A, B, A: 15 sets of squats, plus half credit from the deadlift.
    expect(five.quads).toBe(15.5);
    expect(five.chest).toBeGreaterThan(5);
    const ppl = weeklyPreview("ppl", ctx);
    expect(ppl.chest).toBeGreaterThan(0);
  });
});

describe("units", () => {
  it("converts the pound jump exactly", () => {
    expect(fromKg(toKg(5, "lb"), "lb")).toBeCloseTo(5);
  });
});
