// The weekly tips emails (Melvin, 2026-11-15: "a series of emails that we can send out on a weekly basis, that doesn't
// already duplicate the 8 days of getting started emails"; docs/decisions/weekly-emails.md). One email a week after
// Getting started, each about one thing the app does, with the real screen in the reader's language. This is the
// order they go out in; the words are in ./text/<lang>.ts under the same ids.
//
// Keep it current (AGENTS.md, Email): a change that ships a brand-new feature appends an email for it here and in
// every text file, marked `fresh` with the day it shipped, so it goes out next to everyone already past Getting
// started. `weekly.test.ts` fails when a language is missing an email or a line.

/** Who an email is for. Lifters is everyone; the others only go to accounts in that role (remindersDb.ts roles). */
export type Audience = "lifter" | "coach" | "physio" | "school" | "gym";
export type Role = Exclude<Audience, "lifter">;

/** What it's about: free, Pro, free with a Pro part, or a Labs experiment (Labs is Pro). */
export type Tier = "free" | "pro" | "both" | "lab";

export interface WeeklyEmail {
  id: string;
  audience: Audience;
  tier: Tier;
  /** The screen the button opens (an app route, with its argument). */
  route: string;
  /** A "Did you know" round-up of lesser-known settings, rather than one feature. */
  roundup?: boolean;
  /** Not sent to accounts in these roles (a lifter email that would only repeat what they already do). */
  notFor?: Role[];
  /** Waits until this admin flag is on (coach plans aren't on sale yet). */
  needsFlag?: "coachPlans";
  /** A brand-new feature (the day it shipped, ISO): sent next to everyone already past Getting started. */
  fresh?: string;
  /** No Pro line at the end (coach plans, which have prices of their own). */
  plain?: boolean;
  /** False when the screen can't be shown without someone's account (coaching, Friends): the email goes without one. */
  shot?: false;
}

const L = (id: string, tier: Tier, route: string, more: Partial<WeeklyEmail> = {}): WeeklyEmail => ({
  id,
  audience: "lifter",
  tier,
  route,
  ...more,
});
const D = (id: string, route: string): WeeklyEmail => ({ id, audience: "lifter", tier: "free", route, roundup: true });
const R = (id: string, audience: Role, tier: Tier, route: string, more: Partial<WeeklyEmail> = {}): WeeklyEmail => ({
  id,
  audience,
  tier,
  route,
  ...more,
});

export const WEEKLY: WeeklyEmail[] = [
  L("gym-setup", "free", "gym"),
  L("import", "free", "settings/data"),
  R("coach-clients", "coach", "pro", "trainer", { shot: false }),
  L("likes", "free", "training"),
  L("todays-call", "both", "today"),
  R("gym-page", "gym", "free", "gym", { shot: false }),
  L("short-on-time", "both", "today"),
  L("adaptive", "both", "today"),
  L("friends-feed", "free", "friends", { shot: false }),
  D("dyk-workout", "settings/workout"),
  R("physio-rehab", "physio", "pro", "trainer", { shot: false }),
  L("classic-programs", "free", "programs"),
  L("warm-up", "free", "stretch"),
  R("school-teams", "school", "free", "trainer", { shot: false }),
  L("health-apps", "free", "health"),
  L("library", "free", "exercises"),
  R("coach-chat", "coach", "pro", "trainer/messages", { shot: false }),
  L("calculators-lifting", "free", "tools/onerm"),
  L("blocks", "pro", "settings/training"),
  L("training-now", "free", "friends", { shot: false }),
  D("dyk-plan", "training"),
  R("gym-staff", "gym", "free", "gym", { shot: false }),
  L("injury", "free", "injuries"),
  L("body", "both", "photos"),
  R("coach-business", "coach", "pro", "trainer/schedule", { shot: false }),
  L("gym-finder", "free", "gym"),
  L("heart-rate", "free", "connections"),
  L("plateau", "pro", "stats"),
  L("routines", "free", "programs"),
  D("dyk-battery", "settings/look"),
  R("coach-nutrition", "coach", "pro", "trainer", { shot: false }),
  L("watches", "free", "connections"),
  L("challenges", "free", "friends", { shot: false }),
  L("labs-camera", "lab", "settings/labs"),
  L("calculators-body", "free", "tools/tdee"),
  R("coach-directory", "coach", "pro", "trainer/setup", { shot: false }),
  L("food", "free", "health"),
  L("why-pro", "pro", "pro"),
  L("history", "free", "stats"),
  D("dyk-yours", "settings/look"),
  L("cardio", "both", "today"),
  L("more-programs", "free", "programs"),
  L("gym-pages", "free", "gym", { shot: false }),
  R("coach-plans", "coach", "pro", "trainer/plan", { needsFlag: "coachPlans", plain: true, shot: false }),
  L("stats", "both", "stats"),
  L("labs-coach", "lab", "settings/labs"),
  L("health-twin", "free", "health"),
  L("outside-app", "free", "settings/reminders"),
  D("dyk-privacy", "settings/data"),
  L("invite", "free", "friends", { shot: false }),
  L("splits", "pro", "settings/training"),
  L("set-types", "free", "training"),
  L("find-coach", "free", "trainer", { notFor: ["coach", "physio", "school"], shot: false }),
  L("labs-hands-off", "lab", "settings/labs"),
  L("rest", "free", "settings/workout"),
  L("goal-planner", "pro", "stats"),
  D("dyk-fun", "achievements"),
  L("profile", "free", "friends", { shot: false }),
  L("labs-gear", "lab", "settings/labs"),
  L("celebrate", "free", "recap"),
  L("make-it-yours", "free", "settings/look"),
  L("accessibility", "free", "settings/accessibility"),
  L("desktop", "free", "today"),
  L("your-data", "free", "settings/data"),
  D("dyk-help", "settings"),
  L("body-3d", "both", "health"),
  L("travel", "free", "gym"),
  L("anniversary", "free", "stats"),
  L("whats-new", "free", "today"),
];

/** Pro's prices, as the emails say them (docs/decisions/money.md). */
export const PRO_PRICE = { monthly: "$6.99", annual: "$39.99" } as const;
