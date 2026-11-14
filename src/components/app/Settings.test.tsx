// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { trainingDays } from "@/lib/calendar";
import { useApp } from "@/lib/store";

import { Settings } from "./Settings";

beforeEach(async () => {
  await useApp.getState().reset();
  useApp.getState().setProfile({ onboarded: true, goal: "muscle", daysPerWeek: 3 });
  location.hash = "#/settings";
});
afterEach(() => cleanup());

const open = (hash: string) =>
  act(() => {
    location.hash = hash;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });

describe("Settings, grouped (2026-11-10)", () => {
  it("puts Pro first, then Account, then one row per group", () => {
    render(<Settings />);
    const pro = screen.getByRole("heading", { name: "Liftsmith Pro" });
    const account = screen.getByRole("button", { name: /^Account/ });
    expect(pro.compareDocumentPosition(account) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const g of ["Training", "Workout", "Reminders", "Look and feel", "Body and units", "Your data and privacy"])
      expect(screen.getByRole("button", { name: new RegExp(`^${g}`) })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Training.*3 days a week/ })).toBeTruthy();
    // The settings themselves are on the group pages, not here.
    expect(screen.queryByRole("group", { name: "Goal" })).toBeNull();
    expect(screen.queryByText("Creator code")).toBeNull();
  });

  it("shows the version and the commit the build came from (2026-11-11)", () => {
    render(<Settings />);
    expect(screen.getByText(/^Version \S+ · build ([0-9a-f]{7}|dev)$/)).toBeTruthy();
  });

  it("opens a group's page, and old deep links land in the right group", async () => {
    const user = userEvent.setup();
    render(<Settings />);
    await user.click(screen.getByRole("button", { name: /^Workout/ }));
    open("#/settings/workout");
    expect(screen.getByRole("heading", { level: 1, name: "Workout" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "One-handed controls" })).toBeTruthy();
    open("#/settings/saving");
    expect(screen.getByRole("heading", { level: 1, name: "Your data and privacy" })).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Share anonymous stats" })).toBeTruthy();
    open("#/settings/themes");
    expect(screen.getByRole("heading", { level: 1, name: "Look and feel" })).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Lean mode" })).toBeTruthy();
  });

  it("sets the days a week from the training-day chips, keeping at least one", async () => {
    const user = userEvent.setup();
    open("#/settings/training");
    render(<Settings />);
    expect(screen.queryByRole("group", { name: "Days a week" })).toBeNull();
    const days = screen.getByRole("group", { name: "Training days" });
    await user.click(within(days).getByRole("button", { name: /Tue/ }));
    expect(useApp.getState().profile.daysPerWeek).toBe(4);
    expect(trainingDays(useApp.getState().profile)).toEqual([1, 2, 3, 5]);
    for (const d of ["Mon", "Tue", "Wed"]) await user.click(within(days).getByRole("button", { name: new RegExp(d) }));
    expect(useApp.getState().profile.daysPerWeek).toBe(1);
    await user.click(within(days).getByRole("button", { name: /Fri/ }));
    expect(useApp.getState().profile.daysPerWeek).toBe(1);
  });

  it("follows a new days-a-week from setup when the saved days no longer match", () => {
    expect(trainingDays({ daysPerWeek: 2, calendar: { days: [1, 3, 5], time: "18:00", write: false, read: false } })).toEqual([1, 4]);
    expect(trainingDays({ daysPerWeek: 3, calendar: { days: [0, 2, 4], time: "18:00", write: false, read: false } })).toEqual([0, 2, 4]);
  });

  it("shows body weight from the last weigh-in instead of a second place to type it", () => {
    useApp.getState().setProfile({ bodyweight: 82, unit: "kg" });
    open("#/settings/body");
    render(<Settings />);
    expect(screen.getByRole("button", { name: /82 kg.*Log a weigh-in/ })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: /Body weight/ })).toBeNull();
  });

  it("body weight opens Progress at the weigh-in, not the top", () => {
    open("#/settings/body");
    render(<Settings />);
    fireEvent.click(screen.getByRole("button", { name: /Log a weigh-in/ }));
    expect(location.hash).toBe("#/progress/bodyweight");
  });
});
