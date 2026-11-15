// @vitest-environment jsdom
// Rehab that gets done (2026-11-15, docs/decisions/trainer-mode.md): a program from a physio waits on Today to be saved,
// and the physio's rehab is offered on a day without lifting, following their times a week.
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { activeInjuries } from "@/lib/injury";
import { encodeRoutine } from "@/lib/routineShare";
import { useApp } from "@/lib/store";
import { useCoachNotes } from "@/lib/trainer";

import { App } from "./App";
import { PlanToday, RehabToday } from "./RehabToday";

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
  useCoachNotes.setState({ plans: [], plansSeen: [] });
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

const KNEE = encodeRoutine({
  name: "Knee rehab",
  items: [
    { exerciseId: "wall-sit", sets: 3 },
    { exerciseId: "glute-bridge", sets: 3 },
  ],
  rehab: true,
  rehabPart: "knee",
  perWeek: 3,
});
const plan = (id: string, code = KNEE) => ({
  id,
  coachId: "c1",
  clientId: "me",
  name: "Knee rehab",
  code,
  at: 1,
  coach: "Sam",
  role: "physio" as const,
});

describe("a program from the physio on Today", () => {
  it("saves in one tap, logs the knee and then goes away", async () => {
    const user = userEvent.setup();
    await onboard(user);
    act(() => useCoachNotes.setState({ plans: [plan("p1")] }));
    const card = await screen.findByTestId("plan-today");
    expect(card).toHaveTextContent("Sam sent you Knee rehab");
    expect(card).toHaveTextContent("Saving it adds knee to your injuries");
    expect(card).toHaveTextContent("Sam asked for 3 times a week.");
    await user.click(within(card).getByRole("button", { name: "Save it" }));
    expect(useApp.getState().profile.routines![0]).toMatchObject({ name: "Knee rehab", rehab: true, rehabPart: "knee", perWeek: 3 });
    expect(activeInjuries(useApp.getState().events).map((i) => i.part)).toEqual(["knee"]);
    expect(screen.queryByTestId("plan-today")).toBeNull();
  });

  it("Not now puts it off on this device", async () => {
    const user = userEvent.setup();
    await onboard(user);
    act(() => useCoachNotes.setState({ plans: [plan("p1")] }));
    await user.click(within(await screen.findByTestId("plan-today")).getByRole("button", { name: "Not now" }));
    expect(screen.queryByTestId("plan-today")).toBeNull();
    expect(useCoachNotes.getState().plansSeen).toEqual(["p1"]);
    expect(useApp.getState().profile.routines ?? []).toEqual([]);
  });
});

describe("the physio's rehab on a day without lifting", () => {
  it("is offered while it's due, says how the week is going, and picks it for today", async () => {
    const user = userEvent.setup();
    await onboard(user);
    cleanup();
    const at = Date.now();
    act(() => {
      useApp.getState().saveRoutine({
        id: "knee",
        name: "Knee rehab",
        items: [{ exerciseId: "wall-sit", sets: 3 }],
        rehab: true,
        rehabPart: "knee",
        perWeek: 3,
        createdAt: at,
        updatedAt: at,
      });
    });
    // No knee injury: nothing to do.
    const { unmount } = render(<RehabToday />);
    expect(screen.queryByTestId("rehab-today")).toBeNull();
    unmount();
    act(() => void useApp.getState().logInjury("knee"));
    render(<RehabToday />);
    const card = screen.getByTestId("rehab-today");
    expect(card).toHaveTextContent("Knee rehab from your physio");
    expect(card).toHaveTextContent("0 of 3 done in the last 7 days, as your physio asked.");
    await user.click(within(card).getByRole("button", { name: "Do it today" }));
    expect(useApp.getState().routineId).toBe("knee");
    expect(useApp.getState().preview?.rehab).toBe(true);
  });

  it("isn't offered for another area's injury", async () => {
    const user = userEvent.setup();
    await onboard(user);
    cleanup();
    const at = Date.now();
    act(() => {
      useApp.getState().saveRoutine({
        id: "knee",
        name: "Knee rehab",
        items: [{ exerciseId: "wall-sit", sets: 3 }],
        rehab: true,
        rehabPart: "knee",
        createdAt: at,
        updatedAt: at,
      });
      void useApp.getState().logInjury("shoulder");
    });
    render(
      <>
        <RehabToday />
        <PlanToday />
      </>,
    );
    expect(screen.queryByTestId("rehab-today")).toBeNull();
  });
});
