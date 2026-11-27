// The shapes of a translated tool page (/<lang>/tools/<slug>/, docs/decisions/public-pages-and-seo.md "Translated
// tools"). The calculators' own words are passed in as plain text (`…Ui`), so a page sends only its own language
// to the browser; each calculator keeps its English words as the default. Placeholders in {braces} are filled by
// `fill()` (src/lib/siteLang.ts): {unit} kg or lb, {n} a count, {app} the app's name, and the ones named per line.

/** The calculators that have a page in every language. The first three are also the ones other sites can embed;
 * TDEE, macros, Wilks and DOTS joined on 2026-11-15 (the traffic plan's calculator pages), the workout generator on
 * 2026-11-27 (docs/decisions/workout-generator.md). */
export const LOCAL_TOOL_SLUGS = [
  "plate-calculator",
  "one-rep-max-calculator",
  "warm-up-calculator",
  "tdee-calculator",
  "macro-calculator",
  "wilks-calculator",
  "dots-calculator",
  "workout-generator",
] as const;
export type LocalToolSlug = (typeof LOCAL_TOOL_SLUGS)[number];

/** The English paths of the translated tools, for hreflang and the sitemap. */
export const LOCAL_TOOL_PATHS: readonly string[] = LOCAL_TOOL_SLUGS.map((s) => `/tools/${s}/`);

export interface PlateUi {
  units: string;
  /** {unit} */
  weight: string;
  weightAria: string;
  bar: string;
  plates: string;
  loadThis: string;
  /** {want} with its unit. */
  cantMake: string;
  /** {plates}: "20 + 10" */
  eachSide: string;
  justBar: string;
  /** {below} with its unit. */
  closestOne: string;
  /** {below} and {above}, each with its unit. */
  closestTwo: string;
}

export interface OneRmUi {
  units: string;
  /** {unit} */
  weight: string;
  weightAria: string;
  reps: string;
  repsAria: string;
  left: string;
  failure: string;
  leftNote: string;
  rough: string;
  estimate: string;
  tableCaption: string;
  colReps: string;
  colWeight: string;
  colPct: string;
  formulas: string;
  /** {n} reps to failure. */
  formulasNote: string;
}

export interface WarmupUi {
  units: string;
  lift: string;
  /** Short chip names for the five barbell lifts, by exercise id. */
  lifts: Record<string, string>;
  /** {unit} */
  work: string;
  workAria: string;
  /** {n} sets, {rest} seconds. */
  setsOne: string;
  setsMany: string;
  none: string;
  /** {weight} with its unit. */
  working: string;
  /** {plates} */
  eachSide: string;
  empty: string;
}

/** The TDEE calculator's inputs. Its results and the activity levels use the app's own lines (tdee.*, bmi.*,
 * activity.*), which the page reads on the server (`tdeeWords` in src/locales/site/fromApp.ts). */
export interface TdeeUi {
  units: string;
  metric: string;
  imperial: string;
  sex: string;
  female: string;
  male: string;
  age: string;
  weightKg: string;
  weightLb: string;
  heightCm: string;
  heightIn: string;
  fat: string;
  skip: string;
  add: string;
  fatPct: string;
  activity: string;
}

/** The macro calculator. Activity levels come from the app's lines too. */
export interface MacroUi {
  units: string;
  metric: string;
  imperial: string;
  goal: string;
  cut: string;
  maintain: string;
  bulk: string;
  sex: string;
  female: string;
  male: string;
  age: string;
  weightKg: string;
  weightLb: string;
  heightCm: string;
  heightIn: string;
  activity: string;
  kcalDay: string;
  protein: string;
  fat: string;
  carbs: string;
  /** {perKg} grams per kg. */
  proteinCut: string;
  proteinMaintain: string;
  proteinBulk: string;
  fatWhy: string;
  carbsWhy: string;
  /** {bmr} calories. */
  kcalFloor: string;
  /** {tdee} calories, {pace} a weight a week. */
  kcalCut: string;
  kcalMaintain: string;
  kcalBulk: string;
  /** {meals} */
  meals: string;
}

/** DOTS levels, the same rough cut-offs as the app. */
export interface DotsLevels {
  beginner: string;
  novice: string;
  intermediate: string;
  advanced: string;
  elite: string;
}

