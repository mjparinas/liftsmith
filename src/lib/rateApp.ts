"use client";

// Asks for a store rating at a happy moment (growth plan item 1, Melvin 2026-11-12; docs/decisions/growth.md).
// The stores' own prompt only: Play In-App Review on Android (StoreReviewPlugin.java), SKStoreReviewController
// on iOS (StoreReviewPlugin in DelightPlugins.swift). Nothing on the web, which has no store. The stores decide
// whether the prompt actually shows and never tell us, so we only remember that we asked. We never ask for a
// good rating, never reward one, and never ask during a set: the Done screen calls this after the workout ends.
import { isNative } from "./juice";

const KEY = "liftsmith.ratingAsked";
const DAY = 86_400_000;
/** Earliest ask: a week after the first workout, and three workouts in. */
export const RATING_MIN_DAYS = 7;
export const RATING_MIN_WORKOUTS = 3;
/** At most once every 90 days (Apple shows it at most three times a year anyway). */
export const RATING_GAP_DAYS = 90;

export interface RatingMoment {
  /** Finished workouts, this one included. */
  workouts: number;
  /** Start of the first workout ever. */
  firstAt: number;
  /** New personal bests in this workout. */
  prs: number;
  levelUp: boolean;
  /** Badges earned in this workout. */
  badges: number;
  /** When we last asked, if ever. */
  lastAsked: number | null;
  now: number;
}

/** True when this finished workout is a good moment to ask: well into using the app, and something just went well. */
export function shouldAskRating(m: RatingMoment): boolean {
  if (m.workouts < RATING_MIN_WORKOUTS) return false;
  if (m.now - m.firstAt < RATING_MIN_DAYS * DAY) return false;
  if (m.lastAsked != null && m.now - m.lastAsked < RATING_GAP_DAYS * DAY) return false;
  return m.prs > 0 || m.levelUp || m.badges > 0;
}

export function lastRatingAsk(): number | null {
  try {
    const v = Number(localStorage.getItem(KEY));
    return v > 0 ? v : null;
  } catch {
    return null;
  }
}

type Plugin = { request(): Promise<unknown> };
const plugin = (): Plugin | undefined =>
  typeof window !== "undefined"
    ? (window as unknown as { Capacitor?: { Plugins?: { StoreReview?: Plugin } } }).Capacitor?.Plugins?.StoreReview
    : undefined;

/** Shows the store's rating prompt if the moment is right. Returns whether it asked. */
export async function maybeAskRating(m: Omit<RatingMoment, "lastAsked">): Promise<boolean> {
  const p = plugin();
  if (!p || !isNative()) return false;
  if (!shouldAskRating({ ...m, lastAsked: lastRatingAsk() })) return false;
  try {
    localStorage.setItem(KEY, String(m.now));
  } catch {
    // Without storage we could ask every workout, so don't ask at all.
    return false;
  }
  try {
    await p.request();
    return true;
  } catch {
    return false;
  }
}
