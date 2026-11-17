// @vitest-environment jsdom
// Rehab protocols on Today (2026-11-17, docs/decisions/trainer-mode.md "Rehab protocols"): the day-after pain check, and
// the pain rule's answer with a one-tap move when the physio allowed it.
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { phaseItems, rehabProgram } from "@/lib/rehab";
import { useApp } from "@/lib/store";
import type { AppEvent, RehabPlan } from "@/lib/types";

import { App } from "./App";
import { NextDayPain, RehabPhaseToday } from "./RehabPhase";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

const DAY = 86_400_000;
const knee = rehabProgram("knee")!;

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  location.hash = "";
  localStorage.clear();
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
  cleanup();
}

/** A knee protocol routine, a knee injury, and rehab workouts with a pain rating after each. */
function setUp(plan: RehabPlan, workouts: { daysAgo: number; pain: number }[]) {
  const now = Date.now();
  act(() => {
    useApp.getState().saveRoutine({
      id: "knee",
      name: "Knee rehab, phase 1",
      items: phaseItems(knee, plan.phase),
      rehab: true,
      rehabPart: "knee",
      rehabPlan: plan,
      createdAt: now - 30 * DAY,
      updatedAt: now - 30 * DAY,
    });
  });
  let injuryId = "";
  act(() => void (injuryId = useApp.getState().logInjury("knee")));
  const extra: AppEvent[] = workouts.flatMap(({ daysAgo, pain }, i) => [
    { type: "sessionStart", id: `ss${i}`, at: now - daysAgo * DAY, sessionId: `s${i}`, routine: "knee" } as AppEvent,
    { type: "pain", id: `p${i}`, at: now - daysAgo * DAY + 600_000, injuryId, score: pain, sessionId: `s${i}`, exerciseId: "wall-sit" },
  ]);
  act(() => useApp.setState((s) => ({ events: [...s.events, ...extra] })));
  return injuryId;
}

const six = (pain: number) => [14, 12, 10, 8, 6, 4].map((daysAgo) => ({ daysAgo, pain }));

describe("the pain rule on Today", () => {
  it("offers the next phase when the physio allowed it, and moving swaps in its exercises", async () => {
    const user = userEvent.setup();
    await onboard(user);
    setUp({ id: "knee", phase: 1, self: true, since: 0 }, six(1));
    render(<RehabPhaseToday />);
    const card = screen.getByTestId("rehab-phase");
    expect(card).toHaveTextContent("Ready for phase 2: Build strength");
    expect(card).toHaveTextContent("Pain 2 or less after each of the last 3 sessions, and no flare the next day.");
    await user.click(within(card).getByRole("button", { name: "Move up to phase 2" }));
    const r = useApp.getState().profile.routines!.find((x) => x.id === "knee")!;
    expect(r).toMatchObject({ name: "Knee rehab, phase 2", items: phaseItems(knee, 2), rehabPlan: { phase: 2, self: true } });
    // The new phase starts counting from now, so there's nothing to say yet.
    expect(screen.queryByTestId("rehab-phase")).toBeNull();
  });

  it("says the physio decides when they didn't allow it, and Got it hides the card", async () => {
    const user = userEvent.setup();
    await onboard(user);
    setUp({ id: "knee", phase: 1, since: 0 }, six(0));
    render(<RehabPhaseToday />);
    const card = screen.getByTestId("rehab-phase");
    expect(card).toHaveTextContent("Your physio moves you to the next phase");
    expect(within(card).queryByRole("button", { name: /Move up/ })).toBeNull();
    await user.click(within(card).getByRole("button", { name: "Got it" }));
    expect(screen.queryByTestId("rehab-phase")).toBeNull();
  });

  it("stays quiet while the phase is still early", async () => {
    const user = userEvent.setup();
    await onboard(user);
    setUp({ id: "knee", phase: 1, self: true, since: 0 }, six(0).slice(0, 3));
    render(<RehabPhaseToday />);
    expect(screen.queryByTestId("rehab-phase")).toBeNull();
  });
});

describe("the day-after check", () => {
  it("asks how the area feels the day after rehab and saves it for that workout", async () => {
    const user = userEvent.setup();
    await onboard(user);
    // A workout yesterday afternoon.
    const y = new Date();
    y.setDate(y.getDate() - 1);
    y.setHours(16, 0, 0, 0);
    const daysAgo = (Date.now() - y.getTime()) / DAY;
    const injuryId = setUp({ id: "knee", phase: 1, since: 0 }, [{ daysAgo, pain: 2 }]);
    render(<NextDayPain />);
    const card = screen.getByTestId("next-day-pain");
    expect(card).toHaveTextContent("How does it feel today?");
    fireEvent.change(within(card).getByRole("slider"), { target: { value: "3" } });
    await user.click(within(card).getByRole("button", { name: "Save rating" }));
    const saved = useApp.getState().events.find((e) => e.type === "pain" && e.nextDay);
    expect(saved).toMatchObject({ injuryId, score: 3, nextDay: "s0" });
    expect(saved).not.toHaveProperty("sessionId");
    expect(screen.queryByTestId("next-day-pain")).toBeNull();
  });
});

describe("a new phase from the physio", () => {
  it("replaces the saved phase in place, so its history carries on", async () => {
    const user = userEvent.setup();
    await onboard(user);
    setUp({ id: "knee", phase: 1, since: 0 }, six(1));
    const now = Date.now();
    act(
      () =>
        void useApp.getState().saveShared({
          id: "new",
          name: "Knee rehab, phase 2",
          items: phaseItems(knee, 2),
          rehab: true,
          rehabPart: "knee",
          rehabPlan: { id: "knee", phase: 2 },
          createdAt: now,
          updatedAt: now,
        }),
    );
    const rehab = useApp.getState().profile.routines!.filter((r) => r.rehab);
    expect(rehab).toHaveLength(1);
    expect(rehab[0]).toMatchObject({ id: "knee", name: "Knee rehab, phase 2", rehabPlan: { id: "knee", phase: 2 } });
    expect(rehab[0]!.rehabPlan!.since).toBeGreaterThanOrEqual(now);
    // No second knee injury: the one logged is still active.
    expect(useApp.getState().events.filter((e) => e.type === "injury")).toHaveLength(1);
  });
});
