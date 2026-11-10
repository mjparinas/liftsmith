import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { INDEXNOW_ENDPOINT, INDEXNOW_KEY, INDEXNOW_KEY_LOCATION } from "@/lib/indexnow";
import type { Route } from "@/lib/seo";

import { resetDb } from "./db";
import { pingIndexNow } from "./indexnow";

// IndexNow pings from the daily admin job: new and changed public pages go once, nothing else, and only from
// production. The key file must be served from our own host for IndexNow to trust the pings.

const NOW = Date.UTC(2026, 10, 10, 13);
const ROUTES: Route[] = [
  { path: "/", priority: 1 },
  { path: "/blog/5x5/", priority: 0.6, date: "2026-11-01" },
];

let bodies: { host: string; key: string; keyLocation: string; urlList: string[] }[];
beforeEach(async () => {
  await resetDb();
  bodies = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(INDEXNOW_ENDPOINT);
      bodies.push(JSON.parse(String(init?.body)) as (typeof bodies)[number]);
      return new Response("", { status: 200 });
    }),
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("IndexNow", () => {
  it("serves the key file from public/ with the key and nothing else", () => {
    expect(readFileSync(`public/${INDEXNOW_KEY}.txt`, "utf8")).toBe(INDEXNOW_KEY);
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/);
    expect(INDEXNOW_KEY_LOCATION).toBe(`https://www.getliftsmith.com/${INDEXNOW_KEY}.txt`);
  });

  it("pings only from production", async () => {
    expect(await pingIndexNow({ routes: ROUTES, now: NOW })).toEqual({ sent: 0, skipped: "not production" });
    expect(bodies).toHaveLength(0);
    vi.stubEnv("VERCEL_ENV", "production");
    expect(await pingIndexNow({ routes: ROUTES, now: NOW })).toEqual({ sent: 2 });
    expect(bodies[0]).toEqual({
      host: "www.getliftsmith.com",
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
      urlList: ["https://www.getliftsmith.com/", "https://www.getliftsmith.com/blog/5x5/"],
    });
  });

  it("sends a page again only when it's new or its date changed", async () => {
    await pingIndexNow({ routes: ROUTES, now: NOW, force: true });
    expect(await pingIndexNow({ routes: ROUTES, now: NOW, force: true })).toEqual({ sent: 0 });
    const changed: Route[] = [
      { path: "/", priority: 1 },
      { path: "/blog/5x5/", priority: 0.6, date: "2026-11-09" },
      { path: "/blog/new/", priority: 0.6, date: "2026-11-10" },
    ];
    expect(await pingIndexNow({ routes: changed, now: NOW, force: true })).toEqual({ sent: 2 });
    expect(bodies[1]?.urlList).toEqual(["https://www.getliftsmith.com/blog/5x5/", "https://www.getliftsmith.com/blog/new/"]);
  });

  it("keeps the pages for the next run when IndexNow refuses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 429 })),
    );
    expect(await pingIndexNow({ routes: ROUTES, now: NOW, force: true })).toEqual({ sent: 0, error: "IndexNow answered 429." });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 202 })),
    );
    expect(await pingIndexNow({ routes: ROUTES, now: NOW, force: true })).toEqual({ sent: 2 });
  });
});
