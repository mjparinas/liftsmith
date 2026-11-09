import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkBatch } from "@/lib/analyticsSchema";
import { finishSignIn, getStaff, requireStaff, startSignIn } from "./adminAuth";
import { adminMetrics, recentInstalls } from "./adminData";
import { parseUa, storeBatch, storePageView, visitorHash, whereFrom } from "./collect";
import { query, rateLimit, resetDb, run } from "./db";

const NOW = Date.now();
const ctx = (over: Record<string, unknown> = {}) => ({ installId: "install-aaaa-1", platform: "android", appVersion: "0.2.0", os: "Android", osVersion: "15", manufacturer: "Google", model: "Pixel 8", acquisition: { store: "play", source: "reddit", medium: "social", campaign: "launch" }, ...over });
const batch = (events: unknown[], c = ctx()) => {
  const r = checkBatch({ context: c, events }, NOW);
  if (!r.ok) throw new Error(r.error);
  return r.batch;
};

beforeEach(async () => {
  await resetDb();
  vi.unstubAllEnvs();
});
afterEach(() => vi.unstubAllEnvs());

describe("collecting usage events", () => {
  it("creates the install with its device and source, and stores each event once", async () => {
    const b = batch([{ id: "ev-aaaaaaa1", name: "first_open", at: NOW - 1000 }, { id: "ev-aaaaaaa2", name: "screen_view", at: NOW, props: { screen: "today" } }]);
    await storeBatch(b, { country: "CA", region: "ON" }, NOW);
    await storeBatch(b, { country: "CA" }, NOW); // a retried batch
    const [i] = await query("SELECT * FROM installs");
    expect(i).toMatchObject({ platform: "android", model: "Pixel 8", store: "play", source: "reddit", campaign: "launch", country: "CA", region: "ON" });
    expect((await query("SELECT * FROM events")).length).toBe(2);
  });

  it("dates the last activity from the events, not from when a queued batch arrived", async () => {
    await storeBatch(batch([{ id: "ev-fffffff1", name: "app_open", at: NOW - 5 * 86_400_000 }]), {}, NOW);
    const [i] = await query<{ last_seen: number }>("SELECT last_seen FROM installs");
    expect(Number(i.last_seen)).toBe(NOW - 5 * 86_400_000);
  });

  it("keeps the first touch but follows the latest device details", async () => {
    await storeBatch(batch([{ id: "ev-bbbbbbb1", name: "app_open", at: NOW }]), {}, NOW);
    await storeBatch(batch([{ id: "ev-bbbbbbb2", name: "app_open", at: NOW }], ctx({ appVersion: "0.3.0", osVersion: "16", acquisition: { store: "play", source: "tiktok" } })), {}, NOW + 1000);
    const [i] = await query("SELECT app_version, first_version, os_version, source FROM installs");
    expect(i).toMatchObject({ app_version: "0.3.0", first_version: "0.2.0", os_version: "16", source: "reddit" });
  });

  it("mirrors trials and purchases into subscription events", async () => {
    await storeBatch(batch([{ id: "ev-ccccccc1", name: "purchase", at: NOW, props: { plan: "annual", store: "play", price: 39.99, currency: "usd", trial: false } }]), { country: "US" }, NOW);
    const [s] = await query("SELECT * FROM subscription_events");
    expect(s).toMatchObject({ kind: "purchase", plan: "annual", currency: "USD", price_micros: 39_990_000, usd_micros: 39_990_000, store: "play", country: "US" });
  });

  it("reads only the country and region from the request", () => {
    expect(whereFrom(new Headers({ "x-vercel-ip-country": "ca", "x-vercel-ip-country-region": "ON", "x-vercel-ip-city": "Ottawa" }))).toEqual({ country: "CA", region: "ON" });
  });

  it("rate-limits by key across a window", async () => {
    expect(await rateLimit("k", 2, 1000, NOW)).toBe(true);
    expect(await rateLimit("k", 2, 1000, NOW)).toBe(true);
    expect(await rateLimit("k", 2, 1000, NOW)).toBe(false);
    expect(await rateLimit("k", 2, 1000, NOW + 2000)).toBe(true);
  });
});

