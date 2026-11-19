// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FixStatus } from "@/server/gymAiFix";

import { GymAiFix } from "./GymAiFix";

const T0 = Date.now();
const fix = (over: Partial<FixStatus> = {}): FixStatus => ({
  id: "fix1",
  state: "running",
  total: 1200,
  done: 300,
  filled: 120,
  fixed: 0,
  suggested: 40,
  flagged: 3,
  skipped: 20,
  note: "",
  startedBy: "a@x.com",
  startedAt: T0,
  endedAt: 0,
  activeAt: T0,
  pausedUntil: 0,
  oldRules: false,
  suggestions: [
    {
      id: "s1",
      placeId: "osm-node-12",
      name: "Studio Lagree",
      field: "phone",
      before: "+1 647-352-2775",
      after: "+1-416-551-9194",
      at: T0,
      undone: false,
      state: "suggested",
    },
  ],
  recent: [
    {
      id: "c1",
      placeId: "osm-node-10",
      name: "Iron Works",
      field: "phone",
      before: "604-555-0000",
      after: "+1 604-555-0199",
      at: T0,
      undone: false,
      state: "applied",
    },
    {
      id: "c2",
      placeId: "osm-node-11",
      name: "Bar Hall",
      field: "city",
      before: "80145",
      after: "Napoli",
      at: T0,
      undone: false,
      state: "applied",
    },
  ],
  ...over,
});

let onServer: FixStatus | null = null;
const posts: Record<string, unknown>[] = [];
beforeEach(() => {
  posts.length = 0;
  onServer = null;
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    if (url.includes("?fix=1")) return Response.json({ fix: onServer });
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    posts.push(body);
    if (body.action === "fixStart") onServer = fix({ done: 0, recent: [] });
    if (body.action === "fixUndo") onServer = fix({ recent: [{ ...fix().recent[0]!, undone: true }] });
    if (body.action === "fixApply") onServer = fix({ suggestions: [] });
    return Response.json({ fix: onServer });
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Admin › Gyms › AI fix-up", () => {
  it("starts the pass, then shows its progress with Stop", async () => {
    render(<GymAiFix admin changed={() => undefined} />);
    await userEvent.click(await screen.findByRole("button", { name: "Run the AI fix-up on unclaimed gyms" }));
    expect(posts).toEqual([{ action: "fixStart" }]);
    expect(await screen.findByRole("status")).toHaveTextContent("Running: 0 of 1200 gyms");
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Run the AI fix-up/ })).toBeNull();
  });

  it("says when a paused pass carries on, lists changes and undoes one (not a city)", async () => {
    onServer = fix({
      pausedUntil: T0 + 3_600_000,
      note: "Paused: Today's AI spend reached its $2 cap. It carries on by itself at midnight Pacific.",
    });
    const changed = vi.fn();
    render(<GymAiFix admin changed={changed} />);
    expect(await screen.findByRole("status")).toHaveTextContent(/^Paused until .*: 300 of 1200 gyms$/);
    expect(screen.getByText(/carries on by itself at midnight Pacific/)).toBeInTheDocument();
    expect(screen.getByText("Phone: 604-555-0000 → +1 604-555-0199")).toBeInTheDocument();
    // One Undo: the city change moved the page, so it has none.
    const undo = screen.getAllByRole("button", { name: "Undo" });
    // (the suggestion has Apply and Dismiss instead)
    expect(undo).toHaveLength(1);
    await userEvent.click(undo[0]!);
    expect(posts).toEqual([{ action: "fixUndo", change: "c1" }]);
    await waitFor(() => expect(screen.getByText("undone")).toBeInTheDocument());
    expect(changed).toHaveBeenCalled();
  });

  it("applies a suggestion only when staff press Apply", async () => {
    onServer = fix();
    const changed = vi.fn();
    render(<GymAiFix admin changed={changed} />);
    expect(await screen.findByText("Suggestions waiting for you (1)")).toBeInTheDocument();
    expect(screen.getByText("Phone: +1 647-352-2775 → +1-416-551-9194")).toBeInTheDocument();
    expect(screen.getByText(/40 have suggestions for you/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(posts).toEqual([{ action: "fixApply", change: "s1" }]);
    await waitFor(() => expect(screen.queryByText(/Suggestions waiting/)).toBeNull());
    expect(changed).toHaveBeenCalled();
  });

  it("lets support staff watch without buttons", async () => {
    onServer = fix();
    render(<GymAiFix admin={false} changed={() => undefined} />);
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
