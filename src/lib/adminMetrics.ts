// The admin panel's numbers, computed from what the server loads (src/server/adminData.ts). Pure, so every
// rule is unit tested. Counts and sums only: nothing here identifies a person.
import { ASSUMED, forecastAt, LIST_PRICE } from "./forecast";

const DAY = 86_400_000;
const WEEK = 7 * DAY;

export type Store = "play" | "appstore" | "web" | "other";
export const STORES: Store[] = ["play", "appstore", "web", "other"];

/** Which store an install or a purchase belongs to, for the per-store splits. */
export function storeOf(platform: string | null | undefined, store: string | null | undefined): Store {
  if (store === "play" || platform === "android") return "play";
  if (store === "appstore" || store === "testflight" || platform === "ios") return "appstore";
  if (store === "web" || platform === "web") return "web";
  return "other";
}

export interface InstallFacts {
  id: string;
  firstSeen: number;
  lastSeen: number;
  platform: string;
  store: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  referrer: string | null;
  country: string | null;
  os: string | null;
  osVersion: string | null;
  manufacturer: string | null;
  model: string | null;
  appVersion: string | null;
  formFactor: string | null;
  locale: string | null;
  asaCampaign: string | null;
  /** When each funnel step first happened for this install, if it did. */
  onboarded: number | null;
  firstWorkout: number | null;
  workouts: number;
  paywall: number | null;
}

export interface SubEvent {
  id: string;
  at: number;
  installId: string | null;
  subscription: string | null;
  store: string;
  kind: string;
  plan: string | null;
  usd: number | null;
  priceLocal: number | null;
  currency: string | null;
  reason: string | null;
}

export interface Counted {
  key: string;
  n: number;
}

export interface MetricsInput {
  now: number;
  days: number;
  launchAt: number | null;
  installs: InstallFacts[];
  /** Distinct active installs per day (any event), with the platform. */
  active: { day: number; platform: string; n: number }[];
  dau: number;
  wau: number;
  mau: number;
  /** Events per day by name (period). */
  daily: { day: number; name: string; n: number }[];
  steps: { step: number; name: string; n: number }[];
  screens: Counted[];
  features: Counted[];
  permissions: { key: string; granted: number; denied: number }[];
  workouts: { day: number; n: number; minutes: number; sets: number; auto: number; prs: number }[];
  /** Install id → the weeks after install in which it did anything (for cohorts). */
  cohortWeeks: { id: string; firstSeen: number; weeks: number[] }[];
  subs: SubEvent[];
  site: {
    daily: { day: number; visitors: number; views: number }[];
    visitors: number;
    views: number;
    prevVisitors: number;
    prevViews: number;
    pages: Counted[];
    referrers: Counted[];
    sources: Counted[];
    campaigns: Counted[];
    countries: Counted[];
    devices: Counted[];
    browsers: Counted[];
    os: Counted[];
    ctas: { key: string; path: string; n: number }[];
    ctaTotal: number;
  };
}

