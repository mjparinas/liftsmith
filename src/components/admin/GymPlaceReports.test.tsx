// @vitest-environment jsdom
// Delete on a reported gym page asks "Are you sure?" first, and a claimed gym has no Delete (Melvin, 2026-11-19).
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ReportedPlace } from "@/server/gymPlaceReports";

import { GymPlaceReports } from "./GymPlaceReports";

const place = (over: Partial<ReportedPlace> = {}): ReportedPlace => ({
  id: "0123456789abcdef",
  citySlug: "toronto-on",
  slug: "tosho-knife-arts",
  name: "Tosho Knife Arts Inc.",
  kind: "gym",
  address: "934 Bathurst Street",
  city: "Toronto",
  region: "ON",
  website: "",
  phone: "",
  hours: "",
  official: false,
  hidden: false,
  lifters: 0,
  reports: 1,
  lastAt: Date.now(),
  lines: [{ reason: "notGym", note: "Knife shop, not a gym", at: Date.now() }],
  ...over,
});

let places: ReportedPlace[] = [];
let posts: Record<string, unknown>[] = [];

beforeEach(() => {
  posts = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (url.startsWith("/api/admin/ai")) return new Response(JSON.stringify({ configured: false }), { status: 200 });
      if (init?.method === "POST") {
        posts.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        places = [];
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ places }), { status: 200 });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("deleting a reported gym page", () => {
  it("asks are you sure, and only Yes deletes it", async () => {
    places = [place()];
    render(<GymPlaceReports admin />);
    await userEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(screen.getByText("Are you sure? Delete Tosho Knife Arts Inc. for good?")).toBeTruthy();
    expect(posts).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText(/Are you sure/)).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Yes, delete it" }));
    await waitFor(() => expect(posts).toEqual([{ place: true, id: "0123456789abcdef", action: "delete" }]));
    expect(await screen.findByText("Nothing waiting.")).toBeTruthy();
  });

  it("has no Delete for a claimed gym", async () => {
    places = [place({ official: true })];
    render(<GymPlaceReports admin />);
    expect(await screen.findByRole("button", { name: "Hide" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });
});
