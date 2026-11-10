// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Sheet } from "./ui";

const touch = (x: number, y: number) => ({ touches: [{ clientX: x, clientY: y }] });

function swipe(el: Element, dy: number, dx = 0, steps = 4) {
  fireEvent.touchStart(el, touch(100, 100));
  for (let i = 1; i <= steps; i++) fireEvent.touchMove(el, touch(100 + (dx * i) / steps, 100 + (dy * i) / steps));
  fireEvent.touchEnd(el, { touches: [] });
}

describe("Sheet", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("has a visible close button", () => {
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="Back squat">
        <p>Body</p>
      </Sheet>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when swiped down far enough, and springs back from a short pull", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="Back squat">
        <p>Body</p>
      </Sheet>,
    );
    const sheet = screen.getByRole("dialog");
    swipe(screen.getByText("Body"), 30);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(sheet.style.transform).toBe("");
    swipe(screen.getByText("Body"), 200);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores sideways drags, upward drags and drags on a 3D figure", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="Back squat">
        <p>Body</p>
        <canvas data-testid="figure" />
      </Sheet>,
    );
    swipe(screen.getByText("Body"), 30, 200);
    swipe(screen.getByText("Body"), -200);
    swipe(screen.getByTestId("figure"), 200);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("doesn't close from a pull while its content is scrolled down, except from the handle", () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="Back squat">
        <p>Body</p>
      </Sheet>,
    );
    const sheet = screen.getByRole("dialog");
    sheet.scrollTop = 120;
    Object.defineProperty(sheet, "scrollTop", { value: 120, configurable: true });
    swipe(screen.getByText("Body"), 200);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onClose).not.toHaveBeenCalled();
    swipe(sheet.querySelector("[data-sheet-handle]")!, 200);
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("moves with the finger while dragged, over its rise-in animation", () => {
    render(
      <Sheet open onClose={vi.fn()} title="Back squat">
        <p>Body</p>
      </Sheet>,
    );
    const sheet = screen.getByRole("dialog");
    const handle = sheet.querySelector("[data-sheet-handle]")!;
    fireEvent.touchStart(handle, touch(100, 100));
    fireEvent.touchMove(handle, touch(100, 130));
    fireEvent.touchMove(handle, touch(100, 160));
    // A filling CSS animation overrides an inline transform, so the drag only shows once it's cleared.
    expect(sheet.style.animation).toBe("none");
    expect(sheet.style.transform).toBe("translateY(60px)");
    expect(sheet.parentElement!.style.animation).toBe("none");
    fireEvent.touchEnd(handle, { touches: [] });
  });
});
