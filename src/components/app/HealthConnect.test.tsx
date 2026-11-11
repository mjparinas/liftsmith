// @vitest-environment jsdom
// The health twin's connect button (Body › Health, a tile's sheet). Health Connect answers at once, with no sheet,
// when Liftsmith already has the permission or after the lifter said no twice, and the old button showed its
// result behind the sheet, so tapping it looked like nothing happened. It now says what came of it, in the sheet:
// allowed but no data (with what records it), not allowed (with Health Connect's settings), or not on the phone.
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useApp } from "@/lib/store";

import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

const h = vi.hoisted(() => ({
  available: true,
  readAuthorized: [] as string[],
  requests: 0,
  opened: 0,
}));
vi.mock("@capgo/capacitor-health", () => ({
  Health: {
    isAvailable: async () => ({ available: h.available }),
    requestAuthorization: async () => {
      h.requests++;
      return { readAuthorized: h.readAuthorized, readDenied: [], writeAuthorized: [], writeDenied: [] };
    },
    checkAuthorization: async () => ({ readAuthorized: h.readAuthorized, readDenied: [], writeAuthorized: [], writeDenied: [] }),
    readSamples: async () => ({ samples: [] }),
    queryAggregated: async () => ({ samples: [] }),
    openHealthConnectSettings: async () => undefined,
  },
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: () => "android", isNativePlatform: () => true },
  registerPlugin: () => new Proxy({}, { get: () => async () => ({}) }),
}));

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
  Object.assign(h, { available: true, readAuthorized: [], requests: 0, opened: 0 });
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(() => {
  cleanup();
  delete (window as unknown as { Capacitor?: unknown }).Capacitor;
});

/** Sets up on the web, then becomes the Android app and opens Body › Health. */
async function openTile(user: ReturnType<typeof userEvent.setup>, id: string) {
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: /Commercial gym/ }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
  (window as unknown as { Capacitor: unknown }).Capacitor = {
    isNativePlatform: () => true,
    getPlatform: () => "android",
    Plugins: {
      HealthWorkout: {
        status: async () => ({ granted: false }),
        request: async () => ({ granted: false }),
        openPermissions: async () => {
          h.opened++;
          return { opened: true };
        },
      },
    },
  };
  await act(async () => {
    location.hash = "#/recovery";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  await user.click(await screen.findByTestId("body-health"));
  await user.click(await screen.findByTestId(`twin-${id}`));
  return screen.findByRole("dialog");
}

describe("connecting Health from a tile", () => {
  it("allowed but no HRV in Health Connect: says so in the sheet and suggests an Oura ring", async () => {
    h.readAuthorized = ["heartRateVariability", "vo2Max", "weight"];
    const user = userEvent.setup();
    const sheet = await openTile(user, "hrv");
    await user.click(within(sheet).getByRole("button", { name: "Connect Health Connect" }));
    const empty = await within(sheet).findByTestId("twin-empty");
    expect(h.requests).toBe(1);
    expect(empty).toHaveTextContent("No heart rate variability in Health Connect yet");
    expect(empty).toHaveTextContent("Oura app");
    expect(empty).toHaveTextContent("Settings › Health Connect");
    await user.click(within(empty).getByRole("button", { name: "Change permissions" }));
    expect(h.opened).toBe(1);
  });

  it("allowed but no VO2 max: names a watch that estimates it, and that Oura's stays in its app", async () => {
    h.readAuthorized = ["heartRateVariability", "vo2Max"];
    const user = userEvent.setup();
    const sheet = await openTile(user, "vo2max");
    await user.click(within(sheet).getByRole("button", { name: "Connect Health Connect" }));
    const empty = await within(sheet).findByTestId("twin-empty");
    expect(empty).toHaveTextContent("No VO₂ max in Health Connect yet");
    expect(empty).toHaveTextContent("watch that estimates it");
    expect(empty).toHaveTextContent("Cardio Capacity stays in the Oura app");
  });

  it("HRV not allowed (Health Connect stopped asking): points to its settings", async () => {
    h.readAuthorized = ["weight"];
    const user = userEvent.setup();
    const sheet = await openTile(user, "hrv");
    await user.click(within(sheet).getByRole("button", { name: "Connect Health Connect" }));
    expect(await within(sheet).findByRole("status")).toHaveTextContent("isn't allowed to read heart rate variability yet");
    await user.click(within(sheet).getByRole("button", { name: "Change permissions" }));
    expect(h.opened).toBe(1);
  });

  it("Health Connect not installed: offers Google Play", async () => {
    const user = userEvent.setup();
    const sheet = await openTile(user, "vo2max");
    h.available = false;
    await user.click(within(sheet).getByRole("button", { name: "Connect Health Connect" }));
    expect(await within(sheet).findByRole("status")).toHaveTextContent("Get it from Google Play");
    expect(h.requests).toBe(0);
    await user.click(within(sheet).getByRole("button", { name: "Get Health Connect" }));
    expect(h.opened).toBe(1);
  });
});
