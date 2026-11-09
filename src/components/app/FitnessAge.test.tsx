// @vitest-environment jsdom
// Fitness age on Body › Health (AGENTS.md "Fitness age"): a range from the watch's VO2 max, what moves it,
// how it's worked out, and the general-wellness note; and what's missing when it can't be worked out.
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useApp } from "@/lib/store";
import { dayOf } from "@/lib/twin";
import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  location.hash = "";
  localStorage.clear();
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(cleanup);

async function openHealth(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
  await act(async () => { location.hash = "#/recovery"; window.dispatchEvent(new HashChangeEvent("hashchange")); });
  await user.click(await screen.findByTestId("body-health"));
  return screen.findByTestId("fitness-age");
}

describe("fitness age", () => {
  it("shows a range from the watch's VO2 max, what moves it, and how it's worked out", async () => {
    const user = userEvent.setup();
    const now = Date.now();
    await act(async () => {
      useApp.getState().setProfile({ birthYear: new Date(now).getFullYear() - 45, sex: "male" });
      useApp.getState().importWorkouts([{ type: "health", id: "vo2-1", at: now - 86_400_000, metric: "vo2max", day: dayOf(now - 86_400_000), value: 52 }]);
    });
    const card = await openHealth(user);
    expect(card).toHaveTextContent(/About \d+/);
    expect(card).toHaveTextContent("Fitter than typical for your age");
    expect(card).toHaveTextContent(/Likely \d+ to \d+, you're 45/);
    expect(card).toHaveTextContent("A typical healthy man of 45 has about 47.2.");
    expect(card).toHaveTextContent("It isn't medical advice");
    // Never a disease word or a warning label.
    expect(card.textContent).not.toMatch(/biological|disease|mortality|abnormal|at risk/i);
    await user.click(within(card).getByRole("button", { name: "How is this worked out?" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("HUNT Fitness Study");
  });

  it("says what's missing instead of guessing", async () => {
    const user = userEvent.setup();
    await act(async () => useApp.getState().setProfile({ birthYear: undefined, sex: undefined }));
    const card = await openHealth(user);
    expect(card).toHaveTextContent("—");
    // The web build has no health store, so the reading comes from the phone.
    expect(card).toHaveTextContent("Open Liftsmith on your phone to see it.");
  });
});
