import { describe, expect, it } from "vitest";
import { computeMetrics, mrrAt, replaySubs, sourceLabel, storeOf, type InstallFacts, type MetricsInput, type SubEvent } from "./adminMetrics";
import { forecastAt, FORECAST_QUARTERS } from "./forecast";

const DAY = 86_400_000;
const NOW = Date.UTC(2027, 5, 1);

let seq = 0;
const install = (over: Partial<InstallFacts> = {}): InstallFacts => ({
  id: `i${seq++}`, firstSeen: NOW - 10 * DAY, lastSeen: NOW - 9 * DAY, platform: "android", store: "play", source: null, medium: null, campaign: null, referrer: null,
  country: "CA", os: "Android", osVersion: "15", manufacturer: "Google", model: "Pixel 8", appVersion: "0.2.0", formFactor: "phone", locale: "en-CA", asaCampaign: null,
  onboarded: null, firstWorkout: null, workouts: 0, paywall: null, ...over,
});
const sub = (over: Partial<SubEvent>): SubEvent => ({ id: `s${seq++}`, at: NOW, installId: null, subscription: null, store: "play", kind: "purchase", plan: "monthly", usd: 6.99, priceLocal: 6.99, currency: "USD", reason: null, ...over });
const site = (): MetricsInput["site"] => ({ daily: [], visitors: 100, views: 250, prevVisitors: 80, prevViews: 200, pages: [], referrers: [], sources: [], campaigns: [], countries: [], devices: [], browsers: [], os: [], ctas: [], ctaTotal: 20 });
const input = (over: Partial<MetricsInput> = {}): MetricsInput => ({
  now: NOW, days: 28, launchAt: NOW - 90 * DAY, installs: [], active: [], dau: 0, wau: 0, mau: 0, daily: [], steps: [], screens: [], features: [], permissions: [], workouts: [], cohortWeeks: [], subs: [], site: site(), ...over,
});

