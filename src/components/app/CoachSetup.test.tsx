// @vitest-environment jsdom
// Trainer mode out of Labs (2026-11-12): a lifter who opens a coach's invite signs in, agrees, answers the gym and body
// questions, and is done; the coach's starting answers fill in the rest.
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { forgetAccount } from "@/lib/auth";
import {
  coachCode,
  coachFromReferrer,
  coachSignup,
  isCoachSignupHash,
  pendingCoach,
  playCoachSignupUrl,
  playCoachUrl,
} from "@/lib/coachInvite";
import { useApp } from "@/lib/store";

import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

type GisCallback = (r: { credential?: string }) => void;
let gis: GisCallback | null = null;
const calls: { url: string; body?: { action?: string; code?: string } }[] = [];

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  location.hash = "";
  localStorage.clear();
  forgetAccount();
  gis = null;
  calls.length = 0;
  document.head.appendChild(Object.assign(document.createElement("script"), { src: "https://accounts.google.com/gsi/client" }));
  window.google = {
    accounts: {
      id: {
        initialize: (o: Record<string, unknown>) => (gis = o.callback as GisCallback),
        renderButton: (el: HTMLElement) => {
          el.innerHTML = "<button type='button'>Continue with Google</button>";
        },
      },
    },
  };
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    const body = init.body ? (JSON.parse(String(init.body)) as { action?: string; code?: string }) : undefined;
    calls.push({ url, body });
    if (url === "/api/auth/google/")
      return Response.json({ token: "tok", account: { id: "acc", email: "me@example.com", providers: ["google"] } });
    // A brand-new account: nothing on it yet, so setup carries on.
    if (url === "/api/sync/") return Response.json({ cursor: 1, events: [], deleted: [], records: [], more: false });
    if (url === "/api/coach/" && (body?.action === "preview" || body?.action === "join"))
      return Response.json({ coach: { id: "k1", name: "Sam", since: 1 }, setup: { goal: "strength", experience: "new", days: 4 } });
    if (url === "/api/coach/") return Response.json({ invite: null, clients: [], coaches: [], plans: [], notes: [] });
    return Response.json({ error: "Not here" }, { status: 404 });
  });
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.querySelectorAll("script[src*='accounts.google.com']").forEach((s) => s.remove());
});

describe("a coach's invite on a new install", () => {
  it("signs in, agrees, asks only the gym and body questions, and keeps the coach's answers", async () => {
    location.hash = "#/trainer/ABCD2345";
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Train with your coach" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Sign in to start" }));
    await waitFor(() => expect(gis).not.toBeNull());
    gis!({ credential: "id-token" });
    expect(await screen.findByRole("heading", { name: "Sam invited you" })).toBeInTheDocument();
    expect(screen.getByText("Share your workouts with Sam?")).toBeInTheDocument();
    await u.type(screen.getByLabelText(/Your name/), "Alex");
    await u.click(screen.getByRole("button", { name: "Share my workouts" }));
    expect(calls.find((c) => c.body?.action === "join")?.body).toMatchObject({ code: "ABCD2345" });
    // The gym, then the days (already the coach's 4) and body weight, then done: no goal, reminders, saving or Pro steps.
    expect(await screen.findByRole("heading", { name: "Where do you train?" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("button", { name: "4" })).toHaveAttribute("aria-pressed", "true");
    await u.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(useApp.getState().profile.onboarded).toBe(true));
    const p = useApp.getState().profile;
    expect(p).toMatchObject({ name: "Alex", goal: "strength", experience: "new", daysPerWeek: 4 });
    expect(location.hash).toBe("#/today");
    expect(pendingCoach()).toBe("");
  });

  it("a code typed on the welcome screen starts the coach path too", async () => {
    const u = userEvent.setup();
    render(<App />);
    await u.click(await screen.findByRole("button", { name: "Got a code from a coach?" }));
    await u.type(screen.getByLabelText(/8-character code/), "abcd-2345");
    await u.click(screen.getByRole("button", { name: "Use code" }));
    expect(await screen.findByRole("heading", { name: "Train with your coach" })).toBeInTheDocument();
    expect(pendingCoach()).toBe("ABCD2345");
  });

  it("can still set up without the coach", async () => {
    location.hash = "#/trainer/ABCD2345";
    const u = userEvent.setup();
    render(<App />);
    await u.click(await screen.findByRole("button", { name: "Set up on my own instead" }));
    expect(await screen.findByRole("heading", { name: "What are you training for?" })).toBeInTheDocument();
  });
});

describe("a coach signing up from the coaches page", () => {
  it("signs in, sets up their own training without the save step, and lands on the coaching screen", async () => {
    location.hash = "#/trainer";
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Coach your clients" })).toBeInTheDocument();
    expect(coachSignup()).toBe(true);
    await u.click(screen.getByRole("button", { name: "Sign in to start" }));
    await waitFor(() => expect(gis).not.toBeNull());
    gis!({ credential: "id-token" });
    expect(await screen.findByRole("heading", { name: "What are you training for?" })).toBeInTheDocument();
    const steps = [];
    while (!useApp.getState().profile.onboarded) {
      steps.push(screen.getAllByRole("heading")[0]!.textContent);
      const next = screen.queryByRole("button", { name: "Continue" }) ?? screen.getByRole("button", { name: /Save|Finish|Done/ });
      await u.click(next);
      if (steps.length > 6) throw new Error(`stuck: ${steps.join(" / ")}`);
    }
    expect(steps.join(" / ")).not.toMatch(/Save your progress/i);
    // On the coach's pages, not the first page that asks which side they're on (coachMode.ts).
    await waitFor(() => expect(location.hash).toBe("#/trainer/clients"));
  });

  it("I'm here to train goes back to the usual welcome and forgets it", async () => {
    location.hash = "#/trainer";
    const u = userEvent.setup();
    render(<App />);
    await u.click(await screen.findByRole("button", { name: "I'm here to train" }));
    expect(await screen.findByRole("heading", { name: "What are you training for?" })).toBeInTheDocument();
    location.hash = "";
    expect(coachSignup()).toBe(false);
  });

  it("knows the coaches page's link and Play referrer", () => {
    expect(isCoachSignupHash("#/trainer")).toBe(true);
    expect(isCoachSignupHash("#/trainer/")).toBe(true);
    expect(isCoachSignupHash("#/trainer/ABCD2345")).toBe(false);
    expect(decodeURIComponent(playCoachSignupUrl())).toContain("referrer=utm_source=coaches");
  });
});

describe("coach codes", () => {
  it("come from a typed code, a pasted link or the Play install referrer", () => {
    expect(coachCode(" abcd-2345 ")).toBe("ABCD2345");
    expect(coachCode("https://www.getliftsmith.com/app/#/trainer/ABCD2345")).toBe("ABCD2345");
    expect(coachCode("ABCD-0000")).toBe("");
    expect(coachFromReferrer("utm_source=coach&utm_campaign=ABCD2345")).toBe("ABCD2345");
    expect(coachFromReferrer("utm_source=invite&utm_campaign=ABCD2345")).toBe("");
    expect(decodeURIComponent(playCoachUrl("ABCD2345"))).toContain("referrer=utm_source=coach&utm_campaign=ABCD2345");
  });
});
