// The public features page (/features/): every feature of the app, what it connects to, and what's newest.
// One list, so the page can't drift from itself: the groups below, the connections table and the "Newest"
// section all come from here (the newest are the features with the latest `added` days).
//
// Keep it current (AGENTS.md "Features page", Melvin 2026-11-12: "keep it up to date with all new features"):
// a change that adds, removes, renames or moves a feature between Free, Pro and Labs, or adds a connection, a
// device or a platform, updates this file in the same change. `features.test.ts` fails when a lab, a Pro
// feature, a cloud service or an import source has no entry here.
//
// Only what a lifter can use today, in plain words. A connection we've built but can't switch on yet (keys, the other
// company's approval) is "investigating" (Melvin, 2026-11-12: not even sure we'll get approval); one waiting only on
// a store listing is "soon". Never
// "yes" (docs/decisions/connected-apps.md), and nothing names an app's internals.
import type { Feature as ProKey } from "@/lib/entitlements";
import type { LabFlag } from "@/lib/labs";

/** Free; Pro; free with a Pro part; or a Labs experiment (Labs is Pro). */
export type Tier = "free" | "pro" | "both" | "lab";

export const TIER_LABEL: Record<Tier, string> = { free: "Free", pro: "Pro", both: "Free + Pro", lab: "Labs (Pro)" };

/** Where a feature runs: every app (Android, iOS and the web app), or the Android and iOS apps only. */
export type Where = "all" | "phones";

export const WHERE_LABEL: Record<Where, string> = { all: "Android, iPhone and web", phones: "Android and iPhone apps" };

export interface SiteFeature {
  id: string;
  name: string;
  /** One or two plain sentences: what it does for the lifter. */
  body: string;
  tier: Tier;
  /** Defaults to "all". */
  where?: Where;
  /** How the platforms differ, when they do (docs/decisions/platform-deltas.md). */
  note?: string;
  /** For "both": what the Pro part is. */
  proPart?: string;
  /** The Pro feature key it stands for (entitlements.ts), so the test can check every one is listed. */
  pro?: ProKey;
  /** The lab flag it stands for (labs.ts). */
  lab?: LabFlag;
  /** Its own page, when it has one (/features/<slug>/, src/content/landings/features.ts). */
  landing?: string;
  /** The day it reached lifters (ISO, Pacific). Features from before 2026-11-10 carry the launch build's day. */
  added: string;
}

export interface FeatureGroup {
  id: string;
  title: string;
  intro: string;
  features: SiteFeature[];
}

