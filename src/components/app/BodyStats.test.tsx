// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useApp } from "@/lib/store";

import { BodyStats, missingStats } from "./BodyStats";

beforeEach(async () => {
  await useApp.getState().reset();
  useApp.getState().setProfile({ onboarded: true, bodyweight: 80, unit: "kg", sex: undefined, birthYear: undefined, heightCm: undefined });
});
afterEach(cleanup);

describe("Your stats", () => {
  it("sets sex, age and height in centimetres, with bump buttons", async () => {
    const user = userEvent.setup();
    render(<BodyStats />);
    await user.click(screen.getByRole("button", { name: "Female" }));
    await user.click(screen.getByRole("button", { name: "More age" }));
    await user.click(screen.getByRole("button", { name: "More height" }));
    // The first tap lands on a typical value (30, and 163 cm for a woman), not one step past it.
    expect(screen.getByLabelText("Age")).toHaveValue("30");
    expect(screen.getByLabelText("Height (cm)")).toHaveValue("163");
    const p = useApp.getState().profile;
    expect(p.sex).toBe("female");
    expect(p.birthYear).toBe(new Date().getFullYear() - 30);
    expect(p.heightCm).toBe(163);
    expect(p.heightAt).toBeGreaterThan(0);
    expect(missingStats(p, ["sex", "age", "height"])).toEqual([]);
    // Switching to pounds shows the same height in feet and inches.
    act(() => useApp.getState().setProfile({ unit: "lb" }));
    expect(screen.getByLabelText("height, feet")).toHaveValue("5");
    expect(screen.getByLabelText("height, inches")).toHaveValue("4");
  });

  it("takes feet and inches with pounds, and inches carry into feet", async () => {
    useApp.getState().setProfile({ unit: "lb", heightCm: 177.8 }); // 5 ft 10 in
    const user = userEvent.setup();
    render(<BodyStats />);
    expect(screen.getByLabelText("height, feet")).toHaveValue("5");
    expect(screen.getByLabelText("height, inches")).toHaveValue("10");
    await user.click(screen.getByRole("button", { name: "More height, inches" }));
    await user.click(screen.getByRole("button", { name: "More height, inches" }));
    expect(screen.getByLabelText("height, feet")).toHaveValue("6");
    expect(screen.getByLabelText("height, inches")).toHaveValue("0");
    expect(useApp.getState().profile.heightCm).toBe(182.9);
    await user.click(screen.getByRole("button", { name: "Less height, inches" }));
    expect(screen.getByLabelText("height, feet")).toHaveValue("5");
    expect(screen.getByLabelText("height, inches")).toHaveValue("11");
  });
});
