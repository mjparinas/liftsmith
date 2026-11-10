import { hasPro } from "./billing";

// What the lifter's plan unlocks (AGENTS.md "Money"). Pro comes from the store subscription (billing.ts);
// while billing isn't live on a device (the web app, builds without a RevenueCat key), everyone has Pro.
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
// Adaptive programming (the generator, RIR blocks, deloads and readiness calls) and the recovery map are Pro;
// without Pro, Today follows a free fixed program (store.ts applyAccess).
// Health twin (Melvin, 2026-11-09): seeing every number, trend and reason is free; sleep, HRV, resting
// heart rate and breathing rate changing today's call ("healthReadiness") is Pro.
// Camera rep counting on the workout screen ("autoCount", 2026-11-09) is Pro.
// One line per feature, so two changes adding one don't touch the same line. Every feature listed is Pro.
const PRO_FEATURES = [
  "adaptive",
  "recoveryMap",
  "advancedStats",
  "adaptiveSplits",
  "replan",
  "plateauDetective",
  "goalPlanner",
  "healthReadiness",
  "autoCount",
] as const;
export type Feature = (typeof PRO_FEATURES)[number];
const PRO: ReadonlySet<Feature> = new Set(PRO_FEATURES);

/** Whether the lifter has Pro: a store subscription or trial, or billing not live here. */
export function isPro(): boolean {
  return hasPro();
}

export function can(feature: Feature, pro = isPro()): boolean {
  return !PRO.has(feature) || pro;
}
