import { describe, expect, it } from "vitest";

import { byDay, nextSession, startAt, type Slot } from "./booking";
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
});
