import { describe, expect, it } from "vitest";

import { makeSet } from "@/test/factories";

import { defaultProfile } from "./defaults";
import { derive, weekOf } from "./derive";
import {
  bestBefore,
  demoteBelow,
  FREEZE_EVERY,
  goalStreak,
  isPr,
  league,
  LEAGUES,
  levelAt,
  levelOf,
  MAX_LEVEL,
  promoteAt,
  repsForPr,
  sessionXp,
  titleOf,
  XP,
  xpTotal,
} from "./game";
import { t } from "./i18n";
import type { SetEvent } from "./types";

// The exact numbers behind XP, levels, the streak and leagues (mutation run, 2026-11-13: game.test.ts
// checks the shape of each feature, and these pin the rules so a changed number or comparison fails).

const NOW = new Date("2026-11-11T18:00:00").getTime(); // a Wednesday evening
const H = 3600_000;
const D = 24 * H;
const W = 7 * D;
const profile = (over = {}) => ({ ...defaultProfile(NOW), onboarded: true, daysPerWeek: 3, ...over });
const bench = (at: number, sessionId: string, weight = 60, reps = 8, over: Partial<SetEvent> = {}) =>
  makeSet({ at, sessionId, exerciseId: "bench-press", weight, reps, targetReps: reps, ...over });
const workout = (at: number, id: string, k = 3, weight = 60) => Array.from({ length: k }, (_, i) => bench(at + i * 60_000, id, weight));

describe("levels", () => {
  it("need 0, 50, 170, … XP on a 1.8 power curve rounded to tens", () => {
    expect([1, 2, 3, 4, 10, 50].map(levelAt)).toEqual([0, 50, 170, 360, 2610, 55120]);
    expect(levelAt(0)).toBe(0);
  });

  it("say how far into the level and how big it is", () => {
    expect(levelOf(0)).toMatchObject({ level: 1, into: 0, span: 50 });
    expect(levelOf(49)).toMatchObject({ level: 1, into: 49 });
    expect(levelOf(50)).toMatchObject({ level: 2, into: 0, span: 120 });
    expect(levelOf(169).level).toBe(2);
    expect(levelOf(170).level).toBe(3);
  });

  it("stop at level 50 with nothing next", () => {
    const top = levelOf(levelAt(MAX_LEVEL) + 10_000);
    expect(top).toMatchObject({ level: MAX_LEVEL, span: 1, next: null, into: 10_000 });
    expect(levelOf(levelAt(MAX_LEVEL) - 1).level).toBe(MAX_LEVEL - 1);
  });

  it("name the next level by its new title, or by number inside a title", () => {
    expect(levelOf(levelAt(3)).next).toBe(titleOf(4)); // 4 starts a title
    expect(levelOf(levelAt(4)).next).toBe(t("progress.level", { level: 5 }));
    expect(titleOf(1)).toBe(t("lvl.rookie"));
    expect(titleOf(3)).toBe(t("lvl.rookie"));
    expect(titleOf(4)).toBe(t("lvl.regular"));
  });
});

describe("XP", () => {
  it("gives 10 a set, 40 a workout, 50 a best and 30 more for a workout of 12+ sets", () => {
    const ev = [...workout(NOW - 3 * D, "a", 12), ...workout(NOW - D, "b", 11, 70)];
    const stats = derive(ev, NOW);
    expect(stats.prs).toHaveLength(1);
    expect(sessionXp(stats, "a")).toBe(12 * XP.set + XP.session + XP.fullSession);
    expect(sessionXp(stats, "b")).toBe(11 * XP.set + XP.session + XP.pr);
    expect(sessionXp(stats, "none")).toBe(0);
    expect(xpTotal(stats)).toBe(23 * 10 + 2 * 40 + 50 + 30);
  });
});

describe("streak details", () => {
  const thisMon = weekOf(NOW);
  const goalWeek = (back: number) => [0, 1, 2].flatMap((d) => workout(thisMon - back * W + d * D + 10 * H, `w${back}d${d}`));

  it("counts this week's training days, not workouts", () => {
    const ev = [...goalWeek(1), ...workout(thisMon + 10 * H, "x1"), ...workout(thisMon + 14 * H, "x2")];
    const st = goalStreak(derive(ev, NOW), profile(), NOW);
    expect(st).toMatchObject({ thisWeek: 1, needed: 2, weeks: 1, daysLeft: 5 });
  });

  it("treats a goal of 0 days as 1", () => {
    const st = goalStreak(derive(goalWeek(1), NOW), profile({ daysPerWeek: 0 }), NOW);
    expect(st.needed).toBe(1);
  });

  it("counts today as free only until the lifter trains", () => {
    const ev = [1, 2].flatMap(goalWeek);
    // Saturday evening, nothing this week: two days left for three needed.
    const sat = thisMon + 5 * D + 18 * H;
    expect(goalStreak(derive(ev, sat), profile(), sat)).toMatchObject({ daysLeft: 2, needed: 3, atRisk: true });
    // Saturday with a goal of 2: two free days is just enough.
    expect(goalStreak(derive(ev, sat), profile({ daysPerWeek: 2 }), sat).atRisk).toBe(false);
    // Trained Saturday morning toward a goal of 3: one free day (Sunday) for two needed.
    const trained = [...ev, ...workout(thisMon + 5 * D + 9 * H, "sat")];
    expect(goalStreak(derive(trained, sat), profile(), sat)).toMatchObject({ needed: 2, atRisk: true });
    // Goal of 2 after training Saturday: one needed, Sunday free.
    expect(goalStreak(derive(trained, sat), profile({ daysPerWeek: 2 }), sat).atRisk).toBe(false);
  });

  it("is never at risk, and never readies a freeze, without a streak", () => {
    const sun = thisMon + 6 * D + 18 * H;
    expect(goalStreak(derive([], sun), profile(), sun)).toMatchObject({ atRisk: false, freezeReady: false, weeks: 0, best: 0 });
  });

  it("readies a held freeze while this week's goal isn't met", () => {
    const ev = Array.from({ length: FREEZE_EVERY }, (_, i) => i + 1).flatMap(goalWeek);
    const st = goalStreak(derive(ev, NOW), profile(), NOW);
    expect(st).toMatchObject({ freezes: 1, freezeReady: true, weeks: FREEZE_EVERY });
    const met = goalStreak(derive([...ev, ...goalWeek(0)], NOW), profile(), NOW);
    expect(met).toMatchObject({ freezeReady: false, needed: 0, weeks: FREEZE_EVERY + 1, best: FREEZE_EVERY + 1 });
  });

  it("keeps the best run after the streak breaks", () => {
    const ev = [6, 5, 4, 1].flatMap(goalWeek);
    expect(goalStreak(derive(ev, NOW), profile(), NOW)).toMatchObject({ weeks: 1, best: 3 });
  });
});

