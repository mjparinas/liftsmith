// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { setLanguage } from "@/lib/i18n";

// Signed out: nothing is pushed, so the session stays on the device (the tablet with no reception).
vi.mock("@/lib/auth", async (orig) => ({ ...(await orig<typeof import("@/lib/auth")>()), readAccount: () => null }));

const { startTeamSession, useTeamSession } = await import("@/lib/teamSession");
const { default: TeamSession } = await import("./TeamSession");

// A school coach's team session on one tablet (docs/decisions/school-teams.md "Team sessions").
beforeEach(() => {
  setLanguage("en");
  localStorage.clear();
  useTeamSession.setState({ session: null, waiting: null });
  startTeamSession(
    { id: "T1", name: "Senior girls" },
    "Leg day",
    [
      { exerciseId: "back-squat", sets: 2, reps: 5 },
      { exerciseId: "push-up", sets: 1, reps: 12 },
    ],
    [
      { id: "bo", name: "Bo" },
      { id: "ana", name: "Ana" },
    ],
    { ana: { "back-squat": { weight: 40, reps: 5 } } },
  );
});
afterEach(cleanup);

describe("a team session on the tablet", () => {
  it("each athlete taps their name and logs a set from where they left off, with Undo", () => {
    render(<TeamSession />);
    expect(screen.getByText("Tap your name to log a set.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Ana/ }));
    const sheet = screen.getByRole("dialog", { name: "Ana" });
    expect(within(sheet).getByText("Set 1 of 2 · aim for 5 reps")).toBeTruthy();
    // The weight starts where she left off last session, and says so.
    expect((within(sheet).getByLabelText("Weight (kg)") as HTMLInputElement).value).toBe("40");
    expect(within(sheet).getByText(/Where they left off last session/)).toBeTruthy();
    fireEvent.click(within(sheet).getByRole("button", { name: "Log set" }));
    expect(screen.queryByRole("dialog", { name: "Ana" })).toBeNull();
    expect(screen.getByText("Logged for Ana")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Ana/ }).textContent).toContain("1 of 3 sets");
    expect(useTeamSession.getState().session?.sets).toMatchObject([{ athlete: "ana", exercise: "back-squat", weight: 40, reps: 5 }]);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(useTeamSession.getState().session?.sets).toEqual([]);
  });

  it("the board says who hasn't started, never a weight", () => {
    render(<TeamSession />);
    fireEvent.click(screen.getByRole("button", { name: /Ana/ }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Ana" })).getByRole("button", { name: "Log set" }));
    fireEvent.click(screen.getByRole("button", { name: "Board" }));
    expect(screen.getByText("1 athlete hasn't logged a set yet. Get them in next.")).toBeTruthy();
    expect(screen.getByText("Ana: 1 of 3 sets")).toBeTruthy();
    expect(document.body.textContent).not.toContain("40");
  });

  it("ending keeps the session on the tablet until the server has it, then says it's saved", () => {
    render(<TeamSession />);
    fireEvent.click(screen.getByRole("button", { name: /^Bo0 of/ }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Bo" })).getByRole("button", { name: "Log set" }));
    fireEvent.click(screen.getByRole("button", { name: "End session" }));
    fireEvent.click(
      within(screen.getByRole("dialog", { name: "End the session for everyone?" })).getByRole("button", { name: "End and save" }),
    );
    expect(screen.getByText("Saving each athlete's workout")).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("liftsmith.teamSession") ?? "{}").endedAt).toBeGreaterThan(0);
    act(() => useTeamSession.setState({ session: { ...useTeamSession.getState().session!, done: true } }));
    expect(screen.getByText("1 athlete will see this workout in their history.")).toBeTruthy();
  });
});
