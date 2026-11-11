// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as juice from "@/lib/juice";
import { tempoOf } from "@/lib/tempo";

import { TempoCoach } from "./TempoCoach";

// The tempo coach (a lab): one tap counts the set out, a beat a second, and stops by itself.

describe("TempoCoach", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const squat = tempoOf("tempo-squat")!; // 3 s down, 1 s up

  it("shows the tempo in words before it starts", () => {
    render(<TempoCoach tempo={squat} reps={2} paused={false} />);
    expect(screen.getByTestId("tempo-line").textContent).toBe("3 s down · 1 s up");
    expect(screen.getByTestId("tempo-coach").getAttribute("aria-pressed")).toBe("false");
  });

  it("counts a lead-in, then every second of every rep, with a sound each beat, and stops after the reps", () => {
    const beat = vi.spyOn(juice.sound, "tempo");
    const buzz = vi.spyOn(juice, "haptic");
    render(<TempoCoach tempo={squat} reps={2} paused={false} />);
    fireEvent.click(screen.getByTestId("tempo-coach"));
    expect(screen.getByTestId("tempo-line").textContent).toBe("Get set 3");
    act(() => void vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("tempo-line").textContent).toBe("Lower 3 · rep 1 of 2");
    act(() => void vi.advanceTimersByTime(3000));
    expect(screen.getByTestId("tempo-line").textContent).toBe("Lift 1 · rep 1 of 2");
    expect(buzz).toHaveBeenLastCalledWith("tap");
    act(() => void vi.advanceTimersByTime(5000));
    expect(screen.getByTestId("tempo-line").textContent).toBe("3 s down · 1 s up");
    expect(beat).toHaveBeenCalledTimes(3 + 8);
    expect(buzz).toHaveBeenLastCalledWith("success");
  });

  it("stops on Stop and when the screen is covered", () => {
    const { rerender } = render(<TempoCoach tempo={squat} reps={5} paused={false} />);
    fireEvent.click(screen.getByTestId("tempo-coach"));
    fireEvent.click(screen.getByTestId("tempo-coach"));
    expect(screen.getByTestId("tempo-coach").getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByTestId("tempo-coach"));
    rerender(<TempoCoach tempo={squat} reps={5} paused />);
    expect(screen.getByTestId("tempo-coach").getAttribute("aria-pressed")).toBe("false");
    const beat = vi.spyOn(juice.sound, "tempo");
    act(() => void vi.advanceTimersByTime(5000));
    expect(beat).not.toHaveBeenCalled();
  });
});
