// Every fact about another app on the comparison pages lives here, with the page it came from and the date
// it was checked. seo.test.ts fails when any fact is more than 90 days old, so the pages can't go stale
// quietly: re-check the source, update the text and the date. Rules (AGENTS.md, "Comparison pages"): names
// in text only (no logos or screenshots), facts from the apps' own pages and store listings, nothing
// disparaging, and where a source is unclear (several prices listed), say exactly what it shows.

export interface Fact {
  text: string;
  /** The page the fact came from. */
  source: string;
  /** ISO date the source was read. */
  checked: string;
}

export type Topic = "price" | "free" | "plans" | "recovery" | "blocks" | "plates" | "rest" | "social" | "platforms" | "health" | "data" | "ads";

export const TOPIC_LABEL: Record<Topic, string> = {
  price: "Price",
  free: "Free plan",
  plans: "Plans your workouts",
  recovery: "Recovery",
  blocks: "Training blocks and deloads",
  plates: "Plate maths",
  rest: "Rest timer",
  social: "Social",
  platforms: "Platforms",
  health: "Health apps",
  data: "Your data",
  ads: "Ads",
};

/** What Liftsmith does for each topic. Only features that ship. */
export const OURS: Record<Topic, string> = {
  price: "Free plan. Pro is $6.99 a month or $39.99 a year, with a 14-day free trial.",
  free: "The workout logger, plates, rest timer and lock-screen workout, plus every fixed program (5×5, 3×5 and more), free with no limit on workouts or routines.",
  plans: "Pro plans every workout: exercises from your gym's equipment, sets, reps and weights, moved forward each session, with a short reason for each.",
  recovery: "A 3D recovery map of every muscle, and plans only for muscles that have recovered (Pro).",
  blocks: "Training blocks with reps-in-reserve targets that step down each week, then a deload week; an early deload is offered when fatigue builds.",
  plates: "Every barbell weight is one your plates can make, with the plates drawn for each side, free.",
  rest: "Starts itself after each set, counts down on the lock screen (Android notification, iPhone Live Activity) with Log set and +30 s, free.",
  social: "Share a workout as an image or a link someone can open at their own weights. No feed yet.",
  platforms: "Android and iPhone apps (store listings coming soon) and the full app in any browser today. No watch apps yet.",
  health: "Health Connect and Apple Health for weight, height, body fat and resting heart rate; live heart rate from any Bluetooth strap or watch.",
  data: "CSV export and a full backup, and import from other apps' CSV exports. Works offline with no account.",
  ads: "No ads, ever.",
};

export interface Competitor {
  slug: string;
  name: string;
  /** One neutral line on what the app is. */
  summary: string;
  rows: Partial<Record<Topic, Fact[]>>;
  /** When the other app may be the better pick. Fair and specific. */
  theirPick: string;
  /** Where Liftsmith differs most, from the rows above. */
  ourPick: string[];
}

const CHECKED = "2026-11-09";
const f = (text: string, source: string, checked = CHECKED): Fact => ({ text, source, checked });

const FB_APP = "https://apps.apple.com/us/app/fitbod-gym-fitness-planner/id1041517543";
const FB_PLAY = "https://play.google.com/store/apps/details?id=com.fitbod.fitbod";
const FB_SITE = "https://fitbod.me/";
const HV_APP = "https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350";
const HV_PLAY = "https://play.google.com/store/apps/details?id=com.hevy";
const HV_SITE = "https://www.hevyapp.com/";
const ST_APP = "https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577";
const ST_PLAY = "https://play.google.com/store/apps/details?id=io.strongapp.strong";
const ST_SITE = "https://www.strong.app/";
const ST_HELP = "https://help.strongapp.io/article/132-strong-pro";
const GV_APP = "https://apps.apple.com/us/app/gymverse-gym-workout-planner/id1048454034";
const GV_PR = "https://www.prunderground.com/gymverse-launches-199-99-lifetime-membership-as-an-alternative-to-subscriptions/00385099/";

