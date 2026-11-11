// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { diagnostics } from "@/lib/diag";

import { ScreenBoundary } from "./ScreenBoundary";

afterEach(() => vi.restoreAllMocks());

describe("a screen that fails to draw", () => {
  it("gets one more try, so a passing hiccup never shows an error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    // Fails until the boundary has caught it once (React's own one retry included).
    let caught = false;
    const catchIt = ScreenBoundary.prototype.componentDidCatch;
    vi.spyOn(ScreenBoundary.prototype, "componentDidCatch").mockImplementation(function (this: ScreenBoundary, e: unknown) {
      caught = true;
      catchIt.call(this, e);
    });
    function Flaky() {
      if (!caught) throw new Error("hiccup");
      return <p>Today</p>;
    }
    render(
      <ScreenBoundary>
        <Flaky />
      </ScreenBoundary>,
    );
    expect(screen.getByText("Today")).toBeTruthy();
    expect(diagnostics().errors.some((e) => e.includes("hiccup"))).toBe(true);
  });

  it("shows a message with Reload in the app, not Next.js's dead-end page, when it keeps failing", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    function Broken(): never {
      throw new Error("broken");
    }
    render(
      <ScreenBoundary>
        <Broken />
      </ScreenBoundary>,
    );
    expect(screen.getByRole("alert").textContent).toContain("Something went wrong on this screen");
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("Error: broken");
  });
});
