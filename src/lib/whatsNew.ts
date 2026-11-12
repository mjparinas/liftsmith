// The public "What's new" page (/whats-new/): what changed for lifters each day, in plain words. No code, file
// names or internals, and only things a lifter would notice in the app or on the site. Newest day first; one
// entry per day that had such changes. Add a day when a promotion to main ships something a lifter will see.

export type NewsItem = {
  kind: "new" | "better" | "fixed";
  title: string;
  body: string;
  /**
   * Lifters asked for it (in-app feedback or the Inbox): the card says "You asked for this" (growth plan item 6,
   * docs/decisions/growth.md). Only when someone really asked, and reply to them with the Inbox's "You asked, we
   * built it" saved reply when it ships.
   */
  asked?: boolean;
};
export type NewsDay = {
  /** ISO day, e.g. 2026-11-09 (Pacific time). Used as the anchor. */ day: string;
  headline: string;
  items: NewsItem[];
};

export const NEWS_KIND_LABEL: Record<NewsItem["kind"], string> = { new: "New", better: "Better", fixed: "Fixed" };
export const NEWS_ASKED_LABEL = "You asked for this";

export const WHATS_NEW: NewsDay[] = [
  {
    day: "2026-11-09",
    headline: "Accounts and sync, camera rep counting, a 3D recovery map, and Spanish and French",
    items: [
      {
        kind: "new",
        title: "Accounts and sync",
        body: "Sign in with Google, Apple or a code sent to your email, and your workouts sync between your phone, your other devices and the web dashboard. You still don't need an account to use the app.",
      },
      {
        kind: "new",
        title: "Count reps with your camera",
        body: "Prop your phone up and the workout screen can count your reps for you. It all happens on your phone; no video leaves it.",
      },
      {
        kind: "new",
        title: "Recovery map on the 3D figure",
        body: "The recovery map now glows on the same 3D figure as the exercise demos. Tap a muscle to see how recovered it is and what that means for today.",
      },
      {
        kind: "new",
        title: "Health twin and fitness age",
        body: "The Body tab's Health view brings together sleep, HRV, resting heart rate, steps, breathing rate and VO₂ max from Health Connect or Apple Health, with a fitness age worked out from your VO₂ max.",
      },
      {
        kind: "new",
        title: "Every recommendation says why",
        body: "Each planned exercise, set count, rep target and weight now carries a short reason, and coach's notes point out stalled lifts, building fatigue or a muscle that's short of sets, with a one-tap fix.",
      },
      {
        kind: "new",
        title: "Spanish and French",
        body: "The whole app is now in Spanish and French as well as English, and follows your phone's language.",
      },
      {
        kind: "new",
        title: "Per-hand logging and a lighter start after a break",
        body: "Log one-arm and one-leg sets for each side. After time away, your first workout back starts lighter and builds up again.",
      },
      {
        kind: "new",
        title: "A welcome screen and a clearer way to save",
        body: "Setup now opens with a short welcome, and a Save your progress step explains signing in and backups. Settings has a Saving and backup section where you can restore a backup file.",
      },
      {
        kind: "new",
        title: "Accessibility settings and one-handed controls",
        body: "Text size, colour-blind safe colours and more contrast in Settings › Accessibility, plus a one-handed mode that puts Log set and the weight and rep buttons under your thumb.",
      },
      {
        kind: "better",
        title: "Supersets are easier to follow",
        body: "Paired exercises are linked on Today, and mid-superset the workout screen names the exercise that comes next.",
      },
      {
        kind: "better",
        title: "Sheets close the way you expect",
        body: "Every sheet has a Close button and closes when you swipe it down.",
      },
      {
        kind: "fixed",
        title: "Heart rate monitors that wouldn't connect",
        body: "The app now retries, stops waiting after a while, and tells you what went wrong instead of spinning.",
      },
      {
        kind: "new",
        title: "On the website",
        body: "Comparison pages, training guides, a blog, and plate, one-rep max and TDEE calculators, plus faster pages on phones.",
      },
    ],
  },
  {
    day: "2026-11-08",
    headline: "The first build of Liftsmith",
    items: [
      {
        kind: "new",
        title: "Workouts planned for you",
        body: "Tell it your gym, your time and your goal, and each day's workout is planned from your equipment, your recovery and your training block, with RIR blocks and deloads.",
      },
      {
        kind: "new",
        title: "Fast logging in the gym",
        body: "One tap logs a set as planned, the next set is filled in, the rest timer starts itself and shows on your lock screen, and the plate graphic shows what to load.",
      },
      {
        kind: "new",
        title: "Programs and routines",
        body: "Classic 5×5, novice 3×5, ramping 5×5, tiered progression, training max waves and bodyweight skills, plus your own saved routines.",
      },
      {
        kind: "new",
        title: "3D exercise demos",
        body: "Every exercise has a 3D figure showing the movement, with setup and cues.",
      },
      {
        kind: "new",
        title: "Heart rate, Health Connect and Apple Health",
        body: "Bluetooth heart rate during workouts, and readiness that can use your sleep and recovery data if you allow it.",
      },
      {
        kind: "new",
        title: "Injury mode",
        body: "Tell it what hurts and it skips or lightens the exercises that load that area, with pain ratings and a graded return.",
      },
      {
        kind: "new",
        title: "Achievements, quests and streaks",
        body: "Badges, weekly quests, streak freezes and a share card for new bests, with a Lean mode that turns the extras down.",
      },
      {
        kind: "new",
        title: "Light mode",
        body: "Settings › Appearance: dark, light or match your phone.",
      },
    ],
  },
];

/** "Monday, 9 November 2026" for an ISO day, the same everywhere (no time zone shift). */
export function dayLabel(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
