import { describe, expect, it } from "vitest";

import { defaultProfile, makeGym } from "./defaults";
import { exercise, EXERCISES } from "./exercises";
import { alternatives, generate } from "./generator";
import { activeInjuries, affects, effectFor, gradedReturn, injuries, lighten, painTrend, returnReady } from "./injury";
import { roundLoad } from "./loads";
import { target } from "./progression";
import { BODY_PARTS, type AppEvent, type BodyPart, type InjuryRuleEvent, type SetEvent } from "./types";

const NOW = new Date("2026-11-11T18:00:00").getTime();
const H = 3600_000;
const gym = makeGym("commercial", "kg", "g");
const profile = () => ({ ...defaultProfile(NOW), onboarded: true, activeGymId: "g" });

let n = 0;
const hurt = (part: BodyPart, injuryId = `i${n++}`, at = NOW - 48 * H): AppEvent => ({ type: "injury", id: `e${n++}`, at, injuryId, part });
const rule = (injuryId: string, r: Omit<InjuryRuleEvent, "type" | "id" | "at" | "injuryId">, at = NOW - 24 * H): AppEvent => ({
  type: "injuryRule",
  id: `e${n++}`,
  at,
  injuryId,
  ...r,
});
const healed = (injuryId: string, at = NOW - H): AppEvent => ({ type: "injuryHealed", id: `e${n++}`, at, injuryId });
const set = (exerciseId: string, at: number, weight: number, reps: number, extra: Partial<SetEvent> = {}): SetEvent => ({
  type: "set",
  id: `e${n++}`,
  at,
  sessionId: `s${at}`,
  exerciseId,
  weight,
  reps,
  targetReps: reps,
  rir: 2,
  ...extra,
});
const plan = (events: AppEvent[], call: "normal" | "push" = "normal") =>
  generate({ gym, profile: profile(), events, minutes: 90, now: NOW, call, challenge: call === "push" });

describe("which exercises an injury affects", () => {
  it("flags the obvious lifts for each body part", () => {
    expect(affects("knee", exercise("back-squat"))).toBe(true);
    expect(affects("knee", exercise("leg-extension"))).toBe(true);
    expect(affects("knee", exercise("bench-press"))).toBe(false);
    expect(affects("shoulder", exercise("overhead-press"))).toBe(true);
    expect(affects("shoulder", exercise("bench-press"))).toBe(true);
    expect(affects("shoulder", exercise("leg-press"))).toBe(false);
    expect(affects("lowerBack", exercise("deadlift"))).toBe(true);
    expect(affects("lowerBack", exercise("romanian-deadlift"))).toBe(true);
    expect(affects("lowerBack", exercise("leg-extension"))).toBe(false);
    expect(affects("wrist", exercise("push-up"))).toBe(true);
    expect(affects("elbow", exercise("barbell-curl"))).toBe(true);
    expect(affects("ankle", exercise("standing-calf-raise"))).toBe(true);
  });
  it("leaves something to train for every body part at a full gym", () => {
    for (const p of BODY_PARTS) {
      const left = EXERCISES.filter((e) => !affects(p, e));
      expect(left.length, p).toBeGreaterThan(20);
    }
  });
});

describe("injury state from events", () => {
  it("skips by default, applies rules in time order, and ends when healed", () => {
    const evs: AppEvent[] = [
      hurt("knee", "k", NOW - 72 * H),
      rule("k", { exerciseId: "leg-press", action: "light", pct: 60, ack: true }, NOW - 48 * H),
      rule("k", { exerciseId: "leg-press", action: "ok", ack: true }, NOW - 24 * H),
    ];
    const [k] = activeInjuries(evs);
    expect(k.all.action).toBe("skip");
    expect(k.rules.get("leg-press")).toEqual({ action: "ok", pct: 70 });
    expect(activeInjuries([...evs, healed("k")])).toHaveLength(0);
    expect(injuries([...evs, healed("k")])[0].healedAt).toBe(NOW - H);
  });
  it("is order-independent across devices (events sorted by time)", () => {
    const a = [
      hurt("knee", "k", NOW - 72 * H),
      rule("k", { action: "light", pct: 60 }, NOW - 48 * H),
      rule("k", { action: "skip" }, NOW - 24 * H),
    ];
    expect(activeInjuries([...a].reverse())[0].all.action).toBe("skip");
  });
  it("a choice for all affected exercises resets the per-exercise ones", () => {
    const evs = [
      hurt("knee", "k"),
      rule("k", { exerciseId: "leg-press", action: "ok" }, NOW - 30 * H),
      rule("k", { action: "light", pct: 80 }, NOW - 20 * H),
    ];
    const [k] = activeInjuries(evs);
    expect(k.rules.size).toBe(0);
    expect(effectFor(exercise("leg-press"), [k])).toMatchObject({ action: "light", pct: 80 });
  });
  it("combines injuries: skip wins, then the lightest share", () => {
    const evs = [hurt("knee", "k"), hurt("hip", "h"), rule("k", { action: "light", pct: 80 }), rule("h", { action: "light", pct: 60 })];
    expect(effectFor(exercise("back-squat"), activeInjuries(evs))).toMatchObject({ action: "light", pct: 60 });
    expect(
      effectFor(exercise("back-squat"), activeInjuries([...evs, rule("h", { exerciseId: "back-squat", action: "skip" }, NOW - H)]))?.action,
    ).toBe("skip");
    expect(effectFor(exercise("bench-press"), activeInjuries(evs))).toBeNull();
  });
});

