import { describe, expect, it } from "vitest";
import { checkinText } from "./buddy";
import { defaultProfile, makeGym } from "./defaults";
import { derive } from "./derive";
import { generate } from "./generator";
import { ghostFor, lastWorkout, paceDelta, paceText, repeatPlan, sameAsLast } from "./ghost";
import { anniversaryYears, crossed, doneMoments, fmtTonnage, todayMoments, tonnage, TONNAGE } from "./moments";
import { fitSize, pairFor, type Photo } from "./photos";
import { changeText, lastLoadedKg, plateChange } from "./plateMemory";
import { monthOf, recap, suggestedPeriod, yearOf } from "./recap";
import { nextSeasonal, SEASONAL, seasonalChallenges } from "./seasonal";
import { ageFactor, percentileOf, scoreOf, strength, twins } from "./strength";
import { activeTheme, newlyUnlocked, THEMES, unlocked } from "./themes";
import type { AppEvent, SetEvent } from "./types";
import { doneCue, exerciseCue, setCue, spokenLoad } from "./voice";
import { DRILLS, warmupRoutine } from "./warmupRoutine";
import { breathPhase, plateQuiz } from "@/components/app/WorkoutExtras";

const D = 86400_000;
const NOW = new Date("2026-11-11T18:00:00").getTime();
let n = 0;
function set(exerciseId: string, at: number, weight: number, reps: number, sessionId = "s1", extra: Partial<SetEvent> = {}): SetEvent {
  return { type: "set", id: `e${n++}`, at, sessionId, exerciseId, weight, reps, targetReps: reps, rir: 2, ...extra };
}
/** One workout of three bench sets at `kg`, `daysAgo` days before NOW. */
function workout(daysAgo: number, kg = 60, id = `w${daysAgo}`): SetEvent[] {
  const t = NOW - daysAgo * D;
  return [0, 1, 2].map((i) => set("bench-press", t + i * 150_000, kg, 8, id));
}

describe("tonnage milestones", () => {
  it("finds the last and next milestone with progress between them", () => {
    expect(tonnage(0)).toMatchObject({ last: null, next: TONNAGE[0], progress: 0 });
    const t = tonnage(7000);
    expect(t.last?.name).toBe("an African elephant");
    expect(t.next?.name).toBe("a T. rex");
    expect(t.progress).toBeCloseTo(0.5);
    expect(tonnage(1e9).next).toBeNull();
  });
  it("reports the biggest milestone crossed by a workout, and none when nothing was crossed", () => {
    expect(crossed(1400, 6100)?.name).toBe("an African elephant");
    expect(crossed(1600, 1700)).toBeNull();
    expect(crossed(1499, 1500)?.name).toBe("a family car");
  });
  it("formats in tonnes or pounds", () => {
    expect(fmtTonnage(152_340, "kg")).toBe("152 t");
    expect(fmtTonnage(1234, "kg")).toBe("1.2 t");
    expect(fmtTonnage(800, "kg")).toBe("800 kg");
    expect(fmtTonnage(1000, "lb")).toBe("2,205 lb");
  });
});

describe("anniversaries and comebacks", () => {
  it("knows the anniversary day, including 29 February", () => {
    const first = new Date("2025-11-11T07:00:00").getTime();
    expect(anniversaryYears(first, NOW)).toBe(1);
    expect(anniversaryYears(first, NOW + D)).toBe(0);
    expect(anniversaryYears(first, first + 100 * D)).toBe(0);
    const leap = new Date("2024-02-29T10:00:00").getTime();
    expect(anniversaryYears(leap, new Date("2025-02-28T10:00:00").getTime())).toBe(1);
    expect(anniversaryYears(leap, new Date("2028-02-29T10:00:00").getTime())).toBe(4);
  });
  it("welcomes the lifter back after two weeks away, not before", () => {
    expect(todayMoments(derive(workout(20), NOW), NOW).map((m) => m.id)).toContain("comeback");
    expect(todayMoments(derive(workout(5), NOW), NOW).map((m) => m.id)).not.toContain("comeback");
    expect(todayMoments(derive([], NOW), NOW)).toEqual([]);
  });
  it("shows the liftiversary on Today", () => {
    const ms = todayMoments(derive([...workout(365), ...workout(3)], NOW), NOW);
    expect(ms.find((m) => m.kind === "anniversary")?.title).toBe("1 year since your first workout");
  });
  it("celebrates a count milestone, a tonnage milestone and a finished comeback after a workout", () => {
    const evs: AppEvent[] = [];
    for (let i = 0; i < 9; i++) evs.push(...workout(60 + i * 2, 60));
    evs.push(...workout(0, 70, "now"));
    const ids = doneMoments(derive(evs, NOW)).map((m) => m.id);
    expect(ids).toContain("count-10");
    expect(ids).toContain("comeback-done");
    // 9 × 1,440 kg = 12,960 kg before, 14,640 kg after: no milestone between 12 t and 30 t.
    expect(ids.some((i) => i.startsWith("tonnage"))).toBe(false);
    expect(doneMoments(derive(workout(0, 30, "x"), NOW)).map((m) => m.id)).toContain("tonnage-500");
  });
});

