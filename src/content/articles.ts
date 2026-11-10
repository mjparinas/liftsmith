// Guides and blog posts for the public site. Written as data so the pages, the sitemap and the tests read
// the same list. Inline text can hold [links](/path/) and **bold**. Every article carries calls to action:
// one near the top (added by the page), at least one { cta } block in the body, and the banner at the end.
// Rules (checked in seo.test.ts): only features that ship today, no other apps' or trademarked programs'
// names, every link goes to a page that exists, and every exercise id is in the library.
import { BLOG_A } from "./blog/a";
import { BLOG_B } from "./blog/b";
import { BLOG_C } from "./blog/c";
import { BLOG_D } from "./blog/d";
import { BLOG_E } from "./blog/e";
import { GUIDES } from "./guides";

export type CtaTopic =
  | "plan"
  | "plates"
  | "onerm"
  | "recovery"
  | "rest"
  | "warmup"
  | "deload"
  | "progress"
  | "home"
  | "bodyweight"
  | "time"
  | "heart"
  | "injury"
  | "comeback"
  | "tdee"
  | "log"
  | "rir";

export type Block =
  { h2: string } | { p: string } | { ul: string[] } | { ol: string[] } | { tip: string } | { cta: CtaTopic } | { exercises: string[] };

export interface Article {
  slug: string;
  kind: "guide" | "blog";
  title: string;
  /** Under 160 characters, for search results. */
  description: string;
  /** ISO date. */
  date: string;
  updated?: string;
  tag: string;
  /** Topic of the banner at the end. */
  cta: CtaTopic;
  body: Block[];
  faq?: [string, string][];
}

/** What each call to action says: specific to what the reader just read, always one tap into the app. */
export const CTA_COPY: Record<CtaTopic, { title: string; body: string; button: string }> = {
  plan: {
    title: "Get a workout planned for you today",
    body: "Liftsmith picks your exercises, sets, reps and weights from your equipment and recovery, then moves them forward every session.",
    button: "Get today's workout",
  },
  plates: {
    title: "Never do plate maths again",
    body: "Liftsmith shows which plates go on each side for every set, using the plates your gym actually has, and the next set's plates while you rest.",
    button: "Try it free",
  },
  onerm: {
    title: "Track your max without testing it",
    body: "Liftsmith estimates your one-rep max from every set you log and shows how it's trending, so you see progress without risking a max attempt.",
    button: "Start tracking free",
  },
  recovery: {
    title: "See which muscles are ready",
    body: "Liftsmith's 3D recovery map shows how recovered each muscle is from what you've lifted, and plans around the ones that need rest.",
    button: "See your recovery map",
  },
  rest: {
    title: "A rest timer that starts itself",
    body: "Log a set and Liftsmith starts the right rest for that lift, counts it down on your lock screen and tells you when to go.",
    button: "Try the rest timer",
  },
  warmup: {
    title: "Warm-up sets, worked out for you",
    body: "Liftsmith adds ramp-up sets before your first heavy lift, on weights your plates can make, and counts them in the workout length.",
    button: "Get your warm-ups",
  },
  deload: {
    title: "Deloads that happen on time",
    body: "Liftsmith runs training blocks with a lighter week built in, and offers an early deload when your logged sets show fatigue building.",
    button: "Train in blocks free",
  },
  progress: {
    title: "Know exactly what to lift next time",
    body: "Liftsmith adds a rep or a step of weight when you earn it, and pulls back when you miss, so every session moves you forward.",
    button: "Start progressing",
  },
  home: {
    title: "A plan built for your home gym",
    body: "Tell Liftsmith what you own, down to the plates and dumbbells, and every workout uses only that.",
    button: "Plan my home workouts",
  },
  bodyweight: {
    title: "Full workouts with no equipment",
    body: "Pick the bodyweight gym in Liftsmith and get a complete plan for every muscle, with harder variations as you get stronger.",
    button: "Start a bodyweight plan",
  },
  time: {
    title: "Pick your minutes, get a workout",
    body: "Slide Liftsmith to 20, 30 or 45 minutes and it builds a workout that fits, warm-ups and rest included.",
    button: "Build a short workout",
  },
  heart: {
    title: "Heart rate on every set",
    body: "Pair a Bluetooth heart rate strap or watch and Liftsmith records your heart rate through each set and rest, with no extra taps.",
    button: "Connect a monitor",
  },
  injury: {
    title: "Keep training around a sore spot",
    body: "Tell Liftsmith what hurts and it skips or lightens the exercises that load it, and swaps in ones that don't. It isn't medical advice.",
    button: "Set up injury mode",
  },
  comeback: {
    title: "Ease back in with a plan",
    body: "Liftsmith reads how long you've been away and eases your first sessions back, then builds up from there.",
    button: "Plan my comeback",
  },
  tdee: {
    title: "Calories that keep up with you",
    body: "Liftsmith recalculates your daily calorie burn as your weight and training change, from your weigh-ins and the days you actually train.",
    button: "Try it free",
  },
  log: {
    title: "Log a set in one tap",
    body: "Liftsmith fills in every set before you lift. Tap once when it's done and the rest timer starts on its own.",
    button: "Start logging free",
  },
  rir: {
    title: "Effort targets on every set",
    body: "Liftsmith sets how many reps to leave in the tank for each week of your block, and adjusts from what you report.",
    button: "Train by effort",
  },
};

export const ARTICLES: Article[] = [...GUIDES, ...BLOG_A, ...BLOG_B, ...BLOG_C, ...BLOG_D, ...BLOG_E];

export const ARTICLE_BY_SLUG = new Map(ARTICLES.map((a) => [`${a.kind}/${a.slug}`, a]));

/** About 220 words a minute. */
export function readMinutes(a: Article): number {
  const words = a.body
    .flatMap((b) => ("p" in b ? [b.p] : "tip" in b ? [b.tip] : "ul" in b ? b.ul : "ol" in b ? b.ol : "h2" in b ? [b.h2] : []))
    .join(" ")
    .split(/\s+/).length;
  return Math.max(2, Math.round(words / 220));
}
