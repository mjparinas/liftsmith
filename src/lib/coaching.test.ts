import { describe, expect, it } from "vitest";
import { setLanguage } from "./i18n";
import { equipmentTips, loadableTotals, plateTips } from "./buying";
import { defaultProfile, makeGym } from "./defaults";
import { exercise } from "./exercises";
import { explain } from "./explain";
import { generate, type PlanItem } from "./generator";
import { forecast, observedRate, project, testDay, TYPICAL_MONTHLY } from "./goals";
import { presetLabels, settingsLine, withSettings } from "./machineSettings";
import { applyFixes, findPlateaus, fixResult, startFix } from "./plateau";
import { target } from "./progression";
import { adaptRemix, decodeRemix, encodeRemix, encodeShared, remixUrl, sharedFromSession } from "./remix";
import { doLater, fitToTime, remainingSeconds } from "./replan";
import type { AppEvent, Profile, SetEvent } from "./types";
import { makeSet } from "@/test/factories";

const NOW = new Date("2026-11-11T18:00:00").getTime();
const DAY = 86400_000;
const gym = makeGym("commercial", "kg", "g");

function profile(p: Partial<Profile> = {}): Profile {
  // Block started long enough ago that NOW isn't a deload week by accident.
  return { ...defaultProfile(NOW), onboarded: true, activeGymId: "g", blockStart: NOW - 2 * DAY, ...p };
}

function set(exerciseId: string, at: number, weight: number, reps: number, extra: Partial<SetEvent> = {}): SetEvent {
  return makeSet({ at, sessionId: `s${at}`, exerciseId, weight, reps, ...extra });
}
/** Three sets per session on the given days ago, with weights from `w(i)`. */
function sessions(exerciseId: string, daysAgo: number[], w: (i: number) => number, reps = 5, extra: Partial<SetEvent> = {}): SetEvent[] {
  return daysAgo.flatMap((d, i) => [0, 1, 2].map((k) => set(exerciseId, NOW - d * DAY + k * 60_000, w(i), reps, extra)));
}

describe("explain every number", () => {
  it("explains a first session from body weight and experience", () => {
    const ex = exercise("bench-press");
    const p = profile();
    const t = target(ex, [], p, gym, NOW);
    const why = explain({ ex, target: t, events: [], profile: p, gym, now: NOW });
    expect(why.title).toMatch(/cautious/i);
    expect(why.lines.join(" ")).toMatch(/body weight/);
    expect(why.lines.join(" ")).toMatch(/2\.5 kg steps/);
  });
  it("names last session's sets and the rule that applied", () => {
    const ex = exercise("bench-press");
    const p = profile({ goal: "muscle" });
    const evs = [set(ex.id, NOW - 3 * DAY, 60, 8, { sessionId: "a" }), set(ex.id, NOW - 3 * DAY + 1, 60, 8, { sessionId: "a" })];
    const t = target(ex, evs, p, gym, NOW);
    const why = explain({ ex, target: t, events: evs, profile: p, gym, now: NOW });
    expect(why.lines[0]).toMatch(/60 kg × 8, 60 kg × 8/);
    expect(why.lines.join(" ")).toMatch(/one more rep/);
    expect(why.lines.join(" ")).toMatch(/in reserve/);
  });
  it("explains a big miss and an easy day", () => {
    const ex = exercise("bench-press");
    const p = profile();
    const evs = [set(ex.id, NOW - 3 * DAY, 80, 3, { targetReps: 5, sessionId: "a" })];
    const t = target(ex, evs, p, gym, NOW);
    const why = explain({ ex, target: t, events: evs, profile: p, gym, now: NOW, call: "recover", readiness: 30 });
    const text = why.lines.join(" ");
    expect(text).toMatch(/fell 2 or more reps short/);
    expect(text).toMatch(/easy day \(readiness 30\)/);
  });
  it("adds why.ts's reasons for the exercise and the set count", () => {
    const ex = exercise("bench-press");
    const p = profile();
    const t = target(ex, [], p, gym, NOW);
    const item = { pick: "Chest 96% recovered, 4 of 12 sets this week", sets: "5 sets, your setting", load: t.note, short: "" };
    const why = explain({ ex, target: t, events: [], profile: p, gym, now: NOW, item });
    expect(why.lines[0]).toBe("Picked today: Chest 96% recovered, 4 of 12 sets this week.");
    expect(why.lines).toContain("5 sets, your setting.");
  });
  it("leaves out the workout in progress", () => {
    const ex = exercise("bench-press");
    const p = profile();
    const evs = [set(ex.id, NOW - 60_000, 70, 5, { sessionId: "now" })];
    const why = explain({ ex, target: target(ex, [], p, gym, NOW), events: evs, profile: p, gym, now: NOW, sessionId: "now" });
    expect(why.title).toMatch(/cautious/i);
  });
});