const pct = (a: number, b: number) => (b > 0 ? a / b : null);
const round = (x: number, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

function tally<T>(xs: T[], key: (x: T) => string | null | undefined, limit = 15): Counted[] {
  const m = new Map<string, number>();
  for (const x of xs) {
    const k = key(x) || "(none)";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  const all = [...m.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
  if (all.length <= limit) return all;
  const rest = all.slice(limit - 1).reduce((s, c) => s + c.n, 0);
  return [...all.slice(0, limit - 1), { key: "Other", n: rest }];
}

/** Where an install came from, in one label: tagged campaign, ad, referrer, or the store's own search. */
export function sourceLabel(i: Pick<InstallFacts, "source" | "medium" | "referrer" | "asaCampaign" | "platform" | "store">): string {
  if (i.asaCampaign && i.asaCampaign !== "none") return "Apple Search Ads";
  if (i.source && !(i.source === "google-play" && i.medium === "organic")) return i.medium ? `${i.source} / ${i.medium}` : i.source;
  if (i.referrer && !i.referrer.includes("=")) return i.referrer;
  const s = storeOf(i.platform, i.store);
  if (s === "play") return "Play Store (organic)";
  if (s === "appstore") return "App Store (organic or untagged)";
  return "Direct";
}

const dayList = (now: number, days: number) => {
  const today = Math.floor(now / DAY);
  return Array.from({ length: days }, (_, i) => today - days + 1 + i);
};

// ---------- Subscriptions ----------

const PAID = new Set(["purchase", "trial_convert", "renew", "billing_recover"]);
const periodMs = (plan: string | null) => (plan === "annual" ? 365 * DAY : 31 * DAY);

/** Rough USD rates for a realised-price estimate when a store doesn't give USD. Labelled approximate in the panel. */
export const FX: Record<string, number> = {
  USD: 1,
  CAD: 0.72,
  EUR: 1.08,
  GBP: 1.27,
  AUD: 0.66,
  NZD: 0.6,
  CHF: 1.13,
  SEK: 0.095,
  NOK: 0.093,
  DKK: 0.145,
  JPY: 0.0066,
  INR: 0.012,
  BRL: 0.18,
  MXN: 0.055,
  PLN: 0.25,
  KRW: 0.00073,
};
export const usdOf = (e: Pick<SubEvent, "usd" | "priceLocal" | "currency">): number | null =>
  e.usd ?? (e.priceLocal != null && e.currency && FX[e.currency] ? e.priceLocal * FX[e.currency] : null);

interface SubState {
  key: string;
  store: Store;
  plan: string | null;
  installId: string | null;
  firstPaid: number | null;
  trialAt: number | null;
  /** Paid until (a renewal moves it on), ended early by a refund or an expiry. */
  until: number;
  ended: number | null;
  price: number | null;
  renewals: number;
  cancelled: boolean;
}

/** Replays subscription events into one state per subscription, as of `at`. */
export function replaySubs(subs: SubEvent[], at: number): SubState[] {
  const m = new Map<string, SubState>();
  for (const e of [...subs].sort((a, b) => a.at - b.at)) {
    if (e.at > at) break;
    const key = e.subscription ?? e.installId ?? e.id;
    const s = m.get(key) ?? {
      key,
      store: storeOf(null, e.store),
      plan: e.plan,
      installId: e.installId,
      firstPaid: null,
      trialAt: null,
      until: 0,
      ended: null,
      price: null,
      renewals: 0,
      cancelled: false,
    };
    if (e.plan) s.plan = e.plan;
    if (e.kind === "trial_start") s.trialAt ??= e.at;
    if (PAID.has(e.kind)) {
      if (e.kind === "renew") s.renewals++;
      s.firstPaid ??= e.at;
      s.until = Math.max(s.until, e.at) + periodMs(s.plan);
      s.ended = null;
      s.cancelled = false;
      s.price = usdOf(e) ?? s.price;
    }
    if (e.kind === "cancel") s.cancelled = true;
    if (e.kind === "uncancel") s.cancelled = false;
    if (e.kind === "refund" || e.kind === "expire") {
      s.ended = e.at;
      s.until = Math.min(s.until, e.at);
    }
    m.set(key, s);
  }
  return [...m.values()];
}

/** A paying subscription at `at`: paid, not ended. Three days of grace cover a late renewal notice. */
const payingAt = (s: SubState, at: number) =>
  s.firstPaid != null && s.firstPaid <= at && s.until + 3 * DAY > at && (s.ended == null || s.ended > at);
const monthlyValue = (s: SubState) => (s.plan === "annual" ? (s.price ?? LIST_PRICE.annual) / 12 : (s.price ?? LIST_PRICE.monthly));

export function mrrAt(subs: SubEvent[], at: number): { gross: number; paying: number; byStore: Record<Store, number> } {
  const byStore: Record<Store, number> = { play: 0, appstore: 0, web: 0, other: 0 };
  let gross = 0;
  let paying = 0;
  for (const s of replaySubs(subs, at)) {
    if (!payingAt(s, at)) continue;
    gross += monthlyValue(s);
    byStore[s.store] += monthlyValue(s);
    paying++;
  }
  return { gross: round(gross, 2), paying, byStore };
}

export interface StoreRevenue {
  store: Store;
  downloadsPerWeek: number;
  installs: number;
  wizardCompletion: number | null;
  trialStarts: number;
  trialToPaid: number | null;
  trialsEnded: number;
  downloadToPaidD35: number | null;
  d35Cohort: number;
  annualShare: number | null;
  paidStarts: number;
  monthlyChurn: number | null;
  annualFirstRenewal: number | null;
  annualDue: number;
  refundRate: number | null;
  revenuePerInstallD14: number | null;
  revenuePerInstallD60: number | null;
  realisedMonthly: number | null;
  realisedAnnual: number | null;
  grossMrr: number;
  netMrr: number;
  paying: number;
  billingFailureShare: number | null;
  billingFailures: number;
}

function storeRevenue(store: Store | "all", input: MetricsInput): StoreRevenue {
  const { now, days } = input;
  const inStore = <T extends { store: Store }>(x: T) => store === "all" || x.store === store;
  const installs = input.installs.map((i) => ({ ...i, store: storeOf(i.platform, i.store) })).filter(inStore);
  const subs = input.subs.map((e) => ({ ...e, store: storeOf(null, e.store) })).filter(inStore);
  const since = now - days * DAY;
  const recent = installs.filter((i) => i.firstSeen >= since);
  const state = replaySubs(subs, now);
  // Trials and paid starts in the period.
  const trials = subs.filter((e) => e.kind === "trial_start" && e.at >= since);
  const trialsEnded = state.filter((s) => s.trialAt != null && s.trialAt + 7 * DAY < now && s.trialAt >= since - 7 * DAY);
  const converted = trialsEnded.filter((s) => s.firstPaid != null && s.firstPaid >= (s.trialAt ?? 0));
  const paidStarts = state.filter((s) => s.firstPaid != null && s.firstPaid >= since);
  const annual = paidStarts.filter((s) => s.plan === "annual").length;
  // Download to paid at day 35: installs at least 35 days old, from the last 180 days.
  const firstPaidByInstall = new Map<string, number>();
  for (const s of state)
    if (s.installId && s.firstPaid != null)
      firstPaidByInstall.set(s.installId, Math.min(firstPaidByInstall.get(s.installId) ?? Infinity, s.firstPaid));
  const d35 = installs.filter((i) => i.firstSeen <= now - 35 * DAY && i.firstSeen >= now - 215 * DAY);
  const d35Paid = d35.filter((i) => (firstPaidByInstall.get(i.id) ?? Infinity) <= i.firstSeen + 35 * DAY).length;
  // Monthly churn: monthly subscribers paying 30 days ago who aren't now.
  const monthAgo = now - 30 * DAY;
  const monthlyThen = replaySubs(subs, monthAgo)
    .filter((s) => s.plan !== "annual" && payingAt(s, monthAgo))
    .map((s) => s.key);
  const nowByKey = new Map(state.map((s) => [s.key, s]));
  const churned = monthlyThen.filter((k) => !payingAt(nowByKey.get(k)!, now)).length;
  // Annual first renewal: annual subscriptions whose first year ended more than 3 days ago.
  const annualDue = state.filter((s) => s.plan === "annual" && s.firstPaid != null && s.firstPaid + 368 * DAY < now);
  const renewed = annualDue.filter((s) => s.renewals > 0).length;
  // Refunds against paid transactions in the last 90 days.
  const paidTx = subs.filter((e) => PAID.has(e.kind) && e.at >= now - 90 * DAY);
  const refunds = subs.filter((e) => e.kind === "refund" && e.at >= now - 90 * DAY).length;
  const refundRate = pct(refunds, paidTx.length);
  // Revenue per install at day 14 and 60: what each cohort paid in its first 14 or 60 days.
  const paidByInstall = new Map<string, { at: number; usd: number }[]>();
  for (const e of subs) {
    if (!e.installId) continue;
    const usd = PAID.has(e.kind) ? (usdOf(e) ?? 0) : e.kind === "refund" ? -(usdOf(e) ?? 0) : 0;
    if (usd) paidByInstall.set(e.installId, [...(paidByInstall.get(e.installId) ?? []), { at: e.at, usd }]);
  }
  const rpi = (d: number) => {
    const cohort = installs.filter((i) => i.firstSeen <= now - d * DAY && i.firstSeen >= now - (d + 180) * DAY);
    if (!cohort.length) return null;
    const sum = cohort.reduce(
      (s, i) => s + (paidByInstall.get(i.id) ?? []).filter((p) => p.at <= i.firstSeen + d * DAY).reduce((a, p) => a + p.usd, 0),
      0,
    );
    return round(sum / cohort.length, 2);
  };
  const realised = (plan: string) => {
    const xs = subs
      .filter((e) => PAID.has(e.kind) && (e.plan ?? "monthly") === plan && e.at >= now - 180 * DAY)
      .map(usdOf)
      .filter((x): x is number => x != null);
    return xs.length ? round(xs.reduce((s, x) => s + x, 0) / xs.length, 2) : null;
  };
  const mrr = mrrAt(subs, now);
  const net = mrr.gross * (1 - ASSUMED.storeFee) * (1 - (refundRate ?? ASSUMED.refundRate)) * (1 - ASSUMED.vat);
  // Google Play: cancellations because a payment failed, as a share of all cancellations (90 days).
  const cancels = subs.filter((e) => e.kind === "cancel" && e.at >= now - 90 * DAY);
  const billing = cancels.filter((e) => e.reason === "billing").length;
  const weeks = Math.max(1, days / 7);
  return {
    store: store === "all" ? "other" : store,
    downloadsPerWeek: round(recent.length / weeks),
    installs: recent.length,
    wizardCompletion: pct(recent.filter((i) => i.onboarded != null).length, recent.length),
    trialStarts: trials.length,
    trialToPaid: pct(converted.length, trialsEnded.length),
    trialsEnded: trialsEnded.length,
    downloadToPaidD35: pct(d35Paid, d35.length),
    d35Cohort: d35.length,
    annualShare: pct(annual, paidStarts.length),
    paidStarts: paidStarts.length,
    monthlyChurn: pct(churned, monthlyThen.length),
    annualFirstRenewal: pct(renewed, annualDue.length),
    annualDue: annualDue.length,
    refundRate,
    revenuePerInstallD14: rpi(14),
    revenuePerInstallD60: rpi(60),
    realisedMonthly: realised("monthly"),
    realisedAnnual: realised("annual"),
    grossMrr: mrr.gross,
    netMrr: round(net, 2),
    paying: mrr.paying,
    billingFailureShare: pct(billing, cancels.length),
    billingFailures: billing,
  };
}

/** Real gross MRR at each month end since launch, against the forecast's three cases. */
export function forecastVsActual(input: MetricsInput) {
  const launch = input.launchAt;
  if (!launch) return [];
  const months = Math.min(36, Math.max(1, Math.ceil((input.now - launch) / (30.44 * DAY))));
  return Array.from({ length: Math.max(months, 12) }, (_, i) => {
    const m = i + 1;
    const end = launch + m * 30.44 * DAY;
    const f = forecastAt(m)!;
    return {
      month: m,
      actual: end <= input.now + 30.44 * DAY && m <= months ? mrrAt(input.subs, Math.min(end, input.now)).gross : null,
      ...f,
    };
  });
}

// ---------- Everything ----------

export function computeMetrics(input: MetricsInput) {
  const { now, days } = input;
  const since = now - days * DAY;
  const prevSince = since - days * DAY;
  const all = input.installs;
  const recent = all.filter((i) => i.firstSeen >= since);
  const prev = all.filter((i) => i.firstSeen >= prevSince && i.firstSeen < since);
  const dayIdx = dayList(now, days);

  // Installs per day by store.
  const installsDaily = dayIdx.map((d) => {
    const row: Record<string, number> = { day: d };
    for (const s of STORES) row[s] = 0;
    return row;
  });
  const byDay = new Map(installsDaily.map((r) => [r.day, r]));
  for (const i of recent) {
    const r = byDay.get(Math.floor(i.firstSeen / DAY));
    if (r) r[storeOf(i.platform, i.store)]++;
  }

  // Active installs per day by platform.
  const activeDaily = dayIdx.map((d) => ({ day: d, android: 0, ios: 0, web: 0 }));
  const aByDay = new Map(activeDaily.map((r) => [r.day, r]));
  for (const a of input.active) {
    const r = aByDay.get(a.day);
    if (r && (a.platform === "android" || a.platform === "ios" || a.platform === "web")) r[a.platform] += a.n;
  }

  // Funnel: site visit → CTA click → install → setup done → first workout → second workout → paywall → trial → paid.
  const subsState = replaySubs(input.subs, now);
  const trialInstalls = new Set(subsState.filter((s) => s.trialAt != null).map((s) => s.installId));
  const paidInstalls = new Set(subsState.filter((s) => s.firstPaid != null).map((s) => s.installId));
  const funnelFor = (xs: InstallFacts[]) => [
    { key: "Installed (first open)", n: xs.length },
    { key: "Finished setup", n: xs.filter((i) => i.onboarded != null).length },
    { key: "Started a workout", n: xs.filter((i) => i.firstWorkout != null).length },
    { key: "Two or more workouts", n: xs.filter((i) => i.workouts >= 2).length },
    { key: "Saw the paywall", n: xs.filter((i) => i.paywall != null).length },
    { key: "Started a trial", n: xs.filter((i) => trialInstalls.has(i.id)).length },
    { key: "Paid", n: xs.filter((i) => paidInstalls.has(i.id)).length },
  ];
  // Store installs mostly don't come through the site, so the site's own steps are kept apart.
  const funnel = funnelFor(recent);
  const siteFunnel = [
    { key: "Site visitors", n: input.site.visitors },
    { key: "Clicked a call to action", n: input.site.ctaTotal },
    { key: "Web app installs", n: recent.filter((i) => storeOf(i.platform, i.store) === "web").length },
  ];
  const funnelByStore = Object.fromEntries(
    (["play", "appstore", "web"] as Store[]).map((s) => [s, funnelFor(recent.filter((i) => storeOf(i.platform, i.store) === s))]),
  );

  // Time to value: hours from install to setup and to the first workout (medians).
  const median = (xs: number[]) => {
    if (!xs.length) return null;
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const toSetup = median(recent.filter((i) => i.onboarded != null).map((i) => (i.onboarded! - i.firstSeen) / 60_000));
  const toWorkout = median(recent.filter((i) => i.firstWorkout != null).map((i) => (i.firstWorkout! - i.firstSeen) / 3_600_000));

  // Retention: weekly cohorts by install week, share active in each later week. Plus D1/D7/D30.
  const cohorts = new Map<number, { start: number; size: number; active: number[] }>();
  for (const c of input.cohortWeeks) {
    const w = Math.floor(c.firstSeen / WEEK);
    const row = cohorts.get(w) ?? { start: w * WEEK, size: 0, active: Array(9).fill(0) };
    row.size++;
    for (const k of new Set(c.weeks)) if (k >= 0 && k < 9) row.active[k]++;
    cohorts.set(w, row);
  }
  const cohortRows = [...cohorts.values()]
    .sort((a, b) => b.start - a.start)
    .slice(0, 12)
    .map((r) => ({
      start: r.start,
      size: r.size,
      weeks: r.active.map((n, k) => (r.start + (k + 1) * WEEK <= now + WEEK ? (r.start + k * WEEK <= now ? n / r.size : null) : null)),
    }));
  const dayN = (n: number) => {
    const eligible = input.cohortWeeks.filter((c) => c.firstSeen <= now - (n + 1) * DAY);
    if (!eligible.length) return null;
    // Rolling retention: back on day N or later (from each install's last activity).
    const ids = new Set(eligible.map((e) => e.id));
    const back = all.filter((i) => ids.has(i.id) && i.lastSeen >= i.firstSeen + n * DAY).length;
    return back / eligible.length;
  };

  // Engagement.
  const w = input.workouts;
  const finished = w.reduce((s, r) => s + r.n, 0);
  const engagement = {
    workoutsDaily: dayIdx.map((d) => ({ day: d, n: w.find((r) => r.day === d)?.n ?? 0 })),
    finished,
    avgMinutes: finished ? round(w.reduce((s, r) => s + r.minutes, 0) / finished) : null,
    avgSets: finished ? round(w.reduce((s, r) => s + r.sets, 0) / finished) : null,
    autoEnded: pct(
      w.reduce((s, r) => s + r.auto, 0),
      finished,
    ),
    prs: w.reduce((s, r) => s + r.prs, 0),
    perActiveInstall: input.mau ? round(finished / input.mau, 2) : null,
    screens: input.screens,
    features: input.features,
    permissions: input.permissions,
  };

  // Devices and installs.
  const devices = {
    platforms: tally(recent, (i) => i.platform),
    stores: tally(recent, (i) => i.store),
    os: tally(recent, (i) => (i.os ? `${i.os} ${(i.osVersion ?? "").split(".")[0]}`.trim() : null)),
    models: tally(
      recent,
      (i) =>
        i.model
          ? i.manufacturer && i.manufacturer !== "Apple" && !i.model.toLowerCase().startsWith(i.manufacturer.toLowerCase())
            ? `${i.manufacturer} ${i.model}`
            : i.model
          : null,
      20,
    ),
    manufacturers: tally(recent, (i) => i.manufacturer),
    versions: tally(
      all.filter((i) => i.lastSeen >= since),
      (i) => i.appVersion,
    ),
    formFactors: tally(recent, (i) => i.formFactor),
    locales: tally(recent, (i) => i.locale),
    countries: tally(recent, (i) => i.country, 20),
  };

  const acquisition = {
    sources: tally(recent, sourceLabel, 20),
    campaigns: tally(
      recent.filter((i) => i.campaign),
      (i) => i.campaign,
    ),
    referrers: tally(
      recent.filter((i) => i.referrer && !i.referrer.includes("=")),
      (i) => i.referrer,
    ),
    searchAds: recent.filter((i) => i.asaCampaign && i.asaCampaign !== "none").length,
  };

  const onboarding = input.steps.sort((a, b) => a.step - b.step);

  const revenue = {
    all: storeRevenue("all", input),
    byStore: (["play", "appstore", "web"] as Store[]).map((s) => storeRevenue(s, input)),
    assumed: ASSUMED,
    list: LIST_PRICE,
    forecast: forecastVsActual(input),
    mrrDaily: dayIdx
      .filter((_, i) => i % Math.max(1, Math.floor(days / 30)) === 0 || i === dayIdx.length - 1)
      .map((d) => ({ day: d, gross: mrrAt(input.subs, Math.min((d + 1) * DAY, now)).gross })),
    paywallViews: input.daily.filter((r) => r.name === "paywall_view").reduce((s, r) => s + r.n, 0),
  };

  const site = input.site;
  return {
    now,
    days,
    overview: {
      installs: recent.length,
      prevInstalls: prev.length,
      dau: input.dau,
      wau: input.wau,
      mau: input.mau,
      stickiness: pct(input.dau, input.mau),
      setupRate: pct(recent.filter((i) => i.onboarded != null).length, recent.length),
      firstWorkoutRate: pct(recent.filter((i) => i.firstWorkout != null).length, recent.length),
      workouts: finished,
      visitors: site.visitors,
      prevVisitors: site.prevVisitors,
      grossMrr: revenue.all.grossMrr,
      netMrr: revenue.all.netMrr,
      paying: revenue.all.paying,
      trialStarts: revenue.all.trialStarts,
      minutesToSetup: toSetup == null ? null : round(toSetup),
      hoursToFirstWorkout: toWorkout == null ? null : round(toWorkout),
    },
    installsDaily,
    activeDaily,
    funnel,
    siteFunnel,
    funnelByStore,
    onboarding,
    retention: { cohorts: cohortRows, d1: dayN(1), d7: dayN(7), d30: dayN(30) },
    engagement,
    devices,
    acquisition,
    site: {
      ...site,
      daily: dayIdx.map((d) => site.daily.find((r) => r.day === d) ?? { day: d, visitors: 0, views: 0 }),
      viewsPerVisitor: site.visitors ? round(site.views / site.visitors, 2) : null,
      ctaRate: pct(site.ctaTotal, site.visitors),
    },
    revenue,
  };
}

export type Metrics = ReturnType<typeof computeMetrics>;
