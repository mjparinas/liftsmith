// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { forgetAccount, useAccount } from "@/lib/auth";
import { setBillingLive } from "@/lib/billing";
import { useApp } from "@/lib/store";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";
import { makeWorkout, NOW } from "@/test/factories";

import { CoachNoteToday, Trainer } from "./Trainer";

const calls: { url: string; body: unknown; auth?: string }[] = [];
let linked = false;
// Whether this account coaches (an invite out and a client). Client-side tests turn it off: a client sees only their coach.
let coaching = true;
const asClient = () => {
  linked = true;
  coaching = false;
};
let assigned: unknown[] = [];
let note: unknown = null;
let shared: unknown = null;
const FORM = {
  id: "f1",
  title: "Weekly check-in",
  questions: [
    { id: "sleep", kind: "scale", label: "How well did you sleep this week?" },
    { id: "gym", kind: "yesno", label: "Do you train at a gym?" },
    { id: "weight", kind: "number", label: "Your weight this morning" },
    { id: "wins", kind: "text", label: "What went well?" },
  ],
  at: NOW,
};
const CHECKIN = {
  ...FORM,
  id: "ci1",
  coachId: "k1",
  clientId: "me",
  formId: "f1",
  sentAt: NOW - 4 * 86_400_000,
  answers: null,
  answeredAt: null,
};
let answered: unknown[] = [];
let trainer = false;
let payOn = false;
const SLOT = { id: "s1", coachId: "k1", start: NOW + 2 * 86_400_000, minutes: 60, place: "Main gym", clientId: null, bookedAt: null };
let mySessions: { booked: unknown[]; open: unknown[] } = { booked: [], open: [] };
const CODE = "r1~UHVzaA~bench-press.4~lateral-raise.3";