describe("re-plan mid-workout", () => {
  const plan = generate({ gym, profile: profile(), events: [], minutes: 60, now: NOW });
  it("fits the rest into the minutes left, trimming small exercises first", () => {
    const before = remainingSeconds(plan.items, 0, 0);
    const fit = fitToTime(plan.items, 0, 0, 20);
    expect(remainingSeconds(fit.items, 0, 0)).toBeLessThanOrEqual(Math.max(20 * 60, remainingSeconds(fit.items.slice(0, 1), 0, 0)));
    expect(remainingSeconds(fit.items, 0, 0)).toBeLessThan(before);
    // The first (biggest) lift is never removed.
    expect(fit.items[0].exerciseId).toBe(plan.items[0].exerciseId);
    expect(fit.changes.length).toBeGreaterThan(0);
  });
  it("never cuts the current exercise below the sets already done plus one", () => {
    const fit = fitToTime(plan.items, 0, 3, 1);
    expect(fit.items[0].sets).toBeGreaterThanOrEqual(Math.min(4, plan.items[0].sets));
    expect(fit.items.length).toBe(1);
  });
  it("leaves the plan alone when it already fits", () => {
    const fit = fitToTime(plan.items, 0, 0, 300);
    expect(fit.items).toEqual(plan.items);
    expect(fit.changes).toEqual(["Everything still fits."]);
  });
  it("moves a busy exercise after the next one", () => {
    const items = plan.items;
    const later = doLater(items, 0);
    expect(later[1].exerciseId).toBe(items[0].exerciseId);
    expect(later[0].exerciseId).toBe(items[1].exerciseId);
    expect(doLater(items, items.length - 1)).toEqual(items);
  });
});

describe("plateau detective", () => {
  const bench = "bench-press";
  it("finds a lift with no new best for three weeks and names the cause", () => {
    // Climbs, then sits at the same weight for five weeks with missed reps.
    const climb = sessions(bench, [70, 63, 56, 49], (i) => 70 + i * 2.5);
    const stuck = sessions(bench, [38, 31, 24, 17, 10, 3], () => 77.5, 4, { targetReps: 6 });
    const p = profile();
    const found = findPlateaus([...climb, ...stuck], p, NOW);
    expect(found).toHaveLength(1);
    expect(found[0].weeks).toBeGreaterThanOrEqual(3);
    expect(found[0].causes[0].kind).toBe("missed");
    expect(found[0].fix).toBe("reset");
  });
  it("leaves a lift that's still improving alone", () => {
    const climb = sessions(bench, [42, 35, 28, 21, 14, 7, 1], (i) => 60 + i * 2.5);
    expect(findPlateaus(climb, profile(), NOW)).toEqual([]);
  });
  it("applies a running fix to the plan and checks whether it worked", () => {
    const climb = sessions(bench, [70, 63, 56, 49], (i) => 70 + i * 2.5);
    const stuck = sessions(bench, [38, 31, 24, 17, 10, 3], () => 77.5, 5);
    const events: AppEvent[] = [...climb, ...stuck];
    const p = profile();
    const [stall] = findPlateaus(events, p, NOW);
    const fix = startFix(stall, "volume", gym, NOW);
    const item: PlanItem = { exerciseId: bench, sets: 3, restSec: 180, focus: "chest", target: { weight: 77.5, reps: 5, rir: 2, note: "Same" } };
    const plan = { ...generate({ gym, profile: p, events, minutes: 45, now: NOW }), items: [item] };
    expect(applyFixes(plan, [fix], events, p, gym, NOW + DAY).items[0].sets).toBe(4);
    const reset = applyFixes(plan, [startFix(stall, "reset", gym, NOW)], events, p, gym, NOW + DAY).items[0];
    expect(reset.target.weight).toBeLessThan(77.5);
    // Fixes end on their own.
    expect(applyFixes(plan, [fix], events, p, gym, NOW + 30 * DAY).items[0].sets).toBe(3);
    // A new best after the fix started means it worked.
    expect(fixResult(fix, [...events, set(bench, NOW + 10 * DAY, 82.5, 5)])?.worked).toBe(true);
    // No re-diagnosis while a fix runs.
    expect(findPlateaus(events, p, NOW + DAY, [fix])).toEqual([]);
  });
});

