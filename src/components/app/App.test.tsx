// @vitest-environment jsdom
// Integration test: the whole app from first run to a finished workout, through the real store
// and IndexedDB (fake-indexeddb), the way a lifter uses it.
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useApp } from "@/lib/store";
import { App } from "./App";

// jsdom has no canvas.
vi.mock("canvas-confetti", () => ({ default: () => {} }));

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  location.hash = "";
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(cleanup);

async function onboard(user: ReturnType<typeof userEvent.setup>, gym = /Commercial gym/) {
  render(<App />);
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: gym }));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Build my first workout" }));
  await screen.findByText("Today's workout");
}

describe("first run to finished workout", () => {
  it("onboards, plans, logs sets with rest, and saves the session", async () => {
    const user = userEvent.setup();
    await onboard(user);
    expect(useApp.getState().gyms).toHaveLength(1);
    const plan = useApp.getState().preview!;
    expect(plan.items.length).toBeGreaterThan(2);

    await user.click(screen.getByRole("button", { name: "Start workout" }));
    await screen.findByRole("button", { name: /Log set/ });
    expect(screen.getByText(/Set 1 of/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Log set/ }));
    expect(await screen.findByText("Rest")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+30 s" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Skip rest" }));
    expect(screen.getByText(/Set 2 of/)).toBeInTheDocument();

    const sets = useApp.getState().events.filter((e) => e.type === "set");
    expect(sets).toHaveLength(1);
    expect(sets[0]).toMatchObject({ exerciseId: plan.items[0].exerciseId, reps: plan.items[0].target.reps, weight: plan.items[0].target.weight });

    await user.click(screen.getByRole("button", { name: "End" }));
    await user.click(screen.getByRole("button", { name: "Finish and save" }));
    expect(await screen.findByText(/Workout done|new PR/)).toBeInTheDocument();
    expect(useApp.getState().stats.sessions).toHaveLength(1);
    expect(useApp.getState().active).toBeNull();
  });

  it("the steppers change what gets logged", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    const before = useApp.getState().active!;
    await user.click(screen.getByRole("button", { name: "More reps" }));
    await user.click(screen.getByRole("button", { name: /Log set/ }));
    const set = useApp.getState().events.find((e) => e.type === "set")!;
    expect(set.type === "set" && set.reps).toBe(before.reps + 1);
  });

  it("swaps an exercise for one that hits the same muscles", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    const from = useApp.getState().active!.plan.items[0].exerciseId;
    await user.click(screen.getByRole("button", { name: "Swap exercise" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getAllByRole("button", { name: /Swap$/ })[0]);
    const to = useApp.getState().active!.plan.items[0].exerciseId;
    expect(to).not.toBe(from);
    expect(useApp.getState().events.some((e) => e.type === "swap" && e.from === from && e.to === to)).toBe(true);
  });

  it("a bodyweight gym only plans bodyweight exercises", async () => {
    const user = userEvent.setup();
    await onboard(user, /Bodyweight/);
    expect(screen.queryByText(/kg ·|kg each/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Bodyweight/).length).toBeGreaterThan(0);
  });

  it("setup can be run again from Settings without losing gyms", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/settings";
    await user.click(await screen.findByRole("button", { name: "Run setup again" }));
    await screen.findByText("What are you training for?");
    await user.click(screen.getByRole("button", { name: /Get stronger/ }));
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(useApp.getState().profile.goal).toBe("strength");
    expect(useApp.getState().gyms).toHaveLength(1);
  });

  it("a workout in progress survives a reload", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    await user.click(screen.getByRole("button", { name: /Log set/ }));
    const id = useApp.getState().active!.sessionId;
    cleanup();
    useApp.setState({ ready: false, active: null, events: [] });
    await act(async () => {
      await useApp.getState().init();
    });
    expect(useApp.getState().active?.sessionId).toBe(id);
    expect(useApp.getState().events.filter((e) => e.type === "set")).toHaveLength(1);
  });
});
