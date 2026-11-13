// @vitest-environment jsdom
// Fixing a finished workout, doing it again, the exercise page and the plate and warm-up calculators
// (Melvin, 2026-11-11: table stakes), through the real store and IndexedDB.
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sessionNoteOf } from "@/lib/editHistory";
import { useApp } from "@/lib/store";
import { makeWorkout } from "@/test/factories";

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

async function onboard(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
}

/** A finished workout earlier today: two squat sets and one leg press set. */
function seedWorkout() {
  const at = Date.now() - 3 * 3600_000;
  useApp.getState().importWorkouts(
    makeWorkout("past", at, [
      { exerciseId: "back-squat", weight: 100, reps: 5 },
      { exerciseId: "back-squat", weight: 100, reps: 5 },
      { exerciseId: "leg-press", weight: 150, reps: 10 },
    ]),
  );
}

async function openHistoryCard() {
  location.hash = "#/stats";
  const card = await screen.findByRole("article");
  return card;
}

describe("editing a finished workout", () => {
  it("changes a set's reps, names the workout and writes a note", async () => {
    const user = userEvent.setup();
    await onboard(user);
    seedWorkout();
    const card = await openHistoryCard();
    await user.click(within(card).getByRole("button", { name: /^Edit the workout on/ }));
    const sheet = await screen.findByRole("dialog", { name: "Edit workout" });
    await user.type(within(sheet).getByLabelText("Name"), "Heavy legs");
    await user.type(within(sheet).getByLabelText("Note"), "Knees felt good");
    await user.click(within(sheet).getAllByRole("button", { name: /100 kg × 5 reps/ })[0]!);
    const reps = within(sheet).getByLabelText("Reps for Back squat, set 1");
    await user.clear(reps);
    await user.type(reps, "6");
    await user.click(within(sheet).getByRole("button", { name: "Save changes" }));

    const after = await openHistoryCard();
    expect(within(after).getByText("100 kg × 6 reps")).toBeInTheDocument();
    expect(within(after).getByTestId("workout-name")).toHaveTextContent("Heavy legs");
    expect(within(after).getByTestId("workout-note")).toHaveTextContent("Knees felt good");
    const sets = useApp.getState().events.filter((e) => e.type === "set" && e.sessionId === "past");
    expect(sets.map((s) => (s.type === "set" ? s.reps : 0)).sort()).toEqual([10, 5, 6]);
    expect(sessionNoteOf(useApp.getState().events, "past")?.name).toBe("Heavy legs");
  });

  it("takes out a set, and deletes the whole workout after asking once", async () => {
    const user = userEvent.setup();
    await onboard(user);
    seedWorkout();
    let card = await openHistoryCard();
    await user.click(within(card).getByRole("button", { name: /^Edit the workout on/ }));
    let sheet = await screen.findByRole("dialog", { name: "Edit workout" });
    await user.click(within(sheet).getByRole("button", { name: /150 kg × 10 reps/ }));
    await user.click(within(sheet).getByRole("button", { name: "Take out this set" }));
    expect(within(sheet).getByRole("status")).toHaveTextContent("1 set will be taken out.");
    await user.click(within(sheet).getByRole("button", { name: "Save changes" }));
    card = await openHistoryCard();
    expect(within(card).queryByText(/Leg press/)).not.toBeInTheDocument();
    expect(useApp.getState().stats.sessions[0]?.sets).toBe(2);

    await user.click(within(card).getByRole("button", { name: /^Edit the workout on/ }));
    sheet = await screen.findByRole("dialog", { name: "Edit workout" });
    await user.click(within(sheet).getByRole("button", { name: "Delete this workout" }));
    await user.click(within(sheet).getByRole("button", { name: "Delete it" }));
    expect(useApp.getState().stats.sessions).toEqual([]);
    expect(useApp.getState().events.some((e) => "sessionId" in e && e.sessionId === "past")).toBe(false);
  });
});

describe("doing a past workout again", () => {
  it("puts its exercises and set counts on Today", async () => {
    const user = userEvent.setup();
    await onboard(user);
    seedWorkout();
    const card = await openHistoryCard();
    await user.click(within(card).getByRole("button", { name: "Do this again" }));
    await screen.findByText("Today's workout");
    expect(useApp.getState().preview?.items.map((i) => [i.exerciseId, i.sets])).toEqual([
      ["back-squat", 2],
      ["leg-press", 1],
    ]);
  });
});

