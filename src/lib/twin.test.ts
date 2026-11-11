import { describe, expect, it } from "vitest";

import { defaultProfile } from "./defaults";
import { perDay, sleepNights } from "./health";
import { healthSignals } from "./readiness";
import { activityForSteps, currentTdee, recentSteps, withSteps } from "./tdee";
import { baseline, dayOf, healthExternal, readings, restDrops, twin } from "./twin";
import type { AppEvent, HealthMetric, Profile } from "./types";

const DAY = 86_400_000;
const NOW = new Date("2026-11-09T09:00:00").getTime();
const profile: Profile = { ...defaultProfile(), bodyweight: 80, heightCm: 180, birthYear: 1990, sex: "male", unit: "kg" };

/** One reading a day for the last `n` days (today included when `today`), from `f(daysAgo)`. */
function daily(metric: HealthMetric, n: number, f: (ago: number) => number, today = true): AppEvent[] {
  const out: AppEvent[] = [];
  for (let ago = today ? 0 : 1; ago < n; ago++) {
    const at = NOW - ago * DAY;
    out.push({ type: "health", id: `h-${metric}-${ago}`, at, metric, day: dayOf(at), value: f(ago) });
  }
  return out;
}
const get = (evs: AppEvent[], id: string, p: Profile = profile, pro = true) =>
  twin({ events: evs, profile: p, sessions: [], now: NOW, pro, native: true, store: "Health Connect" }).find((m) => m.id === id)!;

describe("health readings from the store", () => {
  it("counts sleep as the union of asleep time, by the day the night ended", () => {
    const nights = sleepNights([
      // Apple Health: watch and phone both write the same stretch; in bed and awake don't count.
      { value: 0, startDate: "2026-11-08T23:00:00", endDate: "2026-11-09T03:00:00", sleepState: "light" },
      { value: 0, startDate: "2026-11-09T01:00:00", endDate: "2026-11-09T06:30:00", sleepState: "asleep" },
      { value: 0, startDate: "2026-11-08T22:30:00", endDate: "2026-11-09T07:00:00", sleepState: "inBed" },
      // Health Connect: a session with stages.
      {
        value: 0,
        startDate: "2026-11-07T23:00:00",
        endDate: "2026-11-08T07:00:00",
        stages: [
          { startDate: "2026-11-07T23:00:00", endDate: "2026-11-08T03:00:00", stage: "deep" },
          { startDate: "2026-11-08T03:00:00", endDate: "2026-11-08T03:30:00", stage: "awake" },
          { startDate: "2026-11-08T03:30:00", endDate: "2026-11-08T07:00:00", stage: "rem" },
        ],
      },
    ]);
    expect(nights.map((n) => [n.day, n.value])).toEqual([
      ["2026-11-08", 7.5],
      ["2026-11-09", 7.5],
    ]);
  });

  it("keeps one value a day: the mean for HRV, the latest for resting heart rate, dropping junk", () => {
    const s = [
      { value: 50, startDate: "2026-11-09T02:00:00", endDate: "2026-11-09T02:00:00" },
      { value: 60, startDate: "2026-11-09T04:00:00", endDate: "2026-11-09T04:00:00" },
      { value: 900, startDate: "2026-11-09T05:00:00", endDate: "2026-11-09T05:00:00" },
    ];
    expect(perDay("hrv", s, "mean", (v) => v > 5 && v < 300)[0].value).toBe(55);
    expect(perDay("restingHr", s, "latest", (v) => v < 130)[0].value).toBe(60);
  });

  it("lets a re-read day replace the old number", () => {
    const evs: AppEvent[] = [
      { type: "health", id: "a", at: NOW - 3_600_000, metric: "hrv", day: dayOf(NOW), value: 40 },
      { type: "health", id: "b", at: NOW, metric: "hrv", day: dayOf(NOW), value: 52 },
    ];
    expect(readings(evs, "hrv")).toEqual([{ day: dayOf(NOW), value: 52 }]);
  });
});

describe("your normal", () => {
  it("needs a week of readings and leaves today out", () => {
    const evs = daily("hrv", 6, () => 50, false);
    expect(baseline(readings(evs, "hrv"), NOW, 2)).toBeUndefined();
    const more = [...daily("hrv", 20, (ago) => (ago % 2 ? 48 : 52), false), ...daily("hrv", 1, () => 90)];
    const b = baseline(readings(more, "hrv"), NOW, 2)!;
    expect(b.mean).toBeCloseTo(50, 0);
    expect(b.high).toBeLessThan(60);
  });
});