beforeEach(() => {
  localStorage.clear();
  calls.length = 0;
  linked = false;
  coaching = true;
  assigned = [];
  note = null;
  shared = null;
  answered = [];
  trainer = false;
  payOn = false;
  mySessions = { booked: [], open: [] };
  const account = { token: "tok", id: "me", email: "me@example.com", providers: ["email"], via: "email" as const };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  useAccount.setState({ account });
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, body, auth: (init.headers as Record<string, string>)?.Authorization });
    if (url === "/api/coach/?client=c1")
      return Response.json({
        name: "Alex",
        daysPerWeek: 3,
        events: makeWorkout("w1", NOW - 3600_000, [{}, { exerciseId: "custom-sled" }]),
        plans: assigned,
        note,
        body: shared,
        forms: [FORM],
        checkins: answered,
        repeat: null,
        pay: payOn
          ? {
              account: { ready: true, currency: "cad" },
              price: null,
              sub: { status: "past_due", until: null, ending: false },
              payments: [],
            }
          : null,
      });
    if (url === "/api/coach/?checkin=ci1") return Response.json({ checkin: CHECKIN });
    if (url === "/api/coach/?chat=k1")
      return Response.json({
        name: "Sam",
        them: "coach",
        more: false,
        messages: [{ id: "m1", from: "k1", text: "How did squats feel?", at: NOW }],
      });
    if (url === "/api/coach/?chat=c1") return Response.json({ name: "Alex", them: "client", more: false, messages: [] });
    if (url === "/api/coach/" && !body)
      return Response.json({
        invite: coaching ? { code: "ABCD2345", expiresAt: NOW + 7 * 86_400_000 } : null,
        clients: coaching ? [{ id: "c1", name: "Alex", since: NOW }] : [],
        coaches: linked ? [{ id: "k1", name: "Sam", since: NOW, ...(trainer ? { role: "trainer" } : {}) }] : [],
        plans: linked ? [{ id: "p1", coachId: "k1", clientId: "me", name: "Push day", code: CODE, at: NOW }] : [],
        notes: linked ? [{ coachId: "k1", clientId: "me", text: "Deload this week.\nSleep more.", at: NOW }] : [],
        setup: { days: 3 },
        targets: linked ? [{ coachId: "k1", clientId: "me", kcal: 2400, protein: 160, at: NOW }] : [],
        forms: [FORM],
        checkins: linked ? [CHECKIN] : [],
        slots: coaching ? [{ ...SLOT, coachId: "me", id: "s0", clientId: "c1" }] : [],
        sessions: mySessions,
        pay: payOn
          ? {
              account: { ready: true, currency: "cad" },
              prices: linked ? [{ coachId: "k1", clientId: "me", amount: 60, currency: "cad", kind: "session", at: NOW, sub: null }] : [],
            }
          : null,
      });
    if (body?.action === "price")
      return Response.json({
        price: { coachId: "me", clientId: body.client, amount: body.amount, currency: "cad", kind: body.kind, at: NOW },
      });
    if (body?.action === "payCheckout") return Response.json({ url: "https://checkout.stripe.com/c/x" });
    if (body?.action === "slots") return Response.json({ slots: [{ ...SLOT, start: body.slot.start, coachId: "me" }] });
    if (body?.action === "book") return Response.json({ slot: { ...SLOT, clientId: "me", bookedAt: NOW } });
    if (body?.action === "cancelSlot") return Response.json({ ok: true });
    if (body?.action === "sendForm") return Response.json({ checkin: { ...CHECKIN, clientId: body.client, coachId: "me" } });
    if (body?.action === "repeatForm") return Response.json({ repeat: body.id ? { formId: body.id, nextAt: NOW + 7 * 86_400_000 } : null });
    if (body?.action === "role") return Response.json({ role: body.role });
    if (body?.action === "form") return Response.json({ form: { ...body.form, id: "f2", at: NOW } });
    if (body?.action === "answer") return Response.json({ checkin: { ...CHECKIN, answers: body.answers, answeredAt: NOW } });
    if (body?.action === "preview") return Response.json({ coach: { id: "k1", name: "Sam", since: NOW } });
    if (body?.action === "join") {
      asClient();
      return Response.json({ coach: { id: "k1", name: "Sam", since: NOW } });
    }
    if (body?.action === "send") return Response.json({ message: { id: "m2", from: "me", text: body.text, at: NOW + 1 } });
    if (body?.action === "share") return Response.json({ on: body.on });
    if (body?.action === "targets")
      return Response.json({ targets: { coachId: "me", clientId: body.client, kcal: body.kcal, protein: body.protein, at: NOW } });
    if (body?.action === "setup") return Response.json({ setup: body.setup });
    if (body?.action === "note") {
      note = body.text ? { coachId: "me", clientId: body.client, text: body.text, at: NOW } : null;
      return Response.json({ note });
    }
    if (body?.action === "assign") {
      const plan = { id: "p9", coachId: "me", clientId: body.client, name: body.name, code: body.code, at: NOW - 86_400_000 };
      assigned = [plan];
      return Response.json({ plan });
    }
    return Response.json({ ok: true });
  });
});
afterEach(() => {
  cleanup();
  setBillingLive(false);
  vi.unstubAllGlobals();
  forgetAccount();
});

