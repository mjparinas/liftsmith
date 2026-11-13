// Pro subscriptions through the stores' own billing: Google Play Billing on Android and StoreKit on iOS,
// both through RevenueCat's Capacitor SDK (@revenuecat/purchases-capacitor; Melvin chose it, 2026-11-09).
// RevenueCat never takes the payment: the store's own sheet does, and RevenueCat checks the receipts,
// tracks renewals, refunds, billing retries and family sharing, and answers "is this person Pro?".
//
// Billing is live on a device when the app was built with that platform's RevenueCat key and the SDK
// configured. Until then (every build today, the web app, tests) everyone has Pro and no price is shown,
// because a price with nothing to buy behind it breaks store review and misleads (AGENTS.md "Money").
//
// On the web app (Melvin, 2026-11-11) Pro is sold through Stripe instead: billing is live there once the server has
// Stripe set up (GET /api/billing/stripe/ says so), a plan button opens Stripe Checkout for the signed-in account,
// and Pro comes from the account (auth.ts accountPro), which also carries a phone's store subscription and lifetime
// codes. The web needs an account to buy, so Pro follows the lifter to every device ("Pro on the web" in money.md).
//
// The last answer is cached in localStorage, so Pro works offline and the first paint after a restart is
// right before the SDK answers. The RevenueCat user id is the analytics install id (a random id, never an
// advertising id), so store server notifications land on the same install in the admin panel.
import { create } from "zustand";

import { canSend, installId, platformStore, track } from "./analytics";
import { accountPro, api, AuthError, readAccount, refreshAccountPro, useAccount, type AccountSub } from "./auth";
import { COACH_STORE, type CoachTier } from "./coachPlans";
import { activeCode, activeOffering, codeTrialDays, creatorHooks } from "./creator";
import { flag } from "./flags";
import { currentTag } from "./i18n";
import { isNative } from "./juice";
import type { ProState } from "./messages";
import type { Plan } from "./trial";
import { useNow } from "./useNow";

const DAY = 86_400_000;
/** Pro stays on this long past the expiry we last saw, so a renewal the phone hasn't heard about yet (offline) doesn't lock anyone out. */
export const OFFLINE_GRACE_MS = 3 * DAY;
export const ENTITLEMENT = "pro";
const CACHE_KEY = "liftsmith.pro";
const APP_ID = "com.getliftsmith.app";

export interface Entitlement {
  active: boolean;
  /** In the store's free trial. */
  trial: boolean;
  plan?: Plan;
  /** When the current period ends (null: no expiry, e.g. a promotional grant). */
  expiresAt: number | null;
  willRenew: boolean;
  store?: string;
  /** Shared by a family member (annual plan only). */
  family?: boolean;
  manageUrl?: string | null;
}

export interface Offer {
  plan: Plan;
  /** The store's own localized price, e.g. "$39.99" or "39,99 €". */
  price: string;
  /** A monthly figure for the annual plan, from the store ("$3.33"). */
  perMonth?: string;
  /** Free-trial days this person can still get on this plan, or null (used up, or no trial). */
  trialDays: number | null;
}

interface BillingState {
  live: boolean;
  ent: Entitlement | null;
  offers: Offer[] | null;
  busy: boolean;
  /** Why the last attempt to load the plans failed, in the store SDK's own words (shown small on the paywall). */
  error: string | null;
  /** The coach plan this device's store subscription is on (coachPlans.ts), once the store has said; Pro or none is "pro". */
  coachTier?: CoachTier;
}

export const useBilling = create<BillingState>(() => ({ live: false, ent: null, offers: null, busy: false, error: null }));

/** A short, readable reason from a RevenueCat error: its code, message and the store's underlying message. */
export function errorText(e: unknown): string {
  if (e == null) return "unknown error";
  if (typeof e === "string") return e;
  const o = e as { code?: unknown; message?: unknown; underlyingErrorMessage?: unknown; readableErrorCode?: unknown };
  const parts = [o.readableErrorCode ?? o.code, o.message, o.underlyingErrorMessage]
    .filter((x) => x != null && String(x).trim() !== "")
    .map(String);
  const uniq = parts.filter((x, i) => parts.indexOf(x) === i);
  return (uniq.join(" · ") || String(e)).slice(0, 300);
}

