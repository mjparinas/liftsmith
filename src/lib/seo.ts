// The public SEO pages (exercises, muscles, equipment, muscle + equipment pairs, alternatives, guides, blog,
// tools) and the one route list the sitemap is built from. Everything comes from the same exercise library the
// app plans with, so a new exercise gets its pages and its sitemap entry without touching this file.
import { ARTICLES, type Article } from "@/content/articles";
import { BLOG_TOPICS, topicPath } from "@/content/blogTopics";
import { ALTERNATIVES, COMPETITORS } from "@/content/compare";
import { IMPORT_SOURCES } from "@/content/imports";
import { landingPath, LANDINGS } from "@/content/landings";

import { EXERCISE_BY_ID, EXERCISES } from "./exercises";
import { alternatives } from "./generator";
import { SITE_URL } from "./site";
import { languageAlternates, LOCALIZED_PATHS, localPath, SITE_LANGS } from "./siteLang";
import { EQUIPMENT, MUSCLES, type Equipment, type Exercise, type Muscle } from "./types";
import { WHATS_NEW } from "./whatsNew";

/** frontDelts → front-delts. */
export const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

export const muscleSlug = (m: Muscle) => kebab(m);
export const equipmentSlug = (e: Equipment) => kebab(e);
export const muscleBySlug = (s: string) => MUSCLES.find((m) => muscleSlug(m) === s) ?? null;
export const equipmentBySlug = (s: string) => EQUIPMENT.find((e) => equipmentSlug(e) === s) ?? null;
export const exerciseBySlug = (s: string) => EXERCISE_BY_ID.get(s) ?? null;

// English labels for the public site (the app's MUSCLE_LABEL and EQUIPMENT_LABEL follow the phone's language,
// but the site is English only for now).
export const MUSCLE_NAME: Record<Muscle, string> = {
  chest: "Chest",
  frontDelts: "Front delts",
  sideDelts: "Side delts",
  rearDelts: "Rear delts",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  abs: "Abs",
  obliques: "Obliques",
  traps: "Traps",
  upperBack: "Upper back",
  lats: "Lats",
  lowerBack: "Lower back",
  glutes: "Glutes",
  quads: "Quads",
  hamstrings: "Hamstrings",
  adductors: "Adductors",
  calves: "Calves",
};
export const EQUIPMENT_NAME: Record<Equipment, string> = {
  barbell: "Barbell",
  ezBar: "EZ curl bar",
  trapBar: "Trap bar",
  dumbbells: "Dumbbells",
  kettlebells: "Kettlebells",
  bench: "Flat bench",
  inclineBench: "Adjustable bench",
  rack: "Squat rack",
  pullupBar: "Pull-up bar",
  dipBars: "Dip bars",
  cable: "Cable machine",
  latPulldown: "Lat pulldown",
  seatedRow: "Seated row machine",
  legPress: "Leg press",
  legExtension: "Leg extension machine",
  legCurl: "Leg curl machine",
  chestPress: "Chest press machine",
  pecDeck: "Pec deck",
  shoulderPress: "Shoulder press machine",
  smith: "Smith machine",
  hackSquat: "Hack squat machine",
  calfMachine: "Calf raise machine",
  hipMachine: "Hip abduction and adduction machine",
  preacher: "Preacher curl bench",
  assistedPullup: "Assisted pull-up machine",
  bands: "Resistance bands",
  rings: "Gymnastic rings",
  box: "Plyo box or step",
  abWheel: "Ab wheel",
  medicineBall: "Medicine ball",
  jumpRope: "Jump rope",
  treadmill: "Treadmill",
  rower: "Rowing machine",
  bike: "Exercise bike",
  elliptical: "Cross trainer",
  stairClimber: "Stair climber",
  skiErg: "Ski machine",
  sled: "Sled",
  battleRopes: "Battle ropes",
};

/** The equipment as a word before "exercises": "Kettlebell exercises", not "Kettlebells exercises". */
const EQUIPMENT_SINGULAR: Partial<Record<Equipment, string>> = {
  dumbbells: "Dumbbell",
  kettlebells: "Kettlebell",
  bands: "Resistance band",
  rings: "Gymnastic ring",
  battleRopes: "Battle rope",
};
/** "Kettlebell" → "kettlebell", but "EZ curl bar" keeps its capitals. */
export const lowerName = (s: string) => (/^[A-Z][a-z]/.test(s) ? s[0]!.toLowerCase() + s.slice(1) : s);
export const equipmentLabel = (eq: Equipment) => EQUIPMENT_SINGULAR[eq] ?? EQUIPMENT_NAME[eq];

