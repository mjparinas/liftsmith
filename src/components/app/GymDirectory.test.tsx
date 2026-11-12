// @vitest-environment jsdom
// Finding a gym near you (docs/decisions/gym-sharing.md): the app sends a position rounded to about 1 km, shows
// the gyms listed nearby, and adding one counts toward the listing. Also: listing a gym needs an account, and
// setup can take a nearby gym instead of a preset. Network and location are faked; the store and IndexedDB are real.
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeGym } from "@/lib/defaults";
import { encodeGym, kitOf } from "@/lib/gymShare";
import { useApp } from "@/lib/store";

import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

const LISTED = {
  id: "0123456789abcdef",
  name: "Harbour Barbell",
  code: encodeGym({ ...kitOf(makeGym("home", "lb", "x")), name: "Harbour Barbell" }),
  unit: "lb",
  km: 1.5,
  adds: 4,
};
// Real gyms (gymPlaces.ts): one official with a setup, one nobody set up yet.
const PLACE = {
  id: "fedcba9876543210",
  citySlug: "langley-bc",
  slug: "steve-nash-fitness-world",
  name: "Steve Nash Fitness World",
  kind: "gym",
  address: "19925 Willowbrook Drive",
  city: "Langley",
  region: "BC",
  lat: 49.11734,
  lon: -122.67041,
  km: 0.8,
  hours: "",
  website: "",
  official: false,
  lifters: 3,
  code: "",
  source: "osm",
};
const OFFICIAL = {
  ...PLACE,
  id: "aaaaaaaaaaaaaaaa",
  slug: "planet-fitness",
  name: "Planet Fitness",
  official: true,
  code: encodeGym({ ...kitOf(makeGym("commercial", "kg", "y")), name: "PF" }),
};
const calls: { url: string; body: unknown }[] = [];

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  location.hash = "";
  calls.length = 0;
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (ok: PositionCallback) =>
        ok({ coords: { latitude: 49.28274, longitude: -123.12071, accuracy: 900 } } as GeolocationPosition),
    },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const body = init?.body ? (JSON.parse(String(init.body)) as unknown) : undefined;
      calls.push({ url, body });
      if (url.startsWith("/api/gyms/?")) return Response.json({ gyms: [LISTED], places: [OFFICIAL, PLACE] });
      if (url === "/api/gyms/") return Response.json({ ok: true });
      return Response.json({}, { status: 404 });
    }),
  );
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function onboard(user: ReturnType<typeof userEvent.setup>, pickNearby = false) {
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  if (pickNearby) {
    await user.click(screen.getByRole("button", { name: "Find gyms near you" }));
    await user.click(await screen.findByRole("button", { name: /Harbour Barbell/ }));
  } else await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
}

describe("gyms near you", () => {
  it("finds a listed gym from Add a gym, sends only a rounded position, and counts the add", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/gym";
    await user.click(await screen.findByRole("button", { name: "+ Add gym" }));
    const sheet = within(screen.getByRole("dialog"));
    await user.click(sheet.getByRole("button", { name: "Find gyms near you" }));
    const found = await sheet.findByRole("button", { name: /Harbour Barbell/ });
    expect(found).toHaveTextContent("1.5 km away");
    expect(found).toHaveTextContent("added by 4 lifters");
    expect(calls.find((c) => c.url.startsWith("/api/gyms/?"))!.url).toBe("/api/gyms/?lat=49.28&lon=-123.12");
    await user.click(found);
    await user.click(await screen.findByRole("button", { name: "Add this gym" }));
    expect(useApp.getState().gyms.at(-1)).toMatchObject({ name: "Harbour Barbell" });
    expect(calls.at(-1)!.body).toEqual({ op: "added", id: LISTED.id });

    // A listing can be reported from its preview.
    await user.click(screen.getByRole("button", { name: "Report this listing" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "It’s a home or private gym" }));
    expect(calls.at(-1)!.body).toEqual({ op: "report", id: LISTED.id, reason: "private" });
    expect(await screen.findByText("Thanks. We’ll take a look.")).toBeInTheDocument();
  });

  it("lists real gyms first, the official one with its mark, and adds one nobody set up as a typical gym", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/gym";
    await user.click(await screen.findByRole("button", { name: "+ Add gym" }));
    const sheet = within(screen.getByRole("dialog"));
    await user.click(sheet.getByRole("button", { name: "Find gyms near you" }));
    const buttons = (await sheet.findAllByRole("button", { pressed: false })).map((b) => b.textContent ?? "");
    expect(buttons[0]).toMatch(/^Planet Fitness\s*Official gym/);
    expect(buttons[0]).toContain("equipment set up");
    expect(buttons[1]).toContain("19925 Willowbrook Drive, Langley");
    expect(buttons[1]).toContain("3 lifters here");
    expect(sheet.getByText("Gym details © OpenStreetMap contributors")).toBeInTheDocument();
    await user.click(sheet.getByRole("button", { name: /Steve Nash/ }));
    expect(await screen.findByText(/Nobody has set up this gym’s equipment yet/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add this gym" }));
    expect(useApp.getState().gyms.at(-1)).toMatchObject({ name: "Steve Nash Fitness World", placeId: PLACE.id });
    expect(calls.at(-1)!.body).toEqual({ op: "added", place: PLACE.id });
  });

  it("takes a nearby gym in setup instead of a preset", async () => {
    const user = userEvent.setup();
    await onboard(user, true);
    const { gyms, profile } = useApp.getState();
    expect(gyms).toHaveLength(1);
    expect(gyms[0]).toMatchObject({ name: "Harbour Barbell", id: profile.activeGymId });
    expect(calls.some((c) => (c.body as { op?: string } | undefined)?.op === "added")).toBe(true);
  });

  it("asks a signed-out lifter to sign in before listing a gym", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/gym";
    expect(await screen.findByText(/Sign in to list this gym/)).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "List this gym nearby" })).toBeNull();
  });
});
