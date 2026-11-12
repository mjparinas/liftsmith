// @vitest-environment jsdom
// The desktop layout (layout.ts, docs/decisions/desktop-layout.md): a sidebar instead of the tab bar on a
// wide window with a mouse on the web, the phone layout on phones, tablets and the native apps, and the
// workout as a focused panel with no sidebar.
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DESKTOP_QUERY, isDesktop } from "@/lib/layout";
import { useApp } from "@/lib/store";

import { App } from "./App";

vi.mock("canvas-confetti", () => ({ default: () => {} }));

let wide = true;
function fakeMatchMedia() {
  window.matchMedia = ((q: string) => ({
    matches: q === DESKTOP_QUERY ? wide : false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia;
}

beforeEach(async () => {
  wide = true;
  fakeMatchMedia();
  window.scrollTo = () => {};
  location.hash = "";
  await useApp.getState().reset();
  useApp.setState({ ready: false });
});
afterEach(() => {
  cleanup();
  delete (window as unknown as { Capacitor?: unknown }).Capacitor;
  delete document.documentElement.dataset.layout;
});

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

describe("isDesktop", () => {
  it("needs a wide window with a mouse, on the web", () => {
    expect(isDesktop()).toBe(true);
    wide = false;
    expect(isDesktop()).toBe(false);
  });

  it("is never on in the Android or iOS app, whatever the screen (tablets keep the phone layout)", () => {
    (window as unknown as { Capacitor: unknown }).Capacitor = { isNativePlatform: () => true };
    expect(isDesktop()).toBe(false);
  });
});

describe("desktop layout", () => {
  it("shows the five tabs down a sidebar, marks the page and takes no bottom room", async () => {
    const user = userEvent.setup();
    await onboard(user);
    expect(document.documentElement.dataset.layout).toBe("desktop");
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.className).toContain("w-60");
    expect(within(nav).getByText("Liftsmith")).toBeInTheDocument();
    for (const tab of ["Today", "Body", "Progress", "Friends", "Awards"])
      expect(within(nav).getByRole("button", { name: tab })).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Today" })).toHaveAttribute("aria-current", "page");
    // One navigation only: the sidebar is the tab bar, not a second one.
    expect(screen.getAllByRole("navigation", { name: "Main" })).toHaveLength(1);
    expect(document.documentElement.style.getPropertyValue("--nav-h")).toBe("0px");
    expect(document.documentElement.style.getPropertyValue("--side-w")).toBe("15rem");

    await user.click(within(nav).getByRole("button", { name: "Progress" }));
    expect(within(nav).getByRole("button", { name: "Progress" })).toHaveAttribute("aria-current", "page");
  });

  it("runs the workout as a focused panel with no sidebar", async () => {
    const user = userEvent.setup();
    await onboard(user);
    await user.click(screen.getByRole("button", { name: "Start workout" }));
    await screen.findByRole("button", { name: /Log (set|warm-up)/ });
    expect(screen.queryByRole("navigation", { name: "Main" })).toBeNull();
    // Keyboard: L logs the set, and the shortcuts are named under Log set.
    expect(screen.getByText(/Keyboard: L logs the set/)).toBeInTheDocument();
    const before = useApp.getState().events.length;
    await user.keyboard("l");
    expect(useApp.getState().events.length).toBe(before + 1);
    expect(document.querySelector("main")?.className).toContain("max-w-lg");
    expect(document.documentElement.style.getPropertyValue("--side-w")).toBe("");
  });

  it("keeps the phone tab bar on a narrow window", async () => {
    wide = false;
    const user = userEvent.setup();
    await onboard(user);
    await act(async () => {});
    expect(document.documentElement.dataset.layout).toBeUndefined();
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.className).toContain("bottom-0");
    expect(within(nav).queryByText("Liftsmith")).toBeNull();
  });
});
