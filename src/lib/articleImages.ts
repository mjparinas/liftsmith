// The pictures in every guide and blog post (Melvin, 2026-11-27: "a preview photo and 3 to 6 photos in each post …
// some from the app itself … don't forget 3D figures"). Nothing here is a stock photo: each post gets
//   - its preview, the same card as its og:image, as a WebP beside the JPEG (public/og/articles/<slug>.webp),
//   - real screenshots of the app screens it talks about (public/articles/app/<id>.webp, 780 px, plus a 540 px copy),
//     taken by scripts/article-screens.mjs from the real app with a month of training in it, and
//   - the app's own 3D figure for the lifts it names (public/articles/fig/<exercise>.webp), drawn by
//     scripts/og-images.mjs from the same figure as the exercise demos.
// The picks are worked out from the post's own words, so a new post gets pictures without a list to keep;
// articleImages.test.ts checks every post has 3 to 6 and every file exists.
import type { Article, CtaTopic } from "@/content/articles";

import { EXERCISE_BY_ID, EXERCISES } from "./exercises";
import { MUSCLE_NAME } from "./seo";
import { WEB_TWIN } from "./webTwins";

export interface AppScreen {
  id: string;
  /** Where the screenshot script opens it. Absent: taken during a workout (workout, rest, done). */
  hash?: string;
  /** What the screenshot shows, for screen readers. */
  alt: string;
  /** The line under it. */
  caption: string;
  /** Words in a post that make this screen worth showing. */
  words: RegExp;
}

