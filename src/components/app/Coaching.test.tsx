// @vitest-environment jsdom
// Integration tests for the coaching features (Melvin, 2026-11-09): "why this weight", changing the
// plan mid-workout, machine settings, shared workout links, lift goals and what to buy next, through
// the real store and IndexedDB.
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { encodeRemix } from "@/lib/remix";
import { remainingSeconds } from "@/lib/replan";
import { useApp } from "@/lib/store";
import { App } from "./App";

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
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Not now, keep the free plan" }));
  await screen.findByText("Today's workout");
}

async function skipWarm(user: ReturnType<typeof userEvent.setup>) {
  const skip = screen.queryByRole("button", { name: "Skip warm-up" });
  if (skip) await user.click(skip);
}

describe("coaching in the workout", () => {
  it("explains the suggested weight", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    await skipWarm(user);
    await user.click(await screen.findByRole("button", { name: /Why\?/ }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/first time/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/in reserve/)).toBeInTheDocument();
  });

  it("fits the rest of the workout into the minutes left", async () => {
    const user = userEvent.setup();
    await onboard(user);
    useApp.getState().setProfile({ minutes: 75 });
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    const before = remainingSeconds(useApp.getState().active!.plan.items, 0, 0);
    await user.click(await screen.findByRole("button", { name: "Change the plan" }));
    await user.click(screen.getByRole("button", { name: "15 min left" }));
    expect(screen.getByText(/now fits/)).toBeInTheDocument();
    const after = remainingSeconds(useApp.getState().active!.plan.items, 0, 0);
    expect(after).toBeLessThan(before);
  });

  it("does a busy exercise later", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = `#/remix/${encodeRemix([{ exerciseId: "leg-press", sets: 3, restSec: 120, target: { reps: 10 } }, { exerciseId: "lat-pulldown", sets: 3, restSec: 90, target: { reps: 10 } }])}`;
    await user.click(await screen.findByRole("button", { name: "Start this workout" }));
    await skipWarm(user);
    const first = useApp.getState().active!.plan.items[0].exerciseId;
    expect(first).toBe("leg-press");
    await user.click(await screen.findByRole("button", { name: "Change the plan" }));
    await user.click(screen.getByRole("button", { name: /later$/ }));
    expect(useApp.getState().active!.plan.items[1].exerciseId).toBe(first);
  });

  it("remembers machine settings for this gym", async () => {
    const user = userEvent.setup();
    await onboard(user);
    // A leg press workout, from a shared link.
    location.hash = `#/remix/${encodeRemix([{ exerciseId: "leg-press", sets: 3, restSec: 120, target: { reps: 10 } }])}`;
    await user.click(await screen.findByRole("button", { name: "Start this workout" }));
    await skipWarm(user);
    await user.click(await screen.findByRole("button", { name: /Save setup/ }));
    await user.type(screen.getByRole("textbox", { name: "Back angle" }), "3");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Back angle 3")).toBeInTheDocument();
    const gym = useApp.getState().gyms[0];
    expect(gym.settings?.["leg-press"]).toEqual([{ label: "Back angle", value: "3" }]);
  });
});

describe("shared workouts", () => {
  it("opens a link rebuilt for a gym without the equipment", async () => {
    const user = userEvent.setup();
    await onboard(user, /Dumbbells only/);
    location.hash = `#/remix/${encodeRemix([{ exerciseId: "bench-press", sets: 4, restSec: 180, target: { reps: 6 } }])}`;
    expect(await screen.findByText("Shared workout")).toBeInTheDocument();
    expect(screen.getByText(/closest match here/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start this workout" }));
    const a = useApp.getState().active!;
    expect(a.plan.items[0].exerciseId).not.toBe("bench-press");
    expect(a.plan.items[0].sets).toBe(4);
  });

  it("says so when a link is broken", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/remix/garbage";
    expect(await screen.findByText(/didn’t open/)).toBeInTheDocument();
  });
});

describe("goals and buying advice", () => {
  it("adds a lift goal with an honest forecast", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    await skipWarm(user);
    await user.click(await screen.findByRole("button", { name: /Log set/ }));
    await user.click(screen.getByRole("button", { name: "End" }));
    await user.click(screen.getByRole("button", { name: "Finish and save" }));
    await screen.findByText(/Workout done|new PR/);
    location.hash = "#/stats";
    await user.click(await screen.findByRole("button", { name: "+ Add goal" }));
    await user.type(screen.getByRole("spinbutton"), "500");
    expect(screen.getByText(/Not realistic yet/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Set goal" }));
    expect(useApp.getState().profile.goals).toHaveLength(1);
  });

  it("suggests what to buy for a home gym and adds it when bought", async () => {
    const user = userEvent.setup();
    await onboard(user, /Dumbbells only/);
    location.hash = "#/gym";
    expect(await screen.findByText("What to buy next")).toBeInTheDocument();
    const before = useApp.getState().gyms[0].equipment.length;
    await user.click(screen.getAllByRole("button", { name: "I have it" })[0]);
    expect(useApp.getState().gyms[0].equipment.length).toBe(before + 1);
  });
});