export function billingLive(): boolean {
  return useBilling.getState().live;
}

/** Tests switch billing on with an entitlement (or none); nothing else should. */
export function setBillingLive(on: boolean, ent: Entitlement | null = null, offers: Offer[] | null = null): void {
  useBilling.setState({ live: on, ent, offers });
}

/** Whether an entitlement gives Pro at `now`, allowing for a renewal the phone hasn't heard about. */
export function entActive(ent: Entitlement | null | undefined, now: number): boolean {
  if (!ent?.active) return false;
  return ent.expiresAt == null || ent.expiresAt + OFFLINE_GRACE_MS > now;
}

/**
 * Pro on this device: always while billing isn't live, otherwise from the store entitlement, or from the
 * signed-in account when the server gives it Pro without a purchase (the store review account).
 */
export function hasPro(now = Date.now()): boolean {
  const s = useBilling.getState();
  return !s.live || entActive(s.ent, now) || accountPro();
}

/**
 * Pro the lifter really has: a store subscription or trial, or Pro on the signed-in account (a lifetime
 * code, the web subscription, the store review account). Unlike hasPro(), a build without billing doesn't
 * count, so the Pro badge on Today and the Pro rewards (achievements.ts "pro") go only to real members.
 */
export function proMember(
  now = Date.now(),
  s: Pick<BillingState, "live" | "ent"> = useBilling.getState(),
  viaAccount = accountPro(),
): boolean {
  return (s.live && entActive(s.ent, now)) || viaAccount;
}

/** The calendar month (local time) a Pro event is logged for: "2026-11". */
export function proMonth(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** proMember() for a component: re-renders when the store or the account changes. */
export function useProMember(): boolean {
  const now = useNow(60_000);
  const live = useBilling((s) => s.live);
  const ent = useBilling((s) => s.ent);
  const viaAccount = useAccount((s) => !!s.account?.pro);
  return proMember(now, { live, ent }, viaAccount);
}

// ---------- Mapping the SDK's answers (pure, tested) ----------

/** "pro_annual", "pro:annual" (Play base plan), "liftsmith.pro.yearly" → the plan. */
export function planOf(productId: string | null | undefined): Plan | undefined {
  if (!productId) return undefined;
  if (/annual|year/i.test(productId)) return "annual";
  if (/month/i.test(productId)) return "monthly";
  return undefined;
}

interface EntInfo {
  isActive: boolean;
  willRenew: boolean;
  periodType: string;
  expirationDateMillis: number | null;
  store: string;
  productIdentifier: string;
  productPlanIdentifier?: string | null;
  ownershipType?: string;
}

/** The `pro` entitlement out of RevenueCat's CustomerInfo. */
export function entFromInfo(info: {
  entitlements: { all: Record<string, EntInfo | undefined> };
  managementURL?: string | null;
}): Entitlement | null {
  const e = info.entitlements.all[ENTITLEMENT];
  if (!e) return null;
  return {
    active: e.isActive,
    trial: e.periodType === "TRIAL",
    plan: planOf(e.productPlanIdentifier ?? e.productIdentifier) ?? planOf(e.productIdentifier),
    expiresAt: e.expirationDateMillis ?? null,
    willRenew: e.willRenew,
    store: e.store,
    family: e.ownershipType === "FAMILY_SHARED" || undefined,
    manageUrl: info.managementURL ?? null,
  };
}

/** A free-trial intro price ("P14D", 14 days; "P1W", 7 days) in days, or null when the intro isn't free. */
export function trialDaysOf(intro: { price: number; periodUnit: string; periodNumberOfUnits: number } | null | undefined): number | null {
  if (!intro || intro.price > 0) return null;
  const per: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };
  const d = (per[intro.periodUnit.toUpperCase()] ?? 0) * intro.periodNumberOfUnits;
  return d > 0 ? d : null;
}

// ---------- Cache ----------

function readCache(): Entitlement | null | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw == null) return undefined;
    return JSON.parse(raw) as Entitlement | null;
  } catch {
    return undefined;
  }
}

function writeCache(ent: Entitlement | null) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(ent));
  } catch {
    // Private mode or full storage: the SDK answers again on the next open.
  }
}

export function forgetBilling() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Nothing to forget.
  }
}

// ---------- The SDK ----------

