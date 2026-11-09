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
});

describe("programs", () => {
  it("picks a classic program from Settings, plans its day, and logs each set against the program lift", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(screen.getByRole("button", { name: /Adaptive.*Change/ }));
    await screen.findByText("Programs");
    await user.click(screen.getByRole("button", { name: /Classic 5×5/ }));
    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText(/StrongLifts 5×5 by Mehdi Hadim/)).toBeTruthy();
    await user.click(within(sheet).getByRole("button", { name: "Start this program" }));
    await screen.findByText(/Classic 5×5 · Workout A/);
    // Fixed programs follow their own rules: no length slider or push / easy call.
    expect(screen.queryByLabelText("Workout length")).toBeNull();
    const plan = useApp.getState().preview!;
    expect(plan.items.map((i) => i.exerciseId)).toEqual(["back-squat", "bench-press", "barbell-row"]);

    await user.click(screen.getByRole("button", { name: "Start workout" }));
    act(() => useApp.getState().skipWarmup());
    act(() => useApp.getState().logSet());
    const set = useApp.getState().events.find((e) => e.type === "set");
    expect(set).toMatchObject({ slot: "back-squat", targetReps: 5, targetWeight: plan.items[0].target.weight });
    expect(useApp.getState().events.find((e) => e.type === "sessionStart")).toMatchObject({ program: { id: "classic-5x5", day: 0 } });
  });

  it("loads each set's own weight in a ramping program", async () => {
    const user = userEvent.setup();
    await onboard(user);
    const { pickProgram } = await import("@/lib/programs");
    const s = useApp.getState;
    const gym = s().gyms[0];
    act(() => s().setProfile({ planSource: pickProgram("ramping-5x5", { profile: s().profile, gym, events: [], now: Date.now() }) }));
    const ramp = s().preview!.items[0].setTargets!;
    act(() => s().start());
    act(() => s().skipWarmup());
    expect(s().active!.weight).toBe(ramp[0].weight);
    act(() => s().logSet());
    expect(s().active!.weight).toBe(ramp[1].weight);
    expect(ramp[1].weight).toBeGreaterThan(ramp[0].weight);
  });
});
