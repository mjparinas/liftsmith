// @vitest-environment jsdom
// Integration test: the whole app from first run to a finished workout, through the real store
// and IndexedDB (fake-indexeddb), the way a lifter uses it.
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setBillingLive } from "@/lib/billing";
import { exercise } from "@/lib/exercises";
import { useApp } from "@/lib/store";

import { App } from "./App";

// jsdom has no canvas.
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

async function onboard(user: ReturnType<typeof userEvent.setup>, gym = /Commercial gym/) {
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: gym }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
}

describe("setup in another language", () => {
  it("runs the setup wizard in the profile's language", async () => {
    const user = userEvent.setup();
    useApp.getState().setProfile({ language: "fr" });
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Commencer" }));
    expect(await screen.findByText("Quel est votre objectif ?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Prendre du muscle/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuer" }));
    expect(await screen.findByText("Où vous entraînez-vous ?")).toBeInTheDocument();
  });
});

describe("welcome screen", () => {
  it("greets a new install before the first question, with sign-in for an existing account", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText("Training that adapts to you")).toBeInTheDocument();
    expect(screen.queryByText("What are you training for?")).toBeNull();
    await user.click(screen.getByRole("button", { name: "I already have an account" }));
    expect(await screen.findByRole("dialog", { name: "Sign in" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: "Get started" }));
    expect(await screen.findByText("What are you training for?")).toBeInTheDocument();
    // Sign-in lives on the welcome screen only, so the goal step has no second button for it.
    expect(screen.queryByRole("button", { name: /Sign in/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("button", { name: "Get started" })).toBeInTheDocument();
  });
});

