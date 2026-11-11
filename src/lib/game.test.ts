import { describe, expect, it } from "vitest";

import { makeSet } from "@/test/factories";

import { ACHIEVEMENTS, achievements, achName, BADGE_COUNT, context, shareIds, shareName, unlocked } from "./achievements";
import { defaultProfile } from "./defaults";
import { derive, weekOf } from "./derive";
import {
  BADGE_ITEMS,
  badgeForItem,
  COSMETICS,
  crateFor,
  crates,
  game,
  goalStreak,
  isPr,
  league,
  LEAGUE_LABEL,
  LEAGUES,
  LEVEL_ITEMS,
  levelAt,
  levelForItem,
  levelOf,
  levelRewards,
  MAX_FREEZES,
  nextReward,
  owned,
  questsFor,
  rarityOdds,
  repsForPr,
  STARTER,
  TITLE_LEVELS,
  xpTotal,
} from "./game";
import { setLanguage } from "./i18n";
import type { AppEvent, SetEvent } from "./types";

// Wednesday evening.
const NOW = new Date("2026-11-11T18:00:00").getTime();
const H = 3600_000;
const D = 24 * H;
const W = 7 * D;
const profile = (over = {}) => ({ ...defaultProfile(NOW), onboarded: true, activeGymId: "g", daysPerWeek: 3, bodyweight: 80, ...over });

function set(exerciseId: string, at: number, weight: number, reps: number, sessionId: string, extra: Partial<SetEvent> = {}): SetEvent {
  return makeSet({ at, sessionId, exerciseId, weight, reps, ...extra });
}
/** A workout of `k` bench sets at `at`. */
function workout(at: number, id: string, k = 3, weight = 60, reps = 8): SetEvent[] {
  return Array.from({ length: k }, (_, i) => set("bench-press", at + i * 60_000, weight, reps, id));
}
/** Three workouts (Mon, Tue, Wed) in the week `back` weeks before this one. */
function goalWeek(back: number): SetEvent[] {
  const mon = weekOf(NOW) - back * W;
  return [0, 1, 2].flatMap((d) => workout(mon + d * D + 10 * H, `w${back}d${d}`));
}

describe("levels", () => {
  it("climb on a curve and keep the old titles", () => {
    expect(levelOf(0)).toMatchObject({ level: 1, title: "Rookie" });
    expect(levelOf(600).title).toBe("Regular");
    expect(levelAt(2)).toBeLessThan(levelAt(3));
    expect(levelOf(levelAt(10)).level).toBe(10);
    expect(levelOf(levelAt(10) - 1).level).toBe(9);
    expect(levelOf(10_000_000)).toMatchObject({ level: 50, next: null });
  });
  it("names the next title when one starts at the next level", () => {
    expect(levelOf(levelAt(3)).next).toBe("Regular");
    expect(levelOf(levelAt(4)).next).toBe("Level 5");
  });
});

describe("streak with freezes", () => {
  it("counts goal weeks, and this week once met", () => {
    const ev = [1, 2, 3].flatMap(goalWeek);
    const st = goalStreak(derive(ev, NOW), profile(), NOW);
    expect(st.weeks).toBe(3);
    expect(st.freezes).toBe(0);
    expect(goalStreak(derive([...ev, ...goalWeek(0)], NOW), profile(), NOW).weeks).toBe(4);
  });
  it("earns a freeze every 4 goal weeks and spends it on a missed week", () => {
    // Weeks 6..3 met (earns one freeze), week 2 missed (frozen), week 1 met.
    const ev = [6, 5, 4, 3, 1].flatMap(goalWeek);
    const st = goalStreak(derive(ev, NOW), profile(), NOW);
    expect(st.weeks).toBe(5);
    expect(st.frozen).toEqual([weekOf(NOW) - 2 * W]);
    expect(st.freezes).toBe(0);
  });
  it("breaks without a freeze", () => {
    const ev = [5, 4, 2, 1].flatMap(goalWeek);
    expect(goalStreak(derive(ev, NOW), profile(), NOW).weeks).toBe(2);
    expect(goalStreak(derive(ev, NOW), profile(), NOW).best).toBe(2);
  });
  it("holds at most two freezes", () => {
    const ev = Array.from({ length: 16 }, (_, i) => i + 1).flatMap(goalWeek);
    expect(goalStreak(derive(ev, NOW), profile(), NOW).freezes).toBe(MAX_FREEZES);
  });
  it("flags a streak at risk when the days left can't meet the goal", () => {
    const ev = [3, 2, 1].flatMap(goalWeek);
    // Sunday evening with nothing this week: one day left, three needed.
    const sun = weekOf(NOW) + 6 * D + 18 * H;
    const st = goalStreak(derive(ev, sun), profile(), sun);
    expect(st).toMatchObject({ needed: 3, daysLeft: 1, atRisk: true });
    // Wednesday: five days left.
    expect(goalStreak(derive(ev, NOW), profile(), NOW).atRisk).toBe(false);
  });
});

