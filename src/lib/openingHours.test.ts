import { describe, expect, it } from "vitest";

import { allDay, parseHours } from "./openingHours";

describe("opening hours", () => {
  it("reads day ranges, lists and several time ranges, and skips holidays", () => {
    const w = parseHours("Mo-Th 05:00-22:00; Fr 5:00-21:00; Sa,Su 07:00-19:00; PH 07:00-19:00")!;
    expect(w[0]).toEqual(["05:00-22:00"]);
    expect(w[4]).toEqual(["05:00-21:00"]);
    expect(w[6]).toEqual(["07:00-19:00"]);
    expect(parseHours("Mo 11:00-13:00,15:45-20:15; Tu off")![0]).toEqual(["11:00-13:00", "15:45-20:15"]);
    expect(parseHours("Mo 11:00-13:00; Tu off")![1]).toEqual([]);
  });

  it("wraps a range past Sunday and knows 24/7", () => {
    expect(parseHours("Sa-Mo 08:00-12:00")!.map((d) => d.length)).toEqual([1, 0, 0, 0, 0, 1, 1]);
    expect(allDay(parseHours("24/7")!)).toBe(true);
  });

  it("gives up on anything it doesn't understand", () => {
    expect(parseHours("")).toBeNull();
    expect(parseHours("sunrise-sunset")).toBeNull();
    expect(parseHours('Mo-Fr 08:00-12:00 open "by appointment"')).toBeNull();
    expect(parseHours("Jan-Mar Mo 08:00-12:00")).toBeNull();
  });
});
