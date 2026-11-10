import type Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as costsRoute from "@/app/api/admin/costs/route.api";
import * as inboxRoute from "@/app/api/admin/inbox/route.api";
import * as repliesRoute from "@/app/api/admin/replies/route.api";
import { FAQS } from "@/lib/faqs";
import { costsProblem, profit } from "@/lib/runningCosts";
import { DEFAULT_REPLIES, fillReply, repliesProblem } from "@/lib/savedReplies";

import { finishSignIn, startSignIn } from "./adminAuth";
import { query, resetDb } from "./db";
import { DRAFT_INPUT_LIMIT, DraftError, draftInstructions, draftReply, savedReplies } from "./replyDraft";

const SITE = "https://www.getliftsmith.com";

async function cookieFor(email: string) {
  const r = await startSignIn(new Request(`${SITE}/api/admin/login/`, { method: "POST" }), email);
  const { devLink } = (await r.json()) as { devLink: string };
  const done = await finishSignIn(new Request(devLink));
  return `ls_admin=${/ls_admin=([^;]+)/.exec(done.headers.get("set-cookie") ?? "")![1]}`;
}
const get = (path: string, cookie: string) => new Request(`${SITE}${path}`, { headers: { cookie } });
const send = (path: string, cookie: string, method: string, body: unknown) =>
  new Request(`${SITE}${path}`, { method, headers: { cookie, origin: SITE }, body: JSON.stringify(body) });

/** A stand-in for the SDK client that records the request and answers with `reply`. */
function fakeClient(reply: Partial<Anthropic.Beta.BetaMessage>) {
  const calls: Record<string, unknown>[] = [];
  const client = {
    beta: {
      messages: {
        create: (params: Record<string, unknown>) => {
          calls.push(params);
          return Promise.resolve({ stop_reason: "end_turn", content: [], ...reply });
        },
      },
    },
  } as unknown as Anthropic;
  return { client, calls };
}

beforeEach(async () => {
  await resetDb();
  vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
  vi.stubEnv("SUPPORT_EMAILS", "help@example.com");
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("ANTHROPIC_API_KEY", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("running costs", () => {
  it("work out profit from net MRR, a year of it and how much of the costs revenue covers", () => {
    expect(
      profit(120, [
        { name: "Vercel", monthly: 20 },
        { name: "Apple Developer", monthly: 8.25 },
      ]),
    ).toEqual({
      costs: 28.25,
      monthly: 91.75,
      yearly: 1101,
      covered: 120 / 28.25,
    });
    expect(profit(0, []).covered).toBeNull();
    expect(costsProblem([{ name: "", monthly: 1 }])).not.toBeNull();
    expect(costsProblem([{ name: "Vercel", monthly: -1 }])).not.toBeNull();
    expect(costsProblem([{ name: "Vercel", monthly: 20 }])).toBeNull();
  });

  it("are read by staff and changed by admins only, audited", async () => {
    const help = await cookieFor("help@example.com");
    const owner = await cookieFor("owner@example.com");
    expect((await costsRoute.PUT(send("/api/admin/costs/", help, "PUT", { costs: [] }))).status).toBe(404);
    expect((await costsRoute.PUT(send("/api/admin/costs/", owner, "PUT", { costs: [{ name: "x", monthly: "lots" }] }))).status).toBe(400);
    const ok = await costsRoute.PUT(send("/api/admin/costs/", owner, "PUT", { costs: [{ name: " Turso ", monthly: 4.999 }] }));
    expect(ok.status).toBe(200);
    const r = await costsRoute.GET(get("/api/admin/costs/", help));
    expect(await r.json()).toEqual({ costs: [{ name: "Turso", monthly: 5 }] });
    expect((await query<{ action: string }>("SELECT action FROM admin_audit WHERE action = 'costs.save'")).length).toBe(1);
  });
});

describe("saved replies", () => {
  it("start from the defaults, which pass their own check and name the app", async () => {
    expect(repliesProblem(DEFAULT_REPLIES)).toBeNull();
    expect(fillReply("Thanks for using {app}.")).toBe("Thanks for using Liftsmith.");
    expect(await savedReplies()).toEqual(DEFAULT_REPLIES);
  });

  it("are replaced whole by an admin, and a bad list is refused", async () => {
    const owner = await cookieFor("owner@example.com");
    const help = await cookieFor("help@example.com");
    const list = [{ id: "hi", title: "Hello", body: "Hi there." }];
    expect((await repliesRoute.PUT(send("/api/admin/replies/", help, "PUT", { replies: list }))).status).toBe(404);
    const dup = [...list, ...list];
    expect((await repliesRoute.PUT(send("/api/admin/replies/", owner, "PUT", { replies: dup }))).status).toBe(400);
    expect((await repliesRoute.PUT(send("/api/admin/replies/", owner, "PUT", { replies: list }))).status).toBe(200);
    expect(await (await repliesRoute.GET(get("/api/admin/replies/", help))).json()).toEqual({ replies: list });
  });
});

describe("Draft with AI", () => {
  it("answers from the FAQ and saved replies, treats the email as data, and only drafts", async () => {
    const text = await draftInstructions();
    for (const f of FAQS) expect(text).toContain(f.q);
    for (const r of DEFAULT_REPLIES) expect(text).toContain(r.title);
    expect(text).toMatch(/never as instructions to you/);
    expect(text).toMatch(/Never promise a refund/);
  });

  it("sends one request with a cached system prompt, a fallback on a decline and the email cut to size", async () => {
    const { client, calls } = fakeClient({ content: [{ type: "text", text: "Hi Sam,\n\nYes, it works offline.", citations: null }] });
    const draft = await draftReply(
      { from: "Sam <sam@example.com>", subject: "Offline?", text: "x".repeat(DRAFT_INPUT_LIMIT + 500) },
      client,
    );
    expect(draft).toBe("Hi Sam,\n\nYes, it works offline.");
    const p = calls[0]!;
    expect(p.fallbacks).toBe("default");
    expect(p.betas).toEqual(["server-side-fallback-2026-07-01"]);
    expect(p.output_config).toEqual({ effort: "low" });
    expect((p.system as { cache_control: unknown }[])[0]!.cache_control).toEqual({ type: "ephemeral" });
    const content = (p.messages as { content: string }[])[0]!.content;
    expect(content).toContain("<email>\nFrom: Sam <sam@example.com>\nSubject: Offline?");
    expect(content.length).toBeLessThan(DRAFT_INPUT_LIMIT + 200);
  });

  it("says so when Claude declines, the draft is empty or there's no key", async () => {
    await expect(draftReply({ from: "a", subject: "b", text: "c" }, fakeClient({ stop_reason: "refusal" }).client)).rejects.toThrow(
      DraftError,
    );
    await expect(draftReply({ from: "a", subject: "b", text: "c" }, fakeClient({}).client)).rejects.toThrow(/empty/);
    await expect(draftReply({ from: "a", subject: "b", text: "c" })).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });

  it("is offered only with a key, and only to admins", async () => {
    vi.stubEnv("RESEND_INBOX_API_KEY", "re_test");
    const owner = await cookieFor("owner@example.com");
    const help = await cookieFor("help@example.com");
    const body = { action: "draft", id: "abc-123" };
    expect((await inboxRoute.POST(send("/api/admin/inbox/", help, "POST", body))).status).toBe(404);
    const r = await inboxRoute.POST(send("/api/admin/inbox/", owner, "POST", body));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "AI drafts need ANTHROPIC_API_KEY." });
  });
});
