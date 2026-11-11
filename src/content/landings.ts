// Landing pages for people choosing an app ("workout tracker app", "5x5 app") under /apps/<slug>/, and one page
// per feature under /features/<slug>/. Data, like the blog: the pages, the sitemap, the preview cards and the
// tests read the same list. Inline text takes [links](/path/) and **bold**. Rules (checked in landings.test.ts):
// only features that ship, Pro features labelled Pro, links only to pages that exist, no other apps' names, and
// each page says something of its own (not the same page with the keyword swapped).
import { LANDINGS_APPS } from "./landings/apps";
import { LANDINGS_FEATURES } from "./landings/features";

export type ScreenId = "today" | "workout" | "rest" | "recovery" | "progress" | "done";

export interface Landing {
  slug: string;
  group: "apps" | "features";
  /** Short name for links and cards: "Workout tracker". */
  name: string;
  /** The page title in search results (under 60 characters). */
  title: string;
  /** Under 160 characters. */
  description: string;
  h1: string;
  /** One line under the title. */
  intro: string;
  /** The real app screenshot beside the intro (public/screens/). */
  screen: ScreenId;
  screenAlt: string;
  /** Free, Pro, or "Free, some parts Pro": shown as a tag. */
  plan: "Free" | "Pro" | "Free and Pro";
  sections: { h2: string; p: string[]; ul?: string[] }[];
  mid: { title: string; body: string; button: string };
  end: { title: string; body: string };
  faq: [string, string][];
  /** Further reading: other pages on the site. */
  links: { href: string; label: string }[];
}

export const LANDINGS: Landing[] = [...LANDINGS_APPS, ...LANDINGS_FEATURES];
export const landingPath = (l: Pick<Landing, "group" | "slug">) => `/${l.group}/${l.slug}/`;
export const LANDING_BY_PATH = new Map(LANDINGS.map((l) => [landingPath(l), l]));
