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
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Not now, keep the free plan" }));
  await screen.findByText("Today's workout");
}

describe("Pro trial offer", () => {
  it("ends first-run setup with the trial offer, yearly first, and records the choice", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("What are you training for?");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByText("Try Pro free for 14 days");
    const plans = screen.getAllByRole("button", { name: /Start free trial/ });
    expect(plans[0].textContent).toMatch(/Yearly/);
    await user.click(plans[0]);
    await screen.findByText("Today's workout");
    expect(useApp.getState().profile.pro).toMatchObject({ plan: "annual", trialDays: 14 });
  });
});

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

describe("injury mode", () => {
  it("logs an injury from Today, skips its exercises, warns before training one lighter, and ends when healed", async () => {
    const { affects } = await import("@/lib/injury");
    const { exercise } = await import("@/lib/exercises");
    const user = userEvent.setup();
    await onboard(user);
    const kneeIn = (ids: string[]) => ids.filter((id) => affects("knee", exercise(id)));
    await user.click(screen.getByRole("button", { name: "Something hurts?" }));
    expect(await screen.findByText(/isn't medical advice/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Log an injury" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Knee" }));
    expect(kneeIn(useApp.getState().preview!.items.map((i) => i.exerciseId))).toEqual([]);

    // Choosing to train one lighter needs the risk warning ticked first.
    const card = screen.getByRole("region", { name: "Knee injury" });
    const first = within(card).getAllByRole("group", { name: /with a knee injury/ })[0];
    const name = first.getAttribute("aria-label")!.replace(" with a knee injury", "");
    const id = (await import("@/lib/exercises")).EXERCISES.find((e) => e.name === name)!.id;
    await user.click(within(first).getByRole("button", { name: "Lighter" }));
    const warn = screen.getByRole("dialog", { name: "Before you train it" });
    expect(within(warn).getByText(/make the injury worse/)).toBeInTheDocument();
    const go = within(warn).getByRole("button", { name: "Train it at 70%" });
    expect(go).toBeDisabled();
    await user.click(within(warn).getByRole("button", { name: "60%" }));
    await user.click(within(warn).getByRole("checkbox", { name: "I understand the risks" }));
    await user.click(within(warn).getByRole("button", { name: "Train it at 60%" }));
    expect(useApp.getState().events.find((e) => e.type === "injuryRule")).toMatchObject({ exerciseId: id, action: "light", pct: 60, ack: true });
    expect(within(card).getByText("60% load")).toBeInTheDocument();
    const leg = useApp.getState().preview!.items.find((i) => i.exerciseId === id);
    if (leg) expect(leg.injuryPct).toBe(60);

    await user.click(within(card).getByRole("button", { name: "I'm fully healed" }));
    await user.click(screen.getByRole("button", { name: "Yes, it's fully healed" }));
    expect(screen.queryByRole("region", { name: "Knee injury" })).not.toBeInTheDocument();
    expect(screen.getByText(/Nothing logged/)).toBeInTheDocument();
  });

  it("an injury logged mid-workout swaps the exercises not started yet", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    await user.click(await screen.findByRole("button", { name: /Log set/ }));
    const { affects } = await import("@/lib/injury");
    const { exercise } = await import("@/lib/exercises");
    const items = useApp.getState().active!.plan.items;
    const part = (["shoulder", "knee", "lowerBack", "chest"] as const).find((p) => items.slice(1).some((i) => affects(p, exercise(i.exerciseId))))!;
    act(() => void useApp.getState().logInjury(part));
    const after = useApp.getState().active!.plan.items;
    expect(after[0].exerciseId).toBe(items[0].exerciseId);
    expect(after.slice(1).filter((i) => affects(part, exercise(i.exerciseId)))).toEqual([]);
  });
});

describe("game layer", () => {
  it("finishing a workout unlocks badges and a crate, and Awards shows quests, league and badges", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    await user.click(await screen.findByRole("button", { name: /Log set/ }));
    await user.click(screen.getByRole("button", { name: "End" }));
    await user.click(screen.getByRole("button", { name: "Finish and save" }));
    const unlockedList = await screen.findByRole("region", { name: "Badges unlocked" });
    expect(within(unlockedList).getByText("Showing up")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /You earned a crate/ }));
    expect(screen.getByText(/Common|Rare|Epic|Legendary/)).toBeInTheDocument();
    expect(screen.getByText(/-week streak/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "See all achievements" }));
    expect(await screen.findByRole("heading", { name: "Achievements" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Weekly quests" }).children).toHaveLength(3);
    expect(screen.getByText(/Bronze league/)).toBeInTheDocument();
    expect(screen.getByText(/of \d+ badges earned/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Secret" }));
    expect(screen.getAllByText("Secret achievement").length).toBeGreaterThan(5);
  });

  it("lean mode is one switch in Settings", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: "Lean mode" }));
    expect(useApp.getState().profile.lean).toBe(true);
    const { juice } = await import("@/lib/juice");
    expect(juice.lean).toBe(true);
  });
});
