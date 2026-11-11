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

export type Topic =
  "price" | "free" | "plans" | "recovery" | "blocks" | "plates" | "rest" | "social" | "platforms" | "health" | "data" | "ads";

export const TOPIC_LABEL: Record<Topic, string> = {
  price: "Price",
  free: "Free plan",
  plans: "Plans your workouts",
  recovery: "Recovery",
  blocks: "Training blocks and deloads",
  plates: "Plate math",
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
  plans:
    "Pro plans every workout: exercises from your gym's equipment, sets, reps and weights, moved forward each session, with a short reason for each.",
  recovery: "A 3D recovery map of every muscle, and plans only for muscles that have recovered (Pro).",
  blocks:
    "Training blocks with reps-in-reserve targets that step down each week, then a deload week; an early deload is offered when fatigue builds.",
  plates: "Every barbell weight is one your plates can make, with the plates drawn for each side, free.",
  rest: "Starts itself after each set, counts down on the lock screen (Android notification, iPhone Live Activity) with Log set and +30 s, free.",
  social: "Share a workout as an image or a link someone can open at their own weights. No feed yet.",
  platforms:
    "Android and iPhone apps (store listings coming soon), Wear OS and Apple Watch apps for the live workout, and the full app in any browser today.",
  health:
    "Health Connect and Apple Health for weight, height, body fat and resting heart rate; live heart rate from any Bluetooth strap or watch.",
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

/** The newest check date among a competitor's facts (ISO), for the page's dates. */
export const lastChecked = (c: Competitor) =>
  Object.values(c.rows)
    .flat()
    .reduce((d, x) => (x && x.checked > d ? x.checked : d), "");
/** The year in the page title ("Liftsmith vs Hevy (2026)"): the year its facts were last checked. */
export const checkedYear = (c: Competitor) => lastChecked(c).slice(0, 4);
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
const SL_APP = "https://apps.apple.com/us/app/stronglifts-5x5-workout-plan/id488580022";
const SL_PLAY = "https://play.google.com/store/apps/details?id=com.stronglifts.app";
const SL_SITE = "https://stronglifts.com/";
const JF_APP = "https://apps.apple.com/us/app/jefit-workout-plan-gym-tracker/id449810000";
const JF_PLAY = "https://play.google.com/store/apps/details?id=je.fit";
const JF_SITE = "https://www.jefit.com/";
const AP_APP = "https://apps.apple.com/us/app/gym-workout-alpha-progression/id1462277793";
const AP_PLAY = "https://play.google.com/store/apps/details?id=com.alphaprogression.alphaprogression";
const AP_SITE = "https://alphaprogression.com/en";
const BC_APP = "https://apps.apple.com/us/app/boostcamp-workout-tracker/id1529354455";
const BC_PLAY = "https://play.google.com/store/apps/details?id=com.bpmhealth.boostcamp";
const BC_SITE = "https://www.boostcamp.app/";
/** The four apps added on this date (batch 4 of the SEO plan). */
const CHECKED_2 = "2026-11-11";
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
      recovery: [f('"Monitored Recovery" recommends the muscles to train each session.', FB_SITE)],
      blocks: [f("Lists non-linear periodization.", FB_APP)],
      platforms: [f("iPhone and Apple Watch.", FB_APP), f("Android, with a Wear OS tile.", FB_PLAY)],
      health: [f("Apple Health, Strava and Fitbit integrations.", FB_APP)],
    },
    theirPick: "you want an established adaptive planner with Apple Watch and Wear OS apps today.",
    ourPick: [
      "A free plan with no limit on workouts, plus free fixed programs",
      "Pro at $39.99 a year",
      "Plates drawn for every set, and a lock-screen rest timer",
      "Blocks with reps-in-reserve targets and planned deloads",
      "A plain-words reason under every weight",
    ],
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
      platforms: [
        f("iPhone, iPad and Apple Watch.", HV_APP),
        f("Android, with Wear OS.", HV_PLAY),
        f("A web version at hevy.com.", HV_SITE),
      ],
      health: [f("Exports workouts to Apple Health, and syncs to Strava.", HV_APP)],
      ads: [f('"No ads and free."', HV_PLAY)],
    },
    theirPick: "following friends and a social feed matter most to you, or you want a low-cost logger with watch apps.",
    ourPick: [
      "Workouts planned for you from your equipment and recovery",
      "Plates drawn for every barbell set",
      "A 3D recovery map",
      "Blocks with reps-in-reserve targets and planned deloads",
      "Import your Hevy CSV export and keep your history",
    ],
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
    ourPick: [
      "Workouts planned for you, or any fixed program free",
      "No limit on routines on the free plan",
      "Plate math free on every set",
      "Health Connect on Android",
      "Import your Strong CSV export and keep your history",
    ],
  },
  {
    slug: "gymverse",
    name: "Gymverse",
    summary: "A gym workout planner with personalized plans that adapt as you progress.",
    rows: {
      price: [
        f("The US App Store lists a $19.99 monthly plan among several premium purchases.", GV_APP),
        f("A $199.99 lifetime plan was announced in June 2026.", GV_PR),
      ],
      plans: [
        f(
          "Personalized plans built around your goals, equipment, schedule and experience, with suggested weights, sets, reps and rest.",
          GV_APP,
        ),
      ],
      blocks: [f("Deload weeks and periodization.", GV_APP)],
      platforms: [f("iPhone, iPad and Apple Watch.", GV_APP), f("iOS and Android.", GV_PR)],
      health: [f("Reads age, weight and gender from Apple Health.", GV_APP)],
    },
    theirPick: "you train with an Apple Watch and want its hands-free guidance.",
    ourPick: [
      "A free plan with every fixed program",
      "Pro at $6.99 a month or $39.99 a year",
      "Plates drawn for every barbell set",
      "A 3D recovery map",
      "The full app in any browser, plus Android and iPhone",
    ],
  },
  {
    slug: "stronglifts",
    name: "StrongLifts",
    summary: "An app built around one classic beginner program: three lifts a session, five sets of five, weight added each time.",
    rows: {
      price: [
        f(
          "The US App Store lists Pro at $4.99 a week, $11.99 a month, $29.99 a quarter and $59.99 a year, and five-year plans at $199.99 and $239.99.",
          SL_APP,
          CHECKED_2,
        ),
      ],
      free: [
        f(
          "Free to download, but the listing says the app requires a subscription to use, with a 7-day free trial of the yearly plan.",
          SL_APP,
          CHECKED_2,
        ),
        f("The programs themselves are published free on its website.", SL_SITE, CHECKED_2),
      ],
      plans: [f("Plans every exercise, set and weight, with automated progression.", SL_APP, CHECKED_2)],
      rest: [f("Timers, including rest timing from an Apple Watch.", SL_APP, CHECKED_2)],
      platforms: [f("iPhone, iPad and Apple Watch.", SL_APP, CHECKED_2), f("Android.", SL_PLAY, CHECKED_2)],
    },
    theirPick: "you want to run that exact program, as its author wrote it, in the app made for it.",
    ourPick: [
      "A classic 5×5 and other fixed programs free, with no subscription",
      "Plates drawn for every barbell set",
      "Workouts planned from your equipment and recovery when you outgrow a fixed program (Pro)",
      "Health Connect and Apple Health",
      "Pro at $39.99 a year",
    ],
  },
  {
    slug: "jefit",
    name: "JEFIT",
    summary: "A long-running workout planner and gym log with a large routine library and a member community.",
    rows: {
      price: [
        f(
          "The listing gives Elite at $12.99 a month or $69.99 a year; its in-app purchase list also shows legacy and discounted prices.",
          JF_APP,
          CHECKED_2,
        ),
      ],
      free: [
        f(
          "A free tracker and planner; Elite adds an adaptive AI coach, an analytics dashboard, an elite routine library and pro training tools.",
          JF_APP,
          CHECKED_2,
        ),
      ],
      plans: [
        f("Adaptive Plans build a plan from your goal, level and equipment and suggest the next weight and reps.", JF_APP, CHECKED_2),
      ],
      blocks: [f("Its release notes describe periodization, with weight progressions paused in deload weeks.", JF_APP, CHECKED_2)],
      rest: [f("A custom rest timer, shown on the lock screen.", JF_APP, CHECKED_2)],
      social: [f("A community of members, and workouts shared as cards.", JF_SITE, CHECKED_2)],
      platforms: [
        f("iPhone and Apple Watch.", JF_APP, CHECKED_2),
        f("Android, with Wear OS.", JF_PLAY, CHECKED_2),
        f("Sign-in on the web.", JF_SITE, CHECKED_2),
      ],
    },
    theirPick: "you want a big routine library and a community, with Apple Watch and Wear OS apps.",
    ourPick: [
      "A free plan with every fixed program",
      "Pro at $39.99 a year",
      "Plates drawn for every barbell set",
      "A 3D recovery map",
      "A plain-words reason under every weight",
    ],
  },
  {
    slug: "alpha-progression",
    name: "Alpha Progression",
    summary: "A gym tracker that recommends the weight and reps for each set and plans training in blocks.",
    rows: {
      price: [
        f(
          "$12.99 a month or $79.99 a year in the US, with a 14-day free trial of the annual plan for eligible new customers.",
          AP_SITE,
          CHECKED_2,
        ),
      ],
      free: [
        f(
          "Free logging with no account: unlimited logging, exercise videos, your own plans, a rest timer, records and CSV export.",
          AP_APP,
          CHECKED_2,
        ),
      ],
      plans: [f("Pro builds a plan around your gym's equipment and recommends the weight and reps for every set.", AP_APP, CHECKED_2)],
      blocks: [f("Periodization and deloads, stepping sets and reps in reserve week by week (Pro).", AP_APP, CHECKED_2)],
      plates: [f("A plate calculator, listed as Pro.", AP_APP, CHECKED_2)],
      rest: [f("A rest timer with a lock-screen Live Activity, free.", AP_APP, CHECKED_2)],
      platforms: [f("iPhone (the App Store lists it for iPhone only).", AP_APP, CHECKED_2), f("Android.", AP_PLAY, CHECKED_2)],
      health: [f("Apple Health and Health Connect.", AP_SITE, CHECKED_2)],
      data: [f("CSV export.", AP_APP, CHECKED_2)],
      ads: [f("No ads.", AP_APP, CHECKED_2)],
    },
    theirPick: "you want reps-in-reserve blocks and a large library of exercise videos, and a phone is all you need.",
    ourPick: [
      "Plates drawn for every set on the free plan",
      "Pro at $6.99 a month or $39.99 a year",
      "A 3D recovery map, and plans that train what has recovered",
      "Wear OS and Apple Watch apps",
      "The full app in any browser",
    ],
  },
  {
    slug: "boostcamp",
    name: "Boostcamp",
    summary: "A workout tracker built around a large library of programs, many written by well-known coaches.",
    rows: {
      price: [
        f(
          "The US App Store lists Boostcamp Pro at several prices from $11.99 to $79.99, plus a $48.99 limited-time offer, without plan lengths.",
          BC_APP,
          CHECKED_2,
        ),
      ],
      free: [f("Free to start with no ads; the program library is free.", BC_APP, CHECKED_2)],
      plans: [
        f("Over 11,000 programs, and an AI coach that builds a multi-week program from a short questionnaire.", BC_APP, CHECKED_2),
        f("Auto progression and personalized programs are marked Pro.", BC_SITE, CHECKED_2),
      ],
      blocks: [f("Coach-designed plans with progressions, periodization and deloads.", BC_APP, CHECKED_2)],
      plates: [f("A plate calculator.", BC_APP, CHECKED_2)],
      rest: [f("A rest timer.", BC_APP, CHECKED_2)],
      social: [f("A community feed to follow friends and share workouts.", BC_APP, CHECKED_2)],
      platforms: [
        f("iPhone and iPad.", BC_APP, CHECKED_2),
        f("Android.", BC_PLAY, CHECKED_2),
        f("Its FAQ says there is no Apple Watch or Wear OS app yet.", BC_SITE, CHECKED_2),
      ],
      health: [f("Syncs workouts and body weight with Apple Health.", BC_APP, CHECKED_2)],
      ads: [f("No ads.", BC_APP, CHECKED_2)],
    },
    theirPick: "you want to follow a named coach's program from a big library, with a social feed.",
    ourPick: [
      "Workouts planned each day from your equipment and recovery",
      "Wear OS and Apple Watch apps",
      "Health Connect on Android",
      "A 3D recovery map",
      "Pro at $39.99 a year",
    ],
  },
];

