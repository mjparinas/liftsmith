import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as twoFactorRoute from "@/app/api/admin/2fa/route.api";
import * as statsRoute from "@/app/api/admin/stats/route.api";

import { finishSignIn, startSignIn } from "./adminAuth";
import { query, resetDb } from "./db";
import { base32Encode, codeAtStep, openSecret, otpauthUri, sealSecret, stepAt, verifyTotp } from "./totp";

const NOW = Date.UTC(2026, 10, 10, 12);
const SITE = "https://www.getliftsmith.com";

async function cookieFor(email: string) {
  const r = await startSignIn(new Request(`${SITE}/api/admin/login/`, { method: "POST" }), email);
  const { devLink } = (await r.json()) as { devLink: string };
  const done = await finishSignIn(new Request(devLink));
  return `ls_admin=${/ls_admin=([^;]+)/.exec(done.headers.get("set-cookie") ?? "")![1]}`;
}
const get = (path: string, cookie: string) => new Request(`${SITE}${path}`, { headers: { cookie } });
const tf = async (cookie: string, body: unknown) => {
  const r = await twoFactorRoute.POST(
    new Request(`${SITE}/api/admin/2fa/`, { method: "POST", headers: { cookie, origin: SITE }, body: JSON.stringify(body) }),
  );
  return { status: r.status, body: (await r.json()) as { error?: string; codes?: string[]; secret?: string; uri?: string } };
};
const state = async (cookie: string) => {
  const r = await twoFactorRoute.GET(get("/api/admin/2fa/", cookie));
  return r.status === 200 ? ((await r.json()) as { enabled: boolean; ready: boolean; backupCodesLeft: number; others: string[] }) : null;
};
const panel = async (cookie: string) => (await statsRoute.GET(get("/api/admin/stats/?days=7", cookie))).status;
const codeNow = (secret: string) => codeAtStep(secret, stepAt(Date.now()));

/** Signs in and sets up two-step; returns the cookie, the secret and the recovery codes. */
async function enrol(email: string) {
  const cookie = await cookieFor(email);
  const started = await tf(cookie, { action: "start" });
  const secret = started.body.secret!;
  const done = await tf(cookie, { action: "confirm", code: codeNow(secret) });
  expect(done.status).toBe(200);
  return { cookie, secret, codes: done.body.codes! };
}

