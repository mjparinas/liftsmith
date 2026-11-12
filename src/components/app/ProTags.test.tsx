// @vitest-environment jsdom
// Pro features are shown, never hidden (Melvin, 2026-11-10): without Pro, each entry point carries a Pro
// tag and opens the paywall at that feature, and the paywall lists everything Pro unlocks.
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setBillingLive } from "@/lib/billing";
import { PRO_FEATURES } from "@/lib/entitlements";
import { t } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import type { AppEvent } from "@/lib/types";
import type { MessageKey } from "@/locales/en";

import { App } from "./App";
import { go } from "./router";

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
  await useApp.getState().reset();
  useApp.setState({ ready: false });
  setBillingLive(true, null, [{ plan: "annual", price: "$39.99", perMonth: "$3.33", trialDays: 14 }]);
});
afterEach(() => {
  cleanup();
  setBillingLive(false);
});

/** First-run setup, turning down the trial: a free lifter. */
async function onboardFree(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
  for (let i = 0; i < 4; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(await screen.findByRole("button", { name: "Not now, keep the free plan" }));
  await screen.findByText("Today's workout");
}

describe("the paywall", () => {
  it("has a title and a line for every Pro feature, in every language", () => {
    for (const f of PRO_FEATURES) {
      expect(t(`pro.ft.${f}` as MessageKey)).not.toBe(`pro.ft.${f}`);
      expect(t(`pro.fb.${f}` as MessageKey)).not.toBe(`pro.fb.${f}`);
    }
  });
});

describe("Pro features without Pro", () => {
  it("offers this week's free adaptive workout on Today, and one tap goes back to the program", async () => {
    const user = userEvent.setup();
    await onboardFree(user);
    expect(screen.queryByRole("button", { name: "Adaptive workouts, a Pro feature: see Pro" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Try adaptive today · 1 free this week" }));
    expect(useApp.getState().preview?.program).toBeUndefined();
    await user.click(await screen.findByRole("button", { name: "Adaptive today, free this week · Back to Classic 5×5" }));
    expect(useApp.getState().preview?.program?.id).toBe("classic-5x5");
    expect(screen.getByRole("button", { name: "Try adaptive today · 1 free this week" })).toBeInTheDocument();
  });

  it("tags adaptive workouts Pro once this week's free one is used, and opens the paywall with it first", async () => {
    const user = userEvent.setup();
    await onboardFree(user);
    const s = useApp.getState();
    const used: AppEvent = {
      type: "sessionStart",
      id: "free-1",
      at: Date.now() - 60_000,
      sessionId: "free-1",
      gymId: s.profile.activeGymId!,
      minutes: 45,
    };
    act(() => useApp.setState({ events: [...s.events, used] }));
    expect(screen.queryByRole("button", { name: "Try adaptive today · 1 free this week" })).toBeNull();
    const chip = screen.getByRole("button", { name: "Adaptive workouts, a Pro feature: see Pro" });
    expect(chip).toHaveTextContent("Pro");
    await user.click(chip);
    expect(location.hash).toBe("#/pro/today");
    const list = await screen.findByRole("region", { name: "What Pro unlocks" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows).toHaveLength(PRO_FEATURES.length);
    expect(rows[0]).toHaveTextContent("Adaptive workouts");
    expect(rows[0]).toHaveTextContent("You tapped this");
    expect(within(list).getByText("Labs")).toBeInTheDocument();
    expect(within(list).getByText(/Free, always/)).toBeInTheDocument();
  });

  it("keeps Short on time free during a workout", async () => {
    const user = userEvent.setup();
    await onboardFree(user);
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    const skip = screen.queryByRole("button", { name: "Skip warm-up" });
    if (skip) await user.click(skip);
    await user.click(await screen.findByRole("button", { name: "Change the plan" }));
    const sheet = await screen.findByRole("dialog", { name: "Change the plan" });
    expect(within(sheet).getByText("Short on time")).toBeInTheDocument();
    expect(location.hash).not.toContain("pro");
  });

  it("shows weekly sets per muscle on Progress, tagged Pro", async () => {
    const user = userEvent.setup();
    await onboardFree(user);
    go("stats");
    const b = await screen.findByRole("button", { name: "Advanced stats, a Pro feature: see Pro" });
    await user.click(b);
    expect(location.hash).toBe("#/pro/stats");
  });

  it("shows the goal planner on Progress, tagged Pro", async () => {
    const user = userEvent.setup();
    await onboardFree(user);
    go("stats");
    const b = await screen.findByRole("button", { name: "Goal planner, a Pro feature: see Pro" });
    await user.click(b);
    expect(location.hash).toBe("#/pro/goals");
  });
});
