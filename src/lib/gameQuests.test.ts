import { describe, expect, it } from "vitest";

import { makeSet } from "@/test/factories";

import { achievements, achievementXp, context } from "./achievements";
import { defaultProfile } from "./defaults";
import { derive, weekOf } from "./derive";
import { EXERCISE_BY_ID } from "./exercises";
import {
  bestBefore,
  COSMETICS,
  crateFor,
  crates,
  exerciseName,
  game,
  goalStreak,
  isPr,
  league,
  LEAGUES,
  levelAt,
  levelRewards,
  LEVELS,
  questsFor,
  questXp,
  rarityOdds,
  repsForPr,
  sessionXp,
  STARTER,
  trophies,
  weekXp,
  XP,
  xpTotal,
} from "./game";
import { t } from "./i18n";
import type { AppEvent, SetEvent } from "./types";

// Weekly quest progress, week XP, the top league, crate odds, PR edge cases and the totals in game()
// (mutation run round 3, 2026-11-13: game.test.ts and gameRules.test.ts covered the shape of each, and
// these pin the counting rules so a changed comparison or a dropped filter fails).

const NOW = new Date("2026-11-11T18:00:00").getTime(); // a Wednesday evening
const H = 3600_000;
const D = 24 * H;
const W = 7 * D;
const profile = (over = {}) => ({ ...defaultProfile(NOW), onboarded: true, daysPerWeek: 3, ...over });
const set = (exerciseId: string, at: number, weight: number, reps: number, sessionId: string, over: Partial<SetEvent> = {}) =>
  makeSet({ at, sessionId, exerciseId, weight, reps, targetReps: reps, ...over });

/** The first week, counting back from this one, whose three quests include `id`. */
function weekWith(id: string): number {
  for (let back = 0; back < 200; back++) {
    const monday = weekOf(NOW) - back * W;
    if (questsFor([], profile(), monday).some((q) => q.id === id)) return weekOf(monday + D);
  }
  throw new Error(`no week offers ${id}`);
}
/** Progress on quest `id` in its week, given sets in that week (day offsets from Monday) and before it. */
function progress(id: string, sets: (monday: number) => AppEvent[], p = profile()) {
  const monday = weekWith(id);
  const q = questsFor(sets(monday), p, monday).find((x) => x.id === id)!;
  return q;
}

