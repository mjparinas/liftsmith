// Coach plans (Melvin, 2026-11-13: "we need to make money but also be user centric"; docs/decisions/money.md "Coach
// plans"). Pro keeps its price and includes coaching up to 3 clients, so any trainer can try it with no risk. Coaches
// who need more pick a plan that grows with their client list: Coach (up to 25 clients) or Coach Plus (no set limit).
// Both include everything in Pro. Clients always train free, high school coaches stay free (school teams), and
// Liftsmith takes nothing from what clients pay their coach (coachPay.ts).
//
// One place for the numbers, read by the server (the client limit on joining), the app (the plan card and its
// sheet) and the website (pricing and coaches pages). The prices people pay are the stores' and Stripe's own; the
// USD figures here are what the website quotes, so change them together with the store consoles and Stripe. The client
// limits for Pro and Coach also have admin flags (coachProClients, coachClients in flags.ts), so they can move without
// a release.

export type CoachTier = "pro" | "coach" | "coachPlus";
export type PaidCoachTier = Exclude<CoachTier, "pro">;
export type CoachPeriod = "monthly" | "annual";

export const COACH_TIERS: readonly CoachTier[] = ["pro", "coach", "coachPlus"];
export const PAID_COACH_TIERS: readonly PaidCoachTier[] = ["coach", "coachPlus"];

/** A ceiling for "no set limit", so one account can't link the whole user base. */
export const UNLIMITED_CLIENTS = 1000;

export const COACH_PLANS = {
  pro: { clients: 3 },
  coach: { clients: 25, usd: { monthly: 19.99, annual: 199.99 } },
  coachPlus: { clients: UNLIMITED_CLIENTS, usd: { monthly: 39.99, annual: 399.99 } },
} as const;

/**
 * Coaches who already had more clients than Pro's limit when coach plans went on keep the old limit for a while, and
 * every client already linked stays linked for good: nobody is cut off. The grace starts when the coachPlans flag
 * was turned on (its updatedAt on the server).
 */
export const GRANDFATHER = { clients: 30, days: 90 } as const;

/** The store and RevenueCat names (docs/decisions/money.md "Coach plans" lists the console steps). */
export const COACH_STORE = {
  /** RevenueCat entitlements. Coach products also carry `pro`; Coach Plus products carry `coach` too. */
  entitlement: { coach: "coach", coachPlus: "coach_plus" },
  /** The RevenueCat offering that holds the four coach packages. */
  offering: "coach",
  /** Custom package identifiers in that offering. */
  packages: {
    coach: { monthly: "coach_monthly", annual: "coach_annual" },
    coachPlus: { monthly: "coach_plus_monthly", annual: "coach_plus_annual" },
  },
} as const satisfies {
  entitlement: Record<PaidCoachTier, string>;
  offering: string;
  packages: Record<PaidCoachTier, Record<CoachPeriod, string>>;
};

const RANK: Record<CoachTier, number> = { pro: 0, coach: 1, coachPlus: 2 };
export const tierRank = (t: CoachTier) => RANK[t];
export const higherTier = (a: CoachTier, b: CoachTier): CoachTier => (RANK[a] >= RANK[b] ? a : b);
export const isCoachTier = (x: unknown): x is CoachTier => x === "pro" || x === "coach" || x === "coachPlus";
export const isPaidCoachTier = (x: unknown): x is PaidCoachTier => x === "coach" || x === "coachPlus";

/**
 * The tier a store purchase gives, from RevenueCat's entitlement ids or, failing those, the product id
 * (Play `coach_plus:annual`, App Store `coach_plus_annual`). Anything else is Pro.
 */
export function tierFromStore(entitlementIds: readonly string[] | null | undefined, productId: string | null | undefined): CoachTier {
  const ids = new Set(entitlementIds ?? []);
  if (ids.has(COACH_STORE.entitlement.coachPlus)) return "coachPlus";
  if (ids.has(COACH_STORE.entitlement.coach)) return "coach";
  const p = (productId ?? "").toLowerCase();
  if (/coach[_-]?plus/.test(p)) return "coachPlus";
  if (/coach/.test(p)) return "coach";
  return "pro";
}

export interface ClientLimits {
  /** Clients with Pro (flag coachProClients). */
  pro: number;
  /** Clients with Coach (flag coachClients). */
  coach: number;
}

export const DEFAULT_LIMITS: ClientLimits = { pro: COACH_PLANS.pro.clients, coach: COACH_PLANS.coach.clients };

/** How many clients a tier may have. */
export function clientLimit(tier: CoachTier, limits: ClientLimits = DEFAULT_LIMITS): number {
  if (tier === "coachPlus") return UNLIMITED_CLIENTS;
  return tier === "coach" ? limits.coach : limits.pro;
}

/** The smallest tier that fits `clients` clients, or null when even Coach Plus can't. */
export function tierFor(clients: number, limits: ClientLimits = DEFAULT_LIMITS): CoachTier | null {
  for (const t of COACH_TIERS) if (clients <= clientLimit(t, limits)) return t;
  return null;
}

/** "$19.99"-style text for the website, from the figures above. */
export const coachUsd = (tier: PaidCoachTier, period: CoachPeriod) => COACH_PLANS[tier].usd[period];
