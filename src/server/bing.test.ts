import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/admin/bing/route.api";
import { addUpWeeks, bingDay, type BingStat } from "@/lib/bing";

import { finishSignIn, startSignIn } from "./adminAuth";
import { bingPart, bingReport, clearBingCache, DEFAULT_BING_SITE } from "./bing";
import { resetDb } from "./db";

// The Traffic tab's Bing part: Bing Webmaster Tools through its API key, against a stubbed fetch. The key may never
// reach the response, not even in an error.

const NOW = Date.UTC(2026, 10, 10, 15);
const KEY = "bing-secret-key";
// Bing's .NET dates, at midnight Pacific (08:00 UTC in November).
const at = (day: string) => `/Date(${Date.parse(`${day}T08:00:00Z`)}-0800)/`;
const stat = (Query: string, day: string, Clicks: number, Impressions: number, AvgImpressionPosition = 8): BingStat => ({
  Query,
  Date: at(day),
  Clicks,
  Impressions,
  AvgImpressionPosition,
});

beforeEach(async () => {
  await resetDb();
  clearBingCache();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 503 })),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function fakeBing() {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      calls.push(url);
      const ok = (d: unknown) => Response.json({ d });
      if (url.includes("/GetRankAndTrafficStats"))
        return ok([
          { Date: at("2026-10-11"), Clicks: 4, Impressions: 100 },
          { Date: at("2026-11-07"), Clicks: 6, Impressions: 300 },
          // The period before (28 days ending 2026-10-10).
          { Date: at("2026-10-01"), Clicks: 2, Impressions: 50 },
        ]);
      if (url.includes("/GetQueryStats"))
        return ok([
          stat("5x5 program", "2026-10-17", 3, 100, 4),
          stat("5x5 program", "2026-10-24", 2, 100, 6),
          stat("romanian deadlift alternatives", "2026-10-31", 0, 200, 9),
          stat("old search", "2026-09-01", 9, 10, 2),
        ]);
      if (url.includes("/GetPageStats")) return ok([stat("https://www.getliftsmith.com/exercises/squat/", "2026-10-23", 5, 80, 5)]);
      return new Response("{}", { status: 404 });
    }),
  );
  return calls;
}

describe("bing route", () => {
  const req = (url: string, init: RequestInit = {}) => new Request(`https://www.getliftsmith.com${url}`, init);
  it("answers 404 to anyone who isn't staff and 400 for an unknown period", async () => {
    expect((await GET(req("/api/admin/bing/?days=28"))).status).toBe(404);
    vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
    const start = await startSignIn(req("/api/admin/login/", { method: "POST" }), "owner@example.com");
    const { devLink } = (await start.json()) as { devLink: string };
    const cookie = /ls_admin=([^;]+)/.exec((await finishSignIn(new Request(devLink))).headers.get("set-cookie") ?? "")?.[1];
    expect((await GET(req("/api/admin/bing/?days=5", { headers: { cookie: `ls_admin=${cookie}` } }))).status).toBe(400);
    const ok = await GET(req("/api/admin/bing/?days=28", { headers: { cookie: `ls_admin=${cookie}` } }));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({ state: "setup" });
  });
});

describe("Bing Webmaster Tools", () => {
  it("asks for the key when it isn't set", async () => {
    const p = await bingReport(28, NOW);
    expect(p.state).toBe("setup");
    expect(p.state === "setup" && p.setup).toContain("BING_WEBMASTER_API_KEY");
  });

  it("reads days, searches and pages for the period and the period before", async () => {
    vi.stubEnv("BING_WEBMASTER_API_KEY", KEY);
    const calls = fakeBing();
    const p = await bingReport(28, NOW);
    expect(calls).toHaveLength(3);
    expect(calls.every((u) => u.includes(`siteUrl=${encodeURIComponent(DEFAULT_BING_SITE)}`) && u.includes(`apikey=${KEY}`))).toBe(true);
    if (p.state !== "ok") throw new Error(JSON.stringify(p));
    const r = p.report;
    expect([r.start, r.end]).toEqual(["2026-10-11", "2026-11-07"]);
    expect(r.totals).toMatchObject({ clicks: 10, impressions: 400, ctr: 10 / 400 });
    // The position is weighted by times shown: (4×100 + 6×100 + 9×200) / 400.
    expect(r.totals.position).toBeCloseTo(7);
    expect(r.previous).toMatchObject({ clicks: 2, impressions: 50 });
    expect(r.daily).toHaveLength(28);
    expect(r.daily[0]).toEqual({ date: "2026-10-11", clicks: 4, impressions: 100 });
    expect(r.queries.map((q) => q.key)).toEqual(["5x5 program", "romanian deadlift alternatives"]);
    expect(r.queries[0]).toMatchObject({ clicks: 5, impressions: 200, position: 5 });
    expect(r.pages[0]?.key).toBe("https://www.getliftsmith.com/exercises/squat/");
    expect(r.firstDay).toBe("2026-10-01");
    expect(JSON.stringify(p)).not.toContain(KEY);
  });

  it("uses BING_SITE_URL when it is set", async () => {
    vi.stubEnv("BING_WEBMASTER_API_KEY", KEY);
    vi.stubEnv("BING_SITE_URL", "https://getliftsmith.com/");
    const calls = fakeBing();
    await bingReport(7, NOW);
    expect(calls[0]).toContain(`siteUrl=${encodeURIComponent("https://getliftsmith.com/")}`);
  });

  it("turns a refusal into a message without the key", async () => {
    vi.stubEnv("BING_WEBMASTER_API_KEY", KEY);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ ErrorCode: 3, Message: "InvalidApiKey" }, { status: 400 })),
    );
    const p = await bingReport(28, NOW);
    expect(p).toEqual({ state: "error", error: "Bing answered 400: InvalidApiKey" });
  });

  it("caches for 10 minutes, refreshes on request, and forgets a failure", async () => {
    vi.stubEnv("BING_WEBMASTER_API_KEY", KEY);
    const calls = fakeBing();
    await bingPart(28, { now: NOW });
    await bingPart(28, { now: NOW + 60_000 });
    expect(calls).toHaveLength(3);
    await bingPart(28, { now: NOW + 60_000, refresh: true });
    expect(calls).toHaveLength(6);
    clearBingCache();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    );
    expect((await bingPart(7, { now: NOW })).state).toBe("error");
    await new Promise((r) => setTimeout(r, 0));
    fakeBing();
    expect((await bingPart(7, { now: NOW + 1000 })).state).toBe("ok");
  });
});

describe("Bing's numbers", () => {
  it("reads .NET dates in Bing's own time zone", () => {
    expect(bingDay("/Date(1399014000000-0700)/")).toBe("2014-05-02");
    expect(bingDay("/Date(1399100400000)/")).toBe("2014-05-03");
    expect(bingDay(at("2026-11-07"))).toBe("2026-11-07");
    expect(bingDay("2026-11-07")).toBeNull();
    expect(bingDay(null)).toBeNull();
  });

  it("adds up weeks inside the period, most clicks first", () => {
    const rows = addUpWeeks(
      [
        stat("a", "2026-11-01", 1, 10, 2),
        stat("b", "2026-11-01", 3, 10, 4),
        stat("a", "2026-11-08", 1, 30, 6),
        stat("a", "2026-12-01", 50, 50),
      ],
      "2026-11-01",
      "2026-11-08",
    );
    expect(rows).toEqual([
      { key: "b", clicks: 3, impressions: 10, ctr: 0.3, position: 4 },
      { key: "a", clicks: 2, impressions: 40, ctr: 0.05, position: 5 },
    ]);
  });
});