describe("leagues", () => {
  it("move up from 300 XP plus 150 a league, and drop below 100 plus 50 a league", () => {
    expect(LEAGUES.map((_, i) => promoteAt(i))).toEqual([300, 450, 600, 750, 900, 1050, 1200]);
    expect(LEAGUES.map((_, i) => demoteBelow(i))).toEqual([0, 150, 200, 250, 300, 350, 400]);
  });

  it("keep one history row per week from the first workout, and say this week's bars", () => {
    const thisMon = weekOf(NOW);
    const ev = workout(thisMon - 2 * W + 10 * H, "a", 2);
    const stats = derive(ev, NOW);
    const l = league(ev, stats, profile(), NOW);
    expect(l.history.map(([w]) => w)).toEqual([thisMon - 2 * W, thisMon - W, thisMon]);
    expect(l).toMatchObject({ league: "Bronze", index: 0, promoteAt: 300, demoteBelow: 0, weekXp: 0 });
  });

  it("promote after a week over the bar", () => {
    const thisMon = weekOf(NOW);
    // Three workouts of 12 sets: 3 × (120 + 40 + 30) = 570, plus any quests.
    const ev = [0, 1, 2].flatMap((d) => workout(thisMon - W + d * D + 10 * H, `b${d}`, 12));
    const l = league(ev, derive(ev, NOW), profile(), NOW);
    expect(l.index).toBe(1);
    expect(l.promoteAt).toBe(450);
  });
});

describe("bests", () => {
  const early = bench(NOW - 3 * D, "a", 60, 8);

  it("finds the best estimated max before a moment, leaving out the set itself and empty bars", () => {
    const later = bench(NOW - D, "b", 70, 5);
    const ev = [early, later, bench(NOW - 2 * D, "z", 0, 20)];
    expect(bestBefore(ev, "bench-press", NOW - 2 * D)).toBeCloseTo(60 * (1 + 8 / 30), 6);
    expect(bestBefore(ev, "bench-press", NOW)).toBeCloseTo(70 * (1 + 5 / 30), 6);
    expect(bestBefore(ev, "bench-press", NOW, later.id)).toBeCloseTo(60 * (1 + 8 / 30), 6);
    expect(bestBefore(ev, "back-squat", NOW)).toBeNull();
    expect(bestBefore(ev, "bench-press", NOW - 3 * D)).toBeCloseTo(76, 6); // a set at that moment counts
  });

  it("calls a set a best only past the earlier best, with history from another workout", () => {
    const nine = bench(NOW - D, "b", 60, 9);
    expect(isPr([early, nine], nine)).toBe(true);
    expect(isPr([early], bench(NOW - D, "b", 60, 8))).toBe(false); // a tie
    expect(isPr([bench(NOW - 3 * D, "b", 40, 8)], bench(NOW - D, "b", 60, 8))).toBe(false); // same workout only
    expect(isPr([early], bench(NOW - D, "b", 0, 30))).toBe(false);
    expect(isPr([early], bench(NOW - 4 * D, "b", 80, 8))).toBe(false); // nothing before it
  });

  it("says how many reps at a weight would beat the best, within 1 to 30", () => {
    // Best 76 (60 × 8). At 60 kg, 8 reps only ties it, so 9; at 70 kg, 3 reps (77).
    // (Floating point made 30 × (76 / 60 − 1) come out just under 8, so this said 8, a tie, before 2026-11-13.)
    expect(repsForPr([early], "bench-press", 60, NOW)).toBe(9);
    expect(repsForPr([early], "bench-press", 70, NOW)).toBe(3);
    expect(repsForPr([early], "bench-press", 75, NOW)).toBe(1); // 75 × (1 + 1/30) = 77.5
    expect(repsForPr([early], "bench-press", 100, NOW)).toBeNull(); // any set beats it: no hint
    expect(repsForPr([early], "bench-press", 20, NOW)).toBeNull(); // would take more than 30
    expect(repsForPr([early], "bench-press", 0, NOW)).toBeNull();
    expect(repsForPr([early], "back-squat", 60, NOW)).toBeNull();
    expect(repsForPr([early], "db-shrug-hold", 60, NOW)).toBeNull();
  });
});
