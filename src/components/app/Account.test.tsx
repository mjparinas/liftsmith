// @vitest-environment jsdom
import "fake-indexeddb/auto";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { forgetAccount, readAccount } from "@/lib/auth";
import { readSync } from "@/lib/syncOutbox";

import { AccountPanel } from "./Account";

describe("signing in with an emailed code", () => {
  const calls: { url: string; body: unknown; auth?: string }[] = [];
  beforeEach(() => {
    localStorage.clear();
    forgetAccount();
    calls.length = 0;
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      const body = init.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ url, body, auth: (init.headers as Record<string, string>)?.Authorization });
      if (url === "/api/auth/email/") return Response.json({ ok: true });
      if (url === "/api/auth/email/verify/")
        return body.code === "123456"
          ? Response.json({ token: "tok", account: { id: "acc", email: "me@example.com", providers: ["email"] } })
          : Response.json({ error: "That code didn't match." }, { status: 401 });
      if (url === "/api/auth/logout/") return Response.json({ ok: true });
      return Response.json({ cursor: 0, events: [], deleted: [], records: [], more: false });
    });
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("emails a code, signs in with it, and signs out keeping the device's data", async () => {
    const u = userEvent.setup();
    render(<AccountPanel />);
    // No Google or Apple ids in this build: email is the way in.
    expect(screen.queryByRole("button", { name: "Continue with Google" })).toBeNull();
    await u.click(screen.getByRole("button", { name: "Continue with email" }));
    await u.type(screen.getByLabelText("Your email"), "me@example.com");
    await u.click(screen.getByRole("button", { name: "Email me a code" }));
    expect(calls[0].body).toEqual({ email: "me@example.com" });
    await u.type(await screen.findByLabelText("Code"), "999999");
    await u.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("didn't match");
    await u.clear(screen.getByLabelText("Code"));
    await u.type(screen.getByLabelText("Code"), "123456");
    await u.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Signed in as me@example.com with email.")).toBeInTheDocument();
    expect(readAccount()?.token).toBe("tok");
    expect(readSync().first).toBe(true);
    await u.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(readAccount()).toBeNull());
    expect(calls.at(-1)).toMatchObject({ url: "/api/auth/logout/", auth: "Bearer tok" });
    expect(screen.getByRole("button", { name: "Continue with email" })).toBeInTheDocument();
  });
});
