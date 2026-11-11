// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SignIn } from "./AdminApp";
import { TwoFactorGate } from "./TwoFactor";

const calls: { url: string; body: unknown }[] = [];
beforeEach(() => {
  calls.length = 0;
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (url === "/api/admin/login/")
      return Response.json({ ok: true, message: "If that address is an admin, a sign-in link is on its way." });
    return Response.json({ error: "That code didn't work." }, { status: 400 });
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const info = {
  enabled: true,
  enabledAt: 1,
  backupCodesLeft: 8,
  email: "owner@example.com",
  role: "admin",
  ready: false,
  required: true,
  others: [],
} as const;

describe("admin sign-in from the keyboard", () => {
  it("sends the link when Enter is pressed in the email box", async () => {
    const u = userEvent.setup();
    render(<SignIn />);
    await u.type(screen.getByLabelText("Email"), "owner@example.com{Enter}");
    expect(await screen.findByRole("status")).toHaveTextContent("sign-in link is on its way");
    expect(calls).toEqual([{ url: "/api/admin/login/", body: { email: "owner@example.com" } }]);
  });

  it("checks the two-step code when Enter is pressed in the code box", async () => {
    const u = userEvent.setup();
    render(<TwoFactorGate info={{ ...info, others: [] }} />);
    await u.type(screen.getByLabelText("Code"), "123456{Enter}");
    expect(await screen.findByRole("status")).toHaveTextContent("didn't work");
    expect(calls).toEqual([{ url: "/api/admin/2fa/", body: { action: "verify", code: "123456" } }]);
  });
});
