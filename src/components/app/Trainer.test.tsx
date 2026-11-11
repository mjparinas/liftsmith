// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { forgetAccount, useAccount } from "@/lib/auth";
import { cacheFlags } from "@/lib/flags";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";
import { makeWorkout, NOW } from "@/test/factories";

import { Trainer } from "./Trainer";

const calls: { url: string; body: unknown; auth?: string }[] = [];
let linked = false;

beforeEach(() => {
  localStorage.clear();
  calls.length = 0;
  linked = false;
  const account = { token: "tok", id: "me", email: "me@example.com", providers: ["email"], via: "email" as const };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  useAccount.setState({ account });
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, body, auth: (init.headers as Record<string, string>)?.Authorization });
    if (url === "/api/coach/?client=c1")
      return Response.json({
        name: "Alex",
        daysPerWeek: 3,
        events: makeWorkout("w1", NOW - 3600_000, [{}, { exerciseId: "custom-sled" }]),
      });
    if (url === "/api/coach/" && !body)
      return Response.json({
        invite: { code: "ABCD2345", expiresAt: NOW + 7 * 86_400_000 },
        clients: [{ id: "c1", name: "Alex", since: NOW }],
        coaches: linked ? [{ id: "k1", name: "Sam", since: NOW }] : [],
      });
    if (body?.action === "preview") return Response.json({ coach: { id: "k1", name: "Sam", since: NOW } });
    if (body?.action === "join") {
      linked = true;
      return Response.json({ coach: { id: "k1", name: "Sam", since: NOW } });
    }
    return Response.json({ ok: true });
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  forgetAccount();
});

describe("trainer mode", () => {
  it("asks to sign in first", () => {
    useAccount.setState({ account: null });
    render(<Trainer />);
    expect(screen.getByText("Sign in to use coaching")).toBeInTheDocument();
  });

  it("a client checks a code, sees what the coach will see, and agrees", async () => {
    const u = userEvent.setup();
    render(<Trainer />);
    await u.type(screen.getByLabelText(/Got a code from your coach/), "abcd-2345");
    await u.click(screen.getByRole("button", { name: "Check code" }));
    expect(await screen.findByText("Share your workouts with Sam?")).toBeInTheDocument();
    expect(screen.getByText(/won't see your heart rate/)).toBeInTheDocument();
    // Looking links nothing.
    expect(calls.some((c) => (c.body as { action?: string } | undefined)?.action === "join")).toBe(false);
    await u.click(screen.getByRole("button", { name: "Share my workouts" }));
    expect(await screen.findByText("Done. Your coach can now see your workouts.")).toBeInTheDocument();
    expect(calls.find((c) => (c.body as { action?: string })?.action === "join")).toMatchObject({
      body: { code: "ABCD2345" },
      auth: "Bearer tok",
    });
    expect(await screen.findByRole("button", { name: "Stop sharing" })).toBeInTheDocument();
  });

  it("an invite link fills in the code and shows whose it is", async () => {
    render(<Trainer arg="ABCD2345" />);
    expect(await screen.findByText("Share your workouts with Sam?")).toBeInTheDocument();
  });

  it("coaching clients waits for the lab", async () => {
    render(<Trainer />);
    expect(await screen.findByText("Coach clients")).toBeInTheDocument();
    expect(screen.queryByText("ABCD-2345")).toBeNull();
  });

  it("with the lab on, a coach sees their invite, their clients and a client's report", async () => {
    cacheFlags({ labTrainer: true });
    const { unmount } = render(<Trainer />);
    expect(await screen.findByText("ABCD-2345")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Alex/ })).toBeInTheDocument();
    unmount();
    render(<Trainer arg="c.c1" />);
    expect(await screen.findByRole("heading", { name: "Alex" })).toBeInTheDocument();
    expect(screen.getByText("Workouts per week")).toBeInTheDocument();
    expect(screen.getByText(/Their own exercise/)).toBeInTheDocument();
  });
});