export interface WilksUi {
  units: string;
  formula: string;
  men: string;
  women: string;
  gear: string;
  classic: string;
  equipped: string;
  /** {unit} */
  bw: string;
  squat: string;
  bench: string;
  deadlift: string;
  /** {lift} and {unit} */
  liftLabel: string;
  /** {total} and {unit} */
  total: string;
  /** {level} */
  level: string;
  /** {weight}, {unit}, {level}, {score} */
  next: string;
  elite: string;
  note: string;
  levels: DotsLevels;
}

export interface DotsUi {
  unitsSex: string;
  men: string;
  women: string;
  /** {unit} */
  bw: string;
  squat: string;
  bench: string;
  deadlift: string;
  /** {lift} and {unit} */
  liftLabel: string;
  /** {total} and {unit} */
  total: string;
  note: string;
  levels: DotsLevels;
}

/**
 * The workout generator (docs/decisions/workout-generator.md). Its chips, its result and the short reason on each
 * exercise. The reasons are built from the same data the engine used (the muscle, compound or not, the goal's rep
 * range, the set count, a superset partner), one whole line per reason, joined with " · ".
 */
export interface GenUi {
  // The focus names and the workout's name are the app's own lines (gen.*, fromApp.ts `genWords`), so the routine
  // the app opens has the same name.
  equipment: string;
  kits: { commercial: string; home: string; dumbbells: string; bodyweight: string };
  /** Opens the list of single pieces of equipment. */
  custom: string;
  customHint: string;
  minutes: string;
  /** {n} minutes. */
  minutesValue: string;
  focus: string;
  goal: string;
  goals: { muscle: string; strength: string; general: string };
  level: string;
  levels: { new: string; intermediate: string; advanced: string };
  pairs: string;
  pairsHint: string;
  make: string;
  another: string;
  working: string;
  error: string;
  nothing: string;
  /** {n} minutes. */
  about: string;
  /** {n} minutes, when the workout is shorter than asked. */
  short: string;
  order: string;
  /** {sets} and {reps}. */
  setsReps: string;
  /** {sets} and {secs}. */
  setsSecs: string;
  /** {time}: "2:00" or "45 s". */
  rest: string;
  /** {n} reps in reserve. */
  tank: string;
  holdForm: string;
  /** {n} warm-up sets. */
  warmups: string;
  /** {letter} */
  superset: string;
  /** Why it's here: {muscle}. */
  whyFirst: string;
  whyCompound: string;
  whyIsolation: string;
  whyBodyweight: string;
  whyHold: string;
  /** Why these reps: {lo}, {hi} and {reps} (seconds for a hold). */
  repsMuscle: string;
  repsStrength: string;
  repsGeneral: string;
  repsBodyweight: string;
  repsHold: string;
  /** Why this many sets: {sets}. */
  mainSets: string;
  moreSets: string;
  /** Why it's in a superset: {other}. */
  pair: string;
  share: string;
  copied: string;
  start: string;
  /** {app} */
  startHint: string;
  example: string;
  /** On a phone, jumps down to the workout after a change. */
  see: string;
}

export interface ToolUi {
  "plate-calculator": PlateUi;
  "one-rep-max-calculator": OneRmUi;
  "warm-up-calculator": WarmupUi;
  "tdee-calculator": TdeeUi;
  "macro-calculator": MacroUi;
  "wilks-calculator": WilksUi;
  "dots-calculator": DotsUi;
  "workout-generator": GenUi;
}

/** The words of one tool page around its calculator. {app} is the app's name; the warm-up page also has {rest}. */
export interface ToolPageText {
  title: string;
  description: string;
  name: string;
  intro: string;
  sticky: string;
  mid: { title: string; body: string; button: string };
  end: { title: string; body: string };
  faq: [string, string][];
  more?: { heading: string; paragraphs: string[] };
  /** Further reading; English pages unless the link is to another translated tool. */
  reading: { href: string; label: string }[];
}

/** The frame shared by every translated tool page. */
export interface ToolFrameText {
  tools: string;
  questions: string;
  more: string;
  /** Joins the last two reading links. */
  and: string;
  englishLinks: string;
}

export type LocalTools = { frame: ToolFrameText } & { [S in LocalToolSlug]: { page: ToolPageText; ui: ToolUi[S] } };
