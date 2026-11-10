// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  vi.unstubAllGlobals();
});

describe("Settings › Reminders on the web", () => {
  it("points to the apps for phone notifications", () => {
    render(<MessageSettings />);
    expect(screen.getByText(/Phone notifications are in the Android and iPhone apps/)).toBeInTheDocument();
  });

  it("signs up for email only with consent, and sends no workout data", async () => {
    const calls: { method: string; body: Record<string, unknown> }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        calls.push({ method: String(init.method), body: JSON.parse(String(init.body)) });
        return new Response(JSON.stringify({ status: "pending" }), { status: 200 });
      }),
    );
    const user = userEvent.setup();
    render(<MessageSettings />);
    const send = screen.getByRole("button", { name: "Send confirmation email" });
    await user.type(screen.getByLabelText("Email address"), "me@example.com");
    expect(send).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    await user.click(send);
    await screen.findByText(/Check me@example.com for a confirmation link/);

    expect(calls).toHaveLength(1);
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
        "lastWorkoutAt",
        "pro",
        "resubscribe",
        "startedAt",
        "streakWeeks",
        "time",
        "token",
        "tz",
        "weekDays",
        "weekStart",
      ].sort(),
    );
    expect(b.email).toBe("me@example.com");
    expect(JSON.parse(localStorage.getItem(SUB_KEY)!)).toMatchObject({ id: b.id, token: b.token });
    expect(useApp.getState().profile.messages?.email).toMatchObject({ address: "me@example.com", status: "pending" });

    // Each kind has its own switch; offers start off.
    const offers = screen.getByRole("switch", { name: "Pro trial and offers" });
    expect(offers).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: "Workout reminders" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("switch", { name: "Missed workouts" }));
    expect(useApp.getState().profile.messages?.email?.kinds.missed).toBe(false);
  });

  it("stops email and deletes the address from the server", async () => {
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
    await user.click(screen.getByRole("button", { name: "Stop all email and delete my address" }));
    await screen.findByText(/your address is deleted/);
    expect(methods).toEqual(["DELETE"]);
    expect(useApp.getState().profile.messages?.email).toBeUndefined();
    expect(localStorage.getItem(SUB_KEY)).toBeNull();
  });

  it("says so when the server can't be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    const user = userEvent.setup();
    render(<MessageSettings />);
    await user.type(screen.getByLabelText("Email address"), "me@example.com");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Send confirmation email" }));
    await screen.findByText(/Couldn't reach the server/);
  });
});
