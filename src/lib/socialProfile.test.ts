import { describe, expect, it } from "vitest";

import { setLanguage } from "./i18n";
import { suggestionWhy, trainingCalendar, usualDays, usualDaysLine } from "./socialProfile";

// A Wednesday at noon, local time.
const WED = new Date(2026, 10, 11, 12).getTime();
const DAY = 86_400_000;
const at = (daysAgo: number) => WED - daysAgo * DAY;

describe("a friend's training calendar", () => {
  it("lays out the last weeks Monday to Sunday, oldest first, with posted days marked", () => {
    const weeks = trainingCalendar([at(0), at(2), at(9)], WED, 2);
    expect(weeks).toHaveLength(2);
    expect(new Date(weeks[1]!.start).getDay()).toBe(1); // Monday
    expect(weeks[1]!.days).toEqual([true, false, true, false, false, false, false]);
    expect(weeks[0]!.days).toEqual([true, false, false, false, false, false, false]);
  });

  it("finds the weekdays someone usually trains, once there's a pattern", () => {
    expect(usualDays([at(0), at(7), at(14)])).toEqual([]); // fewer than four workouts
    const mwf = [0, 2, 7, 9, 14, 16, 21, 23].map(at); // Wednesdays and Mondays
    expect(usualDays([...mwf, at(5)])).toEqual([1, 3]); // a one-off Friday doesn't count
  });
});

describe("the words", () => {
  it("says the usual days and why someone is suggested", () => {
    setLanguage("en");
    expect(usualDaysLine([0, 2, 7, 9, 14, 16].map(at))).toBe(
      "Usually trains on Monday and Wednesday. Pick one of those to train together.",
    );
    expect(usualDaysLine([])).toBeNull();
    expect(suggestionWhy({ reason: "mutual", count: 3, via: "Blair" })).toBe("Followed by Blair and 2 others you follow");
    expect(suggestionWhy({ reason: "mutual", count: 1, via: "Blair" })).toBe("Followed by Blair");
    expect(suggestionWhy({ reason: "club", via: "Barn crew" })).toBe("In Barn crew with you");
  });
});