describe("website page views", () => {
  it("counts a visitor once a day with a hash that changes the next day", () => {
    const a = visitorHash("1.2.3.4", "UA", NOW);
    expect(visitorHash("1.2.3.4", "UA", NOW)).toBe(a);
    expect(visitorHash("1.2.3.4", "UA", NOW + 86_400_000)).not.toBe(a);
    expect(a).not.toContain("1.2.3.4");
  });

  it("stores the path, source and device class, and flags bots", async () => {
    await storePageView({ path: "/", referrer: "https://www.google.com/", utm: { source: "newsletter" } }, { ip: "1.1.1.1", ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) Safari/604.1", country: "GB" }, NOW);
    await storePageView({ path: "/", cta: "open-app" }, { ip: "1.1.1.1", ua: "Googlebot/2.1" }, NOW);
    const rows = await query("SELECT path, kind, referrer, source, device, os, country, bot FROM page_views ORDER BY seq");
    expect(rows[0]).toMatchObject({ path: "/", kind: "view", referrer: "google.com", source: "newsletter", device: "mobile", os: "iOS", country: "GB", bot: 0 });
    expect(rows[1]).toMatchObject({ kind: "cta", bot: 1 });
    expect(parseUa("Mozilla/5.0 (Windows NT 10.0) Chrome/130 Safari/537").browser).toBe("Chrome");
  });
});

describe("admin sign-in", () => {
  const req = (url: string, init: RequestInit = {}) => new Request(`https://www.getliftsmith.com${url}`, init);
  const signIn = async (email: string) => {
    const r = await startSignIn(req("/api/admin/login/", { method: "POST" }), email);
    const { devLink } = (await r.json()) as { devLink?: string };
    if (!devLink) return null;
    const done = await finishSignIn(new Request(devLink));
    return /ls_admin=([^;]+)/.exec(done.headers.get("set-cookie") ?? "")?.[1] ?? null;
  };

  it("signs in an address on ADMIN_EMAILS with a one-time link", async () => {
    vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
    const cookie = await signIn("Owner@Example.com");
    expect(cookie).toBeTruthy();
    expect(await getStaff(req("/", { headers: { cookie: `ls_admin=${cookie}` } }))).toEqual({ email: "owner@example.com", role: "admin" });
    const [link] = await query<{ token_hash: string }>("SELECT token_hash FROM admin_links");
    expect(link.token_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("answers the same for an unknown address and sends nothing", async () => {
    vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
    const r = await startSignIn(req("/api/admin/login/", { method: "POST" }), "someone@example.com");
    expect(r.status).toBe(200);
    expect(await r.json()).not.toHaveProperty("devLink");
  });

  it("won't use a link twice, and ends sessions when the address leaves the list", async () => {
    vi.stubEnv("ADMIN_EMAILS", "owner@example.com");
    const r = await startSignIn(req("/api/admin/login/", { method: "POST" }), "owner@example.com");
    const { devLink } = (await r.json()) as { devLink: string };
    await finishSignIn(new Request(devLink));
    expect((await finishSignIn(new Request(devLink))).headers.get("location")).toBe("/admin/?link=expired");
    const cookie = await signIn("owner@example.com");
    vi.stubEnv("ADMIN_EMAILS", "");
    expect(await getStaff(req("/", { headers: { cookie: `ls_admin=${cookie}` } }))).toBeNull();
  });

  it("gives support staff read access only", async () => {
    vi.stubEnv("SUPPORT_EMAILS", "help@example.com");
    const cookie = await signIn("help@example.com");
    const get = await requireStaff(req("/api/admin/stats/", { headers: { cookie: `ls_admin=${cookie}` } }));
    expect("staff" in get && get.staff.role).toBe("support");
    const post = await requireStaff(req("/api/admin/installs/", { method: "POST", headers: { cookie: `ls_admin=${cookie}`, origin: "https://www.getliftsmith.com" } }), { write: true });
    expect("response" in post && post.response.status).toBe(404);
  });

  it("refuses changes from another site", async () => {
    const r = await requireStaff(req("/api/admin/installs/", { method: "POST", headers: { origin: "https://evil.example" } }), { write: true });
    expect("response" in r && r.response.status).toBe(403);
  });
});

describe("the admin numbers end to end", () => {
  it("computes from the database and leaves test installs out", async () => {
    await storeBatch(batch([{ id: "ev-ddddddd1", name: "first_open", at: NOW - 3600_000 }, { id: "ev-ddddddd2", name: "onboarding_complete", at: NOW - 3000_000, props: { rerun: false } }, { id: "ev-ddddddd3", name: "workout_finish", at: NOW - 1000, props: { sets: 12, minutes: 40, auto: false } }]), { country: "CA" }, NOW);
    await storeBatch(batch([{ id: "ev-eeeeeee1", name: "first_open", at: NOW - 1000 }], ctx({ installId: "install-owner-1", platform: "ios", acquisition: { store: "testflight" } })), {}, NOW);
    await run("UPDATE installs SET test = 1 WHERE id = ?", ["install-owner-1"]);
    await storePageView({ path: "/" }, { ip: "9.9.9.9", ua: "Mozilla/5.0 (X11; Linux x86_64) Firefox/130" }, NOW);
    const m = await adminMetrics(28, NOW);
    expect(m.overview.installs).toBe(1);
    expect(m.overview.setupRate).toBe(1);
    expect(m.overview.workouts).toBe(1);
    expect(m.overview.mau).toBe(1);
    expect(m.site.visitors).toBe(1);
    expect(m.acquisition.sources[0].key).toBe("reddit / social");
    expect(m.engagement.avgMinutes).toBe(40);
    const list = await recentInstalls();
    expect(list.find((i) => i.id === "install-owner-1")?.test).toBe(true);
  });
});
