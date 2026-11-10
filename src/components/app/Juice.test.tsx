// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { feel } from "@/lib/juice";

import { burst } from "./burst";
import { Mascot } from "./Mascot";
import { EmptyState, SwitchRow, TodaySkeleton } from "./ui";

beforeEach(() => {
  feel.calm = false;
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  // @ts-expect-error test cleanup of the stub below
  delete Element.prototype.animate;
  document.querySelectorAll("[data-burst]").forEach((n) => n.remove());
});

function Harness() {
  const [on, setOn] = useState(false);
  return <SwitchRow label="Sounds" hint="Soft chimes" on={on} onChange={setOn} />;
}

describe("Switch", () => {
  it("is a labelled switch that flips on a tap", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);
    const sw = screen.getByRole("switch", { name: "Sounds" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(sw).toHaveAccessibleDescription("Soft chimes");
    await user.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
  });
});

describe("burst", () => {
  it("is skipped where the browser can't animate", () => {
    expect(burst({ x: 10, y: 10 })).toBe(false);
  });

  it("is skipped in Lean mode", () => {
    Element.prototype.animate = vi.fn() as unknown as Element["animate"];
    feel.calm = true;
    expect(burst({ x: 10, y: 10 })).toBe(false);
    expect(document.querySelector("[data-burst]")).toBeNull();
  });

  it("draws particles and a check, then cleans up after itself", () => {
    const animate = vi.fn();
    Element.prototype.animate = animate as unknown as Element["animate"];
    const el = document.createElement("button");
    document.body.appendChild(el);
    expect(burst(el, { count: 8, check: true })).toBe(true);
    const layer = document.querySelector("[data-burst]")!;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer.querySelectorAll("span")).toHaveLength(8);
    expect(layer.querySelector("svg path")).not.toBeNull();
    expect(animate).toHaveBeenCalledTimes(10);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(document.querySelector("[data-burst]")).toBeNull();
  });
});

describe("mascot", () => {
  it("is decorative and has a face for every mood", () => {
    for (const mood of ["happy", "sleepy", "cheer", "curious"] as const) {
      const { container, unmount } = render(<Mascot mood={mood} />);
      const root = container.querySelector(`[data-mascot="${mood}"]`)!;
      expect(root).toHaveAttribute("aria-hidden");
      expect(root.querySelectorAll("path, circle, ellipse").length).toBeGreaterThan(5);
      unmount();
    }
  });

  it("can stand in for the icon on an empty state", () => {
    const { container } = render(<EmptyState icon="moon" mascot="sleepy" title="Rest day" />);
    expect(container.querySelector('[data-mascot="sleepy"]')).not.toBeNull();
    expect(screen.getByText("Rest day")).toBeInTheDocument();
  });
});

it("the loading skeleton announces itself once and hides its shapes", () => {
  render(<TodaySkeleton />);
  expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  expect(document.querySelectorAll(".skeleton").length).toBeGreaterThan(8);
  expect([...document.querySelectorAll(".skeleton")].every((n) => n.getAttribute("aria-hidden") === "true")).toBe(true);
});
