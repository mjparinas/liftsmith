// @vitest-environment jsdom
// What Pro did in the trial, shown where it counts (docs/decisions/money.md "The first two weeks"): a coach's
// note at the halfway point, in the last two days and after it lapsed, the paywall's recap, and a line at the
// end of each adaptive workout. Every one is recorded for the admin Funnel tab.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OUTBOX_KEY, setAnalytics } from "@/lib/analytics";
import { setBillingLive, type Entitlement } from "@/lib/billing";
import { derive } from "@/lib/derive";
import { useApp } from "@/lib/store";
import type { AppEvent } from "@/lib/types";
import { makeWorkout } from "@/test/factories";

import { CoachNotes } from "./Insights";
import { TrialDone, TrialRecap } from "./TrialMoments";

const DAY = 86_400_000;

function seed(daysIn: number) {
  const now = Date.now();
  const start = now - daysIn * DAY;
  const lift = (id: string, at: number, kg: number) =>
    makeWorkout(id, at, [
      { exerciseId: "back-squat", weight: kg, targetWeight: kg },
      { exerciseId: "back-squat", weight: kg, targetWeight: kg },
    ]);
  const events: AppEvent[] = [...lift("w0", start - 2 * DAY, 80), ...lift("w1", start + DAY, 82.5), ...lift("w2", now - DAY / 2, 85)];
  useApp
    .getState()
    .setProfile({ onboarded: true, unit: "kg", pro: { offeredAt: start, plan: "annual", trialStartedAt: start, trialDays: 14 } });
  useApp.setState({ events, stats: derive(events, now) });
  return { start, end: start + 14 * DAY };
}

const trialEnt = (end: number, willRenew = true): Entitlement => ({
  active: true,
  trial: true,
  plan: "annual",
  expiresAt: end,
  willRenew,
  store: "PLAY_STORE",
  manageUrl: null,
});

beforeEach(async () => {
  localStorage.clear();
  setAnalytics(true);
  await useApp.getState().reset();
});
afterEach(() => {
  cleanup();
  setBillingLive(false);
});

describe("the trial's Pro moments", () => {
  it("shows the halfway note and the paywall recap with what Pro did", () => {
    const { end } = seed(8);
    setBillingLive(true, trialEnt(end));
    render(
      <>
        <CoachNotes limit={2} />
        <TrialRecap />
      </>,
    );
    expect(screen.getByText("Halfway through your Pro trial")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "See everything in Pro" })).toBeInTheDocument();
    const recap = screen.getByRole("region", { name: "What Pro has done so far" });
    expect(recap).toHaveTextContent("Weights raised");
    expect(recap).toHaveTextContent("Biggest jump: Back squat, from 80 kg to 85 kg.");
    const seen = (JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? "[]") as { name: string; props?: Record<string, unknown> }[]).filter(
      (e) => e.name === "trial_recap",
    );
    expect(seen.map((e) => e.props?.where).sort()).toEqual(["note", "paywall"]);
    expect(seen[0]?.props).toMatchObject({ stage: "halfway", workouts: 2, raised: 2 });
  });

  it("offers to keep a cancelled trial in its last two days", () => {
    const { end } = seed(12.5);
    setBillingLive(true, trialEnt(end, false));
    render(<CoachNotes limit={2} />);
    expect(screen.getByText("Your Pro trial ends in 2 days")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep Pro" })).toBeInTheDocument();
  });

  it("says what was lost after the trial lapses, and nothing once paid", () => {
    const { end } = seed(16);
    setBillingLive(true, { ...trialEnt(end), active: false, trial: false });
    const { unmount } = render(<CoachNotes limit={2} />);
    expect(screen.getByText("Your Pro trial has ended")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Get Pro back/ })).toBeInTheDocument();
    unmount();
    setBillingLive(true, { ...trialEnt(end + 365 * DAY), trial: false });
    render(<CoachNotes limit={2} />);
    expect(screen.queryByText("Your Pro trial has ended")).toBeNull();
  });

  it("says what Pro changed at the end of a workout in the trial", () => {
    const { end } = seed(8);
    setBillingLive(true, trialEnt(end));
    render(<TrialDone sessionId="w2" />);
    expect(screen.getByRole("region", { name: "Pro this workout" })).toHaveTextContent(
      "Pro raised back squat today. 6 days left in your trial.",
    );
  });

  it("shows nothing when billing isn't live", () => {
    seed(8);
    render(
      <>
        <CoachNotes limit={2} />
        <TrialRecap />
        <TrialDone sessionId="w2" />
      </>,
    );
    expect(screen.queryByText(/Pro trial/)).toBeNull();
    expect(screen.queryByText("Pro this workout")).toBeNull();
  });
});
