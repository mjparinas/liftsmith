// Social preview images (og:image) for every public page. Each page maps to one 1200×630 card under
// public/og/, drawn by scripts/og-images.mjs from the app's own 3D figure. Exercise pages and their
// alternatives share the exercise's card; a muscle page and its muscle + equipment pages share the
// muscle's card, so about 450 cards cover all 800 pages. A page with no card of its own gets the default.
import { ARTICLES } from "@/content/articles";
import { COMPETITORS } from "@/content/compare";

import { BRAND } from "./brand";
import { EXERCISE_BY_ID, EXERCISES } from "./exercises";
import { equipmentLabel, equipmentSlug, equipmentWithPages, exercisesFor, exercisesWith, MUSCLE_NAME, muscleSlug, TOOL_PAGES } from "./seo";
import { MUSCLES } from "./types";

export const OG_SIZE = { width: 1200, height: 630 } as const;

/** The figure on the default card and on articles that don't name an exercise. */
export const DEFAULT_FIGURE = "back-squat";

export interface OgCard {
  /** Under public/og/, e.g. "exercises/back-squat.jpg". */
  file: string;
  kicker: string;
  title: string;
  /** The exercise whose 3D figure is drawn on the card. */
  exercise: string;
}

/** The card file for a public path ("/exercises/back-squat/alternatives/" → "exercises/back-squat.jpg"). */
export function ogFile(path: string): string {
  const seg = path.split("/").filter(Boolean);
  const [kind, a] = seg;
  if (!kind || !a) return "default.jpg";
  if (kind === "exercises" && EXERCISE_BY_ID.has(a)) return `exercises/${a}.jpg`;
  if (kind === "muscles") return `muscles/${a}.jpg`;
  if (kind === "equipment") return `equipment/${a}.jpg`;
  if (kind === "blog" || kind === "guides") return `articles/${a}.jpg`;
  if (kind === "compare") return `compare/${a}.jpg`;
  if (kind === "tools") return `tools/${a}.jpg`;
  return "default.jpg";
}

/** The image URL for a public path's og:image (made absolute by metadataBase). */
export const ogImage = (path: string) => `/og/${ogFile(path)}`;

/** The first exercise an article links to or lists, for its card's figure. */
function articleFigure(body: unknown): string {
  const text = JSON.stringify(body);
  for (const m of text.matchAll(/\/exercises\/([a-z0-9-]+)\//g)) if (m[1] && EXERCISE_BY_ID.has(m[1])) return m[1];
  for (const m of text.matchAll(/"exercises":\["([a-z0-9-]+)"/g)) if (m[1] && EXERCISE_BY_ID.has(m[1])) return m[1];
  return DEFAULT_FIGURE;
}

/** Every card to draw. scripts/og-images.mjs reads this list from the build. */
export function ogCards(): OgCard[] {
  const cards: OgCard[] = [
    { file: "default.jpg", kicker: "Adaptive strength training", title: "Your next set, already planned.", exercise: DEFAULT_FIGURE },
  ];
  for (const e of EXERCISES)
    cards.push({ file: `exercises/${e.id}.jpg`, kicker: `Exercise · ${MUSCLE_NAME[e.primary[0]!]}`, title: e.name, exercise: e.id });
  for (const m of MUSCLES) {
    const list = exercisesFor(m);
    const top = list.find((e) => e.compound) ?? list[0];
    if (top)
      cards.push({ file: `muscles/${muscleSlug(m)}.jpg`, kicker: "Muscle guide", title: `${MUSCLE_NAME[m]} exercises`, exercise: top.id });
  }
  for (const eq of equipmentWithPages()) {
    const top = exercisesWith(eq)[0];
    if (top)
      cards.push({
        file: `equipment/${equipmentSlug(eq)}.jpg`,
        kicker: "Equipment guide",
        title: `${equipmentLabel(eq)} exercises`,
        exercise: top.id,
      });
  }
  for (const a of ARTICLES)
    cards.push({
      file: `articles/${a.slug}.jpg`,
      kicker: a.kind === "guide" ? "Guide" : "Blog",
      title: a.title,
      exercise: articleFigure(a.body),
    });
  for (const c of COMPETITORS)
    cards.push({ file: `compare/${c.slug}.jpg`, kicker: "Compare", title: `${BRAND.name} vs ${c.name}`, exercise: DEFAULT_FIGURE });
  for (const t of TOOL_PAGES)
    cards.push({
      file: `tools/${t.path.split("/")[2]}.jpg`,
      kicker: "Free tool",
      title: t.name,
      exercise: t.path.includes("plate") ? "bench-press" : DEFAULT_FIGURE,
    });
  return cards;
}
