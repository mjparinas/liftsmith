// What the lifter's plan unlocks. Until billing lands (Play Billing and StoreKit), everyone has Pro, so
// the paywall drops in here without reworking screens (AGENTS.md "Money").
//
// Free: the logger, plate graphic, rest timer, live notification, classic 5x5, and on the web dashboard
// the overview, calendar, history, PR list, trophies, past-workout logging and share links.
// Pro: adaptive programming, the recovery map and advanced stats (on the dashboard: one-rep max trends,
// weekly sets per muscle against the target, and per-exercise detail).

export type Feature = "advancedStats";

const PRO_FEATURES: ReadonlySet<Feature> = new Set(["advancedStats"]);

/** Whether the lifter has Pro. Always true until billing lands. */
export function isPro(): boolean {
  return true;
}

export function can(feature: Feature, pro = isPro()): boolean {
  return !PRO_FEATURES.has(feature) || pro;
}
