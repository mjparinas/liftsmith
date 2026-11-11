// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HOLD_DELAY } from "@/lib/holdRepeat";
import * as juice from "@/lib/juice";

import { BumpField } from "./ui";

function Harness({ start = "50", max = 9999 }: { start?: string; max?: number }) {
  const [v, setV] = useState(start);
  return <BumpField value={v} onChange={setV} step={1} start={30} max={max} label="Age" />;
}

const box = () => screen.getByRole("textbox", { name: "Age" }) as HTMLInputElement;
const plus = () => screen.getByRole("button", { name: "More Age" });
// In small slices, so React draws between repeats as it does on a phone.
const wait = (ms: number) => {
  for (let t = 0; t < ms; t += 10)
    act(() => {
      vi.advanceTimersByTime(Math.min(10, ms - t));
    });
};

let buzz: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.useFakeTimers();
  buzz = vi.spyOn(juice, "haptic").mockImplementation(() => {});
  vi.spyOn(juice.sound, "tick").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("hold-to-repeat bumps", () => {
  it("steps once for a tap, on release, with one tick", () => {
    render(<Harness />);
    fireEvent.pointerDown(plus(), { button: 0 });
    expect(box().value).toBe("50"); // nothing yet: this might be the start of a scroll
    fireEvent.pointerUp(plus());
    expect(box().value).toBe("51");
    expect(buzz).toHaveBeenCalledTimes(1);
    wait(2000);
    expect(box().value).toBe("51");
  });

  it("waits for the hold delay, then repeats slow then faster, and stops on release", () => {
    render(<Harness />);
    fireEvent.pointerDown(plus(), { button: 0 });
    wait(HOLD_DELAY - 10);
    expect(box().value).toBe("50");
    wait(10);
    expect(box().value).toBe("51");
    wait(1000);
    const after1s = Number(box().value);
    wait(1000);
    const after2s = Number(box().value);
    // The second second moves more than the first.
    expect(after2s - after1s).toBeGreaterThan(after1s - 51);
    fireEvent.pointerUp(plus());
    const held = box().value;
    wait(1000);
    expect(box().value).toBe(held);
  });

  it("thins out the haptics at speed", () => {
    render(<Harness />);
    fireEvent.pointerDown(plus(), { button: 0 });
    wait(HOLD_DELAY + 3000);
    fireEvent.pointerUp(plus());
    const steps = Number(box().value) - 50;
    expect(buzz.mock.calls.length).toBeLessThan(steps);
    expect(buzz.mock.calls.length).toBeGreaterThan(10);
  });

  it("takes bigger steps on a long hold", () => {
    render(<Harness start="0" />);
    fireEvent.pointerDown(plus(), { button: 0 });
    wait(HOLD_DELAY + 6000);
    fireEvent.pointerUp(plus());
    // One at a time the whole way would be about 100 steps in six seconds.
    expect(Number(box().value)).toBeGreaterThan(150);
  });

  it("stops at the limit", () => {
    render(<Harness start="98" max={100} />);
    fireEvent.pointerDown(plus(), { button: 0 });
    wait(HOLD_DELAY + 2000);
    expect(box().value).toBe("100");
    const calls = buzz.mock.calls.length;
    wait(1000);
    expect(buzz.mock.calls.length).toBe(calls);
    fireEvent.pointerUp(plus());
  });

  it("does nothing when the press turns into a scroll or slides off", () => {
    render(<Harness />);
    fireEvent.pointerDown(plus(), { button: 0 });
    fireEvent.pointerCancel(plus());
    fireEvent.pointerUp(plus());
    wait(1000);
    expect(box().value).toBe("50");
    fireEvent.pointerDown(plus(), { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(plus(), { clientX: 10, clientY: 40 });
    wait(1000);
    fireEvent.pointerUp(plus());
    expect(box().value).toBe("50");
  });

  it("repeats while Enter is held and steps once for a screen reader click", () => {
    render(<Harness />);
    fireEvent.keyDown(plus(), { key: "Enter" });
    fireEvent.keyUp(plus(), { key: "Enter" });
    expect(box().value).toBe("51");
    fireEvent.keyDown(plus(), { key: "Enter" });
    wait(HOLD_DELAY + 500);
    fireEvent.keyUp(plus(), { key: "Enter" });
    expect(Number(box().value)).toBeGreaterThan(53);
    const v = Number(box().value);
    fireEvent.click(plus());
    expect(Number(box().value)).toBe(v + 1);
  });
});
