// @vitest-environment jsdom
// Progress photos with compare (Melvin, 2026-11-15): any two photos of a pose, as a slider or side by side, each
// with the weight on its day; sharing the pair is for adults only.
import "fake-indexeddb/auto";

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { erasePhotos, savePhoto, type Photo } from "@/lib/photos";
import { useApp } from "@/lib/store";

import { Photos } from "./Photos";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 5, 12);
const ph = (id: string, at: number): Photo => ({ id, at, pose: "front", blob: new Blob([id], { type: "image/jpeg" }), w: 3, h: 4 });

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  URL.createObjectURL = () => "blob:x";
  URL.revokeObjectURL = () => {};
  localStorage.clear();
  await useApp.getState().reset();
  await erasePhotos();
  useApp.getState().setProfile({ onboarded: true, bodyweight: 80, unit: "kg" });
  for (const p of [ph("a", T0), ph("b", T0 + 28 * DAY), ph("c", T0 + 56 * DAY)]) await savePhoto(p);
});
afterEach(() => cleanup());

describe("progress photos compare", () => {
  it("starts on the first and latest, steps either side and shows them side by side", async () => {
    const user = userEvent.setup();
    render(<Photos />);
    const before = await screen.findByRole("group", { name: "Before" });
    const after = screen.getByRole("group", { name: "After" });
    expect(within(before).getByText("Jan 5")).toBeInTheDocument();
    expect(within(after).getByText("Mar 2")).toBeInTheDocument();
    expect(screen.getByText("8 weeks apart")).toBeInTheDocument();
    expect(within(before).getByRole("button", { name: "Older before photo" })).toBeDisabled();

    await user.click(within(before).getByRole("button", { name: "Newer before photo" }));
    expect(within(before).getByText("Feb 2")).toBeInTheDocument();
    expect(screen.getByText("4 weeks apart")).toBeInTheDocument();
    // Before can't pass after.
    expect(within(before).getByRole("button", { name: "Newer before photo" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Side by side" }));
    expect(screen.getByRole("img", { name: /^Before, Feb 2/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /^After, Mar 2/ })).toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: "Compare before and after" })).toBeNull();
    expect(localStorage.getItem("liftsmith.photoCompare")).toBe("side");
  });

  it("says the weight on each photo's day and the change between them", async () => {
    useApp.getState().logBodyweight(84);
    const evs = useApp.getState().events;
    // Move that weigh-in to the first photo's day, and add one on the latest photo's day.
    useApp.setState({
      events: [
        { ...evs.at(-1)!, at: T0 + DAY } as (typeof evs)[number],
        { ...evs.at(-1)!, id: "w2", at: T0 + 56 * DAY, kg: 81.5 } as (typeof evs)[number],
      ],
    });
    render(<Photos />);
    expect(await screen.findByText("8 weeks apart · −2.5 kg")).toBeInTheDocument();
    expect(screen.getByText(/Jan 5, 2026 · 84 kg/)).toBeInTheDocument();
  });

  it("offers sharing the pair to adults only", async () => {
    const { unmount } = render(<Photos />);
    expect(await screen.findByRole("button", { name: "Share side by side" })).toBeInTheDocument();
    unmount();
    useApp.getState().setProfile({ birthYear: new Date().getFullYear() - 15 });
    render(<Photos />);
    await screen.findByRole("group", { name: "Before" });
    expect(screen.queryByRole("button", { name: "Share side by side" })).toBeNull();
  });
});
