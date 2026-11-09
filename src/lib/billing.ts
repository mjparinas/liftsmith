// Pro subscriptions through the stores' own billing: Google Play Billing on Android and StoreKit on iOS,
// both through RevenueCat's Capacitor SDK (@revenuecat/purchases-capacitor; Melvin chose it, 2026-11-09).
// RevenueCat never takes the payment: the store's own sheet does, and RevenueCat checks the receipts,
// tracks renewals, refunds, billing retries and family sharing, and answers "is this person Pro?".
//
// Billing is live on a device when the app was built with that platform's RevenueCat key and the SDK
// configured. Until then (every build today, the web app, tests) everyone has Pro and no price is shown,
// because a price with nothing to buy behind it breaks store review and misleads (AGENTS.md "Money").
//
// The last answer is cached in localStorage, so Pro works offline and the first paint after a restart is
// right before the SDK answers. The RevenueCat user id is the analytics install id (a random id, never an
// advertising id), so store server notifications land on the same install in the admin panel.
import { create } from "zustand";
import { installId, platformStore, track } from "./analytics";
import { flag } from "./flags";
import { isNative } from "./juice";
import type { ProState } from "./messages";
import type { Plan } from "./trial";

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
}

export const useBilling = create<BillingState>(() => ({ live: false, ent: null, offers: null, busy: false }));

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

/** Pro on this device: always while billing isn't live, otherwise from the store entitlement. */
export function hasPro(now = Date.now()): boolean {
  const s = useBilling.getState();
  return !s.live || entActive(s.ent, now);
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
export function entFromInfo(info: { entitlements: { all: Record<string, EntInfo | undefined> }; managementURL?: string | null }): Entitlement | null {
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
let sdk: Sdk | null = null;
let packages: Partial<Record<Plan, Pkg>> = {};
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

/** Starts billing on a native app built with a RevenueCat key. Safe to call more than once. */
export async function startBilling(): Promise<void> {
  if (started || !isNative()) return;
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
    await Purchases.addCustomerInfoUpdateListener((info) => setEnt(entFromInfo(info as never)));
    const { customerInfo } = await Purchases.getCustomerInfo();
    setEnt(entFromInfo(customerInfo as never));
    await loadOffers();
  } catch {
    // Offline or the store isn't reachable: keep the cached answer, and try again on the next open.
    started = false;
  }
}

/** The plans for sale, annual first. The trialDays flag (7 or 14) picks a "trial7" offering when one exists. */
export async function loadOffers(): Promise<Offer[] | null> {
  if (!sdk) return null;
  const all = await sdk.getOfferings();
  const offering = (flag("trialDays") === 7 && all.all["trial7"]) || all.current;
  if (!offering) return null;
  packages = { annual: offering.annual ?? undefined, monthly: offering.monthly ?? undefined };
  // iOS knows whether this Apple ID already used the trial; Android only offers a trial to people who can get it.
  let ineligible = new Set<string>();
  if (platformStore() === "appstore") {
    const ids = Object.values(packages).map((p) => p!.product.identifier);
    const r = await sdk.checkTrialOrIntroductoryPriceEligibility({ productIdentifiers: ids });
    ineligible = new Set(Object.entries(r).filter(([, v]) => v.status === 1 || v.status === 3).map(([k]) => k));
  }
  const offers: Offer[] = (["annual", "monthly"] as Plan[]).flatMap((plan) => {
    const p = packages[plan];
    if (!p) return [];
    const pr = p.product;
    return [{
      plan,
      price: pr.priceString,
      perMonth: plan === "annual" ? (pr.pricePerMonthString ?? undefined) : undefined,
      trialDays: ineligible.has(pr.identifier) ? null : trialDaysOf(pr.introPrice),
    }];
  });
  useBilling.setState({ offers });
  return offers;
}

export type BuyResult = "ok" | "cancelled" | "error";

/** Opens the store's own purchase sheet for a plan. */
export async function buy(plan: Plan, from: string): Promise<BuyResult> {
  const p = packages[plan];
  if (!sdk || !p) return "error";
  useBilling.setState({ busy: true });
  try {
    const r = await sdk.purchasePackage({ aPackage: p });
    const ent = entFromInfo(r.customerInfo as never);
    setEnt(ent);
    const store = platformStore();
    if (ent?.trial) track("trial_start", { plan, store });
    else track("purchase", { plan, store, price: p.product.price, currency: p.product.currencyCode, trial: false });
    track("feature", { name: "pro", detail: from });
    return entActive(ent, Date.now()) ? "ok" : "error";
  } catch (e) {
    return (e as { userCancelled?: boolean; code?: string })?.userCancelled || (e as { code?: string })?.code === "1" ? "cancelled" : "error";
  } finally {
    useBilling.setState({ busy: false });
  }
}

/** Restore purchases: asks the store again (a new phone, a reinstall, a family member's plan). */
export async function restore(): Promise<boolean> {
  if (!sdk) return false;
  useBilling.setState({ busy: true });
  try {
    const { customerInfo } = await sdk.restorePurchases();
    const ent = entFromInfo(customerInfo as never);
    setEnt(ent);
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
  return platformStore() === "appstore" ? "https://apps.apple.com/account/subscriptions" : `https://play.google.com/store/account/subscriptions?package=${APP_ID}`;
}

/** How the store sees this lifter, for reminder planning (messages.ts ProState); undefined when the store hasn't said. */
export function storePro(now: number, s: Pick<BillingState, "live" | "ent"> = useBilling.getState()): ProState | undefined {
  if (!s.live || !s.ent) return undefined;
  if (entActive(s.ent, now)) return s.ent.trial && s.ent.expiresAt ? { state: "trial", endsAt: s.ent.expiresAt } : { state: "pro" };
  return s.ent.expiresAt ? { state: "free", since: s.ent.expiresAt } : undefined;
}
