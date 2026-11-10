import { createVerify, generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/admin/search/route.api";
import { nearMisses, pathOf, periodDates } from "@/lib/searchConsole";

import { finishSignIn, startSignIn } from "./adminAuth";
import { resetDb } from "./db";
import { clearSearchCache, DEFAULT_SITE, searchPart, searchReport, serviceAccount, signedAssertion } from "./searchConsole";

// The Traffic tab's Google Search part (ported from Gradelings' traffic tests): Search Console through a read-only
// service account, against a stubbed fetch. No credential may reach the response.

const NOW = Date.UTC(2026, 10, 10, 15);
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});
const KEY_JSON = JSON.stringify({
  type: "service_account",
  client_email: "reader@project.iam.gserviceaccount.com",
  private_key: privateKey,
});

beforeEach(async () => {
  await resetDb();
  clearSearchCache();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 503 })),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const gscRow = (keys: string[] | undefined, clicks: number, impressions: number, position = 8) => ({
  ...(keys ? { keys } : {}),
  clicks,
  impressions,
  ctr: impressions ? clicks / impressions : 0,
  position,
});

/** A fake Google. Records what was asked. */
function fakeGoogle() {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const ok = (body: unknown) => Response.json(body);
    if (url === "https://oauth2.googleapis.com/token") return ok({ access_token: "ya29.secret-access", expires_in: 3600 });
    if (url.includes("/searchAnalytics/query")) {
      const body = JSON.parse(String(init?.body)) as { startDate: string; dimensions: string[] };
      const dim = body.dimensions[0];
      if (!dim)
        return ok({ rows: body.startDate === "2026-10-11" ? [gscRow(undefined, 120, 4000, 9.5)] : [gscRow(undefined, 60, 3000, 12)] });
      if (dim === "date") return ok({ rows: [gscRow(["2026-10-11"], 5, 100), gscRow(["2026-11-07"], 9, 200)] });
      if (dim === "query")
        return ok({ rows: [gscRow(["5x5 program"], 30, 600, 4.2), gscRow(["romanian deadlift alternatives"], 2, 900, 7.5)] });
      if (dim === "country") return ok({ rows: [gscRow(["usa"], 80, 2000)] });
      if (dim === "device") return ok({ rows: [gscRow(["MOBILE"], 90, 3000)] });
      return ok({ rows: [gscRow(["https://www.getliftsmith.com/exercises/squat/"], 25, 500, 5)] });
    }
    if (url.endsWith("/sitemaps"))
      return ok({
        sitemap: [
          {
            path: "https://www.getliftsmith.com/sitemap.xml",
            lastDownloaded: "2026-11-08T08:00:00Z",
            errors: "0",
            warnings: "2",
            contents: [{ type: "web", submitted: "310" }],
          },
        ],
      });
    return new Response("{}", { status: 404 });
  });
  vi.stubGlobal("fetch", f);
  return calls;
}

describe("search route", () => {
  const req = (url: string, init: RequestInit = {}) => new Request(`https://www.getliftsmith.com${url}`, init);
  it("answers 404 to anyone who isn't staff and 400 for an unknown period", async () => {
    expect((await GET(req("/api/admin/search/?days=28"))).status).toBe(404);
    vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
    const start = await startSignIn(req("/api/admin/login/", { method: "POST" }), "owner@example.com");
    const { devLink } = (await start.json()) as { devLink: string };
    const cookie = /ls_admin=([^;]+)/.exec((await finishSignIn(new Request(devLink))).headers.get("set-cookie") ?? "")?.[1];
    const res = await GET(req("/api/admin/search/?days=5", { headers: { cookie: `ls_admin=${cookie}` } }));
    expect(res.status).toBe(400);
    const ok = await GET(req("/api/admin/search/?days=28", { headers: { cookie: `ls_admin=${cookie}` } }));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ state: "setup" });
  });
});

