// @vitest-environment jsdom
// Pro on the web (Stripe): the paywall shows the server's prices in the app's language, asks a signed-out lifter to
// sign in before paying, sends a signed-in one to Stripe Checkout with the plan, and never sells a second plan to an
// account that already has Pro.
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { useAccount, type Account } from "@/lib/auth";
import { hasPro, loadWebOffers, money, startBilling, useBilling, webBilling, webEnt, webOffers } from "@/lib/billing";

import { Plans } from "./Pro";

const PRICES = [
  { plan: "annual", amount: 3999, currency: "USD" },
  { plan: "monthly", amount: 699, currency: "USD" },
];
const calls: { url: string; body: unknown; auth: string | null }[] = [];
let checkout: { status: number; body: unknown } = { status: 200, body: { url: "https://checkout.stripe.com/c/pay/cs_test_1" } };
const assign = vi.fn();

const account = (over: Partial<Account> = {}): Account => ({
  token: "t",
  id: "acct-1",
  email: "lifter@example.com",
  providers: ["email"],
  via: "email",
  ...over,
});

beforeAll(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const auth = new Headers(init.headers).get("authorization");
      calls.push({ url, body: init.body ? JSON.parse(String(init.body)) : undefined, auth });
      if (url.startsWith("/api/billing/stripe/?")) return new Response(JSON.stringify({ live: true, prices: PRICES, trialDays: 14 }));
      if (url === "/api/billing/stripe/") return new Response(JSON.stringify(checkout.body), { status: checkout.status });
      if (url === "/api/account/") return new Response(JSON.stringify({ account: { pro: true, proVia: "play" } }));
      return new Response("{}", { status: 404 });
    }),
  );
  Object.defineProperty(window, "location", { value: { ...window.location, assign }, writable: true });
});
afterAll(() => vi.unstubAllGlobals());
afterEach(() => {
  cleanup();
  calls.length = 0;
  assign.mockClear();
});

describe("Prices on the web", () => {
  it("formats Stripe's amounts as prices, with a monthly figure for the annual plan", () => {
    expect(money(3999, "USD", "en-CA")).toBe("US$39.99");
    expect(money(1200, "JPY", "ja-JP")).toMatch(/1,200/);
    expect(webOffers(PRICES as never, 14, "en-US")).toEqual([
      { plan: "annual", price: "$39.99", perMonth: "$3.33", trialDays: 14 },
      { plan: "monthly", price: "$6.99", perMonth: undefined, trialDays: 14 },
    ]);
  });

  it("only a web subscription becomes the paywall's status card", () => {
    expect(webEnt({ store: "web", plan: "monthly", trial: false, expiresAt: 5, willRenew: true, status: "active" })).toMatchObject({
      active: true,
      plan: "monthly",
    });
    expect(webEnt({ store: "play", plan: "monthly", trial: false, expiresAt: 5, willRenew: true, status: "active" })).toBeNull();
    expect(webEnt(null)).toBeNull();
  });
});

describe("The web paywall", () => {
  it("turns billing on when the server sells Pro, so a free lifter on the web is free", async () => {
    useAccount.setState({ account: null });
    await startBilling();
    await loadWebOffers();
    expect(webBilling()).toBe(true);
    expect(hasPro()).toBe(false);
    useAccount.setState({ account: account({ pro: true, proVia: "web" }) });
    expect(hasPro()).toBe(true);
  });

  it("asks a signed-out lifter to sign in, and doesn't open checkout", async () => {
    const user = userEvent.setup();
    useAccount.setState({ account: null });
    await loadWebOffers();
    render(<Plans from="settings" />);
    expect(screen.getByRole("button", { name: "Sign in or create an account" })).toBeInTheDocument();
    expect(screen.getByText(/Paid by card through Stripe/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Start 14-day free trial.*yearly/i }));
    expect(await screen.findByText("Sign in first, so Pro is saved to your account.")).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });

  it("sends a signed-in lifter to Stripe Checkout with the plan they picked", async () => {
    const user = userEvent.setup();
    localStorage.setItem("liftsmith.account", JSON.stringify(account()));
    useAccount.setState({ account: account() });
    await loadWebOffers();
    render(<Plans from="settings" />);
    await user.click(screen.getByRole("button", { name: /monthly/i }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_test_1"));
    const post = calls.find((c) => c.url === "/api/billing/stripe/");
    expect(post).toMatchObject({ auth: "Bearer t", body: { plan: "monthly" } });
  });

  it("an account that already has Pro elsewhere isn't sold a second plan", async () => {
    const user = userEvent.setup();
    checkout = { status: 409, body: { error: "already", via: "play" } };
    localStorage.setItem("liftsmith.account", JSON.stringify(account()));
    useAccount.setState({ account: account() });
    await loadWebOffers();
    render(<Plans from="settings" />);
    await user.click(screen.getByRole("button", { name: /monthly/i }));
    expect(await screen.findByText("This account already has Pro, so there's nothing more to pay for.")).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
    expect(useAccount.getState().account).toMatchObject({ pro: true, proVia: "play" });
    expect(useBilling.getState().live).toBe(true);
  });
});
