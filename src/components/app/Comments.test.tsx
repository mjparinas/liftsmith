// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccount, type Account } from "@/lib/auth";
import { useSocial } from "@/lib/social";
import type { FeedComment } from "@/lib/socialTypes";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";
import { resetDb } from "@/server/db";
import { handle } from "@/server/social";

import { mentionQuery, threaded } from "./Comments";
import { Friends } from "./Friends";

const accounts: Record<string, string> = { "tok-a": "acc-a" };
const c = (id: string, replyTo?: string): FeedComment => ({
  id,
  handle: "h",
  name: "N",
  avatar: "",
  at: 0,
  body: "",
  mine: false,
  canDelete: false,
  ...(replyTo ? { replyTo } : {}),
});

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

describe("comment threads", () => {
  it("puts replies under their top comment, and a reply whose top comment is gone on its own", () => {
    expect(threaded([c("a"), c("b"), c("r1", "a"), c("r2", "gone")]).map((x) => [x.c.id, x.reply])).toEqual([
      ["a", false],
      ["r1", true],
      ["b", false],
      ["r2", false],
    ]);
  });

  it("knows when an @ is being typed", () => {
    expect(mentionQuery("nice @ca")).toBe("ca");
    expect(mentionQuery("@")).toBe("");
    expect(mentionQuery("me@x")).toBeNull();
    expect(mentionQuery("@casey ")).toBeNull();
  });

  it("offers people to mention as chips, and replies to a comment", async () => {
    const u = userEvent.setup();
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true, open: true });
    await handle("acc-b", { op: "join", handle: "casey", name: "Casey", agree: true, open: true });
    await handle("acc-a", { op: "follow", handle: "casey" });
    await handle("acc-b", { op: "follow", handle: "alex" });
    const { id } = (
      await handle("acc-a", {
        op: "post",
        workoutId: "w1",
        at: Date.now() - 3_600_000,
        body: {
          seconds: 60,
          sets: 1,
          volume: 100,
          prs: 0,
          muscles: [],
          exercises: [{ id: "back-squat", name: "", sets: 1, w: 100, r: 1 }],
        },
      })
    ).body as { id: string };
    await handle("acc-b", { op: "comment", id, text: "Big squat" });
    const a: Account = { token: "tok-a", id: "acc-a", email: null, providers: ["email"], via: "email" };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
    useAccount.setState({ account: a });
    useSocial.setState({ me: null, error: null });
    render(<Friends />);
    await u.click(await screen.findByRole("button", { name: /^Comments/ }));
    await u.click(await screen.findByRole("button", { name: "Reply to Casey" }));
    expect(screen.getByLabelText("Replying to Casey")).toHaveValue("@casey ");
    await u.clear(screen.getByLabelText("Replying to Casey"));
    await u.type(screen.getByLabelText("Replying to Casey"), "Thanks @ca");
    await u.click(within(screen.getByRole("group", { name: "Mention someone" })).getByRole("button", { name: "Casey" }));
    expect(screen.getByLabelText("Replying to Casey")).toHaveValue("Thanks @casey ");
    await u.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("button", { name: "@casey" })).toBeInTheDocument();
  });
});