/** One plain line on what each muscle does, for its page. */
export const MUSCLE_ABOUT: Record<Muscle, string> = {
  chest: "Your chest (pectorals) pushes your arms forward and across your body. It drives every press and push-up.",
  frontDelts: "The front of the shoulder lifts your arm forward and overhead, and helps in every press.",
  sideDelts: "The side of the shoulder lifts your arm out to the side. It's what makes shoulders look broad.",
  rearDelts: "The back of the shoulder pulls your arm back. It balances all the pressing and keeps shoulders healthy.",
  biceps: "Your biceps bend the elbow and turn the palm up. They work in every pull and row too.",
  triceps: "Your triceps straighten the elbow. They're two thirds of your upper arm and finish every press.",
  forearms: "Your forearms run your grip. A stronger grip holds heavier pulls, carries and rows.",
  abs: "Your abs brace your trunk and curl your spine. A strong brace protects your back under a heavy bar.",
  obliques: "Your obliques twist and side-bend your trunk, and stop it from twisting when you don't want it to.",
  traps: "Your traps lift and steady the shoulder blades. They hold heavy deadlifts, carries and shrugs.",
  upperBack: "The upper back (rhomboids and mid traps) squeezes your shoulder blades together, for posture and big rows.",
  lats: "Your lats pull your arms down and back. They're the widest muscle of your back and power every pull-up.",
  lowerBack: "The muscles along your spine hold it straight when you hinge, squat or pick something heavy up.",
  glutes: "Your glutes extend the hip. They're the biggest muscle in the body, and drive squats, hinges and sprints.",
  quads: "Your quads straighten the knee. They do most of the work in squats, lunges, leg presses and stairs.",
  hamstrings: "Your hamstrings bend the knee and extend the hip. They power hinges and protect the knee.",
  adductors: "Your inner thighs pull your legs together and steady the hip in wide squats and lunges.",
  calves: "Your calves point the foot. They push you off the ground in every step, jump and sprint.",
};

export function exerciseName(id: string): string {
  return EXERCISE_BY_ID.get(id)?.name ?? id;
}

/** Exercises that train a muscle as a main mover. */
export const exercisesFor = (m: Muscle): Exercise[] => EXERCISES.filter((e) => e.primary.includes(m));
/** Exercises that need a piece of equipment. */
export const exercisesWith = (eq: Equipment): Exercise[] => EXERCISES.filter((e) => e.needs.includes(eq));
/** Bodyweight-only exercises: nothing needed. */
export const noEquipment = (): Exercise[] => EXERCISES.filter((e) => e.needs.length === 0);

/** Equipment with at least one exercise in the library. */
export const equipmentWithPages = (): Equipment[] => EQUIPMENT.filter((eq) => exercisesWith(eq).length > 0);

/** A muscle and equipment page only exists when there are 3+ exercises for it, so no page is thin. */
export const PAIR_MIN = 3;
export const pairExercises = (m: Muscle, eq: Equipment) => exercisesFor(m).filter((e) => e.needs.includes(eq));
export function pairs(): { muscle: Muscle; equipment: Equipment; count: number }[] {
  const out: { muscle: Muscle; equipment: Equipment; count: number }[] = [];
  for (const muscle of MUSCLES)
    for (const equipment of EQUIPMENT) {
      const count = pairExercises(muscle, equipment).length;
      if (count >= PAIR_MIN) out.push({ muscle, equipment, count });
    }
  return out;
}
export const pairsFor = (m: Muscle) => pairs().filter((p) => p.muscle === m);
export const pairsWith = (eq: Equipment) => pairs().filter((p) => p.equipment === eq);

/** Alternatives for any gym (the app's own swap ranking, without a gym's equipment limit). */
export const alternativesTo = (id: string, n = 12): Exercise[] => alternatives(id, null).slice(0, n);