describe("recap", () => {
  it("sums a month and compares it with the month before", () => {
    const evs = [...workout(1, 60), ...workout(3, 62), ...workout(40, 50)];
    const r = recap(evs, monthOf(NOW), NOW);
    expect(r.workouts).toBe(2);
    expect(r.sets).toBe(6);
    expect(r.volumeKg).toBe(3 * 8 * 60 + 3 * 8 * 62);
    expect(r.topExercise?.id).toBe("bench-press");
    expect(r.topMuscle?.muscle).toBe("chest");
    expect(r.prs.map((p) => p.exerciseId)).toEqual(["bench-press"]);
    expect(r.volumeChange).toBeCloseTo((2928 / 1200) - 1);
    expect(r.likeA).toBe("a family car");
    expect(r.label).toBe("November 2026");
  });
  it("covers the whole year, and is empty for a year with nothing", () => {
    const evs = [...workout(1), ...workout(200)];
    expect(recap(evs, yearOf(NOW), NOW).workouts).toBe(2);
    expect(recap(evs, yearOf(NOW - 800 * D), NOW).workouts).toBe(0);
  });
  it("offers last month early in a month, the year at year end, otherwise this month", () => {
    expect(suggestedPeriod(new Date("2026-11-03T12:00").getTime())).toMatchObject({ kind: "month", start: new Date(2026, 9, 1).getTime() });
    expect(suggestedPeriod(new Date("2026-12-28T12:00").getTime()).kind).toBe("year");
    expect(suggestedPeriod(new Date("2027-01-04T12:00").getTime())).toMatchObject({ kind: "year", start: new Date(2026, 0, 1).getTime() });
    expect(suggestedPeriod(NOW)).toMatchObject({ kind: "month", start: new Date(2026, 10, 1).getTime() });
  });
});

