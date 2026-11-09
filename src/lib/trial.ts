import type { Profile } from "./types";

// The Pro trial offer (Melvin, 2026-11-09, revenue forecast): every new user sees a Pro trial offer at
// the end of setup, annual plan first; anyone who declines keeps the free logger and 5x5. The length
// comes from the trialDays flag (14 now, A/B 7 vs 14 later). Until native billing lands, starting a
// trial only records the choice, and Pro stays on for everyone.

export type Plan = "annual" | "monthly";
export const PRICES: Record<Plan, { price: string; per: string; note?: string }> = {
  annual: { price: "$39.99", per: "a year", note: "About $3.33 a month" },
  monthly: { price: "$6.99", per: "a month" },
};
const DAY = 86_400_000;

export function startTrial(plan: Plan, days: number, now: number): NonNullable<Profile["pro"]> {
  return { offeredAt: now, plan, trialStartedAt: now, trialDays: days };
}

export function declineTrial(days: number, now: number): NonNullable<Profile["pro"]> {
  return { offeredAt: now, declinedAt: now, trialDays: days };
}

/** Whole days left in the trial, or null when no trial is running. */
export function trialDaysLeft(pro: Profile["pro"], now: number): number | null {
  if (!pro?.trialStartedAt || !pro.trialDays) return null;
  const left = Math.ceil((pro.trialStartedAt + pro.trialDays * DAY - now) / DAY);
  return left > 0 ? left : null;
}
