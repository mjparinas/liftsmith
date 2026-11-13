// @vitest-environment jsdom
// The recovery map (Melvin, 2026-11-09): the 3D figure where WebGL works, the 2D map otherwise, and a
// tap on any muscle says what to do with it and why.
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { recovery } from "@/lib/recovery";
import { useApp } from "@/lib/store";
import type { AppEvent } from "@/lib/types";

import { App } from "./App";
import { bandGroups, RecoveryMap } from "./RecoveryMap";

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

const squats = (now: number): AppEvent[] =>
  Array.from({ length: 6 }, (_, k) => ({
    type: "set" as const,
    id: `q${k}`,
    at: now - 2 * 3600_000 + k * 60_000,
    sessionId: "q",
    exerciseId: "back-squat",
    weight: 100,
    reps: 5,
    targetReps: 5,
    rir: 1,
  }));

describe("recovery map", () => {
  it("groups muscles by band, worst first", () => {
    const now = Date.now();
    const g = bandGroups(recovery(squats(now), now));
    expect(g[0].band).toBe("fatigued");
    expect(g[0].muscles).toContain("quads");
    expect(g.at(-1)!.band).toBe("fresh");
    expect(g.flatMap((x) => x.muscles)).toHaveLength(18);
  });

  it("falls back to the 2D map without WebGL, and a tap on a muscle says what to do", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await act(async () => useApp.getState().importWorkouts(squats(Date.now())));
    cleanup();
    const now = Date.now();
    render(<RecoveryMap rec={recovery(useApp.getState().events, now)} />);
    // jsdom has no WebGL, so this is the 2D map with its marks
    expect(screen.getAllByRole("img", { name: /muscles/ })).toHaveLength(2);
    const groups = screen.getByRole("list", { name: "Muscles by recovery" });
    expect(screen.getByText("Tap a muscle on the body, or one below, to see what to do with it.")).toBeInTheDocument();
    await user.click(within(groups).getByRole("button", { name: "Quads" }));
    const advice = screen.getByTestId("muscle-advice");
    expect(advice).toHaveTextContent(/Rest it\. It's ready in \d+ hours\./);
    expect(advice).toHaveTextContent("Last worked 2 hours ago.");
    expect(within(groups).getByRole("button", { name: "Quads" })).toHaveAttribute("aria-pressed", "true");
    // the picked muscle is outlined and every other muscle fades back, so even a small one is obvious
    const picked = document.querySelectorAll("path[data-picked]");
    expect(picked.length).toBeGreaterThan(0);
    for (const p of picked) expect(p).toHaveAttribute("stroke-width", "3");
    const others = [...document.querySelectorAll("path[fill-opacity]")].filter((p) => !p.hasAttribute("data-picked"));
    expect(others.length).toBeGreaterThan(0);
    for (const p of others) expect(p).toHaveAttribute("fill-opacity", "0.22");

    // a recovered muscle well short of its sets offers to make it a priority, in one tap
    await user.click(within(groups).getByRole("button", { name: "Chest" }));
    expect(screen.getByTestId("muscle-advice")).toHaveTextContent(/Good to train\. \d+ more sets reach this week's \d+\./);
    await user.click(screen.getByRole("button", { name: "Make it a priority" }));
    expect(useApp.getState().profile.training?.priorities).toEqual(["chest"]);
    expect(screen.queryByRole("button", { name: "Make it a priority" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("muscle-advice")).toBeNull();
  });

  it("lets the Recovery screen's muscle list open the same advice", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await act(async () => useApp.getState().importWorkouts(squats(Date.now())));
    await act(async () => {
      location.hash = "#/recovery";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await screen.findByRole("heading", { name: /^Body$/ });
    const row = screen.getAllByRole("button").find((b) => /Quads/.test(b.textContent ?? "") && b.hasAttribute("aria-pressed"))!;
    // Recovery is said with the name; the bar and the number beside it are this week's sets.
    expect(row.textContent).toMatch(/Quads\d+% recovered/);
    expect(row.textContent).toMatch(/\d+\/\d+ sets$/);
    await user.click(row);
    expect(row).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("muscle-advice")).toHaveTextContent("Rest it.");
  });
});
