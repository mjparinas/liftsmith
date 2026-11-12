// @vitest-environment jsdom
import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useApp } from "@/lib/store";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";

import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

// An unofficial gym with a website, so an address at its domain gets a code at once (src/server/gymClaims.ts).
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
  official: false,
  lifters: 0,
  code: "",
  source: "osm",
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
        case "claimStart":
          return Response.json({ claim: "c1", method: body.email === "maria@ironworks.ca" ? "email" : "review", devCode: "123456" });
        case "claimVerify":
          claimed = body.code === "123456";
          return claimed ? Response.json({ place: PLACE.id }) : Response.json({ error: "wrong" }, { status: 400 });
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
    JSON.stringify({ token: "tok", id: "acc-maria", email: "maria@ironworks.ca", providers: ["email"], via: "email" }),
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

describe("claiming a gym", () => {
  it("asks a signed-out lifter to sign in first", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = `#/gymclaim/${PLACE.id}`;
    expect(await screen.findByText("Sign in to claim this gym")).toBeInTheDocument();
  });

  it("claims with a code sent to the gym's own domain, then saves the gym's hours", async () => {
    signIn();
    const user = userEvent.setup();
    await onboard(user);
    location.hash = `#/gymclaim/${PLACE.id}`;
    expect(await screen.findByText(/An address at ironworks.ca gets a code right away/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Your name"), "Maria Lopez");
    await user.click(screen.getAllByRole("button", { name: "Claim this gym" }).at(-1)!);
    expect(await screen.findByText("We sent a six-digit code to maria@ironworks.ca.")).toBeInTheDocument();
    expect(ops.at(-1)).toMatchObject({
      op: "claimStart",
      place: PLACE.id,
      email: "maria@ironworks.ca",
      role: "owner",
      name: "Maria Lopez",
    });
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("Iron Works is official")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit the gym’s details" }));
    expect(await screen.findByRole("heading", { name: "Your gym’s page" })).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Open 24 hours, every day" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText(/^Saved/)).toBeInTheDocument();
    expect(ops.at(-1)).toMatchObject({ op: "edit", place: PLACE.id, hours: "24/7", website: "https://www.ironworks.ca" });
  });

  it("sends a claim from another address to our team", async () => {
    signIn();
    const user = userEvent.setup();
    await onboard(user);
    location.hash = `#/gymclaim/${PLACE.id}`;
    const email = await screen.findByLabelText("Work email");
    await user.clear(email);
    await user.type(email, "sam@gmail.com");
    await user.type(screen.getByLabelText("Your name"), "Sam");
    await user.click(screen.getAllByRole("button", { name: "Claim this gym" }).at(-1)!);
    expect(await screen.findByText("Thanks, we’ll check")).toBeInTheDocument();
  });
});
