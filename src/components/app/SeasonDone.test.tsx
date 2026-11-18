// @vitest-environment jsdom
// The season card on the post-workout screen (2026-11-18): the points the workout added, a new tier with the
// rewards it reached, and the rare drop.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { derive } from "@/lib/derive";
import { seasonGain, seasonState, type SeasonDef } from "@/lib/seasons";
import { makeProfile, makeWorkout } from "@/test/factories";

import { SeasonDone } from "./Done";

afterEach(cleanup);

const S1: SeasonDef = { id: "s1", kit: "ember", start: "2026-11-23", weeks: 10 };
const MON = new Date(2026, 10, 23, 18).getTime();
const DAY = 86400_000;
const workout = (d: number) => makeWorkout(`w${d}`, MON + d * DAY, [{ exerciseId: "back-squat", weight: 100, reps: 5 }]);
const state = (events: ReturnType<typeof workout>, now: number) =>
  seasonState(S1, events, derive(events, now), makeProfile({ daysPerWeek: 3 }), now, [S1]);

describe("SeasonDone", () => {
  it("names the new tier, its reward and the points", () => {
    const now = MON + 4 * DAY + 3600_000;
    const before = state([...workout(0), ...workout(2)], now);
    const after = state([...workout(0), ...workout(2), ...workout(4)], now);
    render(<SeasonDone s={after} gain={seasonGain(before, after)!} />);
    expect(screen.getByRole("status")).toHaveTextContent("Tier 2 reached");
    expect(screen.getByText("Ember avatar")).toBeTruthy();
    expect(screen.getByText(/\+450 season points/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "See the season" })).toBeTruthy();
  });

  it("shows the points and the tier without a celebration when the tier didn't change", () => {
    const now = MON + 3600_000;
    const before = state([], now);
    const after = state(workout(0), now);
    render(<SeasonDone s={after} gain={seasonGain(before, after)!} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Tier 0")).toBeTruthy();
    expect(screen.getByText(/\+200 season points · 200 points to tier 1/)).toBeTruthy();
  });
});