describe("ghost mode and same as last time", () => {
  const last = [
    set("bench-press", NOW - 2 * D, 60, 8, "a"),
    set("bench-press", NOW - 2 * D + 150_000, 60, 8, "a", { restSec: 120 }),
    set("bench-press", NOW - 2 * D + 300_000, 60, 7, "a", { restSec: 125 }),
  ];
  it("takes the most recent other session of the exercise", () => {
    const g = ghostFor([...last, set("bench-press", NOW, 62.5, 8, "now")], "bench-press", "now")!;
    expect(g.sessionId).toBe("a");
    expect(g.sets.map((s) => [s.reps, s.restSec, s.offset])).toEqual([[8, undefined, 0], [8, 120, 150], [7, 125, 300]]);
    expect(ghostFor(last, "squat")).toBeNull();
  });
  it("rebuilds rest from start times for older sets", () => {
    const old = [set("row", 0, 50, 10, "o"), set("row", 200_000, 50, 10, "o", { startedAt: 170_000 })];
    expect(ghostFor(old, "row")!.sets[1].restSec).toBe(170);
  });
  it("says how far ahead or behind the lifter is", () => {
    const g = ghostFor(last, "bench-press");
    expect(paceDelta(g, [{ at: 0 }])).toBeNull();
    expect(paceDelta(g, [{ at: 0 }, { at: 130_000 }])).toBe(20);
    expect(paceDelta(g, [{ at: 0 }, { at: 200_000 }])).toBe(-50);
    expect(paceText(20)).toBe("0:20 ahead");
    expect(paceText(-65)).toBe("1:05 behind");
    expect(paceText(3)).toBe("level with your ghost");
  });
  it("offers last time's numbers for the same set, or the last one", () => {
    const g = ghostFor(last, "bench-press");
    expect(sameAsLast(g, 2)).toEqual({ weight: 60, reps: 7 });
    expect(sameAsLast(g, 5)).toEqual({ weight: 60, reps: 7 });
    expect(sameAsLast(null, 0)).toBeNull();
  });
  it("repeats the last workout's exercises and sets, keeping progression and the gym's limits", () => {
    const gym = makeGym("commercial", "kg", "g");
    const profile = { ...defaultProfile(NOW), activeGymId: "g", onboarded: true };
    const evs: AppEvent[] = [set("back-squat", NOW - D, 100, 5, "L"), set("back-squat", NOW - D + 1000, 100, 5, "L"), set("bench-press", NOW - D + 2000, 70, 8, "L"), set("leg-press", NOW - 5 * D, 150, 10, "old")];
    expect(lastWorkout(evs)?.items).toEqual([{ exerciseId: "back-squat", sets: 2 }, { exerciseId: "bench-press", sets: 1 }]);
    const base = generate({ gym, profile, events: evs, minutes: 45, now: NOW });
    const p = repeatPlan(base, evs, profile, gym, NOW)!;
    expect(p.items.map((i) => [i.exerciseId, i.sets])).toEqual([["back-squat", 2], ["bench-press", 1]]);
    expect(p.items[0].target.weight).toBeGreaterThan(0);
    const bw = makeGym("bodyweight", "kg", "b");
    expect(repeatPlan(base, evs, profile, bw, NOW)).toBeNull();
  });
});

describe("smart plate memory", () => {
  it("keeps the inside plates and changes only the outside ones", () => {
    expect(plateChange([20, 10, 2.5], [20, 10, 5])).toEqual({ keep: [20, 10], remove: [2.5], add: [5] });
    expect(plateChange([20, 5], [20, 10, 2.5])).toEqual({ keep: [20], remove: [5], add: [10, 2.5] });
    expect(plateChange([20, 10], [20])).toEqual({ keep: [20], remove: [10], add: [] });
    // Taking off removes the outermost first.
    expect(plateChange([25, 10, 5], []).remove).toEqual([5, 10, 25]);
  });
  it("words the change", () => {
    const fmt = (x: number) => String(x);
    expect(changeText(plateChange([20, 2.5], [20, 5]), "kg", fmt)).toBe("Take off 2.5, then add 5 kg each side");
    expect(changeText(plateChange([20], [20, 1.25, 1.25]), "kg", fmt)).toBe("Add 2×1.25 kg each side");
    expect(changeText(plateChange([20], [20]), "kg", fmt)).toBe("Same plates: no change");
  });
  it("knows what's on the bar from the last set or warm-up of the exercise this session", () => {
    const evs = [set("back-squat", 1, 60, 5, "s"), { type: "warmup", id: "w", at: 2, sessionId: "s", exerciseId: "back-squat", weight: 80, reps: 3 }, set("back-squat", 3, 100, 5, "other")];
    expect(lastLoadedKg(evs, "s", "back-squat")).toBe(80);
    expect(lastLoadedKg(evs, "s", "deadlift")).toBeNull();
  });
});

describe("voice coach cues", () => {
  const base = { name: "Bench press", sets: 4, kg: 100, reps: 8, rir: 2, unit: "kg" as const, load: "barbell" };
  it("calls the set, the last set and the challenge set", () => {
    expect(setCue({ ...base, setNo: 2 })).toBe("Set two of four. 100 kilos for 8. two in reserve.");
    expect(setCue({ ...base, setNo: 4, rir: 0 })).toBe("Last set. 100 kilos for 8. Take it close to failure.");
    expect(setCue({ ...base, setNo: 4, challenge: true })).toBe("Challenge set. 100 kilos for 8, as many good reps as you can.");
    expect(setCue({ ...base, setNo: 1, warmup: true })).toBe("Warm-up. 100 kilos for 8.");
  });
  it("says loads the way lifters do", () => {
    expect(spokenLoad(0, "kg", "bodyweight")).toBe("bodyweight");
    expect(spokenLoad(10, "kg", "dumbbell")).toBe("10 kilos each");
    expect(spokenLoad(45.359237, "lb", "barbell")).toBe("100 pounds");
    expect(exerciseCue("Plank", 3, { kg: 0, reps: 30, rir: 2, unit: "kg", load: "bodyweight", timed: true })).toBe("Next up, Plank. three sets of 30 seconds at bodyweight.");
    expect(doneCue(18, 6400, "kg")).toBe("Workout done. 18 sets, 6,400 kilos moved. Great work.");
  });
});