describe("Pro trial offer", () => {
  afterEach(() => setBillingLive(false));

  it("shows no priced offer while billing isn't live", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Get started" }));
    await screen.findByText("What are you training for?");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Today's workout");
    expect(screen.queryByText(/Start free trial/)).not.toBeInTheDocument();
    expect(useApp.getState().profile.pro).toBeUndefined();
  });

  it("ends first-run setup with the store's trial offer, yearly first, and a free plan to fall back on", async () => {
    setBillingLive(true, null, [
      { plan: "annual", price: "$39.99", perMonth: "$3.33", trialDays: 14 },
      { plan: "monthly", price: "$6.99", trialDays: 14 },
    ]);
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Get started" }));
    await screen.findByText("What are you training for?");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByText("Try Pro free for 14 days");
    const plans = screen.getAllByRole("button", { name: /free trial/ });
    expect(plans[0].textContent).toMatch(/Yearly/);
    expect(plans[0].textContent).toMatch(/then \$39\.99 a year/);
    expect(screen.getByRole("button", { name: "Restore purchases" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Not now, keep the free plan" }));
    await screen.findByText("Today's workout");
    // No Pro: Today follows the free classic 5x5, and the recovery map is locked.
    expect(useApp.getState().profile.pro).toMatchObject({ declinedAt: expect.any(Number) });
    expect(useApp.getState().profile.planSource).toMatchObject({ kind: "program", id: "classic-5x5" });
    expect(useApp.getState().profile.proPlan).toEqual({ kind: "adaptive" });
    await user.click(screen.getByRole("button", { name: "Body" }));
    // Without Pro the Body tab opens on Health (free); Muscles is the locked recovery map.
    expect(await screen.findByTestId("body-health")).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByTestId("body-muscles"));
    expect(await screen.findByText("The recovery map is part of Pro")).toBeInTheDocument();
    // Pro arrives (a purchase, a restore): their adaptive plan comes back.
    act(() =>
      setBillingLive(true, { active: true, trial: true, plan: "annual", expiresAt: Date.now() + 14 * 86_400_000, willRenew: true }),
    );
    await waitFor(() => expect(useApp.getState().profile.planSource).toEqual({ kind: "adaptive" }));
    expect(useApp.getState().profile.proPlan).toBeUndefined();
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
    // every exercise shows its demo, and tapping it opens the how-to with full demo controls.
    // One control, one destination: the demo card is the only way in (no info icon beside it).
    expect(screen.getAllByRole("button", { name: /how to/i })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /how to do it/i })).not.toBeInTheDocument();
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
    expect(sets[0]).toMatchObject({
      exerciseId: plan.items[0].exerciseId,
      reps: plan.items[0].target.reps,
      weight: plan.items[0].target.weight,
    });

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

  it("one-handed controls dock the bumps beside Log set, and holding a bump keeps stepping", async () => {
    const user = userEvent.setup();
    await onboard(user);
    act(() => useApp.getState().setProfile({ a11y: { hand: "left" } }));
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    const skip = screen.queryByRole("button", { name: "Skip warm-up" });
    if (skip) await user.click(skip);
    const dock = screen.getByRole("group", { name: "Adjust this set" });
    // Only the docked buttons, so a screen reader doesn't hear each control twice.
    expect(screen.getAllByRole("button", { name: "More reps" })).toHaveLength(1);
    expect(dock.parentElement!.className).toContain("flex-row-reverse");
    const more = within(dock).getByRole("button", { name: "More reps" });
    const start = useApp.getState().active!.reps;
    fireEvent.click(more); // keyboard or screen reader: one step
    expect(useApp.getState().active!.reps).toBe(start + 1);
    fireEvent.pointerDown(more, { button: 0 });
    await act(() => new Promise((r) => setTimeout(r, 900)));
    fireEvent.pointerUp(more);
    const held = useApp.getState().active!.reps;
    expect(held).toBeGreaterThanOrEqual(start + 4);
    await act(() => new Promise((r) => setTimeout(r, 500)));
    expect(useApp.getState().active!.reps).toBe(held); // stops on release
  });

  it("switches language from Settings, for the app and the page", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/settings/look";
    await user.click(await screen.findByRole("button", { name: "Español" }));
    expect(await screen.findByRole("button", { name: "Hoy" })).toBeInTheDocument();
    expect(document.documentElement.lang).toMatch(/^es/);
    expect(screen.getByRole("heading", { level: 1, name: "Aspecto" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Tamaño del texto" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Français" }));
    expect(await screen.findByRole("button", { name: "Aujourd’hui" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "English" }));
    expect(await screen.findByRole("button", { name: "Today" })).toBeInTheDocument();
  });

  it("shows Progress in the chosen language", async () => {
    const user = userEvent.setup();
    await onboard(user);
    act(() => useApp.getState().setProfile({ language: "fr" }));
    location.hash = "#/stats";
    expect(await screen.findByRole("heading", { level: 1, name: "Progrès" })).toBeInTheDocument();
    expect(screen.getByText("Records personnels")).toBeInTheDocument();
    expect(screen.getByText("Aucune séance pour l’instant")).toBeInTheDocument();
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
    // The pair reads as one block on Today, and the hint says what linking does.
    const rows = within(screen.getByTestId("plan-list")).getAllByRole("listitem");
    expect(rows[0].getAttribute("data-superset")).toBe(plan.items[0].group);
    expect(rows[1].getAttribute("data-superset")).toBe(plan.items[0].group);
    expect(rows[2]?.getAttribute("data-superset") ?? null).toBeNull();
    expect(screen.getByTestId("superset-hint").textContent).toMatch(/one set of each, then one rest/);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    // The link survives a rebuild of the plan (here, the call changing).
    useApp.getState().setCall("normal");
    expect(useApp.getState().preview!.items[1].group).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Start workout" }));
    const skip = async () => {
      const w = screen.queryByRole("button", { name: "Skip warm-up" });
      if (w) await user.click(w);
    };
    await skip();
    // The workout says where the next set goes.
    expect(screen.getByTestId("superset-next").textContent).toBe(`Then ${exercise(b).name}`);
    await user.click(screen.getByRole("button", { name: /Log set/ }));
    // Straight to the second exercise after a short switch.
    expect(useApp.getState().active!.index).toBe(1);
    expect(useApp.getState().active!.restTotal).toBe(15);
    await user.click(screen.getByRole("button", { name: "Skip rest" }));
    await skip();
    expect(screen.getByTestId("superset-next").textContent).toBe(`Then ${exercise(a).name}`);
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
    location.hash = "#/settings/data";
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

  it("saves today's plan as a routine, uses it, and saves a finished workout as one", async () => {
    const user = userEvent.setup();
    await onboard(user);
    const plan = useApp.getState().preview!;
    await user.click(screen.getByRole("button", { name: "Routines" }));
    let dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("No routines yet")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /Save today's plan as a routine/ }));
    dialog = screen.getByRole("dialog");
    const name = within(dialog).getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Monday");
    // Drop the last exercise and add one from the library.
    const last = plan.items[plan.items.length - 1].exerciseId;
    await user.click(
      within(dialog)
        .getAllByRole("button", { name: /^Remove / })
        .at(-1)!,
    );
    await user.click(within(dialog).getByRole("button", { name: "Add exercise" }));
    await user.type(within(dialog).getByLabelText("Search by name, muscle or equipment"), "lateral raise");
    await user.click(within(dialog).getAllByRole("button", { name: /Lateral raise/i })[0]);
    await user.click(within(dialog).getByRole("button", { name: "Save routine" }));
    const saved = useApp.getState().profile.routines!;
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe("Monday");
    expect(saved[0].items.map((i) => i.exerciseId)).not.toContain(last);
    expect(saved[0].items.at(-1)!.exerciseId).toMatch(/lateral-raise/);

    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Use today" }));
    const today = useApp.getState().preview!;
    expect(today.routineId).toBe(saved[0].id);
    expect(today.items.map((i) => i.exerciseId)).toEqual(saved[0].items.map((i) => i.exerciseId));
    // The chip now names the routine, and the plan survives a rebuild.
    expect(screen.getByRole("button", { name: "Monday" })).toHaveAttribute("aria-pressed", "true");
    useApp.getState().replan();
    expect(useApp.getState().preview!.routineId).toBe(saved[0].id);

    await user.click(screen.getByRole("button", { name: "Start workout" }));
    expect(useApp.getState().events.find((e) => e.type === "sessionStart")).toMatchObject({ routine: saved[0].id });
    const skip = screen.queryByRole("button", { name: "Skip warm-up" });
    if (skip) await user.click(skip);
    await user.click(screen.getByRole("button", { name: /Log set/ }));
    await user.click(screen.getByRole("button", { name: "End" }));
    await user.click(screen.getByRole("button", { name: "Finish and save" }));
    await user.click(await screen.findByRole("button", { name: "Save as a routine" }));
    dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Name"), "Short one");
    await user.click(within(dialog).getByRole("button", { name: "Save routine" }));
    const two = useApp.getState().profile.routines!;
    expect(two.map((r) => r.name)).toEqual(["Short one", "Monday"]);
    expect(two[0].items).toEqual([{ exerciseId: saved[0].items[0].exerciseId, sets: 1 }]);
    expect(screen.getByRole("button", { name: "Saved as a routine" })).toBeDisabled();
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
    location.hash = "#/settings/training";
    await user.click(await screen.findByRole("button", { name: "Run setup again" }));
    await screen.findByText("What are you training for?");
    await user.click(screen.getByRole("button", { name: /Get stronger/ }));
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
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
    await user.click(await screen.findByRole("button", { name: "Get started" }));
    await screen.findByText("What are you training for?");
    await user.type(screen.getByLabelText("What should we call you?"), "Melvin Parinas");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
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

describe("programs", () => {
  it("picks a classic program from Settings, plans its day, and logs each set against the program lift", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "Settings" }));
    await user.click(await screen.findByRole("button", { name: /^Training/ }));
    await user.click(await screen.findByRole("button", { name: /Adaptive.*Change/ }));
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
    // Then a 0–10 pain rating, which starts the trend.
    await user.click(within(screen.getByRole("dialog", { name: "How bad is it right now?" })).getByRole("button", { name: "6" }));
    expect(useApp.getState().events.find((e) => e.type === "pain")).toMatchObject({ score: 6 });
    expect(screen.getByRole("img", { name: /Knee pain, oldest to newest: 6/ })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "How does it feel today?" }), "4");
    expect(
      useApp
        .getState()
        .events.filter((e) => e.type === "pain")
        .map((e) => e.type === "pain" && e.score),
    ).toEqual([6, 4]);
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
    expect(useApp.getState().events.find((e) => e.type === "injuryRule")).toMatchObject({
      exerciseId: id,
      action: "light",
      pct: 60,
      ack: true,
    });
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
    const skip = await screen.findByRole("button", { name: /Skip warm-up|Log set/ });
    if (/Skip warm-up/.test(skip.textContent ?? "")) await user.click(skip);
    await user.click(await screen.findByRole("button", { name: /Log set/ }));
    const { affects } = await import("@/lib/injury");
    const { exercise } = await import("@/lib/exercises");
    const items = useApp.getState().active!.plan.items;
    const part = (["shoulder", "knee", "lowerBack", "chest"] as const).find((p) =>
      items.slice(1).some((i) => affects(p, exercise(i.exerciseId))),
    )!;
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
    await user.click(await screen.findByRole("button", { name: /^Look and feel/ }));
    await user.click(await screen.findByRole("switch", { name: "Lean mode" }));
    expect(useApp.getState().profile.lean).toBe(true);
    const { juice } = await import("@/lib/juice");
    expect(juice.lean).toBe(true);
  });
});