describe("trainer mode", () => {
  it("asks to sign in first", () => {
    useAccount.setState({ account: null });
    render(<Trainer />);
    expect(screen.getByText("Sign in to use coaching")).toBeInTheDocument();
  });

  it("a client checks a code, sees what the coach will see, and agrees", async () => {
    coaching = false;
    const u = userEvent.setup();
    render(<Trainer />);
    await u.type(await screen.findByLabelText(/Got a code from your coach/), "abcd-2345");
    await u.click(screen.getByRole("button", { name: "Check code" }));
    expect(await screen.findByText("Share your workouts with Sam?")).toBeInTheDocument();
    expect(screen.getByText(/Everything else stays private/)).toBeInTheDocument();
    // Heart rate and notes start switched on, the rest off; the client turns off notes before agreeing.
    expect(screen.getByRole("switch", { name: /Share heart rate with Sam/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("switch", { name: /Share readiness and recovery with Sam/ })).toHaveAttribute("aria-checked", "false");
    await u.click(screen.getByRole("switch", { name: /Share workout notes with Sam/ }));
    // Looking links nothing.
    expect(calls.some((c) => (c.body as { action?: string } | undefined)?.action === "join")).toBe(false);
    await u.click(screen.getByRole("button", { name: "Share my workouts" }));
    expect(await screen.findByText("Done. Your coach can now see your workouts.")).toBeInTheDocument();
    expect(calls.find((c) => (c.body as { action?: string })?.action === "join")).toMatchObject({
      body: { code: "ABCD2345", shares: ["hr"] },
      auth: "Bearer tok",
    });
    expect(await screen.findByRole("button", { name: "Stop sharing with Sam" })).toBeInTheDocument();
    // The sharing lead names the coach (it showed a raw "{name}" before, 2026-11-13).
    expect(screen.getByText(/anything else you want Sam to see/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Message Sam" })).toBeInTheDocument();
  });

  it("an invite link fills in the code and shows whose it is", async () => {
    render(<Trainer arg="ABCD2345" />);
    expect(await screen.findByText("Share your workouts with Sam?")).toBeInTheDocument();
  });

  it("without Pro, coaching clients shows with a Pro tag and opens the paywall", async () => {
    setBillingLive(true, null, []);
    const u = userEvent.setup();
    render(<Trainer />);
    await u.click(await screen.findByRole("button", { name: /Coach clients/ }));
    expect(location.hash).toBe("#/pro/coaching");
    expect(screen.queryByText("ABCD-2345")).toBeNull();
  });

  it("a Pro coach sees their invite, their clients and a client's report", async () => {
    const { unmount } = render(<Trainer />);
    expect(await screen.findByText("ABCD-2345")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Alex/ })).toBeInTheDocument();
    unmount();
    render(<Trainer arg="c.c1" />);
    expect(await screen.findByRole("heading", { name: "Alex" })).toBeInTheDocument();
    expect(screen.getByText("Workouts per week")).toBeInTheDocument();
    expect(screen.getByText(/Their own exercise/)).toBeInTheDocument();
  });

  it("a client sees the routines their coach gave them, and one opens the routine to save", async () => {
    asClient();
    const u = userEvent.setup();
    render(<Trainer />);
    await u.click(await screen.findByRole("button", { name: "Open Push day" }));
    expect(location.hash).toBe(`#/routine/${CODE}`);
  });

  it("a coach picks what new clients start setup with", async () => {
    const u = userEvent.setup();
    render(<Trainer arg="setup" />);
    expect(await screen.findByText("New clients start with")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toHaveAttribute("aria-pressed", "true");
    await u.click(screen.getByRole("button", { name: "Get stronger" }));
    expect(calls.find((c) => (c.body as { action?: string })?.action === "setup")).toMatchObject({
      body: { setup: { days: 3, goal: "strength" } },
    });
    // Tapping the picked answer again leaves it to the client.
    await u.click(screen.getByRole("button", { name: "3" }));
    expect(calls.filter((c) => (c.body as { action?: string })?.action === "setup").at(-1)).toMatchObject({
      body: { setup: { goal: "strength" } },
    });
  });

  it("a coach leaves a client a note, and can clear it", async () => {
    const u = userEvent.setup();
    render(<Trainer arg="c.c1" />);
    await u.type(await screen.findByLabelText(/They see it at the top of Today/), "Add a set of rows.");
    await u.click(screen.getByRole("button", { name: "Save note" }));
    expect(await screen.findByText("Saved. It's at the top of their Today.")).toBeInTheDocument();
    expect(calls.find((c) => (c.body as { action?: string })?.action === "note")).toMatchObject({
      body: { client: "c1", text: "Add a set of rows." },
    });
    await u.click(await screen.findByRole("button", { name: "Clear note" }));
    expect(await screen.findByText("Note cleared.")).toBeInTheDocument();
  });

  it("a client sees their coach's note under Coaching and on Today until Got it", async () => {
    asClient();
    const u = userEvent.setup();
    const { unmount } = render(<Trainer />);
    expect(await screen.findByText(/Deload this week/)).toBeInTheDocument();
    unmount();
    render(<CoachNoteToday />);
    expect(screen.getByText(/Deload this week/)).toBeInTheDocument();
    expect(screen.getByText(/From Sam/)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByText(/Deload this week/)).toBeNull();
  });

  it("a coach assigns one of their saved routines to a client", async () => {
    useApp.getState().setProfile({
      routines: [{ id: "r1", name: "Push day", items: [{ exerciseId: "bench-press", sets: 4 }], createdAt: NOW, updatedAt: NOW }],
    });
    const u = userEvent.setup();
    render(<Trainer arg="c.c1" />);
    await u.click(await screen.findByRole("button", { name: "Assign a routine" }));
    await u.click(await screen.findByRole("button", { name: /Push day/ }));
    expect(await screen.findByText("Sent. It shows on their phone under Coaching.")).toBeInTheDocument();
    expect(calls.find((c) => (c.body as { action?: string })?.action === "assign")).toMatchObject({
      body: { client: "c1", name: "Push day", code: "r1~UHVzaCBkYXk~bench-press.4" },
    });
    expect(
      await screen.findByText(
        "Done 1 time · last " + new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(NOW - 3600_000 + 60_000),
      ),
    ).toBeInTheDocument();
  });
});

describe("pages for each side", () => {
  it("a client sees only their coach: Message first, no coach tools or school teams", async () => {
    asClient();
    render(<Trainer />);
    expect(await screen.findByRole("button", { name: "Message Sam" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your coach" })).toBeInTheDocument();
    expect(screen.getByText("Coached by Sam")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Coaching pages" })).toBeNull();
    expect(screen.queryByText("Your clients")).toBeNull();
    expect(screen.queryByText("School teams")).toBeNull();
    expect(screen.queryByText(/Coach a high school team/)).toBeNull();
    expect(screen.queryByText("ABCD-2345")).toBeNull();
    // What they share is theirs to choose, coach by coach.
    expect(screen.getByRole("heading", { name: "What Sam sees" })).toBeInTheDocument();
  });

  it("a coach gets a page per job as tabs, and a tab replaces the page", async () => {
    const u = userEvent.setup();
    render(<Trainer />);
    const nav = await screen.findByRole("navigation", { name: "Coaching pages" });
    for (const name of ["Clients", "Messages", "Schedule", "Check-ins", "Setup"])
      expect(within(nav).getByRole("button", { name })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Clients" })).toHaveAttribute("aria-current", "page");
    // Sessions, setup and the forms are on their own pages, not under the client list.
    expect(screen.queryByText("New clients start with")).toBeNull();
    expect(screen.queryByRole("button", { name: "Add times" })).toBeNull();
    await u.click(within(nav).getByRole("button", { name: "Messages" }));
    expect(location.hash).toBe("#/trainer/messages");
  });

  it("someone new to coaching picks a side first", async () => {
    coaching = false;
    render(<Trainer />);
    expect(await screen.findByText("How will you use coaching?")).toBeInTheDocument();
    expect(screen.getByText("I train with a coach")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I coach clients/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I coach a high school team/ })).toBeInTheDocument();
  });

  it("signed out, a coach's code waits through signing in or making an account", () => {
    useAccount.setState({ account: null });
    render(<Trainer arg="ABCD2345" />);
    expect(screen.getByText("Sign in to join your coach")).toBeInTheDocument();
    expect(screen.getByText(/ABCD-2345 is saved/)).toBeInTheDocument();
    expect(localStorage.getItem("liftsmith.coachInvite")).toBe("ABCD2345");
  });

  it("each side's empty chat speaks to them", async () => {
    render(<Trainer arg="m.c1" />);
    expect(await screen.findByText("No messages yet. Say hello, or ask Alex how training is going.")).toBeInTheDocument();
  });
});

describe("chat and body data", () => {
  it("a client reads their coach's message and replies", async () => {
    asClient();
    const u = userEvent.setup();
    render(<Trainer arg="m.k1" />);
    expect(await screen.findByText("How did squats feel?")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sam" })).toBeInTheDocument();
    await u.type(screen.getByLabelText("Write a message"), "Heavy but good");
    await u.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Heavy but good")).toBeInTheDocument();
    expect(calls.find((c) => (c.body as { action?: string })?.action === "send")).toMatchObject({
      body: { id: "k1", text: "Heavy but good" },
    });
  });

  it("body data stays private until the client turns sharing on for a coach", async () => {
    asClient();
    const u = userEvent.setup();
    render(<Trainer />);
    const sw = await screen.findByRole("switch", { name: /Share body data with Sam/ });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await u.click(sw);
    expect(calls.find((c) => (c.body as { action?: string })?.action === "share")).toMatchObject({ body: { id: "k1", on: true } });
  });

  it("a coach sees a sharing client's body data, and nothing when they don't share", async () => {
    const { unmount } = render(<Trainer arg="c.c1" />);
    expect(await screen.findByRole("heading", { name: "Alex" })).toBeInTheDocument();
    expect(screen.queryByText("Body fat")).toBeNull();
    unmount();
    shared = {
      sex: "female",
      heightCm: 168,
      weights: [
        { at: NOW - 20 * 86_400_000, kg: 70 },
        { at: NOW - 86_400_000, kg: 68.5, bodyFat: 24 },
      ],
      measures: [{ at: NOW - 86_400_000, site: "waist", cm: 74 }],
    };
    render(<Trainer arg="c.c1" />);
    expect(await screen.findByText("Body fat")).toBeInTheDocument();
    expect(screen.getByText("24%")).toBeInTheDocument();
    expect(screen.getByText("Waist")).toBeInTheDocument();
    expect(screen.getByText("Alex also shares body data with you.")).toBeInTheDocument();
  });

  it("a coach sees each thing a client shares, item by item, and is told when they're unwell", async () => {
    const base = fetch;
    const now = Date.now();
    vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
      if (url === "/api/coach/?client=c1") {
        const [start, set, end] = makeWorkout("w1", now - 3 * 3600_000, [{}]);
        return Response.json({
          name: "Alex",
          daysPerWeek: 3,
          plans: [],
          shares: ["hr", "notes", "health"],
          events: [
            start,
            set,
            { ...end, avgHr: 131.6, maxHr: 168 },
            { id: "n1", at: now - 3600_000, type: "sessionNote", sessionId: "w1", text: "Knees felt fine today" },
            { id: "f1", at: now - 1800_000, type: "feel", energy: -1, unwell: true },
            { id: "h1", at: now - 3600_000, type: "health", metric: "sleep", day: new Date(now).toISOString().slice(0, 10), value: 5.5 },
          ],
        });
      }
      return base(url, init);
    });
    render(<Trainer arg="c.c1" />);
    expect(await screen.findByText("Avg 132 bpm · max 168 bpm")).toBeInTheDocument();
    expect(screen.getByText("Knees felt fine today")).toBeInTheDocument();
    expect(screen.getByText("Feeling unwell")).toBeInTheDocument();
    expect(screen.getByText("Sleeping 5.5 h a night")).toBeInTheDocument();
    expect(screen.getByText("Sleep: 5.5 h a night")).toBeInTheDocument();
    expect(screen.getByText("Alex also shares heart rate, workout notes, and readiness and recovery with you.")).toBeInTheDocument();
  });

  it("a physio sees pain first and assigns a rehab program with times a week (physio support)", async () => {
    const base = fetch;
    vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
      if (url === "/api/coach/?client=c1") {
        calls.push({ url, body: undefined });
        return Response.json({
          name: "Alex",
          daysPerWeek: 3,
          role: "physio",
          pain: true,
          plans: assigned,
          events: [
            ...makeWorkout("w1", NOW - 3600_000, [{}]),
            // The report is worked out at the real time, so pain is dated from it.
            { id: "i1", at: Date.now() - 20 * 86_400_000, type: "injury", injuryId: "k", part: "knee" },
            { id: "p1", at: Date.now() - 3600_000, type: "pain", injuryId: "k", score: 6, sessionId: "w1", exerciseId: "wall-sit" },
          ],
        });
      }
      return base(url, init);
    });
    const u = userEvent.setup();
    render(<Trainer arg="c.c1" />);
    expect(await screen.findByText("Knee: pain 6/10 this week")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pain and injuries" })).toBeInTheDocument();
    expect(screen.getByText(/doesn't diagnose or treat anything/)).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Assign a routine" }));
    // A physio's sheet starts at 3 times a week, with rehab programs first.
    expect(screen.getByRole("button", { name: "3" })).toHaveAttribute("aria-pressed", "true");
    await u.click(screen.getByRole("button", { name: /Knee: gentle start/ }));
    const sent = calls.find((c) => (c.body as { action?: string } | undefined)?.action === "assign")!.body as Record<string, unknown>;
    expect(sent).toMatchObject({ client: "c1", name: "Knee: gentle start", perWeek: 3 });
    expect(String(sent.code).endsWith("~rehab")).toBe(true);
  });

  it("a client can share pain and injuries with each coach, off to start", async () => {
    asClient();
    const u = userEvent.setup();
    render(<Trainer />);
    const sw = await screen.findByRole("switch", { name: /Share pain and injuries with Sam/ });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await u.click(sw);
    expect(calls.find((c) => (c.body as { what?: string } | undefined)?.what === "pain")).toMatchObject({
      body: { action: "share", id: "k1", on: true, what: "pain" },
    });
  });
});

describe("nutrition targets", () => {
  it("a coach sets a client's daily calories and protein with the bumps", async () => {
    const u = userEvent.setup();
    render(<Trainer arg="c.c1" />);
    expect(await screen.findByText("Daily nutrition targets")).toBeInTheDocument();
    await u.type(screen.getByLabelText("Calories a day"), "2400");
    await u.type(screen.getByLabelText("Protein a day (g)"), "160");
    await u.click(screen.getByRole("button", { name: "Save targets" }));
    expect(await screen.findByText("Saved. They'll see these under Coaching.")).toBeInTheDocument();
    expect(calls.find((c) => (c.body as { action?: string })?.action === "targets")).toMatchObject({
      body: { client: "c1", kcal: 2400, protein: 160 },
    });
  });

  it("a client sees their coach's targets under Coaching", async () => {
    asClient();
    render(<Trainer />);
    expect(await screen.findByText("Daily targets from Sam")).toBeInTheDocument();
    expect(screen.getByText("2400 kcal · 160 g protein")).toBeInTheDocument();
  });
});

describe("check-ins", () => {
  it("a coach sends a form now and every week from a client's report", async () => {
    const u = userEvent.setup();
    render(<Trainer arg="c.c1" />);
    expect(await screen.findByText("Check-ins")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Send now" }));
    expect(await screen.findByText("Sent. They'll get a notification.")).toBeInTheDocument();
    expect(calls.find((c) => (c.body as { action?: string })?.action === "sendForm")).toMatchObject({ body: { client: "c1", id: "f1" } });
    await u.click(screen.getByRole("switch", { name: /Send this form every week/ }));
    expect(calls.find((c) => (c.body as { action?: string })?.action === "repeatForm")).toMatchObject({ body: { client: "c1", id: "f1" } });
  });

  it("a coach reads a client's answers, and a low score goes first", async () => {
    answered = [
      {
        ...CHECKIN,
        coachId: "me",
        clientId: "c1",
        answers: { sleep: 2, gym: true, weight: 81.5, wins: "Hit a squat best" },
        answeredAt: NOW - 86_400_000,
      },
    ];
    const u = userEvent.setup();
    render(<Trainer arg="c.c1" />);
    expect(await screen.findByText("Scored 2 of 5: How well did you sleep this week?")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: /Answered/ }));
    expect(await screen.findByText("Hit a squat best")).toBeInTheDocument();
    expect(screen.getByText("2 of 5")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("a coach makes a form from a template", async () => {
    const u = userEvent.setup();
    render(<Trainer arg="forms" />);
    expect(await screen.findByRole("button", { name: /Weekly check-in/ })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Intake questionnaire" }));
    expect(await screen.findByDisplayValue("What's your main goal?")).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Save form" }));
    expect(await screen.findByText("Form saved.")).toBeInTheDocument();
    const saved = calls.find((c) => (c.body as { action?: string })?.action === "form")?.body as {
      form: { title: string; questions: unknown[] };
    };
    expect(saved.form.title).toBe("Intake questionnaire");
    expect(saved.form.questions).toHaveLength(6);
  });

  it("a client answers a check-in with taps, and anything can be skipped", async () => {
    asClient();
    const u = userEvent.setup();
    render(<Trainer arg="f.ci1" />);
    expect(await screen.findByRole("heading", { name: "Weekly check-in" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "4" }));
    await u.click(screen.getByRole("button", { name: "Yes" }));
    await u.type(screen.getByLabelText("Your weight this morning"), "81.5");
    await u.click(screen.getByRole("button", { name: "Send answers" }));
    expect(await screen.findByText(/Thanks!/)).toBeInTheDocument();
    expect(calls.find((c) => (c.body as { action?: string })?.action === "answer")).toMatchObject({
      body: { id: "ci1", answers: { sleep: 4, gym: true, weight: 81.5 } },
    });
  });

  it("a waiting check-in shows under Coaching and on Today", async () => {
    asClient();
    const { unmount } = render(<Trainer />);
    expect(await screen.findByText("Check-in from Sam")).toBeInTheDocument();
    unmount();
    render(<CoachNoteToday />);
    expect(screen.getByText("Check-in from Sam")).toBeInTheDocument();
  });
});

describe("personal trainer or coach", () => {
  it("a coach picks how they work", async () => {
    const u = userEvent.setup();
    render(<Trainer arg="setup" />);
    await u.click(await screen.findByRole("button", { name: "Personal trainer" }));
    expect(calls.find((c) => (c.body as { action?: string })?.action === "role")).toMatchObject({ body: { role: "trainer" } });
    expect(screen.getByText(/One-on-one clients/)).toBeInTheDocument();
    // Physio is the third choice in the same picker (it used to be a picker of its own).
    expect(screen.getAllByRole("group", { name: "How you work" })).toHaveLength(1);
    await u.click(screen.getByRole("button", { name: "Physio" }));
    expect(calls.filter((c) => (c.body as { action?: string })?.action === "role").at(-1)).toMatchObject({ body: { role: "physio" } });
    expect(screen.getByText(/For physios and rehab clinicians/)).toBeInTheDocument();
    expect(screen.queryByText("I coach as")).not.toBeInTheDocument();
  });

  it("a client with a personal trainer sees the word trainer", async () => {
    asClient();
    trainer = true;
    render(<Trainer />);
    expect(await screen.findByText("Your trainer")).toBeInTheDocument();
    expect(screen.getByText("From your trainer")).toBeInTheDocument();
    expect(screen.getByText(/Personal trainer ·/)).toBeInTheDocument();
  });
});

describe("booking sessions", () => {
  it("a coach sees their next sessions and opens new times", async () => {
    const u = userEvent.setup();
    render(<Trainer arg="schedule" />);
    expect(await screen.findByText("Sessions")).toBeInTheDocument();
    expect(screen.getAllByText(/Main gym/).length).toBeGreaterThan(0);
    await u.click(screen.getByRole("button", { name: "Add times" }));
    await u.click(screen.getByRole("button", { name: "Tomorrow" }));
    await u.click(screen.getByRole("button", { name: "45 min" }));
    await u.click(screen.getByRole("button", { name: "Every week for 4 weeks" }));
    await u.click(screen.getByRole("button", { name: "Save times" }));
    const made = calls.find((c) => (c.body as { action?: string })?.action === "slots")?.body as {
      slot: { minutes: number; weeks: number; start: number; label: string };
    };
    expect(made.slot).toMatchObject({ minutes: 45, weeks: 4 });
    expect(new Date(made.slot.start).getHours()).toBe(18);
    expect(made.slot.label).toBeTruthy();
  });

  it("a coach books a client in from their report", async () => {
    const u = userEvent.setup();
    render(<Trainer arg="c.c1" />);
    await u.click(await screen.findByRole("button", { name: "Book Alex in" }));
    await u.click(screen.getByRole("button", { name: "Book it" }));
    expect(calls.find((c) => (c.body as { action?: string })?.action === "slots")).toMatchObject({ body: { slot: { client: "c1" } } });
  });

  it("a client books an open time with their coach", async () => {
    asClient();
    mySessions = { booked: [], open: [SLOT] };
    const u = userEvent.setup();
    render(<Trainer />);
    await u.click(await screen.findByRole("button", { name: "Book a session" }));
    await u.click(screen.getByRole("button", { name: /Main gym/ }));
    expect(calls.find((c) => (c.body as { action?: string })?.action === "book")).toMatchObject({ body: { id: "s1" } });
  });

  it("a client's booked session shows with Add to calendar and Cancel, and on Today", async () => {
    asClient();
    mySessions = { booked: [{ ...SLOT, clientId: "me", start: Date.now() + 3_600_000 }], open: [] };
    const u = userEvent.setup();
    const { unmount } = render(<Trainer />);
    expect(await screen.findByRole("button", { name: "Add to calendar" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Cancel" }));
    expect(calls.find((c) => (c.body as { action?: string })?.action === "cancelSlot")).toMatchObject({ body: { id: "s1" } });
    unmount();
    render(<CoachNoteToday />);
    expect(screen.getAllByText("Session with Sam").length).toBeGreaterThan(0);
  });
});

describe("client payments", () => {
  it("stay hidden until the server has Stripe Connect", async () => {
    const { unmount } = render(<Trainer />);
    expect(await screen.findByText("ABCD-2345")).toBeInTheDocument();
    expect(screen.queryByText("Payments")).toBeNull();
    unmount();
    // With Stripe Connect, payments get a page of their own.
    payOn = true;
    render(<Trainer />);
    expect(await screen.findByRole("button", { name: "Payments" })).toBeInTheDocument();
  });

  it("a coach sets a client's price, and a failed monthly payment goes first", async () => {
    payOn = true;
    const u = userEvent.setup();
    render(<Trainer arg="c.c1" />);
    expect(await screen.findByText("Monthly payment didn't go through")).toBeInTheDocument();
    await u.type(screen.getByLabelText("Price (CAD)"), "75");
    await u.click(screen.getByRole("button", { name: "Save price" }));
    expect(calls.find((c) => (c.body as { action?: string })?.action === "price")).toMatchObject({
      body: { client: "c1", amount: 75, kind: "session" },
    });
  });

  it("a client pays for a session on Stripe's page", async () => {
    payOn = true;
    asClient();
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const u = userEvent.setup();
    render(<Trainer />);
    await u.click(await screen.findByRole("button", { name: /Pay for a session/ }));
    expect(calls.find((c) => (c.body as { action?: string })?.action === "payCheckout")).toMatchObject({ body: { id: "k1" } });
    expect(open).toHaveBeenCalledWith("https://checkout.stripe.com/c/x", "_blank", "noopener");
  });
});