describe("plans with an injury", () => {
  it("leave out every exercise the injury skips, and bring them back once healed", () => {
    const evs = [hurt("knee", "k")];
    const items = plan(evs).items.map((i) => exercise(i.exerciseId));
    expect(items.length).toBeGreaterThan(3);
    expect(items.filter((e) => affects("knee", e))).toEqual([]);
    const back = plan([...evs, healed("k")]).items.map((i) => exercise(i.exerciseId));
    expect(back.some((e) => affects("knee", e))).toBe(true);
  });
  it("keep a lighter exercise at the chosen share, loadable, short of failure, with no extra sets", () => {
    const history: AppEvent[] = [set("back-squat", NOW - 96 * H, 100, 8), set("back-squat", NOW - 96 * H + 60_000, 100, 8)];
    const base = plan(history).items.find((i) => i.exerciseId === "back-squat");
    const evs = [...history, hurt("knee", "k"), rule("k", { exerciseId: "back-squat", action: "light", pct: 60, ack: true })];
    const p = plan(evs);
    const sq = p.items.find((i) => i.exerciseId === "back-squat");
    expect(sq, "squat stays in the plan").toBeTruthy();
    expect(sq!.injuryPct).toBe(60);
    const usual = base?.target.weight ?? target(exercise("back-squat"), history, profile(), gym, NOW).weight;
    expect(sq!.target.weight).toBeLessThanOrEqual(usual * 0.6 + 1e-6);
    expect(roundLoad(sq!.target.weight, exercise("back-squat"), gym).kg).toBe(sq!.target.weight);
    expect(sq!.target.rir).toBeGreaterThanOrEqual(3);
    expect(sq!.target.note).toMatch(/Injury: 60%/);
    expect(sq!.sets).toBeLessThanOrEqual(4);
    // Other knee exercises are still skipped.
    expect(p.items.filter((i) => i.exerciseId !== "back-squat" && affects("knee", exercise(i.exerciseId)))).toEqual([]);
  });
  it("never pushes or challenges an exercise kept lighter", () => {
    const evs = [hurt("knee", "k"), rule("k", { action: "light", pct: 70, ack: true })];
    for (const it of plan(evs, "push").items.filter((i) => i.injuryPct)) {
      expect(it.challenge).toBeFalsy();
      expect(it.target.rir).toBeGreaterThanOrEqual(3);
    }
  });
  it("lighten scales reps for bodyweight work and never goes above the share", () => {
    const t = { weight: 0, reps: 12, rir: 2, note: "" };
    expect(lighten(t, exercise("push-up"), 50, gym)).toMatchObject({ reps: 6, rir: 3 });
    const db = lighten({ weight: 30, reps: 10, rir: 1, note: "" }, exercise("db-bench-press"), 70, gym);
    expect(db.weight).toBeLessThanOrEqual(21);
  });
});

describe("progression around an injury", () => {
  it("ignores sessions done lighter, so it picks up from before the injury", () => {
    const before = [set("bench-press", NOW - 200 * H, 80, 8), set("bench-press", NOW - 200 * H + 60_000, 80, 8)];
    const light = [
      set("bench-press", NOW - 50 * H, 50, 8, { injuryPct: 60 }),
      set("bench-press", NOW - 50 * H + 60_000, 50, 8, { injuryPct: 60 }),
    ];
    expect(target(exercise("bench-press"), [...before, ...light], profile(), gym, NOW).weight).toBe(
      target(exercise("bench-press"), before, profile(), gym, NOW).weight,
    );
  });
});

describe("swaps with an injury", () => {
  it("never offer an exercise the injury skips, and list ones that avoid it first", () => {
    const active = activeInjuries([hurt("lowerBack", "b")]);
    const alts = alternatives("back-squat", gym, [], active);
    expect(alts.length).toBeGreaterThan(0);
    expect(alts.some((e) => effectFor(e, active)?.action === "skip")).toBe(false);
    expect(effectFor(alts[0], active)).toBeNull();
  });
});

