import { describe, expect, it } from "vitest";
import { addDays, atTime, clampTime, dayStart, inQuiet, milestone, mondayIn, parts, plan, proState, zoned, type PlanInput } from "./messages";

const TZ = "America/Toronto";
// Monday 9 November 2026, local midnight in Toronto.
const MON = zoned(2026, 11, 9, 0, 0, TZ);
const DAY = 86_400_000;
const at = (dayOffset: number, h: number, m = 0) => atTime(addDays(MON, dayOffset, TZ), `${h}:${String(m).padStart(2, "0")}`, TZ);

function input(p: Partial<PlanInput> = {}): PlanInput {
  return {
    tz: TZ,
    days: [1, 3, 5],
    time: "18:00",
    daysPerWeek: 3,
    startedAt: addDays(MON, -60, TZ),
    lastWorkoutAt: at(-3, 18), // last Friday
    firstWorkoutAt: addDays(MON, -50, TZ),
    weekDays: 0,
    weekStart: MON,
    streakWeeks: 0,
    pro: { state: "pro" },
    kinds: {},
    ...p,
  };
}

describe("time zones", () => {
  it("finds local midnight, weekdays and wall-clock times", () => {
    expect(parts(MON, TZ)).toMatchObject({ y: 2026, m: 11, d: 9, h: 0, mi: 0, wd: 1 });
    expect(new Date(MON).toISOString()).toBe("2026-11-09T05:00:00.000Z");
    expect(dayStart(MON + 15 * 3600_000, TZ)).toBe(MON);
    expect(mondayIn(addDays(MON, 6, TZ) + 3600_000, TZ)).toBe(MON);
    expect(parts(at(0, 18), TZ).h).toBe(18);
  });

  it("steps over a daylight saving change without drifting", () => {
    // Clocks went back on 1 November 2026 in Toronto: that day is 25 hours long.
    const oct31 = zoned(2026, 10, 31, 0, 0, TZ);
    const nov1 = addDays(oct31, 1, TZ);
    const nov2 = addDays(nov1, 1, TZ);
    expect(nov2 - nov1).toBe(25 * 3600_000);
    expect(parts(nov2, TZ)).toMatchObject({ d: 2, h: 0 });
  });

  it("keeps reminder times inside waking hours", () => {
    expect(clampTime("05:30")).toBe("06:00");
    expect(clampTime("21:30")).toBe("21:00");
    expect(clampTime("7:05")).toBe("07:05");
    expect(clampTime("nonsense")).toBe("18:00");
    expect(inQuiet(at(0, 22), TZ)).toBe(true);
    expect(inQuiet(at(0, 7), TZ)).toBe(true);
    expect(inQuiet(at(0, 9), TZ)).toBe(false);
  });
});

