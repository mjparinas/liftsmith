// @vitest-environment jsdom
// "From your coach" on Today (program builder stage 4, docs/decisions/coach-programs.md): whose program it is,
// today's day and week, and what's next.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { followAssign, type ProgramAssign } from "@/lib/coachProgramAssign";
import { useApp } from "@/lib/store";
import { useCoachNotes } from "@/lib/trainer";

import { CoachProgramChip } from "./ProgramAssignToday";

const assign: ProgramAssign = {
  id: "a1",
  coachId: "c1",
  clientId: "me",
  programId: "p1",
  teamId: null,
  title: "Upper / Lower",
  weeks: 4,
  days: [
    { name: "Upper A", code: "r1~VXBwZXI~bench-press.4~barbell-row.3", weekdays: [1] },
    { name: "Lower A", code: "r1~TG93ZXI~back-squat.4~romanian-deadlift.3", weekdays: [2] },
  ],
  status: "active",
  createdAt: 1,
  acceptedAt: 1,
  startedAt: 1,
  endedAt: null,
};

// Monday 2024-01-01, 9:00 local.
const MONDAY = new Date(2024, 0, 1, 9).getTime();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: MONDAY });
  const { routines, planSource } = followAssign(assign, MONDAY - 3_600_000);
  useApp.setState((s) => ({ profile: { ...s.profile, routines, planSource } }));
  useCoachNotes.setState({ programAssigns: [{ ...assign, coach: "Sam" }] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("From your coach on Today", () => {
  it("names the coach, today's day and what's next", () => {
    render(<CoachProgramChip />);
    const card = screen.getByTestId("coach-program-day");
    expect(card).toHaveTextContent("From your coach · Sam");
    expect(card).toHaveTextContent("Upper");
    expect(screen.getByTestId("coach-program-next")).toHaveTextContent(/^Up next: Lower, Tuesday/);
  });
});
