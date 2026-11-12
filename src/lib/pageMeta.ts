// One way to write a public page's metadata, so every page gets the same set: title, description,
// canonical address, Open Graph and a large Twitter/X card, all with the page's own preview image
// (ogImages.ts). Next replaces a parent's openGraph rather than merging it, so each page sets the whole thing.
import type { Metadata } from "next";

import { BRAND } from "./brand";
import { OG_SIZE, ogImage } from "./ogImages";
import { languageAlternates, localPath, OG_LOCALE, type SiteLang } from "./siteLang";

export interface PageMetaInput {
  title: string;
  description: string;
  /** The page's path with its trailing slash ("/exercises/back-squat/"). */
  path: string;
  /** The title as it stands, without " | Liftsmith". */
  absoluteTitle?: boolean;
  /** Shared title (Open Graph, X) when it should differ from the page title. */
  shareTitle?: string;
  type?: "website" | "article";
  published?: string;
  modified?: string;
  /**
   * For a page in every site language (src/lib/siteLang.ts): the language of this copy. `path` stays the English path;
   * the canonical address becomes this language's, and hreflang tags list every language.
   */
  lang?: SiteLang;
  /** Keep the page out of search results while its links are still followed (a page for visitors, not for search). */
  noindex?: boolean;
}

/** Search results cut titles at about 60 characters, so " | Liftsmith" is added only when it fits and the title
 * doesn't already name us. */
export const TITLE_MAX = 65;
const withBrand = (title: string) => !title.includes(BRAND.name) && `${title} | ${BRAND.name}`.length <= TITLE_MAX;

export function pageMeta(o: PageMetaInput): Metadata {
  const image = { url: ogImage(o.path), ...OG_SIZE, alt: o.shareTitle ?? o.title };
  const shareTitle = o.shareTitle ?? o.title;
  const url = o.lang ? localPath(o.lang, o.path) : o.path;
  return {
    title: o.absoluteTitle || !withBrand(o.title) ? { absolute: o.title } : o.title,
    description: o.description,
    ...(o.noindex ? { robots: { index: false, follow: true } } : {}),
    alternates: o.lang ? { canonical: url, languages: languageAlternates(o.path) } : { canonical: url },
    openGraph: {
      type: o.type ?? "website",
      siteName: BRAND.name,
      title: shareTitle,
      description: o.description,
      url,
      ...(o.lang ? { locale: OG_LOCALE[o.lang] } : {}),
      images: [image],
      ...(o.type === "article" && o.published ? { publishedTime: o.published, modifiedTime: o.modified ?? o.published } : {}),
    },
    twitter: { card: "summary_large_image", title: shareTitle, description: o.description, images: [image.url] },
  };
}
