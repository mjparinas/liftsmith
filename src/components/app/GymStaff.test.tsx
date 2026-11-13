// @vitest-environment jsdom
import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { encodeRoutine } from "@/lib/routineShare";
import { useApp } from "@/lib/store";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";

import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

// Staff accounts and the starter program (docs/decisions/gyms.md "Staff and the starter program").
const STARTER = encodeRoutine({ name: "Iron Works starter", items: [{ exerciseId: "goblet-squat", sets: 3 }] });
const PLACE = {
  id: "fedcba9876543210",
  citySlug: "langley-bc",
  slug: "iron-works",
  name: "Iron Works",
  kind: "gym",
  address: "",
  city: "Langley",
  region: "BC",
  lat: 49.1,
  lon: -122.6,
  km: 0,
  hours: "",
  website: "https://www.ironworks.ca",
  phone: "",
  official: true,
  lifters: 0,
  code: "",
  source: "osm",
  starter: STARTER,
};
const OWNED = {
  id: PLACE.id,
  name: PLACE.name,
  citySlug: PLACE.citySlug,
  slug: PLACE.slug,
  hours: "",
  website: PLACE.website,
  phone: "",
  description: "",
  code: "",
  address: "1 Iron Way\nLangley BC",
  lifters: 24,
  newLifters: 5,
  scans: 12,
  scans30: 7,
  club: "",
  logo: "",
  photos: [],
  role: "staff",
  starter: STARTER,
};
const ops: Record<string, unknown>[] = [];
let claimed = false;

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  location.hash = "";
  ops.length = 0;
  claimed = false;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
      if (url === `/api/gyms/?place=${PLACE.id}`) return Response.json({ place: PLACE });
      if (url !== "/api/gyms/") return Response.json({}, { status: 404 });
      ops.push(body);
      switch (body.op) {
        case "staffPreview":
          return body.code === "ABCDEFGHJK"
            ? Response.json({ place: PLACE.id, name: PLACE.name })
            : Response.json({ error: "gone" }, { status: 404 });
        case "staffJoin":
          claimed = true;
          return Response.json({ place: PLACE.id, name: PLACE.name });
        case "staff":
          return Response.json({ staff: [{ id: "abc", name: "Sam", at: 0, me: true }], invites: [] });
        case "posterStatus":
          return Response.json({ order: null });
        case "gymClub":
          return Response.json({ error: "notJoined" }, { status: 403 });
        case "owned":
          return Response.json({ gyms: claimed ? [OWNED] : [] });
        default:
          return Response.json({ ok: true });
      }
    }),
  );
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.removeItem(ACCOUNT_KEY);
});

const signIn = () =>
  localStorage.setItem(
    ACCOUNT_KEY,
    JSON.stringify({ token: "tok", id: "acc-sam", email: "sam@example.com", providers: ["email"], via: "email" }),
  );

async function onboard(user: ReturnType<typeof userEvent.setup>) {
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
}

describe("gym staff", () => {
  it("asks a signed-out lifter to sign in before joining", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/gymstaff/ABCDEFGHJK";
    expect(await screen.findByText("Sign in to join")).toBeInTheDocument();
  });

  it("joins from the invite link and manages the page without the owner's controls", async () => {
    signIn();
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/gymstaff/ABCDEFGHJK";
    expect(await screen.findByText(/help keep Iron Works’s page up to date/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Your name, as the owner will see it"), "Sam");
    await user.click(screen.getByRole("button", { name: "Join as staff" }));
    expect(ops.find((o) => o.op === "staffJoin")).toMatchObject({ code: "ABCDEFGHJK", name: "Sam" });
    // The owner's page opens, as staff: the starter program and the staff list, but no letting the gym go.
    expect(await screen.findByText("You help manage this gym’s page. The owner invites and removes staff.")).toBeInTheDocument();
    expect(screen.getAllByText("3 × Goblet squat").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Stop managing this gym" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Invite someone" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop helping with this gym" })).toBeInTheDocument();
  });

  it("says when an invite was used or ran out", async () => {
    signIn();
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/gymstaff/ZZZZZZZZZZ";
    expect(await screen.findByText("This invite was used or has run out")).toBeInTheDocument();
  });
});

describe("the starter program", () => {
  it("shows on the gym's page and opens the routine's Save screen", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = `#/gymplace/${PLACE.id}`;
    expect(await screen.findByText("Iron Works starter")).toBeInTheDocument();
    expect(screen.getByText("3 × Goblet squat")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save the starter program" }));
    expect(location.hash).toBe(`#/routine/${STARTER}`);
  });
});
