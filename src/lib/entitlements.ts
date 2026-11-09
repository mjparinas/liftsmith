// What the lifter's plan unlocks. Until billing lands (Play Billing and StoreKit), everyone has Pro, so
// the paywall drops in here without reworking screens (AGENTS.md "Money").
//
// Free: the logger, plate graphic, rest timer, live notification, classic 5x5, and on the web dashboard
// the overview, calendar, history, PR list, trophies, past-workout logging and share links.
// Pro: adaptive programming, the recovery map and advanced stats (on the dashboard: one-rep max trends,
// weekly sets per muscle against the target, and per-exercise detail).

// Programs (Melvin, 2026-11-09): every fixed program (classic 5x5, novice 3x5, 5x5 plus arms,
// ramping 5x5, tiered, training max waves, bodyweight skills) is free; the adaptive splits
// (push/pull/legs, upper/lower) are Pro.
// Coaching (Melvin picked them, 2026-11-09): "why this weight", workout remix links, what to buy next and
// machine settings are free; changing the plan mid-workout, the plateau detective and the goal-date
// planner are Pro.
export type Feature = "advancedStats" | "adaptiveSplits" | "replan" | "plateauDetective" | "goalPlanner";

const PRO_FEATURES: ReadonlySet<Feature> = new Set(["advancedStats", "adaptiveSplits", "replan", "plateauDetective", "goalPlanner"]);

/** Whether the lifter has Pro. Always true until billing lands. */
export function isPro(): boolean {
  return true;
}

export function can(feature: Feature, pro = isPro()): boolean {
  return !PRO_FEATURES.has(feature) || pro;
}
