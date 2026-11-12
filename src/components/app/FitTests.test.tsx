// @vitest-environment jsdom
// Fitness tests on Body › Health (docs/decisions/fitness-tests.md): enter a dead hang, see where it sits against
// the one published reference and what helps, then the history; never a lifespan or disease claim.
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useApp } from "@/lib/store";

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
  localStorage.clear();
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(cleanup);

async function openHealth(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
  await act(async () => {
    location.hash = "#/recovery";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  await user.click(await screen.findByTestId("body-health"));
  return screen.findByTestId("fit-tests");
}

describe("fitness tests", () => {
  it("logs a dead hang and says where it sits, what helps and what to aim for", async () => {
    const user = userEvent.setup();
    await act(async () => useApp.getState().setProfile({ birthYear: new Date().getFullYear() - 35, sex: "male" }));
    const card = await openHealth(user);
    expect(card).toHaveTextContent("Dead hang");
    expect(card).toHaveTextContent("Take the test");
    await user.click(within(card).getByTestId("ft-hang"));
    const sheet = screen.getByRole("dialog");
    expect(sheet).toHaveTextContent("an average of 78 s for men");
    await user.type(within(sheet).getByRole("textbox", { name: "Seconds hanging" }), "100");
    await user.click(within(sheet).getByRole("button", { name: "Save result" }));
    const result = await within(sheet).findByTestId("ft-result");
    expect(result).toHaveTextContent("100 s");
    expect(result).toHaveTextContent("Above typical");
    expect(result).toHaveTextContent("farmer's carries");
    expect(result).toHaveTextContent("Next time, aim for 110 s.");
    expect(useApp.getState().events.some((e) => e.type === "fitTest" && e.test === "hang" && e.value === 100)).toBe(true);
    // Never a lifespan, disease or warning word.
    expect(sheet.textContent).not.toMatch(/longevity|live longer|lifespan|mortality|death|disease|abnormal|at risk/i);
    expect(sheet).toHaveTextContent("It isn't medical advice");
  });

  it("refuses an out-of-range result and asks for age when there's no reference", async () => {
    const user = userEvent.setup();
    await act(async () => useApp.getState().setProfile({ birthYear: undefined, sex: undefined }));
    const card = await openHealth(user);
    await user.click(within(card).getByTestId("ft-balance"));
    const sheet = screen.getByRole("dialog");
    expect(sheet).toHaveTextContent("Add your age and sex");
    await user.type(within(sheet).getByRole("textbox", { name: "Seconds on one leg" }), "60");
    await user.click(within(sheet).getByRole("button", { name: "Save result" }));
    expect(within(sheet).getByRole("alert")).toHaveTextContent("Enter 0 to 45.");
    expect(useApp.getState().events.some((e) => e.type === "fitTest")).toBe(false);
  });
});