describe("goal-date planner", () => {
  it("slows gains over time and adds nothing in deload weeks", () => {
    expect(project(100, 0.02, 0, "intermediate", 0.8)).toBe(100);
    const a = project(100, 0.02, 12, "intermediate", 1);
    const b = project(100, 0.02, 12, "intermediate", 0.8);
    expect(b).toBeLessThan(a);
    expect(a).toBeLessThan(100 * 1.02 ** 12);
  });
  it("measures the lifter's own recent rate", () => {
    const h = [0, 14, 28, 42, 56].map((d, i) => ({ at: NOW - (56 - d) * DAY, e1: 100 * 1.01 ** i }));
    const r = observedRate(h, NOW)!;
    expect(r).toBeGreaterThan(0.015);
    expect(r).toBeLessThan(0.03);
  });
  it("calls a near goal on track and a far-fetched one unrealistic, with a likely date", () => {
    const p = profile({ experience: "intermediate" });
    const evs = sessions("bench-press", [56, 42, 28, 14, 2], (i) => 70 + i * 1.25);
    const near = forecast({ exerciseId: "bench-press", kg: 92, by: NOW + 180 * DAY }, evs, p, NOW);
    expect(["likely", "onTrack"]).toContain(near.status);
    const far = forecast({ exerciseId: "bench-press", kg: 160, by: NOW + 60 * DAY }, evs, p, NOW);
    expect(far.status).toBe("unlikely");
    expect(far.text).toMatch(/Not realistic/);
    setLanguage("fr");
    try {
      expect(forecast({ exerciseId: "bench-press", kg: 160, by: NOW + 60 * DAY }, evs, p, NOW).text).toMatch(/^Pas réaliste d’ici /);
    } finally {
      setLanguage("system");
    }
    expect(far.realistic).toBeLessThan(110);
    // Never promises more than twice the typical rate, however good the last month was.
    expect(far.rate).toBeLessThanOrEqual(TYPICAL_MONTHLY.intermediate * 1.5 + 1e-9);
  });
  it("says so when there's no data and when it's already done", () => {
    const p = profile();
    expect(forecast({ exerciseId: "back-squat", kg: 100, by: NOW + 90 * DAY }, [], p, NOW).status).toBe("noData");
    const evs = sessions("back-squat", [10, 3], () => 120);
    expect(forecast({ exerciseId: "back-squat", kg: 100, by: NOW + 90 * DAY }, evs, p, NOW).status).toBe("done");
  });
  it("plans a test day with loadable attempts in the last two weeks", () => {
    const p = profile();
    const evs = sessions("bench-press", [30, 20, 10, 3], () => 85);
    const goal = { id: "x", exerciseId: "bench-press", kg: 100, by: NOW + 6 * DAY, createdAt: NOW };
    const f = forecast(goal, evs, p, NOW);
    const td = testDay(goal, f, gym, NOW)!;
    expect(td.days).toBe(6);
    expect(td.attempts[0]).toBeLessThan(td.attempts[1]);
    expect(td.attempts[1]).toBeLessThanOrEqual(td.attempts[2]);
    for (const a of td.attempts) expect((a - 20) % 2.5).toBeCloseTo(0);
    expect(testDay({ ...goal, by: NOW + 40 * DAY }, f, gym, NOW)).toBeNull();
  });
});

