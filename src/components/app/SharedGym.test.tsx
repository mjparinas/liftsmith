// @vitest-environment jsdom
// Sharing gyms (Melvin, 2026-11-12): share a gym's setup as a link, open it, preview it and add it
// to your own gyms, through the real store and IndexedDB.
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeGym } from "@/lib/defaults";
import { decodeGym, encodeGym, kitOf } from "@/lib/gymShare";
import { useApp } from "@/lib/store";

import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = () => {};
  location.hash = "";
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(cleanup);

async function onboard(user: ReturnType<typeof userEvent.setup>, gym = /Commercial gym/) {
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Get started" }));
  await screen.findByText("What are you training for?");
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: gym }));
  for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Save" }));
  await screen.findByText("Today's workout");
}

const GARAGE = encodeGym({ ...kitOf(makeGym("home", "lb", "x")), name: "Sam's garage" });

describe("shared gyms", () => {
  it("previews a shared gym, adds it and trains there", async () => {
    const user = userEvent.setup();
    await onboard(user);
    const before = useApp.getState().gyms.length;
    location.hash = `#/gymlink/${GARAGE}`;
    expect(await screen.findByText("Shared gym")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sam's garage" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add this gym" }));
    const gyms = useApp.getState().gyms;
    expect(gyms).toHaveLength(before + 1);
    const added = gyms.at(-1)!;
    expect(added).toMatchObject({ name: "Sam's garage", unit: "lb" });
    expect(added.place).toBeUndefined();
    expect(screen.getByText("Added to your gyms.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Train here" }));
    expect(await screen.findByText("Today's workout")).toBeInTheDocument();
    expect(useApp.getState().profile.activeGymId).toBe(added.id);
  });

  it("doesn't add the same setup twice", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = `#/gymlink/${GARAGE}`;
    await user.click(await screen.findByRole("button", { name: "Add this gym" }));
    const count = useApp.getState().gyms.length;
    location.hash = "#/today";
    await screen.findByText("Today's workout");
    location.hash = `#/gymlink/${GARAGE}`;
    expect(await screen.findByText("You already have this setup as Sam's garage.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add this gym" })).toBeNull();
    expect(useApp.getState().gyms).toHaveLength(count);
  });

  it("says so when a gym link is broken", async () => {
    const user = userEvent.setup();
    await onboard(user);
    location.hash = "#/gymlink/garbage";
    expect(await screen.findByText("That gym link didn’t open")).toBeInTheDocument();
  });

  it("shares the gym from Gyms and opens one pasted into Add a gym", async () => {
    const user = userEvent.setup();
    await onboard(user);
    const share = vi.fn(async () => {});
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    location.hash = "#/gym";
    await user.click(await screen.findByRole("button", { name: "Share this gym" }));
    expect(share).toHaveBeenCalledTimes(1);
    const url = (share.mock.calls[0] as unknown as [{ url: string }])[0].url;
    expect(url).toContain("/app/#/gymlink/");
    const gym = useApp.getState().gyms[0]!;
    expect(decodeGym(url.split("#/gymlink/")[1]!)!.equipment).toEqual(gym.equipment);
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });

    await user.click(screen.getByRole("button", { name: "+ Add gym" }));
    const sheet = within(screen.getByRole("dialog"));
    await user.type(sheet.getByLabelText("Or open a gym link someone sent you"), "nonsense");
    await user.click(sheet.getByRole("button", { name: "Open" }));
    expect(sheet.getByRole("alert")).toHaveTextContent("That isn’t a gym link.");
    await user.clear(sheet.getByLabelText("Or open a gym link someone sent you"));
    await user.click(sheet.getByLabelText("Or open a gym link someone sent you"));
    await user.paste(`https://www.getliftsmith.com/app/#/gymlink/${GARAGE}`);
    await user.click(sheet.getByRole("button", { name: "Open" }));
    expect(await screen.findByRole("heading", { name: "Sam's garage" })).toBeInTheDocument();
  });
});