type Sdk = typeof import("@revenuecat/purchases-capacitor").Purchases;
type Pkg = import("@revenuecat/purchases-capacitor").PurchasesPackage;
type SubOption = import("@revenuecat/purchases-capacitor").SubscriptionOption;
let sdk: Sdk | null = null;
let packages: Partial<Record<Plan, Pkg>> = {};
/** On Google Play, the code's own offer on each plan (a 30-day trial or a discount), bought instead of the default. */
let codeOptions: Partial<Record<Plan, SubOption>> = {};
let started = false;

function apiKey(): string | undefined {
  const ios = platformStore() === "appstore";
  const key = ios ? process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY : process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_KEY;
  return key?.trim() || undefined;
}

function setEnt(ent: Entitlement | null) {
  writeCache(ent);
  useBilling.setState({ ent });
}

type InfoLike = {
  entitlements: { all: Record<string, EntInfo | undefined>; active?: Record<string, unknown> };
  managementURL?: string | null;
};

/** The coach plan tier in RevenueCat's CustomerInfo: its active `coach_plus` or `coach` entitlement, else Pro. */
export function tierFromInfo(info: InfoLike): CoachTier {
  const on = (id: string) => !!info.entitlements.all[id]?.isActive;
  if (on(COACH_STORE.entitlement.coachPlus)) return "coachPlus";
  if (on(COACH_STORE.entitlement.coach)) return "coach";
  return "pro";
}

/** Takes the store's latest CustomerInfo: the Pro entitlement and the coach tier. Returns the Pro entitlement. */
export function applyCustomerInfo(info: unknown): Entitlement | null {
  const i = info as InfoLike;
  const ent = entFromInfo(i);
  setEnt(ent);
  useBilling.setState({ coachTier: tierFromInfo(i) });
  return ent;
}

/** The RevenueCat SDK once billing has started on a phone (coachBilling.ts sells the coach plans through it). */
export const billingSdk = (): Sdk | null => sdk;

/** Starts billing on a native app built with a RevenueCat key. Safe to call more than once. */
export async function startBilling(): Promise<void> {
  if (!isNative()) return startWebBilling();
  if (started) return;
  const key = apiKey();
  if (!key) return;
  started = true;
  // A cached answer means billing was live on the last run: use it until the SDK answers.
  const cached = readCache();
  if (cached !== undefined) useBilling.setState({ live: true, ent: cached });
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    await Purchases.configure({ apiKey: key, appUserID: installId() });
    sdk = Purchases;
    useBilling.setState({ live: true });
    await Purchases.addCustomerInfoUpdateListener((info) => applyCustomerInfo(info));
    const { customerInfo } = await Purchases.getCustomerInfo();
    applyCustomerInfo(customerInfo);
    await tagCreator(activeCode());
    await loadOffers();
  } catch (e) {
    // Offline or the store isn't reachable: keep the cached answer, and try again on the next open.
    useBilling.setState({ error: errorText(e) });
    console.warn("[billing]", errorText(e));
    started = false;
  }
}

/** Tells RevenueCat which creator code this subscriber came with, so the store webhook carries it (creator.ts). */
async function tagCreator(code: string | null): Promise<void> {
  if (!sdk) return;
  try {
    await sdk.setAttributes({ creator_code: code });
  } catch {
    // Sent again on the next open.
  }
}

// When a code is checked or removed, the attribute and the offers follow.
creatorHooks.onChecked = (code) => {
  if (webStarted) {
    void loadWebOffers().catch(() => {});
    return;
  }
  void tagCreator(code)
    .then(() => loadOffers())
    .catch(() => {});
};

/**
 * Which offering to sell from: the active code's own offering first ("creator30" unless the code names another, for
 * a longer trial or a discount), then the trialDays A/B ("trial7"), then the default.
 */
export function pickOffering<O>(all: Record<string, O>, current: O | null, codeOffering: string | null, trialDays: number): O | null {
  return (codeOffering ? all[codeOffering] : undefined) ?? (trialDays === 7 ? all["trial7"] : undefined) ?? current;
}

/** Play's tag that keeps an offer out of RevenueCat's default choice, so only people with a code get it. */
export const IGNORE_TAG = "rc-ignore-offer";

