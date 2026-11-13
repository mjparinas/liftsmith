// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccount, type Account } from "@/lib/auth";
import { useSocial, type SocialMe } from "@/lib/social";
import { liveNow } from "@/lib/socialLive";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";
import { resetDb } from "@/server/db";
import { handle } from "@/server/social";
import { makeSet } from "@/test/factories";

import { TrainingNow } from "./FriendsLive";
import { CheerRain } from "./workout/CheerRain";

// Training now and cheers (Friends gap list 2, item 4; docs/decisions/friends.md), against the real server code.
const accounts: Record<string, string> = { "tok-a": "acc-a", "tok-b": "acc-b" };
async function signIn(token: string) {
  const a: Account = { token, id: accounts[token]!, email: null, providers: ["email"], via: "email" };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
  useAccount.setState({ account: a });
  const me = (await handle(a.id, { op: "me" })).body as unknown as SocialMe;
  useSocial.setState({ me, error: null });
}
const join = (acc: string, h: string, name: string) => handle(acc, { op: "join", handle: h, name, agree: true, open: true });

beforeEach(async () => {
  await resetDb();
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const token = String((init.headers as Record<string, string>).Authorization ?? "").replace("Bearer ", "");
    if (url !== "/api/social/" || !accounts[token]) return Response.json({ error: "Not found" }, { status: 404 });
    const r = await handle(accounts[token], JSON.parse(String(init.body)));
    return Response.json(r.body, { status: r.code });
  });
  await join("acc-a", "alex", "Alex");
  await join("acc-b", "blair", "Blair");
  await handle("acc-a", { op: "follow", handle: "blair" });
  await handle("acc-b", { op: "follow", handle: "alex" });
  await handle("acc-b", { op: "update", live: true });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useAccount.setState({ account: null });
});

describe("training now", () => {
  it("shows a friend's workout in progress and sends a cheer in one tap, which floats up their workout screen", async () => {
    const u = userEvent.setup();
    const startedAt = Date.now() - 60_000;
    await handle("acc-b", { op: "live", sessionId: "s1", exercise: "bench", done: 3, total: 12 }, Date.now() - 5 * 60_000);
    await signIn("tok-a");
    const { unmount } = render(<TrainingNow />);
    expect(await screen.findByText("Training now")).toBeInTheDocument();
    expect(screen.getByText(/3 of 12 sets done/)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "🔥 Cheer Blair on" }));
    expect(await screen.findByRole("status")).toHaveTextContent("🔥 sent to Blair. Cheer again in 5 s.");
    // The sender sees how long Blair has been training, and the buttons wait out the gap between cheers.
    expect(screen.getByText("Training for 5 min")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "💪 Cheer Blair on" })).toBeDisabled();
    unmount();

    await signIn("tok-b");
    render(<CheerRain sessionId="s1" startedAt={startedAt} />);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Alex cheered you on 🔥"));
    await waitFor(() => expect(screen.getByTestId("cheer-rain")).toHaveTextContent("🔥"));
  });

  it("leaves out the cheer buttons for a friend who turned cheers off", async () => {
    await handle("acc-b", { op: "update", cheers: false });
    await handle("acc-b", { op: "live", sessionId: "s1", exercise: "bench", done: 3, total: 12 });
    await signIn("tok-a");
    render(<TrainingNow />);
    expect(await screen.findByText(/3 of 12 sets done/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "🔥 Cheer Blair on" })).not.toBeInTheDocument();
  });

  it("shows nothing when no friend is training", async () => {
    await signIn("tok-a");
    const { container } = render(<TrainingNow />);
    await new Promise((r) => setTimeout(r, 50));
    expect(container).toBeEmptyDOMElement();
  });
});

describe("liveNow", () => {
  it("counts this workout's sets and the planned total, and names the exercise on screen", () => {
    const plan = {
      items: [
        { exerciseId: "squat", sets: 3 },
        { exerciseId: "bench", sets: 4 },
      ],
    } as never;
    const events = [makeSet({ sessionId: "s1" }), makeSet({ sessionId: "s1" }), makeSet({ sessionId: "old" })];
    expect(liveNow({ sessionId: "s1", plan, index: 1 }, events)).toEqual({ sessionId: "s1", exercise: "bench", done: 2, total: 7 });
    expect(liveNow(null, events)).toBeNull();
  });
});