describe("quest progress", () => {
  it("counts training days, never more than the goal", () => {
    const q = progress("days", (m) => [
      set("bench-press", m + 10 * H, 60, 8, "a"),
      set("bench-press", m + 18 * H, 60, 8, "b"),
      set("bench-press", m + D + 10 * H, 60, 8, "c"),
    ]);
    expect(q.goal).toBe(3);
    expect(q.have).toBe(2);
    expect(q.done).toBe(false);
  });

  it("counts exercises new this week, not ones done before it", () => {
    const old = (m: number) => [set("bench-press", m - 3 * D, 60, 8, "old")];
    expect(progress("new-ex", (m) => [...old(m), set("bench-press", m + 10 * H, 60, 8, "a")]).have).toBe(0);
    const q = progress("new-ex", (m) => [
      ...old(m),
      set("bench-press", m + 10 * H, 60, 8, "a"),
      set("back-squat", m + 11 * H, 100, 5, "a"),
    ]);
    expect(q.have).toBe(1);
    expect(q.done).toBe(true);
  });

  it("needs a workout of six or more graded sets, every one on target", () => {
    const sets = (m: number, k: number, miss = -1, over: Partial<SetEvent> = {}) =>
      Array.from({ length: k }, (_, i) =>
        set("bench-press", m + 10 * H + i * 60_000, 60, 8, "a", { targetReps: i === miss ? 10 : 8, ...over }),
      );
    expect(progress("on-target", (m) => sets(m, 6)).have).toBe(1);
    expect(progress("on-target", (m) => sets(m, 5)).have).toBe(0);
    expect(progress("on-target", (m) => sets(m, 6, 2)).have).toBe(0);
    // A short drop set doesn't spoil it, and drop sets don't count toward the six.
    expect(
      progress("on-target", (m) => [...sets(m, 6), set("bench-press", m + 9 * H, 20, 5, "a", { targetReps: 10, tag: "drop" })]).have,
    ).toBe(1);
    expect(progress("on-target", (m) => [...sets(m, 5), set("bench-press", m + 9 * H, 20, 10, "a", { tag: "drop" })]).have).toBe(0);
  });

  it("counts sets toward fourteen a training day", () => {
    const q = progress("sets", (m) => Array.from({ length: 10 }, (_, i) => set("bench-press", m + 10 * H + i * 60_000, 60, 8, "a")));
    expect(q.goal).toBe(42);
    expect(q.have).toBe(10);
    expect(progress("sets", () => [], profile({ daysPerWeek: 2 })).goal).toBe(28);
  });

  it("counts workouts with a leg exercise", () => {
    expect(progress("legs", (m) => [set("bench-press", m + 10 * H, 60, 8, "a"), set("no-such-lift", m + 11 * H, 10, 8, "a")]).have).toBe(0);
    for (const id of ["back-squat", "romanian-deadlift", "hip-thrust"]) {
      const q = progress("legs", (m) => [set("bench-press", m + 10 * H, 60, 8, "a"), set(id, m + 11 * H, 80, 8, "a")]);
      expect(q.have).toBe(1);
    }
  });

  it("counts different main muscles, toward 4 plus 2 a training day, at most 10", () => {
    const q = progress("muscles", (m) => [
      set("bench-press", m + 10 * H, 60, 8, "a"),
      set("bench-press", m + 11 * H, 60, 8, "a"),
      set("no-such-lift", m + 12 * H, 60, 8, "a"),
    ]);
    expect(q.have).toBe(EXERCISE_BY_ID.get("bench-press")!.primary.length);
    expect(q.goal).toBe(10);
    expect(progress("muscles", () => [], profile({ daysPerWeek: 2 })).goal).toBe(8);
    expect(progress("muscles", () => [], profile({ daysPerWeek: 1 })).goal).toBe(6);
    expect(progress("muscles", () => [], profile({ daysPerWeek: 0 })).goal).toBe(6);
  });

  it("counts reps toward 120 a training day, leaving out timed holds", () => {
    const q = progress("reps", (m) => [
      set("bench-press", m + 10 * H, 60, 8, "a"),
      set("bench-press", m + 10 * H + 60_000, 60, 6, "a"),
      set("db-shrug-hold", m + 11 * H, 30, 40, "a"),
    ]);
    expect(q.goal).toBe(360);
    expect(q.have).toBe(14);
  });

  it("counts sets rested a full minute or more, toward 8 a training day", () => {
    const q = progress("rest", (m) =>
      [60, 59, 120, undefined].map((restSec, i) => set("bench-press", m + 10 * H + i * 60_000, 60, 8, "a", { restSec })),
    );
    expect(q.goal).toBe(24);
    expect(q.have).toBe(2);
  });

  it("counts a best only past an earlier one, and not on bodyweight or timed work", () => {
    const before = (m: number) => [set("bench-press", m - 3 * D, 60, 8, "old"), set("db-shrug-hold", m - 3 * D, 30, 20, "old")];
    const pr = (sets: (m: number) => SetEvent[]) => progress("pr", (m) => [...before(m), ...sets(m)]).have;
    expect(pr((m) => [set("bench-press", m + 10 * H, 62.5, 8, "a")])).toBe(1);
    expect(pr((m) => [set("bench-press", m + 10 * H, 60, 8, "a")])).toBe(0);
    // A lighter set first doesn't lower the bar for the next one.
    expect(pr((m) => [set("bench-press", m + 10 * H, 50, 8, "a"), set("bench-press", m + 11 * H, 58, 8, "a")])).toBe(0);
    // Out of order in the list, still judged in time order.
    expect(pr((m) => [set("bench-press", m + 11 * H, 60, 8, "a"), set("bench-press", m + 10 * H, 70, 8, "a")])).toBe(1);
    expect(pr((m) => [set("db-shrug-hold", m + 10 * H, 30, 60, "a")])).toBe(0);
    expect(pr((m) => [set("bench-press", m + 10 * H, 0, 30, "a")])).toBe(0);
    // A first-ever exercise sets the bar this week; beating it later in the week is a best.
    expect(pr((m) => [set("back-squat", m + 10 * H, 100, 5, "a")])).toBe(0);
    expect(pr((m) => [set("back-squat", m + 10 * H, 100, 5, "a"), set("back-squat", m + D + 10 * H, 105, 5, "b")])).toBe(1);
    expect(pr((m) => [set("back-squat", m + 10 * H, 105, 5, "a"), set("back-squat", m + D + 10 * H, 100, 5, "b")])).toBe(0);
    // Bodyweight sets before the week don't count as a bar.
    expect(progress("pr", (m) => [set("bench-press", m - 3 * D, 0, 8, "old"), set("bench-press", m + 10 * H, 60, 8, "a")]).have).toBe(0);
  });

  it("dedupes a set logged twice and ignores sets outside the week", () => {
    const m = weekWith("sets");
    const one = set("bench-press", m + 10 * H, 60, 8, "a");
    const evs = [one, { ...one }, set("bench-press", m - H, 60, 8, "x"), set("bench-press", m + W + H, 60, 8, "y")];
    expect(questsFor(evs, profile(), m).find((q) => q.id === "sets")!.have).toBe(1);
  });
});