describe("push plan", () => {
  it("reminds on each training day at the lifter's time", () => {
    const msgs = plan(input({ lastWorkoutAt: at(0, 7) }), MON + 60_000, addDays(MON, 7, TZ), "push");
    const reminders = msgs.filter((m) => m.kind === "reminder");
    expect(reminders.map((m) => parts(m.at, TZ).wd)).toEqual([3, 5]); // trained Monday already
    expect(reminders.every((m) => parts(m.at, TZ).h === 18)).toBe(true);
    expect(reminders[0].title).toBe("Today's workout is ready");
  });

  it("skips today's reminder once there's a workout today", () => {
    const today = plan(input({ lastWorkoutAt: at(0, 9) }), at(0, 10), addDays(MON, 1, TZ), "push");
    expect(today).toEqual([]);
    const notYet = plan(input(), at(0, 10), addDays(MON, 1, TZ), "push");
    expect(notYet.map((m) => m.kind)).toEqual(["reminder"]);
  });

  it("asks for the first workout differently", () => {
    const msgs = plan(input({ lastWorkoutAt: undefined, firstWorkoutAt: undefined, startedAt: MON - 3600_000 }), MON, addDays(MON, 1, TZ), "push");
    expect(msgs[0].title).toBe("Your first workout is ready");
  });

  it("nudges the morning after a missed training day, unless that day is a training day too", () => {
    // Trained Monday, missed Wednesday: Thursday 09:00 nudge. Friday is a training day, so its reminder instead.
    const msgs = plan(input({ lastWorkoutAt: at(0, 18), weekDays: 1 }), at(0, 19), addDays(MON, 6, TZ), "push");
    const missed = msgs.filter((m) => m.kind === "missed");
    expect(missed).toHaveLength(1);
    expect(parts(missed[0].at, TZ)).toMatchObject({ wd: 4, h: 9 });
    expect(msgs.filter((m) => m.kind === "reminder").map((m) => parts(m.at, TZ).wd)).toEqual([3, 5]);
  });

  it("checks in after 7, 14 and 30 quiet days, then stops", () => {
    const last = at(-40, 18);
    const msgs = plan(input({ lastWorkoutAt: last, days: [] }), last + 60_000, addDays(MON, 0, TZ), "push");
    expect(msgs.map((m) => Math.round((dayStart(m.at, TZ) - dayStart(last, TZ)) / DAY))).toEqual([7, 14, 30]);
    expect(msgs[0].title).toBe("Ready when you are");
  });

  it("warns when the week's goal needs every day left, and only with a streak to keep", () => {
    // Goal 3, none yet, Friday morning: three days left, three needed.
    const fri = addDays(MON, 4, TZ);
    const base = input({ days: [], weekDays: 0, streakWeeks: 5, lastWorkoutAt: at(-3, 18) });
    const msgs = plan(base, fri, addDays(MON, 7, TZ), "push");
    const streak = msgs.filter((m) => m.kind === "streak");
    expect(streak.length).toBeGreaterThanOrEqual(1);
    expect(streak[0].body).toBe("3 workouts left this week to keep your 5-week streak.");
    expect(parts(streak[0].at, TZ)).toMatchObject({ wd: 5, h: 9 });
    expect(plan({ ...base, streakWeeks: 0 }, fri, addDays(MON, 7, TZ), "push").filter((m) => m.kind === "streak")).toEqual([]);
    // With plenty of days left there's nothing to say.
    expect(plan(base, MON, addDays(MON, 3, TZ), "push").filter((m) => m.kind === "streak")).toEqual([]);
  });

  it("folds the streak warning into a training day's reminder", () => {
    const sun = addDays(MON, 6, TZ);
    const msgs = plan(input({ days: [0], weekDays: 2, streakWeeks: 1 }), sun, addDays(MON, 7, TZ), "push");
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toMatchObject({ kind: "reminder", body: "One workout today keeps your 1-week streak." });
  });

  it("sends at most one message a day", () => {
    const msgs = plan(input({ lastWorkoutAt: at(-40, 18), streakWeeks: 3 }), addDays(MON, -40, TZ), addDays(MON, 14, TZ), "push");
    const days = msgs.map((m) => dayStart(m.at, TZ));
    expect(new Set(days).size).toBe(days.length);
  });

  it("honours each switch", () => {
    const off = plan(input({ kinds: { reminder: false } }), MON, addDays(MON, 7, TZ), "push");
    expect(off.some((m) => m.kind === "reminder")).toBe(false);
  });

  it("keeps Pro offers off by default and rare when on", () => {
    const free = input({ pro: { state: "free", since: MON }, days: [] });
    expect(plan(free, MON, addDays(MON, 70, TZ), "push").filter((m) => m.kind === "pro")).toEqual([]);
    const on = plan({ ...free, kinds: { pro: true } }, MON, addDays(MON, 70, TZ), "push").filter((m) => m.kind === "pro");
    expect(on.map((m) => Math.round((dayStart(m.at, TZ) - MON) / DAY))).toEqual([3, 17, 31, 59]);
    expect(on.every((m) => !inQuiet(m.at, TZ))).toBe(true);
  });

  it("reminds two days before a trial ends", () => {
    const trial = input({ pro: { state: "trial", endsAt: at(10, 15) }, days: [], kinds: { pro: true } });
    const msgs = plan(trial, MON, addDays(MON, 14, TZ), "push").filter((m) => m.kind === "pro");
    expect(msgs).toHaveLength(1);
    expect(Math.round((dayStart(msgs[0].at, TZ) - MON) / DAY)).toBe(8);
    expect(msgs[0].body).toMatch(/do nothing and stay on the free plan/);
  });
});

