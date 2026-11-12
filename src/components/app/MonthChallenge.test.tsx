// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/monthly/route.api";
import { useAccount, type Account } from "@/lib/auth";
import type { SessionSummary } from "@/lib/derive";
import { monthChallenge } from "@/lib/monthly";
import { resetMonthFinishers } from "@/lib/monthlyCount";
import { useSocial } from "@/lib/social";
import { useApp } from "@/lib/store";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";
import { resetDb } from "@/server/db";
import { recordFinish } from "@/server/monthly";
import { handle } from "@/server/social";

import { MonthCard, MonthFriends } from "./MonthChallenge";

// The monthly challenge for everyone (Friends gap list 2, item 7; docs/decisions/friends.md).
// Mid-month, so last month and this month both have room whatever day the tests run.
const real = new Date();
const now = new Date(real.getFullYear(), real.getMonth(), 15, 12).getTime();
const ch = monthChallenge(now);
const session = (start: number): SessionSummary => ({
  sessionId: `s${start}`,
  start,
  seconds: 3600,
  sets: 20,
  volume: 0,
  exercises: [],
  prs: 0,
});
const setSessions = (list: SessionSummary[]) => useApp.setState({ stats: { ...useApp.getState().stats, sessions: list } });

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"], now });
  await resetDb();
  localStorage.clear();
  resetMonthFinishers();
});
afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.unstubAllGlobals();
  setSessions([]);
  useAccount.setState({ account: null });
});

describe("the month card on Awards", () => {
  it("says what this month asks, what it takes to finish, and shows last month's medal", () => {
    const lastMonth = monthChallenge(ch.start - 86_400_000);
    // Plenty last month (60 one-hour, 20-set workouts finish any goal), one so far this month.
    setSessions([...Array.from({ length: 60 }, (_, i) => session(lastMonth.start + i * 3_600_000)), session(ch.start + 1000)]);
    render(<MonthCard />);
    expect(screen.getByText("Challenge of the month")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText(/to go: about .* a week finishes it\./)).toBeInTheDocument();
    expect(screen.getByText("Medals")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[0]).toHaveAccessibleName(/, finished$/);
  });
});

describe("everyone who finished this month", () => {
  const api = () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      const req = new Request(`https://www.getliftsmith.com${url}`, init);
      return init?.method === "POST" ? POST(req) : GET(req);
    });
    return calls;
  };

  it("shows how many lifters finished so far, without reporting this device before it finishes", async () => {
    const calls = api();
    await recordFinish(ch.key, "someone-else-xxxxxxxx");
    await recordFinish(ch.key, "another-one-xxxxxxxx");
    setSessions([session(ch.start + 1000)]);
    render(<MonthCard />);
    expect(await screen.findByText("2 lifters have finished it so far.")).toBeInTheDocument();
    expect(calls).toEqual([`GET /api/monthly/?month=${ch.key}`]);
  });

  it("reports once when the lifter finishes, and counts them in", async () => {
    const calls = api();
    await recordFinish(ch.key, "someone-else-xxxxxxxx");
    setSessions(Array.from({ length: 60 }, (_, i) => session(ch.start + i * 3_600_000)));
    render(<MonthCard />);
    expect(await screen.findByText("2 lifters have finished it, you included.")).toBeInTheDocument();
    cleanup();
    resetMonthFinishers();
    render(<MonthCard />);
    expect(await screen.findByText("2 lifters have finished it, you included.")).toBeInTheDocument();
    expect(calls.filter((c) => c.startsWith("POST"))).toHaveLength(1);
  });

  it("leaves the line out when the count can't be reached", async () => {
    vi.stubGlobal("fetch", async () => Promise.reject(new Error("offline")));
    setSessions([session(ch.start + 1000)]);
    render(<MonthCard />);
    expect(await screen.findByText("Challenge of the month")).toBeInTheDocument();
    expect(screen.queryByText(/lifters? ha(s|ve) finished/)).toBeNull();
  });
});

describe("friends on the month's challenge", () => {
  it("ranks the lifter and the people they follow, marking who finished", async () => {
    const accounts: Record<string, string> = { "tok-a": "acc-a" };
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      const token = String((init.headers as Record<string, string>).Authorization ?? "").replace("Bearer ", "");
      const r = await handle(accounts[token]!, JSON.parse(String(init.body)));
      return Response.json(r.body, { status: r.code });
    });
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    await handle("acc-b", { op: "join", handle: "blair", name: "Blair", agree: true, open: true });
    await handle("acc-a", { op: "follow", handle: "blair" });
    for (let i = 0; i < 40; i++)
      await handle("acc-b", {
        op: "post",
        workoutId: `w${i}`,
        at: ch.start + i * 3_600_000,
        body: {
          seconds: 3600,
          sets: 20,
          volume: 1000,
          prs: 0,
          muscles: [],
          exercises: [{ id: "bench", name: "Bench", sets: 4, w: 60, r: 8 }],
        },
      });
    const a: Account = { token: "tok-a", id: "acc-a", email: null, providers: ["email"], via: "email" };
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
    useAccount.setState({ account: a });
    useSocial.setState({ me: null });
    render(<MonthFriends />);
    const list = await screen.findByRole("list", { name: "Friends on this month’s challenge" });
    const rows = within(list).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("Blair");
    expect(rows[0]).toHaveTextContent("Finished");
    expect(rows[1]).toHaveTextContent(`0/${ch.goal}`);
  });

  it("lets the board span a calendar month, but no more", async () => {
    await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
    expect((await handle("acc-a", { op: "board", from: ch.start, to: ch.end }, now)).code).toBe(200);
    expect((await handle("acc-a", { op: "board", from: ch.start, to: ch.start + 40 * 86_400_000 }, now)).code).toBe(400);
  });
});