describe("week XP and the top league", () => {
  it("adds up the week's workouts and finished quests, from Monday up to next Monday", () => {
    const m = weekOf(NOW);
    const twelve = Array.from({ length: 12 }, (_, i) => set("bench-press", m + 10 * H + i * 60_000, 60, 8, "a"));
    const evs = [...twelve, ...Array.from({ length: 2 }, (_, i) => set("bench-press", m + D + 10 * H + i * 60_000, 60, 8, "b"))];
    const stats = derive(evs, NOW);
    const quests = questsFor(evs, profile(), m).reduce((x, q) => x + (q.done ? q.xp : 0), 0);
    const workouts = 12 * XP.set + XP.session + XP.fullSession + (2 * XP.set + XP.session);
    expect(weekXp(evs, stats, profile(), m)).toBe(workouts + quests);
    // The week before and the week after hold none of it (beyond their own quests, which need sets).
    expect(weekXp(evs, stats, profile(), m - W)).toBe(0);
    expect(weekXp(evs, stats, profile(), m + W)).toBe(0);
  });

  it("counts a best in the week's XP", () => {
    const m = weekOf(NOW);
    const evs = [set("bench-press", m - 5 * D, 60, 8, "old"), set("bench-press", m + 10 * H, 70, 8, "a")];
    const stats = derive(evs, NOW);
    const s = stats.sessions.find((x) => x.sessionId === "a")!;
    expect(s.prs).toBe(1);
    const quests = questsFor(evs, profile(), m).reduce((x, q) => x + (q.done ? q.xp : 0), 0);
    expect(weekXp(evs, stats, profile(), m)).toBe(XP.set + XP.session + XP.pr + quests);
  });

  it("stops at Diamond however big the weeks", () => {
    const evs: SetEvent[] = [];
    for (let w = 9; w >= 1; w--)
      for (let d = 0; d < 3; d++)
        for (let i = 0; i < 40; i++) evs.push(set("bench-press", weekOf(NOW) - w * W + d * D + 10 * H + i * 60_000, 60, 8, `w${w}d${d}`));
    const stats = derive(evs, NOW);
    const l = league(evs, stats, profile(), NOW);
    expect(l.index).toBe(LEAGUES.length - 1);
    expect(l.league).toBe("Diamond");
    expect(l.promoteAt).toBeNull();
    expect(Math.max(...l.history.map(([, i]) => i))).toBe(LEAGUES.length - 1);
  });

  it("adds every week's quest XP from the first workout's week to this one", () => {
    const evs = [
      ...[0, 1, 2].map((d) => set("bench-press", weekOf(NOW) - 2 * W + d * D + 10 * H, 60, 8, `a${d}`)),
      set("bench-press", weekOf(NOW) + 10 * H, 60, 8, "now"),
    ];
    const stats = derive(evs, NOW);
    let want = 0;
    for (const back of [2, 1, 0]) want += questsFor(evs, profile(), weekOf(NOW) - back * W).reduce((x, q) => x + (q.done ? q.xp : 0), 0);
    expect(want).toBeGreaterThanOrEqual(150);
    expect(questXp(evs, stats, profile(), NOW)).toBe(want);
    expect(questXp([], derive([], NOW), profile(), NOW)).toBe(0);
  });
});

