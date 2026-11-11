// @vitest-environment jsdom
// Changing the dumbbells and kettlebells a gym owns (Melvin, 2026-11-11: "How do I customize dumb bells?"),
// through the real store and IndexedDB.
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useApp } from "@/lib/store";

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

async function openGym(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: /Dumbbells only/ }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
  location.hash = "#/gym";
  await screen.findByText("Dumbbells (kg, each)");
}

const dumbbells = () => useApp.getState().gyms[0]!.dumbbells;

describe("customizing dumbbells", () => {
  it("switches to adjustable dumbbells, drops a pair and adds an odd one", async () => {
    const user = userEvent.setup();
    await openGym(user);
    await user.click(screen.getByRole("button", { name: /2 to 30 kg, 15 pairs/ }));
    const sheet = screen.getByRole("dialog", { name: "Your dumbbells" });
    await user.click(within(sheet).getByRole("button", { name: "Adjustable" }));
    expect(dumbbells()).toEqual([2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 24]);

    // Tapping a pair takes it out; it stays on screen so a second tap puts it back.
    await user.click(within(sheet).getByRole("button", { name: "24" }));
    expect(dumbbells()).not.toContain(24);
    expect(within(sheet).getByRole("button", { name: "24" })).toHaveAttribute("aria-pressed", "false");
    await user.click(within(sheet).getByRole("button", { name: "24" }));
    expect(dumbbells()).toContain(24);

    await user.type(within(sheet).getByRole("textbox", { name: "Weight to add" }), "27.5");
    await user.click(within(sheet).getByRole("button", { name: "Add" }));
    expect(dumbbells().at(-1)).toBe(27.5);
  });

  it("fills a range from lightest, heaviest and step", async () => {
    const user = userEvent.setup();
    await openGym(user);
    await user.click(screen.getByRole("button", { name: /15 pairs/ }));
    const sheet = screen.getByRole("dialog", { name: "Your dumbbells" });
    const to = within(sheet).getByRole("textbox", { name: "Heaviest" });
    await user.clear(to);
    await user.type(to, "10");
    await user.click(within(sheet).getByRole("button", { name: "Use these 5 weights" }));
    expect(dumbbells()).toEqual([2, 4, 6, 8, 10]);
  });

  it("edits kettlebells the same way", async () => {
    const user = userEvent.setup();
    await openGym(user);
    await user.click(screen.getByRole("button", { name: /8 to 32 kg, 7 bells/ }));
    const sheet = screen.getByRole("dialog", { name: "Your kettlebells" });
    await user.click(within(sheet).getByRole("button", { name: "Full set" }));
    expect(useApp.getState().gyms[0]!.kettlebells).toHaveLength(12);
  });
});
