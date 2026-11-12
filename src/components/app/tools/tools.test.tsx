// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { dots } from "@/lib/onerm";
import { useApp } from "@/lib/store";

import { Tools } from "../Tools";

// The Tools screens added on 2026-11-11 (calculators.ts, intervals.ts): each reads the lifter's own data
// and ends on what to do with the number.

const year = new Date().getFullYear();

beforeEach(async () => {
  await useApp.getState().reset();
  useApp.getState().setProfile({
    onboarded: true,
    bodyweight: 80,
    unit: "kg",
    sex: "male",
    birthYear: year - 30,
    heightCm: 180,
    daysPerWeek: 3,
    knownMaxes: undefined,
    hrMax: undefined,
    tdee: undefined,
  });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Tools hub", () => {
  it("lists every tool, each opening its own screen", async () => {
    const user = userEvent.setup();
    render(<Tools />);
    for (const name of [
      "TDEE calculator",
      "Macros",
      "One-rep max",
      "Strength score",
      "Body fat",
      "FFMI",
      "Heart rate zones",
      "Interval timer",
    ])
      expect(screen.getByRole("button", { name: new RegExp(name) })).toBeInTheDocument();
    // Max heart rate from age 30 (Tanaka): 208 − 21 = 187.
    expect(screen.getByText("Max 187 bpm")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Interval timer/ }));
    expect(window.location.hash).toBe("#/tools/intervals");
  });
});

describe("Tools › Strength score", () => {
  it("scores the total three ways and says how far the next level is", () => {
    useApp.getState().setProfile({ knownMaxes: { "back-squat": 140, "bench-press": 100, deadlift: 180 } });
    render(<Tools arg="strength" />);
    expect(screen.getByTestId("strength-dots")).toHaveTextContent((Math.round(dots(420, 80, "male") * 10) / 10).toString());
    expect(screen.getByText(/to your total to reach Intermediate \(DOTS 300\)/)).toBeInTheDocument();
    expect(screen.getByText(/is furthest behind lifters your size/)).toBeInTheDocument();
  });

  it("names the lifts it still needs", () => {
    useApp.getState().setProfile({ knownMaxes: { "bench-press": 100 } });
    render(<Tools arg="strength" />);
    expect(screen.getByText(/Needs an estimated max for Squat and Deadlift/)).toBeInTheDocument();
  });
});

describe("Tools › Macros", () => {
  it("works out the day from TDEE and the goal, with a reason for each number", async () => {
    const user = userEvent.setup();
    render(<Tools arg="macros" />);
    // BMR 1780 × 1.55 = 2759 (Mifflin, 80 kg, 180 cm, 30, 3 days a week).
    expect(screen.getByTestId("macros-kcal")).toHaveTextContent("2,759");
    expect(screen.getByText("Your TDEE: what you burn on an average day.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lose fat" }));
    expect(useApp.getState().profile.tdee?.goal).toBe("cut");
    expect(screen.getByTestId("macros-kcal")).toHaveTextContent("2,259");
    // 2.2 g/kg on a cut.
    expect(screen.getByTestId("macros-protein")).toHaveTextContent("176 g");
    expect(screen.getByText(/the top of the range, to keep muscle/)).toBeInTheDocument();
  });
});

describe("Tools › Body fat", () => {
  it("estimates from the tape measurements already logged and saves the result as today's body fat", async () => {
    const user = userEvent.setup();
    act(() => {
      useApp.getState().logMeasure("waist", 85);
      useApp.getState().logMeasure("neck", 38);
    });
    render(<Tools arg="bodyfat" />);
    expect(screen.getByTestId("bodyfat-result")).toHaveTextContent("16.1%");
    await user.click(screen.getByRole("button", { name: "Save 16.1% as today's body fat" }));
    const weighIn = useApp
      .getState()
      .events.filter((e) => e.type === "bodyweight")
      .at(-1);
    expect(weighIn).toMatchObject({ bodyFat: 16.1 });
    expect(screen.getByRole("button", { name: "Saved" })).toBeDisabled();
    // Nothing changed on the tape, so no new measurements.
    expect(useApp.getState().events.filter((e) => e.type === "measure")).toHaveLength(2);
  });

  it("asks women for their hips too", () => {
    useApp.getState().setProfile({ sex: "female" });
    render(<Tools arg="bodyfat" />);
    expect(screen.getByLabelText(/hips/i, { selector: "input" })).toBeInTheDocument();
  });
});

describe("Tools › FFMI", () => {
  it("sends the lifter to the body fat tool without a reading", async () => {
    const user = userEvent.setup();
    render(<Tools arg="ffmi" />);
    expect(screen.getByText("Needs your body fat")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Body fat/ }));
    expect(window.location.hash).toBe("#/tools/bodyfat");
  });

  it("gives the band and the lean mass to the next one", () => {
    act(() => useApp.getState().logBodyweight(80, 15));
    render(<Tools arg="ffmi" />);
    expect(screen.getByTestId("ffmi-value")).toHaveTextContent("21");
    expect(screen.getByText("Above average", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText(/more lean mass reaches Excellent/)).toBeInTheDocument();
  });
});

describe("Tools › Heart rate zones", () => {
  it("estimates max from age, takes the lifter's own, and turns zone 2 into a rest cue", async () => {
    const user = userEvent.setup();
    render(<Tools arg="hrzones" />);
    expect(screen.getByText(/Estimated from your age \(30\): 187 bpm/)).toBeInTheDocument();
    // Zone 2 tops out at 70% of 187 = 131 − 1.
    expect(screen.getByText(/back under about 130 bpm/)).toBeInTheDocument();
    const box = screen.getByLabelText("Maximum heart rate", { selector: "input" });
    await user.clear(box);
    await user.type(box, "200");
    expect(useApp.getState().profile.hrMax).toBe(200);
    await user.click(screen.getByRole("button", { name: "Use the estimate (187 bpm)" }));
    expect(useApp.getState().profile.hrMax).toBeUndefined();
  });
});

describe("Tools › Interval timer", () => {
  it("counts in, then runs the rounds", () => {
    vi.useFakeTimers({ shouldAdvanceTime: false, now: 1_000_000 });
    render(<Tools arg="intervals" />);
    act(() => screen.getByRole("button", { name: "Tabata" }).click());
    act(() => screen.getByRole("button", { name: "Start" }).click());
    expect(screen.getByText("Get ready")).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(6_000));
    expect(screen.getAllByText("Work").length).toBeGreaterThan(0);
    expect(screen.getByTestId("interval-clock")).toHaveTextContent("0:19");
    act(() => screen.getByRole("button", { name: "Pause" }).click());
    act(() => void vi.advanceTimersByTime(60_000));
    expect(screen.getByTestId("interval-clock")).toHaveTextContent("0:19");
    act(() => screen.getByRole("button", { name: "Resume" }).click());
    act(() => void vi.advanceTimersByTime(20_000));
    expect(screen.getAllByText("Rest").length).toBeGreaterThan(0);
  });
});
