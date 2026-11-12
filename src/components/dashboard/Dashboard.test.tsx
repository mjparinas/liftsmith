// @vitest-environment jsdom
// The web dashboard end to end through the real IndexedDB (fake-indexeddb): overview, calendar,
// lifts, history, logging a past workout, and a share link a friend can open.
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccount, type Account } from "@/lib/auth";
import { decodeShare } from "@/lib/dashboard";
import { defaultProfile } from "@/lib/defaults";
import { setLanguage } from "@/lib/i18n";
import { appendEvents, eraseAll, load, saveRecord } from "@/lib/localdb";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";
import type { AppEvent, SetEvent } from "@/lib/types";
import { resetDb } from "@/server/db";
import { handle } from "@/server/social";

import { Dashboard } from "./Dashboard";
import { SharedProfile } from "./Share";

const pro = vi.hoisted(() => ({ on: true }));
vi.mock("@/lib/entitlements", async (orig) => {
  const real = await orig<typeof import("@/lib/entitlements")>();
  return { ...real, can: (f: Parameters<typeof real.can>[0]) => real.can(f, pro.on) };
});

const D = 86400_000;
let n = 0;
const set = (at: number, sessionId: string, over: Partial<SetEvent> = {}): SetEvent => ({
  type: "set",
  id: `s${n++}`,
  at,
  sessionId,
  exerciseId: "bench-press",
  weight: 60,
  reps: 5,
  targetReps: 5,
  rir: 2,
  ...over,
});
const workout = (at: number, id: string, over: Partial<SetEvent> = {}): AppEvent[] => [
  { type: "sessionStart", id: `st-${id}`, at: at - 60_000, sessionId: id, gymId: "g1", minutes: 45 },
  set(at, id, over),
  set(at + 1000, id, over),
  { type: "sessionEnd", id: `en-${id}`, at: at + 2_400_000, sessionId: id, seconds: 2400 },
];

async function seed(withWorkouts = true) {
  await saveRecord("profile", { ...defaultProfile(), name: "Sam", onboarded: true, unit: "kg" });
  if (withWorkouts) await appendEvents([...workout(Date.now() - 8 * D, "a"), ...workout(Date.now() - D, "b", { weight: 70 })]);
}

beforeEach(async () => {
  pro.on = true;
  location.hash = "";
  await eraseAll();
});
afterEach(cleanup);

