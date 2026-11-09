import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { query, resetDb } from "./db";
import { addressOf, fromUs, getInboxMessage, htmlToText, InboxError, isOurs, listInbox, markArchived, markHandled, replyToInbox, waitingMail } from "./inbox";

const NOW = Date.UTC(2026, 10, 9, 12);
const DAY = 86_400_000;
const mail = (id: string, to: string, from = "Pat <pat@example.com>", at = NOW - DAY) => ({ id, from, to: [to], subject: `About ${id}`, created_at: new Date(at).toISOString() });

/** A fake Resend: pages of received mail, single messages, and the send endpoint. */
function fakeResend(pages: { data: ReturnType<typeof mail>[]; has_more: boolean }[], full: Record<string, object> = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = new URL(String(url));
    calls.push({ url: String(url), init });
    if (u.pathname === "/emails" && init?.method === "POST") return new Response(JSON.stringify({ id: "sent-1" }), { status: 200 });
    if (u.pathname === "/emails/receiving") {
      const after = u.searchParams.get("after");
      const i = after ? pages.findIndex((p) => p.data.some((m) => m.id === after)) + 1 : 0;
      return new Response(JSON.stringify(pages[i] ?? { data: [], has_more: false }), { status: 200 });
    }
    const id = decodeURIComponent(u.pathname.split("/").pop()!);
    return full[id] ? new Response(JSON.stringify(full[id]), { status: 200 }) : new Response("{}", { status: 404 });
  });
  return { f: f as unknown as typeof fetch, calls };
}

beforeEach(async () => {
  await resetDb();
  vi.stubEnv("RESEND_INBOX_API_KEY", "re_test_full");
  vi.stubEnv("RESEND_API_BASE", "https://resend.test");
  vi.stubEnv("INBOX_DOMAINS", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("admin inbox", () => {
  it("reads addresses and keeps to our own domain", () => {
    expect(addressOf("Pat <Pat@Example.com>")).toBe("pat@example.com");
    expect(isOurs({ to: ["hello@getliftsmith.com"] })).toBe(true);
    expect(isOurs({ to: ["Hi <hello@GetLiftsmith.com>"] })).toBe(true);
    expect(isOurs({ to: ["support@gradelings.com"] })).toBe(false);
    expect(isOurs({ to: ["x@notgetliftsmith.com"] })).toBe(false);
    expect(isOurs({ to: ["a@b.com"], cc: ["hello@getliftsmith.com"] })).toBe(true);
    expect(fromUs({ fromEmail: "hello@getliftsmith.com" })).toBe(true);
    expect(fromUs({ fromEmail: "pat@example.com" })).toBe(false);
  });

  it("lists only our mail across Resend's pages, with what the admin did", async () => {
    const { f } = fakeResend([
      { data: [mail("a1", "hello@getliftsmith.com"), mail("g1", "hi@gradelings.com")], has_more: true },
      { data: [mail("a2", "coach@getliftsmith.com")], has_more: false },
    ]);
    await markHandled("a2", true, NOW);
    const { items, next } = await listInbox({}, f);
    expect(items.map((i) => i.id)).toEqual(["a1", "a2"]);
    expect(items[1].handledAt).toBe(NOW);
    expect(items[0].fromEmail).toBe("pat@example.com");
    expect(next).toBeNull();
  });

  it("counts waiting mail: from someone else, in the last two weeks, not dealt with", async () => {
    const { f } = fakeResend([
      {
        data: [
          mail("new", "hello@getliftsmith.com"),
          mail("old", "hello@getliftsmith.com", "Pat <pat@example.com>", NOW - 20 * DAY),
          mail("ours", "hello@getliftsmith.com", "Liftsmith <hello@getliftsmith.com>"),
          mail("archived", "hello@getliftsmith.com"),
        ],
        has_more: false,
      },
    ]);
    await markArchived("archived", true, NOW);
    expect((await waitingMail(NOW, f)).map((m) => m.id)).toEqual(["new"]);
  });

  it("won't open another domain's message", async () => {
    const { f } = fakeResend([], { g1: { ...mail("g1", "hi@gradelings.com"), text: "secret" } });
    await expect(getInboxMessage("g1", f)).rejects.toBeInstanceOf(InboxError);
  });

  it("replies in the same thread and marks the message answered", async () => {
    const { f, calls } = fakeResend([], { a1: { ...mail("a1", "hello@getliftsmith.com"), reply_to: ["Pat <pat+reply@example.com>"], message_id: "<m1@example.com>", text: "Hi" } });
    vi.stubEnv("FEEDBACK_FROM", "Liftsmith <hello@getliftsmith.com>");
    expect(await replyToInbox("a1", "Thanks!\n\nMelvin", "admin@getliftsmith.com", f, NOW)).toBe(true);
    const sent = calls.find((c) => c.init?.method === "POST")!;
    const body = JSON.parse(String(sent.init!.body)) as Record<string, unknown>;
    expect(body).toMatchObject({ to: ["pat+reply@example.com"], subject: "Re: About a1", from: "Liftsmith <hello@getliftsmith.com>", headers: { "In-Reply-To": "<m1@example.com>" } });
    expect(String(body.html)).toContain("<p>Thanks!</p><p>Melvin</p>");
    const [state] = await query<{ replied_by: string; handled_at: number }>("SELECT replied_by, handled_at FROM inbox_state WHERE email_id = 'a1'");
    expect(state).toMatchObject({ replied_by: "admin@getliftsmith.com", handled_at: NOW });
  });

  it("turns HTML mail into plain text", () => {
    expect(htmlToText("<style>p{}</style><p>Hi &amp; bye</p><p>Two<br>lines</p>")).toBe("Hi & bye\nTwo\nlines");
  });
});
