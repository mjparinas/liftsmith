// @vitest-environment jsdom
// The delightful extras in the real app: plate memory and ghost mode in a workout, "same as last time",
// the rest timer extras, the recap and photos screens, buddy check-ins and earned themes.
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCheckins } from "@/lib/buddy";
import { derive } from "@/lib/derive";
import { exercise } from "@/lib/exercises";
import { useSocial } from "@/lib/social";
import type { SocialProfile } from "@/lib/socialTypes";
import { useApp } from "@/lib/store";
import { makeSet } from "@/test/factories";

import { App } from "./App";
import { CheckinToasts } from "./CheckinToasts";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

/** Friends' requests the check-in makes: who is asked for, and what was sent. */
const calls: { op: string; body: Record<string, unknown> }[] = [];
vi.mock("@/lib/social", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/social")>()),
  social: async (op: string, body: Record<string, unknown> = {}) => {
    calls.push({ op, body });
    if (op === "people")
      return {
        people: [
          { handle: "sam", name: "Sam", avatar: "" },
          { handle: "ria", name: "Ria", avatar: "" },
        ],
      };
    if (op === "checkIn") return { sent: (body.handles as string[]).length };
    if (op === "checkins")
      return { checkins: [{ id: "k1", handle: "sam", name: "Sam", avatar: "", gym: "Iron Den", focus: ["chest"], at: Date.now() }] };
    return {};
  },
}));

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
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
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
}

/** Puts a barbell exercise first, so plate memory has something to show. */
function barbellFirst() {
  const p = useApp.getState().preview!;
  const bench = {
    ...p.items[0],
    exerciseId: "bench-press",
    sets: 3,
    warmup: undefined,
    target: { ...p.items[0].target, weight: 60, reps: 8 },
  };
  useApp.getState().setPlan({ ...p, items: [bench, ...p.items.slice(1).filter((it) => it.exerciseId !== "bench-press")] });
  return useApp.getState().preview!.items[0];
}