export const APP_SCREENS: AppScreen[] = [
  {
    id: "today",
    hash: "#/today",
    alt: "Liftsmith's Today screen: today's planned workout with each exercise, its sets and the reason it was picked",
    caption: "Today in Liftsmith: the workout is planned before you open the app, with a reason beside every exercise.",
    words:
      /\b(today's workout|adaptive|plan(ned|s)? (for you|your)|split|full[- ]body|program|routine|beginner|workout plan|days? a week|schedule)\b/gi,
  },
  {
    id: "workout",
    alt: "A working set in Liftsmith: the exercise's 3D demo, the target weight and reps with − and + buttons, and a Log set button",
    caption: "During a set: the weight and reps are already filled in, with the reason for them. One tap logs it.",
    words:
      /\b(log(ging)? (a |your |each )?sets?|one tap|reps? target|working sets?|plates? (on|for) each side|tracker|track your (lifts|workouts))\b/gi,
  },
  {
    id: "rest",
    alt: "Liftsmith's rest timer counting down after a set, with the next set and its plates shown below",
    caption: "Rest starts by itself after Log set, with the next set and its plates waiting.",
    words: /\b(rest (timer|periods?|between sets|time)|rest for|seconds of rest|minutes? of rest|supersets?)\b/gi,
  },
  {
    id: "done",
    alt: "Liftsmith's workout summary: time, sets, volume and the new personal bests from the session",
    caption: "The end of a workout: what you did, the bests you set and what changes next time.",
    words: /\b(personal (best|record)s?|PRs?|new best|streaks?|XP|finish(ed)? (a|the|your) workout)\b/g,
  },
  {
    id: "muscles",
    hash: "#/muscles",
    alt: "Liftsmith's 3D recovery map: each muscle coloured by how recovered it is from recent training",
    caption: "Body › Muscles: how recovered each muscle is, so the plan trains the ready ones.",
    words: /\b(recover(y|ed|ing)|sore(ness)?|DOMS|fatigue|muscle groups?|weekly sets|sets per muscle|frequency)\b/gi,
  },
  {
    id: "health",
    hash: "#/health",
    alt: "Liftsmith's Health view: sleep, heart rate variability, resting heart rate and fitness age from Health Connect or Apple Health",
    caption: "Body › Health: sleep, HRV and resting heart rate from your phone's health app, read into today's call.",
    words:
      /\b(sleep|HRV|heart rate variability|resting heart rate|readiness|fitness age|VO2|longevity|Health Connect|Apple Health|steps)\b/gi,
  },
  {
    id: "progress",
    hash: "#/progress",
    alt: "Liftsmith's Progress screen: what to do next, estimated maxes going up and this week's sets per muscle",
    caption: "Progress: what to do next first, then your estimated maxes and this week's sets.",
    words: /\b(progress(ive overload|ion)?|plateau|stall(ed|ing)?|estimated (one-rep )?max|e1RM|stronger|strength gains?|volume)\b/gi,
  },
  {
    id: "awards",
    hash: "#/awards",
    alt: "Liftsmith's Awards tab: badges, levels and weekly quests earned from training",
    caption: "Awards: badges, levels and quests that come from training, never from tapping.",
    words: /\b(badges?|levels?|quests?|seasons?|motivat(ion|ed)|habit|consisten(cy|t)|league)\b/gi,
  },
  {
    id: "friends",
    hash: "#/friends",
    alt: "Liftsmith's Friends tab: a feed of friends' workouts with likes and comments",
    caption: "Friends: see who trained, cheer them on and set challenges together.",
    words: /\b(friends?|social|feed|club|crew|training partner|accountability|invite)\b/gi,
  },
  {
    id: "programs",
    hash: "#/programs",
    alt: "Liftsmith's program list: fixed programs such as 5x5 and full body, each with its days and length",
    caption: "Programs: follow a fixed plan when you'd rather run one, each one fitted to your gym.",
    words: /\b(5x5|programs?|linear progression|novice|starting strength|PPL|push[ ,/-]+pull[ ,/-]+legs|upper[ /-]lower)\b/gi,
  },
  {
    id: "library",
    hash: "#/library",
    alt: "Liftsmith's routine library: routines other lifters published, searchable by goal and level",
    caption: "The routine library: routines other lifters shared, one tap to save.",
    words: /\b(routine library|publish(ed)? routines?|shared routines?|templates?)\b/gi,
  },
  {
    id: "tools",
    hash: "#/tools",
    alt: "Liftsmith's Tools: calorie, macro, one-rep max, plate, warm-up, strength, body fat and heart rate zone calculators",
    caption: "Tools: the calculators lifters reach for, using your own numbers.",
    words: /\b(calculators?|tools?|FFMI|wilks|DOTS)\b/gi,
  },
  {
    id: "tdee",
    hash: "#/tools/tdee",
    alt: "Liftsmith's calorie calculator (TDEE): daily calories to maintain, lose or gain weight",
    caption: "Tools › Calories: your daily burn, worked out from your weigh-ins and the days you train.",
    words: /\b(TDEE|calories?|deficit|surplus|maintenance|bulk(ing)?|cut(ting)?|weight loss|lose (weight|fat)|fat loss|recomp|GLP-1)\b/gi,
  },
  {
    id: "macros",
    hash: "#/tools/macros",
    alt: "Liftsmith's macro calculator: protein, carbs and fat for the day",
    caption: "Tools › Macros: protein, carbs and fat that fit your goal.",
    words: /\b(protein|macros?|carbs?|carbohydrates?|fat intake|nutrition|diet|eat(ing)?|meals?|fibre|creatine)\b/gi,
  },
  {
    id: "onerm",
    hash: "#/tools/onerm",
    alt: "Liftsmith's one-rep max calculator: an estimated max from a weight and reps, with a table of percentages",
    caption: "Tools › One-rep max: your max from any set, with the weights for every percentage.",
    words: /\b(one[- ]rep max|1RM|max(es)?|percentages?|test(ing)? (your )?max)\b/gi,
  },
  {
    id: "plates",
    hash: "#/tools/plates",
    alt: "Liftsmith's plate calculator: which plates go on each side of the bar for a target weight",
    caption: "Tools › Plates: what goes on each side of the bar, from the plates your gym has.",
    words: /\b(plates?|plate math|loading the bar)\b/gi,
  },
  {
    id: "warmup",
    hash: "#/tools/warmup",
    alt: "Liftsmith's warm-up calculator: ramp-up sets leading to the first working weight",
    caption: "Tools › Warm-up: ramp-up sets to your first working weight, on weights your plates can make.",
    words: /\b(warm[- ]?ups?|ramp[- ]up|warming up)\b/gi,
  },
  {
    id: "strength",
    hash: "#/tools/strength",
    alt: "Liftsmith's strength standards: how a lift compares by body weight, from beginner to elite",
    caption: "Tools › Strength standards: where your lifts sit for your body weight.",
    words: /\b(strength standards?|how strong|elite|body ?weight ratio)\b/gi,
  },
  {
    id: "bodyfat",
    hash: "#/tools/bodyfat",
    alt: "Liftsmith's body fat calculator from tape measurements",
    caption: "Tools › Body fat: an estimate from a few tape measurements.",
    words: /\b(body fat|body composition|waist|measurements?|tape|lean mass|BMI)\b/gi,
  },
  {
    id: "hrzones",
    hash: "#/tools/hrzones",
    alt: "Liftsmith's heart rate zones: five zones worked out from age and resting heart rate",
    caption: "Tools › Heart rate zones: your five zones, from your age and resting heart rate.",
    words: /\b(heart rate|zone 2|zones?|cardio|aerobic|HIIT|running|cycling|conditioning|hybrid)\b/gi,
  },
  {
    id: "intervals",
    hash: "#/tools/intervals",
    alt: "Liftsmith's interval timer: work and rest rounds counted down with sounds",
    caption: "Tools › Intervals: work and rest rounds, counted down for you.",
    words: /\b(intervals?|HIIT|tabata|EMOM|AMRAP|circuits?|finishers?|timer|walking)\b/gi,
  },
  {
    id: "stretching",
    hash: "#/stretching",
    alt: "Liftsmith's stretching routines: warm-ups and cool-downs picked for the muscles you train",
    caption: "Stretching: a routine for the muscles you trained, with a 3D demo and timer for each stretch.",
    words: /\b(stretch(es|ing)?|mobility|flexib(le|ility)|tight|hips?|cool[- ]down|yoga)\b/gi,
  },
  {
    id: "injuries",
    hash: "#/injuries",
    alt: "Liftsmith's injury mode: pick what hurts and the plan works around it",
    caption: "Injury mode: tell the app what hurts and it skips or lightens what loads it.",
    words: /\b(injur(y|ies|ed)|pain|hurts?|rehab|physio(therapist)?|sore (knee|back|shoulder)|pregnan(t|cy)|postpartum)\b/gi,
  },
  {
    id: "gyms",
    hash: "#/gyms",
    alt: "Liftsmith's gyms and equipment: the equipment, plates and bars each gym has",
    caption: "Gyms and equipment: tell the app what your gym has and every workout uses only that.",
    words: /\b(home gyms?|equipment|garage gyms?|commercial gyms?|gym chains?|your gym has)\b/gi,
  },
  {
    id: "photos",
    hash: "#/photos",
    alt: "Liftsmith's body and photos screen: weigh-ins, body fat and progress photos lined up over time",
    caption: "Body and photos: weigh-ins, tape measurements and private progress photos in one place.",
    words: /\b(progress photos?|photos?|weigh[- ]ins?|body weight|scale|before and after|transformation)\b/gi,
  },
  {
    id: "season",
    hash: "#/season",
    alt: "Liftsmith's training season: a track of tiers earned by meeting the weekly goal",
    caption: "Training seasons: tiers earned by hitting your own weekly goal, never past it.",
    words: /\b(training seasons?|season pass|tiers?|weekly goal)\b/gi,
  },
  {
    id: "community",
    hash: "#/community",
    alt: "Liftsmith's community board: ideas and bugs lifters posted, with votes and statuses",
    caption: "Community: post an idea or a bug, vote, and follow it to Shipped.",
    words: /\b(community|feature requests?|roadmap|vote|ideas?|bugs?)\b/gi,
  },
  {
    id: "coaching",
    hash: "#/coaching/clients",
    alt: "Liftsmith's coaching screen: clients, messages and check-ins for a coach",
    caption: "Coaching: clients, messages, check-ins and programs in one place.",
    words: /\b(coach(es|ing)?|clients?|personal trainers?|trainers?|check[- ]ins?|athletes?|teams?)\b/gi,
  },
  {
    id: "connections",
    hash: "#/connections",
    alt: "Liftsmith's connected apps: Health Connect, Apple Health, watches and heart rate monitors",
    caption: "Connected apps: health apps, watches and heart rate straps, with what each one shares.",
    words: /\b(connect(ed|ions?)?|sync|watch(es)?|Wear OS|Apple Watch|Garmin|Bluetooth|integrations?|import)\b/gi,
  },
  {
    id: "training",
    hash: "#/settings/training",
    alt: "Liftsmith's training settings: goal, days a week, workout length, adaptive workout options and supersets",
    caption: "Settings › Training: your goal, days, minutes and how adaptive workouts are built.",
    words: /\b(hypertrophy|short workouts?|rep ranges?|RIR|reps in reserve|deloads?|blocks?|periodi[sz]ation)\b/gi,
  },
  {
    id: "labs",
    hash: "#/settings/labs",
    alt: "Liftsmith's Labs: experimental features such as camera rep counting, bar speed and voice logging",
    caption: "Labs: experiments like camera rep counting, bar speed and voice logging, each with its own switch.",
    words: /\b(labs?|camera|rep count(ing|er)|bar speed|velocity|VBT|voice|tempo|experimental)\b/gi,
  },
  {
    id: "look",
    hash: "#/settings/look",
    alt: "Liftsmith's look and feel settings: appearance, text size, colour-blind safe colours and contrast",
    caption: "Settings › Look and feel: light or dark, bigger text, colour-blind safe colours and more contrast.",
    words: /\b(accessib(le|ility)|text size|colour[- ]blind|contrast|dark mode|light mode|themes?|language)\b/gi,
  },
  {
    id: "reminders",
    hash: "#/settings/reminders",
    alt: "Liftsmith's reminders: workout reminders, recaps and emails, each with its own switch",
    caption: "Settings › Reminders: a nudge on your training days and a weekly recap.",
    words: /\b(reminders?|notifications?|recaps?|emails?|calendar|widgets?|badge)\b/gi,
  },
  {
    id: "exercises",
    hash: "#/exercises",
    alt: "Liftsmith's exercise library: a thousand exercises searchable by muscle and equipment",
    caption: "The exercise library: a thousand lifts, each with a 3D demo, cues and your history.",
    words: /\b(exercise library|alternatives?|swap(s|ped)?|variations?)\b/gi,
  },
  {
    id: "exercise",
    hash: "#/exercise/back-squat",
    alt: "An exercise page in Liftsmith: the 3D demo, the muscles it works, setup cues and your best sets",
    caption: "An exercise page: the 3D demo, the muscles it works, cues and your own history with the lift.",
    words: /\b(how to (do|perform)|form cues?|technique|3D demo|common mistakes|muscles worked)\b/gi,
  },
];

export const SCREEN_BY_ID = new Map(APP_SCREENS.map((s) => [s.id, s]));

/** The screen each call-to-action topic is about, always shown when nothing else fits better. */
const CTA_SCREEN: Record<CtaTopic, string> = {
  plan: "today",
  plates: "plates",
  onerm: "onerm",
  recovery: "muscles",
  rest: "rest",
  warmup: "warmup",
  deload: "training",
  progress: "progress",
  home: "gyms",
  bodyweight: "today",
  time: "training",
  heart: "hrzones",
  injury: "injuries",
  comeback: "today",
  tdee: "tdee",
  log: "workout",
  rir: "training",
  labs: "labs",
  watch: "connections",
  measure: "photos",
  health: "health",
  stretch: "stretching",
  coach: "coaching",
  challenge: "today",
};

/** Lifts to draw when a post names none: its subject's own (running → a run), else the big staples. */
const TOPIC_FIGURES: [RegExp, string[]][] = [
  [/\b(ruck(ing)?)\b/i, ["rucking", "farmers-carry", "step-up"]],
  [/\b(walk(ing)?|steps|walking pad)\b/i, ["incline-walk", "treadmill-walk", "brisk-walk"]],
  [/\b(run(ning)?|zone 2|VO2|cardio|aerobic|hybrid|conditioning)\b/i, ["treadmill-run", "stationary-bike", "rowing-machine"]],
  [/\b(HIIT|intervals?|finishers?|circuits?|tabata)\b/i, ["air-bike", "kb-swing", "battle-ropes"]],
  [/\b(core|abs|plank)\b/i, ["plank", "dead-bug", "hanging-knee-raise"]],
  [/\b(kettlebells?)\b/i, ["kb-swing", "kb-goblet-squat", "kb-press"]],
  [/\b(bands?)\b/i, ["band-row", "band-squat", "band-chest-press"]],
  [/\b(bodyweight|calisthenics|no equipment|at home|home workouts?)\b/i, ["push-up", "bodyweight-squat", "inverted-row"]],
  [/\b(dumbbells?)\b/i, ["db-bench-press", "goblet-squat", "db-row"]],
  [/\b(pregnan(t|cy)|postpartum|over (50|60)|older|menopause|seniors?)\b/i, ["goblet-squat", "glute-bridge", "band-row"]],
  [/\b(glutes?|hips?)\b/i, ["hip-thrust", "romanian-deadlift", "bulgarian-split-squat"]],
  [/\b(legs?|squats?)\b/i, ["back-squat", "leg-press", "walking-lunge"]],
  [/\b(back|pull(-| )?ups?|rows?)\b/i, ["pull-up", "barbell-row", "seated-cable-row"]],
  [/\b(chest|bench)\b/i, ["bench-press", "incline-bench-press", "push-up"]],
  [/\b(shoulders?|overhead)\b/i, ["overhead-press", "db-shoulder-press", "push-press"]],
  [/\b(arms?|biceps|triceps|curls?)\b/i, ["barbell-curl", "hammer-curl", "rope-pushdown"]],
  [/\b(machines?|cables?)\b/i, ["leg-press", "machine-chest-press", "seated-cable-row"]],
];
/** The big lifts, for posts about training in general. Which three depends on the post, so they vary. */
const STAPLES = [
  "back-squat",
  "bench-press",
  "deadlift",
  "overhead-press",
  "pull-up",
  "barbell-row",
  "romanian-deadlift",
  "hip-thrust",
  "goblet-squat",
  "push-up",
];

/** A small stable number from a string, so a post's fallback picks never change between builds. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Everything a reader reads in the post, for matching words. */
export function articleText(a: Article): string {
  const body = a.body.flatMap((b) =>
    "p" in b ? [b.p] : "tip" in b ? [b.tip] : "ul" in b ? b.ul : "ol" in b ? b.ol : "h2" in b ? [b.h2] : [],
  );
  return [a.title, a.description, ...body, ...(a.faq ?? []).flat()].join("\n");
}

/** Exercise names long enough to mean one lift ("Back squat", not "Row"), longest first, the website's page for each. */
const NAMES: [RegExp, string][] = EXERCISES.filter((e) => e.name.length >= 7 && !WEB_TWIN[e.id])
  .sort((x, y) => y.name.length - x.name.length)
  .map((e) => [new RegExp(`\\b${e.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "i"), e.id]);

/** The lifts a post links to or lists, then the ones it names, in the order they first appear. */
export function articleLifts(a: Article): string[] {
  const out: string[] = [];
  const add = (id: string) => {
    const kept = WEB_TWIN[id] ?? id;
    if (EXERCISE_BY_ID.has(kept) && !out.includes(kept)) out.push(kept);
  };
  for (const b of a.body) {
    if ("exercises" in b) b.exercises.forEach(add);
    for (const m of JSON.stringify(b).matchAll(/\/exercises\/([a-z0-9-]+)\//g)) add(m[1]!);
  }
  const text = articleText(a);
  const named: [number, string][] = [];
  let rest = text;
  for (const [re, id] of NAMES) {
    const m = re.exec(rest);
    if (!m) continue;
    named.push([text.indexOf(m[0]), id]);
    // Blank the match so "Bench press" inside "Incline bench press" isn't counted again.
    rest = rest.slice(0, m.index) + " ".repeat(m[0].length) + rest.slice(m.index + m[0].length);
  }
  named.sort((x, y) => x[0] - y[0]).forEach(([, id]) => add(id));
  return out;
}

/** How strongly a post is about each screen: its words in the title count three times, the summary twice. */
export function screenScores(a: Article): Map<string, number> {
  const body = articleText(a);
  const scores = new Map<string, number>();
  for (const s of APP_SCREENS) {
    const n = (t: string) => t.match(s.words)?.length ?? 0;
    const score = n(a.title) * 3 + n(a.description) * 2 + n(body);
    if (score) scores.set(s.id, score);
  }
  return scores;
}

export interface ArticleImage {
  kind: "screen" | "figure";
  src: string;
  /** A 540 px copy for phones (screens only). */
  small?: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  /** The exercise page a figure links to. */
  href?: string;
}

export const SCREEN_SIZE = { width: 780, height: 1688 } as const;
export const FIGURE_SIZE = { width: 640, height: 640 } as const;
/** The preview at the top of each post: the og:image's card as WebP. */
export const HERO_SIZE = { width: 1200, height: 630 } as const;
export const heroSrc = (a: Article) => `/og/articles/${a.slug}.webp`;

export const screenSrc = (id: string) => `/articles/app/${id}.webp`;
export const figureSrc = (id: string) => `/articles/fig/${id}.webp`;

function screenImage(id: string): ArticleImage {
  const s = SCREEN_BY_ID.get(id)!;
  return { kind: "screen", src: screenSrc(id), small: screenSrc(`${id}-540`), ...SCREEN_SIZE, alt: s.alt, caption: s.caption };
}

function figureImage(id: string): ArticleImage {
  const e = EXERCISE_BY_ID.get(id)!;
  const muscles = e.primary.map((m) => MUSCLE_NAME[m].toLowerCase());
  const lit = muscles.length > 1 ? `${muscles.slice(0, -1).join(", ")} and ${muscles.at(-1)}` : muscles[0];
  return {
    kind: "figure",
    src: figureSrc(id),
    ...FIGURE_SIZE,
    alt: `${e.name} shown by Liftsmith's 3D figure mid-rep, with the ${lit} lit up`,
    caption: `${e.name}, from the 3D demo in the app. Working hardest: ${lit}.`,
    href: `/exercises/${id}/`,
  };
}

/** The preview card's figure: the post's first lift, else one picked from its subject. */
export function articleFigures(a: Article): string[] {
  const lifts = articleLifts(a);
  const text = `${a.title}\n${a.description}`;
  const topic = TOPIC_FIGURES.find(([re]) => re.test(text));
  const start = hash(a.slug) % STAPLES.length;
  const staples = [...STAPLES.slice(start), ...STAPLES.slice(0, start)];
  return [...new Set([...lifts, ...(topic?.[1] ?? []), ...staples])].filter((id) => EXERCISE_BY_ID.has(id));
}

/**
 * The pictures inside a post, 3 to 6, screens and figures taking turns: the screens it is most about (one to three,
 * always including its call to action's screen) and the lifts it names (two or three).
 */
export function articleImages(a: Article): ArticleImage[] {
  const scores = screenScores(a);
  const cta = CTA_SCREEN[a.cta];
  scores.set(cta, (scores.get(cta) ?? 0) + 4);
  const ranked = [...scores].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).map(([id]) => id);
  const screens = ranked.filter((id, i) => i === 0 || (scores.get(id) ?? 0) >= 3).slice(0, 3);
  const lifts = articleLifts(a);
  const figures = articleFigures(a).slice(0, lifts.length >= 3 ? 3 : 2);
  const out: ArticleImage[] = [];
  for (let i = 0; i < Math.max(screens.length, figures.length); i++) {
    if (screens[i]) out.push(screenImage(screens[i]!));
    if (figures[i]) out.push(figureImage(figures[i]!));
  }
  return out.slice(0, 6);
}

/** Every figure any post shows, for scripts/og-images.mjs. */
export function articleFigureIds(articles: Article[]): string[] {
  return [
    ...new Set(
      articles.flatMap((a) =>
        articleImages(a)
          .filter((i) => i.kind === "figure")
          .map((i) => i.src.split("/").pop()!.replace(".webp", "")),
      ),
    ),
  ];
}