describe("admin metrics", () => {
  it("puts installs and purchases in a store", () => {
    expect(storeOf("android", null)).toBe("play");
    expect(storeOf("ios", "testflight")).toBe("appstore");
    expect(storeOf("web", "web")).toBe("web");
    expect(storeOf("x", "x")).toBe("other");
  });

  it("names where an install came from", () => {
    expect(sourceLabel({ source: "reddit", medium: "social", referrer: null, asaCampaign: null, platform: "android", store: "play" })).toBe("reddit / social");
    expect(sourceLabel({ source: "google-play", medium: "organic", referrer: "utm_source=google-play&utm_medium=organic", asaCampaign: null, platform: "android", store: "play" })).toBe("Play Store (organic)");
    expect(sourceLabel({ source: null, medium: null, referrer: null, asaCampaign: "asa:1", platform: "ios", store: "appstore" })).toBe("Apple Search Ads");
    expect(sourceLabel({ source: null, medium: null, referrer: "google.com", asaCampaign: null, platform: "web", store: "web" })).toBe("google.com");
  });

  it("counts MRR from paying subscriptions: monthly in full, annual as a twelfth", () => {
    const subs = [
      sub({ installId: "a", at: NOW - 5 * DAY }),
      sub({ installId: "b", at: NOW - 10 * DAY, plan: "annual", usd: 39.99 }),
      sub({ installId: "c", at: NOW - 60 * DAY }), // lapsed: no renewal after 31 days
      sub({ installId: "d", at: NOW - 3 * DAY }),
      sub({ installId: "d", at: NOW - 2 * DAY, kind: "refund" }),
    ];
    const m = mrrAt(subs, NOW);
    expect(m.paying).toBe(2);
    expect(m.gross).toBeCloseTo(6.99 + 39.99 / 12, 2);
  });

  it("keeps a renewed subscription paying and counts its renewals", () => {
    const subs = [sub({ subscription: "x", at: NOW - 40 * DAY }), sub({ subscription: "x", at: NOW - 9 * DAY, kind: "renew" })];
    const [s] = replaySubs(subs, NOW);
    expect(s.renewals).toBe(1);
    expect(mrrAt(subs, NOW).paying).toBe(1);
  });

  it("measures the forecast inputs", () => {
    const installs = [
      install({ id: "p1", firstSeen: NOW - 50 * DAY, onboarded: NOW - 50 * DAY }),
      install({ id: "p2", firstSeen: NOW - 50 * DAY }),
      install({ id: "p3", firstSeen: NOW - 5 * DAY, onboarded: NOW - 5 * DAY }),
      install({ id: "i1", firstSeen: NOW - 5 * DAY, platform: "ios", store: "appstore" }),
    ];
    const subs = [
      // p1: trial 23 days ago (27 days after installing), converted to annual a week later.
      sub({ installId: "p1", subscription: "t1", at: NOW - 23 * DAY, kind: "trial_start", plan: "annual", usd: null }),
      sub({ installId: "p1", subscription: "t1", at: NOW - 16 * DAY, kind: "trial_convert", plan: "annual", usd: 39.99 }),
      // p2: trial that lapsed.
      sub({ installId: "p2", subscription: "t2", at: NOW - 20 * DAY, kind: "trial_start", plan: "annual", usd: null }),
      // A monthly payer from 40 days ago who didn't renew: churned.
      sub({ installId: "m1", subscription: "m1", at: NOW - 40 * DAY }),
      sub({ installId: "m1", subscription: "m1", at: NOW - 20 * DAY, kind: "cancel", reason: "billing" }),
    ];
    const m = computeMetrics(input({ installs, subs }));
    const play = m.revenue.byStore.find((r) => r.store === "play")!;
    expect(play.installs).toBe(1);
    expect(play.trialStarts).toBe(2);
    expect(play.trialToPaid).toBe(0.5);
    expect(play.annualShare).toBe(1);
    expect(play.downloadToPaidD35).toBe(0.5);
    expect(play.monthlyChurn).toBe(1);
    expect(play.billingFailureShare).toBe(1);
    expect(play.paying).toBe(1);
    expect(play.netMrr).toBeLessThan(play.grossMrr);
    expect(play.realisedAnnual).toBe(39.99);
    expect(m.revenue.byStore.find((r) => r.store === "appstore")!.installs).toBe(1);
  });

  it("builds the funnel from the period's installs", () => {
    const installs = [
      install({ onboarded: NOW - 9 * DAY, firstWorkout: NOW - 9 * DAY, workouts: 3, paywall: NOW - 8 * DAY }),
      install({ onboarded: NOW - 9 * DAY, firstWorkout: NOW - 8 * DAY, workouts: 1 }),
      install({ onboarded: NOW - 9 * DAY }),
      install({}),
      install({ firstSeen: NOW - 40 * DAY }), // the period before
    ];
    const m = computeMetrics(input({ installs }));
    expect(m.funnel.map((s) => s.n)).toEqual([4, 3, 2, 1, 1, 0, 0]);
    expect(m.siteFunnel.map((s) => s.n)).toEqual([100, 20, 0]);
    expect(m.overview.installs).toBe(4);
    expect(m.overview.prevInstalls).toBe(1);
    expect(m.overview.setupRate).toBe(0.75);
  });

  it("builds weekly retention cohorts", () => {
    const start = Math.floor((NOW - 21 * DAY) / (7 * DAY)) * 7 * DAY;
    const m = computeMetrics(input({ cohortWeeks: [
      { id: "a", firstSeen: start, weeks: [0, 1, 2] },
      { id: "b", firstSeen: start + DAY, weeks: [0] },
    ] }));
    const row = m.retention.cohorts[0];
    expect(row.size).toBe(2);
    expect(row.weeks.slice(0, 3)).toEqual([1, 0.5, 0.5]);
  });

  it("splits devices and versions", () => {
    const m = computeMetrics(input({ installs: [install({}), install({ model: "SM-S921B", manufacturer: "samsung" }), install({ platform: "ios", store: "appstore", manufacturer: "Apple", model: "iPhone16,2", os: "iOS", osVersion: "18.1" })] }));
    expect(m.devices.models.map((d) => d.key).sort()).toEqual(["Google Pixel 8", "iPhone16,2", "samsung SM-S921B"].sort());
    expect(m.devices.os.find((o) => o.key === "Android 15")!.n).toBe(2);
  });

  it("follows the forecast doc and interpolates between quarters", () => {
    expect(forecastAt(12)).toEqual({ lo: 879, mid: 3481, hi: 14566 });
    const m10 = forecastAt(10)!;
    expect(m10.mid).toBeGreaterThan(FORECAST_QUARTERS[2].mid);
    expect(m10.mid).toBeLessThan(FORECAST_QUARTERS[3].mid);
    expect(forecastAt(1)!.mid).toBeLessThan(464);
    expect(forecastAt(37)).toBeNull();
    const m = computeMetrics(input({ subs: [sub({ at: NOW - 10 * DAY })] }));
    expect(m.revenue.forecast[0]).toMatchObject({ month: 1 });
    expect(m.revenue.forecast.at(-1)!.actual).toBeNull();
    expect(m.revenue.forecast[2].actual).toBeCloseTo(6.99, 2);
  });
});
