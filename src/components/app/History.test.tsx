// @vitest-environment jsdom
// Progress › History: a month calendar of past workouts (Melvin, 2026-11-11).
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { derive } from "@/lib/derive";
import { useApp } from "@/lib/store";
import type { AppEvent } from "@/lib/types";
import { makeWorkout } from "@/test/factories";

import { HistoryCalendar } from "./History";

const NOW = new Date(2026, 10, 20, 12).getTime();
const at = (m: number, d: number) => new Date(2026, m, d, 18).getTime();

function seed(events: AppEvent[]) {
  useApp.setState({ events, stats: derive(events, NOW) });
}

beforeEach(async () => {
  vi.useFakeTimers({ now: NOW, toFake: ["Date"] });
  await useApp.getState().reset();
  useApp.getState().setProfile({ onboarded: true, unit: "kg" });
  seed([
    ...makeWorkout("oct", at(9, 5), [{ exerciseId: "bench-press", weight: 50 }]),
    ...makeWorkout("early", at(10, 10), [{ exerciseId: "barbell-row", weight: 60 }]).map((e) =>
      e.type === "sessionStart" ? { ...e, program: { id: "ppl", day: 1 } } : e,
    ),
    ...makeWorkout("late", at(10, 18), [
      { exerciseId: "back-squat", weight: 100, reps: 5 },
      { exerciseId: "bench-press", weight: 70, reps: 5 },
    ]),
  ]);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("history calendar", () => {
  it("opens on this month with the latest workout shown in full", () => {
    render(<HistoryCalendar />);
    expect(screen.getByRole("heading", { name: /November 2026 2 workouts/ })).toBeInTheDocument();
    const card = screen.getByRole("article");
    expect(within(card).getByText("Back squat", { exact: false })).toBeInTheDocument();
    expect(within(card).getByText("100 kg × 5 reps")).toBeInTheDocument();
    // The heavier bench is a personal record.
    expect(within(card).getByText("Personal record")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Wednesday, November 18, 2 sets, 1 PR, Push and Legs/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  });

  it("shows another day's workout when its day is tapped", async () => {
    const user = userEvent.setup({ advanceTimers: () => {} });
    render(<HistoryCalendar />);
    await user.click(screen.getByRole("button", { name: /November 10/ }));
    expect(within(screen.getByRole("article")).getByText("60 kg × 8 reps")).toBeInTheDocument();
    // A program workout says which program and day it was; an adaptive one (the 18th) has no name.
    expect(screen.getByTestId("workout-name")).toHaveTextContent(/ · Pull day$/);
  });

  it("goes back a month with the button or a swipe, and no further than the first workout", async () => {
    const user = userEvent.setup({ advanceTimers: () => {} });
    render(<HistoryCalendar />);
    const cal = screen.getByTestId("history-calendar");
    fireEvent.touchStart(cal, { touches: [{ clientX: 120, clientY: 300 }] });
    fireEvent.touchEnd(cal, { changedTouches: [{ clientX: 260, clientY: 310 }] });
    expect(screen.getByRole("heading", { name: /October 2026 1 workout/ })).toBeInTheDocument();
    expect(within(screen.getByRole("article")).getByText("50 kg × 8 reps")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("heading", { name: /November 2026/ })).toBeInTheDocument();
  });
});