describe("the exercise page", () => {
  it("opens from History with next time's target first, then its records and sessions", async () => {
    const user = userEvent.setup();
    await onboard(user);
    seedWorkout();
    const card = await openHistoryCard();
    await user.click(within(card).getByRole("button", { name: /^Back squat/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Back squat" })).toBeInTheDocument();
    expect(screen.getByTestId("lift-next")).toHaveTextContent(/kg × \d+ reps/);
    expect(screen.getByText("Best for each rep count")).toBeInTheDocument();
    expect(screen.getByTestId("lift-trend")).toHaveTextContent("Log a few more sessions");
    await user.click(screen.getByRole("button", { name: "‹ Back" }));
    expect(await screen.findByRole("article")).toBeInTheDocument();
  });
});

describe("exercise stats", () => {
  /** A squat session a week for ten weeks, 2.5 kg heavier each time. */
  function seedSquats() {
    for (let i = 0; i < 10; i++) {
      const w = 80 + i * 2.5;
      useApp.getState().importWorkouts(
        makeWorkout(`sq${i}`, Date.now() - ((10 - i) * 7 + 2) * 86_400_000, [
          { exerciseId: "back-squat", weight: w, reps: 5 },
          { exerciseId: "back-squat", weight: w, reps: 5 },
        ]),
      );
    }
  }

  it("shows totals, a chart with ranges and how the lift compares", async () => {
    const user = userEvent.setup();
    await onboard(user);
    useApp.getState().setProfile({ bodyweight: 80, birthYear: new Date().getFullYear() - 34, sex: "male" });
    seedSquats();
    location.hash = "#/exercise/back-squat";
    const totals = await screen.findByTestId("lift-totals");
    expect(within(totals).getByText("20")).toBeInTheDocument();
    expect(within(totals).getByText("10")).toBeInTheDocument();
    expect(within(totals).getByText("Estimated max")).toBeInTheDocument();

    const chart = screen.getByTestId("lift-chart");
    expect(within(chart).getByRole("button", { name: "3 months" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("lift-change")).toHaveTextContent(/^Up \d+% across this range\.$/);
    await user.click(within(chart).getByRole("button", { name: "Week" }));
    expect(within(chart).getByText("No sessions in this range. Pick a longer one.")).toBeInTheDocument();
    await user.click(within(chart).getByRole("button", { name: "Year" }));
    await user.click(within(chart).getByRole("button", { name: "Heaviest set" }));
    expect(within(chart).getByText(/Latest 102\.5 kg/)).toBeInTheDocument();

    const compare = screen.getByTestId("lift-compare");
    expect(compare).toHaveTextContent("Trained men in their 30s who weigh about 80 kg.");
    expect(compare).toHaveTextContent(/Stronger than about \d+% of them/);
    expect(compare).toHaveTextContent("not other Liftsmith users' data");
  });

  it("opens any exercise from the library on Progress", async () => {
    const user = userEvent.setup();
    await onboard(user);
    seedSquats();
    location.hash = "#/stats";
    await user.click(await screen.findByRole("button", { name: "All exercises ›" }));
    const mine = await screen.findByTestId("lib-mine");
    await user.click(within(mine).getByRole("button", { name: /Back squat/ }));
    expect(await screen.findByRole("heading", { level: 1, name: "Back squat" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "‹ Back" }));
    await user.type(await screen.findByRole("searchbox"), "romanian");
    await user.click((await screen.findAllByRole("button", { name: /Romanian deadlift/ }))[0]!);
    expect(await screen.findByRole("heading", { level: 1, name: /Romanian deadlift/ })).toBeInTheDocument();
    expect(screen.getByText("Not done yet")).toBeInTheDocument();
  });
});

describe("the plate and warm-up calculators", () => {
  it("loads the bar from the gym's own plates", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/tools";
    await user.click(await screen.findByRole("button", { name: /Plate calculator/ }));
    const box = await screen.findByLabelText("Weight on the bar (kg)");
    await user.clear(box);
    await user.type(box, "100");
    expect(screen.getByTestId("plate-result")).toHaveTextContent("Each side: 25 + 15 kg");
  });

  it("ramps up to the working weight", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/tools/warmup";
    const result = await screen.findByTestId("warmup-result");
    expect(within(result).getByText("Working sets: 100 kg")).toBeInTheDocument();
    expect(within(result).getByText("20 kg × 10")).toBeInTheDocument();
  });
});
