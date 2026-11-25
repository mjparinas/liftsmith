// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Reports } from "./Reports";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (typeof url === "string" && url.includes("/api/admin/reports/") && !init?.method) {
        return {
          ok: true,
          json: async () => ({
            reports: [
              {
                kind: "post",
                targetId: "p1",
                content: "Spammy post",
                reports: 3,
                reasons: { spam: 3 },
                notes: [],
                lastAt: Date.now(),
                hidden: true,
                author: { handle: "lifter", name: "Lifter", suspended: false },
              },
            ],
          }),
        };
      }
      if (init?.method === "POST") {
        return { ok: true, json: async () => ({}) };
      }
      return { ok: false, json: async () => ({}) };
    }),
  );
});

describe("Reports danger actions", () => {
  it("arms Remove on the first tap and only POSTs on the second", async () => {
    const user = userEvent.setup();
    render(<Reports admin onCount={() => {}} />);
    await screen.findByText("Spammy post");
    const remove = screen.getByRole("button", { name: "Remove" });
    await user.click(remove);
    expect(screen.getByRole("button", { name: "Confirm remove?" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/Esc cancels/);
    const fetchMock = vi.mocked(fetch);
    expect(fetchMock.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === "POST")).toBe(false);
    await user.click(screen.getByRole("button", { name: "Confirm remove?" }));
    await waitFor(() => expect(fetchMock.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === "POST")).toBe(true));
  });

  it("clears an armed danger action on Escape", async () => {
    const user = userEvent.setup();
    render(<Reports admin onCount={() => {}} />);
    await screen.findByText("Spammy post");
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.getByRole("button", { name: "Confirm remove?" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm remove?" })).not.toBeInTheDocument();
  });
});
