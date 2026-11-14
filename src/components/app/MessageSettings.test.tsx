// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccount, type Account } from "@/lib/auth";
import { SUB_KEY } from "@/lib/reminders";
import { useApp } from "@/lib/store";

import { MessageSettings } from "./MessageSettings";

beforeEach(async () => {
  await useApp.getState().reset();
  useApp.getState().setProfile({ onboarded: true });
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  useAccount.setState({ account: null });
  vi.unstubAllGlobals();
});

const me: Account = { token: "t", id: "a1", email: "lifter@example.com", providers: ["google"], via: "google" };

describe("Settings › Reminders on the web", () => {
  it("points to the apps for phone notifications", () => {
    render(<MessageSettings />);
    expect(screen.getByText(/Phone notifications are in the Android and iPhone apps/)).toBeInTheDocument();
  });

  it("turns email on with one switch, to the signed-in account's address, and sends no workout data", async () => {
    const calls: { method: string; auth: string | null; body: Record<string, unknown> }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const h = init.headers as Record<string, string>;
        calls.push({ method: String(init.method), auth: h.Authorization ?? null, body: JSON.parse(String(init.body)) });
        return new Response(JSON.stringify({ status: "confirmed" }), { status: 200 });
      }),
    );
    useAccount.setState({ account: me });
    const user = userEvent.setup();
    render(<MessageSettings />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText(/go to lifter@example.com, the address you signed in with/)).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Email me" }));
    await screen.findByText(/Sending to lifter@example.com/);

    expect(calls).toHaveLength(1);
    expect(calls[0].auth).toBe("Bearer t");
    const b = calls[0].body;
    expect(Object.keys(b).sort()).toEqual(
      [
        "consentAt",
        "daysPerWeek",
        "days",
        "email",
        "firstWorkoutAt",
        "id",
        "kinds",
        "lang",
        "lastWorkoutAt",
        "pro",
        "resubscribe",
        "startedAt",
        "streakWeeks",
        "teen",
        "time",
        "token",
        "tz",
        "weekDays",
        "weekStart",
      ].sort(),
    );
    expect(b.email).toBe("lifter@example.com");
    expect(JSON.parse(localStorage.getItem(SUB_KEY)!)).toMatchObject({ id: b.id, token: b.token });
    expect(useApp.getState().profile.messages?.email).toMatchObject({ address: "lifter@example.com", status: "confirmed" });
    expect(screen.getByRole("switch", { name: "Email me" })).toHaveAttribute("aria-checked", "true");

    // Each kind has its own switch; offers start off.
    const offers = screen.getByRole("switch", { name: "Pro trial and offers" });
    expect(offers).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: "Workout reminders" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("switch", { name: "Missed workouts" }));
    expect(useApp.getState().profile.messages?.email?.kinds.missed).toBe(false);
  });

  it("opens sign-in instead of asking for an address when signed out", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    location.hash = "#/settings/reminders";
    const user = userEvent.setup();
    render(<MessageSettings />);
    expect(screen.getByText(/Sign in to get reminders by email/)).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Email me" }));
    expect(location.hash).toBe("#/account");
    expect(fetch).not.toHaveBeenCalled();
    expect(useApp.getState().profile.messages?.email).toBeUndefined();
  });

  it("switching email off deletes the address from the server", async () => {
    const methods: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_u: string, init: RequestInit) => {
        methods.push(String(init.method));
        return new Response(JSON.stringify({ status: "confirmed" }), { status: 200 });
      }),
    );
    localStorage.setItem(SUB_KEY, JSON.stringify({ id: "a".repeat(32), token: "b".repeat(64) }));
    useApp
      .getState()
      .setProfile({ messages: { push: {}, email: { address: "me@example.com", consentAt: 1, status: "confirmed", kinds: {} } } });
    const user = userEvent.setup();
    render(<MessageSettings />);
    await user.click(screen.getByRole("switch", { name: "Email me" }));
    await screen.findByText(/your address is deleted/);
    expect(methods).toEqual(["DELETE"]);
    expect(useApp.getState().profile.messages?.email).toBeUndefined();
    expect(localStorage.getItem(SUB_KEY)).toBeNull();
    expect(screen.getByRole("switch", { name: "Email me" })).toHaveAttribute("aria-checked", "false");
  });

  it("says so when the server can't be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    useAccount.setState({ account: me });
    const user = userEvent.setup();
    render(<MessageSettings />);
    await user.click(screen.getByRole("switch", { name: "Email me" }));
    await screen.findByText(/Couldn't reach the server/);
  });

  it("shows the account's address once the lifter signs in with the screen open", () => {
    render(<MessageSettings />);
    expect(screen.getByText(/Sign in to get reminders by email/)).toBeInTheDocument();
    act(() => useAccount.setState({ account: { ...me, email: "Late@Example.com" } }));
    expect(screen.getByText(/go to late@example.com/)).toBeInTheDocument();
  });
});
