// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { feel } from "@/lib/juice";
import { sideSpan } from "@/lib/setTimer";

import { barFraction, barStep, TimerBar } from "./TimerBar";

const NOW = 1_800_000_000_000;

afterEach(() => {
  vi.useRealTimers();
  feel.calm = false;
});

describe("timer bar", () => {
  it("works out how far it is between its two moments", () => {
    expect(barFraction(NOW, NOW, NOW + 10_000)).toBe(0);
    expect(barFraction(NOW + 2_500, NOW, NOW + 10_000)).toBe(0.25);
    expect(barFraction(NOW + 20_000, NOW, NOW + 10_000)).toBe(1);
    expect(barFraction(NOW - 1, NOW, NOW + 10_000)).toBe(0);
  });

  it("fills between whole seconds instead of stepping on them", () => {
    vi.useFakeTimers({ now: NOW, toFake: ["Date", "requestAnimationFrame", "cancelAnimationFrame"] });
    const { container } = render(<TimerBar from={NOW} to={NOW + 10_000} fill="bg-accent" />);
    const fill = container.firstElementChild!.firstElementChild as HTMLElement;
    expect(fill.style.transform).toBe("translateX(-100%)");
    act(() => vi.advanceTimersByTime(1_250));
    // 1.25 s into 10 s, not 1 s: the bar moved past the last whole second.
    const at = Number(/translateX\((-?[\d.]+)%\)/.exec(fill.style.transform)![1]);
    expect(at).toBeGreaterThan(-90);
    expect(at).toBeLessThan(-86);
  });

  it("holds still while paused and redraws less often with reduced motion", () => {
    const { container } = render(<TimerBar from={NOW} to={NOW + 10_000} paused at={NOW + 5_000} reverse fill="bg-accent" />);
    const fill = container.firstElementChild!.firstElementChild as HTMLElement;
    expect(fill.style.transform).toBe("translateX(-50%)");
    expect(barStep()).toBe(0);
    feel.calm = true;
    expect(barStep()).toBe(250);
  });

  it("spans each side of a hold after the lead-in and the switch", () => {
    const spec = { target: 30, sides: 2 as const, up: false };
    expect(sideSpan(spec, 1)).toEqual({ from: 5_000, to: 35_000 });
    expect(sideSpan(spec, 2)).toEqual({ from: 40_000, to: 70_000 });
  });
});
