// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminApp } from "./AdminApp";

// Ask AI answers for the tab it was asked on (docs/decisions/admin-ai.md): moving to another tab closes it, and
// it asks about the new tab only when the button is pressed again (Melvin, 2026-11-18).
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  history.replaceState(null, "", "/");
});

describe("Ask AI and the tabs", () => {
  it("closes on a tab change and asks nothing until pressed again", async () => {
    const asked: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        const json = (j: unknown) => Promise.resolve(new Response(JSON.stringify(j)));
        if (url.startsWith("/api/admin/stats/"))
          return json({ staff: { email: "owner@example.com", role: "admin" }, overview: {}, revenue: {}, site: {} });
        if (url.startsWith("/api/admin/ai/") && init?.method === "POST") {
          const body = JSON.parse(String(init.body)) as { tab: string };
          asked.push(body.tab);
          return json({ insights: { summary: `About ${body.tab}.`, actions: [] } });
        }
        if (url.startsWith("/api/admin/ai/")) return json({ configured: true, ready: true, on: true, cap: 2, spent: 0, calls: 0 });
        return Promise.resolve(new Response("{}", { status: 503 }));
      }),
    );
    history.replaceState(null, "", "/admin/?tab=Log");
    render(<AdminApp />);
    fireEvent.click(await screen.findByRole("button", { name: /Ask AI/ }));
    expect(await screen.findByText("About Log.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Flags" }));
    await waitFor(() => expect(screen.queryByText("About Log.")).toBeNull());
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText(/About /)).toBeNull();
    expect(asked).toEqual(["Log"]);

    fireEvent.click(screen.getByRole("button", { name: /Ask AI/ }));
    expect(await screen.findByText("About Flags.")).toBeTruthy();
    expect(asked).toEqual(["Log", "Flags"]);
  });
});
