// @vitest-environment jsdom
// What's new (docs/decisions/whats-new.md): Settings' Version row opens the newest release, and Today's note shows
// once after an update to a lifter who has trained, never to a new one.
import "fake-indexeddb/auto";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LATEST, SEEN_KEY } from "@/lib/appNews";
import { useApp } from "@/lib/store";

import { VersionRow, WhatsNewNote } from "./WhatsNew";

vi.mock("canvas-confetti", () => ({ default: () => {} }));
// The sheet is checked against a fixed release (0.1.0, which has every kind and a change behind an unlock), so a
// new release at the top of RELEASES doesn't change what these tests read. Its day stays the real newest one,
// because that's what the note and the seen mark go by.
vi.mock("@/lib/appNews", async (load) => {
  const real = await load<typeof import("@/lib/appNews")>();
  const fixed = { ...real.RELEASES.find((r) => r.version === "0.1.0")!, day: real.LATEST.day };
  return { ...real, LATEST: fixed, RELEASES: [fixed] };
});

const trained = () => useApp.setState((s) => ({ stats: { ...s.stats, sessions: [{} as (typeof s.stats.sessions)[number]] } }));

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  localStorage.clear();
  await useApp.getState().reset();
  useApp.getState().setProfile({ onboarded: true });
});
afterEach(cleanup);

describe("What's new", () => {
  it("opens from the Version row with each kind and a Let's go button", async () => {
    const user = userEvent.setup();
    render(<VersionRow />);
    await user.click(screen.getByRole("button", { name: "What's new" }));
    const sheet = screen.getByTestId("whats-new");
    expect(sheet.textContent).toContain("Training seasons");
    expect(screen.getByRole("heading", { name: "New" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Better" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Fixed" })).toBeTruthy();
    expect(sheet.textContent).toMatch(/\d+ new · \d+ better · \d+ fixed/);
    await user.click(screen.getByRole("button", { name: "Let's go" }));
    expect(screen.queryByTestId("whats-new")).toBeNull();
    expect(localStorage.getItem(SEEN_KEY)).toBe(LATEST.day);
  });

  it("hides changes a new lifter hasn't unlocked", async () => {
    useApp.getState().setProfile({ reveal: { head: 0 } });
    const user = userEvent.setup();
    render(<VersionRow />);
    await user.click(screen.getByRole("button", { name: "What's new" }));
    expect(screen.getByTestId("whats-new").textContent).not.toContain("Training seasons");
  });

  it("notes it once on Today after an update, and not again", async () => {
    trained();
    const user = userEvent.setup();
    const first = render(<WhatsNewNote />);
    expect(screen.getByTestId("whats-new-note")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByTestId("whats-new-note")).toBeNull();
    first.unmount();
    render(<WhatsNewNote />);
    expect(screen.queryByTestId("whats-new-note")).toBeNull();
  });

  it("never notes it to a lifter with no workouts, and marks it seen", () => {
    render(<WhatsNewNote />);
    expect(screen.queryByTestId("whats-new-note")).toBeNull();
    expect(localStorage.getItem(SEEN_KEY)).toBe(LATEST.day);
  });
});