/** The lifter's own Friends profile, for Check in. */
const MAX: SocialProfile = {
  handle: "max",
  name: "Max",
  open: false,
  autoPost: false,
  weights: true,
  public: false,
  push: { follows: true, comments: true, sent: true, likes: false, cheers: true, posts: true, checkins: true },
  avatar: "",
  audience: "all",
  showLifts: false,
  lifts: [],
  suggest: true,
  live: false,
  cheers: true,
  level: 1,
  streak: 0,
};

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
    expect(screen.getByText("Breathe in through the nose")).toBeInTheDocument();
    expect(screen.getByText("Box breathing · 4-4-4-4")).toBeInTheDocument();
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

    // Next time: same as last time puts the same exercise first, and the ghost shows on the set card. Today says
    // the day's done first; Train again brings the plan back.
    await screen.findByText("Done for today");
    await user.click(screen.getByRole("button", { name: "Train again" }));
    await screen.findByText("Today's workout");
    await user.click(screen.getByRole("button", { name: "Same as last time" }));
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
  it("plans a warm-up part on Today, and Start opens it first", async () => {
    const user = userEvent.setup();
    await onboard(user);
    // Workouts with parts (sessions-with-parts.md): the warm-up is a switch above the plan, for this workout only.
    const parts = screen.getByTestId("today-parts");
    await user.click(within(parts).getByRole("switch", { name: /Warm-up/ }));
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    expect(await screen.findByRole("heading", { name: "Warm-up for today" })).toBeInTheDocument();
    expect(screen.getByTestId("part-step")).toHaveTextContent("Warm-up · 1 of 2");
    expect(within(screen.getByTestId("stretch-routine")).getAllByRole("listitem").length).toBeGreaterThan(2);
    expect(useApp.getState().active?.parts?.map((p) => p.kind)).toEqual(["warm", "lift"]);
  });

  it("opens the stretch library from Today", async () => {
    const user = userEvent.setup();
    await onboard(user);
    // Melvin, 2026-11-14: "Can you add it on today". Before, it was only under Progress › All tools.
    await user.click(screen.getByTestId("today-stretch-library"));
    expect(await screen.findByRole("heading", { name: "Stretching" })).toBeInTheDocument();
  });

  it("adds cardio after the lifting on Today, with its machine and minutes", async () => {
    const user = userEvent.setup();
    await onboard(user);
    // Workouts with parts, stage 5: cardio is a switch under the lifting, off unless a routine has it.
    const row = within(screen.getByTestId("today-parts")).getByTestId("part-cardio");
    await user.click(within(row).getByRole("switch", { name: /Cardio/ }));
    const picker = within(row).getByTestId("cardio-picker");
    await user.click(within(picker).getByRole("button", { name: "30 min" }));
    expect(row).toHaveTextContent("about 30 min");
    // The slider is the whole workout: the bar under it shows where the minutes go (Melvin, 2026-11-14).
    const split = useApp.getState().split!;
    expect(split.cardio + split.lift).toBe(split.total);
    expect(screen.getByTestId("split-cardio")).toHaveTextContent(`Cardio ${split.cardio} min`);
    expect(screen.getByTestId("split-lift")).toHaveTextContent(`Lifting ${split.lift} min`);
    // Lifting can be switched off for a cardio-only day; the exercise list goes, and back on it returns.
    const lift = within(screen.getByTestId("today-parts")).getByTestId("part-lift");
    await user.click(within(lift).getByRole("switch", { name: /Lifting/ }));
    expect(screen.queryByTestId("plan-list")).not.toBeInTheDocument();
    expect(screen.getByTestId("split-why")).toHaveTextContent("No lifting today");
    await user.click(within(lift).getByRole("switch", { name: /Lifting/ }));
    expect(screen.getByTestId("plan-list")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    const a = useApp.getState().active!;
    expect(a.parts?.map((p) => p.kind)).toEqual(["lift", "cardio"]);
    expect(a.plan.items.at(-1)).toMatchObject({ part: "cardio", sets: 1 });
    expect(a.plan.items.at(-1)!.target.reps).toBe(1800);
  });

  it("checks in to friends, and never for under 18s", async () => {
    const user = userEvent.setup();
    await onboard(user);
    // Not in Friends, no Check in: there's nobody to tell.
    expect(screen.queryByRole("button", { name: "Check in" })).not.toBeInTheDocument();
    calls.length = 0;
    try {
      act(() => useSocial.setState({ me: { profile: MAX } }));
      await user.click(await screen.findByRole("button", { name: "Check in" }));
      const sheet = screen.getByRole("dialog", { name: "Tell friends you’re at the gym" });
      // Every friend is picked to start; the lifter leaves Ria out.
      await user.click(await within(sheet).findByRole("button", { name: "Ria", pressed: true }));
      expect(sheet).toHaveTextContent(/Max is at (the gym|Commercial gym)/);
      await user.click(within(sheet).getByRole("button", { name: "Check in" }));
      await waitFor(() => expect(calls.find((c) => c.op === "checkIn")?.body).toMatchObject({ handles: ["sam"] }));
      expect(useApp.getState().events.find((e) => e.type === "checkin")).toMatchObject({ buddies: ["Sam"] });

      // A 16-year-old doesn't get it (Melvin, 2026-11-14).
      await act(async () => useApp.getState().setProfile({ birthYear: new Date().getFullYear() - 16 }));
      expect(screen.queryByRole("button", { name: "Check in" })).not.toBeInTheDocument();
    } finally {
      useSocial.setState({ me: null });
    }
  });

  it("shows a friend's check-in as a toast until it's closed", async () => {
    render(<CheckinToasts hidden={false} />);
    act(() =>
      useCheckins.setState({
        checkins: [{ id: "k1", handle: "sam", name: "Sam", avatar: "", gym: "Iron Den", focus: ["chest"], at: Date.now() }],
      }),
    );
    expect(screen.getByTestId("checkin-toasts")).toHaveTextContent("Sam is at Iron Den, training chest today. Your turn 💪");
    calls.length = 0;
    await userEvent.setup().click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByTestId("checkin-toasts")).not.toBeInTheDocument();
    expect(calls).toEqual([{ op: "checkinDismiss", body: { id: "k1" } }]);
  });

  it("shows the anniversary on Today: day one against today, its share card, and ✕ hides it for the week", async () => {
    const user = userEvent.setup();
    await onboard(user);
    const now = Date.now();
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 1);
    const lift = (at: number, weight: number, sessionId: string) =>
      [0, 1, 2].map((i) => makeSet({ exerciseId: "bench-press", at: at + i * 120_000, weight, reps: 8, sessionId }));
    const events = [...lift(d.getTime(), 40, "first"), ...lift(now - 3 * 86400_000, 60, "recent")];
    act(() => useApp.setState({ events, stats: derive(events, now) }));
    location.hash = "#/today";
    const card = await screen.findByTestId("anniversary");
    expect(within(card).getByText("1 year since your first workout")).toBeInTheDocument();
    expect(within(card).getByRole("columnheader", { name: "Day one" })).toBeInTheDocument();
    expect(within(card).getByText(/Bench press is up 50% since day one/i)).toBeInTheDocument();
    await user.click(within(card).getByRole("button", { name: "Share it" }));
    expect(await screen.findByRole("dialog", { name: "Share" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(within(card).getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.queryByTestId("anniversary")).not.toBeInTheDocument());
  });

  it("shows the recap, body weight and themes", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/stats";
    expect(await screen.findByRole("button", { name: /Monthly recap|Your year in lifting/ })).toBeInTheDocument();
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
    location.hash = "#/settings/workout";
    await user.click(await screen.findByRole("switch", { name: "Ghost mode" }));
    expect(useApp.getState().profile.delight?.ghost).toBe(false);
    // The breathing guide's pattern: box breathing by default, or the lifter's own with steppers.
    await user.click(screen.getByRole("button", { name: "Breathing guide" }));
    expect(screen.getByRole("button", { name: /Box breathing/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Your own/ }));
    await user.click(screen.getByRole("button", { name: "Longer: Breathe out" }));
    await user.click(screen.getByRole("button", { name: "Shorter: Hold, empty" }));
    expect(useApp.getState().profile.delight).toMatchObject({ breath: "custom", breathCustom: { in: 4, hold: 4, out: 5, holdOut: 3 } });
  });
});
