import { describe, expect, it } from "vitest";

import { monthChallenge, monthHistory, monthsFinished, monthValue, thisMonth } from "./monthly";

// Monthly challenges for everyone (docs/decisions/friends.md, gap list 2 item 7).
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).getTime();
const session = (start: number, sets = 15, minutes = 50) => ({ start, sets, seconds: minutes * 60 });

describe("monthly challenge", () => {
  it("is the same for everyone in a month and rotates workouts, sets and minutes", () => {
    const nov = monthChallenge(at(2026, 10, 12));
    expect(monthChallenge(at(2026, 10, 30))).toEqual(nov);
    expect(nov.key).toBe("2026-11");
    expect(nov.start).toBe(new Date(2026, 10, 1).getTime());
    expect(nov.end).toBe(new Date(2026, 11, 1).getTime());
    const metrics = [10, 11, 0].map((m, i) => monthChallenge(at(m === 0 ? 2027 : 2026, m, 5 + i)).metric);
    expect(new Set(metrics).size).toBe(3);
  });

  it("counts only the month's workouts, by its measure", () => {
    const ch = { key: "x", start: at(2026, 10, 1, 0), end: at(2026, 11, 1, 0), metric: "workouts" as const, goal: 12 };
    const list = [session(at(2026, 9, 31)), session(at(2026, 10, 1)), session(at(2026, 10, 30)), session(at(2026, 11, 1))];
    expect(monthValue(list, ch)).toBe(2);
    expect(monthValue(list, { ...ch, metric: "sets" })).toBe(30);
    expect(monthValue(list, { ...ch, metric: "minutes" })).toBe(100);
  });

  it("finishes a month at its goal, earns medals for past months and says the days left", () => {
    const nov = monthChallenge(at(2026, 10, 1));
    const days = Array.from({ length: 30 }, (_, i) => session(at(2026, 10, i + 1)));
    const finished = nov.metric === "workouts" ? days.slice(0, nov.goal) : nov.metric === "sets" ? days.slice(0, 14) : days.slice(0, 13);
    const history = monthHistory([...finished, session(at(2026, 11, 3))]);
    expect(history.map((m) => [m.key, m.done])).toEqual([
      ["2026-11", true],
      ["2026-12", false],
    ]);
    expect(monthsFinished(finished)).toBe(1);
    const now = thisMonth(finished, at(2026, 10, 28, 12));
    expect(now.done).toBe(true);
    expect(now.daysLeft).toBe(3);
    expect(thisMonth([], at(2026, 10, 28, 12)).value).toBe(0);
  });
});
