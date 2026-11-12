// Free calculators other sites can put on their own pages (docs/decisions/public-pages-and-seo.md, "Embeddable
// calculators"). Each one is served bare at /embed/<slug>/ for an <iframe>, and the code a site owner copies also
// carries a plain link to the full tool page, outside the frame, because only that link counts for search.
import { BRAND } from "./brand";
import { SITE_URL } from "./site";

export interface Embed {
  /** The tool's slug under /tools/ (and /embed/). */
  slug: string;
  /** The name in the credit line: "Plate calculator". */
  name: string;
  /** The frame's height in CSS pixels, enough for the calculator at a typical blog column width. */
  height: number;
}

export const EMBEDS: readonly Embed[] = [
  { slug: "plate-calculator", name: "Plate calculator", height: 900 },
  { slug: "one-rep-max-calculator", name: "One-rep max calculator", height: 1400 },
  { slug: "warm-up-calculator", name: "Warm-up calculator", height: 860 },
];

export const embedFor = (slug: string): Embed | undefined => EMBEDS.find((e) => e.slug === slug);

export const embedPath = (e: Embed) => `/embed/${e.slug}/`;
export const toolPath = (e: Embed) => `/tools/${e.slug}/`;

/** The HTML a site owner pastes: the frame, then a credit line linking to the full tool page. */
export function embedSnippet(e: Embed): string {
  const tool = `${SITE_URL}${toolPath(e)}`;
  return [
    `<iframe src="${SITE_URL}${embedPath(e)}" title="${e.name}" width="100%" height="${e.height}" style="border:0;max-width:640px" loading="lazy"></iframe>`,
    `<p style="max-width:640px;font-size:14px"><a href="${tool}">${e.name}</a> by ${BRAND.name}</p>`,
  ].join("\n");
}
