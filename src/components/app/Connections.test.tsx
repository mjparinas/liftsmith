// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccount } from "@/lib/auth";
import { useCloud } from "@/lib/connections";
import { useApp } from "@/lib/store";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";

import { Connections } from "./Connections";

beforeEach(async () => {
  await useApp.getState().reset();
  useApp.getState().setProfile({ onboarded: true });
  localStorage.clear();
  useAccount.setState({ account: null });
  useCloud.setState({ status: null, busy: null, error: null, pulled: {} });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Connected apps on the web", () => {
  it("explains Health is in the phone apps, and asks to sign in before the fitness services", () => {
    render(<Connections />);
    expect(screen.getByRole("heading", { name: "Connected apps" })).toBeInTheDocument();
    expect(screen.getByText(/A browser can't reach them/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in or create an account" })).toBeInTheDocument();
    expect(screen.getByText("Strava")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Connect" })).toBeNull();
  });

  it("picking a music app saves it on the profile", async () => {
    const user = userEvent.setup();
    render(<Connections />);
    await user.click(screen.getByRole("button", { name: "Spotify" }));
    expect(useApp.getState().profile.connections?.music).toBe("spotify");
    await user.click(screen.getByRole("button", { name: "None" }));
    expect(useApp.getState().profile.connections?.music).toBeUndefined();
  });

  it("signed in: shows what's connected, what's coming soon, and the Strava switch", async () => {
    const account = { token: "tok", id: "a1", email: "me@example.com", providers: ["email"], via: "email" as const };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    useAccount.setState({ account });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          ready: { strava: true, oura: true, whoop: false, withings: false, polar: false, concept2: false },
          linked: { strava: { since: Date.now(), who: "Sam Lee" } },
        }),
      ),
    );
    render(<Connections />);
    expect(await screen.findByText("Connected as Sam Lee")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Post my workouts to Strava" })).toBeChecked();
    expect(screen.getAllByText("Coming soon")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect" })).toBeInTheDocument();
  });
});
