// @vitest-environment jsdom
// The set timer for holds, carries, hangs and cardio: the clock on its own, then in the real app with a plank.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as juice from "@/lib/juice";
import { LEAD_SEC, type TimerSpec } from "@/lib/setTimer";
import { useApp } from "@/lib/store";
import * as voice from "@/lib/voice";

import { App } from "../App";
import { cancelTimer, sessionTimer, SetTimerClock, SetTimerStart, startTimer, takeTimer, useTimerRun, type Held } from "./SetTimer";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

const plank: TimerSpec = { target: 30, sides: 1, up: false };
const s = (n: number) => n * 1000;

/** The clock as the workout screen mounts it, with the screen's own `now` passed in. */
function Harness({ now, onDone }: { now: number; onDone: (at: number, held: Held) => void }) {
  const run = useTimerRun("set-1");
  return run ? <SetTimerClock run={run} now={now} onDone={onDone} /> : <p>idle</p>;
}

afterEach(() => {
  cleanup();
  cancelTimer();
  vi.restoreAllMocks();
});

describe("SetTimerClock", () => {
  it("names the planned time on Start, each side for a one-sided hold, and the clock for cardio", () => {
    const { rerender } = render(<SetTimerStart spec={plank} onStart={() => {}} />);
    expect(screen.getByTestId("set-timer-start")).toHaveTextContent("Start timer · 0:30");
    rerender(<SetTimerStart spec={{ target: 20, sides: 2, up: false }} onStart={() => {}} />);
    expect(screen.getByTestId("set-timer-start")).toHaveTextContent("Start timer · 0:20 a side");
    rerender(<SetTimerStart spec={{ target: 600, sides: 1, up: true }} onStart={() => {}} />);
    expect(screen.getByTestId("set-timer-start")).toHaveTextContent("Start the clock");
  });

  it("counts a lead-in, beeps the last three seconds, and logs the set once when the hold runs out", () => {
    const beep = vi.spyOn(juice.sound, "countdown");
    const go = vi.spyOn(juice.sound, "restEnd");
    const onDone = vi.fn();
    act(() => startTimer("set-1", plank));
    const t0 = Date.now();
    const { rerender } = render(<Harness now={t0} onDone={onDone} />);
    expect(screen.getByText("Get set")).toBeTruthy();
    expect(screen.getByRole("timer")).toHaveTextContent("5");
    for (let i = 1; i <= LEAD_SEC; i++) rerender(<Harness now={t0 + s(i)} onDone={onDone} />);
    expect(beep).toHaveBeenCalledTimes(3);
    expect(go).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Time left")).toBeTruthy();
    expect(screen.getByRole("timer")).toHaveTextContent("0:30");
    rerender(<Harness now={t0 + s(LEAD_SEC + 12)} onDone={onDone} />);
    expect(screen.getByTestId("set-timer-note")).toHaveTextContent("Log set saves 0:12");
    rerender(<Harness now={t0 + s(LEAD_SEC + 30)} onDone={onDone} />);
    rerender(<Harness now={t0 + s(LEAD_SEC + 31)} onDone={onDone} />);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith(expect.any(Number), { reps: 30 });
    expect(screen.getByText("idle")).toBeTruthy();
  });

  it("logs a hold that ran out while the app was away, at the moment it ended, without beeping late", () => {
    const beep = vi.spyOn(juice.sound, "countdown");
    const onDone = vi.fn();
    act(() => startTimer("set-1", plank));
    const t0 = Date.now();
    const { rerender } = render(<Harness now={t0} onDone={onDone} />);
    rerender(<Harness now={t0 + s(90)} onDone={onDone} />);
    expect(beep).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone.mock.calls[0]![0]).toBeGreaterThanOrEqual(t0 + s(LEAD_SEC + 30) - 50);
    expect(onDone.mock.calls[0]![0]).toBeLessThanOrEqual(t0 + s(LEAD_SEC + 30) + 50);
  });

  it("says when to switch sides when the voice coach is on", () => {
    const say = vi.spyOn(voice, "say").mockImplementation(() => {});
    act(() => startTimer("set-1", { target: 20, sides: 2, up: false }));
    const t0 = Date.now();
    const { rerender } = render(<Harness now={t0} onDone={() => {}} />);
    for (let i = 1; i <= LEAD_SEC + 21; i++) rerender(<Harness now={t0 + s(i)} onDone={() => {}} />);
    expect(screen.getByText("Switch sides")).toBeTruthy();
    expect(say).toHaveBeenCalledWith("Switch sides.");
  });

  it("cancels without logging", () => {
    const onDone = vi.fn();
    act(() => startTimer("set-1", plank));
    render(<Harness now={Date.now()} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel the timer without logging the set" }));
    expect(screen.getByText("idle")).toBeTruthy();
    expect(takeTimer("set-1")).toBeNull();
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe("sessionTimer", () => {
  it("labels each phase for the lock screen and the watches as the screen does", () => {
    const run = { key: "k", startAt: 1_000_000, spec: { target: 20, sides: 2 as const, up: false } };
    expect(sessionTimer(run).map((x) => x.label)).toEqual(["Get set", "First side", "Switch sides", "Second side"]);
    expect(sessionTimer({ ...run, spec: plank }).map((x) => x.label)).toEqual(["Get set", "Time left"]);
    const up = sessionTimer({ ...run, spec: { target: 1200, sides: 1, up: true } });
    expect(up.at(-1)).toEqual({ from: 1_000_000 + s(LEAD_SEC), label: "Target 20:00" });
  });
});

describe("the set timer in a workout", () => {
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

  it("offers a timer on a plank, and Log set saves the seconds held", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Get started" }));
    await screen.findByText("What are you training for?");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Today's workout");
    const p = useApp.getState().preview!;
    const hold = {
      ...p.items[0]!,
      exerciseId: "plank",
      sets: 2,
      warmup: undefined,
      target: { ...p.items[0]!.target, weight: 0, reps: 40 },
    };
    useApp.getState().setPlan({ ...p, items: [hold, ...p.items.slice(1).filter((it) => it.exerciseId !== "plank")] });
    await user.click(await screen.findByRole("button", { name: "Start workout" }));

    await user.click(await screen.findByTestId("set-timer-start"));
    expect(screen.getByTestId("set-timer")).toBeTruthy();
    const t0 = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(t0 + s(LEAD_SEC + 25.4));
    await user.click(screen.getByRole("button", { name: /Log set/ }));
    const set = useApp.getState().events.find((e) => e.type === "set" && e.exerciseId === "plank");
    expect(set?.type === "set" && set.reps).toBe(25);
    expect(screen.queryByTestId("set-timer")).toBeNull();
  });
});
