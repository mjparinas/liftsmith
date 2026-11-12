// @vitest-environment jsdom
// Friends on the desktop layout (docs/decisions/friends.md, "Friends on a big screen"): the feed sits beside the
// lifter's challenges and this week's board; on a phone the board stays behind its own chip.
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccount, type Account } from "@/lib/auth";
import { DESKTOP_QUERY } from "@/lib/layout";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";
import { resetDb } from "@/server/db";
import { handle } from "@/server/social";

import { Friends } from "./Friends";

let wide = true;
beforeEach(async () => {
  window.matchMedia = ((q: string) => ({
    matches: q === DESKTOP_QUERY ? wide : false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  await resetDb();
  const a: Account = { token: "tok-a", id: "acc-a", email: null, providers: ["email"], via: "email" };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
  useAccount.setState({ account: a });
  const ids: Record<string, string> = { "tok-a": "acc-a" };
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const token = String((init.headers as Record<string, string>).Authorization ?? "").replace("Bearer ", "");
    if (url !== "/api/social/" || !ids[token]) return Response.json({ error: "Not found" }, { status: 404 });
    const r = await handle(ids[token], JSON.parse(String(init.body)));
    return Response.json(r.body, { status: r.code });
  });
  await handle("acc-a", { op: "join", handle: "sam", name: "Sam", agree: true });
  await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true });
  await handle("acc-b", { op: "update", public: true });
  await handle("acc-b", {
    op: "post",
    workoutId: "w1",
    at: Date.now() - 3_600_000,
    caption: "Leg day",
    body: { seconds: 3000, sets: 10, volume: 0, prs: 0, muscles: [], exercises: [{ id: "bench-press", sets: 3, w: 60, r: 8 }] },
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  useAccount.setState({ account: null });
  localStorage.removeItem(ACCOUNT_KEY);
});

describe("Friends on the desktop layout", () => {
  it("shows the feed with Discover beside the challenges and the board", async () => {
    const u = userEvent.setup();
    render(<Friends />);
    expect(await screen.findByRole("button", { name: "Start a challenge" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Feed" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Discover" }));
    expect(await screen.findByText("Leg day")).toBeInTheDocument();
  });

  it("keeps the board behind its own chip on a phone", async () => {
    wide = false;
    render(<Friends />);
    expect(await screen.findByRole("button", { name: "Discover" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Start a challenge" })).toBeNull();
  });
});