describe("achievements", () => {
  it("have unique ids, tiers that rise, and a lot of badges", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(50);
    expect(BADGE_COUNT).toBeGreaterThan(120);
    for (const a of ACHIEVEMENTS) {
      expect(a.tiers.length).toBeGreaterThan(0);
      expect(a.tiers.length).toBeLessThanOrEqual(4);
      for (let i = 1; i < a.tiers.length; i++) expect(a.tiers[i], a.id).toBeGreaterThan(a.tiers[i - 1]);
    }
    expect(ACHIEVEMENTS.filter((a) => a.secret).length).toBeGreaterThanOrEqual(10);
  });
  it("have catalogue names that match the table in English, and translate", () => {
    for (const a of ACHIEVEMENTS) expect(achName(a.id), a.id).toBe(a.name);
    const ev = workout(NOW - D, "a");
    const list = achievements(context(ev, derive(ev, NOW), profile(), 0));
    expect(list.find((a) => a.id === "workouts")!.detail).toBe("Finish 1 workout");
    expect(list.find((a) => a.id === "workouts")!.next!.detail).toBe("Finish 25 workouts");
    setLanguage("fr");
    try {
      expect(list.length).toBeGreaterThan(0);
      const fr = achievements(context(ev, derive(ev, NOW), profile(), 0));
      expect(fr.find((a) => a.id === "workouts")!.name).toBe("Toujours là");
      expect(fr.find((a) => a.secret && a.hidden)!.name).toBe("Succès secret");
      expect(levelOf(0).title).toBe("Débutant");
      expect(LEAGUE_LABEL.Gold).toBe("Or");
      expect(COSMETICS.find((c) => c.id === "plates-black")!.name).toBe("Noir mat");
      expect(questsFor([], profile(), weekOf(NOW))[0].title).toMatch(/^Entraînez-vous/);
    } finally {
      setLanguage("system");
    }
  });
  it("show progress toward the next tier", () => {
    const ev = workout(NOW - D, "a");
    const stats = derive(ev, NOW);
    const list = achievements(context(ev, stats, profile(), 0));
    const w = list.find((a) => a.id === "workouts")!;
    expect(w).toMatchObject({ tier: "bronze", level: 1, next: { tier: "silver", at: 25 } });
    expect(w.progress).toBeCloseTo(0, 5);
    const sets = list.find((a) => a.id === "sets")!;
    expect(sets.tier).toBeNull();
    expect(sets.progress).toBeCloseTo(0.03, 5);
  });
  it("keep secret ones hidden until earned", () => {
    const ev = workout(NOW - D, "a");
    const stats = derive(ev, NOW);
    const hidden = achievements(context(ev, stats, profile(), 0)).find((a) => a.id === "century")!;
    expect(hidden).toMatchObject({ hidden: true, name: "Secret achievement", icon: "❔" });
    const ev2 = [...ev, set("bench-press", NOW - D + 600_000, 100, 1, "a")];
    const shown = achievements(context(ev2, derive(ev2, NOW), profile(), 0)).find((a) => a.id === "century")!;
    expect(shown).toMatchObject({ hidden: false, name: "Century", tier: "gold" });
  });
  it("count plate clubs in pounds or kilos, whichever is kinder", () => {
    const ev = [set("bench-press", NOW - D, 60, 5, "a"), set("back-squat", NOW - D, 102.1, 3, "a")];
    const list = achievements(context(ev, derive(ev, NOW), profile(), 0));
    expect(list.find((a) => a.id === "bench-plates")!.value).toBe(1);
    expect(list.find((a) => a.id === "squat-plates")!.value).toBe(2);
  });
  it("report tiers unlocked by a workout", () => {
    const before = workout(NOW - 2 * D, "a");
    const after = [...before, ...workout(NOW - D, "b", 3, 70, 8)];
    const p = profile();
    const a0 = achievements(context(before, derive(before, NOW), p, 0));
    const a1 = achievements(context(after, derive(after, NOW), p, 0));
    expect(unlocked(a0, a1).map((u) => u.a.id)).toContain("prs");
  });
  it("round-trip through share ids", () => {
    const ev = workout(NOW - D, "a");
    const ids = shareIds(achievements(context(ev, derive(ev, NOW), profile(), 0)));
    expect(ids).toContain("workouts.bronze");
    expect(shareName("workouts.bronze")).toContain("Showing up");
    expect(shareName("nope.gold")).toBeNull();
    expect(shareName("workouts.wood")).toBeNull();
  });
  it("reward easy days, never training through fatigue", () => {
    const start: AppEvent = { type: "sessionStart", id: "st", at: NOW - D, sessionId: "a", gymId: "g", minutes: 45, call: "recover" };
    const ev = [start, ...workout(NOW - D, "a")];
    const list = achievements(context(ev, derive(ev, NOW), profile(), 0));
    expect(list.find((a) => a.id === "easy-days")!.level).toBe(1);
  });
});