beforeEach(async () => {
  await resetDb();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.stubEnv("ADMIN_EMAILS", "owner@example.com,second@example.com");
  vi.stubEnv("SUPPORT_EMAILS", "help@example.com");
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("ADMIN_2FA", "");
  vi.stubEnv("TWO_FACTOR_KEY", "test-key");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("one-time codes", () => {
  it("match RFC 6238's SHA-1 test vector, allow one step of drift and refuse a step already used", () => {
    const secret = base32Encode(Buffer.from("12345678901234567890"));
    expect(codeAtStep(secret, stepAt(59_000))).toBe("287082");
    expect(codeAtStep(secret, stepAt(1_111_111_109_000))).toBe("081804");
    const step = stepAt(59_000);
    expect(verifyTotp(secret, "287082", null, 59_000)).toBe(step);
    expect(verifyTotp(secret, "287 082", null, 59_000 + 30_000)).toBe(step);
    expect(verifyTotp(secret, "287082", null, 59_000 + 90_000)).toBeNull();
    expect(verifyTotp(secret, "287082", step, 59_000)).toBeNull();
    expect(verifyTotp(secret, "28708", null, 59_000)).toBeNull();
    expect(otpauthUri(secret, "a@b.c", "Liftsmith admin")).toContain("otpauth://totp/Liftsmith%20admin:a%40b.c?secret=");
  });

  it("seal the secret with TWO_FACTOR_KEY, and can't open it with another key", () => {
    const sealed = sealSecret("JBSWY3DPEHPK3PXP");
    expect(sealed).toMatch(/^v1\./);
    expect(sealed).not.toContain("JBSWY3DPEHPK3PXP");
    expect(openSecret(sealed)).toBe("JBSWY3DPEHPK3PXP");
    vi.stubEnv("TWO_FACTOR_KEY", "another");
    expect(() => openSecret(sealed)).toThrow();
  });
});

describe("two-step sign-in for staff", () => {
  it("keeps the panel shut after the link alone until it's set up, then opens it and signs other sessions out", async () => {
    const other = await cookieFor("owner@example.com");
    const cookie = await cookieFor("owner@example.com");
    expect(await panel(cookie)).toBe(404);
    expect(await state(cookie)).toMatchObject({ enabled: false, ready: false });
    // Nothing else in the panel can be reached before the second step, not even setup's later actions.
    expect((await tf(cookie, { action: "regenerate", code: "123456" })).status).toBe(409);

    const started = await tf(cookie, { action: "start" });
    expect(started.body.uri).toContain("otpauth://totp/");
    const stored = await query<{ pending: string }>("SELECT pending FROM admin_two_factor WHERE email = ?", ["owner@example.com"]);
    expect(stored[0]!.pending).not.toContain(started.body.secret!);
    expect((await tf(cookie, { action: "confirm", code: "000000" })).status).toBe(400);
    const done = await tf(cookie, { action: "confirm", code: codeNow(started.body.secret!) });
    expect(done.body.codes).toHaveLength(8);

    expect(await panel(cookie)).toBe(200);
    expect(await state(cookie)).toMatchObject({ enabled: true, ready: true, backupCodesLeft: 8 });
    expect(await state(other)).toBeNull();
    const log = await query<{ action: string }>("SELECT action FROM admin_audit WHERE action LIKE '2fa.%'");
    expect(log.map((l) => l.action)).toEqual(["2fa.enable"]);
  });

  it("asks for the code at the next sign-in: wrong and reused codes fail, a recovery code works once", async () => {
    const { secret, codes } = await enrol("owner@example.com");
    const used = codeNow(secret);

    const next = await cookieFor("owner@example.com");
    expect(await panel(next)).toBe(404);
    expect(await state(next)).toMatchObject({ enabled: true, ready: false });
    expect((await tf(next, { action: "start" })).status).toBe(409);
    expect((await tf(next, { action: "verify", code: "000000" })).status).toBe(400);
    // The code that turned it on was seen once and can't be used again.
    expect((await tf(next, { action: "verify", code: used })).status).toBe(400);
    const failures = await query<{ step: string }>("SELECT step FROM staff_sign_in_failures");
    expect(failures.map((f) => f.step)).toEqual(["code", "code"]);

    expect((await tf(next, { action: "verify", code: codes[0]!.toUpperCase() })).status).toBe(200);
    expect(await panel(next)).toBe(200);
    const third = await cookieFor("owner@example.com");
    expect((await tf(third, { action: "verify", code: codes[0] })).status).toBe(400);
    vi.setSystemTime(NOW + 60_000);
    expect((await tf(third, { action: "verify", code: codeNow(secret) })).status).toBe(200);
    expect(await state(third)).toMatchObject({ backupCodesLeft: 7 });
  });

  it("limits wrong codes per address", async () => {
    await enrol("owner@example.com");
    const next = await cookieFor("owner@example.com");
    const results = [];
    for (let i = 0; i < 8; i++) results.push((await tf(next, { action: "verify", code: "000000" })).status);
    expect(results.at(-1)).toBe(429);
  });

  it("lets staff without it in when ADMIN_2FA is optional, but never an address that has it on", async () => {
    vi.stubEnv("ADMIN_2FA", "optional");
    expect(await panel(await cookieFor("help@example.com"))).toBe(200);
    await enrol("owner@example.com");
    expect(await panel(await cookieFor("owner@example.com"))).toBe(404);
  });

  it("needs a fresh code for new recovery codes or to turn it off", async () => {
    const { cookie, secret } = await enrol("owner@example.com");
    expect((await tf(cookie, { action: "regenerate", code: "000000" })).status).toBe(400);
    vi.setSystemTime(NOW + 60_000);
    const fresh = await tf(cookie, { action: "regenerate", code: codeNow(secret) });
    expect(fresh.body.codes).toHaveLength(8);
    vi.setSystemTime(NOW + 120_000);
    expect((await tf(cookie, { action: "disable", code: codeNow(secret) })).status).toBe(200);
    expect(await state(cookie)).toMatchObject({ enabled: false, ready: false });
    expect(await panel(cookie)).toBe(404);
  });

  it("lets an admin reset someone else's, which signs them out; support can't", async () => {
    const { cookie: owner } = await enrol("owner@example.com");
    const { cookie: second } = await enrol("second@example.com");
    const { cookie: help } = await enrol("help@example.com");
    expect((await state(owner))!.others.sort()).toEqual(["help@example.com", "second@example.com"]);
    expect((await state(help))!.others).toEqual([]);
    expect((await tf(help, { action: "reset", email: "second@example.com" })).status).toBe(404);
    expect((await tf(owner, { action: "reset", email: "owner@example.com" })).status).toBe(400);
    expect((await tf(owner, { action: "reset", email: "second@example.com" })).status).toBe(200);
    expect(await state(second)).toBeNull();
    const again = await cookieFor("second@example.com");
    expect(await state(again)).toMatchObject({ enabled: false, ready: false });
  });

  it("is reached only by staff signed in with a link, from our own pages", async () => {
    expect((await twoFactorRoute.GET(get("/api/admin/2fa/", "ls_admin=nope"))).status).toBe(404);
    const cookie = await cookieFor("owner@example.com");
    const cross = await twoFactorRoute.POST(
      new Request(`${SITE}/api/admin/2fa/`, {
        method: "POST",
        headers: { cookie, origin: "https://evil.example" },
        body: JSON.stringify({ action: "start" }),
      }),
    );
    expect(cross.status).toBe(403);
  });
});
