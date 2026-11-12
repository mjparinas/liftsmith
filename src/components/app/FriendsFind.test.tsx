// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccount, type Account } from "@/lib/auth";
import { useSocial } from "@/lib/social";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";
import { resetDb } from "@/server/db";
import { handle } from "@/server/social";

import { Friends, PersonScreen } from "./Friends";

// People you may know, finding by name and richer profiles, against the real server code (docs/decisions/friends.md).
const accounts: Record<string, string> = { "tok-a": "acc-a", "tok-b": "acc-b" };
function signIn(token: string) {
  const a: Account = { token, id: accounts[token]!, email: null, providers: ["email"], via: "email" };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
  useAccount.setState({ account: a });
  useSocial.setState({ me: null, error: null });
}
const join = (acc: string, h: string, name: string, extra: Record<string, unknown> = {}) =>
  handle(acc, { op: "join", handle: h, name, agree: true, ...extra });

beforeEach(async () => {
  await resetDb();
  localStorage.clear();
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const token = String((init.headers as Record<string, string>).Authorization ?? "").replace("Bearer ", "");
    if (url !== "/api/social/" || !accounts[token]) return Response.json({ error: "Not found" }, { status: 404 });
    const r = await handle(accounts[token], JSON.parse(String(init.body)));
    return Response.json(r.body, { status: r.code });
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useAccount.setState({ account: null });
});

describe("finding people", () => {
  it("suggests someone who follows you with why, follows them in one tap, and finds public profiles by name", async () => {
    const u = userEvent.setup();
    await join("acc-a", "alex", "Alex", { open: true });
    await join("acc-b", "blair", "Blair Stone", { open: true });
    await handle("acc-b", { op: "follow", handle: "alex" });
    await join("acc-c", "casey", "Casey Stone");
    await handle("acc-c", { op: "update", public: true });
    signIn("tok-a");
    render(<Friends tab="people" />);
    expect(await screen.findByText("People you may know")).toBeInTheDocument();
    expect(screen.getAllByText("Follows you").length).toBeGreaterThan(0);
    await u.click(screen.getByRole("button", { name: "Follow" }));
    await waitFor(() => expect(screen.queryByText("People you may know")).toBeNull());
    await u.type(screen.getByLabelText("Find a friend"), "stone");
    const results = await screen.findByRole("list", { name: "Search results" });
    await waitFor(() => expect(results).toHaveTextContent("Casey Stone"));
    expect(results).not.toHaveTextContent("Blair Stone"); // private: found by handle only
  });
});

describe("a richer profile", () => {
  it("shows a friend's level, streak, training calendar and opens their followers", async () => {
    const u = userEvent.setup();
    await join("acc-a", "alex", "Alex");
    await join("acc-b", "blair", "Blair", { open: true });
    await handle("acc-b", { op: "update", level: 7, streak: 3 });
    await handle("acc-a", { op: "follow", handle: "blair" });
    await handle("acc-b", {
      op: "post",
      workoutId: "w1",
      at: Date.now() - 86_400_000,
      body: {
        seconds: 3000,
        sets: 5,
        volume: 1000,
        prs: 0,
        muscles: [],
        exercises: [{ id: "back-squat", name: "", sets: 5, w: 100, r: 5 }],
      },
    });
    signIn("tok-a");
    render(<PersonScreen handle="blair" />);
    expect(await screen.findByText("Level 7")).toBeInTheDocument();
    expect(screen.getByText("3-week streak")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "1 workout posted in the last 12 weeks" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Followers/ }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Alex");
  });
});