describe("quests", () => {
  it("are three a week, always include the goal days, and are the same on every device", () => {
    const q = questsFor([], profile(), weekOf(NOW));
    expect(q).toHaveLength(3);
    expect(q[0]).toMatchObject({ id: "days", goal: 3, have: 0 });
    expect(questsFor([], profile(), weekOf(NOW)).map((x) => x.id)).toEqual(q.map((x) => x.id));
    const weeks = new Set(
      Array.from({ length: 8 }, (_, i) =>
        questsFor([], profile(), weekOf(NOW) - i * W)
          .map((x) => x.id)
          .join(),
      ),
    );
    expect(weeks.size).toBeGreaterThan(1);
  });
  it("track progress and never ask for more days than the goal", () => {
    const ev = goalWeek(0);
    const q = questsFor(ev, profile(), weekOf(NOW))[0];
    expect(q).toMatchObject({ have: 3, done: true });
    const more = [...ev, ...workout(NOW + 2 * H, "extra")];
    expect(questsFor(more, profile(), weekOf(NOW))[0].have).toBe(3);
  });
  it("add their XP to the total", () => {
    const ev = goalWeek(0);
    const stats = derive(ev, NOW);
    expect(game(ev, stats, profile(), NOW).xp).toBeGreaterThan(xpTotal(stats) + 150 - 1);
  });
});

describe("leagues", () => {
  it("start in Bronze and move up after a big week", () => {
    expect(league([], derive([], NOW), profile(), NOW).league).toBe("Bronze");
    const ev = goalWeek(1);
    const st = league(ev, derive(ev, NOW), profile(), NOW);
    expect(st.history.at(-1)![1]).toBe(st.index);
    expect(st.league).toBe(LEAGUES[1]);
  });
  it("drop a league after an empty week, unless a freeze covered it", () => {
    // Promoted after week 3, then nothing last week: back to Bronze.
    const ev = [3, 2].flatMap(goalWeek);
    expect(league(ev, derive(ev, NOW), profile(), NOW).history.map((h) => h[1])).toEqual([0, 1, 1, 0]);
    // With four goal weeks banked a freeze covers the empty week, and the league holds.
    const frozen = [6, 5, 4, 3, 2].flatMap(goalWeek);
    const st = league(frozen, derive(frozen, NOW), profile(), NOW);
    expect(st.index).toBe(st.history.at(-2)![1]);
  });
});

describe("crates", () => {
  it("are picked from the session id and turn repeats into XP", () => {
    expect(crateFor("abc")).toEqual(crateFor("abc"));
    const ids = Array.from({ length: 200 }, (_, i) => crateFor(`s${i}`).rarity);
    expect(ids.filter((r) => r === "common").length).toBeGreaterThan(ids.filter((r) => r === "legendary").length);
    for (const id of STARTER) expect(COSMETICS.some((c) => c.id === id)).toBe(true);
    const ev = Array.from({ length: 30 }, (_, i) => workout(NOW - (i + 1) * D, `c${i}`, 1)).flat();
    const stats = derive(ev, NOW);
    const list = crates(stats);
    expect(list).toHaveLength(30);
    expect(list.some((c) => c.duplicate)).toBe(true);
    expect(owned(stats).size).toBeGreaterThan(STARTER.length);
  });
});