describe("web dashboard", () => {
  it("follows the language picked in the app's Settings", async () => {
    await saveRecord("profile", { ...defaultProfile(), name: "Sam", onboarded: true, unit: "kg", language: "fr" });
    await appendEvents(workout(Date.now() - D, "a"));
    render(<Dashboard />);
    expect(await screen.findByRole("heading", { name: "L’entraînement de Sam" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Historique" })).toBeInTheDocument();
    expect(screen.getByText("Séances").nextSibling).toHaveTextContent("1");
    setLanguage("system");
  });

  it("shows the overview, then each tab", async () => {
    await seed();
    const user = userEvent.setup();
    render(<Dashboard />);
    expect(await screen.findByRole("heading", { name: "Sam’s training" })).toBeInTheDocument();
    expect(screen.getByText("Workouts").nextSibling).toHaveTextContent("2");
    expect(screen.getByText(/Showing the workouts saved in this browser/)).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Calendar" }));
    expect(await screen.findByRole("heading", { name: "The last year" })).toBeInTheDocument();
    const yesterday = new Date(Date.now() - D).toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    // The month calendar starts on this month; yesterday may be in the last one.
    if (new Date(Date.now() - D).getMonth() !== new Date().getMonth())
      await user.click(screen.getByRole("button", { name: "Previous month" }));
    await user.click(screen.getByRole("button", { name: new RegExp(`, ${yesterday}: 1 workout, 2 sets, 1 PR`) }));
    expect(await screen.findByRole("button", { name: /^2 sets · .* · 1 PRBarbell bench press$/ })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Lifts" }));
    expect(await screen.findByRole("img", { name: /Barbell bench press estimated one-rep max/ })).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: /Bench press/i })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Awards" }));
    expect(await screen.findByText("Showing up")).toBeInTheDocument();
    expect(screen.getAllByText("Secret achievement").length).toBeGreaterThan(5);
  });

  it("locks the advanced charts without Pro but keeps bests free", async () => {
    pro.on = false;
    await seed();
    location.hash = "#/lifts";
    render(<Dashboard />);
    expect(await screen.findByText("One-rep max trends is part of Pro")).toBeInTheDocument();
    expect(screen.getByText("Weekly sets per muscle is part of Pro")).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: /Bench press/i })).toBeInTheDocument();
  });

  it("invites a first workout when there are none", async () => {
    await seed(false);
    render(<Dashboard />);
    expect(await screen.findByText("No workouts here yet")).toBeInTheDocument();
  });

  it("logs a past workout that then shows in history and the stats", async () => {
    await seed();
    const user = userEvent.setup();
    location.hash = "#/log";
    render(<Dashboard />);
    await screen.findByText(/Forgot to track a workout/);
    await user.selectOptions(screen.getByRole("combobox", { name: "Exercise" }), "Deadlift");
    await user.click(screen.getByRole("button", { name: "Add exercise" }));
    await user.type(screen.getByRole("spinbutton", { name: "Deadlift set 1 weight" }), "140");
    await user.type(screen.getByRole("spinbutton", { name: "Deadlift set 1 reps" }), "5");
    await user.click(screen.getByRole("button", { name: "Add set" }));
    expect(screen.getByRole("spinbutton", { name: "Deadlift set 2 weight" })).toHaveValue(140);
    await user.click(screen.getByRole("button", { name: "Save workout" }));

    const details = await screen.findByRole("region", { name: "Workout details" });
    expect(within(details).getByText(/logged by hand/)).toBeInTheDocument();
    expect(within(details).getAllByText("140 kg × 5")).toHaveLength(2);
    expect(location.hash).toMatch(/^#\/history\//);
    const snap = await load();
    const start = snap.events.find((e) => e.type === "sessionStart" && e.source === "manual");
    expect(start).toBeDefined();
    expect(snap.events.filter((e) => e.type === "set" && e.exerciseId === "deadlift")).toHaveLength(2);
  });

  it("shows why a past workout can't be saved", async () => {
    await seed();
    const user = userEvent.setup();
    location.hash = "#/log";
    render(<Dashboard />);
    await screen.findByText(/Forgot to track a workout/);
    await user.selectOptions(screen.getByRole("combobox", { name: "Exercise" }), "Deadlift");
    await user.click(screen.getByRole("button", { name: "Add exercise" }));
    await user.type(screen.getByRole("spinbutton", { name: "Deadlift set 1 reps" }), "5");
    await user.clear(screen.getByLabelText("Length (minutes)"));
    await user.type(screen.getByLabelText("Length (minutes)"), "900");
    // Submit directly, past the browser's own form checks, to reach ours.
    fireEvent.submit(screen.getByRole("button", { name: "Save workout" }).closest("form")!);
    expect(await screen.findByRole("alert")).toHaveTextContent("Length must be 1 to 600 minutes.");
    expect((await load()).events.some((e) => e.type === "sessionStart" && e.source === "manual")).toBe(false);
  });

  it("makes a share link a friend can open, with the name only when ticked", async () => {
    await seed();
    const user = userEvent.setup();
    location.hash = "#/share";
    render(<Dashboard />);
    const input = (await screen.findByLabelText("Your link")) as HTMLInputElement;
    const frag = () => input.value.split("#")[1];
    expect(input.value).toContain("/share/#");
    expect(decodeShare(frag())?.n).toBeUndefined();
    await user.click(screen.getByRole("checkbox", { name: /Show my name/ }));
    const card = decodeShare(frag())!;
    expect(card).toMatchObject({ n: "Sam", w: 2 });

    cleanup();
    location.hash = `#${frag()}`;
    render(<SharedProfile />);
    expect(await screen.findByRole("heading", { name: "Sam" })).toBeInTheDocument();
    expect(screen.getByText("Barbell bench press")).toBeInTheDocument();
  });

  it("explains a broken share link", async () => {
    location.hash = "#broken";
    render(<SharedProfile />);
    expect(await screen.findByText("This link doesn’t work")).toBeInTheDocument();
  });

  it("shows Friends on the big screen: the feed with Discover beside the board, and other screens open in the app", async () => {
    await seed();
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
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
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
    location.hash = "#/friends";
    const u = userEvent.setup();
    render(<Dashboard />);
    expect(await screen.findByText("No workouts yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start a challenge" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Discover" }));
    expect(await screen.findByText("Leg day")).toBeInTheDocument();
    await u.click(screen.getAllByRole("button", { name: /Blair/ })[0]!);
    await vi.waitFor(() => expect(open).toHaveBeenCalledWith("/app/#/person/blair", "_self"));
    vi.unstubAllGlobals();
    useAccount.setState({ account: null });
    localStorage.removeItem(ACCOUNT_KEY);
  });
});