describe("programs and routines with an injury", () => {
  it("a fixed program day swaps skipped lifts (keeping sets and reps) and lightens set by set", async () => {
    const { pickProgram, programPlan } = await import("./programs");
    const { injuryPass } = await import("./generator");
    const p = profile();
    const src = pickProgram("classic-5x5", { profile: p, gym, events: [], now: NOW });
    if (src.kind !== "program") throw new Error("program");
    const day = programPlan({ src, profile: p, gym, events: [], now: NOW })!;
    expect(day.items.map((i) => i.exerciseId)).toContain("back-squat");
    const evs = [hurt("knee", "k"), hurt("shoulder", "s"), rule("s", { exerciseId: "bench-press", action: "light", pct: 60, ack: true })];
    const out = injuryPass(day, evs, p, gym, NOW);
    const squat = day.items.find((i) => i.exerciseId === "back-squat")!;
    const swapped = out.items.find((i) => i.slot === squat.slot)!;
    if (swapped) {
      expect(affects("knee", exercise(swapped.exerciseId))).toBe(false);
      expect(swapped.sets).toBe(squat.sets);
      expect(swapped.target.reps).toBe(squat.target.reps);
    }
    const bench = day.items.find((i) => i.exerciseId === "bench-press")!;
    const lit = out.items.find((i) => i.exerciseId === "bench-press")!;
    expect(lit.injuryPct).toBe(60);
    expect(lit.target.weight).toBeLessThanOrEqual(bench.target.weight * 0.6 + 1e-6);
    for (const [k, x] of (lit.setTargets ?? []).entries())
      expect(x.weight).toBeLessThanOrEqual((bench.setTargets?.[k].weight ?? bench.target.weight) * 0.6 + 1e-6);
  });
});

describe("pain ratings and the graded return", () => {
  const D = 24 * H;
  const pain = (injuryId: string, score: number, at: number): AppEvent => ({ type: "pain", id: `e${n++}`, at, injuryId, score });
  const ret = (injuryId: string, at: number): AppEvent => ({ type: "injuryReturn", id: `e${n++}`, at, injuryId, ack: true });
  const T0 = NOW - 40 * D;

  it("keeps ratings in order and shows the trend", () => {
    const [k] = activeInjuries([hurt("knee", "k", T0), pain("k", 7, T0 + D), pain("k", 4, T0 + 3 * D), pain("k", 2, T0 + 6 * D)], NOW);
    expect(k.pain.map((p) => p.score)).toEqual([7, 4, 2]);
    expect(painTrend(k)).toMatchObject({ latest: 2, change: -5 });
  });

  it("offers a return only after about a week of pain at 2 or below, with a recent rating", () => {
    const base = [hurt("knee", "k", T0), pain("k", 6, NOW - 12 * D)];
    const ready = (evs: AppEvent[]) => returnReady(activeInjuries(evs, NOW)[0], NOW);
    expect(ready([...base, pain("k", 2, NOW - 3 * D), pain("k", 1, NOW - D)])).toBe(false); // only 3 days low
    expect(ready([...base, pain("k", 2, NOW - 7 * D), pain("k", 1, NOW - D)])).toBe(true);
    expect(ready([...base, pain("k", 2, NOW - 7 * D), pain("k", 3, NOW - D)])).toBe(false); // latest not low
    expect(ready([...base, pain("k", 2, NOW - 12 * D), pain("k", 1, NOW - 6 * D)])).toBe(false); // stale
  });

  it("steps 50 → 70 → 90% a week at a time on low pain, holds on 3–4, stops on 5+", () => {
    const s = NOW - 22 * D;
    const g = (ps: [number, number][], now = NOW) =>
      gradedReturn(
        s,
        ps.map(([d, score]) => ({ at: s + d * D, score })),
        now,
      );
    expect(gradedReturn(s, [], s + D)).toMatchObject({ pct: 50, stage: 0 });
    expect(
      g(
        [
          [2, 1],
          [9, 1],
          [16, 2],
        ],
        s + 17 * D,
      ),
    ).toMatchObject({ pct: 90, stage: 2, readyToHeal: false });
    expect(
      g(
        [
          [2, 1],
          [9, 1],
          [16, 2],
        ],
        s + 22 * D,
      ),
    ).toMatchObject({ pct: 90, readyToHeal: true });
    expect(
      g(
        [
          [2, 1],
          [5, 3],
        ],
        s + 10 * D,
      ),
    ).toMatchObject({ pct: 50 }); // a 3 restarts the week
    expect(
      g(
        [
          [2, 1],
          [5, 3],
          [8, 1],
        ],
        s + 13 * D,
      ),
    ).toMatchObject({ pct: 70 });
    expect(
      g(
        [
          [2, 1],
          [9, 6],
        ],
        s + 10 * D,
      ).stopped,
    ).toEqual({ at: s + 9 * D, score: 6 });
    expect(g([[1, 2]], s + 30 * D)).toMatchObject({ pct: 70 }); // no new rating, no further step
  });

  it("brings skipped exercises back at the return's share, and skips them again if it stops", () => {
    const evs = [hurt("knee", "k", T0), pain("k", 1, NOW - 8 * D), ret("k", NOW - 2 * D)];
    expect(effectFor(exercise("back-squat"), activeInjuries(evs, NOW))).toMatchObject({ action: "light", pct: 50 });
    const sq = plan(evs).items.filter((i) => affects("knee", exercise(i.exerciseId)));
    expect(sq.length).toBeGreaterThan(0);
    for (const it of sq) expect(it.injuryPct).toBe(50);
    expect(effectFor(exercise("back-squat"), activeInjuries([...evs, pain("k", 5, NOW - D)], NOW))?.action).toBe("skip");
  });
});
