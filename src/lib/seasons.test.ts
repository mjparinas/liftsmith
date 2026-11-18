import fs from "node:fs";
import { afterEach, describe, expect, it } from "vitest";

import { makeProfile, makeWorkout } from "@/test/factories";

import { derive } from "./derive";
import { COSMETICS, crateFor, game, rarityOdds } from "./game";
import {
  CHALLENGE_POINTS,
  changeProblem,
  currentSeason,
  DEFAULT_SEASONS,
  drops,
  GOAL_BONUS,
  KITS,
  PRESTIGE_POINTS,
  scheduleProblem,
  seasonGain,
  seasonOwned,
  seasonReminder,
  seasonState,
  seasonWindow,
  setScheduleForTest,
  stillOpen,
  TIER_POINTS,
  tierOf,
  TIERS,
  WEEK_DAY_POINTS,
  weekPoints,
  type SeasonDef,
} from "./seasons";
import { THEME_BY_ID, themeShown, unlockContext, unlocked } from "./themes";
import type { AppEvent } from "./types";

const DAY = 86400_000;
const S1: SeasonDef = { id: "s1", kit: "ember", start: "2026-11-23", weeks: 10 };
const MON = new Date(2026, 10, 23, 18).getTime();
/** A workout on day `d` of the season (0 = its first Monday), one set of squats. */
const workout = (d: number, weight = 100, reps = 5): AppEvent[] =>
  makeWorkout(`w${d}-${weight}`, MON + d * DAY, [{ exerciseId: "back-squat", weight, reps }]);
const state = (events: AppEvent[], now: number, goal = 3) => {
  const p = makeProfile({ daysPerWeek: goal });
  return seasonState(S1, events, derive(events, now), p, now, [S1]);
};

afterEach(() => setScheduleForTest(null));

describe("season points", () => {
  it("shares the week's points over the lifter's own goal, so two days climb as fast as five", () => {
    expect(weekPoints(2, 2, 0, false, false).total).toBe(WEEK_DAY_POINTS + GOAL_BONUS);
    expect(weekPoints(5, 5, 0, false, false).total).toBe(WEEK_DAY_POINTS + GOAL_BONUS);
  });

  it("gives nothing for days past the goal", () => {
    expect(weekPoints(7, 3, 0, false, false).total).toBe(weekPoints(3, 3, 0, false, false).total);
  });

  it("pays the goal bonus twice after a missed week, and doubles the finale", () => {
    expect(weekPoints(3, 3, 0, true, false).goalBonus).toBe(GOAL_BONUS * 2);
    expect(weekPoints(2, 3, 0, true, false).goalBonus).toBe(0);
    expect(weekPoints(3, 3, 1, false, true).total).toBe((WEEK_DAY_POINTS + GOAL_BONUS + 50) * 2);
  });

  it("turns points into tiers and prestige stars", () => {
    expect(tierOf(TIER_POINTS - 1)).toMatchObject({ tier: 0 });
    expect(tierOf(TIER_POINTS * 3 + 10)).toMatchObject({ tier: 3, into: 10, prestige: 0 });
    expect(tierOf(TIERS * TIER_POINTS + PRESTIGE_POINTS * 2 + 5)).toMatchObject({ tier: TIERS, prestige: 2, into: 5 });
  });

  it("reaches the last tier when the goal is met about eight weeks in ten", () => {
    // Meeting the goal also finishes that week's "train your days" quest; the finale week is one of the eight.
    const week = weekPoints(3, 3, 1, false, false).total;
    const best = 7 * week + weekPoints(3, 3, 1, false, true).total + CHALLENGE_POINTS;
    expect(tierOf(best).tier).toBe(TIERS);
    expect(tierOf(5 * (WEEK_DAY_POINTS + GOAL_BONUS)).tier).toBeLessThan(TIERS);
  });
});