describe("XP edges", () => {
  it("gives the full-workout bonus from twelve sets", () => {
    const evs = [
      ...Array.from({ length: 12 }, (_, i) => set("bench-press", NOW - 2 * D + i * 60_000, 60, 8, "twelve")),
      ...Array.from({ length: 11 }, (_, i) => set("bench-press", NOW - D + i * 60_000, 60, 8, "eleven")),
    ];
    const stats = derive(evs, NOW);
    expect(sessionXp(stats, "twelve")).toBe(12 * XP.set + XP.session + XP.fullSession);
    expect(sessionXp(stats, "eleven")).toBe(11 * XP.set + XP.session);
    expect(xpTotal(stats)).toBe(23 * XP.set + 2 * XP.session + XP.fullSession);
  });

  it("names the old level list in the current language", () => {
    expect(LEVELS[0]).toEqual({ at: 0, title: t("lvl.rookie") });
    expect(LEVELS[1]!.at).toBe(levelAt(4));
  });

  it("readies no freeze without one held", () => {
    const evs = [1, 2, 3].flatMap((back) =>
      [0, 1, 2].map((d) => set("bench-press", weekOf(NOW) - back * W + d * D + 10 * H, 60, 8, `w${back}d${d}`)),
    );
    const s = goalStreak(derive(evs, NOW), profile(), NOW);
    expect(s.weeks).toBe(3);
    expect(s.freezes).toBe(0);
    expect(s.needed).toBeGreaterThan(0);
    expect(s.freezeReady).toBe(false);
  });
});

describe("crates", () => {
  it("hand out items at their odds", () => {
    const counts = new Map<string, number>();
    const N = 6000;
    for (let i = 0; i < N; i++) {
      const c = crateFor(`s${i}`);
      counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
    }
    const ids = COSMETICS.filter((c) => rarityOdds(c.id) > 0).map((c) => c.id);
    expect(ids.length).toBeGreaterThan(5);
    for (const id of ids) expect(Math.abs((counts.get(id) ?? 0) / N - rarityOdds(id))).toBeLessThan(0.02);
    for (const id of counts.keys()) expect(ids).toContain(id);
  });

  it("leave the workout list in its order", () => {
    const evs = [0, 1, 2].map((d) => set("bench-press", NOW - (3 - d) * D, 60, 8, `c${d}`));
    const stats = derive(evs, NOW);
    const before = stats.sessions.map((s) => s.sessionId);
    const list = crates(stats);
    expect(stats.sessions.map((s) => s.sessionId)).toEqual(before);
    expect(list.map((c) => c.sessionId)).toEqual([...before].reverse());
  });

  it("give a level's set item before its bonus crate", () => {
    const at8 = levelRewards(8).filter((r) => r.level === 8);
    expect(at8.map((r) => r.source)).toEqual(["item", "crate"]);
  });
});

describe("the totals in game()", () => {
  // Twenty workouts: more crates than the pool holds, so some must repeat.
  const evs = Array.from({ length: 20 }, (_, d) => set("bench-press", NOW - (20 - d) * D, 60, 8, `g${d}`));
  const stats = derive(evs, NOW);
  const p = profile();
  const g = game(evs, stats, p, NOW);

  it("turns every repeat, from crates or level rewards, into bonus XP", () => {
    const list = achievements(context(evs, stats, p, g.streak.best));
    const base = xpTotal(stats) + questXp(evs, stats, p, NOW) + achievementXp(list);
    const won = [...crates(stats).map((c) => c.item.id), ...g.rewards.map((r) => r.item.id)];
    const repeats = won.length - new Set(won).size;
    expect(crates(stats).some((c) => c.duplicate)).toBe(true);
    expect(g.xp).toBe(base + repeats * XP.crateDuplicate);
    expect(g.xp).toBeGreaterThan(base);
  });

  it("counts badges earned and on offer across every achievement", () => {
    expect(g.badges.total).toBe(g.achievements.reduce((n, a) => n + a.levels, 0));
    expect(g.badges.earned).toBe(g.achievements.reduce((n, a) => n + a.level, 0));
    expect(g.badges.earned).toBeGreaterThan(0);
    expect(g.badges.total).toBeGreaterThan(g.badges.earned);
  });

  it("owns the starter set, every crate and every reward", () => {
    for (const id of [...STARTER, ...crates(stats).map((c) => c.item.id), ...g.rewards.map((r) => r.item.id)])
      expect(g.owned.has(id)).toBe(true);
  });
});

