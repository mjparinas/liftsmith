// @vitest-environment jsdom
// Coach plans (docs/decisions/money.md "Coach plans"): the plan card says how many clients the coach's plan allows and
// what to do, and a full client list makes "See coach plans" the screen's way up. Nothing shows until plans are on.
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { useBilling } from "@/lib/billing";
import { setCoachOffers } from "@/lib/coachBilling";
import { DEFAULT_LIMITS } from "@/lib/coachPlans";
import { t } from "@/lib/i18n";
import type { CoachPlanInfo } from "@/lib/trainer";

import { CoachPlanCard, effectivePlan } from "./CoachPlan";

const plan = (p: Partial<CoachPlanInfo> = {}): CoachPlanInfo => ({
  live: true,
  tier: "pro",
  via: null,
  limit: 3,
  clients: 1,
  limits: DEFAULT_LIMITS,
  graceUntil: null,
  ...p,
});

afterEach(() => {
  cleanup();
  setCoachOffers(null);
  useBilling.setState({ coachTier: undefined });
});

describe("the coach plan card", () => {
  it("shows nothing while coach plans are off", () => {
    const { container } = render(<CoachPlanCard plan={plan({ live: false, limit: 30 })} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("says how much room is left", () => {
    render(<CoachPlanCard plan={plan()} onChange={() => {}} />);
    expect(screen.getByText(t("cpl.count", { count: 1, limit: 3 }))).toBeTruthy();
    expect(screen.getByText(t("cpl.left", { left: 2 }))).toBeTruthy();
  });

  it("at the limit, says what to do and opens the plans with their prices", async () => {
    const user = userEvent.setup();
    setCoachOffers([
      { tier: "coach", plan: "annual", price: "$199.99", perMonth: "$16.67" },
      { tier: "coach", plan: "monthly", price: "$19.99" },
      { tier: "coachPlus", plan: "annual", price: "$399.99", perMonth: "$33.33" },
      { tier: "coachPlus", plan: "monthly", price: "$39.99" },
    ]);
    render(<CoachPlanCard plan={plan({ clients: 3 })} onChange={() => {}} />);
    expect(screen.getByText(t("cpl.full"))).toBeTruthy();
    await user.click(screen.getByRole("button", { name: t("cpl.see") }));
    expect(screen.getByRole("dialog", { name: t("cpl.sheetTitle") })).toBeTruthy();
    // Each plan is its own button, annual first, with the store's price.
    const buttons = screen.getAllByRole("button").filter((b) => /\$\d/.test(b.textContent ?? ""));
    expect(buttons.map((b) => b.textContent)).toEqual([
      expect.stringContaining("$199.99"),
      expect.stringContaining("$19.99"),
      expect.stringContaining("$399.99"),
      expect.stringContaining("$39.99"),
    ]);
  });

  it("during the grace, says until when the old limit holds", () => {
    const until = Date.UTC(2027, 1, 11);
    render(<CoachPlanCard plan={plan({ clients: 8, limit: 30, graceUntil: until })} onChange={() => {}} />);
    expect(screen.getByText(/30/, { selector: "p.text-muted" })).toBeTruthy();
  });

  it("over the limit after the grace, keeps everyone and offers the way up", () => {
    render(<CoachPlanCard plan={plan({ clients: 8 })} onChange={() => {}} />);
    expect(screen.getByText(t("cpl.over"))).toBeTruthy();
    expect(screen.getByRole("button", { name: t("cpl.see") })).toBeTruthy();
  });

  it("a store purchase the server hasn't heard about yet already raises the limit here", () => {
    expect(effectivePlan(plan(), "coach")).toEqual({ tier: "coach", limit: 25 });
    useBilling.setState({ coachTier: "coach" });
    render(<CoachPlanCard plan={plan({ clients: 3 })} onChange={() => {}} />);
    expect(screen.getByText(t("cpl.count", { count: 3, limit: 25 }))).toBeTruthy();
  });

  it("a free school coach sees their team limit and nothing to buy", () => {
    render(<CoachPlanCard plan={plan({ via: "school", limit: 300, clients: 40 })} onChange={() => {}} />);
    expect(screen.getByText(t("cpl.school", { limit: 300 }))).toBeTruthy();
    expect(screen.queryByRole("button", { name: t("cpl.see") })).toBeNull();
  });
});
