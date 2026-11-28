import { describe, expect, it } from "vitest";

import { makeSet, makeSets } from "@/test/factories";

import { COSMETICS, CRATE_KINDS, crateFor, MASTERY_ITEMS, masteryItems, masteryProgress, masteryRuleFor, rarityOdds } from "./game";
import { familySets, liftsWith, mastered, masteryOf, setCounts, starsFor, starsGained } from "./mastery";
import { frameStops } from "./shareImage";
import { parseTitle, titleCode } from "./titles";

const counts = (o: Record<string, number>) => new Map(Object.entries(o));

describe("lift mastery", () => {
  it("gives a star at 25, 100, 300 and 1,000 sets", () => {
    expect([0, 24, 25, 99, 100, 299, 300, 999, 1000, 5000].map(starsFor)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
  });

  it("counts each logged set once, and not a rehab part's", () => {
    const sets = makeSets(3, { exerciseId: "back-squat" });
    const ev = [...sets, { ...sets[0]! }, makeSet({ exerciseId: "back-squat", partId: "rehab" }), makeSet({ exerciseId: "bench-press" })];
    expect(setCounts(ev)).toEqual(counts({ "back-squat": 3, "bench-press": 1 }));
    expect(setCounts(ev, "back-squat")).toEqual(counts({ "back-squat": 3 }));
  });

  it("says how far the next star is", () => {
    expect(masteryOf(counts({ "back-squat": 40 }), "back-squat")).toEqual({
      exerciseId: "back-squat",
      sets: 40,
      stars: 1,
      next: 100,
      from: 25,
    });
    expect(masteryOf(counts({}), "back-squat")).toMatchObject({ stars: 0, next: 25, from: 0 });
    expect(masteryOf(counts({ "back-squat": 1200 }), "back-squat")).toMatchObject({ stars: 4, next: null, from: 1000 });
  });

  it("lists mastered lifts by stars then sets, and the lifts whose stars went up", () => {
    const after = counts({ "back-squat": 120, "bench-press": 330, deadlift: 26, "barbell-row": 10 });
    expect(mastered(after).map((m) => m.exerciseId)).toEqual(["bench-press", "back-squat", "deadlift"]);
    expect(liftsWith(after, 2)).toBe(2);
    const before = counts({ "back-squat": 95, "bench-press": 330, deadlift: 20 });
    expect(starsGained(before, after).map((m) => m.exerciseId)).toEqual(["back-squat", "deadlift"]);
  });

  it("adds sets to the family of each lift's first main muscle, and none for cardio", () => {
    const f = familySets(counts({ "bench-press": 10, "back-squat": 20, "not-an-exercise": 99 }));
    expect(f.push).toBe(10);
    expect(f.legs).toBe(20);
    expect(f.pull + f.core).toBe(0);
  });
});

describe("mastery unlocks", () => {
  it("earn figure colours and titles from stars and family sets", () => {
    expect(masteryItems(counts({}))).toEqual([]);
    expect(masteryItems(counts({ "back-squat": 1000 }))).toEqual(
      expect.arrayContaining(["fig-violet", "fig-gold", "fig-platinum", "title-master"]),
    );
    expect(masteryItems(counts({ "back-squat": 100 }))).toContain("title-devotee");
    expect(masteryItems(counts({ "back-squat": 100 }))).not.toContain("fig-mint");
    expect(masteryItems(counts({ "back-squat": 100, "bench-press": 100, deadlift: 100 }))).toContain("fig-mint");
    expect(masteryProgress(masteryRuleFor("fig-mint")!, counts({ "back-squat": 100 }))).toEqual([1, 3]);
  });

  it("are all real locker items, never in a crate, and crates hold only what they always did", () => {
    for (const m of MASTERY_ITEMS) {
      expect(COSMETICS.some((c) => c.id === m.id)).toBe(true);
      expect(rarityOdds(m.id)).toBe(0);
    }
    expect([...CRATE_KINDS]).toEqual(["accent", "sound", "plates"]);
    for (let i = 0; i < 300; i++) expect(CRATE_KINDS).toContain(crateFor(`m${i}`).kind);
  });
});

describe("profile titles", () => {
  it("read only the saved shapes", () => {
    expect(parseTitle("title-early")).toEqual({ id: "title-early" });
    expect(parseTitle("title-master:back-squat")).toEqual({ id: "title-master", lift: "back-squat" });
    for (const bad of [
      "title-master",
      "title-early:back-squat",
      "title-master:nope",
      "title-x",
      "title-master:back-squat:x",
      4,
      null,
      "a".repeat(90),
    ])
      expect(parseTitle(bad)).toBeNull();
    expect(titleCode({ id: "title-devotee", lift: "deadlift" })).toBe("title-devotee:deadlift");
  });
});

describe("share card frames", () => {
  it("draw only from two or more colours", () => {
    expect(frameStops("")).toEqual([]);
    expect(frameStops("#ffffff")).toEqual([]);
    expect(frameStops("#6b7686,#c3ccd8")).toEqual(["#6b7686", "#c3ccd8"]);
    for (const c of COSMETICS.filter((x) => x.kind === "frame" && x.id !== "frame-none"))
      expect(frameStops(c.value).length).toBeGreaterThan(1);
  });
});
