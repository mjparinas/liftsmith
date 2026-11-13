// @vitest-environment jsdom
// Signing in from the welcome screen ("I already have an account") restores the account and lands on Today.
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { forgetAccount } from "@/lib/auth";
import { defaultProfile, makeGym } from "@/lib/defaults";
import { useApp } from "@/lib/store";

import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

type GisCallback = (r: { credential?: string }) => void;
let gis: GisCallback | null = null;
let buttonOptions: Record<string, unknown> | null = null;

function stubServer(records: unknown[]) {
  vi.stubGlobal("fetch", async (url: string) => {
    if (url === "/api/auth/google/")
      return Response.json({ token: "tok", account: { id: "acc", email: "me@example.com", providers: ["google"] } });
    if (url === "/api/sync/") return Response.json({ cursor: 1, events: [], deleted: [], records, more: false });
    return Response.json({ error: "Not here" }, { status: 404 });
  });
}

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
  forgetAccount();
  gis = null;
  // Google Identity Services: the script "loads" at once and the button hands back a credential when told to.
  document.head.appendChild(Object.assign(document.createElement("script"), { src: "https://accounts.google.com/gsi/client" }));
  window.google = {
    accounts: {
      id: {
        initialize: (o: Record<string, unknown>) => (gis = o.callback as GisCallback),
        renderButton: (el: HTMLElement, o: Record<string, unknown>) => {
          buttonOptions = o;
          el.innerHTML = "<button type='button'>Continue with Google</button>";
        },
      },
    },
  };
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.querySelectorAll("script[src*='accounts.google.com']").forEach((s) => s.remove());
});

describe("signing in from the welcome screen", () => {
  it("closes the sheet, brings the account's profile back and opens Today", async () => {
    const gym = { ...makeGym("commercial", "kg", "g-acc"), updatedAt: 5 };
    stubServer([
      { key: "profile", value: { ...defaultProfile(5), name: "Sam", activeGymId: "g-acc", onboarded: true }, updatedAt: 5 },
      { key: "gym:g-acc", value: gym, updatedAt: 5 },
    ]);
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "I already have an account" }));
    await waitFor(() => expect(gis).not.toBeNull());
    // Google's button is told the app's language, so it never guesses another from the browser or the address.
    await waitFor(() => expect(buttonOptions?.locale).toMatch(/^en/));
    gis!({ credential: "id-token" });
    expect(await screen.findByText("Today's workout")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Sign in" })).toBeNull();
    expect(useApp.getState().profile.onboarded).toBe(true);
  });

  it("opens Today, not the Account screen, after signing in from the website's Sign in link", async () => {
    const gym = { ...makeGym("commercial", "kg", "g-acc"), updatedAt: 5 };
    stubServer([
      { key: "profile", value: { ...defaultProfile(5), name: "Sam", activeGymId: "g-acc", onboarded: true }, updatedAt: 5 },
      { key: "gym:g-acc", value: gym, updatedAt: 5 },
    ]);
    location.hash = "#/account";
    render(<App />);
    expect(await screen.findByRole("dialog", { name: "Sign in" })).toBeInTheDocument();
    await waitFor(() => expect(gis).not.toBeNull());
    gis!({ credential: "id-token" });
    expect(await screen.findByText("Today's workout")).toBeInTheDocument();
    expect(location.hash).not.toContain("account");
  });

  it("carries on into setup, signed in, when the account has nothing on it yet", async () => {
    stubServer([]);
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "I already have an account" }));
    await waitFor(() => expect(gis).not.toBeNull());
    gis!({ credential: "id-token" });
    expect(await screen.findByText("What are you training for?")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("no training saved on this account yet");
    expect(screen.queryByRole("dialog", { name: "Sign in" })).toBeNull();
  });

  it("opens straight on sign-in from the website's Sign in link", async () => {
    stubServer([]);
    location.hash = "#/account";
    render(<App />);
    const user = userEvent.setup();
    expect(await screen.findByRole("dialog", { name: "Sign in" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    // Setting up without signing in still ends on Today, not on the Account screen.
    await user.click(screen.getByRole("button", { name: "Get started" }));
    await screen.findByText("What are you training for?");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Today's workout")).toBeInTheDocument();
    expect(location.hash).not.toContain("account");
  });
});
