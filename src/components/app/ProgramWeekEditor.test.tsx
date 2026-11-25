// @vitest-environment jsdom
// The coach program builder's week (2026-11-25): days on the weekdays with rest days, picking a day's workout, and
// Auto-arrange with a reason under each rest day.
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { emptyWeek, type Week } from "@/lib/programWeek";
import { useApp } from "@/lib/store";
import type { Routine } from "@/lib/types";

import { ProgramWeekEditor } from "./ProgramWeekEditor";

const routine = (id: string, name: string, exercises: string[]): Routine => ({
  id,
  name,
  items: exercises.map((exerciseId) => ({ exerciseId, sets: 3 })),
  createdAt: 1,
  updatedAt: 1,
});

const seen: { last: Week } = { last: emptyWeek() };
function Host() {
  const [week, setWeek] = useState<Week>(emptyWeek());
  return (
    <ProgramWeekEditor
      week={week}
      onChange={(w) => {
        seen.last = w;
        setWeek(w);
      }}
      weeks={8}
    />
  );
}

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  await useApp.getState().reset();
  seen.last = emptyWeek();
  useApp.getState().setProfile({
    routines: [routine("u", "Upper", ["bench-press", "barbell-row"]), routine("l", "Lower", ["back-squat", "romanian-deadlift"])],
  });
});
afterEach(cleanup);

describe("ProgramWeekEditor", () => {
  it("starts as a week of rest days and puts a routine on the day tapped", async () => {
    const user = userEvent.setup();
    render(<Host />);
    const week = screen.getByRole("list", { name: "Week" });
    expect(within(week).getAllByText("Rest")).toHaveLength(7);
    await user.click(within(week).getAllByRole("button")[0]!);
    await user.click(await screen.findByRole("button", { name: /^Upper/ }));
    expect(seen.last.filter(Boolean)).toEqual(["u"]);
  });

  it("auto-arranges three workouts with a reason under each rest day between them", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.click(screen.getByRole("button", { name: "Auto-arrange" }));
    await user.click(await screen.findByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "Arrange" }));
    // The routines go in the order shown (A to Z when none are on the week yet).
    expect(seen.last).toEqual([null, "l", null, "u", null, "l", null]);
    expect(screen.getAllByText("Rest after Lower.")).toHaveLength(2);
    expect(screen.getAllByText("Rest after Upper.")).toHaveLength(1);
    expect(screen.getByText("3 workouts a week; the other days are rest.")).toBeTruthy();
  });

  it("shows the month with the program's days", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.click(screen.getByRole("button", { name: "Auto-arrange" }));
    await user.click(await screen.findByRole("button", { name: "Arrange" }));
    await user.click(screen.getByRole("button", { name: "Month" }));
    const month = screen.getByRole("list", { name: "Month" });
    expect(within(month).getAllByText("Upper").length).toBeGreaterThan(0);
  });
});
