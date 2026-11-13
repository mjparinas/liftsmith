// Selling the coach plans (src/lib/coachPlans.ts; docs/decisions/money.md "Coach plans"). On Android and iPhone they
// are store subscriptions through RevenueCat, in their own offering (`coach`), next to Pro; on the web they're Stripe
// prices on the same account as Pro (src/server/stripe.ts). Coach and Coach Plus both include Pro.
//
// Moving up from Pro never means paying twice where we can help it: on Google Play the purchase replaces the Pro
// subscription (RevenueCat's product change), on the App Store the coach products share Pro's subscription group, so
// Apple swaps them, and on the web the one Stripe subscription moves to the coach price.
import { create } from "zustand";

import { installId, platformStore, track } from "./analytics";
import { api, AuthError, readAccount, refreshAccountPro } from "./auth";
import { applyCustomerInfo, billingSdk, errorText, money, webBilling } from "./billing";
import { COACH_STORE, type CoachPeriod, type PaidCoachTier } from "./coachPlans";
import { isNative } from "./juice";

export interface CoachOffer {
  tier: PaidCoachTier;
  plan: CoachPeriod;
  /** The store's or Stripe's own price, in the lifter's currency. */
  price: string;
  /** A monthly figure for the annual plan. */
  perMonth?: string;
}

interface CoachBillingState {
  offers: CoachOffer[] | null;
  busy: boolean;
  error: string | null;
}

export const useCoachBilling = create<CoachBillingState>(() => ({ offers: null, busy: false, error: null }));

/** Tests set the plans for sale; nothing else should. */
export function setCoachOffers(offers: CoachOffer[] | null) {
  useCoachBilling.setState({ offers, error: null });
}

const TIERS: PaidCoachTier[] = ["coach", "coachPlus"];
const PLANS: CoachPeriod[] = ["annual", "monthly"];

interface WebCoachPrice {
  tier: PaidCoachTier;
  plan: CoachPeriod;
  amount: number;
  currency: string;
}

/** Stripe's prices as offers, each tier annual first, with a monthly figure for the annual price. */
export function webCoachOffers(prices: WebCoachPrice[]): CoachOffer[] {
  const out: CoachOffer[] = [];
  for (const tier of TIERS)
    for (const plan of PLANS) {
      const p = prices.find((x) => x.tier === tier && x.plan === plan);
      if (!p) continue;
      out.push({
        tier,
        plan,
        price: money(p.amount, p.currency),
        perMonth: plan === "annual" ? money(Math.round(p.amount / 12), p.currency) : undefined,
      });
    }
  return out;
}

/** The coach plans for sale here: the store's `coach` offering on a phone, Stripe's prices on the web. */
export async function loadCoachOffers(): Promise<CoachOffer[] | null> {
  try {
    const sdk = billingSdk();
    if (isNative() && sdk) {
      const all = await sdk.getOfferings();
      const offering = all.all[COACH_STORE.offering];
      if (!offering) {
        useCoachBilling.setState({ offers: null, error: `No "${COACH_STORE.offering}" offering in RevenueCat` });
        return null;
      }
      const offers: CoachOffer[] = [];
      for (const tier of TIERS)
        for (const plan of PLANS) {
          const p = offering.availablePackages.find((x) => x.identifier === COACH_STORE.packages[tier][plan]);
          if (!p) continue;
          offers.push({
            tier,
            plan,
            price: p.product.priceString,
            perMonth: plan === "annual" ? (p.product.pricePerMonthString ?? undefined) : undefined,
          });
        }
      useCoachBilling.setState({ offers, error: offers.length ? null : "The coach offering has no packages for this store" });
      return offers;
    }
    if (webBilling()) {
      const r = await api<{ coach?: WebCoachPrice[] }>("/api/billing/stripe/", { token: readAccount()?.token });
      const offers = webCoachOffers(r.coach ?? []);
      useCoachBilling.setState({ offers, error: null });
      return offers;
    }
  } catch (e) {
    useCoachBilling.setState({ error: errorText(e) });
  }
  return null;
}

/** ok and upgraded: the plan is on (the server hears a moment later). redirect: off to Stripe Checkout. */
export type CoachBuyResult = "ok" | "upgraded" | "cancelled" | "error" | "redirect" | "signIn" | "already";

/** Buys or moves up to a coach plan. */
export async function buyCoach(tier: PaidCoachTier, plan: CoachPeriod): Promise<CoachBuyResult> {
  useCoachBilling.setState({ busy: true });
  try {
    const sdk = billingSdk();
    if (isNative() && sdk) {
      const all = await sdk.getOfferings();
      const p = all.all[COACH_STORE.offering]?.availablePackages.find((x) => x.identifier === COACH_STORE.packages[tier][plan]);
      if (!p) return "error";
      // Google Play: replace the Pro subscription this account pays for, so there's one bill. (Apple does this itself:
      // the coach products are in Pro's subscription group.)
      let change: { oldProductIdentifier: string } | undefined;
      if (platformStore() !== "appstore") {
        const { customerInfo } = await sdk.getCustomerInfo();
        const old = Object.values(customerInfo.entitlements.active).find(
          (e) => e.store === "PLAY_STORE" && e.ownershipType !== "FAMILY_SHARED",
        );
        const id = old?.productIdentifier.split(":")[0];
        if (id && id !== p.product.identifier.split(":")[0]) change = { oldProductIdentifier: id };
      }
      const r = await sdk.purchasePackage({ aPackage: p, ...(change ? { storeProductChangeInfo: change } : {}) });
      applyCustomerInfo(r.customerInfo);
      track("purchase", { plan, store: platformStore(), price: p.product.price, currency: p.product.currencyCode, trial: false });
      track("feature", { name: "coachPlan", detail: tier });
      return "ok";
    }
    if (!webBilling()) return "error";
    const a = readAccount();
    if (!a) return "signIn";
    const r = await api<{ url?: string; upgraded?: boolean }>("/api/billing/stripe/", {
      token: a.token,
      body: { plan, tier, installId: installId() },
    });
    track("feature", { name: "coachPlan", detail: tier });
    if (r.upgraded) {
      await refreshAccountPro().catch(() => false);
      return "upgraded";
    }
    if (!r.url) return "error";
    window.location.assign(r.url);
    return "redirect";
  } catch (e) {
    if (e instanceof AuthError && e.status === 409) return "already";
    if (e instanceof AuthError && e.status === 401) return "signIn";
    const o = e as { userCancelled?: boolean; code?: string } | null;
    return o?.userCancelled || o?.code === "1" ? "cancelled" : "error";
  } finally {
    useCoachBilling.setState({ busy: false });
  }
}