describe("a season from the event log", () => {
  it("counts only workouts inside the season, capped at the goal each week", () => {
    const before = makeWorkout("old", MON - 3 * DAY, [{ exerciseId: "back-squat", weight: 90, reps: 5 }]);
    const events = [...before, ...[0, 1, 2, 3, 4].flatMap((d) => workout(d))];
    const s = state(events, MON + 6 * DAY, 3);
    expect(s.status).toBe("live");
    expect(s.weeks).toHaveLength(1);
    expect(s.weeks[0]!.days).toBe(5);
    expect(s.weeks[0]!.dayPoints).toBe(WEEK_DAY_POINTS);
    expect(s.weeks[0]!.goalBonus).toBe(GOAL_BONUS);
  });

  it("is upcoming before its first day and ended after its last", () => {
    expect(state([], MON - 2 * DAY).status).toBe("upcoming");
    expect(state([], MON + 70 * DAY + DAY).status).toBe("ended");
  });

  it("gives the Pro bonus row only with Pro in one of the season's months", () => {
    const events = Array.from({ length: 30 }, (_, i) => workout(Math.floor(i / 3) * 7 + (i % 3) * 2)).flat();
    const end = MON + 71 * DAY;
    const free = state(events, end);
    expect(free.tier).toBe(TIERS);
    expect(free.rewards.filter((r) => r.pro).every((r) => !r.owned)).toBe(true);
    expect(free.rewards.filter((r) => !r.pro).every((r) => r.owned)).toBe(true);
    const pro: AppEvent = { type: "pro", id: "pro-2026-12", at: new Date(2026, 11, 3).getTime(), month: "2026-12" };
    expect(state([...events, pro], end).rewards.every((r) => r.owned)).toBe(true);
  });

  it("keeps season rewards after the season ends, and stops offering ones not earned", () => {
    setScheduleForTest([S1]);
    const events = Array.from({ length: 12 }, (_, i) => workout(Math.floor(i / 3) * 7 + (i % 3) * 2)).flat();
    const later = MON + 200 * DAY;
    const owned = seasonOwned(events, derive(events, later), makeProfile({ daysPerWeek: 3 }), later, [S1]);
    expect(owned.items.has("av-ember")).toBe(true);
    expect(owned.badges.map((b) => b.tier)).toContain("bronze");
    expect(stillOpen("accent-ember-pro", later, [S1])).toBe(false);
    expect(stillOpen("accent-ember-pro", MON, [S1])).toBe(true);
  });

  it("unlocks the season theme from the track, and hides it once the season can't be earned", () => {
    setScheduleForTest([S1]);
    const ember = THEME_BY_ID.get("ember")!;
    const none = unlockContext([], derive([], MON + 200 * DAY), makeProfile(), MON + 200 * DAY);
    expect(unlocked(ember, none)).toBe(false);
    expect(themeShown(ember, none)).toBe(false);
    const during = unlockContext([], derive([], MON), makeProfile(), MON);
    expect(themeShown(ember, during)).toBe(true);
    const events = Array.from({ length: 30 }, (_, i) => workout(Math.floor(i / 3) * 7 + (i % 3) * 2)).flat();
    const after = unlockContext(events, derive(events, MON + 200 * DAY), makeProfile({ daysPerWeek: 3 }), MON + 200 * DAY);
    expect(unlocked(ember, after)).toBe(true);
    expect(themeShown(ember, after)).toBe(true);
  });

  it("drops the rare item from a new best the same way on every device", () => {
    expect(drops("s1", "back-squat", 123)).toBe(drops("s1", "back-squat", 123));
    let hits = 0;
    for (let i = 0; i < 600; i++) if (drops("s1", "bench", i * 1000)) hits++;
    expect(hits).toBeGreaterThan(60);
    expect(hits).toBeLessThan(140);
  });

  it("counts new bests and new exercises for the season challenges", () => {
    const events = [
      ...makeWorkout("old", MON - 3 * DAY, [{ exerciseId: "back-squat", weight: 90, reps: 5 }]),
      ...workout(0, 100),
      ...workout(2, 110),
      ...makeWorkout("new", MON + 4 * DAY, [{ exerciseId: "bench-press", weight: 60, reps: 5 }]),
    ];
    const s = state(events, MON + 5 * DAY);
    expect(s.challenges.find((c) => c.id === "prs")!.have).toBe(2);
    expect(s.challenges.find((c) => c.id === "new-ex")!.have).toBe(1);
  });

  it("shows the next season two weeks before it starts and nothing long after", () => {
    const p = makeProfile();
    expect(currentSeason([], derive([], MON - 10 * DAY), p, MON - 10 * DAY, [S1])?.status).toBe("upcoming");
    expect(currentSeason([], derive([], MON - 30 * DAY), p, MON - 30 * DAY, [S1])).toBeNull();
    expect(currentSeason([], derive([], MON + 100 * DAY), p, MON + 100 * DAY, [S1])).toBeNull();
  });
});

describe("the schedule", () => {
  it("accepts the built-in season 1", () => {
    expect(scheduleProblem(DEFAULT_SEASONS)).toBeNull();
    const w = seasonWindow(S1);
    expect(Math.round((w.end - w.start) / DAY)).toBe(70);
  });

  it("refuses a bad schedule", () => {
    expect(scheduleProblem([{ ...S1, start: "2026-11-24" }])).toMatch(/Monday/);
    expect(scheduleProblem([{ ...S1, weeks: 14 }])).toMatch(/weeks/);
    expect(scheduleProblem([{ ...S1, kit: "nope" }])).toMatch(/reward set/);
    expect(scheduleProblem([S1, { ...S1, id: "s2" }])).toMatch(/Two seasons|overlap/);
  });

  it("never changes a season that has started", () => {
    const after = MON + 3 * DAY;
    expect(changeProblem([S1], [{ ...S1, weeks: 12 }], after)).toMatch(/started/);
    expect(changeProblem([S1], [], after)).toMatch(/started/);
    expect(changeProblem([S1], [{ ...S1, weeks: 12 }], MON - 10 * DAY)).toBeNull();
  });
});

