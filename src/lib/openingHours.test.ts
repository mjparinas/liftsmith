import { describe, expect, it } from "vitest";

import { allDay, clockAt, formatHours, openNow, openState, parseHours, type Week } from "./openingHours";

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

describe("writing opening hours", () => {
  it("joins runs of days and round-trips", () => {
    const raw = "Mo-Fr 05:00-23:00; Sa,Su 07:00-20:00";
    expect(formatHours(parseHours(raw)!)).toBe(raw);
    expect(formatHours(parseHours("Mo,We,Fr 06:00-12:00")!)).toBe("Mo,We,Fr 06:00-12:00");
    expect(formatHours(parseHours("Mo-Th 05:00-22:00; Fr 05:00-21:00; Su 08:00-18:00")!)).toBe(
      "Mo-Th 05:00-22:00; Fr 05:00-21:00; Su 08:00-18:00",
    );
    expect(formatHours(parseHours("24/7")!)).toBe("24/7");
    expect(formatHours([[], [], [], [], [], [], []])).toBe("");
    const odd = parseHours("Mo 06:00-12:00,14:00-20:00; Tu 06:00-12:00,14:00-20:00")!;
    expect(parseHours(formatHours(odd))).toEqual(odd);
  });
});

describe("open now", () => {
  const week = parseHours("Mo-Fr 05:00-22:00; Sa 07:00-19:00; Su off")!;
  const at = (day: number, h: number, m = 0) => ({ day, min: h * 60 + m });

  it("is open inside a range and says when it closes", () => {
    expect(openState(week, at(0, 12))).toEqual({ open: true, closes: "22:00", soon: false });
  });

  it("closes soon in the last hour, and is closed at the closing minute", () => {
    expect(openState(week, at(2, 21, 15))).toEqual({ open: true, closes: "22:00", soon: true });
    expect(openState(week, at(2, 22))).toEqual({ open: false, opens: "05:00", inDays: 1 });
  });

  it("says when a closed gym opens: later today, tomorrow, or days ahead across the week's end", () => {
    expect(openState(week, at(1, 4, 30))).toEqual({ open: false, opens: "05:00", inDays: 0 });
    expect(openState(week, at(5, 20))).toEqual({ open: false, opens: "05:00", inDays: 2 });
    expect(openState(week, at(6, 9))).toEqual({ open: false, opens: "05:00", inDays: 1 });
  });

  it("runs a range past midnight, also from Sunday into Monday", () => {
    const late: Week = parseHours("Mo-Su 18:00-02:00")!;
    expect(openState(late, at(3, 0, 30))).toEqual({ open: true, closes: "02:00", soon: false });
    expect(openState(late, at(0, 1, 30))).toEqual({ open: true, closes: "02:00", soon: true });
    expect(openState(late, at(0, 3))).toEqual({ open: false, opens: "18:00", inDays: 0 });
  });

  it("joins a day that ends at 24:00 to the next day's 00:00 start", () => {
    const joined = parseHours("Fr 06:00-24:00; Sa 00:00-20:00")!;
    expect(openState(joined, at(4, 23))).toEqual({ open: true, closes: "20:00", soon: false });
  });

  it("never closes when open all week", () => {
    expect(openState(parseHours("24/7")!, at(6, 23, 59))).toEqual({ open: true, closes: null, soon: false });
  });

  it("is never open when every day is off", () => {
    expect(openState(parseHours("Mo-Su off")!, at(0, 12))).toEqual({ open: false, opens: null, inDays: null });
  });

  it("gives up on unreadable hours and on gyms too far away to share the viewer's clock", () => {
    expect(openNow("by appointment", at(0, 12))).toBeNull();
    expect(openNow("", at(0, 12))).toBeNull();
    expect(openNow("24/7", at(0, 12), 301)).toBeNull();
    expect(openNow("24/7", at(0, 12), 12)).toEqual({ open: true, closes: null, soon: false });
  });

  it("reads the clock in a time zone, Monday first", () => {
    // 2026-11-16 was a Monday; 15:30 UTC is 00:30 on Tuesday in Tokyo.
    const d = new Date(Date.UTC(2026, 10, 16, 15, 30));
    expect(clockAt(d, "UTC")).toEqual({ day: 0, min: 15 * 60 + 30 });
    expect(clockAt(d, "Asia/Tokyo")).toEqual({ day: 1, min: 30 });
    expect(clockAt(d, "Not/AZone").day).toBeGreaterThanOrEqual(0);
  });
});
