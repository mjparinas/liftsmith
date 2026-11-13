// @vitest-environment jsdom
// "Shape the figure like me" (Melvin, 2026-11-13: "the toggle doesn't do anything"). Without a height the figure
// had nothing to shape from and the switch flipped silently; for builds near the average the change was too small
// to see; and only Health's figure followed it, not the recovery map or the exercise demos. The switch now says
// what it needs with a button to each place, what the figure was shaped from, and reshapes every figure.
import "fake-indexeddb/auto";

import { cleanup, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BODIES } from "@/lib/demo/rig";
import { useApp } from "@/lib/store";

import { HealthTwin } from "./HealthTwin";
import { useMyShape } from "./myShape";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

const shapeSwitch = () => screen.getByRole("switch", { name: /Shape the figure like me/ });

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  location.hash = "#/recovery";
  await useApp.getState().reset();
  useApp.getState().setProfile({ onboarded: true, bodyweight: 0, unit: "kg", goal: "strength", sex: "male", heightCm: undefined });
});
afterEach(cleanup);

describe("Shape the figure like me", () => {
  it("says what's missing and links to where to add it, instead of flipping silently", async () => {
    useApp.getState().setProfile({ bodyweight: 82 });
    const user = userEvent.setup();
    render(<HealthTwin />);
    expect(screen.getByText(/The figure needs your height and a weigh-in/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Add your height ›" }));
    expect(location.hash).toBe("#/settings/stats");
  });

  it("offers a weigh-in or measurements when there's no weight either", async () => {
    useApp.getState().setProfile({ heightCm: 178 });
    const user = userEvent.setup();
    render(<HealthTwin />);
    expect(screen.queryByRole("button", { name: "Add your height ›" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Log a weigh-in or measurements ›" }));
    expect(location.hash).toBe("#/photos");
  });

  it("says what the figure was shaped from once it's on", async () => {
    useApp.getState().setProfile({ heightCm: 175 });
    useApp.getState().logBodyweight(105, 30);
    const user = userEvent.setup();
    render(<HealthTwin />);
    await user.click(shapeSwitch());
    expect(useApp.getState().profile.shapeFigure).toBe(true);
    expect(screen.getByText("Shaped from 175 cm, 105 kg, and 30% body fat.")).toBeTruthy();
    expect(screen.queryByText(/close to the average build/)).toBeNull();
  });

  it("says the change is small for a build near the average figure's", async () => {
    useApp.getState().setProfile({ heightCm: 176, bodyweight: 74, shapeFigure: true });
    render(<HealthTwin />);
    expect(screen.getByText(/That's close to the average build, so the change is small\./)).toBeTruthy();
  });

  it("gives every figure the lifter's shape while the switch is on, and the average one while it's off", () => {
    useApp.getState().setProfile({ heightCm: 175, bodyweight: 105 });
    const { result, rerender } = renderHook(() => useMyShape());
    expect(result.current).toBeUndefined();
    useApp.getState().setProfile({ shapeFigure: true });
    rerender();
    expect(result.current).toBeDefined();
    expect(result.current!.shW).toBeGreaterThan(BODIES.male.shW);
  });

  it("keeps the average figure when there's nothing to shape from, even with the switch on", () => {
    useApp.getState().setProfile({ shapeFigure: true });
    const { result } = renderHook(() => useMyShape());
    expect(result.current).toBeUndefined();
  });
});
