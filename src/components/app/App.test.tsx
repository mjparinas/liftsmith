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
    // Warm-ups first, each logged as its own event with a short rest after it.
    const warmups = plan.items[0].warmup ?? [];
    for (let i = 0; i < warmups.length; i++) {
      expect(await screen.findByText(new RegExp(`Warm-up ${i + 1} of ${warmups.length}`))).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Log warm-up/ }));
      await user.click(screen.getByRole("button", { name: "Skip rest" }));
    }
    expect(useApp.getState().events.filter((e) => e.type === "warmup")).toHaveLength(warmups.length);
    await screen.findByRole("button", { name: /Log set/ });
    expect(screen.getByText(/Set 1 of/)).toBeInTheDocument();
    // every exercise shows its demo, and tapping it opens the how-to with full demo controls
    await user.click(screen.getByRole("button", { name: "How to ›" }));
    expect(await screen.findByRole("button", { name: "Skeleton" })).toBeInTheDocument();
    await user.click(screen.getByRole("dialog").parentElement!); // tap outside the sheet

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
    const skip = screen.queryByRole("button", { name: "Skip warm-up" });
    if (skip) await user.click(skip);
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

  it("supersets two exercises on Today and alternates them in the workout", async () => {
    const user = userEvent.setup();
    await onboard(user);
    const before = useApp.getState().preview!;
    const [a, b] = before.items.map((i) => i.exerciseId);
    const toggle = screen.getAllByRole("button", { name: /^Superset .* with / })[0];
    await user.click(toggle);
    const plan = useApp.getState().preview!;
    expect(plan.items[0].group).toBeDefined();
    expect(plan.items[1].group).toBe(plan.items[0].group);
    expect(plan.estMinutes).toBeLessThanOrEqual(before.estMinutes);
    expect(screen.getAllByText("Superset A · 1 of 2").length).toBeGreaterThan(0);
    // The link survives a rebuild of the plan (here, the call changing).
    useApp.getState().setCall("normal");
    expect(useApp.getState().preview!.items[1].group).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Start workout" }));
    const skip = async () => {
      const w = screen.queryByRole("button", { name: "Skip warm-up" });
      if (w) await user.click(w);
    };
    await skip();
    await user.click(screen.getByRole("button", { name: /Log set/ }));
    // Straight to the second exercise after a short switch.
    expect(useApp.getState().active!.index).toBe(1);
    expect(useApp.getState().active!.restTotal).toBe(15);
    await user.click(screen.getByRole("button", { name: "Skip rest" }));
    await skip();
    await user.click(screen.getByRole("button", { name: /Log set/ }));
    // Round done: back to the first, after a full rest.
    expect(useApp.getState().active!.index).toBe(0);
    expect(useApp.getState().active!.restTotal).toBeGreaterThan(15);
    const sets = useApp.getState().events.filter((e) => e.type === "set");
    expect(sets.map((e) => e.type === "set" && e.exerciseId)).toEqual([a, b]);
    expect(sets.every((e) => e.type === "set" && e.superset === plan.items[0].group)).toBe(true);

    // Split them mid-workout from the Coming up list.
    await user.click(screen.getByRole("button", { name: /^Split / }));
    expect(useApp.getState().active!.plan.items[0].group).toBeUndefined();
  });

  it("imports a Strong export from Settings, once", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/settings";
    const csv = [
      "Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE",
      "2026-01-05 18:00:00,Push,50m,Bench Press (Barbell),1,100,5,0,0,,,",
      "2026-01-05 18:00:00,Push,50m,Bench Press (Barbell),2,100,5,0,0,,,",
      "2026-01-05 18:00:00,Push,50m,Mystery Lift,1,20,10,0,0,,,",
    ].join("\n");
    const file = () => new File([csv], "strong.csv", { type: "text/csv" });
    await user.upload(await screen.findByLabelText("CSV file to import"), file());
    const dialog = await screen.findByRole("dialog", { name: "Import from Strong" });
    expect(within(dialog).getByText(/1 workout, 3 sets/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "lb" }));
    expect(within(dialog).getByLabelText("Bench Press (Barbell)")).toHaveValue("bench-press");
    expect(within(dialog).getByLabelText("Mystery Lift")).toHaveValue("custom");
    await user.click(within(dialog).getByRole("button", { name: "Import" }));
    expect(await screen.findByText("Imported 1 workout with 3 sets.")).toBeInTheDocument();
    const ev = useApp.getState().events;
    expect(ev.filter((e) => e.type === "set")).toHaveLength(3);
    expect(ev.some((e) => e.type === "customExercise" && e.exercise.name === "Mystery Lift")).toBe(true);
    expect(useApp.getState().stats.sessions).toHaveLength(1);
    // The same file again adds nothing.
    await user.upload(screen.getByLabelText("CSV file to import"), file());
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Import" }));
    expect(await screen.findByText("Those workouts are already here.")).toBeInTheDocument();
    expect(useApp.getState().events.filter((e) => e.type === "set")).toHaveLength(3);
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
    const skip = screen.queryByRole("button", { name: "Skip warm-up" });
    if (skip) await user.click(skip);
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

  it("setup asks for a name, Today greets with it, and the daily quote can be turned off", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("What are you training for?");
    await user.type(screen.getByLabelText("What should we call you?"), "Melvin Parinas");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Not now, keep the free plan" }));
    await screen.findByText("Today's workout");
    expect(useApp.getState().profile.name).toBe("Melvin Parinas");
    expect(screen.getByText(/^Good (morning|afternoon|evening), Melvin$/)).toBeInTheDocument();
    expect(screen.getByRole("figure", { name: "Quote of the day" })).toBeInTheDocument();
    act(() => useApp.getState().setProfile({ quotes: false }));
    expect(screen.queryByRole("figure", { name: "Quote of the day" })).not.toBeInTheDocument();
  });
});

describe("greeting", () => {
  it("uses the time of day and the first name only", async () => {
    const { greeting } = await import("./Today");
    expect(greeting(8, "")).toBe("Good morning");
    expect(greeting(14, "  ")).toBe("Good afternoon");
    expect(greeting(20, "Melvin Parinas")).toBe("Good evening, Melvin");
    expect(greeting(2, "Sam")).toBe("Good evening, Sam");
  });
});

describe("game layer", () => {
  it("finishing a workout unlocks badges and a crate, and Awards shows quests, league and badges", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    // Warm-ups don't earn XP or badges, so go straight to a working set.
    const skip = screen.queryByRole("button", { name: "Skip warm-up" });
    if (skip) await user.click(skip);
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
