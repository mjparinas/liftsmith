// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { viewUrl } from "./AdminApp";
import { Users } from "./Users";

const account = {
  id: "acct-aaaa-1111",
  email: "lifter@example.com",
  createdAt: Date.UTC(2026, 10, 1),
  lastSeen: Date.UTC(2026, 10, 9),
  providers: ["google"],
  devices: 1,
  events: 12,
};
const detail = {
  ...account,
  pro: false,
  identities: [{ provider: "google", email: "lifter@example.com", createdAt: account.createdAt }],
  sessions: [{ platform: "android", createdAt: account.createdAt, lastSeen: account.lastSeen, expiresAt: account.lastSeen + 1e10 }],
  sync: { events: 12, deleted: 0, bytes: 2048, records: 2, gyms: 1, firstAt: account.createdAt, lastAt: account.lastSeen },
  notes: [],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("admin Users tab", () => {
  it("puts the tab and an open account in the address", () => {
    expect(viewUrl({ tab: "Overview", open: null })).toBe("/admin/");
    expect(viewUrl({ tab: "Users", open: "acct-aaaa-1111" })).toBe("/admin/?tab=Users&open=acct-aaaa-1111");
  });

  it("lists accounts, opens one, and deletes only once DELETE is typed", async () => {
    const calls: { url: string; body?: string }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, body: init?.body as string | undefined });
        if (url.includes("?id=")) return Response.json({ account: detail });
        if (init?.method === "POST") return Response.json({ ok: true });
        return Response.json({ accounts: [account], totals: { total: 1, new30: 1, active30: 1 } });
      }),
    );
    const setOpen = vi.fn();
    const { rerender } = render(<Users admin me="owner@example.com" open={null} setOpen={setOpen} />);
    fireEvent.click(await screen.findByRole("button", { name: "Open" }));
    expect(setOpen).toHaveBeenCalledWith("acct-aaaa-1111");
    rerender(<Users admin me="owner@example.com" open="acct-aaaa-1111" setOpen={setOpen} />);
    const del = await screen.findByRole("button", { name: "Delete account" });
    expect(del).toHaveProperty("disabled", true);
    fireEvent.change(screen.getByLabelText(/type DELETE/), { target: { value: "DELETE" } });
    fireEvent.click(del);
    await waitFor(() => expect(calls.some((c) => c.body?.includes('"delete"') && c.body.includes('"DELETE"'))).toBe(true));
    expect(screen.getByText("Download accounts CSV").getAttribute("href")).toBe("/api/admin/export/?type=accounts");
  });

  it("hides admin actions and downloads from support", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("?id=")
          ? Response.json({ account: detail })
          : Response.json({ accounts: [account], totals: { total: 1, new30: 1, active30: 1 } }),
      ),
    );
    render(<Users admin={false} me="help@example.com" open="acct-aaaa-1111" setOpen={() => {}} />);
    await screen.findByText("Private notes");
    expect(screen.queryByRole("button", { name: "Delete account" })).toBeNull();
    expect(screen.queryByText(/Download/)).toBeNull();
  });

  it("shows who reported someone and resets only once their handle is typed", async () => {
    const calls: { url: string; body?: string }[] = [];
    const moderation = {
      profile: { handle: "alex", name: "Alex", public: false, joinedAt: account.createdAt },
      state: "ok",
      until: null,
      boardsOff: false,
      notice: null,
      minor: true,
      emailBanned: false,
      counts: { open: 1, total: 1, reporters: 1 },
      reports: [
        {
          id: 1,
          at: account.lastSeen,
          kind: "profile",
          reason: "abuse",
          note: "",
          status: "open",
          content: "Profile",
          reporter: { accountId: "acct-bbbb-2222", handle: "blair", email: "blair@example.com", minor: false },
        },
      ],
      made: { total: 0, dismissed: 0 },
      history: [],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        calls.push({ url, body: init?.body as string | undefined });
        if (url.includes("?id=")) return Response.json({ account: { ...detail, handle: "alex" }, moderation });
        if (init?.method === "POST") return Response.json({ ok: true });
        return Response.json({ accounts: [account], totals: { total: 1, new30: 1, active30: 1 } });
      }),
    );
    const setOpen = vi.fn();
    render(<Users admin me="owner@example.com" open="acct-aaaa-1111" setOpen={setOpen} />);
    expect((await screen.findAllByText("Bullying or harassment")).length).toBe(2); // the report, and the reason picked for an action
    expect(screen.getAllByText("Under 18").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "@blair" }));
    expect(setOpen).toHaveBeenCalledWith("acct-bbbb-2222");

    fireEvent.click(screen.getByRole("button", { name: "Shadow ban" }));
    await waitFor(() => expect(calls.some((c) => c.body?.includes('"what":"shadow"'))).toBe(true));

    fireEvent.click(await screen.findByRole("button", { name: "Reset account" }));
    const dialog = screen.getByRole("alertdialog", { name: "Reset this account?" });
    const confirm = within(dialog).getByRole("button", { name: "Reset account" });
    expect(confirm).toHaveProperty("disabled", true);
    fireEvent.change(within(dialog).getByLabelText(/to confirm/), { target: { value: "Alex" } });
    expect(confirm).toHaveProperty("disabled", true);
    fireEvent.change(within(dialog).getByLabelText(/to confirm/), { target: { value: "alex" } });
    fireEvent.click(confirm);
    await waitFor(() => expect(calls.some((c) => c.body?.includes('"reset"') && c.body.includes('"confirm":"alex"'))).toBe(true));
  });
});
