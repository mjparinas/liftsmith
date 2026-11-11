// @vitest-environment jsdom
// Every button on Body › Health goes where its label says (Melvin, 2026-11-11: "Log a weigh-in" and "Log
// body fat" went to the Progress page). Weigh-ins are logged right in the metric's sheet; other inputs open
// the one screen that holds them.
import "fake-indexeddb/auto";

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useApp } from "@/lib/store";
import type { BodyweightEvent } from "@/lib/types";

import { Connections } from "./Connections";
import { HealthTwin } from "./HealthTwin";
import { Stats } from "./Stats";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

const weighIns = () => useApp.getState().events.filter((e): e is BodyweightEvent => e.type === "bodyweight");

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
  useApp.getState().setProfile({ onboarded: true, bodyweight: 80, unit: "kg", goal: "strength" });
});
afterEach(cleanup);

describe("Body › Health buttons", () => {
  it("Weight's sheet logs a weigh-in in place, without leaving Health", async () => {
    useApp.getState().logBodyweight(81);
    const user = userEvent.setup();
    render(<HealthTwin />);
    await user.click(screen.getByTestId("twin-weight"));
    const sheet = within(screen.getByRole("dialog"));
    const form = within(sheet.getByRole("region", { name: "Log a weigh-in" }));
    await user.click(form.getByRole("button", { name: "Less Today's body weight in kg" }));
    await user.click(form.getByRole("button", { name: "Log body weight" }));
    expect(weighIns().map((e) => e.kg)).toEqual([81, 81]);
    expect(location.hash).toBe("#/recovery");
  });

  it("Body fat's sheet logs body fat in place, with the last weight", async () => {
    useApp.getState().logBodyweight(82);
    const user = userEvent.setup();
    render(<HealthTwin />);
    await user.click(screen.getByTestId("twin-bodyFat"));
    const form = within(screen.getByRole("region", { name: "Log body fat" }));
    await user.type(form.getByLabelText("Body fat % (optional)"), "18");
    await user.click(form.getByRole("button", { name: "Log body weight" }));
    expect(weighIns().map((e) => [e.kg, e.bodyFat])).toEqual([
      [82, undefined],
      [82, 18],
    ]);
    expect(location.hash).toBe("#/recovery");
  });

  it("Add height opens Your stats, where height lives", async () => {
    const user = userEvent.setup();
    render(<HealthTwin />);
    await user.click(screen.getByTestId("twin-bmi"));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add height" }));
    expect(location.hash).toBe("#/settings/stats");
  });

  it("Pair a monitor opens Connected apps, where the heart rate monitor is", async () => {
    const user = userEvent.setup();
    render(<HealthTwin />);
    await user.click(screen.getByTestId("twin-restDrop"));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Pair a monitor" }));
    expect(location.hash).toBe("#/connections/hr");
  });

  it("#/connections/hr lands on the heart rate monitor", () => {
    const into = vi.fn();
    Element.prototype.scrollIntoView = into;
    location.hash = "#/connections/hr";
    render(<Connections />);
    expect(into.mock.contexts[0]).toBe(document.getElementById("conn-hr"));
  });

  it("#/stats/strength (fitness age's See strength score) lands on the strength score", () => {
    const into = vi.fn();
    Element.prototype.scrollIntoView = into;
    location.hash = "#/stats/strength";
    render(<Stats />);
    expect(into).toHaveBeenCalled();
    expect(into.mock.contexts[0]).toBe(document.getElementById("strength-score"));
  });
});