describe("level rewards", () => {
  it("give a set item at some levels and a bonus crate with each new title", () => {
    expect(levelRewards(4)).toHaveLength(1);
    expect(levelRewards(4)[0]).toMatchObject({ level: 4, source: "crate" });
    expect(levelRewards(5).map((r) => r.key)).toEqual(["crate:4", "item:5"]);
    expect(levelForItem("accent-gold")).toBe(25);
    expect(levelForItem("accent-teal")).toBeNull();
    expect(levelRewards(50)).toHaveLength(LEVEL_ITEMS.length + TITLE_LEVELS.length);
    // Every legendary has a sure path: a level, or a badge.
    for (const c of COSMETICS.filter((c) => c.rarity === "legendary")) expect(levelForItem(c.id) ?? badgeForItem(c.id)).not.toBeNull();
    expect(nextReward(4)).toMatchObject({ level: 5, source: "item" });
    expect(nextReward(50)).toBeNull();
  });

  it("are owned once the level is reached, and a repeat still turns into XP", () => {
    const ev = Array.from({ length: 40 }, (_, i) => workout(NOW - (i + 1) * D, `r${i}`, 12)).flat();
    const stats = derive(ev, NOW);
    const g = game(ev, stats, profile(), NOW);
    expect(g.level.level).toBeGreaterThanOrEqual(10);
    expect(g.rewards).toEqual(levelRewards(g.level.level));
    for (const r of g.rewards) expect(g.owned.has(r.item.id)).toBe(true);
    expect(g.next?.level).toBeGreaterThan(g.level.level);
    // XP counts one repeat for every prize beyond the distinct items won.
    const won = [...crates(stats).map((c) => c.item.id), ...g.rewards.map((r) => r.item.id)];
    const base = game(ev, stats, profile(), NOW).xp - (won.length - new Set(won).size) * 25;
    expect(base).toBeGreaterThan(0);
    expect(g.level).toEqual(levelOf(g.xp));
  });

  it("show the odds of each item per crate", () => {
    const pool = COSMETICS.filter((c) => !STARTER.includes(c.id) && !badgeForItem(c.id));
    expect(pool.reduce((t, c) => t + rarityOdds(c.id), 0)).toBeCloseTo(1);
    expect(rarityOdds("accent-blue")).toBe(0);
    expect(rarityOdds("accent-teal")).toBeGreaterThan(rarityOdds("accent-gold"));
  });
});

describe("Pro rewards", () => {
  const pro = (month: string): AppEvent => ({ type: "pro", id: `pro-${month}`, at: NOW, month });
  const proAch = (ev: AppEvent[]) => game(ev, derive(ev, NOW), profile(), NOW).achievements.find((a) => a.id === "pro")!;

  it("count the months with Pro, once each, and stay earned after Pro ends", () => {
    expect(proAch([])).toMatchObject({ level: 0, tier: null, hidden: false });
    expect(proAch([pro("2026-11"), { ...pro("2026-11") }])).toMatchObject({ value: 1, tier: "bronze" });
    expect(proAch(["2026-09", "2026-10", "2026-11"].map(pro))).toMatchObject({ value: 3, tier: "silver" });
  });

  it("bring the Pro accent at silver, never from a crate, so old crates keep what they held", () => {
    const one = [pro("2026-11")];
    const three = ["2026-09", "2026-10", "2026-11"].map(pro);
    expect(game(one, derive(one, NOW), profile(), NOW).owned.has("accent-pro")).toBe(false);
    expect(game(three, derive(three, NOW), profile(), NOW).owned.has("accent-pro")).toBe(true);
    for (const b of BADGE_ITEMS) expect(rarityOdds(b.id)).toBe(0);
    expect(Array.from({ length: 2000 }, (_, i) => crateFor(`s${i}`).id)).not.toContain("accent-pro");
  });
});

describe("PR moments", () => {
  it("celebrate a set that beats every earlier best, but not a first-ever session", () => {
    const old = workout(NOW - 3 * D, "a", 2, 80, 5);
    const first = set("bench-press", NOW - 3 * D + 10 * 60_000, 85, 5, "a");
    expect(isPr([...old, first], first)).toBe(false);
    const pr = set("bench-press", NOW, 85, 5, "b");
    expect(isPr([...old, pr], pr)).toBe(true);
    const meh = set("bench-press", NOW, 80, 4, "b");
    expect(isPr([...old, meh], meh)).toBe(false);
  });
  it("say how many reps would beat the best at a weight", () => {
    const old = workout(NOW - 3 * D, "a", 1, 100, 5);
    expect(repsForPr(old, "bench-press", 100, NOW)).toBe(6);
    expect(repsForPr(old, "squat", 100, NOW)).toBeNull();
    expect(repsForPr(old, "bench-press", 0, NOW)).toBeNull();
  });
});

describe("achievement text", () => {
  it("describes the tier reached, and the next one separately", () => {
    const ev = workout(NOW - D, "a");
    const w = achievements(context(ev, derive(ev, NOW), profile(), 0)).find((a) => a.id === "workouts")!;
    expect(w.detail).toBe("Finish 1 workout");
    expect(w.next?.detail).toBe("Finish 25 workouts");
  });
});
