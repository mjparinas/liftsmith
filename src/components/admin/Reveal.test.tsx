// @vitest-environment jsdom
// Clicking Open on a row far down Users or Installs opened the detail at the top of the tab, out of sight, so the
// link looked dead (2026-11-16). An opened account, install or message must come into view.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Installs } from "./Installs";
import { Reveal } from "./Reveal";
import { Users } from "./Users";

const scrolled = vi.fn();
function placeAt(top: number) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top } as DOMRect);
  vi.stubGlobal("scrollTo", scrolled);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  scrolled.mockReset();
});

describe("opening an account, install or message brings it into view", () => {
  it("scrolls up to an account opened from far down the Users tab, and focuses it", async () => {
    placeAt(-1500);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("?id=")
          ? new Response(null, { status: 404 })
          : Response.json({ accounts: [], totals: { total: 0, new30: 0, active30: 0 } }),
      ),
    );
    render(<Users admin me="owner@example.com" open="acct-aaaa-1111" setOpen={() => {}} />);
    const panel = await screen.findByRole("region", { name: "Open account" });
    expect(scrolled).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    expect(document.activeElement).toBe(panel);
  });

  it("scrolls up to an install opened from far down the Installs tab", async () => {
    placeAt(-2000);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("?id=") ? new Response(null, { status: 404 }) : Response.json({ installs: [], total: 0, countries: [] }),
      ),
    );
    render(<Installs admin open="87476f4d-6400-4000-8000-000000000000" setOpen={() => {}} />);
    await screen.findByRole("region", { name: "Open install" });
    expect(scrolled).toHaveBeenCalledTimes(1);
  });

  it("scrolls down to something opened below the window, and leaves the page be when it's already on screen", () => {
    placeAt(5000);
    const { unmount } = render(<Reveal label="x">a</Reveal>);
    expect(scrolled).toHaveBeenCalledTimes(1);
    unmount();
    placeAt(200);
    render(<Reveal label="y">b</Reveal>);
    expect(scrolled).toHaveBeenCalledTimes(1);
  });

  it("wraps every detail the admin opens by id in Reveal", () => {
    const read = (f: string) => readFileSync(join(__dirname, f), "utf8");
    expect(read("Users.tsx")).toMatch(/<Reveal key=\{open\}[^>]*>\s*<Account /);
    expect(read("Installs.tsx")).toMatch(/<Reveal key=\{open\}[^>]*>\s*<InstallDetail /);
    expect(read("Inbox.tsx")).toMatch(/<Reveal key=\{open\}[^>]*>\s*<Message/);
  });
});