const LAUNCH = "2026-11-09";

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: "plan",
    title: "A plan that adapts",
    intro: "Today's workout is built from your gym, your recovery and your training block, and every number says why.",
    features: [
      {
        id: "adaptive",
        name: "Daily adaptive workouts",
        body: "Picks exercises your gym can do and your muscles are ready for, then sets every weight and rep from your last workouts.",
        tier: "both",
        proPart: "Free lifters get one adaptive workout a week beside their free program; Pro plans every day.",
        pro: "adaptive",
        added: LAUNCH,
      },
      {
        id: "splits",
        name: "Adaptive splits",
        body: "Push, pull, legs or upper and lower, still adjusted to your recovery each day.",
        tier: "pro",
        pro: "adaptiveSplits",
        added: LAUNCH,
      },
      {
        id: "readiness",
        name: "Today's call",
        body: "Push, as planned or go easy, from recovery, missed reps and how hard your last sets felt. You can always override it.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "health-readiness",
        name: "Sleep and HRV move the call",
        body: "Sleep, heart rate variability, resting heart rate and breathing rate from your phone's health app nudge today's call up or down.",
        tier: "pro",
        pro: "healthReadiness",
        added: LAUNCH,
      },
      {
        id: "blocks",
        name: "Training blocks and deloads",
        body: "Four-week blocks with a reps-in-reserve target that ease into a lighter week, so you keep progressing without burning out.",
        tier: "pro",
        added: LAUNCH,
      },
      {
        id: "why",
        name: "Every recommendation says why",
        body: "Each exercise, set count, rep target and weight carries a short reason, shown on screen, never behind a tap.",
        tier: "free",
        landing: "coaching",
        added: LAUNCH,
      },
      {
        id: "short-on-time",
        name: "Short on time",
        body: "Tell the workout you have less time and it trims what matters least.",
        tier: "both",
        proPart: "Working around a bench or rack someone else is using is Pro.",
        pro: "replan",
        added: LAUNCH,
      },
      {
        id: "injury",
        name: "Injury mode",
        body: "Tell it what hurts and it leaves out what would aggravate it, warns you about risky lifts and tracks a 0 to 10 pain rating over time.",
        tier: "free",
        landing: "injury-mode",
        added: LAUNCH,
      },
      {
        id: "cycle",
        name: "Cycle-aware readiness",
        body: "Optionally log your cycle and today's call takes it into account.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "goal-planner",
        name: "Goal planner",
        body: "Pick a lift and a target, and it works out a realistic date and the path to it.",
        tier: "pro",
        pro: "goalPlanner",
        added: LAUNCH,
      },
    ],
  },
  {
    id: "workout",
    title: "The workout",
    intro: "One tap logs a set as planned. Everything else waits until you're resting.",
    features: [
      {
        id: "logger",
        name: "One-tap set logging",
        body: "The next set is always filled in. Steppers that repeat when held change weight and reps; typing is only a fallback.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "rest-timer",
        name: "Lock-screen rest timer",
        body: "Starts itself after each set and counts down on the lock screen with the next set, the plates, heart rate, and Log set and +30 s buttons that work with the app closed.",
        tier: "free",
        note: "Android: an ongoing notification, a Live Update on Android 16 and Samsung's Now Bar. iPhone: a Live Activity on the lock screen and in the Dynamic Island. Web: a notification while the page is open.",
        landing: "rest-timer",
        added: LAUNCH,
      },
      {
        id: "plates",
        name: "Plate math",
        body: "Shows which plates go on each side, solved for the plates your gym has, each size in its own colour.",
        tier: "free",
        landing: "plate-math",
        added: LAUNCH,
      },
      {
        id: "warmups",
        name: "Warm-up sets",
        body: "Ramp-up sets worked out for each heavy lift, so you reach your working weight ready.",
        tier: "free",
        landing: "warm-up-sets",
        added: LAUNCH,
      },
      {
        id: "demos",
        name: "3D exercise demos",
        body: "Every exercise has a 3D figure showing the movement with its own gear, with setup steps and cues.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "set-types",
        name: "Drop sets and rest-pause",
        body: "Add a drop set or a rest-pause set between sets.",
        tier: "free",
        added: "2026-11-10",
      },
      {
        id: "timed-sets",
        name: "Set timer for holds, carries and cardio",
        body: "Timed exercises like planks, carries, hangs and cardio get a set timer, on the lock screen and the watches too.",
        tier: "free",
        added: "2026-11-12",
      },
      {
        id: "each-side",
        name: "Each side and per hand",
        body: "Exercises done one side at a time say so, and dumbbell weights are shown per hand.",
        tier: "free",
        added: "2026-11-12",
      },
      {
        id: "swaps",
        name: "Exercise swaps",
        body: "Swap any exercise for one that works the same muscles with what your gym has.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "heart-rate",
        name: "Live heart rate",
        body: "Connect a Bluetooth heart rate strap or your watch and see your heart rate on every set and rest.",
        tier: "free",
        note: "Web: Chrome only.",
        landing: "heart-rate",
        added: LAUNCH,
      },
      {
        id: "breathing",
        name: "Box breathing during rest",
        body: "A breathing guide on the rest screen, with presets or your own pattern.",
        tier: "free",
        added: "2026-11-12",
      },
      {
        id: "voice-coach",
        name: "Voice coach",
        body: "Speaks up during the workout, like when rest is over, so you don't have to look at the phone.",
        tier: "free",
        note: "Android says rest over with the screen locked; iPhone and the web while the app is open.",
        added: LAUNCH,
      },
      {
        id: "stretching",
        name: "Stretching",
        body: "48 stretches with 3D demos: an optional warm-up before, a cool-down after, or a stretch routine any day.",
        tier: "free",
        added: "2026-11-10",
      },
      {
        id: "workout-parts",
        name: "Workouts with parts",
        body: "A workout can run a warm-up, the lifting and a cool-down in order, with Skip between them. The lock screen and your watch show which part you're on, History shows each part, and stretch days of 10 minutes or more keep your streak. Routines can carry their own warm-up and cool-down, in share links and from your coach. Coach's notes read each part: pain after rehab easing or rising, and a heart rate that stays up through the cool-down.",
        tier: "free",
        added: "2026-11-13",
      },
      {
        id: "now-playing",
        name: "Music controls",
        body: "Play, pause and skip your music from Today and during a workout, with the song and the app playing it. You can turn it off in Settings.",
        tier: "free",
        where: "phones",
        note: "iPhone: Apple Music only, because Apple doesn't let apps control other music apps.",
        added: "2026-11-13",
      },
    ],
  },
  {
    id: "progress",
    title: "Progress and coaching",
    intro: "What to do next comes first. Numbers show up when you can act on them.",
    features: [
      {
        id: "notes",
        name: "Coach's notes",
        body: "Points out building fatigue, a stalled lift, a muscle short of sets, a weekly goal at risk or body fat creeping up, each with one thing to do, often a single tap.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "plateau",
        name: "Plateau detective",
        body: "When one lift stalls, it gives the likely cause and a one-tap three-week fix, then tells you whether it worked.",
        tier: "pro",
        pro: "plateauDetective",
        added: LAUNCH,
      },
      {
        id: "recovery-map",
        name: "Recovery map",
        body: "Your muscles glow on a 3D figure by how recovered they are. Tap one to see what it means for today.",
        tier: "pro",
        pro: "recoveryMap",
        landing: "recovery-map",
        added: LAUNCH,
      },
      {
        id: "advanced-stats",
        name: "Advanced stats",
        body: "Weekly sets per muscle against the target, one-rep max trend lines and which way each lift is going.",
        tier: "pro",
        pro: "advancedStats",
        landing: "sets-per-muscle",
        added: LAUNCH,
      },
      {
        id: "bests",
        name: "Personal bests and history",
        body: "Every best, estimated one-rep max, strength score and past workout, with no limit on history.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "calendar-history",
        name: "Workout calendar",
        body: "A month calendar of past workouts on Progress, each day named.",
        tier: "free",
        added: "2026-11-10",
      },
      {
        id: "edit-history",
        name: "Edit past workouts and do them again",
        body: "Fix a set, add a note, name a workout or repeat it, and every lift has its own page with its history.",
        tier: "free",
        added: "2026-11-11",
      },
      {
        id: "log-past",
        name: "Log a past workout",
        body: "Forgot your phone? Log the workout afterwards and it counts like any other.",
        tier: "free",
        added: "2026-11-11",
      },
      {
        id: "recap",
        name: "Monthly recap",
        body: "A short look back at your month, ready to share.",
        tier: "free",
        added: LAUNCH,
      },
    ],
  },
  {
    id: "body",
    title: "Body and health",
    intro: "Weigh-ins, body fat and health readings come in by themselves where they can, and turn into advice.",
    features: [
      {
        id: "body",
        name: "Weigh-ins, body fat and photos",
        body: "Log weight and body fat, or let them come in from your scale through your phone's health app, and keep progress photos on your phone.",
        tier: "free",
        landing: "body-tracking",
        added: LAUNCH,
      },
      {
        id: "measurements",
        name: "Tape measurements",
        body: "Nine sites in centimetres or inches. A growing or shrinking waist becomes a coach's note when there's no body fat reading.",
        tier: "free",
        added: "2026-11-10",
      },
      {
        id: "body-figure",
        name: "A 3D figure shaped like you",
        body: "Turn it on and the figures on Health, the recovery map and the exercise demos take your build from your height, weight, body fat and tape measurements.",
        tier: "free",
        added: "2026-11-12",
      },
      {
        id: "health-twin",
        name: "Health twin and fitness age",
        body: "Sleep, HRV, resting heart rate, steps, breathing rate and VO₂ max in one place, with your trend and a fitness age from your VO₂ max.",
        tier: "free",
        note: "Health readings come from Health Connect on Android and Apple Health on iPhone. The web app shows weigh-ins, body fat, BMI and calories.",
        added: LAUNCH,
      },
      {
        id: "fitness-tests",
        name: "Fitness tests",
        body: "Dead hang, one-leg stand and 30-second chair stand, each with a timer, a typical range and what helps.",
        tier: "free",
        added: "2026-11-11",
      },
      {
        id: "food",
        name: "Coach's notes from your food app",
        body: 'Calories and protein logged in a food app reach Liftsmith through your phone\'s health app and become notes like "protein short three days running". No food logging in the app.',
        tier: "free",
        where: "phones",
        added: "2026-11-11",
      },
      {
        id: "your-stats",
        name: "Your stats",
        body: "One place for sex, age and height that every tool reads, filled in from Apple Health on iPhone.",
        tier: "free",
        added: "2026-11-10",
      },
    ],
  },
  {
    id: "programs",
    title: "Programs, routines and exercises",
    intro: "Follow a classic program, build your own routines, or let the app plan. All from one library.",
    features: [
      {
        id: "fixed-programs",
        name: "Classic programs",
        body: "Classic 5×5, novice 3×5, 5×5 plus arms, ramping 5×5, tiered progression, training max waves, bodyweight skills and dumbbell full body. The free program fits your gym.",
        tier: "free",
        landing: "programs",
        added: LAUNCH,
      },
      {
        id: "routines",
        name: "Your own routines",
        body: "Build routines from the exercise browser, with no limit on how many, and share them as a link.",
        tier: "free",
        added: "2026-11-10",
      },
      {
        id: "library",
        name: "1,000 exercises",
        body: "Strength, bodyweight, machines, bands, kettlebells and cardio, with search, muscle chips and a this-gym filter. Cardio logs time and distance.",
        tier: "free",
        added: "2026-11-11",
      },
      {
        id: "remix",
        name: "Remix links",
        body: "Send a workout to a friend as a link they can do themselves.",
        tier: "free",
        added: LAUNCH,
      },
    ],
  },
  {
    id: "gyms",
    title: "Gyms and equipment",
    intro: "Every plan starts from the gear you actually have.",
    features: [
      {
        id: "gyms",
        name: "Your gyms and their equipment",
        body: "Set up each gym once: bars, plates, dumbbells and kettlebells as they really are, machines and their settings.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "gym-location",
        name: "Gym by location",
        body: "Picks the right gym when you arrive.",
        tier: "free",
        where: "phones",
        added: LAUNCH,
      },
      {
        id: "gym-share",
        name: "Share a gym's setup",
        body: "Send your gym's equipment as a link, so a training partner starts with the same gear.",
        tier: "free",
        added: "2026-11-11",
      },
      {
        id: "gym-finder",
        name: "Gym finder and gym pages",
        body: "Find gyms near you on a map with the list beneath it, official ones first, each with its own page: equipment, hours, map and members. Owners can claim their gym and add a logo and photos. Missing a gym? Add it. Owners see how many lifters added it and scanned the poster, and what to do next. Official gyms can run a club with a weekly leaderboard.",
        tier: "free",
        added: "2026-11-12",
      },
      {
        id: "gym-amenities",
        name: "Amenities and prices on gym pages",
        body: "Gym owners list what's there besides equipment (showers, parking, 24/7 access, a women's area and more) and what a day pass, week pass or membership costs.",
        tier: "free",
        added: "2026-11-13",
      },
      {
        id: "gym-news",
        name: "Announcements from your gym",
        body: "Official gyms post holiday hours, new equipment or class changes on their page, and members of the gym's club get a notification.",
        tier: "free",
        added: "2026-11-13",
      },
      {
        id: "gym-problems",
        name: "Report broken equipment",
        body: "Tell your gym a machine is broken or missing. Everyone who trains there gets a plan that works around it, and the owner sees it with a Fixed button.",
        tier: "free",
        added: "2026-11-13",
      },
      {
        id: "gym-trainers",
        name: "Trainers on gym pages",
        body: "Coaches list themselves at the gyms where they train clients, with a line about themselves and a button to start training with them. On an official gym, the owner approves them first.",
        tier: "free",
        added: "2026-11-13",
      },
      {
        id: "buy-next",
        name: "What to buy next",
        body: "For home gyms: the one piece of equipment that would open up the most exercises.",
        tier: "free",
        added: LAUNCH,
      },
    ],
  },
  {
    id: "friends",
    title: "Friends and sharing",
    intro: "Train with people, not for an audience. Friends is free.",
    features: [
      {
        id: "feed",
        name: "Friends feed",
        body: "Follow people and see their workouts, with likes, comments, replies and @mentions, and choose who sees each of yours.",
        tier: "free",
        added: "2026-11-11",
      },
      {
        id: "cheers",
        name: "Training now and cheers",
        body: "See who's training right now and send a cheer that floats up their workout screen.",
        tier: "free",
        added: "2026-11-11",
      },
      {
        id: "challenges",
        name: "Challenges, clubs and leaderboards",
        body: "Challenge a friend, join a club or gym crew with a weekly board, and take on the monthly challenge with everyone.",
        tier: "free",
        added: "2026-11-11",
      },
      {
        id: "profiles",
        name: "Public profiles",
        body: "An optional public page with your best lifts and workouts.",
        tier: "free",
        added: "2026-11-11",
      },
      {
        id: "share",
        name: "Share cards and links",
        body: "Share a workout, a new best or a milestone as an image, or as a public link with a preview.",
        tier: "free",
        added: "2026-11-10",
      },
    ],
  },
  {
    id: "coaches",
    title: "For coaches",
    intro: "Being someone's client is free for everyone.",
    features: [
      {
        id: "coaching",
        name: "Coach clients",
        body: "Link clients, see their results and assign them routines, on the phone or a wide screen.",
        tier: "pro",
        pro: "coaching",
        added: "2026-11-11",
      },
      {
        id: "coach-chat",
        name: "Chat, alerts and body data",
        body: "Message each client, get a notification when they train or go quiet for a week, and see their weigh-ins, measurements and a 3D figure shaped like them when they choose to share.",
        tier: "pro",
        pro: "coaching",
        note: "Notifications are on Android and iPhone. The web app shows new messages when it's open.",
        added: "2026-11-12",
      },
      {
        id: "physio",
        name: "For physios and rehab clinicians",
        body: "Assign gentle rehab programs with times a week, see how often clients keep to them, and see the pain ratings and injuries they choose to share, exercise by exercise, with a notification when pain runs high.",
        tier: "pro",
        pro: "coaching",
        note: "Liftsmith shows what clients log. It doesn't diagnose or treat anything.",
        added: "2026-11-13",
      },
      {
        id: "coach-nutrition",
        name: "Nutrition targets for clients",
        body: "Set each client's daily calories and protein. Their coach's notes check their food week against them, and you see how they're eating when they share it.",
        tier: "pro",
        pro: "coaching",
        added: "2026-11-13",
      },
      {
        id: "school-teams",
        name: "Free for high school teams",
        body: "High school coaches who confirm a school email address get Pro free, and so do the athletes aged 13 to 18 on their teams, with a weekly team board. Body fat and public profiles stay off for under 18s.",
        tier: "free",
        added: "2026-11-13",
      },
      {
        id: "coach-checkins",
        name: "Check-in forms and questionnaires",
        body: "Send clients a weekly check-in, an intake questionnaire or your own form, once or every week. They answer with a few taps, and a low score or a late answer lands at the top of their report.",
        tier: "pro",
        pro: "coaching",
        added: "2026-11-13",
      },
      {
        id: "coach-roles",
        name: "For personal trainers and coaches",
        body: "Say whether you're a personal trainer working one-on-one or a coach running groups and teams. Clients see the right word for you, and the tools you use most come first.",
        tier: "pro",
        pro: "coaching",
        added: "2026-11-13",
      },
      {
        id: "coach-booking",
        name: "Booking and scheduling sessions",
        body: "Open the times you're free, once or every week, and clients book them in the app, or book a client in yourself. Both sides get a notification, a session in the next day shows on Today, and it goes into their calendar in one tap.",
        tier: "pro",
        pro: "coaching",
        added: "2026-11-13",
      },
      {
        id: "coach-payments",
        name: "Client payments through Stripe",
        body: "Connect your own Stripe account and set each client's price, per session or monthly. Clients pay on Stripe's secure page, the money goes straight to you, and a failed monthly payment shows at the top of their report.",
        tier: "pro",
        pro: "coaching",
        added: "2026-11-13",
      },
      {
        id: "coach-pages",
        name: "A page for each side",
        body: "Clients see only their coach: message them in one tap, answer check-ins, book sessions and choose what to share. Coaches get a page for each job, with clients, messages, schedule, check-ins and payments as tabs on the web and on phones.",
        tier: "both",
        proPart: "Being a client is free; coaching clients is Pro.",
        pro: "coaching",
        added: "2026-11-13",
      },
      {
        id: "coach-sharing",
        name: "Clients choose what their coach sees",
        body: "Training is always shared. Heart rate, workout notes, readiness and recovery, body data, pain and injuries, and cycle are each a switch the client flips for each coach, on the consent screen or any time after. Photos and gyms never leave.",
        tier: "both",
        proPart: "Being a client is free; coaching clients is Pro.",
        pro: "coaching",
        added: "2026-11-13",
      },
      {
        id: "coach-plans",
        name: "Coach plans that grow with your client list",
        body: "Pro covers up to 3 clients. Coach makes room for 25 and Coach Plus has no set limit, with every coaching tool on every plan. Your clients always train free, and Liftsmith takes nothing from what they pay you.",
        tier: "pro",
        pro: "coaching",
        added: "2026-11-13",
      },
    ],
  },
  {
    id: "fun",
    title: "Rewards",
    intro: "A little fun that never gets in the way of a set.",
    features: [
      {
        id: "awards",
        name: "Achievements, levels and streaks",
        body: "Badges in tiers, 50 levels with rewards, weekly quests, streak freezes and honest leagues.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "locker",
        name: "Themes, accents and app icons",
        body: "Earn themes and accents, and on the phones an app icon in your theme's colours.",
        tier: "free",
        note: "Earned app icons are on Android and iPhone only.",
        added: LAUNCH,
      },
    ],
  },
  {
    id: "phone",
    title: "On your phone and wrist",
    intro: "Liftsmith uses what each phone does best.",
    features: [
      {
        id: "watch",
        name: "Watch apps",
        body: "The workout on Wear OS and Apple Watch: the set or the rest countdown, heart rate from the watch, Log set and +30 s, and a buzz when rest ends.",
        tier: "free",
        where: "phones",
        landing: "watch-apps",
        added: "2026-11-10",
      },
      {
        id: "widgets",
        name: "Home-screen widget",
        body: "Today's call, your weekly goal, a coach's note and Start or Log set on the home screen.",
        tier: "free",
        where: "phones",
        note: "The web app has shortcuts on its home-screen icon instead.",
        added: "2026-11-10",
      },
      {
        id: "shortcuts",
        name: "Quick settings, Siri and shortcuts",
        body: "Start a workout from a Quick Settings tile on Android or Control Center and Siri on iPhone.",
        tier: "free",
        where: "phones",
        added: LAUNCH,
      },
      {
        id: "calendar",
        name: "Calendar",
        body: "Puts your training days in your calendar and can shorten a workout to fit before your next meeting.",
        tier: "free",
        note: "The web app downloads an .ics file instead.",
        added: "2026-11-11",
      },
      {
        id: "reminders",
        name: "Reminders",
        body: "Gentle reminders on training days, as notifications on the phones and by email.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "cloud",
        name: "Fitness service connections",
        body: "Oura sends sleep, HRV, resting heart rate and steps in, through a free account. We're investigating Strava, WHOOP, Withings, Polar and Concept2.",
        tier: "pro",
        pro: "cloudConnections",
        added: "2026-11-10",
      },
      {
        id: "health-save",
        name: "Workouts saved to your health app",
        body: "Each finished workout is saved to Health Connect or Apple Health as a strength workout, with calories and heart rate.",
        tier: "free",
        where: "phones",
        added: "2026-11-10",
      },
    ],
  },
  {
    id: "data",
    title: "Your data",
    intro: "Works offline, no account needed, and your data stays yours.",
    features: [
      {
        id: "offline",
        name: "Works offline",
        body: "Everything runs on your device, so no signal in the basement gym is fine.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "sync",
        name: "Accounts and sync",
        body: "Optional sign-in with Google, Apple or an emailed code keeps your phone, tablet and the web app in step.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "backup",
        name: "Backup and export",
        body: "Save a backup file or export your workouts as a spreadsheet whenever you like.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "import",
        name: "Import from another app",
        body: "Bring your history across from Strong, Hevy, Fitbod, StrongLifts, JEFIT or FitNotes with their export file, cardio included.",
        tier: "free",
        added: "2026-11-11",
      },
      {
        id: "importExtras",
        name: "Routines and body stats from another app",
        body: "An import turns workouts you repeated by name into routines, and brings body weight, body fat and tape measurements from Hevy, FitNotes or a scale app.",
        tier: "free",
        added: "2026-11-13",
      },
    ],
  },
  {
    id: "access",
    title: "Look, feel and languages",
    intro: "Comfortable for every lifter, one-handed in the gym or on a big screen at home.",
    features: [
      {
        id: "languages",
        name: "Six languages",
        body: "English, Spanish, French, German, Italian and Japanese, following your phone's language.",
        tier: "free",
        added: "2026-11-10",
      },
      {
        id: "appearance",
        name: "Dark, light or match your phone",
        body: "A dark look by default, a light one, or whichever your phone uses.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "a11y",
        name: "Accessibility",
        body: "Larger text up to 150%, colour-blind safe colours, more contrast, screen reader support and full keyboard use, checked against WCAG 2.2 AA.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "one-hand",
        name: "One-handed controls",
        body: "Move the weight and rep buttons beside Log set, under your left or right thumb.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "lean",
        name: "Lean mode, sounds and vibration",
        body: "Turn off motion and confetti, sounds or vibration, each with one switch.",
        tier: "free",
        added: LAUNCH,
      },
      {
        id: "lite-demos",
        name: "Battery saver for 3D figures",
        body: "Draw the exercise demos and the recovery map at a lower resolution and frame rate, for older phones and longer battery.",
        tier: "free",
        added: "2026-11-13",
      },
      {
        id: "desktop",
        name: "Desktop layout",
        body: "On a computer the web app has a sidebar, wide pages, keyboard shortcuts during a workout (L logs the set) and a wide routine builder.",
        tier: "free",
        note: "Web app on a wide window with a mouse; phones and tablets keep the phone layout.",
        added: "2026-11-12",
      },
    ],
  },
  {
    id: "labs",
    title: "Labs",
    intro: "Experiments Pro lifters can switch on in Settings › Labs. They may change or go away.",
    features: [
      {
        id: "lab-rep-count",
        name: "Camera rep counting",
        body: "Prop your phone up and the camera counts your reps, with the skeleton drawn over the picture. Nothing leaves your phone.",
        tier: "lab",
        lab: "labRepCount",
        added: "2026-11-10",
      },
      {
        id: "lab-bar-speed",
        name: "Camera bar speed",
        body: "Shows how fast the bar moves and when it has slowed enough to end the set.",
        tier: "lab",
        lab: "labBarSpeed",
        added: "2026-11-10",
      },
      {
        id: "lab-form",
        name: "Camera form check",
        body: "Spots squats above parallel, cut-short reps and leaning to one side, and gives one tip between sets.",
        tier: "lab",
        lab: "labFormCheck",
        added: "2026-11-11",
      },
      {
        id: "lab-speed-max",
        name: "Today's max from warm-ups",
        body: "Uses your warm-ups' bar speed to suggest a slightly heavier or lighter first working weight.",
        tier: "lab",
        lab: "labSpeedMax",
        added: "2026-11-11",
      },
      {
        id: "lab-bar-path",
        name: "Bar path replay",
        body: "Replays a squat, deadlift or overhead press rep with the bar's path drawn, and one cue if it drifted.",
        tier: "lab",
        lab: "labBarPath",
        added: "2026-11-11",
      },
      {
        id: "lab-motion",
        name: "Phone motion rep counting",
        body: "Counts reps from the phone's own motion sensors when it moves with you.",
        tier: "lab",
        lab: "repMotion",
        note: "Phones and tablets with motion sensors.",
        added: "2026-11-11",
      },
      {
        id: "lab-watch-reps",
        name: "Watch rep counting",
        body: "Your Wear OS watch or Apple Watch counts the reps from your wrist.",
        tier: "lab",
        where: "phones",
        lab: "labWatchReps",
        added: "2026-11-11",
      },
      {
        id: "lab-hands-free",
        name: "Hands-free sets",
        body: "While a rep counter is counting, the set logs itself a few seconds after your last rep.",
        tier: "lab",
        lab: "labHandsFree",
        added: "2026-11-11",
      },
      {
        id: "lab-voice",
        name: "Voice set logging",
        body: 'Say "100 for 8" or "too easy" to log a set. Recognized on your device; no audio leaves it.',
        tier: "lab",
        lab: "labVoiceLog",
        note: "Web: Chrome 139 or later.",
        added: "2026-11-11",
      },
      {
        id: "lab-volume",
        name: "Volume button logs a set",
        body: "Press volume up on the phone or your earbuds to log the set.",
        tier: "lab",
        where: "phones",
        lab: "labVolumeLog",
        added: "2026-11-11",
      },
      {
        id: "lab-tempo",
        name: "Tempo coach",
        body: "On tempo and paused lifts, counts each rep's lowering, hold and lift in sound and vibration.",
        tier: "lab",
        lab: "labTempo",
        added: "2026-11-11",
      },
      {
        id: "lab-hr-rest",
        name: "Heart-rate rest timer",
        body: "Ends rest early once your heart rate is back down, never below 60% of the planned rest.",
        tier: "lab",
        lab: "labHrRest",
        added: "2026-11-11",
      },
      {
        id: "lab-machines",
        name: "Bluetooth gym machines",
        body: "Bikes, rowers, treadmills and cross trainers fill in a cardio set's time, distance and power.",
        tier: "lab",
        lab: "labGymMachines",
        note: "Web: Chrome only.",
        added: "2026-11-11",
      },
      {
        id: "lab-scale",
        name: "Bluetooth smart scale",
        body: "Step on a compatible scale and the weigh-in fills in your weight and body fat for you to check and log.",
        tier: "lab",
        lab: "labScale",
        note: "Web: Chrome only.",
        added: "2026-11-11",
      },
      {
        id: "lab-sonos",
        name: "Sonos",
        body: "Control a Sonos speaker from the workout, with one volume for sets and another for rest.",
        tier: "lab",
        lab: "labSonos",
        added: "2026-11-12",
      },
    ],
  },
];

