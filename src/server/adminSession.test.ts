import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ADMIN_IDLE_MS, ADMIN_MAX_MS, finishSignIn, getStaff, requireStaff, startSignIn } from "./adminAuth";
import * as db from "./db";
import { query, resetDb } from "./db";

const SITE = "https://www.getliftsmith.com";
const DAY = 86_400_000;

async function signIn(now: number) {
  const r = await startSignIn(new Request(`${SITE}/api/admin/login/`, { method: "POST" }), "owner@example.com", fetch, now);
  const { devLink } = (await r.json()) as { devLink: string };
  const done = await finishSignIn(new Request(devLink), now);
  return {
    cookie: `ls_admin=${/ls_admin=([^;]+)/.exec(done.headers.get("set-cookie") ?? "")![1]}`,
    setCookie: done.headers.get("set-cookie")!,
  };
}
const req = (cookie: string) => new Request(`${SITE}/api/admin/stats/`, { headers: { cookie } });

beforeEach(async () => {
  await resetDb();
  vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("ADMIN_2FA", "optional");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("staying signed in to the admin panel", () => {
  it("keeps a session used every few days going, up to the 90-day cap", async () => {
    const start = Date.now();
    const { cookie, setCookie } = await signIn(start);
    expect(setCookie).toContain(`Max-Age=${ADMIN_MAX_MS / 1000}`);
    // Every 10 days for 80 days: still signed in, long past the old 7-day limit.
    for (let d = 10; d <= 80; d += 10) expect(await getStaff(req(cookie), start + d * DAY)).not.toBeNull();
    const [row] = await query<{ expires_at: number }>("SELECT expires_at FROM admin_sessions");
    expect(Number(row!.expires_at)).toBe(start + ADMIN_MAX_MS);
    expect(await getStaff(req(cookie), start + ADMIN_MAX_MS + 1)).toBeNull();
  });

  it("ends a session left unused for 30 days", async () => {
    const start = Date.now();
    const { cookie } = await signIn(start);
    expect(await getStaff(req(cookie), start + ADMIN_IDLE_MS - 1)).not.toBeNull();
    const later = await signIn(start);
    expect(await getStaff(req(later.cookie), start + ADMIN_IDLE_MS + 1)).toBeNull();
  });

  it("answers 503, not the signed-out 404, when the database doesn't answer", async () => {
    const { cookie } = await signIn(Date.now());
    vi.spyOn(db, "query").mockRejectedValue(new Error("timeout"));
    const gate = await requireStaff(req(cookie));
    expect("response" in gate && gate.response.status).toBe(503);
  });
});
