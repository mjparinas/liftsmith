// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAccount, type Account } from "@/lib/auth";
import { useSocial } from "@/lib/social";
import { ACCOUNT_KEY } from "@/lib/syncOutbox";
import { resetDb } from "@/server/db";
import { handle } from "@/server/social";

import { ScanToFollow } from "./ScanToFollow";

// Scan to follow against the real server code: the sheet shows the lifter's invite code, and the scanner opens
// what a scanned Liftsmith code points to.
const a: Account = { token: "tok-a", id: "acc-a", email: null, providers: ["email"], via: "email" };

beforeEach(async () => {
  await resetDb();
  localStorage.clear();
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a));
  useAccount.setState({ account: a });
  useSocial.setState({ me: null, error: null });
  location.hash = "#/friends";
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    const r = await handle("acc-a", JSON.parse(String(init.body)));
    return url === "/api/social/" ? Response.json(r.body, { status: r.code }) : Response.json({}, { status: 404 });
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  await handle("acc-a", { op: "join", handle: "alex", name: "Alex", agree: true });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const camera = (ok: boolean) => {
  const stop = vi.fn();
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: ok ? async () => ({ getTracks: () => [{ stop }] }) : async () => Promise.reject(new Error("denied")),
    },
  });
  return stop;
};

describe("Scan to follow", () => {
  it("shows the lifter's own code, which is their invite link", async () => {
    render(<ScanToFollow onClose={() => undefined} />);
    expect(await screen.findByRole("img", { name: "Your Liftsmith code" })).toBeInTheDocument();
    const [row] = await (await import("@/server/db")).query<{ account_id: string }>("SELECT account_id FROM social_invites");
    expect(row?.account_id).toBe("acc-a");
  });

  it("opens the invite a scanned code points to, and turns the camera off", async () => {
    const u = userEvent.setup();
    const stop = camera(true);
    vi.stubGlobal(
      "BarcodeDetector",
      class {
        detect = async () => [{ rawValue: "https://www.getliftsmith.com/app/#/invite/ABCD2345" }];
      },
    );
    const onClose = vi.fn();
    render(<ScanToFollow onClose={onClose} />);
    await u.click(screen.getByRole("button", { name: "Scan their code" }));
    await waitFor(() => expect(location.hash).toBe("#/invite/ABCD2345"));
    expect(onClose).toHaveBeenCalled();
    cleanup();
    expect(stop).toHaveBeenCalled();
  });

  it("says so when the code isn't ours, or the camera won't open", async () => {
    const u = userEvent.setup();
    camera(true);
    vi.stubGlobal(
      "BarcodeDetector",
      class {
        detect = async () => [{ rawValue: "https://evil.example/app/#/invite/ABCD2345" }];
      },
    );
    render(<ScanToFollow onClose={() => undefined} />);
    await u.click(screen.getByRole("button", { name: "Scan their code" }));
    expect(await screen.findByText("That code isn’t a Liftsmith link.")).toBeInTheDocument();
    expect(location.hash).toBe("#/friends");
    cleanup();

    camera(false);
    render(<ScanToFollow onClose={() => undefined} />);
    await u.click(screen.getByRole("button", { name: "Scan their code" }));
    expect(await screen.findByText(/The camera didn’t open/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scan their code" })).toBeInTheDocument();
  });
});