/** Every feature, in page order. */
export const ALL_FEATURES: SiteFeature[] = FEATURE_GROUPS.flatMap((g) => g.features);

/**
 * The newest features: every one added on the latest `days` days that added any, grouped by their category in page
 * order (Melvin, 2026-11-12: "categorize them instead" of dates).
 */
export function newestFeatures(days = 3, groups: FeatureGroup[] = FEATURE_GROUPS): { group: FeatureGroup; features: SiteFeature[] }[] {
  const recent = new Set(
    [...new Set(ALL_FEATURES.map((f) => f.added))]
      .filter((d) => d > LAUNCH)
      .sort()
      .reverse()
      .slice(0, days),
  );
  return groups
    .map((group) => ({ group, features: group.features.filter((f) => recent.has(f.added)) }))
    .filter((g) => g.features.length > 0);
}

// --- Connections: what Liftsmith works with ---

/** Yes; not on this platform; through the phone's health app; coming soon (a store listing pending); or investigating (built, but approval and keys aren't certain). */
export type Support = "yes" | "no" | "soon" | "investigating" | "chrome" | "health";

export const SUPPORT_LABEL: Record<Support, string> = {
  yes: "Yes",
  no: "No",
  soon: "Coming soon",
  investigating: "Investigating",
  chrome: "Chrome",
  health: "Through Health",
};

