// @vitest-environment jsdom
// Check-in forms (2026-11-17, docs/decisions/trainer-mode.md "Check-in forms and questionnaires"): a client answers a
// body weight question from their last weigh-in (saved as a weigh-in too) and a photo question (sent on its own first),
// and the coach sees each question's trend and the photo.
import "fake-indexeddb/auto";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccount } from "@/lib/auth";
import type { Checkin, Form } from "@/lib/checkins";
import { useApp } from "@/lib/store";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";
import type { BodyweightEvent } from "@/lib/types";

import { CheckinScreen, ClientCheckins } from "./CoachCheckins";

vi.mock("canvas-confetti", () => ({ default: () => {} }));
vi.mock("@/lib/feedback", () => ({ shrinkImage: async () => "data:image/jpeg;base64,/9j/AAAA" }));

const NOW = Date.now();
const DAY = 86_400_000;
const QS: Checkin["questions"] = [
  { id: "kg", kind: "weight", label: "Weight this morning" },
  { id: "front", kind: "photo", label: "From the front" },
  { id: "energy", kind: "scale", label: "Energy" },
];
const calls: { url: string; body: Record<string, unknown> | undefined }[] = [];
const ci = (x: Partial<Checkin>): Checkin => ({
  id: "c1",
  coachId: "k1",
  clientId: "me",
  formId: "p1",
  title: "Progress check-in",
  questions: QS,
  sentAt: NOW - DAY,
  answers: null,
  answeredAt: null,
  ...x,
});
const weighIns = () => useApp.getState().events.filter((e): e is BodyweightEvent => e.type === "bodyweight");

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  localStorage.clear();
  calls.length = 0;
  await useApp.getState().reset();
  useApp.getState().setProfile({ onboarded: true, bodyweight: 80, unit: "kg", goal: "strength" });
  const account = { token: "tok", id: "me", email: "me@example.com", providers: ["email"], via: "email" as const };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  useAccount.setState({ account });
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    const body = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : undefined;
    calls.push({ url, body });
    if (url.startsWith("/api/coach/?checkin=")) return Response.json({ checkin: ci({}) });
    if (url.startsWith("/api/coach/photo/?")) return Response.json({ photo: "data:image/jpeg;base64,/9j/BBBB" });
    if (body?.action === "answer") return Response.json({ checkin: ci({ answers: body.answers as Checkin["answers"], answeredAt: NOW }) });
    return Response.json({ ok: true });
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("a client answering", () => {
  it("starts the weight from their last weigh-in, sends the photo first, and logs the new weight", async () => {
    const u = userEvent.setup();
    render(<CheckinScreen id="c1" />);
    const box = await screen.findByLabelText("Weight this morning (kg)");
    expect(box).toHaveValue("80");
    await u.click(screen.getByRole("button", { name: "Less Weight this morning (kg)" }));
    await u.upload(screen.getByLabelText("Add a photo"), new File(["x"], "me.jpg", { type: "image/jpeg" }));
    expect(await screen.findByRole("img", { name: "Your photo for: From the front" })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "3", pressed: false }));
    await u.click(screen.getByRole("button", { name: "Send answers" }));
    expect(await screen.findByText(/Thanks!/)).toBeInTheDocument();
    const photo = calls.findIndex((c) => c.url === "/api/coach/photo/");
    const answer = calls.findIndex((c) => c.body?.action === "answer");
    expect(photo).toBeGreaterThan(-1);
    expect(photo).toBeLessThan(answer);
    expect(calls[photo]?.body).toMatchObject({ id: "c1", q: "front" });
    expect(calls[answer]?.body?.answers).toMatchObject({ kg: 79.9, front: true, energy: 3 });
    expect(weighIns().map((e) => e.kg)).toEqual([79.9]);
  });

  it("leaves the weigh-ins alone when the switch is off", async () => {
    const u = userEvent.setup();
    render(<CheckinScreen id="c1" />);
    await screen.findByLabelText("Weight this morning (kg)");
    await u.click(screen.getByRole("button", { name: "More Weight this morning (kg)" }));
    await u.click(screen.getByRole("switch", { name: "Also save it as today's weigh-in" }));
    await u.click(screen.getByRole("button", { name: "Send answers" }));
    await screen.findByText(/Thanks!/);
    expect(calls.find((c) => c.body?.action === "answer")?.body?.answers).toMatchObject({ kg: 80.1 });
    expect(weighIns()).toEqual([]);
  });
});

describe("the coach's report", () => {
  const form: Form = { id: "p1", title: "Progress check-in", questions: QS, at: NOW };
  const week = (i: number, kg: number, energy: number) =>
    ci({ id: `c${i}`, sentAt: NOW - (5 - i) * 7 * DAY, answeredAt: NOW - (5 - i) * 7 * DAY + 1, answers: { kg, front: i === 3, energy } });

  it("shows each question's trend, repeats every two weeks, and loads a photo answer", async () => {
    const u = userEvent.setup();
    render(
      <ClientCheckins
        clientId="cl"
        forms={[form]}
        checkins={[week(3, 79, 4), week(2, 80, 3), week(1, 81.5, 3)]}
        repeat={{ formId: "p1", nextAt: NOW + 3 * DAY, every: 14 }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText("79 kg, down 2.5 kg")).toBeInTheDocument();
    expect(screen.getByText("4 of 5, up 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Every 2 weeks", pressed: true })).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Every 4 weeks" }));
    expect(calls.find((c) => c.body?.action === "repeatForm")?.body).toMatchObject({ client: "cl", id: "p1", every: 28 });
    await u.click(screen.getAllByRole("button", { name: /Progress check-in.*Answered/ })[0]!);
    expect(await screen.findByRole("img", { name: "Photo answer: From the front" })).toBeInTheDocument();
  });

  it("says photo questions are left out for a client under 18", () => {
    render(<ClientCheckins clientId="cl" forms={[form]} checkins={[]} repeat={null} teen onChange={() => {}} />);
    expect(screen.getByText("This client is under 18, so photo questions are left out.")).toBeInTheDocument();
  });
});