export const COMPETITORS: Competitor[] = [
  {
    slug: "fitbod",
    name: "Fitbod",
    summary: "An adaptive workout planner that builds sessions from your equipment, schedule and recovery.",
    rows: {
      price: [f("The US App Store lists monthly plans at $12.99 and $15.99 and yearly plans at $79.99 and $95.99.", FB_APP)],
      free: [f("Free to download with in-app purchases; the listing mentions a free trial without giving its length.", FB_APP)],
      plans: [f("Builds workouts based on your equipment, schedule and preferences.", FB_SITE)],
      recovery: [f("\"Monitored Recovery\" recommends the muscles to train each session.", FB_SITE)],
      blocks: [f("Lists non-linear periodization.", FB_APP)],
      platforms: [f("iPhone and Apple Watch.", FB_APP), f("Android, with a Wear OS tile.", FB_PLAY)],
      health: [f("Apple Health, Strava and Fitbit integrations.", FB_APP)],
    },
    theirPick: "you want an established adaptive planner with Apple Watch and Wear OS apps today.",
    ourPick: ["A free plan with no limit on workouts, plus free fixed programs", "Pro at $39.99 a year", "Plates drawn for every set, and a lock-screen rest timer", "Blocks with reps-in-reserve targets and planned deloads", "A plain-words reason under every weight"],
  },
  {
    slug: "hevy",
    name: "Hevy",
    summary: "A workout tracker and gym log with routines you build and a social feed.",
    rows: {
      price: [f("The US App Store lists Hevy Pro at $2.99 and $3.99 a month, $23.99 a year and $74.99 lifetime.", HV_APP)],
      free: [f("Free with no ads; Pro adds unlimited routines and custom exercises and your complete training history.", HV_APP)],
      plans: [f("You build your own routines; Pro's Hevy Trainer builds a program from your experience, goal and equipment.", HV_APP)],
      rest: [f("Automatic rest timers.", HV_SITE)],
      social: [f("Follow other lifters, like and comment on workouts, and save their routines.", HV_SITE)],
      platforms: [f("iPhone, iPad and Apple Watch.", HV_APP), f("Android, with Wear OS.", HV_PLAY), f("A web version at hevy.com.", HV_SITE)],
      health: [f("Exports workouts to Apple Health, and syncs to Strava.", HV_APP)],
      ads: [f("\"No ads and free.\"", HV_PLAY)],
    },
    theirPick: "following friends and a social feed matter most to you, or you want a low-cost logger with watch apps.",
    ourPick: ["Workouts planned for you from your equipment and recovery", "Plates drawn for every barbell set", "A 3D recovery map", "Blocks with reps-in-reserve targets and planned deloads", "Import your Hevy CSV export and keep your history"],
  },
  {
    slug: "strong",
    name: "Strong",
    summary: "A long-running workout notebook for logging the routines you choose.",
    rows: {
      price: [f("Strong PRO is $4.99 a month or $29.99 a year in the US.", ST_APP)],
      free: [f("Saves unlimited workouts, limited to 3 custom routines.", ST_APP)],
      plans: [f("A logger for routines you add and choose between.", ST_APP)],
      plates: [f("Plate calculator, listed as a PRO feature.", ST_HELP)],
      rest: [f("Auto countdown rest timer, with Live Activity and Dynamic Island support.", ST_APP)],
      platforms: [f("iPhone, Android and Apple Watch.", ST_SITE)],
      health: [f("Apple Health on iPhone.", ST_APP), f("Google Fit on Android.", ST_PLAY)],
      data: [f("CSV export of all your data.", ST_SITE)],
    },
    theirPick: "you already run your own program and want a simple, proven logger with an Apple Watch app.",
    ourPick: ["Workouts planned for you, or any fixed program free", "No limit on routines on the free plan", "Plate maths free on every set", "Health Connect on Android", "Import your Strong CSV export and keep your history"],
  },
  {
    slug: "gymverse",
    name: "Gymverse",
    summary: "A gym workout planner with personalized plans that adapt as you progress.",
    rows: {
      price: [f("The US App Store lists a $19.99 monthly plan among several premium purchases.", GV_APP), f("A $199.99 lifetime plan was announced in June 2026.", GV_PR)],
      plans: [f("Personalized plans built around your goals, equipment, schedule and experience, with suggested weights, sets, reps and rest.", GV_APP)],
      blocks: [f("Deload weeks and periodization.", GV_APP)],
      platforms: [f("iPhone, iPad and Apple Watch.", GV_APP), f("iOS and Android.", GV_PR)],
      health: [f("Reads age, weight and gender from Apple Health.", GV_APP)],
    },
    theirPick: "you train with an Apple Watch and want its hands-free guidance.",
    ourPick: ["A free plan with every fixed program", "Pro at $6.99 a month or $39.99 a year", "Plates drawn for every barbell set", "A 3D recovery map", "The full app in any browser, plus Android and iPhone"],
  },
];

export const COMPETITOR_BY_SLUG = new Map(COMPETITORS.map((c) => [c.slug, c]));

/** Every fact, for the freshness test. */
export const allFacts = (): Fact[] => COMPETITORS.flatMap((c) => Object.values(c.rows).flat() as Fact[]);

export const TRADEMARKS = `${COMPETITORS.map((c) => c.name).join(", ")} and other names are trademarks of their owners, used here only to identify their apps. Liftsmith isn't affiliated with or endorsed by them.`;