describe("bests at the edges", () => {
  it("keeps the best, not the last, and leaves out empty bars", () => {
    const evs = [set("bench-press", NOW - 3 * D, 80, 5, "a"), set("bench-press", NOW - 2 * D, 60, 5, "b")];
    expect(bestBefore(evs, "bench-press", NOW)).toBeCloseTo(80 * (1 + 5 / 30));
    expect(bestBefore([set("bench-press", NOW - D, 0, 10, "a")], "bench-press", NOW)).toBeNull();
  });

  it("needs a set of the same exercise in an earlier workout before calling a best", () => {
    const now = set("bench-press", NOW, 100, 5, "today");
    const start: AppEvent = { type: "sessionStart", id: "st", at: NOW - D, sessionId: "old", gymId: "g", minutes: 45 };
    expect(isPr([start, now], now)).toBe(false);
    expect(isPr([set("back-squat", NOW - D, 40, 5, "old"), now], now)).toBe(false);
    expect(isPr([set("bench-press", NOW + D, 40, 5, "later"), now], now)).toBe(false);
    expect(isPr([set("bench-press", NOW - D, 40, 5, "old"), now], now)).toBe(true);
  });

  it("never calls a timed hold or an empty bar a best", () => {
    const hold = (secs: number, at: number, id: string) => set("db-shrug-hold", at, 40, secs, id);
    const later = hold(60, NOW, "b");
    expect(isPr([hold(20, NOW - D, "a"), later], later)).toBe(false);
    const empty = set("bench-press", NOW, 0, 30, "b");
    expect(isPr([set("bench-press", NOW - D, 0, 5, "a"), empty], empty)).toBe(false);
    expect(repsForPr([hold(20, NOW - D, "a")], "db-shrug-hold", 40, NOW)).toBeNull();
    expect(repsForPr([set("bench-press", NOW - D, 60, 8, "a")], "bench-press", 0, NOW)).toBeNull();
  });

  it("asks for up to 30 reps, and no more", () => {
    // 66 kg × 15 is an estimated 99 kg: at 50 kg that takes 30 reps to beat.
    const evs = [set("bench-press", NOW - D, 66, 15, "a")];
    expect(repsForPr(evs, "bench-press", 50, NOW)).toBe(30);
    expect(repsForPr(evs, "bench-press", 45, NOW)).toBeNull();
  });
});

describe("older API", () => {
  it("lists visible achievements as trophies", () => {
    const evs = [set("bench-press", NOW - D, 60, 8, "a")];
    const stats = derive(evs, NOW);
    const list = trophies(evs, stats, profile());
    expect(list.length).toBeGreaterThan(5);
    const visible = achievements(context(evs, stats, profile(), 0)).filter((a) => !a.hidden);
    expect(list.map((x) => x.id)).toEqual(visible.map((a) => a.id));
    for (const [k, a] of visible.entries()) {
      const tr = list[k]!;
      expect(tr.name).toBe(a.name);
      expect(tr.earned).toBe(a.level > 0);
      expect(tr.tier).toBe(a.tier === "platinum" || a.tier === "gold" ? "gold" : a.tier === "silver" ? "silver" : "bronze");
    }
    expect(list.some((x) => x.earned)).toBe(true);
    expect(list.some((x) => !x.earned)).toBe(true);
  });

  it("names an exercise, or gives back an unknown id", () => {
    expect(exerciseName("bench-press")).toBe(EXERCISE_BY_ID.get("bench-press")!.name);
    expect(exerciseName("no-such-lift")).toBe("no-such-lift");
  });
});
