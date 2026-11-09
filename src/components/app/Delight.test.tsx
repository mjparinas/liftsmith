// @vitest-environment jsdom
// The delightful extras in the real app: plate memory and ghost mode in a workout, "same as last time",
// the rest timer extras, the recap and photos screens, buddy check-ins and earned themes.
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useApp } from "@/lib/store";
import { exercise } from "@/lib/exercises";
import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  Element.prototype.scrollIntoView ??= () => {};
  location.hash = "";
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(cleanup);

async function skipWarmups(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole("button", { name: /Log set|Log warm-up/ });
  const skip = screen.queryByRole("button", { name: "Skip warm-up" });
  if (skip) await user.click(skip);
}

async function onboard(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Not now, keep the free plan" }));
  await screen.findByText("Today's workout");
}

/** Puts a barbell exercise first, so plate memory has something to show. */
function barbellFirst() {
  const p = useApp.getState().preview!;
  const bench = { ...p.items[0], exerciseId: "bench-press", sets: 3, warmup: undefined, target: { ...p.items[0].target, weight: 60, reps: 8 } };
  useApp.getState().setPlan({ ...p, items: [bench, ...p.items.slice(1).filter((it) => it.exerciseId !== "bench-press")] });
  return useApp.getState().preview!.items[0];
}

describe("workout extras", () => {
  it("shows only the plates to change, ghost mode and same as last time, and a breathing guide on rest", async () => {
    const user = userEvent.setup();
    await onboard(user);
    const first = barbellFirst();
    expect(exercise(first.exerciseId).load).toBe("barbell");
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    await skipWarmups(user);
    await user.click(screen.getByRole("button", { name: /Log set/ }));
    // Resting: the next set is the same weight, so no plates change.
    expect(await screen.findByText("Same plates: no change")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Breathe" }));
    expect(screen.getByText(/Breathe in|Long breath out/)).toBeInTheDocument();
    expect(useApp.getState().profile.delight?.restExtra).toBe("breathe");
    await user.click(screen.getByRole("button", { name: "Skip rest" }));
    // A heavier next set: only the change is shown.
    await user.click(screen.getByRole("button", { name: "More weight" }));
    expect(screen.getByText(/^Add .* each side$|^Take off .* each side$/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Log set/ }));
    await user.click(screen.getByRole("button", { name: "End" }));
    await user.click(screen.getByRole("button", { name: "Finish and save" }));
    await screen.findByText(/Workout done|new PR/);
    await user.click(screen.getByRole("button", { name: "Done" }));

    // Next time: same as last time puts the same exercise first, and the ghost shows on the set card.
    await screen.findByText("Today's workout");
    await user.click(screen.getByRole("button", { name: "↻ Same as last time" }));
    expect(useApp.getState().preview!.items.map((i) => i.exerciseId)).toEqual([first.exerciseId]);
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    await skipWarmups(user);
    await screen.findByRole("button", { name: /Log set/ });
    expect(screen.queryByText(/Same as last time \(/) ?? screen.queryByRole("button", { name: /Last time .* Use it/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Log set/ }));
    expect(await screen.findByText(/Last time: /)).toBeInTheDocument();
  });
});

describe("Today and Progress extras", () => {
  it("offers a warm-up and a buddy check-in that records the event", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "🔥 Warm up first" }));
    const warm = screen.getByRole("dialog", { name: "Five-minute warm-up" });
    expect(within(warm).getAllByRole("listitem").length).toBeGreaterThan(2);
    await user.click(within(warm).getAllByRole("button")[0]);
    expect(within(warm).getAllByRole("button")[0]).toHaveAttribute("aria-pressed", "true");
    await user.click(warm.parentElement!);

    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await user.click(screen.getByRole("button", { name: "👋 Check in" }));
    const sheet = screen.getByRole("dialog", { name: "Tell your gym buddies" });
    await user.type(within(sheet).getByLabelText("Buddy's name"), "Sam");
    await user.click(within(sheet).getByRole("button", { name: "Add" }));
    expect(useApp.getState().profile.delight?.buddies?.map((b) => b.name)).toEqual(["Sam"]);
    await user.click(within(sheet).getByRole("button", { name: "Check in" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/^Hey Sam! I'm at the gym/));
    expect(useApp.getState().events.find((e) => e.type === "checkin")).toMatchObject({ buddies: ["Sam"] });
  });

  it("shows lifetime tonnage, the recap, body weight and themes", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/stats";
    expect(await screen.findByText("Lifted in total")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Body and photos/ }));
    await user.clear(await screen.findByRole("textbox", { name: /Body weight in/ }));
    await user.type(screen.getByRole("textbox", { name: /Body weight in/ }), "81.5");
    await user.click(screen.getByRole("button", { name: "Log" }));
    expect(useApp.getState().profile.bodyweight).toBeCloseTo(81.5);
    expect(useApp.getState().events.some((e) => e.type === "bodyweight")).toBe(true);
    location.hash = "#/recap";
    expect(await screen.findByText(/No workouts in/)).toBeInTheDocument();
    location.hash = "#/settings/themes";
    const midnight = await screen.findByRole("button", { name: /Midnight/ });
    expect(midnight).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Forge/ })).toBeDisabled();
    await user.click(screen.getAllByRole("button", { name: "On" })[0]);
  });
});
