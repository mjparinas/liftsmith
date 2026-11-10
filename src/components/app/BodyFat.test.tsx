// @vitest-environment jsdom
// Manual body fat entry (Melvin, 2026-11-10): a − / + box under each weigh-in, saved on the weigh-in event so
// the health twin, TDEE and coach's notes all see it.
import "fake-indexeddb/auto";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { insights } from "@/lib/insights";
import { useApp } from "@/lib/store";
import type { BodyweightEvent } from "@/lib/types";

import { Photos } from "./Photos";
import { Stats } from "./Stats";
import { Tools } from "./Tools";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

const weighIns = () => useApp.getState().events.filter((e): e is BodyweightEvent => e.type === "bodyweight");

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  await useApp.getState().reset();
  useApp.getState().setProfile({ onboarded: true, bodyweight: 80, unit: "kg", goal: "strength" });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("manual body fat entry", () => {
  it("Progress logs weight and body fat as one weigh-in, bumping from 20% when there's no reading", async () => {
    const user = userEvent.setup();
    render(<Stats />);
    await user.click(screen.getByRole("button", { name: "More body fat percent" }));
    expect(screen.getByLabelText("Body fat % (optional)")).toHaveValue("20");
    await user.click(screen.getByRole("button", { name: "More Today's body weight in kg" }));
    await user.click(screen.getByRole("button", { name: "Log body weight" }));
    expect(weighIns().map((e) => [e.kg, e.bodyFat])).toEqual([[80, 20]]);
    expect(screen.getByText("Body fat 20%")).toBeInTheDocument();
  });

  it("body fat on its own keeps the last weight, and the next bump starts from the last reading", async () => {
    useApp.getState().logBodyweight(82.4, 18.5);
    const user = userEvent.setup();
    render(<Stats />);
    // The first tap lands on the last reading, the next one steps from it.
    await user.click(screen.getByRole("button", { name: "Less body fat percent" }));
    expect(screen.getByLabelText("Body fat % (optional)")).toHaveValue("18.5");
    await user.click(screen.getByRole("button", { name: "Less body fat percent" }));
    expect(screen.getByLabelText("Body fat % (optional)")).toHaveValue("18.4");
    await user.click(screen.getByRole("button", { name: "Log body weight" }));
    expect(weighIns().map((e) => [e.kg, e.bodyFat])).toEqual([
      [82.4, 18.5],
      [82.4, 18.4],
    ]);
  });

  it("a typed value out of range is refused with a reason, and nothing is logged", async () => {
    const user = userEvent.setup();
    render(<Stats />);
    await user.type(screen.getByLabelText("Body fat % (optional)"), "75");
    await user.click(screen.getByRole("button", { name: "Log body weight" }));
    expect(screen.getByRole("alert")).toHaveTextContent("between 3 and 60%");
    expect(weighIns()).toHaveLength(0);
  });

  it("Body and photos logs body fat with the weigh-in", async () => {
    const user = userEvent.setup();
    render(<Photos />);
    await user.type(screen.getByLabelText("Body fat % (optional)"), "17,5");
    await user.click(screen.getByRole("button", { name: "Log" }));
    expect(weighIns().map((e) => [e.kg, e.bodyFat])).toEqual([[80, 17.5]]);
  });

  it("the TDEE screen's body fat becomes a weigh-in too, once typing stops", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    useApp.getState().setProfile({ sex: "male", birthYear: 1990, heightCm: 180 });
    render(<Tools arg="tdee" />);
    await user.click(screen.getByRole("button", { name: "On" }));
    // Switching it on fills in a typical value: a guess, so it isn't logged as a reading.
    vi.advanceTimersByTime(1600);
    expect(weighIns()).toHaveLength(0);
    const box = screen.getByLabelText("Body fat");
    await user.clear(box);
    await user.type(box, "16");
    vi.advanceTimersByTime(1600);
    expect(weighIns().map((e) => [e.kg, e.bodyFat])).toEqual([[80, 16]]);
  });

  it("hand-logged readings feed the rising body fat note", () => {
    const now = Date.now();
    const p = useApp.getState().profile;
    const events = [0, 1, 2, 3].map((i) => ({
      type: "bodyweight" as const,
      id: `bw${i}`,
      at: now - (4 - i) * 7 * 86_400_000,
      kg: 80,
      bodyFat: 18 + i * 0.6,
    }));
    const notes = insights({ events, profile: p, now });
    expect(notes.some((n) => n.id.startsWith("fat-up-"))).toBe(true);
  });
});
