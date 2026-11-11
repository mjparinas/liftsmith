// @vitest-environment jsdom
// Today's max from warm-ups: the card in the rest after the last warm-up says what the speeds point to and
// sets the working weight in one tap; nothing shows without enough warm-ups, and an undone warm-up drops its speed.
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { exercise } from "@/lib/exercises";
import { useApp } from "@/lib/store";
import { DAY, makeSet, makeTestGym } from "@/test/factories";

import { clearWarmupSpeeds, recordWarmupSpeed, SpeedNudge, trimWarmupSpeeds, warmupSpeeds } from "./SpeedNudge";

const squat = exercise("back-squat");
const gym = makeTestGym();
const planned = { weight: 100, reps: 5, rir: 2 }; // a planned max of about 123 kg

/** Warm-ups on a line that reaches the squat's 0.3 m/s threshold at `max` kg. */
function warmUp(max: number) {
  [20, 60, 80].forEach((kg, i) => recordWarmupSpeed("s1", squat.id, i, { kg, speed: 0.3 + 0.006 * (max - kg) }));
}

beforeEach(() => {
  clearWarmupSpeeds();
  useApp.setState({ events: [] });
});
afterEach(cleanup);

describe("today's max from warm-ups", () => {
  it("suggests a heavier working weight after fast warm-ups and sets it in one tap", async () => {
    warmUp(135);
    const onUse = vi.fn();
    render(<SpeedNudge sessionId="s1" ex={squat} gym={gym} planned={planned} weight={100} reps={5} onUse={onUse} />);
    expect(screen.getByTestId("speed-nudge").textContent).toMatch(/about 135 kg, 9% above/);
    await userEvent.click(screen.getByRole("button", { name: "Use 105 kg" }));
    expect(onUse).toHaveBeenCalledWith(105, 5);
  });

  it("shows the weight as set once it's dialled in", () => {
    warmUp(135);
    render(<SpeedNudge sessionId="s1" ex={squat} gym={gym} planned={planned} weight={105} reps={5} onUse={() => {}} />);
    expect(screen.getByRole("status").textContent).toBe("Working weight set to 105 kg.");
    expect(screen.queryByRole("button", { name: /Use/ })).toBeNull();
  });

  it("says the plan stands when the warm-ups moved as expected", () => {
    warmUp(125);
    render(<SpeedNudge sessionId="s1" ex={squat} gym={gym} planned={planned} weight={100} reps={5} onUse={() => {}} />);
    expect(screen.getByTestId("speed-nudge").textContent).toMatch(/as expected.*Stay with 100 kg/);
  });

  it("says it uses the usual end-of-set speed until three sets to failure teach it the lifter's own", () => {
    warmUp(125);
    render(<SpeedNudge sessionId="s1" ex={squat} gym={gym} planned={planned} weight={100} reps={5} onUse={() => {}} />);
    expect(screen.getByTestId("speed-threshold").textContent).toBe(
      "Measured against the usual end-of-set speed for this lift, 0.30 m/s. Take 3 more sets to failure while the camera counts and it learns your own.",
    );
  });

  it("uses the lifter's own end-of-set speed once they have enough hard sets, and says so", () => {
    // Same warm-ups as "as expected" against the textbook 0.30 m/s, but this lifter's sets end at 0.45 m/s.
    useApp.setState({
      events: [1, 2, 3, 4].map((d) => makeSet({ exerciseId: squat.id, endSpeed: 0.45, failedRep: true, at: Date.now() - d * DAY })),
    });
    warmUp(125);
    render(<SpeedNudge sessionId="s1" ex={squat} gym={gym} planned={planned} weight={100} reps={5} onUse={() => {}} />);
    expect(screen.getByTestId("speed-threshold").textContent).toBe(
      "Measured against your own end-of-set speed for this lift, 0.40 m/s, learned from 4 sets you took to failure.",
    );
    expect(screen.getByTestId("speed-nudge").textContent).toMatch(/below what the plan expects/);
  });

  it("shows nothing with one warm-up speed, and an undone warm-up drops its speed", () => {
    warmUp(135);
    trimWarmupSpeeds("s1", squat.id, 1);
    expect(warmupSpeeds("s1", squat.id)).toHaveLength(1);
    render(<SpeedNudge sessionId="s1" ex={squat} gym={gym} planned={planned} weight={100} reps={5} onUse={() => {}} />);
    expect(screen.queryByTestId("speed-nudge")).toBeNull();
  });
});
