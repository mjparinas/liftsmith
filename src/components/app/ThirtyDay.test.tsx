// @vitest-environment jsdom
// 30-day challenges in the app (docs/decisions/thirty-day-challenges.md): the website's Join in the app opens the
// challenge at the level picked, joining puts day 1 on Today with a one-tap Done, and Undo takes it back.
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useApp } from "@/lib/store";
import { activeThirty } from "@/lib/thirtyDay";

import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  location.hash = "";
  localStorage.clear();
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(cleanup);

async function setUp(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
}

const open = (hash: string) =>
  act(async () => {
    location.hash = hash;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });

describe("30-day challenges", () => {
  it("joins from the website's link at its level, logs day 1 from Today and undoes it", async () => {
    const user = userEvent.setup();
    await setUp(user);
    await open("#/challenge/pushup~advanced");
    expect(await screen.findByRole("heading", { name: "30-day push-up challenge" })).toBeTruthy();
    // The website's level is picked, and the calendar shows its numbers.
    expect(screen.getByRole("button", { name: "Advanced" }).getAttribute("aria-pressed")).toBe("true");
    const cal = screen.getByTestId("thirty-calendar");
    expect(within(cal).getByLabelText("Day 1: 20 reps")).toBeTruthy();
    expect(within(cal).getByLabelText("Day 4, rest")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Join the challenge" }));
    expect(activeThirty(useApp.getState().events)[0]?.level).toBe("advanced");
    expect(await screen.findByTestId("thirty-due")).toBeTruthy();

    await open("#/today");
    const card = await screen.findByTestId("today-thirty");
    expect(within(card).getByText("Today, day 1: 20 reps")).toBeTruthy();
    // Day 1 says why it's that number.
    expect(within(card).getByText(/Day 1 is a number most advanced lifters can do today/)).toBeTruthy();
    await user.click(within(card).getByRole("button", { name: "Done" }));
    expect(within(card).getByText("Day 1 done. Day 2 tomorrow: 25 reps.")).toBeTruthy();
    await user.click(within(card).getByRole("button", { name: "Undo" }));
    expect(within(card).getByText("Today, day 1: 20 reps")).toBeTruthy();
  });

  it("lists every challenge and leaves one, keeping a fourth out while three run", async () => {
    const user = userEvent.setup();
    await setUp(user);
    for (const id of ["squat", "plank", "abs"]) act(() => void useApp.getState().joinThirty(id, "beginner"));
    expect(useApp.getState().joinThirty("burpee", "beginner")).toBe(false);
    await open("#/challenge");
    expect(await screen.findAllByTestId("thirty-pick")).toHaveLength(12);
    expect(screen.getAllByTestId("thirty-run")).toHaveLength(3);
    await open("#/challenge/burpee");
    expect(await screen.findByText(/Up to three challenges at once/)).toBeTruthy();
    await open("#/challenge/plank");
    await user.click(await screen.findByRole("button", { name: "Leave the challenge" }));
    await user.click(screen.getByRole("button", { name: "Leave" }));
    expect(activeThirty(useApp.getState().events).map((r) => r.challenge.id)).toEqual(["abs", "squat"]);
  });
});
