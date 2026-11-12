// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useApp } from "@/lib/store";
import { DAY, makeProfile, makeWorkout, NOW } from "@/test/factories";

import { Recap } from "./Recap";

// The year in lifting shares as a set of story cards, one highlight each (growth plan item 5, docs/decisions/growth.md).
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("recap sharing", () => {
  it("offers the summary and one card per highlight", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: NOW });
    const events = [
      ...makeWorkout("a", NOW - 20 * DAY, [{ weight: 60 }, { weight: 60 }]),
      ...makeWorkout("b", NOW - 10 * DAY, [{ weight: 70 }, { weight: 70 }]),
    ];
    useApp.setState({ events, profile: makeProfile() });
    const year = new Date(NOW).getFullYear();
    render(<Recap arg={`y${year}`} />);
    await userEvent.click(screen.getByRole("button", { name: "Share my year" }));
    const sheet = await screen.findByRole("dialog");
    for (const chip of ["Summary", "Workouts", "Lifted", "PRs", "Most-done lift"])
      expect(within(sheet).getByRole("button", { name: new RegExp(chip) })).toBeInTheDocument();
  });
});