describe("strength score and twins", () => {
  it("scales the score so a typical intermediate is 50", () => {
    expect(scoreOf(1)).toBe(50);
    expect(scoreOf(2)).toBe(75);
    expect(scoreOf(0)).toBe(0);
    expect(percentileOf(1)).toBe(50);
    expect(percentileOf(1.5)).toBeGreaterThan(85);
    expect(percentileOf(0.7)).toBeLessThan(20);
  });
  it("adjusts for age: none in the prime years, more with age", () => {
    expect(ageFactor(30)).toBe(1);
    expect(ageFactor(null)).toBe(1);
    expect(ageFactor(50)).toBeCloseTo(1.12);
    expect(ageFactor(70)).toBeCloseTo(1.49);
    expect(ageFactor(18)).toBeCloseTo(1.05);
  });
  it("scores recent lifts, gives older lifters credit, and ignores bodyweight and old sets", () => {
    const evs = [set("bench-press", NOW - D, 80, 5), set("back-squat", NOW - D, 120, 5), set("push-up", NOW - D, 0, 20), set("deadlift", NOW - 400 * D, 200, 5)];
    const young = strength(evs, { bodyweight: 80, birthYear: 1996 }, NOW);
    const older = strength(evs, { bodyweight: 80, birthYear: 1966 }, NOW);
    expect(young.lifts.map((l) => l.exerciseId).sort()).toEqual(["back-squat", "bench-press"]);
    expect(older.overall!).toBeGreaterThan(young.overall!);
    expect(older.adjusted.age).toBe(true);
    expect(strength(evs, { bodyweight: 80, birthYear: 1966 }, NOW, { adjustAge: false }).overall).toBe(young.overall);
    expect(young.muscles.chest).toBeGreaterThan(0);
    expect(twins(young).map((l) => l.exerciseId)).toEqual(["bench-press", "back-squat"]);
    expect(strength([], { bodyweight: 80 }, NOW).overall).toBeNull();
  });
});

describe("general warm-up", () => {
  it("starts with a pulse raiser, fits the time and covers today's muscles", () => {
    const r = warmupRoutine(["quads", "glutes", "hamstrings"], ["barbell", "rack"], NOW, 5);
    expect(r[0].pulse).toBe(true);
    expect(r.length).toBeGreaterThan(2);
    expect(r.slice(1).some((d) => d.for.includes("quads") || d.for.includes("glutes"))).toBe(true);
    expect(warmupRoutine(["quads"], [], NOW, 5)).toEqual(warmupRoutine(["quads"], [], NOW, 5));
  });
  it("only uses drills the gym can do", () => {
    const r = warmupRoutine(["upperBack", "lats", "rearDelts"], [], NOW, 8);
    expect(r.every((d) => !(d.needs ?? []).length)).toBe(true);
    expect(DRILLS.filter((d) => d.pulse).length).toBeGreaterThan(1);
  });
});

describe("seasonal challenges", () => {
  it("counts progress inside the window only", () => {
    const halloween = new Date("2026-10-28T12:00").getTime();
    const evs = [set("deadlift", halloween - D, 100, 10, "a"), set("deadlift", halloween, 100, 10, "b"), set("deadlift", halloween - 10 * D, 500, 10, "c")];
    const c = seasonalChallenges(evs, halloween).find((x) => x.id === "halloween")!;
    expect(c.progress).toBe(2000);
    expect(c.done).toBe(false);
    expect(c.daysLeft).toBe(4);
    expect(seasonalChallenges(evs, NOW)).toEqual([]);
  });
  it("teases the next one and every window is valid", () => {
    expect(nextSeasonal(NOW)?.def.id).toBe("twelve-days");
    for (const s of SEASONAL) expect(new Date(2026, s.to[0], s.to[1]).getTime()).toBeGreaterThanOrEqual(new Date(2026, s.from[0], s.from[1]).getTime());
  });
});