describe("saving your progress", () => {
  it("says where the data is saved before setup ends", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Get started" }));
    await screen.findByText("What are you training for?");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Save your progress")).toBeInTheDocument();
    expect(screen.getByText(/saved in this browser as you go/)).toBeInTheDocument();
    expect(screen.getByText(/Add to Home Screen|Install app/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Today's workout");
  });

  it("restores a backup file from Settings", async () => {
    const user = userEvent.setup();
    await onboard(user);
    const { backupJson } = await import("@/lib/exportData");
    const s = useApp.getState();
    const file = backupJson({ ...s.profile, name: "Restored" }, s.gyms, [
      { type: "bodyweight", id: "bw-old", at: Date.now() - 86_400_000, kg: 81 } as never,
    ]);
    Element.prototype.scrollIntoView ??= () => {};
    location.hash = "#/settings/saving";
    await screen.findByText("Saving and backup");
    await user.upload(screen.getByLabelText("Backup file to restore"), new File([file], "backup.json", { type: "application/json" }));
    expect(await screen.findByText("Backup restored.")).toBeInTheDocument();
    expect(useApp.getState().profile.name).toBe("Restored");
    expect(useApp.getState().events.some((e) => e.id === "bw-old")).toBe(true);
    await user.upload(screen.getByLabelText("Backup file to restore"), new File(["{}"], "x.json", { type: "application/json" }));
    expect(await screen.findByText("That file isn't a Liftsmith backup.")).toBeInTheDocument();
  });
});

describe("Labs", () => {
  afterEach(() => {
    setBillingLive(false);
    localStorage.removeItem("liftsmith.flags.local");
  });

  async function startSquat(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: "Today" }));
    await user.click(await screen.findByRole("button", { name: "Start workout" }));
    const skip = screen.queryByRole("button", { name: "Skip warm-up" });
    if (skip) await user.click(skip);
    await screen.findByRole("button", { name: /Log set/ });
  }

  it("is Pro: without it the Labs row is marked Pro and opens Pro, and the workout has no Count reps", async () => {
    setBillingLive(true, null, [{ plan: "annual", price: "$39.99", perMonth: "$3.33", trialDays: 14 }]);
    // Switched on before Pro ran out: still off without Pro.
    localStorage.setItem("liftsmith.flags.local", JSON.stringify({ labRepCount: true }));
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "Get started" }));
    await screen.findByText("What are you training for?");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(await screen.findByRole("button", { name: "Not now, keep the free plan" }));
    await screen.findByText("Today's workout");
    await startSquat(user);
    expect(screen.queryByRole("button", { name: "Count reps with the camera" })).not.toBeInTheDocument();
    location.hash = "#/settings";
    const row = await screen.findByRole("button", { name: /Labs/ });
    expect(row).toHaveTextContent("Pro");
    await user.click(row);
    expect(location.hash).toBe("#/pro/labs");
  });

  it("switches camera rep counting on, and Count reps appears on the squat", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await startSquat(user);
    expect(screen.queryByRole("button", { name: "Count reps with the camera" })).not.toBeInTheDocument();
    location.hash = "#/settings";
    await user.click(await screen.findByRole("button", { name: /Labs/ }));
    const sw = await screen.findByRole("switch", { name: /Camera rep counting/ });
    // Phone motion builds on camera counting, so it shows once that's on.
    expect(screen.queryByRole("switch", { name: /Phone motion/ })).not.toBeInTheDocument();
    await user.click(sw);
    expect(sw).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("switch", { name: /Phone motion/ })).toBeInTheDocument();
    location.hash = "#/workout";
    expect(await screen.findByRole("button", { name: "Count reps with the camera" })).toBeInTheDocument();
  });
});