export interface Connection {
  id: string;
  name: string;
  /** What it does with Liftsmith, in a few words. */
  does: string;
  android: Support;
  ios: Support;
  web: Support;
  tier: Tier;
  /** Where to read more: a page on this site (models, setup). */
  link?: { href: string; label: string };
}

export interface ConnectionGroup {
  id: string;
  title: string;
  rows: Connection[];
}

export const CONNECTION_GROUPS: ConnectionGroup[] = [
  {
    id: "health",
    title: "Health apps",
    rows: [
      {
        id: "health-connect",
        name: "Health Connect",
        does: "Weigh-ins, body fat, sleep, HRV, heart rate, steps and food in; finished workouts out",
        android: "yes",
        ios: "no",
        web: "no",
        tier: "free",
      },
      {
        id: "apple-health",
        name: "Apple Health",
        does: "Weigh-ins, body fat, sleep, HRV, heart rate, steps, food, height, age and sex in; finished workouts out",
        android: "no",
        ios: "yes",
        web: "no",
        tier: "free",
      },
      {
        id: "samsung-health",
        name: "Samsung Health",
        does: "Its readings, once you share them with Health Connect",
        android: "health",
        ios: "no",
        web: "no",
        tier: "free",
      },
      {
        id: "health-devices",
        name: "Fitbit, Garmin Connect, smart scales, Hume Body Pod",
        does: "Whatever they write to your phone's health app",
        android: "health",
        ios: "health",
        web: "no",
        tier: "free",
      },
    ],
  },
  {
    id: "watches",
    title: "Watches and heart rate",
    rows: [
      {
        id: "wear-os",
        name: "Wear OS watches",
        does: "The workout on your wrist, heart rate, Log set and +30 s",
        android: "yes",
        ios: "no",
        web: "no",
        tier: "free",
      },
      {
        id: "apple-watch",
        name: "Apple Watch",
        does: "The workout on your wrist, heart rate, Log set and +30 s",
        android: "no",
        ios: "yes",
        web: "no",
        tier: "free",
      },
      {
        id: "garmin",
        name: "Garmin watches (Connect IQ)",
        does: "The workout on your wrist with the Liftsmith watch app",
        android: "soon",
        ios: "soon",
        web: "no",
        tier: "free",
      },
      {
        id: "hr-strap",
        name: "Bluetooth heart rate straps",
        does: "Live heart rate during sets and rest (any strap or armband that shares standard Bluetooth heart rate)",
        android: "yes",
        ios: "yes",
        web: "chrome",
        tier: "free",
      },
    ],
  },
  {
    id: "bluetooth",
    title: "Bluetooth gear (Labs)",
    rows: [
      {
        id: "scale",
        name: "Bluetooth smart scales",
        does: "Weight and body fat on the weigh-in (scales that share the standard Weight Scale or Body Composition service)",
        android: "yes",
        ios: "yes",
        web: "chrome",
        tier: "lab",
        link: { href: "/works-with/scales/", label: "Compatible scales" },
      },
      {
        id: "machines",
        name: "Bluetooth gym machines",
        does: "Time, distance and power from bikes, rowers, treadmills and cross trainers that share the standard Fitness Machine service",
        android: "yes",
        ios: "yes",
        web: "chrome",
        tier: "lab",
      },
    ],
  },
  {
    id: "services",
    title: "Fitness services (needs a free account)",
    rows: [
      {
        id: "oura",
        name: "Oura",
        does: "Sleep, HRV, resting heart rate and steps in",
        android: "yes",
        ios: "yes",
        web: "yes",
        tier: "pro",
      },
      {
        id: "strava",
        name: "Strava",
        does: "Each finished workout posted to Strava",
        android: "investigating",
        ios: "investigating",
        web: "investigating",
        tier: "pro",
      },
      {
        id: "whoop",
        name: "WHOOP",
        does: "Sleep, recovery, HRV and resting heart rate in",
        android: "investigating",
        ios: "investigating",
        web: "investigating",
        tier: "pro",
      },
      {
        id: "withings",
        name: "Withings",
        does: "Weigh-ins, body fat, sleep and steps in",
        android: "investigating",
        ios: "investigating",
        web: "investigating",
        tier: "pro",
      },
      {
        id: "polar",
        name: "Polar",
        does: "Nightly recharge, HRV and sleep in",
        android: "investigating",
        ios: "investigating",
        web: "investigating",
        tier: "pro",
      },
      {
        id: "concept2",
        name: "Concept2 Logbook",
        does: "RowErg, SkiErg and BikeErg sessions in as cardio workouts",
        android: "investigating",
        ios: "investigating",
        web: "investigating",
        tier: "pro",
      },
    ],
  },
  {
    id: "music",
    title: "Music and speakers",
    rows: [
      {
        id: "music-apps",
        name: "Spotify, YouTube Music and other music apps",
        does: "Play, pause and skip from Today and the workout, with the song's name",
        android: "yes",
        ios: "no",
        web: "no",
        tier: "free",
      },
      {
        id: "apple-music",
        name: "Apple Music",
        does: "Play, pause and skip from Today and the workout, with the song's name",
        android: "yes",
        ios: "yes",
        web: "no",
        tier: "free",
      },
      {
        id: "sonos",
        name: "Sonos",
        does: "Play, pause, skip and volume from the workout; music follows sets and rest",
        android: "yes",
        ios: "yes",
        web: "yes",
        tier: "lab",
      },
    ],
  },
  {
    id: "other",
    title: "Calendars and other apps",
    rows: [
      {
        id: "calendar",
        name: "Phone calendar (Google, iCloud, Outlook)",
        does: "Training days in your calendar, and workouts fitted around busy times",
        android: "yes",
        ios: "yes",
        web: "no",
        tier: "free",
      },
      {
        id: "ics",
        name: "Any calendar (.ics file)",
        does: "Training days as a calendar file",
        android: "no",
        ios: "no",
        web: "yes",
        tier: "free",
      },
      {
        id: "import",
        name: "Strong, Hevy, Fitbod, StrongLifts, JEFIT, FitNotes",
        does: "Your workout history imported from their export file",
        android: "yes",
        ios: "yes",
        web: "yes",
        tier: "free",
        link: { href: "/import/strong/", label: "How to switch" },
      },
    ],
  },
];

export const ALL_CONNECTIONS: Connection[] = CONNECTION_GROUPS.flatMap((g) => g.rows);