/**
 * On Google Play, a code's offer lives on the same base plans as everyone else's (subscription `pro`), tagged in Play
 * Console with the code's offering id (`creator30`) and `rc-ignore-offer`, so RevenueCat never picks it for people
 * without a code. This finds it among the options Play says this person can get; null keeps the default.
 */
export function codeOption<O extends { tags: string[]; isBasePlan: boolean }>(
  options: O[] | null | undefined,
  tag: string | null,
): O | null {
  if (!tag || !options) return null;
  return options.find((o) => !o.isBasePlan && o.tags.includes(tag)) ?? null;
}

/** Days of a Play option's free phase ("P30D", "P1M" as 30), or null when it has none. */
export function freeDaysOf(o: { freePhase: { billingPeriod: { unit: string; value: number } } | null } | null): number | null {
  const per = o?.freePhase?.billingPeriod;
  if (!per) return null;
  const unit: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };
  const d = (unit[per.unit.toUpperCase()] ?? 0) * per.value;
  return d > 0 ? d : null;
}

/** The paywall's "Try again": starts the SDK again if it never came up, otherwise reloads the plans. */
export async function retryBilling(): Promise<void> {
  if (!isNative()) {
    if (!webStarted) return startWebBilling();
    try {
      await loadWebOffers();
    } catch (e) {
      useBilling.setState({ error: errorText(e) });
    }
    return;
  }
  if (!sdk) return startBilling();
  try {
    await loadOffers();
  } catch (e) {
    useBilling.setState({ error: errorText(e) });
    console.warn("[billing]", errorText(e));
  }
}

/** The plans for sale, annual first. */
export async function loadOffers(): Promise<Offer[] | null> {
  if (!sdk) return null;
  const all = await sdk.getOfferings();
  const offering = pickOffering(all.all, all.current, activeOffering(), flag("trialDays"));
  if (!offering) {
    useBilling.setState({ error: "No current offering in RevenueCat" });
    return null;
  }
  packages = { annual: offering.annual ?? undefined, monthly: offering.monthly ?? undefined };
  codeOptions = {};
  if (platformStore() !== "appstore") {
    for (const plan of ["annual", "monthly"] as Plan[]) {
      const o = codeOption(packages[plan]?.product.subscriptionOptions, activeOffering());
      if (o) codeOptions[plan] = o;
    }
  }
  // iOS knows whether this Apple ID already used the trial; Android only offers a trial to people who can get it.
  let ineligible = new Set<string>();
  if (platformStore() === "appstore") {
    const ids = Object.values(packages).map((p) => p!.product.identifier);
    const r = await sdk.checkTrialOrIntroductoryPriceEligibility({ productIdentifiers: ids });
    ineligible = new Set(
      Object.entries(r)
        .filter(([, v]) => v.status === 1 || v.status === 3)
        .map(([k]) => k),
    );
  }
  const offers: Offer[] = (["annual", "monthly"] as Plan[]).flatMap((plan) => {
    const p = packages[plan];
    if (!p) return [];
    const pr = p.product;
    return [
      {
        plan,
        price: pr.priceString,
        perMonth: plan === "annual" ? (pr.pricePerMonthString ?? undefined) : undefined,
        trialDays: codeOptions[plan] ? freeDaysOf(codeOptions[plan]) : ineligible.has(pr.identifier) ? null : trialDaysOf(pr.introPrice),
      },
    ];
  });
  useBilling.setState({
    offers,
    error: offers.length ? null : `Offering "${offering.identifier}" has no monthly or annual package for this store`,
  });
  return offers;
}

/** ok: Pro now. redirect: off to Stripe Checkout (web). signIn: the web needs an account first. already: the account has Pro. */
export type BuyResult = "ok" | "cancelled" | "error" | "redirect" | "signIn" | "already";

/** Opens the store's own purchase sheet for a plan (on the web, Stripe Checkout). */
export async function buy(plan: Plan, from: string): Promise<BuyResult> {
  if (webBilling()) return buyWeb(plan, from);
  const p = packages[plan];
  if (!sdk || !p) return "error";
  useBilling.setState({ busy: true });
  try {
    const option = codeOptions[plan];
    const r = option ? await sdk.purchaseSubscriptionOption({ subscriptionOption: option }) : await sdk.purchasePackage({ aPackage: p });
    const ent = applyCustomerInfo(r.customerInfo);
    const store = platformStore();
    if (ent?.trial) track("trial_start", { plan, store });
    else track("purchase", { plan, store, price: p.product.price, currency: p.product.currencyCode, trial: false });
    track("feature", { name: "pro", detail: from });
    return entActive(ent, Date.now()) ? "ok" : "error";
  } catch (e) {
    return (e as { userCancelled?: boolean; code?: string })?.userCancelled || (e as { code?: string })?.code === "1"
      ? "cancelled"
      : "error";
  } finally {
    useBilling.setState({ busy: false });
  }
}