describe("earned themes", () => {
  const ctx = (events: AppEvent[], goalWeeks = 0, now = NOW) => ({ stats: derive(events, now), goalWeeks, now });
  it("unlocks from milestones, and seasonal themes only in season", () => {
    const empty = ctx([]);
    expect(THEMES.filter((t) => unlocked(t, empty)).map((t) => t.id)).toEqual(["midnight"]);
    expect(unlocked(THEMES.find((t) => t.id === "frost")!, ctx([], 0, new Date("2026-12-05").getTime()))).toBe(true);
    expect(unlocked(THEMES.find((t) => t.id === "aurora")!, ctx([], 8))).toBe(true);
    const heavy = [...workout(1, 600)];
    expect(unlocked(THEMES.find((t) => t.id === "forge")!, ctx(heavy))).toBe(true);
    expect(newlyUnlocked([], ctx(heavy)).map((t) => t.id)).toEqual(["forge"]);
    expect(newlyUnlocked(["forge"], ctx(heavy))).toEqual([]);
  });
  it("falls back to Midnight when a picked theme isn't open", () => {
    expect(activeTheme("frost", ctx([])).id).toBe("midnight");
    expect(activeTheme(undefined, ctx([])).id).toBe("midnight");
  });
  it("keeps text readable on every theme (WCAG AA)", () => {
    const lum = (hex: string) => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    for (const t of THEMES) {
      const p = t.palette;
      for (const bg of [p.bg, p.surface, p.raised]) {
        expect(ratio("#808c9d", bg), `${t.id} faint text`).toBeGreaterThanOrEqual(4.5);
        expect(ratio(p.accent, bg), `${t.id} accent text`).toBeGreaterThanOrEqual(4.5);
      }
      expect(ratio(p.accentInk, p.accent), `${t.id} button text`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("rest extras", () => {
  it("paces breathing in for 4 s and out for 6 s", () => {
    expect(breathPhase(0)).toEqual({ phase: "in", p: 0 });
    expect(breathPhase(2).phase).toBe("in");
    expect(breathPhase(4)).toEqual({ phase: "out", p: 1 });
    expect(breathPhase(10)).toEqual({ phase: "in", p: 0 });
  });
  it("builds plate-math questions from the gym's own plates with one right answer", () => {
    const gym = makeGym("commercial", "kg", "g");
    for (let seed = 1; seed < 40; seed++) {
      const q = plateQuiz(gym, seed);
      expect(q.answer).toBe(q.bar + 2 * q.perSide.reduce((s, x) => s + x, 0));
      expect(new Set(q.options).size).toBe(3);
      expect(q.options).toContain(q.answer);
      expect(q.perSide.every((p) => gym.plates.some((x) => x.weight === p))).toBe(true);
    }
  });
});

describe("buddies and photos", () => {
  it("writes a friendly check-in", () => {
    expect(checkinText({ gym: "Iron Den", focus: ["Chest", "Triceps"], buddies: ["Sam"] })).toBe("Hey Sam! I'm at the gym at Iron Den, training chest and triceps today. Your turn 💪");
    expect(checkinText({ gym: "My gym", buddies: [] })).toBe("I'm at the gym. Your turn 💪");
    expect(checkinText({ buddies: ["A", "B"] })).toMatch(/^Hey crew!/);
  });
  it("shrinks photos and pairs the first and latest of a pose", () => {
    expect(fitSize(4032, 3024)).toEqual({ w: 1440, h: 1080 });
    expect(fitSize(800, 600)).toEqual({ w: 800, h: 600 });
    const ph = (id: string, at: number, pose: Photo["pose"]): Photo => ({ id, at, pose, blob: new Blob(), w: 1, h: 1 });
    const list = [ph("a", 1, "front"), ph("b", 2, "side"), ph("c", 3, "front"), ph("d", 4, "front")];
    expect(pairFor(list, "front")).toMatchObject({ before: { id: "a" }, after: { id: "d" } });
    expect(pairFor(list, "side")).toMatchObject({ before: null, after: { id: "b" } });
    expect(pairFor(list, "back")).toEqual({ before: null, after: null });
  });
});
