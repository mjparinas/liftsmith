// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Pins } from "./Pins";

const pin = (id: string, kind: "image" | "video", status: string) => ({
  id,
  exercise: id.split(":")[0],
  kind,
  title: "Barbell bench press: 3 form cues",
  description: "Three cues.",
  link: "https://www.getliftsmith.com/exercises/bench-press/",
  board: "Chest",
  media_url: `https://x.public.blob.vercel-storage.com/pins/bench-press/a-${kind === "image" ? "pin.jpg" : "clip.mp4"}`,
  cover_url: "",
  status,
  created_at: 1,
  posted_at: null,
  pin_id: null,
  error: "",
});

const data = (connected: boolean) => ({
  counts: { review: 2, ready: 6, posting: 0, processing: 0, posted: 0, failed: 0, skipped: 0 },
  pins: [pin("bench-press:image", "image", "review"), pin("bench-press:video", "video", "review")],
  settings: { perDay: 2, video: true, review: true, paused: false, sandbox: false },
  pinterest: { configured: true, connected, user: connected ? "liftsmith" : "", sandbox: false, expires: Date.now() + 1e10 },
  now: Date.now(),
});

let posts: Record<string, unknown>[] = [];
beforeEach(() => {
  posts = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        posts.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        return Response.json({ ok: true, changed: 2 });
      }
      return Response.json(data(true));
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("the Pins tab", () => {
  it("shows the link, how long the queue lasts and the pins waiting for a look", async () => {
    render(<Pins admin />);
    expect(await screen.findByText(/Connected as @liftsmith/)).toBeTruthy();
    expect(screen.getByText(/6 queued: enough for 3 days/)).toBeTruthy();
    expect(screen.getAllByText("Barbell bench press: 3 form cues")).toHaveLength(2);
  });

  it("approves every pin waiting in one tap", async () => {
    render(<Pins admin />);
    await userEvent.click(await screen.findByRole("button", { name: "Approve all 2" }));
    await waitFor(() => expect(posts).toEqual([{ action: "approveAll" }]));
    expect(await screen.findByText("2 approved.")).toBeTruthy();
  });

  it("offers no changes to support staff", async () => {
    render(<Pins admin={false} />);
    await screen.findByText(/Connected as @liftsmith/);
    expect(screen.queryByRole("button", { name: /Approve/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Disconnect" })).toBeNull();
  });
});