describe("season items", () => {
  it("never come from a crate", () => {
    const season = COSMETICS.filter((c) => c.season);
    expect(season.length).toBeGreaterThan(0);
    for (const c of season) expect(rarityOdds(c.id)).toBe(0);
    for (let i = 0; i < 300; i++) expect(crateFor(`s${i}`).season).toBeUndefined();
  });

  it("every kit reward exists as a Locker item, a theme or a badge tier", () => {
    for (const kit of Object.values(KITS)) {
      expect(COSMETICS.some((c) => c.id === kit.drop)).toBe(true);
      for (const r of kit.rewards) {
        if (r.kind === "item") expect(COSMETICS.some((c) => c.id === r.id && c.season)).toBe(true);
        if (r.kind === "theme") expect(THEME_BY_ID.get(r.id)?.fromSeason).toBe(kit.id);
        if (r.kind === "badge") expect(["bronze", "silver", "gold", "platinum"]).toContain(r.id);
      }
    }
  });

  it("go into the Locker once earned", () => {
    setScheduleForTest([S1]);
    const events = Array.from({ length: 6 }, (_, i) => workout(Math.floor(i / 3) * 7 + (i % 3) * 2)).flat();
    const now = MON + 30 * DAY;
    expect(game(events, derive(events, now), makeProfile({ daysPerWeek: 3 }), now).owned.has("av-ember")).toBe(true);
  });

  it("every theme icon exists on Android and iOS", () => {
    const icons = [...THEME_BY_ID.values()].map((t) => t.icon).filter((i): i is string => !!i);
    const java = fs.readFileSync("android/app/src/main/java/com/getliftsmith/app/AppIconPlugin.java", "utf8");
    const swift = fs.readFileSync("ios/App/App/DelightPlugins.swift", "utf8");
    const manifest = fs.readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");
    const pbx = fs.readFileSync("ios/App/App.xcodeproj/project.pbxproj", "utf8");
    for (const id of icons) {
      expect(java).toContain(`"${id}"`);
      expect(swift).toContain(`"${id}"`);
      if (id === "default") continue;
      expect(manifest).toContain(`.Icon${id[0]!.toUpperCase()}${id.slice(1)}"`);
      expect(pbx).toContain(`AppIcon-${id}`);
      expect(fs.existsSync(`ios/App/App/Assets.xcassets/AppIcon-${id}.appiconset/icon.png`)).toBe(true);
      expect(fs.existsSync(`android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_${id}.xml`)).toBe(true);
    }
  });
});

describe("after a workout (2026-11-18)", () => {
  it("says what the workout added: points, the new tier and the reward it reached", () => {
    const two = [...workout(0), ...workout(2)];
    const three = [...two, ...workout(4)];
    const now = MON + 4 * DAY + 3600_000;
    const gain = seasonGain(state(two, now), state(three, now))!;
    // 2 of 3 days is 400 points (tier 1); the third day, the goal bonus and the weekly quest it finished add 450,
    // tier 2 and its avatar.
    expect(gain).toMatchObject({ points: 200 + GOAL_BONUS + 50, from: 1, to: 2, drop: false });
    expect(gain.rewards.map((r) => r.id)).toEqual(["av-ember"]);
  });

  it("says nothing outside a running season or when nothing moved", () => {
    const ev = [...workout(0)];
    const now = MON + DAY;
    expect(seasonGain(state(ev, now), state(ev, now))).toBeNull();
    expect(seasonGain(state([], MON - 3 * DAY), state(workout(-3), MON - 3 * DAY))).toBeNull();
  });
});

describe("for the reminder planner", () => {
  it("gives the first day, the finale week and the end while it runs or is about to start", () => {
    const r = seasonReminder(state([], MON - 2 * DAY))!;
    const { start, end } = seasonWindow(S1);
    expect(r).toMatchObject({ weeks: 10, start, end, tier: 0 });
    expect(new Date(r.finale).getDay()).toBe(1);
    expect(Math.round((r.finale - start) / (7 * DAY))).toBe(9);
    expect(seasonReminder(state([], end + DAY))).toBeNull();
    expect(seasonReminder(null)).toBeNull();
  });
});
