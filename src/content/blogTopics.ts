// Blog topics: one hub page per topic at /blog/topic/<slug>/, listing every post whose tag maps to it.
// Each post's `tag` stays as written (it's shown on the post); this groups the tags into a few topics.
import { ARTICLES, type Article } from "./articles";

export interface BlogTopic {
  slug: string;
  name: string;
  /** Page title (under 60 characters). */
  title: string;
  /** Meta description, 70 to 160 characters. */
  description: string;
  /** One or two sentences under the heading. */
  intro: string;
  /** The post tags that belong here. */
  tags: string[];
}

export const BLOG_TOPICS: BlogTopic[] = [
  {
    slug: "workouts",
    name: "Workouts",
    title: "Workouts: full sessions you can do today",
    description:
      "Ready-to-run workouts for every body part and schedule: chest, back, legs, arms, full-body days, short sessions and more, with sets and reps.",
    intro: "Complete sessions with the exercises, sets and reps written out. Pick one and start.",
    tags: ["Workouts", "Short workouts"],
  },
  {
    slug: "programming",
    name: "Programming",
    title: "Programming: splits, sets, reps and progression",
    description:
      "How to plan your training: workout splits, how many sets and reps, rest, effort, progression, periodization and the programs that use them.",
    intro: "How to put a plan together and keep it moving forward: splits, volume, effort, rest and progression.",
    tags: ["Programming", "Programs", "Volume", "Effort", "Rest", "Training", "Exercises"],
  },
  {
    slug: "strength",
    name: "Strength",
    title: "Strength: lift more on the big lifts",
    description:
      "Get stronger on the squat, bench press and deadlift: breaking plateaus, loading the bar, grip, belts and strength without extra size.",
    intro: "Getting stronger on the main lifts, and the gear and habits that help.",
    tags: ["Strength", "Plates"],
  },
  {
    slug: "beginners",
    name: "Beginners",
    title: "Beginners: start lifting the right way",
    description:
      "New to lifting? Your first week at the gym, a beginner plan, how much weight to lift, strength training for women and over 40, and more.",
    intro: "Everything you need for your first months of lifting, without the jargon.",
    tags: ["Beginners"],
  },
  {
    slug: "home-workouts",
    name: "Home workouts",
    title: "Home workouts: dumbbells, bands and body weight",
    description:
      "Train well at home: dumbbell, kettlebell, band and no-equipment workouts, calisthenics progressions and a home gym on a budget.",
    intro: "Strength training with what you have at home, from no equipment at all to a full home gym.",
    tags: ["Home gym", "Home", "Bodyweight"],
  },
  {
    slug: "recovery",
    name: "Recovery",
    title: "Recovery: rest, sleep, warm-ups and injuries",
    description:
      "Recover well between workouts: muscle recovery, soreness, sleep, deloads, warm-ups, stretching, heart rate, injuries and coming back after a break.",
    intro: "What happens between workouts matters as much as the workouts. Recover well and you can train harder.",
    tags: ["Recovery", "Warm-up", "Injuries", "Comebacks", "Heart rate"],
  },
  {
    slug: "nutrition",
    name: "Nutrition",
    title: "Nutrition for lifters: protein, bulking and cutting",
    description:
      "Eating to build muscle and lose fat: protein, lean bulking, cutting, recomposition, belly fat, creatine and what to eat before a workout.",
    intro: "Plain advice on eating for strength and muscle. No meal plans, no fads.",
    tags: ["Nutrition"],
  },
  {
    slug: "tracking",
    name: "Tracking and progress",
    title: "Tracking and progress: measure what matters",
    description:
      "Track your workouts and see real progress: logging sets, body measurements, smartwatches, phone rep counting and realistic rates of muscle gain.",
    intro: "How to log your training and tell whether it's working.",
    tags: ["Tracking", "Progress"],
  },
  {
    slug: "coaching",
    name: "Coaching",
    title: "Coaching: training clients and working with a coach",
    description:
      "For personal trainers and online coaches, and for lifters who work with one: tracking clients, keeping them consistent, and what to share.",
    intro: "How to coach lifters between sessions, and what to expect when you train with a coach.",
    tags: ["Coaching"],
  },
];

export const BLOG_TOPIC_BY_SLUG = new Map(BLOG_TOPICS.map((t) => [t.slug, t]));

export const topicPath = (t: BlogTopic) => `/blog/topic/${t.slug}/`;

/** The topic a post belongs to, by its tag. */
export function topicOf(a: Article): BlogTopic | undefined {
  return BLOG_TOPICS.find((t) => t.tags.includes(a.tag));
}

/** A topic's blog posts, newest first. */
export function postsIn(t: BlogTopic): Article[] {
  return ARTICLES.filter((a) => a.kind === "blog" && t.tags.includes(a.tag)).sort((a, b) => b.date.localeCompare(a.date));
}