describe("Search Console", () => {
  it("signs a read-only request with the service account's key", () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_KEY", Buffer.from(KEY_JSON).toString("base64"));
    const key = serviceAccount();
    expect(key?.client_email).toBe("reader@project.iam.gserviceaccount.com");
    const jwt = signedAssertion(key!, NOW);
    const [head, claims, sig] = jwt.split(".") as [string, string, string];
    const v = createVerify("RSA-SHA256");
    v.update(`${head}.${claims}`);
    expect(v.verify(publicKey, Buffer.from(sig, "base64url"))).toBe(true);
    const c = JSON.parse(Buffer.from(claims, "base64url").toString()) as Record<string, unknown>;
    expect(c).toMatchObject({ scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token" });
    expect(c.exp).toBe(Math.floor(NOW / 1000) + 3600);
  });

  it("asks for the key, and says when it can't be read", async () => {
    expect(await searchReport(28, NOW)).toMatchObject({ state: "setup", setup: expect.stringContaining("GOOGLE_SERVICE_ACCOUNT_KEY") });
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_KEY", "not json");
    expect(await searchReport(28, NOW)).toMatchObject({ state: "setup", setup: expect.stringContaining("can't be read") });
  });

  it("reads totals, the period before, days, searches, pages, countries, devices and sitemaps", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_KEY", KEY_JSON);
    const calls = fakeGoogle();
    const part = await searchReport(28, NOW);
    if (part.state !== "ok") throw new Error(JSON.stringify(part));
    const r = part.report;
    expect(r.site).toBe(DEFAULT_SITE);
    expect(r.start).toBe("2026-10-11");
    expect(r.end).toBe("2026-11-07");
    expect(r.totals.clicks).toBe(120);
    expect(r.previous.clicks).toBe(60);
    expect(r.daily).toHaveLength(28);
    expect(r.daily[0]).toEqual({ date: "2026-10-11", clicks: 5, impressions: 100 });
    expect(r.daily[1]).toEqual({ date: "2026-10-12", clicks: 0, impressions: 0 });
    expect(r.queries[0]?.key).toBe("5x5 program");
    expect(pathOf(r.pages[0]!.key)).toBe("/exercises/squat/");
    expect(r.countries[0]?.key).toBe("usa");
    expect(r.devices[0]?.key).toBe("MOBILE");
    expect(r.sitemaps[0]).toMatchObject({ submitted: 310, warnings: 2, errors: 0, lastDownloaded: Date.parse("2026-11-08T08:00:00Z") });
    // The property is in the path, and Google is asked for final numbers with the bearer token.
    const q = calls.find((c) => c.url.includes("searchAnalytics"))!;
    expect(q.url).toContain(encodeURIComponent("sc-domain:getliftsmith.com"));
    expect(JSON.parse(String(q.init?.body))).toMatchObject({ dataState: "final" });
    expect((q.init?.headers as Record<string, string>).authorization).toBe("Bearer ya29.secret-access");
    // Nothing secret comes back.
    const out = JSON.stringify(part);
    expect(out).not.toContain("ya29");
    expect(out).not.toContain("PRIVATE KEY");
  });

  it("uses SEARCH_CONSOLE_SITE when it is set", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_KEY", KEY_JSON);
    vi.stubEnv("SEARCH_CONSOLE_SITE", "https://www.getliftsmith.com/");
    const calls = fakeGoogle();
    await searchReport(7, NOW);
    expect(calls.some((c) => c.url.includes(encodeURIComponent("https://www.getliftsmith.com/")))).toBe(true);
  });

  it("turns a refusal into a message", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_KEY", KEY_JSON);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("oauth2")
          ? Response.json({ access_token: "t", expires_in: 3600 })
          : Response.json({ error: { message: "User does not have sufficient permission for site" } }, { status: 403 }),
      ),
    );
    expect(await searchReport(28, NOW)).toEqual({
      state: "error",
      error: "Search Console answered 403: User does not have sufficient permission for site",
    });
  });

  it("caches for 10 minutes, refreshes on request, and forgets a failure", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_KEY", KEY_JSON);
    const calls = fakeGoogle();
    await searchPart(28, { now: NOW });
    const n = calls.length;
    await searchPart(28, { now: NOW + 60_000 });
    expect(calls.length).toBe(n);
    await searchPart(28, { now: NOW + 60_000, refresh: true });
    expect(calls.length).toBeGreaterThan(n);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 500 })),
    );
    clearSearchCache();
    expect((await searchPart(7, { now: NOW })).state).toBe("error");
    fakeGoogle();
    expect((await searchPart(7, { now: NOW + 1000 })).state).toBe("ok");
  });
});

describe("search arithmetic", () => {
  it("ends the period the lag before today and gives the same length before it", () => {
    expect(periodDates(7, NOW, 3)).toEqual({ start: "2026-11-01", end: "2026-11-07", prevStart: "2026-10-25", prevEnd: "2026-10-31" });
  });

  it("picks searches shown near the top that rarely get clicked", () => {
    const row = (key: string, clicks: number, impressions: number, position: number) => ({
      key,
      clicks,
      impressions,
      ctr: clicks / impressions,
      position,
    });
    const rows = [
      row("clicked a lot", 30, 600, 4.2),
      row("near miss", 2, 900, 7.5),
      row("too deep", 0, 900, 35),
      row("already top", 1, 900, 2),
      row("rarely shown", 0, 10, 8),
      row("bigger miss", 5, 2000, 12),
    ];
    expect(nearMisses(rows).map((r) => r.key)).toEqual(["bigger miss", "near miss"]);
  });
});