/** "Barbell, flat bench and squat rack", or "No equipment". */
export function needsText(e: Exercise): string {
  if (!e.needs.length) return "No equipment";
  const names = e.needs.map((n) => EQUIPMENT_NAME[n]);
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export const articlesOf = (kind: Article["kind"]) => ARTICLES.filter((a) => a.kind === kind).sort((a, b) => b.date.localeCompare(a.date));
export const articlePath = (a: Article) => `/${a.kind === "guide" ? "guides" : "blog"}/${a.slug}/`;

export const TOOL_PAGES = [
  {
    path: "/tools/plate-calculator/",
    name: "Plate calculator",
    blurb: "Which plates go on each side of the bar for any weight, with the plates you own.",
  },
  {
    path: "/tools/one-rep-max-calculator/",
    name: "One-rep max calculator",
    blurb: "Your estimated max from any set, with a reps-to-weight table and every formula's answer.",
  },
  {
    path: "/tools/warm-up-calculator/",
    name: "Warm-up calculator",
    blurb: "The warm-up sets for any working weight on the squat, bench, deadlift, press or row, with the plates for each.",
  },
  {
    path: "/tools/rpe-chart/",
    name: "RPE chart",
    blurb: "The weight for every rep count at every RPE and reps in reserve, from your one-rep max.",
  },
  {
    path: "/tools/strength-standards/",
    name: "Strength standards",
    blurb: "How strong am I? One lift against lifters of your body weight, age and sex.",
  },
  {
    path: "/tools/dots-calculator/",
    name: "DOTS calculator",
    blurb: "Your powerlifting total scored for body weight, so lifters of any size can compare.",
  },
  {
    path: "/tools/tdee-calculator/",
    name: "TDEE calculator",
    blurb: "Calories a day to maintain, cut or lean bulk, with a protein range for lifters.",
  },
] as const;

export interface Route {
  path: string;
  /** ISO date, when the page has one (articles). */
  date?: string;
  priority: number;
  /** For a page in every site language: each language's path, plus x-default (hreflang in the sitemap). */
  languages?: Record<string, string>;
}

/** Every public page, for the sitemap. A new page type adds its paths here. */
export function siteRoutes(): Route[] {
  const r: Route[] = [
    { path: "/", priority: 1 },
    { path: "/exercises/", priority: 0.8 },
    { path: "/muscles/", priority: 0.8 },
    { path: "/equipment/", priority: 0.7 },
    { path: "/guides/", priority: 0.7 },
    { path: "/blog/", priority: 0.8 },
    ...BLOG_TOPICS.map((t) => ({ path: topicPath(t), priority: 0.6 })),
    { path: "/tools/", priority: 0.7 },
    ...TOOL_PAGES.map((t) => ({ path: t.path, priority: 0.8 })),
    { path: "/privacy/", priority: 0.2 },
    { path: "/delete-account/", priority: 0.2 },
    { path: "/trust/", priority: 0.3 },
    { path: "/terms/", priority: 0.2 },
    { path: "/accessibility/", priority: 0.3 },
    { path: "/pricing/", priority: 0.8 },
    { path: "/help/", priority: 0.6 },
    { path: "/contact/", priority: 0.4 },
    { path: "/about/", priority: 0.4 },
    { path: "/whats-new/", priority: 0.5, date: WHATS_NEW[0]?.day },
    { path: "/status/", priority: 0.2 },
    { path: "/compare/", priority: 0.6 },
    { path: "/compare/best-workout-apps/", priority: 0.7 },
    ...ALTERNATIVES.map((a) => ({ path: `/alternatives/${a.slug}/`, priority: 0.7 })),
    ...COMPETITORS.map((c) => ({ path: `/compare/${c.slug}/`, priority: 0.7 })),
    ...IMPORT_SOURCES.map((s) => ({ path: `/import/${s.slug}/`, priority: 0.7 })),
    { path: "/apps/", priority: 0.7 },
    { path: "/features/", priority: 0.7 },
    ...LANDINGS.map((l) => ({ path: landingPath(l), priority: 0.7 })),
  ];
  // The translated pages (src/lib/siteLang.ts): every language's copy, each listing all of them.
  for (const path of LOCALIZED_PATHS) {
    const languages = languageAlternates(path);
    for (const route of r) if (route.path === path) route.languages = languages;
    for (const lang of SITE_LANGS) {
      const english = r.find((x) => x.path === path);
      if (lang !== "en" && english) r.push({ path: localPath(lang, path), priority: english.priority, languages });
    }
  }
  for (const e of EXERCISES) {
    r.push({ path: `/exercises/${e.id}/`, priority: 0.6 });
    if (alternativesTo(e.id).length) r.push({ path: `/exercises/${e.id}/alternatives/`, priority: 0.5 });
  }
  for (const m of MUSCLES) if (exercisesFor(m).length) r.push({ path: `/muscles/${muscleSlug(m)}/`, priority: 0.7 });
  for (const p of pairs()) r.push({ path: `/muscles/${muscleSlug(p.muscle)}/${equipmentSlug(p.equipment)}/`, priority: 0.6 });
  for (const eq of equipmentWithPages()) r.push({ path: `/equipment/${equipmentSlug(eq)}/`, priority: 0.6 });
  for (const a of ARTICLES) r.push({ path: articlePath(a), date: a.updated ?? a.date, priority: a.kind === "guide" ? 0.7 : 0.6 });
  return r;
}

export const absolute = (path: string) => `${SITE_URL}${path}`;

/** Structured data for a hub page of exercises (muscle, equipment, muscle + equipment): a CollectionPage whose
 * main entity is the list of exercises, each with its own page. */
export function exerciseCollection(name: string, path: string, list: readonly Exercise[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: absolute(path),
    mainEntity: {
      "@type": "ItemList",
      name,
      numberOfItems: list.length,
      itemListElement: list.map((e, i) => ({ "@type": "ListItem", position: i + 1, url: absolute(`/exercises/${e.id}/`), name: e.name })),
    },
  };
}
