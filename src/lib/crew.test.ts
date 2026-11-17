import { describe, expect, it } from "vitest";

import { atOf, crewDays, defaultMinutes, mergeMessages, minMinutes, startOfDay, stepMinutes } from "./crew";
import type { ClubMessage } from "./socialTypes";

// Local times, so the tests hold in any time zone.
const at = (h: number, m = 0, day = 17) => new Date(2026, 10, day, h, m).getTime();

describe("crew session planner", () => {
  it("offers today and the next 13 days, as midnights", () => {
    const days = crewDays(at(10));
    expect(days).toHaveLength(14);
    expect(days[0]).toBe(startOfDay(at(10)));
    expect(days[1]).toBe(new Date(2026, 10, 18).getTime());
  });

  it("starts at the next whole hour at least 30 minutes away today, and 6 PM later", () => {
    expect(defaultMinutes(at(10), at(10, 10))).toBe(11 * 60);
    expect(defaultMinutes(at(10), at(10, 40))).toBe(12 * 60);
    expect(defaultMinutes(at(0, 0, 20), at(10))).toBe(18 * 60);
    expect(defaultMinutes(at(10), at(23, 31))).toBe(23 * 60 + 45);
  });

  it("steps a quarter hour and never into the past or past midnight", () => {
    const today = startOfDay(at(10));
    expect(minMinutes(today, at(10, 5))).toBe(10 * 60 + 15);
    expect(stepMinutes(10 * 60 + 15, -1, 1, today, at(10, 5))).toBeNull();
    expect(stepMinutes(11 * 60, 1, 2, today, at(10, 5))).toBe(11 * 60 + 30);
    expect(stepMinutes(23 * 60 + 45, 1, 1, today, at(10))).toBeNull();
    expect(minMinutes(at(0, 0, 18), at(10))).toBe(0);
  });

  it("turns a day and minutes into the session's time", () => {
    expect(atOf(startOfDay(at(10)), 18 * 60 + 30)).toBe(at(18, 30));
  });
});

describe("mergeMessages", () => {
  const msg = (id: string, t: number): ClubMessage => ({
    id,
    handle: "a",
    name: "A",
    avatar: "",
    at: t,
    body: id,
    mine: false,
    canDelete: false,
  });
  it("keeps time order with no repeats", () => {
    const out = mergeMessages([msg("b", 2), msg("a", 1)], [msg("c", 3), msg("b", 2)]);
    expect(out.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });
});