export const COMPETITOR_BY_SLUG = new Map(COMPETITORS.map((c) => [c.slug, c]));

/** Every fact, for the freshness test. */
export const allFacts = (): Fact[] => COMPETITORS.flatMap((c) => Object.values(c.rows).flat() as Fact[]);

export const TRADEMARKS = `${COMPETITORS.map((c) => c.name).join(", ")} and other names are trademarks of their owners, used here only to identify their apps. Liftsmith isn't affiliated with or endorsed by them.`;

/** "<App> alternatives" pages (/alternatives/<slug>/): why someone might look elsewhere, and what Liftsmith offers
 * them in particular. The other apps' entries come from the facts above. */
export interface Alternative {
  slug: string;
  /** Finishes "If you …": what the reader is likely after. */
  reason: string;
  /** Liftsmith's entry, for this reader. Only features that ship. */
  pitch: string;
}

export const ALTERNATIVES: Alternative[] = [
  {
    slug: "fitbod",
    reason: "want a free plan, a lower price, or a different approach",
    pitch:
      "Adaptive planning from your equipment and recovery, with training blocks that step reps in reserve down each week and end in a deload, plates drawn for every barbell set, a lock-screen rest timer and a 3D recovery map. The logger and every fixed program are free; Pro is $6.99 a month or $39.99 a year.",
  },
  {
    slug: "hevy",
    reason: "would rather the app planned your workouts than log the ones you build, or want plates and recovery built in",
    pitch:
      "A logger that fills itself in: Pro plans each workout from your gym's equipment and what has recovered, with the weight and reps for every set and a reason for each. Plates are drawn for every barbell set and the rest timer runs on the lock screen, free. Your Hevy CSV export imports in a few minutes.",
  },
  {
    slug: "strong",
    reason: "want more than a notebook: planned workouts, free plate math, or no limit on routines",
    pitch:
      "Free with no limit on routines, with plates drawn for every barbell set and a lock-screen rest timer. Every fixed program is free, and Pro plans each workout from your equipment and recovery. Your Strong CSV export imports in a few minutes.",
  },
  {
    slug: "stronglifts",
    reason: "want a classic 5×5 without a subscription, or a plan that keeps going after the beginner months",
    pitch:
      "A classic 5×5 and other fixed programs are free, with plates drawn for every set and weight added when you hit your reps. When linear gains slow down, Pro switches to blocks with planned deloads and plans each workout from your recovery.",
  },
];
export const ALTERNATIVE_BY_SLUG = new Map(ALTERNATIVES.map((a) => [a.slug, a]));
