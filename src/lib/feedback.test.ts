// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import { diagnostics, diagPreview, recordError } from "./diag";
import { buildFeedback, flushFeedback, OUTBOX_KEY, pending, sendFeedback } from "./feedback";
import { checkFeedback, feedbackEmail } from "./feedbackServer";

const ok = () => vi.fn(async () => new Response("{}", { status: 200 })) as unknown as typeof fetch;
const offline = () =>
  vi.fn(async () => {
    throw new TypeError("Failed to fetch");
  }) as unknown as typeof fetch;

describe("in-app feedback", () => {
  beforeEach(() => localStorage.clear());

  it("sends a report straight away when online", async () => {
    const post = ok();
    const sent = await sendFeedback(buildFeedback({ kind: "bug", message: "Timer froze", includeDiag: true }), post);
    expect(sent).toBe(true);
    expect(pending()).toBe(0);
    const [url, init] = (post as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(url).toBe("/api/feedback/");
    expect(JSON.parse(init.body as string)).toMatchObject({ kind: "bug", message: "Timer froze", diag: { platform: "web" } });
  });

  it("keeps reports offline and sends them later in order", async () => {
    await sendFeedback(buildFeedback({ kind: "idea", message: "Dark plates", includeDiag: false }), offline());
    await sendFeedback(buildFeedback({ kind: "bug", message: "Crash", includeDiag: false }), offline());
    expect(pending()).toBe(2);
    const post = ok();
    expect(await flushFeedback(post)).toBe(0);
    const bodies = (post as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls.map(
      (c) => JSON.parse(c[1].body as string).message,
    );
    expect(bodies).toEqual(["Dark plates", "Crash"]);
  });

  it("keeps a report when the server isn't ready or isn't there, and drops one it rejects", async () => {
    await sendFeedback(
      buildFeedback({ kind: "bug", message: "a", includeDiag: false }),
      vi.fn(async () => new Response("{}", { status: 503 })) as unknown as typeof fetch,
    );
    expect(pending()).toBe(1);
    await flushFeedback(vi.fn(async () => new Response("", { status: 404 })) as unknown as typeof fetch);
    expect(pending()).toBe(1);
    await flushFeedback(vi.fn(async () => new Response("{}", { status: 400 })) as unknown as typeof fetch);
    expect(pending()).toBe(0);
  });

  it("leaves out device details when asked, and includes recent errors when allowed", () => {
    recordError("Boom in rest timer");
    expect(buildFeedback({ kind: "bug", message: "x", includeDiag: false }).diag).toBeUndefined();
    expect(buildFeedback({ kind: "bug", message: "x", includeDiag: true }).diag!.errors.at(-1)).toContain("Boom in rest timer");
  });

  it("survives a corrupt outbox", () => {
    localStorage.setItem(OUTBOX_KEY, "{not json");
    expect(pending()).toBe(0);
  });
});

describe("what's included preview", () => {
  it("shows the build hash, as the sent report does", () => {
    const d = { ...diagnostics(), version: "0.1.0", commit: "3336dee", errors: [] };
    expect(diagPreview(d, "No errors").split("\n")[0]).toBe("App 0.1.0 · build 3336dee on web");
    expect(buildFeedback({ kind: "bug", message: "x", includeDiag: true }).diag!.commit).toBeTruthy();
  });

  it("leaves the build out for reports without one", () => {
    expect(diagPreview({ ...diagnostics(), version: "0.1.0", commit: undefined, errors: [] }, "No errors")).not.toContain("build");
  });
});

describe("feedback on the server", () => {
  const good = buildFeedback({ kind: "bug", message: "Plates wrong at 102.5\nDetails here", email: "a@b.co", includeDiag: true });

  it("accepts a valid report and rejects bad ones", () => {
    expect(checkFeedback(JSON.parse(JSON.stringify(good))).ok).toBe(true);
    expect(checkFeedback(null).ok).toBe(false);
    expect(checkFeedback({ ...good, kind: "spam" }).ok).toBe(false);
    expect(checkFeedback({ ...good, message: "  " }).ok).toBe(false);
    expect(checkFeedback({ ...good, message: "x".repeat(4001) }).ok).toBe(false);
    expect(checkFeedback({ ...good, email: "nope" }).ok).toBe(false);
    expect(checkFeedback({ ...good, screenshot: "data:text/html;base64,AAAA" }).ok).toBe(false);
  });

  it("writes a readable email with the screenshot attached", () => {
    const mail = feedbackEmail({ ...good, screenshot: "data:image/jpeg;base64,QUJD" });
    expect(mail.subject).toBe("[Liftsmith Bug] Plates wrong at 102.5…");
    expect(mail.text).toContain("Reply to: a@b.co");
    expect(mail.text).toContain("App ");
    expect(mail.attachments).toEqual([{ filename: expect.stringMatching(/^screenshot-.+\.jpg$/), content: "QUJD" }]);
    expect(feedbackEmail({ ...good, diag: undefined }).text).toContain("chose not to include device details");
  });
});
