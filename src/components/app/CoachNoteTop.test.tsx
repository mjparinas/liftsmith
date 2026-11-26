// @vitest-environment jsdom
// The coach's note is at the top of the athlete's Today, above the call and the plan, as the coach is told
// ("It's at the top of their Today"). On the desktop it used to sit down the side column (Melvin, 2026-11-25).
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { useApp } from "@/lib/store";
import { keepNotes, type Overview } from "@/lib/trainer";

import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  location.hash = "";
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(cleanup);

it("puts the coach's note above today's workout", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
  const plan = await screen.findByText("Workout length");
  const overview = {
    coaches: [{ id: "c1", name: "Sam", since: 1 }],
    notes: [{ coachId: "c1", text: "Sleep eight hours this week.", at: Date.now() }],
  } as unknown as Overview;
  act(() => keepNotes(overview));
  const note = await screen.findByText("Sleep eight hours this week.");
  expect(note.compareDocumentPosition(plan) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  // Above the desktop's two columns (plan on the left, the call and the rest down the side), not inside them.
  const columns = plan.closest(".desk\\:grid");
  expect(columns).not.toBeNull();
  expect(columns!.contains(note)).toBe(false);
  expect(note.compareDocumentPosition(columns!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
