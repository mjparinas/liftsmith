// @vitest-environment jsdom
// Every recommendation says why, and the coach's notes come with a one-tap action (Melvin, 2026-11-09).
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { blockWeek } from "@/lib/block";
import { useApp } from "@/lib/store";
import type { AppEvent } from "@/lib/types";
import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

const D = 86_400_000;

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  location.hash = "";
  localStorage.clear();
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(cleanup);

async function onboard(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
}

describe("why and coach's notes", () => {
  it("gives every planned exercise a reason, and the call a sentence", async () => {
    const user = userEvent.setup();
    await onboard(user);
    const plan = useApp.getState().preview!;
    const whys = screen.getAllByTestId("item-why");
    expect(whys).toHaveLength(plan.items.length);
    for (const w of whys) expect(w.textContent).toMatch(/% recovered, \d+ of \d+ sets this week · /);
  });

  it("offers a deload after three workouts of missed reps, and one tap makes this the deload week", async () => {
    const user = userEvent.setup();
    await onboard(user);
    const now = Date.now();
    // Into the second week of the block, with three short workouts.
    act(() => useApp.getState().setProfile({ blockStart: now - 8 * D }));
    const events: AppEvent[] = [5, 3, 1].flatMap((ago, i) =>
      [0, 1, 2].map((k) => ({ type: "set" as const, id: `m${i}${k}`, at: now - ago * D + k * 1000, sessionId: `m${i}`, exerciseId: "back-squat", weight: 100, reps: 2, targetReps: 5, rir: 2 })),
    );
    await act(async () => useApp.getState().importWorkouts(events));
    const notes = await screen.findByRole("list", { name: "Coach's notes" });
    expect(within(notes).getByText("Fatigue is building up")).toBeInTheDocument();
    await user.click(within(notes).getByRole("button", { name: "Start a deload week" }));
    expect(blockWeek(useApp.getState().profile, Date.now()).deload).toBe(true);
    expect(useApp.getState().preview!.week.deload).toBe(true);
    expect(screen.getAllByTestId("item-why")[0].textContent).toMatch(/half the sets for the deload/);
  });

  it("hides a note after Got it", async () => {
    const user = userEvent.setup();
    await onboard(user);
    // The last build week of the block gets a note.
    const p = useApp.getState().profile;
    const build = Math.min(6, Math.max(3, p.blockWeeks));
    act(() => useApp.getState().setProfile({ blockStart: Date.now() - (build - 1) * 7 * D - D }));
    await act(async () => useApp.getState().importWorkouts([{ type: "set", id: "z1", at: Date.now() - 2 * D, sessionId: "z", exerciseId: "back-squat", weight: 100, reps: 5, targetReps: 5, rir: 2 }]));
    const notes = await screen.findByRole("list", { name: "Coach's notes" });
    expect(within(notes).getByText("Last hard week of the block")).toBeInTheDocument();
    await user.click(within(notes).getByRole("button", { name: "Got it" }));
    expect(screen.queryByText("Last hard week of the block")).not.toBeInTheDocument();
  });
});
