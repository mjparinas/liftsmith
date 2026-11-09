// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyticsOn, CONSENT_KEY, flushAnalytics, forgetAnalytics, fromUserAgent, ID_KEY, installId, needsOptIn, OUTBOX_KEY, queued, rememberFirstTouch, resetAnalyticsState, setAnalytics, track } from "./analytics";
import { checkBatch, checkPageView, cleanProps, parsePlayReferrer, referrerHost, utmFrom } from "./analyticsSchema";

type Calls = { mock: { calls: [string, RequestInit][] } };
const ok = () => vi.fn(async () => new Response("{}", { status: 200 })) as unknown as typeof fetch;
const status = (n: number) => vi.fn(async () => new Response("{}", { status: n })) as unknown as typeof fetch;
const offline = () => vi.fn(async () => { throw new TypeError("Failed to fetch"); }) as unknown as typeof fetch;
const body = (post: typeof fetch, i = 0) => JSON.parse((post as unknown as Calls).mock.calls[i][1].body as string);

describe("usage analytics on the device", () => {
  beforeEach(() => {
    localStorage.clear();
    resetAnalyticsState();
  });

  it("asks for consent first in the EU, EEA, UK and Switzerland only", () => {
    for (const z of ["Europe/Paris", "Europe/London", "Europe/Zurich", "Atlantic/Reykjavik", "Europe/Dublin"]) expect(needsOptIn(z)).toBe(true);
    for (const z of ["America/Toronto", "Asia/Manila", "Europe/Moscow", "Europe/Istanbul", "Australia/Sydney", ""]) expect(needsOptIn(z)).toBe(false);
  });

  it("follows the lifter's own choice over the default", () => {
    setAnalytics(false);
    expect(analyticsOn()).toBe(false);
    setAnalytics(true);
    expect(analyticsOn()).toBe(true);
    expect(localStorage.getItem(CONSENT_KEY)).toBe("on");
  });

  it("keeps one random install id until the device is erased", () => {
    const a = installId();
    expect(a).toMatch(/^[A-Za-z0-9_-]{8,64}$/);
    expect(installId()).toBe(a);
    forgetAnalytics();
    expect(localStorage.getItem(ID_KEY)).toBeNull();
    expect(installId()).not.toBe(a);
  });

  it("queues events with only their allowed properties", () => {
    setAnalytics(true);
    track("workout_finish", { sets: 18, minutes: 52, auto: false, weight: 140 } as never);
    const [e] = JSON.parse(localStorage.getItem(OUTBOX_KEY)!);
    expect(e.name).toBe("workout_finish");
    expect(e.props).toEqual({ sets: 18, minutes: 52, auto: false });
  });

  it("records nothing when switched off, and switching off drops what was waiting", () => {
    setAnalytics(true);
    track("app_open", { cold: true });
    expect(queued()).toBe(1);
    setAnalytics(false);
    expect(queued()).toBe(0);
    track("app_open", { cold: true });
    expect(queued()).toBe(0);
  });

  it("sends the queue in a batch with the device context, and empties it", async () => {
    setAnalytics(true);
    track("first_open");
    track("screen_view", { screen: "today" });
    const post = ok();
    expect(await flushAnalytics(post)).toBe(0);
    const b = body(post);
    expect((post as unknown as Calls).mock.calls[0][0]).toBe("/api/collect/");
    expect(b.events.map((e: { name: string }) => e.name)).toEqual(["first_open", "screen_view"]);
    expect(b.context).toMatchObject({ platform: "web", installId: installId(), acquisition: { store: "web" } });
    expect(checkBatch(b).ok).toBe(true);
  });

  it("keeps the queue offline and before the server exists, and drops a rejected batch", async () => {
    setAnalytics(true);
    track("first_open");
    expect(await flushAnalytics(offline())).toBe(1);
    expect(await flushAnalytics(status(404))).toBe(1);
    expect(await flushAnalytics(status(503))).toBe(1);
    expect(await flushAnalytics(status(400))).toBe(0);
  });

  it("remembers the first website visit's source, and only the first", () => {
    setAnalytics(true);
    rememberFirstTouch({ search: "?utm_source=reddit&utm_medium=social&utm_campaign=launch", pathname: "/exercises/back-squat/", hostname: "getliftsmith.com" }, "https://www.reddit.com/r/fitness");
    rememberFirstTouch({ search: "?utm_source=other", pathname: "/", hostname: "getliftsmith.com" }, "");
    expect(JSON.parse(localStorage.getItem("liftsmith.firstTouch")!)).toEqual({ landing: "/exercises/back-squat/", referrer: "reddit.com", source: "reddit", medium: "social", campaign: "launch" });
  });

  it("reads the OS and model from a browser's user agent", () => {
    expect(fromUserAgent("Mozilla/5.0 (Linux; Android 15; Pixel 8 Build/AP3A) AppleWebKit/537.36 Chrome/130 Mobile")).toEqual({ os: "Android", osVersion: "15", model: "Pixel 8" });
    expect(fromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15")).toEqual({ os: "iOS", osVersion: "18.1", model: "iPhone" });
    expect(fromUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)").os).toBe("Windows");
  });
});

describe("what the server accepts", () => {
  const ctx = { installId: "abcdef12-3456", platform: "android", appVersion: "0.2.0", model: "Pixel 8" };
  const now = Date.UTC(2026, 10, 9);

  it("drops unknown events and properties instead of storing them", () => {
    const r = checkBatch({ context: { ...ctx, email: "x@y.z" }, events: [
      { id: "e1aaaaaaaa", name: "workout_finish", at: now, props: { sets: 10, hrAvg: 150, notes: "hi" } },
      { id: "e2aaaaaaaa", name: "heart_rate_sample", at: now, props: { bpm: 140 } },
    ] }, now);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.batch.events).toEqual([{ id: "e1aaaaaaaa", name: "workout_finish", at: now, props: { sets: 10 } }]);
    expect(r.batch.context).not.toHaveProperty("email");
  });

  it("refuses a bad install id, a bad platform or too many events", () => {
    expect(checkBatch({ context: { ...ctx, installId: "x" }, events: [] }).ok).toBe(false);
    expect(checkBatch({ context: { ...ctx, platform: "windows" }, events: [] }).ok).toBe(false);
    expect(checkBatch({ context: ctx, events: Array(101).fill({}) }).ok).toBe(false);
  });

  it("ignores events from a clock far in the future or more than a year old", () => {
    const r = checkBatch({ context: ctx, events: [
      { id: "e3aaaaaaaa", name: "app_open", at: now + 3 * 86_400_000 },
      { id: "e4aaaaaaaa", name: "app_open", at: now - 400 * 86_400_000 },
    ] }, now);
    expect(r.ok && r.batch.events.length).toBe(0);
  });

  it("keeps property kinds strict", () => {
    expect(cleanProps("permission", { name: "health", granted: "yes" })).toEqual({ name: "health" });
    expect(cleanProps("first_open", { anything: 1 })).toBeUndefined();
  });

  it("reads campaign tags, referrers and Play install referrers", () => {
    expect(utmFrom("?utm_source=ig&utm_campaign=x")).toEqual({ source: "ig", campaign: "x" });
    expect(utmFrom("?gclid=abc")).toEqual({ source: "google" });
    expect(utmFrom("?q=1")).toBeUndefined();
    expect(referrerHost("https://www.google.com/search?q=lift")).toBe("google.com");
    expect(referrerHost("https://getliftsmith.com/x", "getliftsmith.com")).toBeUndefined();
    expect(referrerHost("not a url")).toBeUndefined();
    expect(parsePlayReferrer("utm_source=youtube&utm_medium=video&utm_campaign=launch")).toMatchObject({ source: "youtube", medium: "video", campaign: "launch" });
    expect(parsePlayReferrer(undefined)).toEqual({});
  });

  it("keeps only the path of a page view", () => {
    expect(checkPageView({ path: "/exercises/?email=a@b.c#x", cta: "open-app" })).toEqual({ path: "/exercises/", cta: "open-app" });
    expect(checkPageView({ path: "https://evil" })).toBeNull();
  });
});

describe("the website counter", () => {
  it("counts clicks on the app and store links, and skips the app and admin pages", async () => {
    const { ctaOf, isPublicPath } = await import("@/components/SiteBeacon");
    const a = (href: string, cta?: string) => {
      const el = document.createElement("a");
      el.setAttribute("href", href);
      if (cta) el.setAttribute("data-cta", cta);
      return el;
    };
    expect(ctaOf(a("/app/"))).toBe("open-app");
    expect(ctaOf(a("https://play.google.com/store/apps/details?id=com.getliftsmith.app"))).toBe("google-play");
    expect(ctaOf(a("https://apps.apple.com/app/id1"))).toBe("app-store");
    expect(ctaOf(a("/privacy/", "pricing"))).toBe("pricing");
    expect(ctaOf(a("/privacy/"))).toBeNull();
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/app/")).toBe(false);
    expect(isPublicPath("/admin/")).toBe(false);
    expect(isPublicPath("/me/")).toBe(false);
    expect(isPublicPath("/share/")).toBe(true);
  });
});
