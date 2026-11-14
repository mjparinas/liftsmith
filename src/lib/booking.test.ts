import { describe, expect, it } from "vitest";

import { BOOK_LIMITS } from "@/server/coachBooking";

import { BOOK_AHEAD_DAYS, byDay, daysFromToday, lastScheduleMonth, nextSession, openingDay, startAt, type Slot } from "./booking";
import { eventIcs } from "./calendar";

const HOUR = 3_600_000;
const NOW = new Date(2027, 0, 14, 9, 0).getTime();
const at = (start: number, id = String(start)): Slot => ({
  id,
  coachId: "k",
  start,
  minutes: 60,
  place: "",
  clientId: "me",
  bookedAt: NOW,
});

describe("booking", () => {
  it("a day chip and a time make a start on this phone's clock", () => {
    const s = new Date(startAt(NOW, 1, "18:30"));
    expect([s.getDate(), s.getHours(), s.getMinutes()]).toEqual([15, 18, 30]);
  });

  it("groups times by day, in order", () => {
    const days = byDay([at(NOW + 26 * HOUR), at(NOW + HOUR), at(NOW + 3 * HOUR)]);
    expect(days.map((d) => d.slots.length)).toEqual([2, 1]);
    expect(days[0]!.slots[0]!.start).toBe(NOW + HOUR);
  });

  it("Today mentions a session in the next day, or one that just started", () => {
    expect(nextSession([at(NOW + 30 * HOUR), at(NOW + 5 * HOUR, "soon")], NOW)?.id).toBe("soon");
    expect(nextSession([at(NOW - HOUR / 2, "now")], NOW)?.id).toBe("now");
    expect(nextSession([at(NOW + 30 * HOUR)], NOW)).toBeNull();
  });

  it("a session's calendar file is in UTC with the place", () => {
    const ics = eventIcs(
      { id: "s1", start: Date.UTC(2027, 0, 15, 2), minutes: 45, title: "Session with Sam", notes: "Booked", place: "Gym, 2nd floor" },
      NOW,
    );
    expect(ics).toContain("DTSTART:20270115T020000Z");
    expect(ics).toContain("DTEND:20270115T024500Z");
    expect(ics).toContain("LOCATION:Gym\\, 2nd floor");
  });

  describe("the schedule's month calendar", () => {
    const DAY = 24 * HOUR;

    it("ends where the server stops taking times, or at a later time already there", () => {
      expect(BOOK_AHEAD_DAYS * DAY).toBe(BOOK_LIMITS.aheadMs);
      // 14 January plus 120 days is 14 May.
      expect(lastScheduleMonth(NOW, [])).toEqual({ y: 2027, m: 4 });
      expect(lastScheduleMonth(NOW, [at(new Date(2027, 6, 2).getTime())])).toEqual({ y: 2027, m: 6 });
    });

    it("this month opens on the next day with a time from today, else today", () => {
      const jan = { y: 2027, m: 0 };
      expect(openingDay([], jan, NOW)).toBe("2027-01-14");
      expect(openingDay([at(NOW - 3 * DAY), at(NOW + 5 * DAY)], jan, NOW)).toBe("2027-01-19");
      expect(openingDay([at(NOW - 3 * DAY)], jan, NOW)).toBe("2027-01-14");
    });

    it("another month opens on its first day with a time, else none", () => {
      const feb = { y: 2027, m: 1 };
      expect(openingDay([at(new Date(2027, 1, 20, 9).getTime()), at(new Date(2027, 1, 3, 18).getTime())], feb, NOW)).toBe("2027-02-03");
      expect(openingDay([at(NOW + DAY)], feb, NOW)).toBeNull();
    });

    it("counts whole days from today for the Add times chips", () => {
      expect(daysFromToday(NOW, new Date(2027, 0, 14, 23).getTime())).toBe(0);
      expect(daysFromToday(NOW, new Date(2027, 0, 15, 0, 30).getTime())).toBe(1);
      expect(daysFromToday(NOW, new Date(2027, 2, 20, 12).getTime())).toBe(65);
      expect(daysFromToday(NOW, new Date(2027, 0, 10).getTime())).toBe(-4);
    });
  });
});
