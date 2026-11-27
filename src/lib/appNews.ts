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
    version: "0.32.0",
    day: "2026-11-28",
    headline: "Exercise charts you can read: tap any session for its number, new bests in gold and an All time range",
    changes: [{ id: "liftCharts", kind: "better", icon: "chart" }],
  },
  {
    version: "0.31.0",
    day: "2026-11-27",
    headline:
      "Workouts on your watch with your phone away, and bar speed from your wrist: your watch measures each rep, buzzes when it's time to end the set and tunes your first weight",
    changes: [
      { id: "watchAlone", kind: "new", icon: "watch", gate: "native" },
      { id: "watchSpeed", kind: "new", icon: "watch", unlock: "more", gate: "native" },
    ],
  },
  {
    version: "0.29.0",
    day: "2026-11-26",
    headline:
      "Coach programs run in phases with a one-tap deload, coaches can set reps and tweak a program for one client, lifters see it on Today, a program can run in order, 13 new stretches, changing, rating and hands-free sets on the watch, today's workout on your watch face, and Machine taken in one tap",
    changes: [
      { id: "watchToday", kind: "new", icon: "watch", gate: "native" },
      { id: "machineTaken", kind: "new", icon: "swap" },
      { id: "watchAdjust", kind: "new", icon: "watch", gate: "native" },
      { id: "watchAuto", kind: "new", icon: "watch", unlock: "more", gate: "native" },
      { id: "programPhases", kind: "new", icon: "layers" },
      { id: "programTweaks", kind: "new", icon: "people" },
      { id: "programAthlete", kind: "new", icon: "calendar" },
      { id: "programInOrder", kind: "new", icon: "layers" },
      { id: "moreStretches", kind: "new", icon: "stretch" },
      { id: "chatInPlace", kind: "better", icon: "chat" },
      { id: "coachNoteTop", kind: "fixed", icon: "chat" },
      { id: "siteLinks", kind: "fixed", icon: "link", gate: "native" },
    ],
  },
  {
    version: "0.20.1",
    day: "2026-11-26",
    headline: "My team for school athletes, and coaches lay out programs on a week and a month with Auto-arrange",
    changes: [
      { id: "myTeam", kind: "new", icon: "trophy" },
      { id: "programBuilder", kind: "new", icon: "calendar" },
      { id: "teamAdd", kind: "fixed", icon: "people" },
      { id: "programDays", kind: "fixed", icon: "layers" },
      { id: "legCurlWeights", kind: "better", icon: "dumbbell" },
    ],
  },
  {
    version: "0.18.1",
    day: "2026-11-25",
    headline: "Stop coaching and turn off its tools from Coaching setup",
    changes: [
      { id: "coachCalendar", kind: "new", icon: "calendar" },
      { id: "stopCoach", kind: "fixed", icon: "people" },
    ],
  },
  {
    version: "0.17.0",
    day: "2026-11-24",
    headline: "Personal trainers, sports coaches and physios each see the tools that fit their role",
    changes: [{ id: "coachRoles", kind: "better", icon: "people" }],
  },
  {
    version: "0.16.0",
    day: "2026-11-24",
    headline: "Assign a season program to clients or a school team, with a calendar of who has lifted",
    changes: [{ id: "assignProgram", kind: "new", icon: "layers" }],
  },
  {
    version: "0.15.0",
    day: "2026-11-23",
    headline: "Amy voice for the voice coach, and check for updates from Settings on the phones",
    changes: [
      { id: "voiceAmy", kind: "new", icon: "speaker" },
      { id: "checkUpdates", kind: "new", icon: "repeat", gate: "native" },
    ],
  },
  {
    version: "0.13.0",
    day: "2026-11-22",
    headline:
      "Gentle rehab without a physio, rehab routines shaped with reps and cues, a choice when a program is taken back, and Pro for active club leaders",
    changes: [
      { id: "rehabSelf", kind: "new", icon: "bandage" },
      { id: "rehabShape", kind: "new", icon: "edit" },
      { id: "rehabEnd", kind: "new", icon: "undo" },
      { id: "campusClubs", kind: "new", icon: "people", unlock: "friends" },
    ],
  },
  {
    version: "0.12.0",
    day: "2026-11-21",
    headline:
      "Pregnancy and postpartum mode, five new training seasons, a number on the app icon, workouts from other apps, form videos, a routine library, team sessions for school coaches, every location of a gym chain, insights for gym owners and Undo after deleting a workout",
    changes: [
      { id: "pregnancy", kind: "new", icon: "heart" },
      { id: "seasonPlan", kind: "new", icon: "medal", unlock: "seasons" },
      { id: "iconBadge", kind: "new", icon: "bell" },
      { id: "outsideWorkouts", kind: "new", icon: "bolt", gate: "native" },
      { id: "formVideos", kind: "new", icon: "camera", gate: "adult" },
      { id: "routineLibrary", kind: "new", icon: "search" },
      { id: "teamSession", kind: "new", icon: "people" },
      { id: "gymChains", kind: "new", icon: "gym" },
      { id: "gymInsights", kind: "new", icon: "chart" },
      { id: "deleteWorkout", kind: "better", icon: "trash" },
      { id: "landmineEnd", kind: "fixed", icon: "dumbbell" },
      { id: "sonosVolume", kind: "better", icon: "volume", unlock: "more" },
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
