// @vitest-environment jsdom
// The thank-you after buying Pro: a purchase or trial start celebrates (confetti, the celebrate buzz, the
// sheet listing what Pro unlocked); Restore purchases doesn't; Lean mode keeps the sheet but drops confetti.
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useBilling } from "@/lib/billing";
import { feel } from "@/lib/juice";

import { Plans } from "./Pro";
import { ProWelcome, useProWelcome } from "./ProWelcome";

const confetti = vi.fn();
vi.mock("canvas-confetti", () => ({ default: (...a: unknown[]) => confetti(...a) }));
const billing = vi.hoisted(() => ({ buy: vi.fn(), restore: vi.fn() }));
vi.mock("@/lib/billing", async (orig) => ({ ...(await orig<typeof import("@/lib/billing")>()), ...billing }));

beforeEach(() => {
  confetti.mockClear();
  billing.buy.mockReset();
  billing.restore.mockReset();
  feel.calm = false;
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  useProWelcome.setState({ open: false, trialDays: null });
  useBilling.setState({
    offers: [
      { plan: "annual", price: "$39.99", perMonth: "$3.33", trialDays: 14 },
      { plan: "monthly", price: "$6.99", trialDays: null },
    ],
    busy: false,
    error: null,
  });
});
afterEach(cleanup);

function paywall() {
  const onDone = vi.fn();
  render(
    <>
      <Plans from="settings" onDone={onDone} />
      <ProWelcome />
    </>,
  );
  return onDone;
}

describe("Pro welcome", () => {
  it("celebrates a trial start with confetti and the thank-you sheet", async () => {
    const user = userEvent.setup();
    billing.buy.mockResolvedValue("ok");
    const onDone = paywall();
    await user.click(screen.getByRole("button", { name: /Start 14-day free trial/ }));
    expect(onDone).toHaveBeenCalledWith("annual", true);
    expect(await screen.findByRole("dialog", { name: "Your free trial has started" })).toBeInTheDocument();
    expect(screen.getByText(/taking your health seriously/)).toBeInTheDocument();
    expect(screen.getByText("Recovery map")).toBeInTheDocument();
    expect(screen.getByText(/Free for 14 days. You can cancel/)).toBeInTheDocument();
    await vi.waitFor(() => expect(confetti).toHaveBeenCalled());
  });

  it("thanks a paid subscription without trial wording", async () => {
    const user = userEvent.setup();
    billing.buy.mockResolvedValue("ok");
    paywall();
    await user.click(screen.getByRole("button", { name: /Subscribe · Monthly/ }));
    expect(await screen.findByRole("dialog", { name: "Welcome to Pro" })).toBeInTheDocument();
    expect(screen.queryByText(/You can cancel any time in your store account/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Let's train" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("doesn't celebrate a cancelled purchase or a restore", async () => {
    const user = userEvent.setup();
    billing.buy.mockResolvedValue("cancelled");
    billing.restore.mockResolvedValue(true);
    paywall();
    await user.click(screen.getByRole("button", { name: /Subscribe · Monthly/ }));
    await user.click(screen.getByRole("button", { name: "Restore purchases" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(confetti).not.toHaveBeenCalled();
  });

  it("keeps the thanks but drops confetti in Lean mode", async () => {
    feel.calm = true;
    const { celebratePro } = await import("./ProWelcome");
    render(<ProWelcome />);
    act(() => celebratePro(null));
    expect(await screen.findByRole("dialog", { name: "Welcome to Pro" })).toBeInTheDocument();
    expect(confetti).not.toHaveBeenCalled();
  });
});
