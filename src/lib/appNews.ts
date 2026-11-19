import type { IconName } from "@/components/app/icons";

import type { UnlockId } from "./unlocks";

// What's new in the app (Melvin, 2026-11-19: "add similar whats new button for the latest changes";
// docs/decisions/whats-new.md). One entry per release, newest first: each change is a kind (New, Better, Fixed),
// an icon and its words in the language catalogues (`wn.c.<id>.title` and `wn.c.<id>.body` in
// src/locales/text/wn.ts, all ten languages). Settings › Help › Version opens the newest release, and Today shows
// a small note once after an update (WhatsNew.tsx). The public /whats-new/ page reads the same releases in English
// (src/lib/whatsNew.ts), so one list feeds both.
//
// A change that waits for an unlock (unlocks.ts) names it, and a lifter who hasn't opened it yet doesn't see it:
// the note never advertises what a new lifter can't reach. `gate` hides it where it can't apply.

export type NewsKind = "new" | "better" | "fixed";
/** Where a change applies: `community` while the community board is on, `adult` not for under-18s, `native` in the phone apps. */
export type NewsGate = "community" | "adult" | "native";

export interface AppChange {
  /** Unique across every release; its words are `wn.c.<id>.title` and `.body`. */
  id: string;
  kind: NewsKind;
  icon: IconName;
  unlock?: UnlockId;
  gate?: NewsGate;
}

export interface AppRelease {
  /**
   * The app version it ships as (package.json, docs/decisions/app-versions.md). A feature bumps the minor version
   * and a fix the patch; several bumps between two promotions share one release, which takes the newest version.
   */
  version: string;
  /** The day it reached the apps (ISO, Pacific time): also the anchor on /whats-new/. */
  day: string;
  /** English, for the website's page only. */
  headline: string;
  changes: readonly AppChange[];
}

export const KINDS: readonly NewsKind[] = ["new", "better", "fixed"];

/**
 * Newest first. Add a release at the top when a promotion ships something a lifter will notice, with the version it
 * ships as; a change landing before that promotion joins the top release and moves its version up.
 */
export const RELEASES: readonly AppRelease[] = [
  {
    version: "0.5.0",
    day: "2026-11-21",
    headline: "Five new training seasons, a number on the app icon and team sessions for school coaches",
    changes: [
      { id: "seasonPlan", kind: "new", icon: "medal", unlock: "seasons" },
      { id: "iconBadge", kind: "new", icon: "bell" },
      { id: "teamSession", kind: "new", icon: "people" },
    ],
  },
  {
    version: "0.2.0",
    day: "2026-11-20",
    headline: "Open now in the gym finder, a map-first finder and search in Settings",
    changes: [
      { id: "openNow", kind: "new", icon: "clock" },
      { id: "settingsSearch", kind: "new", icon: "search" },
      { id: "mapFinder", kind: "better", icon: "pin" },
    ],
  },
  {
    version: "0.1.0",
    day: "2026-11-19",
    headline: "Training seasons, a community board, club chat, automatic supersets and ten languages",
    changes: [
      { id: "seasons", kind: "new", icon: "medal", unlock: "seasons" },
      { id: "community", kind: "new", icon: "lightbulb", gate: "community" },
      { id: "crew", kind: "new", icon: "people", unlock: "friends", gate: "adult" },
      { id: "classes", kind: "new", icon: "calendar" },
      { id: "faults", kind: "new", icon: "eye" },
      { id: "widgets", kind: "new", icon: "phone", gate: "native" },
      { id: "supersets", kind: "better", icon: "layers", unlock: "more" },
      { id: "fitTests", kind: "better", icon: "chart" },
      { id: "getReady", kind: "better", icon: "stretch" },
      { id: "machineSteps", kind: "better", icon: "dumbbell" },
      { id: "figures", kind: "better", icon: "repeat" },
      { id: "languages", kind: "better", icon: "globe" },
      { id: "checkins", kind: "better", icon: "camera" },
      { id: "jumps", kind: "fixed", icon: "bolt" },
      { id: "sides", kind: "fixed", icon: "sides" },
    ],
  },
];

export const LATEST: AppRelease = RELEASES[0]!;

/** What this lifter can see right now. */
export interface NewsView {
  unlocked: (id: UnlockId) => boolean;
  community: boolean;
  teen: boolean;
  native: boolean;
}

export function visibleChanges(release: AppRelease, v: NewsView): AppChange[] {
  return release.changes.filter((c) => {
    if (c.unlock && !v.unlocked(c.unlock)) return false;
    if (c.gate === "community") return v.community;
    if (c.gate === "adult") return !v.teen;
    if (c.gate === "native") return v.native;
    return true;
  });
}

export function countKinds(changes: readonly AppChange[]): Record<NewsKind, number> {
  const n: Record<NewsKind, number> = { new: 0, better: 0, fixed: 0 };
  for (const c of changes) n[c.kind]++;
  return n;
}

/** The newest release this device has seen, on the device only (the `liftsmith.` prefix is wiped on sign out). */
export const SEEN_KEY = "liftsmith.whatsNew";

export function readSeen(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

export function markSeen(day: string = LATEST.day): void {
  try {
    localStorage.setItem(SEEN_KEY, day);
  } catch {
    // Private mode: the note may show again, which is harmless.
  }
}

/**
 * What Today does with the newest release: `show` the note once to a lifter who has trained and not seen it,
 * `mark` it seen for a lifter with no workouts yet (everything is new to them, so there's nothing to announce),
 * or `none`. A first setup marks it too (Onboarding.tsx).
 */
export function autoAction(seen: string | null, latest: string, workouts: number): "show" | "mark" | "none" {
  if (seen !== null && seen >= latest) return "none";
  return workouts > 0 ? "show" : "mark";
}