describe("email plan", () => {
  it("sends the week on Monday morning instead of a reminder each day", () => {
    const msgs = plan(input({ weekStart: addDays(MON, -7, TZ), weekDays: 2 }), addDays(MON, -1, TZ), addDays(MON, 6, TZ), "email");
    const reminders = msgs.filter((m) => m.kind === "reminder");
    expect(reminders).toHaveLength(1);
    expect(parts(reminders[0].at, TZ)).toMatchObject({ wd: 1, h: 8 });
    expect(reminders[0].body).toBe("This week: Monday, Wednesday, Friday at 18:00. Last week you trained 2 days of 3. Each workout is planned when you open the app.");
  });

  it("only nudges after two missed training days in a row", () => {
    // Trained last Friday. Monday and Wednesday missed: Thursday morning.
    const msgs = plan(input(), MON, addDays(MON, 7, TZ), "email").filter((m) => m.kind === "missed");
    expect(msgs.map((m) => [parts(m.at, TZ).wd, m.title])).toEqual([
      [4, "Two training days slipped by"],
      [5, "Ready when you are"], // a week since last Friday
    ]);
    expect(parts(msgs[0].at, TZ).h).toBe(8);
  });

  it("never offers milestones by push", () => {
    expect(plan(input(), MON, addDays(MON, 30, TZ), "push").some((m) => m.kind === "milestone")).toBe(false);
  });
});

describe("milestones", () => {
  it("congratulates the first workout once, soon after it", () => {
    const now = at(0, 19);
    expect(milestone({ streakWeeks: 0 }, { firstWorkoutAt: at(0, 18), streakWeeks: 0 }, now)?.key).toBe("milestone:first");
    expect(milestone({ firstWorkoutAt: at(0, 18), streakWeeks: 0 }, { firstWorkoutAt: at(0, 18), streakWeeks: 0 }, now)).toBeNull();
    expect(milestone(null, { firstWorkoutAt: at(-10, 18), streakWeeks: 0 }, now)).toBeNull();
  });

  it("marks streaks of 4, 8, 12, 26 and 52 weeks as they're reached", () => {
    expect(milestone({ firstWorkoutAt: 1, streakWeeks: 3 }, { firstWorkoutAt: 1, streakWeeks: 4 }, MON)?.title).toBe("4 weeks in a row");
    expect(milestone({ firstWorkoutAt: 1, streakWeeks: 4 }, { firstWorkoutAt: 1, streakWeeks: 5 }, MON)).toBeNull();
    expect(milestone({ firstWorkoutAt: 1, streakWeeks: 25 }, { firstWorkoutAt: 1, streakWeeks: 26 }, MON)?.key).toBe("milestone:streak26");
  });
});

describe("Pro state", () => {
  it("treats everyone as Pro until billing is live", () => {
    expect(proState({ declinedAt: MON }, MON)).toEqual({ state: "pro" });
  });

  it("reads trials and declines once billing is live", () => {
    expect(proState({ trialStartedAt: MON, trialDays: 14 }, MON + DAY, true)).toEqual({ state: "trial", endsAt: MON + 14 * DAY });
    expect(proState({ trialStartedAt: MON, trialDays: 14 }, MON + 20 * DAY, true)).toEqual({ state: "free", since: MON + 14 * DAY });
    expect(proState({ declinedAt: MON }, MON, true)).toEqual({ state: "free", since: MON });
    expect(proState({ declinedAt: MON, subscribed: true }, MON, true)).toEqual({ state: "pro" });
    expect(proState(undefined, MON, true)).toEqual({ state: "pro" });
  });
});
