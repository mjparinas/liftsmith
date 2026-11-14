// @vitest-environment jsdom
// Log a past workout, in the app (moved from the retired /me/ dashboard; docs/decisions/desktop-layout.md):
// it saves through the store, so the workout counts at once, and /me/ links land on the right app screen.
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { appHashFor } from "@/components/MeRedirect";
import { useApp } from "@/lib/store";

import { LogPast } from "./LogPast";

beforeEach(async () => {
  await useApp.getState().reset();
});
afterEach(cleanup);

describe("log a past workout", () => {
  it("adds an exercise from the browser, bumps a set and saves it as a finished workout", async () => {
    const user = userEvent.setup();
    render(<LogPast />);
    expect(screen.getByRole("heading", { name: "Log a past workout" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save workout" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Add exercise" }));
    const sheet = screen.getByRole("dialog");
    await user.type(within(sheet).getByRole("searchbox"), "barbell bench press");
    await user.click(
      within(sheet)
        .getAllByRole("button")
        .find((b) => /^Barbell bench press/.test(b.textContent ?? ""))!,
    );
    expect(screen.getByRole("heading", { name: "Barbell bench press" })).toBeInTheDocument();
    // An empty weight box bumps from an empty bar; reps from 8.
    await user.click(screen.getByRole("button", { name: /More.*Barbell bench press set 1 weight/ }));
    await user.click(screen.getByRole("button", { name: /More.*Barbell bench press set 1 reps/ }));
    expect(screen.getByRole("textbox", { name: "Barbell bench press set 1 weight" })).toHaveValue("20");
    expect(screen.getByRole("textbox", { name: "Barbell bench press set 1 reps" })).toHaveValue("8");
    await user.click(screen.getByRole("button", { name: "Save workout" }));
    const { stats, events } = useApp.getState();
    expect(stats.sessions).toHaveLength(1);
    const start = events.find((e) => e.type === "sessionStart");
    expect(start && "source" in start && start.source).toBe("manual");
    expect(events.filter((e) => e.type === "set")).toHaveLength(1);
  });

  it("picks the day with a chip and the start time with a stepper, no typing", async () => {
    const user = userEvent.setup();
    render(<LogPast />);
    await user.click(screen.getByRole("button", { name: "Yesterday" }));
    const shown = screen.getByRole("status").textContent;
    await user.click(screen.getByRole("button", { name: "Earlier start" }));
    expect(screen.getByRole("status").textContent).not.toBe(shown);
    await user.click(screen.getByRole("button", { name: "Add exercise" }));
    await user.type(within(screen.getByRole("dialog")).getByRole("searchbox"), "barbell bench press");
    await user.click(
      within(screen.getByRole("dialog"))
        .getAllByRole("button")
        .find((b) => /^Barbell bench press/.test(b.textContent ?? ""))!,
    );
    await user.click(screen.getByRole("button", { name: /More.*Barbell bench press set 1 reps/ }));
    await user.click(screen.getByRole("button", { name: "Save workout" }));
    const start = useApp.getState().stats.sessions[0]!.start;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(new Date(start).toDateString()).toBe(yesterday.toDateString());
  });

  it("says what's wrong instead of saving a set without reps", async () => {
    const user = userEvent.setup();
    render(<LogPast />);
    await user.click(screen.getByRole("button", { name: "Add exercise" }));
    await user.type(within(screen.getByRole("dialog")).getByRole("searchbox"), "barbell bench press");
    await user.click(
      within(screen.getByRole("dialog"))
        .getAllByRole("button")
        .find((b) => /^Barbell bench press/.test(b.textContent ?? ""))!,
    );
    await user.click(screen.getByRole("button", { name: "Save workout" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Reps must be a whole number");
    expect(useApp.getState().stats.sessions).toHaveLength(0);
  });
});

describe("the retired /me/ dashboard", () => {
  it("sends old links to the closest app screen", () => {
    expect(appHashFor("#/log")).toBe("#/log");
    expect(appHashFor("#/trophies")).toBe("#/awards");
    expect(appHashFor("#/friends")).toBe("#/friends");
    expect(appHashFor("#/history/s-1")).toBe("#/progress");
    expect(appHashFor("")).toBe("#/progress");
  });
});
