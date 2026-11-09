// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useApp } from "@/lib/store";
import { derive } from "@/lib/derive";
import type { AppEvent, SetEvent } from "@/lib/types";
import { DotsCard, OneRmSection } from "./OneRepMax";

const DAY = 86400_000;
let n = 0;
const set = (exerciseId: string, weight: number, reps: number, daysAgo = 1): SetEvent => {
  const at = Date.now() - daysAgo * DAY;
  return { type: "set", id: `t${n++}`, at, startedAt: at, sessionId: `s${daysAgo}`, exerciseId, weight, reps, targetReps: reps, rir: 0 };
};

function seed(events: AppEvent[]) {
  useApp.setState({ events, stats: derive(events, Date.now()) });
}

beforeEach(async () => {
  await useApp.getState().reset();
  useApp.getState().setProfile({ onboarded: true, unit: "kg", bodyweight: 80, sex: "male" });
});
afterEach(cleanup);

describe("One-rep max calculator", () => {
  it("lists estimates and opens a calculator adjusted with buttons only", async () => {
    seed([set("bench-press", 100, 1), set("bench-press", 100, 1, 3)]);
    const user = userEvent.setup();
    render(<OneRmSection />);
    await user.click(screen.getByRole("button", { name: /Barbell bench press: open the one-rep max calculator/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByTestId("onerm-estimate")).toHaveTextContent("100 kg");
    expect(within(dialog).getByTestId("onerm-calc")).toHaveTextContent("100 kg");
    // One more rep: 100 × 2 to failure.
    await user.click(within(dialog).getByRole("button", { name: "More reps" }));
    const two = Number(within(dialog).getByTestId("onerm-calc").textContent!.replace(/[^\d.]/g, ""));
    expect(two).toBeGreaterThan(100);
    // Two reps left in the tank counts as 4 to failure.
    await user.click(within(dialog).getByRole("button", { name: "2" }));
    expect(Number(within(dialog).getByTestId("onerm-calc").textContent!.replace(/[^\d.]/g, ""))).toBeGreaterThan(two);
    expect(within(dialog).queryByRole("textbox")).toBeNull();
  });

  it("shows an empty state with no data", () => {
    seed([]);
    render(<OneRmSection />);
    expect(screen.getByText("Trends appear here")).toBeInTheDocument();
  });
});

describe("DOTS", () => {
  it("waits for all three lifts, then scores from real data", async () => {
    seed([set("back-squat", 180, 1), set("bench-press", 120, 1)]);
    const user = userEvent.setup();
    const { unmount } = render(<DotsCard />);
    expect(screen.getByText(/Needs an estimated max for Deadlift/)).toBeInTheDocument();
    // Filling the missing lift with the stepper gives a score.
    await user.click(screen.getByText("Change the numbers"));
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole("button", { name: "More deadlift" }));
    expect(screen.getByTestId("dots-score")).not.toHaveTextContent("–");
    unmount();

    seed([set("back-squat", 180, 1), set("bench-press", 120, 1), set("deadlift", 220, 1)]);
    render(<DotsCard />);
    // 520 kg total at 80 kg ≈ 358.6.
    expect(Number(screen.getByTestId("dots-score").textContent)).toBeCloseTo(358.6, 1);
    expect(screen.getByText("Intermediate")).toBeInTheDocument();
  });
});
