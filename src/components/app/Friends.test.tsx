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
import { SendToFriend } from "./SendToFriend";

// The app's Friends screens against the real server code (an in-memory database): each fetch to /api/social/
// runs src/server/social.ts as the account whose token it carries.
const accounts: Record<string, string> = { "tok-a": "acc-a", "tok-b": "acc-b" };
function signIn(token: string) {
  const a: Account = { token, id: accounts[token]!, email: null, providers: ["email"], via: "email" };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
  useAccount.setState({ account: a });
  useSocial.setState({ me: null, error: null });
}

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

describe("Friends", () => {
  it("asks a signed-out lifter to sign in first", () => {
    render(<Friends />);
    expect(screen.getByText("Train with friends")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("joins with private defaults, then follows someone who approves", async () => {
    const u = userEvent.setup();
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true });
    signIn("tok-a");
    render(<Friends />);
    await u.type(await screen.findByLabelText("Handle"), "alex");
    await u.type(screen.getByLabelText("Name friends see"), "Alex");
    expect(screen.getByRole("switch", { name: "Anyone can follow me" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("switch", { name: "Post every workout" })).toHaveAttribute("aria-checked", "false");
    await u.click(screen.getByRole("button", { name: "Agree and join" }));
    expect(await screen.findByText("No workouts yet")).toBeInTheDocument();
    cleanup();

    render(<PersonScreen handle="blair" />);
    await u.click(await screen.findByRole("button", { name: "Ask to follow" }));
    expect(await screen.findByRole("button", { name: "Requested · Cancel" })).toBeInTheDocument();
    expect(screen.getByText("Your request is waiting for an answer.")).toBeInTheDocument();
    cleanup();

    signIn("tok-b");
    render(<Friends />);
    await u.click(await screen.findByRole("button", { name: /People/ }));
    await u.click(await screen.findByRole("button", { name: "Accept" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Accept" })).toBeNull());
    expect(await screen.findByText("@alex")).toBeInTheDocument();
  });

  it("reports a profile from its menu", async () => {
    const u = userEvent.setup();
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true });
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    signIn("tok-a");
    render(<PersonScreen handle="blair" />);
    await u.click(await screen.findByRole("button", { name: "Block or report Blair" }));
    await u.click(screen.getByRole("button", { name: "Report profile" }));
    await u.click(screen.getByRole("button", { name: "Spam or scam" }));
    await u.click(screen.getByRole("button", { name: "Send report" }));
    expect(await screen.findByText("Thanks. We’ll take a look.")).toBeInTheDocument();
  });

  it("sends a routine to a friend, who finds it in Activity", async () => {
    const u = userEvent.setup();
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true, open: true });
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true });
    await handle("acc-a", { op: "follow", handle: "blair" });
    await handle("acc-b", { op: "follow", handle: "alex" });
    signIn("tok-a");
    useSocial.setState({
      me: {
        profile: {
          handle: "alex",
          name: "Alex",
          open: true,
          autoPost: false,
          weights: true,
          public: false,
          push: { follows: true, comments: true, sent: true, likes: false },
          avatar: "",
          audience: "all",
          showLifts: true,
          lifts: [],
        },
      },
    });
    render(<SendToFriend name="Leg day" items={[{ exerciseId: "back-squat", sets: 4 }]} />);
    await u.click(screen.getByRole("button", { name: "Send to a friend" }));
    await u.click(await screen.findByRole("button", { name: "Send to Blair" }));
    expect(await screen.findByText("Sent to Blair.")).toBeInTheDocument();
    cleanup();

    signIn("tok-b");
    render(<Friends />);
    await u.click(await screen.findByRole("button", { name: /Activity/ }));
    expect(await screen.findByText("Alex sent you a workout: Leg day")).toBeInTheDocument();
  });

  it("edits a post's caption and audience, and offers to save a friend's workout as a routine", async () => {
    const u = userEvent.setup();
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    await handle("acc-a", {
      op: "post",
      workoutId: "s1",
      at: Date.now() - 3_600_000,
      body: {
        seconds: 3000,
        sets: 5,
        volume: null,
        prs: 0,
        muscles: [],
        exercises: [{ id: "back-squat", name: "", sets: 5, w: null, r: 5 }],
      },
    });
    signIn("tok-a");
    render(<Friends />);
    await u.click(await screen.findByRole("button", { name: "More options" }));
    expect(screen.getByRole("button", { name: "Save as a routine" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Edit post" }));
    await u.type(screen.getByLabelText("Caption"), "Felt strong");
    await u.click(screen.getByRole("button", { name: "Only me" }));
    expect(screen.getByText("Just for you: it stays on your profile, hidden from everyone else.")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Felt strong")).toBeInTheDocument();
    expect(screen.getByText(/· Only me/)).toBeInTheDocument();
  });

  it("mutes someone from their profile's menu", async () => {
    const u = userEvent.setup();
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true });
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    await handle("acc-a", { op: "follow", handle: "blair" });
    signIn("tok-a");
    render(<PersonScreen handle="blair" />);
    await u.click(await screen.findByRole("button", { name: "Block or report Blair" }));
    await u.click(screen.getByRole("button", { name: "Mute" }));
    expect(await screen.findByText("Muted: their workouts don’t show in your feed.")).toBeInTheDocument();
  });
});
