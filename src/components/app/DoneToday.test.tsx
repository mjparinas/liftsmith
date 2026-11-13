// @vitest-environment jsdom
// Today after the day's workout (polish pass, 2026-11-12): it says the day is done instead of offering the same
// plan again, a first week counts up toward a streak instead of showing 0, and Train again brings the plan back.
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useApp } from "@/lib/store";

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
  Element.prototype.scrollIntoView ??= () => {};
  location.hash = "";
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(cleanup);

async function onboard(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
}

describe("Today after training", () => {
  it("before: one Something hurts? control, inside the readiness card, and one i for the score and the call", async () => {
    const user = userEvent.setup();
    await onboard(user);
    expect(screen.getAllByRole("button", { name: "Something hurts?" })).toHaveLength(1);
    const card = screen.getByRole("region", { name: /Train as planned|Go easy|Push/ });
    expect(within(card).getByRole("button", { name: "Something hurts?" })).toBeInTheDocument();
    expect(within(card).getAllByRole("button", { name: /^What is/ })).toHaveLength(1);
    // A brand new lifter has no streak yet: no flat 0, the goal chip says what starts one.
    expect(screen.getByText(/more this week to start a streak/)).toBeInTheDocument();
  });

  it("says the day is done, with what's next, and Train again brings the plan back", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    await screen.findByRole("button", { name: /Log set|Log warm-up/ });
    const skip = screen.queryByRole("button", { name: "Skip warm-up" });
    if (skip) await user.click(skip);
    await user.click(screen.getByRole("button", { name: /Log set/ }));
    await user.click(screen.getByRole("button", { name: "End" }));
    await user.click(screen.getByRole("button", { name: "Finish and save" }));
    await user.click(await screen.findByRole("button", { name: "Done" }));

    await screen.findByRole("heading", { level: 1, name: "Done for today" });
    expect(screen.getByTestId("done-today")).toHaveTextContent(/1 set in \d+ min, .* lifted/);
    expect(screen.queryByRole("button", { name: "Start workout" })).toBeNull();
    expect(screen.queryByTestId("plan-list")).toBeNull();
    // The rest of the page: today's lifts (each opens its page) and what they're recovering (2026-11-13).
    expect(within(screen.getByTestId("done-lifts")).getAllByRole("button").length).toBeGreaterThan(0);
    expect(screen.getByText(/1 set · /)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Recovering now/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Train again" }));
    expect(await screen.findByRole("button", { name: "Start workout" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Today's workout" })).toBeInTheDocument();
  });
});
