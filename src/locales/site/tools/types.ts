// The shapes of a translated tool page (/<lang>/tools/<slug>/, docs/decisions/public-pages-and-seo.md "Translated
// tools"). The calculators' own words are passed in as plain text (`…Ui`), so a page sends only its own language
// to the browser; each calculator keeps its English words as the default. Placeholders in {braces} are filled by
// `fill()` (src/lib/siteLang.ts): {unit} kg or lb, {n} a count, {app} the app's name, and the ones named per line.

/** The three calculators that have a page in every language (also the ones other sites can embed). */
export const LOCAL_TOOL_SLUGS = ["plate-calculator", "one-rep-max-calculator", "warm-up-calculator"] as const;
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

export interface ToolUi {
  "plate-calculator": PlateUi;
  "one-rep-max-calculator": OneRmUi;
  "warm-up-calculator": WarmupUi;
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