describe("the health twin", () => {
  it("says HRV below your normal is a day to go easier, and Pro counts it in the call", () => {
    const evs = [...daily("hrv", 20, () => 60, false), ...daily("hrv", 1, () => 45)];
    const m = get(evs, "hrv");
    expect(m.status).toBe("watch");
    expect(m.chip).toBe("Below your normal");
    expect(m.why).toMatch(/go easier/);
    expect(m.did).toMatch(/counted in today's call/);
    expect(get(evs, "hrv", profile, false).did).toMatch(/with Pro/);
    expect(healthExternal(evs, NOW).hrvDelta).toBeCloseTo(-0.25, 2);
  });

  it("flags short sleep over the week, and a breathing rate jump", () => {
    const evs = [
      ...daily("sleep", 7, (ago) => (ago < 4 ? 5.8 : 7.6)),
      ...daily("breathing", 20, () => 14, false),
      ...daily("breathing", 1, () => 16.5),
    ];
    expect(get(evs, "sleep").status).toBe("watch");
    expect(get(evs, "sleep").display).toBe("5 h 48");
    expect(get(evs, "breathing").chip).toBe("Up overnight");
    expect(healthSignals(healthExternal(evs, NOW)).map((s) => s.text)).toEqual(["Short sleep", "Breathing rate up overnight"]);
  });

  it("says to ignore BMI for a lean, heavy lifter", () => {
    const evs: AppEvent[] = [{ type: "bodyweight", id: "w", at: NOW - DAY, kg: 88, bodyFat: 14 }];
    const m = get(evs, "bmi");
    expect(m.chip).toBe("Ignore it");
    expect(m.why).toMatch(/can't tell muscle from fat/);
  });

  it("reads lean mass kept while body fat falls", () => {
    const evs: AppEvent[] = [
      { type: "bodyweight", id: "a", at: NOW - 42 * DAY, kg: 82, bodyFat: 18 },
      { type: "bodyweight", id: "b", at: NOW - DAY, kg: 80.4, bodyFat: 16.4 },
    ];
    expect(get(evs, "bodyFat").chip).toBe("Down");
    expect(get(evs, "leanMass").status).toBe("steady");
  });

  it("calls weight loss faster than 1% a week too fast", () => {
    const evs: AppEvent[] = [0, 7, 14, 21].map((d, i) => ({ type: "bodyweight", id: `w${i}`, at: NOW - (21 - d) * DAY, kg: 90 - i * 1.2 }));
    const m = get(evs, "weight");
    expect(m.chip).toBe("Dropping fast");
    expect(m.why).toMatch(/costs muscle/);
  });

  it("says slow weight loss plainly, and calls it good only when building muscle isn't the goal", () => {
    // About 0.5% a week down over three weeks.
    const evs: AppEvent[] = [0, 7, 14, 21].map((d, i) => ({
      type: "bodyweight",
      id: `w${i}`,
      at: NOW - (21 - d) * DAY,
      kg: 90 - i * 0.45,
    }));
    expect(get(evs, "weight").chip).toBe("Losing slowly");
    expect(get(evs, "weight", { ...profile, goal: "strength" }).status).toBe("good");
    expect(get(evs, "weight", { ...profile, goal: "muscle" }).status).toBe("info");
  });

  it("marks health metrics missing on the web without offering to connect", () => {
    const m = twin({ events: [], profile, sessions: [], now: NOW, pro: true, native: false }).find((x) => x.id === "sleep")!;
    expect(m.status).toBe("missing");
    expect(m.action).toBeUndefined();
  });

  it("measures how far heart rate falls in a minute of rest", () => {
    const start = NOW - 2 * DAY;
    const t: number[] = [],
      bpm: number[] = [];
    for (let s = 0; s < 900; s++) {
      t.push(s);
      bpm.push(s % 180 < 40 ? 140 : 110);
    }
    const evs: AppEvent[] = [
      { type: "hrSeries", id: "hr", at: start + 900_000, sessionId: "s1", start, t, bpm },
      ...[39, 219, 399, 579].map(
        (sec, i) =>
          ({
            type: "set",
            id: `set${i}`,
            at: start + sec * 1000,
            sessionId: "s1",
            exerciseId: "squat",
            weight: 100,
            reps: 5,
            targetWeight: 100,
            targetReps: 5,
            rir: 2,
          }) as AppEvent,
      ),
    ];
    expect(restDrops(evs)).toEqual([{ day: dayOf(start), value: 30 }]);
  });
});

describe("steps set the TDEE activity level", () => {
  it("maps steps to levels and adds one when both steps and training are active", () => {
    expect(activityForSteps(4000)).toBe("sedentary");
    expect(activityForSteps(8000)).toBe("moderate");
    expect(withSteps({ activity: "moderate", source: "workouts", perWeek: 4 }, 8000).activity).toBe("heavy");
    expect(withSteps({ activity: "light", source: "workouts", perWeek: 2 }, 3000).activity).toBe("light");
  });

  it("uses the last week of finished days, once there are five", () => {
    const evs = daily("steps", 8, () => 9000, false);
    expect(recentSteps(evs, NOW)).toBe(9000);
    expect(recentSteps(evs.slice(0, 3), NOW)).toBeUndefined();
    const cur = currentTdee(evs, [], profile, NOW);
    expect(cur.activity.source).toBe("steps");
    expect(cur.activity.steps).toBe(9000);
  });
});
