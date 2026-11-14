// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { makeProfile, NOW } from "@/test/factories";

import { useAccount } from "./auth";
import { derive } from "./derive";
import { autoEmailPrefs, refreshReminders, SUB_KEY } from "./reminders";

afterEach(() => {
  useAccount.setState({ account: null });
  vi.unstubAllGlobals();
  vi.useRealTimers();
  localStorage.clear();
});

const pending = (address: string) =>
  makeProfile({ messages: { push: {}, email: { address, consentAt: 1, status: "pending", kinds: {} } } });

describe("email subscriptions from before email followed the account", () => {
  it("move a pending address to the signed-in account's, sent with its session so the server confirms it", async () => {
    vi.useFakeTimers();
    const sent: { auth?: string; email: string }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_u: string, init: RequestInit) => {
        const h = init.headers as Record<string, string>;
        sent.push({ auth: h.Authorization, email: (JSON.parse(String(init.body)) as { email: string }).email });
        return new Response(JSON.stringify({ status: "confirmed" }), { status: 200 });
      }),
    );
    localStorage.setItem(SUB_KEY, JSON.stringify({ id: "a".repeat(32), token: "b".repeat(64) }));
    useAccount.setState({ account: { token: "tok", id: "a1", email: "Lifter@Example.com", providers: ["google"], via: "google" } });
    const onStatus = vi.fn();
    refreshReminders(() => ({ profile: pending("typo@exmaple.com"), stats: derive([], NOW) }), onStatus, 0);
    await vi.runAllTimersAsync();
    expect(sent).toEqual([{ auth: "Bearer tok", email: "lifter@example.com" }]);
    expect(onStatus).toHaveBeenCalledWith("confirmed", "lifter@example.com");
  });

  it("keep their typed address and confirmation link while signed out", async () => {
    vi.useFakeTimers();
    const sent: { auth?: string; email: string }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_u: string, init: RequestInit) => {
        const h = init.headers as Record<string, string>;
        sent.push({ auth: h.Authorization, email: (JSON.parse(String(init.body)) as { email: string }).email });
        return new Response(JSON.stringify({ status: "pending" }), { status: 200 });
      }),
    );
    localStorage.setItem(SUB_KEY, JSON.stringify({ id: "c".repeat(32), token: "d".repeat(64) }));
    const onStatus = vi.fn();
    refreshReminders(() => ({ profile: pending("me@example.com"), stats: derive([], NOW) }), onStatus, 0);
    await vi.runAllTimersAsync();
    expect(sent).toEqual([{ auth: undefined, email: "me@example.com" }]);
    expect(onStatus).not.toHaveBeenCalled();
  });
});

describe("email on by default", () => {
  const adult = makeProfile({ onboarded: true, birthYear: 1990 });
  it("subscribes a signed-in adult's own address once this device has synced", () => {
    const next = autoEmailPrefs(adult, "me@example.com", true, NOW);
    expect(next?.email).toEqual({ address: "me@example.com", consentAt: NOW, status: "pending", kinds: {} });
    expect(next?.startedAt).toBe(NOW);
  });
  it("leaves it alone when signed out, before the first sync, already set, turned off, or under 18", () => {
    expect(autoEmailPrefs(adult, null, true, NOW)).toBeNull();
    expect(autoEmailPrefs(adult, "me@example.com", false, NOW)).toBeNull();
    expect(autoEmailPrefs({ ...adult, onboarded: false }, "me@example.com", true, NOW)).toBeNull();
    expect(autoEmailPrefs({ ...adult, messages: { push: {}, emailOff: true } }, "me@example.com", true, NOW)).toBeNull();
    expect(autoEmailPrefs(pending("old@example.com"), "me@example.com", true, NOW)).toBeNull();
    const teen = { ...adult, birthYear: new Date(NOW).getFullYear() - 15 };
    expect(autoEmailPrefs(teen, "me@example.com", true, NOW)).toBeNull();
  });
});
