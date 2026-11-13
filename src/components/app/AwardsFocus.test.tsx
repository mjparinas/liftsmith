// @vitest-environment jsdom
// Today's "Almost there" row opens Awards at that badge: the screen scrolls to its row and lights it briefly.
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { useApp } from "@/lib/store";

import { Achievements } from "./Achievements";

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  await useApp.getState().reset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  location.hash = "";
});

it("scrolls to the badge named in the link and lights its row for a moment", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"] });
  const scrolled: string[] = [];
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolled.push(this.id);
  };
  location.hash = "#/achievements/workouts";
  render(<Achievements />);
  const row = document.getElementById("badge-workouts")!;
  expect(row).toBeInTheDocument();
  expect(row.className).toContain("bg-accent/15");
  await act(() => vi.advanceTimersByTimeAsync(20));
  expect(scrolled).toEqual(["badge-workouts"]);
  await act(() => vi.advanceTimersByTimeAsync(2500));
  expect(row.className).not.toContain("bg-accent/15");
});

it("opens at the top with nothing lit when no badge is named", () => {
  const scrolled: string[] = [];
  Element.prototype.scrollIntoView = function (this: Element) {
    scrolled.push(this.id);
  };
  location.hash = "#/achievements";
  render(<Achievements />);
  expect(document.querySelector("[id^=badge-].bg-accent\\/15")).toBeNull();
  expect(scrolled).toEqual([]);
});

it("opens on Highlights: earned badges and the six closest, with one row to see them all", async () => {
  location.hash = "#/achievements";
  render(<Achievements />);
  const rows = () => document.querySelectorAll("[id^=badge-]").length;
  // A fresh lifter has earned nothing, so Highlights is the six closest.
  expect(rows()).toBe(6);
  expect(screen.getByRole("button", { name: "Highlights" })).toHaveAttribute("aria-pressed", "true");
  await userEvent.setup().click(screen.getByRole("button", { name: /^See all \d+ badges/ }));
  expect(rows()).toBeGreaterThan(6);
});