describe("workout remix links", () => {
  const items = [
    { exerciseId: "bench-press", sets: 4, restSec: 180, target: { reps: 5 } },
    { exerciseId: "lat-pulldown", sets: 3, restSec: 90, target: { reps: 10 } },
  ];
  it("round-trips a workout and drops anything unknown or broken", () => {
    const code = encodeRemix(items);
    expect(decodeRemix(code)).toEqual([
      { exerciseId: "bench-press", sets: 4, reps: 5, restSec: 180 },
      { exerciseId: "lat-pulldown", sets: 3, reps: 10, restSec: 90 },
    ]);
    expect(decodeRemix(`${code}~made-up.3.10.90~squat.x.5.60`)).toHaveLength(2);
    expect(decodeRemix("9~bench-press.4.5.180")).toEqual([]);
    expect(remixUrl(code, "https://example.com/")).toBe(`https://example.com/app/#/remix/${code}`);
  });
  it("rebuilds it for a gym without the equipment, at the lifter's own weights", () => {
    const home = makeGym("dumbbells", "kg", "h");
    const r = adaptRemix(decodeRemix(encodeRemix(items)), home, profile(), [], NOW);
    expect(r.plan.items.length + r.missing.length).toBe(2);
    for (const it of r.plan.items) expect(exercise(it.exerciseId).needs.every((e) => home.equipment.includes(e))).toBe(true);
    expect(r.swapped.map((s) => s.from)).toContain("bench-press");
    expect(r.plan.items[0].sets).toBe(4);
  });
  it("keeps the shared reps and works the weight out from the lifter's strength", () => {
    const evs = sessions("bench-press", [3], () => 100, 5);
    const r = adaptRemix([{ exerciseId: "bench-press", sets: 3, reps: 10, restSec: 120 }], gym, profile(), evs, NOW);
    expect(r.plan.items[0].target.reps).toBe(10);
    expect(r.plan.items[0].target.weight).toBeLessThan(100);
    expect(r.plan.items[0].target.weight).toBeGreaterThan(60);
  });
  it("shares a finished session in the order it was done", () => {
    const evs = [set("back-squat", NOW, 100, 5, { sessionId: "z" }), set("back-squat", NOW + 1, 100, 5, { sessionId: "z" }), set("lying-leg-curl", NOW + 2, 40, 12, { sessionId: "z" })];
    const shared = sharedFromSession(evs, "z", "strength");
    expect(shared.map((s) => [s.exerciseId, s.sets, s.reps])).toEqual([["back-squat", 2, 5], ["lying-leg-curl", 1, 12]]);
    expect(encodeShared(shared)).not.toMatch(/100/);
  });
});

describe("what to buy next", () => {
  it("counts loadable totals from the plates owned", () => {
    expect(loadableTotals(20, [{ weight: 10, count: 2 }, { weight: 5, count: 2 }], 20, 100)).toEqual([20, 30, 40, 50]);
  });
  it("suggests small plates when the smallest jump is big", () => {
    const home = { ...makeGym("home", "kg", "h"), plates: [{ weight: 20, count: 4 }, { weight: 10, count: 4 }, { weight: 5, count: 4 }] };
    const tips = plateTips(home, []);
    expect(tips[0].jumpTo).toBeLessThan(tips[0].jumpFrom);
    expect(tips[0].text).toMatch(/A pair of 2\.5 kg plates|A pair of 1\.25 kg plates/);
  });
  it("suggests the equipment that unlocks the most for a bare gym", () => {
    const tips = equipmentTips(makeGym("bodyweight", "kg", "b"));
    expect(tips.length).toBeGreaterThan(0);
    expect(tips[0].unlocks).toBeGreaterThan(3);
    expect(tips.map((t) => t.item)).not.toContain("legPress");
  });
});

describe("machine settings memory", () => {
  it("offers labels from the equipment, and none for free exercises", () => {
    expect(presetLabels("leg-press")).toContain("Foot position");
    expect(presetLabels("push-up")).toEqual([]);
  });
  it("saves per exercise per gym, trimming empties", () => {
    const g = withSettings(gym, "leg-press", [{ label: "Back angle", value: " 3 " }, { label: "Foot position", value: "" }]);
    expect(g.settings?.["leg-press"]).toEqual([{ label: "Back angle", value: "3" }]);
    expect(settingsLine(g.settings!["leg-press"])).toBe("Back angle 3");
    expect(withSettings(g, "leg-press", []).settings?.["leg-press"]).toBeUndefined();
  });
});