/** Restore purchases: asks the store again (a new phone, a reinstall, a family member's plan). On the web, the account. */
export async function restore(): Promise<boolean> {
  if (webBilling()) {
    useBilling.setState({ busy: true });
    try {
      return await refreshAccountPro();
    } catch {
      return false;
    } finally {
      useBilling.setState({ busy: false });
    }
  }
  if (!sdk) return false;
  useBilling.setState({ busy: true });
  try {
    const { customerInfo } = await sdk.restorePurchases();
    const ent = applyCustomerInfo(customerInfo);
    return entActive(ent, Date.now());
  } catch {
    return false;
  } finally {
    useBilling.setState({ busy: false });
  }
}

/** Where to cancel or change the plan: the store's own subscriptions page. */
export function manageUrl(ent: Entitlement | null = useBilling.getState().ent): string {
  if (ent?.manageUrl) return ent.manageUrl;
  return platformStore() === "appstore"
    ? "https://apps.apple.com/account/subscriptions"
    : `https://play.google.com/store/account/subscriptions?package=${APP_ID}`;
}

/** How the store sees this lifter, for reminder planning (messages.ts ProState); undefined when the store hasn't said. */
export function storePro(now: number, s: Pick<BillingState, "live" | "ent"> = useBilling.getState()): ProState | undefined {
  if (!s.live || !s.ent) return undefined;
  if (entActive(s.ent, now)) return s.ent.trial && s.ent.expiresAt ? { state: "trial", endsAt: s.ent.expiresAt } : { state: "pro" };
  return s.ent.expiresAt ? { state: "free", since: s.ent.expiresAt } : undefined;
}

// ---------- The web app: Stripe ----------

const WEB_CACHE_KEY = "liftsmith.webBilling";
let webStarted = false;
/** The server (or the last answer cached here) said the web sells Pro. Only then does anything here act as web billing. */
let webSelling = false;

interface WebPrice {
  plan: Plan;
  amount: number;
  currency: string;
}

const ZERO_DECIMAL = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

