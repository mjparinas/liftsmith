// @vitest-environment jsdom
// Coach chat's live parts (2026-11-15, docs/decisions/trainer-mode.md "Chat dock, statuses and stickers"): how the other
// side shows, typing, "Seen", the vacation note, emoji and stickers, the status sheet, and the desktop chat dock.
import "fake-indexeddb/auto";

import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccount } from "@/lib/auth";
import { resetChime, useLive } from "@/lib/chatLive";
import { DESKTOP_QUERY } from "@/lib/layout";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";

import { ChatDock, openWin } from "./ChatDock";
import { ChatThread, mergeMessages } from "./CoachChat";

const NOW = Date.now();
const calls: { url: string; body: Record<string, unknown> | undefined }[] = [];
let thread: Record<string, unknown> = {};
let live: Record<string, unknown> = {};
let wide = false;

function fakeMatchMedia() {
  window.matchMedia = ((q: string) => ({
    matches: q === DESKTOP_QUERY ? wide : false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  localStorage.clear();
  calls.length = 0;
  wide = false;
  fakeMatchMedia();
  resetChime();
  useLive.setState({ live: null });
  document.title = "Liftsmith";
  const account = { token: "tok", id: "me", email: "me@example.com", providers: ["email"], via: "email" as const };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  useAccount.setState({ account });
  thread = {
    name: "Sam",
    them: "coach",
    more: false,
    messages: [
      { id: "m1", from: "k1", text: "How did squats feel?", at: NOW - 60_000 },
      { id: "m2", from: "me", text: "Heavy but good", at: NOW - 30_000 },
    ],
    seen: NOW - 10_000,
    typing: true,
    presence: { state: "online", until: 0 },
  };
  live = {
    me: { status: "auto", until: 0 },
    people: [
      {
        id: "k1",
        name: "Sam",
        them: "coach",
        presence: { state: "busy", until: NOW + 3_600_000 },
        unread: 2,
        typing: false,
        seen: 0,
        last: { id: "m9", from: "k1", text: "Bring your belt", at: NOW - 5_000 },
      },
    ],
  };
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    const body = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined;
    calls.push({ url, body });
    if (url.startsWith("/api/coach/?chat=")) return Response.json(url.includes("after=") ? { ...thread, messages: [] } : thread);
    if (url === "/api/coach/?live=1") return Response.json(live);
    if (body?.action === "send")
      return Response.json({ message: { id: "new", from: "me", text: body.sticker ? "" : body.text, at: NOW, sticker: body.sticker } });
    if (body?.action === "status") return Response.json({ status: body.status, until: body.until });
    return Response.json({ ok: true });
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("a chat thread", () => {
  it("shows how the other side is, that they're typing, and when they saw your newest message", async () => {
    render(<ChatThread id="k1" />);
    expect(await screen.findByText("Heavy but good")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByTestId("chat-typing")).toHaveTextContent("Sam is typing");
    expect(screen.getByTestId("chat-receipt")).toHaveTextContent(/^Seen /);
  });

  it("says Sent until they've read it, and warns before writing to someone on vacation", async () => {
    thread = { ...thread, seen: NOW - 50_000, typing: false, presence: { state: "vacation", until: NOW + 5 * 86_400_000 } };
    render(<ChatThread id="k1" />);
    expect(await screen.findByTestId("chat-receipt")).toHaveTextContent("Sent");
    expect(screen.getByRole("note")).toHaveTextContent(/On vacation, back .*Sam will see your message when they're back\./);
  });

  it("puts an emoji in the box and sends a sticker on its own", async () => {
    const u = userEvent.setup();
    render(<ChatThread id="k1" />);
    await screen.findByText("Heavy but good");
    await u.click(screen.getByRole("button", { name: "Emoji" }));
    await u.click(screen.getByRole("button", { name: "💪" }));
    expect(screen.getByLabelText("Write a message")).toHaveValue("💪");
    await u.click(screen.getByRole("button", { name: "Stickers" }));
    await u.click(screen.getByRole("button", { name: "Send sticker: New PR!" }));
    expect(calls.find((c) => c.body?.action === "send")?.body).toMatchObject({ id: "k1", sticker: "pr" });
    expect(await screen.findByRole("img", { name: "New PR!" })).toBeInTheDocument();
    // The words typed so far stay in the box.
    expect(screen.getByLabelText("Write a message")).toHaveValue("💪");
  });

  it("tells the other side it's typing, at most every few seconds", async () => {
    const u = userEvent.setup();
    render(<ChatThread id="k1" />);
    await screen.findByText("Heavy but good");
    await u.type(screen.getByLabelText("Write a message"), "On my way");
    expect(calls.filter((c) => c.body?.action === "typing")).toHaveLength(1);
  });

  it("sends with Enter on a desktop, and Shift+Enter starts a new line", async () => {
    wide = true;
    fakeMatchMedia();
    const u = userEvent.setup();
    render(<ChatThread id="k1" mode="embedded" />);
    await screen.findByText("Heavy but good");
    const box = screen.getByLabelText("Write a message");
    await u.type(box, "Squats{Shift>}{Enter}{/Shift}felt good");
    expect(box).toHaveValue("Squats\nfelt good");
    await u.type(box, "{Enter}");
    expect(calls.find((c) => c.body?.action === "send")?.body).toMatchObject({ text: "Squats\nfelt good" });
  });

  it("merges new messages in order, without doubles", () => {
    const a = { id: "a", from: "k1", text: "a", at: 1 };
    const b = { id: "b", from: "me", text: "b", at: 2 };
    const c = { id: "c", from: "k1", text: "c", at: 3 };
    expect(mergeMessages([a, b], [b, c]).map((m) => m.id)).toEqual(["a", "b", "c"]);
    expect(mergeMessages([a, c], [b]).map((m) => m.id)).toEqual(["a", "b", "c"]);
  });
});

describe("the chat dock", () => {
  it("shows only on the desktop layout", async () => {
    render(<ChatDock hidden={false} />);
    await act(async () => {});
    expect(screen.queryByTestId("chat-dock")).toBeNull();
  });

  it("lists people with their status and unread count, opens a window, and puts the count in the tab's title", async () => {
    wide = true;
    fakeMatchMedia();
    const u = userEvent.setup();
    render(<ChatDock hidden={false} />);
    const dock = await screen.findByTestId("chat-dock");
    expect(document.title).toBe("(2) Liftsmith");
    await u.click(within(dock).getByRole("button", { name: /Messages/ }));
    const row = within(dock).getByRole("button", { name: /Sam/ });
    expect(row).toHaveTextContent("Bring your belt");
    expect(row).toHaveTextContent(/With a client until/);
    await u.click(row);
    expect(await within(dock).findByTestId("chat-window")).toBeInTheDocument();
    expect(await within(dock).findByText("Heavy but good")).toBeInTheDocument();
    await u.click(within(dock).getByRole("button", { name: "Close the chat with Sam" }));
    expect(within(dock).queryByTestId("chat-window")).toBeNull();
  });

  it("picks a status from the list", async () => {
    wide = true;
    fakeMatchMedia();
    const u = userEvent.setup();
    render(<ChatDock hidden={false} />);
    const dock = await screen.findByTestId("chat-dock");
    await u.click(within(dock).getByRole("button", { name: /Messages/ }));
    await u.click(within(dock).getByRole("button", { name: /Your status: Automatic/ }));
    await u.click(screen.getByRole("radio", { name: /On vacation/ }));
    await u.click(screen.getByRole("button", { name: "Set status" }));
    expect(calls.find((c) => c.body?.action === "status")?.body).toMatchObject({ status: "vacation", until: 0 });
  });

  it("keeps two windows at most, the newest beside the list", () => {
    let wins = openWin([], "a");
    wins = openWin(wins, "b");
    wins = openWin(wins, "c", true);
    expect(wins).toEqual([
      { id: "b", folded: false },
      { id: "c", folded: true },
    ]);
    // Opening one that's folded unfolds it.
    expect(openWin(wins, "c")).toEqual([
      { id: "b", folded: false },
      { id: "c", folded: false },
    ]);
  });
});
