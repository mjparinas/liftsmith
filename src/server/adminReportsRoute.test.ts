import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as reportsRoute from "@/app/api/admin/reports/route.api";

import { finishSignIn, startSignIn } from "./adminAuth";
import { query, resetDb } from "./db";
import { handle } from "./social";

// The Reports tab read /api/admin/reports/, which didn't exist, so reports on Friends couldn't be reviewed.
const SITE = "https://www.getliftsmith.com";

async function cookieFor(email: string) {
  const r = await startSignIn(new Request(`${SITE}/api/admin/login/`, { method: "POST" }), email);
  const { devLink } = (await r.json()) as { devLink: string };
  const done = await finishSignIn(new Request(devLink));
  return `ls_admin=${/ls_admin=([^;]+)/.exec(done.headers.get("set-cookie") ?? "")![1]}`;
}
const post = (cookie: string, body: unknown) =>
  new Request(`${SITE}/api/admin/reports/`, { method: "POST", headers: { cookie, origin: SITE }, body: JSON.stringify(body) });

async function reportedPost() {
  const call = (who: string, op: string, b: Record<string, unknown> = {}) => handle(who, { op, ...b });
  await call("acc-a", "join", { handle: "alex", name: "Alex", agree: true });
  const id = (
    await call("acc-a", "post", {
      workoutId: "s1",
      at: Date.now() - 3_600_000,
      body: {
        seconds: 3000,
        sets: 12,
        volume: 4200,
        prs: 0,
        muscles: ["chest"],
        exercises: [{ id: "bench", name: "Bench press", sets: 4, w: 100, r: 5 }],
      },
    })
  ).body.id as string;
  await call("acc-r", "join", { handle: "rory", name: "Rory", agree: true });
  await call("acc-r", "report", { kind: "post", id, reason: "spam" });
  return id;
}

beforeEach(async () => {
  await resetDb();
  vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
  vi.stubEnv("SUPPORT_EMAILS", "help@example.com");
  vi.stubEnv("RESEND_API_KEY", "");
});
afterEach(() => vi.unstubAllEnvs());

describe("/api/admin/reports/", () => {
  it("lists open reports for staff and lets an admin decide them, audited", async () => {
    const id = await reportedPost();
    const owner = await cookieFor("owner@example.com");
    const list = await reportsRoute.GET(new Request(`${SITE}/api/admin/reports/`, { headers: { cookie: owner } }));
    expect(list.status).toBe(200);
    const { reports } = (await list.json()) as { reports: { kind: string; targetId: string }[] };
    expect(reports).toEqual([expect.objectContaining({ kind: "post", targetId: id })]);

    expect((await reportsRoute.POST(post(owner, { kind: "post", id, action: "dismiss" }))).status).toBe(200);
    expect(await query("SELECT status FROM reports")).toEqual([expect.objectContaining({ status: "dismissed" })]);
    expect(await query("SELECT action, target FROM admin_audit WHERE action = 'report.dismiss'")).toEqual([
      expect.objectContaining({ target: `post:${id}` }),
    ]);
  });

  it("refuses support staff's changes, unknown actions and signed-out reads", async () => {
    const id = await reportedPost();
    const help = await cookieFor("help@example.com");
    expect((await reportsRoute.POST(post(help, { kind: "post", id, action: "remove" }))).status).not.toBe(200);
    expect(await query("SELECT status FROM reports")).toEqual([expect.objectContaining({ status: "open" })]);
    const owner = await cookieFor("owner@example.com");
    expect((await reportsRoute.POST(post(owner, { kind: "post", id, action: "explode" }))).status).toBe(400);
    expect((await reportsRoute.GET(new Request(`${SITE}/api/admin/reports/`))).status).not.toBe(200);
  });
});