/** Stripe's smallest-unit amount as a price in the app's language ("$39.99", "39,99 $US"). */
export function money(amount: number, currency: string, language: string = currentTag()): string {
  const major = ZERO_DECIMAL.has(currency.toUpperCase()) ? amount : amount / 100;
  try {
    return new Intl.NumberFormat(language, { style: "currency", currency }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

/** The web's plans from the server's answer, annual first, with a monthly figure for the annual plan. */
export function webOffers(prices: WebPrice[], trialDays: number | null, language: string = currentTag()): Offer[] {
  return (["annual", "monthly"] as Plan[]).flatMap((plan) => {
    const p = prices.find((x) => x.plan === plan);
    if (!p) return [];
    return [
      {
        plan,
        price: money(p.amount, p.currency, language),
        perMonth: plan === "annual" ? money(Math.floor(p.amount / 12), p.currency, language) : undefined,
        trialDays,
      },
    ];
  });
}

/** The account's web subscription as an entitlement, for the Pro screen's status and Manage. */
export function webEnt(sub: AccountSub | null | undefined): Entitlement | null {
  if (!sub || sub.store !== "web") return null;
  return {
    active: true,
    trial: sub.trial,
    plan: sub.plan ?? undefined,
    expiresAt: sub.expiresAt,
    willRenew: sub.willRenew,
    store: "stripe",
    manageUrl: null,
  };
}

function readWebCache(): { live: boolean; prices?: WebPrice[]; trialDays?: number | null } | null {
  try {
    const raw = localStorage.getItem(WEB_CACHE_KEY);
    return raw ? (JSON.parse(raw) as { live: boolean; prices?: WebPrice[]; trialDays?: number | null }) : null;
  } catch {
    return null;
  }
}

function writeWebCache(v: { live: boolean; prices?: WebPrice[]; trialDays?: number | null }) {
  try {
    localStorage.setItem(WEB_CACHE_KEY, JSON.stringify(v));
  } catch {
    // Asked again on the next open.
  }
}

/** Whether this is the web app selling through Stripe. */
export const webBilling = () => webSelling && useBilling.getState().live;

/** Starts web billing: asks the server whether the web sells Pro. The static export (CI, tests) has no server, so it stays off. */
async function startWebBilling(): Promise<void> {
  if (webStarted || typeof window === "undefined" || !canSend()) return;
  webStarted = true;
  const cached = readWebCache();
  if (cached?.live) webSelling = true;
  if (cached?.live)
    useBilling.setState({
      live: true,
      ent: webEnt(useAccount.getState().account?.sub),
      offers: webOffers(cached.prices ?? [], cached.trialDays ?? null),
    });
  // The account's Pro decides access on the web; keep the status card and the plans (trial eligibility) in step with it.
  let last = useAccount.getState().account;
  useAccount.subscribe((s) => {
    if (s.account === last) return;
    const signedInChanged = !!s.account !== !!last || s.account?.id !== last?.id;
    last = s.account;
    if (useBilling.getState().live) useBilling.setState({ ent: webEnt(s.account?.sub) });
    if (signedInChanged) void loadWebOffers().catch(() => {});
  });
  try {
    await loadWebOffers();
  } catch (e) {
    // Offline: keep the last answer (or stay off), and ask again on the next open.
    useBilling.setState({ error: errorText(e) });
  }
}

/** Asks the server for the web's plans and the trial this lifter would get (signed in: their own eligibility). */
export async function loadWebOffers(): Promise<Offer[] | null> {
  const q = new URLSearchParams({ trial: String(flag("trialDays")) });
  const code = activeCode();
  if (code) q.set("code", code);
  const r = await api<{ live: boolean; prices?: WebPrice[]; trialDays?: number | null }>(`/api/billing/stripe/?${q.toString()}`, {
    token: readAccount()?.token,
  });
  webSelling = r.live;
  if (!r.live) {
    writeWebCache({ live: false });
    useBilling.setState({ live: false, offers: null, ent: null, error: null });
    return null;
  }
  const prices = r.prices ?? [];
  const trialDays = r.trialDays ?? null;
  writeWebCache({ live: true, prices, trialDays });
  const offers = webOffers(prices, trialDays);
  useBilling.setState({ live: true, offers, ent: webEnt(useAccount.getState().account?.sub), error: offers.length ? null : "No prices" });
  return offers;
}

async function buyWeb(plan: Plan, from: string): Promise<BuyResult> {
  const a = readAccount();
  if (!a) return "signIn";
  useBilling.setState({ busy: true });
  try {
    const r = await api<{ url: string }>("/api/billing/stripe/", {
      token: a.token,
      body: { plan, code: activeCode(), trial: codeTrialDays() ?? flag("trialDays"), installId: installId() },
    });
    track("feature", { name: "pro_checkout", detail: from });
    // Stripe's own page takes the card; it comes back to #/pro/paid (or #/pro/settings when cancelled).
    window.location.assign(r.url);
    return "redirect";
  } catch (e) {
    if (e instanceof AuthError && e.status === 409) {
      await refreshAccountPro().catch(() => false);
      return "already";
    }
    if (e instanceof AuthError && e.status === 401) return "signIn";
    return "error";
  } finally {
    useBilling.setState({ busy: false });
  }
}

/** Stripe's customer portal for the account's web subscription (change plan, card, cancel). Null when it can't open. */
export async function openWebPortal(): Promise<boolean> {
  const a = readAccount();
  if (!a) return false;
  try {
    const r = await api<{ url: string }>("/api/billing/stripe/portal/", { token: a.token, body: {} });
    window.location.assign(r.url);
    return true;
  } catch {
    return false;
  }
}

/** Back from Stripe Checkout: the webhook may land a moment after the lifter does, so ask the account a few times. */
export async function waitForWebPro(tries = 6, gapMs = 2000): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    if (await refreshAccountPro().catch(() => false)) return true;
    await new Promise((r) => setTimeout(r, gapMs));
  }
  return false;
}
