// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setLanguage } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { STRETCHES, suggest } from "@/lib/stretches";
import { NOW } from "@/test/factories";

import { StretchScreen } from "./Stretch";

beforeEach(async () => {
  await useApp.getState().reset();
  useApp.getState().setProfile({ onboarded: true, bodyweight: 80, unit: "kg" });
  sessionStorage.clear();
  location.hash = "#/stretch";
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  setLanguage("en");
});

const stretchEvents = () => useApp.getState().events.filter((e) => e.type === "stretch");

describe("stretch library", () => {
  it("filters by kind and muscle", async () => {
    const user = userEvent.setup();
    render(<StretchScreen />);
    const list = screen.getByTestId("stretch-list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(STRETCHES.length);
    await user.click(screen.getByRole("button", { name: "Cool-down holds" }));
    await user.click(within(screen.getByRole("group", { name: "Muscle" })).getByRole("button", { name: "Calves" }));
    const names = within(list)
      .getAllByRole("listitem")
      .map((li) => li.textContent);
    expect(names.some((n) => n?.includes("Wall calf stretch"))).toBe(true);
    expect(names.some((n) => n?.includes("Pigeon"))).toBe(false);
  });

  it("runs picked stretches one at a time, switching sides, and saves them", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { unmount } = render(<StretchScreen />);
    await user.click(screen.getByRole("button", { name: "Pick Cobra" }));
    await user.click(screen.getByRole("button", { name: "Pick Wall calf stretch" }));
    expect(screen.getByRole("button", { name: "Pick Cobra" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Start 2 stretches" }));
    expect(location.hash).toBe("#/stretch/picked");
    unmount();

    render(<StretchScreen arg="picked" />);
    expect(screen.getByRole("heading", { name: "Your stretches" })).toBeInTheDocument();
    expect(screen.getByText("Stretches: abs")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(screen.getByRole("heading", { name: "Cobra" })).toBeInTheDocument();
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toHaveTextContent("30");
    // The hold runs out on its own, then the one-sided stretch counts each side.
    await act(() => vi.advanceTimersByTimeAsync(31_000));
    expect(screen.getByRole("heading", { name: "Wall calf stretch" })).toBeInTheDocument();
    expect(screen.getByText("Left side")).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(31_000));
    expect(screen.getByText("Right side")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next ›" }));
    expect(screen.getByText("All stretched out")).toBeInTheDocument();
    expect(stretchEvents()).toEqual([expect.objectContaining({ moment: "pick", ids: ["cobra", "wall-calf"] })]);
  });
});

describe("warm-up and cool-down", () => {
  it("suggests a warm-up for today's muscles with a reason for each, and can be skipped", async () => {
    const user = userEvent.setup();
    const gym = useApp.getState().addGym("commercial");
    useApp.getState().setProfile({ activeGymId: gym });
    useApp.getState().replan();
    expect(useApp.getState().preview?.items.length).toBeGreaterThan(0);
    render(<StretchScreen arg="warmup" />);
    expect(screen.getByRole("heading", { name: "Warm-up for today" })).toBeInTheDocument();
    const rows = within(screen.getByTestId("stretch-routine")).getAllByRole("listitem");
    expect(rows.length).toBeGreaterThan(2);
    expect(rows[0]).toHaveTextContent("Raises your heart rate and warms you up");
    expect(rows.slice(1).some((r) => /Readies today's muscles/.test(r.textContent ?? ""))).toBe(true);
    await user.click(screen.getByRole("button", { name: "Skip and start lifting" }));
    expect(useApp.getState().active).toBeTruthy();
    expect(location.hash).toBe("#/workout");
    expect(stretchEvents()).toEqual([]);
  });

  it("lets the lifter drop a suggested stretch", async () => {
    const user = userEvent.setup();
    render(<StretchScreen arg="rest" />);
    const rows = () => within(screen.getByTestId("stretch-routine")).getAllByRole("listitem");
    const before = rows().length;
    await user.click(within(rows()[0]!).getByRole("button", { name: /^Remove / }));
    expect(rows()).toHaveLength(before - 1);
  });

  it("builds a cool-down from holds only, covering the muscles asked for", () => {
    const cool = suggest("cool", ["quads", "hamstrings"], [], NOW, 5);
    expect(cool.every((s) => s.kind === "cool")).toBe(true);
    expect(cool.some((s) => s.for.includes("quads"))).toBe(true);
    expect(cool.some((s) => s.for.includes("hamstrings"))).toBe(true);
    // Stretches that need kit the gym doesn't have are left out.
    expect(suggest("cool", ["lats"], [], NOW, 10).some((s) => s.id === "kneeling-lat")).toBe(false);
    expect(suggest("cool", ["lats"], ["bench"], NOW, 10).some((s) => s.id === "kneeling-lat")).toBe(true);
  });

  it("speaks the app's language", () => {
    setLanguage("de");
    render(<StretchScreen />);
    expect(screen.getByRole("heading", { name: /Dehnen/ })).toBeInTheDocument();
    expect(screen.getByText("Taube")).toBeInTheDocument();
  });
});
