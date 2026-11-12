// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HandsFree } from "./HandsFree";

afterEach(cleanup);

describe("HandsFree", () => {
  it("stays quiet until the last few seconds, then counts down", () => {
    const onLog = vi.fn();
    const { rerender } = render(<HandsFree left={6000} onLog={onLog} />);
    expect(screen.queryByTestId("hands-free")).toBeNull();
    rerender(<HandsFree left={2100} onLog={onLog} />);
    expect(screen.getByRole("status")).toHaveTextContent("Logging this set in 3 s. Do another rep to keep going.");
    expect(onLog).not.toHaveBeenCalled();
  });

  it("logs the set once when the wait runs out", () => {
    const onLog = vi.fn();
    const { rerender } = render(<HandsFree left={500} onLog={onLog} />);
    rerender(<HandsFree left={0} onLog={onLog} />);
    rerender(<HandsFree left={-250} onLog={onLog} />);
    expect(onLog).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("hands-free")).toBeNull();
  });

  it("starts the wait again when another rep comes in", () => {
    const onLog = vi.fn();
    const { rerender } = render(<HandsFree left={900} onLog={onLog} />);
    rerender(<HandsFree left={4000} onLog={onLog} />);
    expect(screen.queryByTestId("hands-free")).toBeNull();
    expect(onLog).not.toHaveBeenCalled();
  });
});
