// One way to write a public page's metadata, so every page gets the same set: title, description,
// canonical address, Open Graph and a large Twitter/X card, all with the page's own preview image
// (ogImages.ts). Next replaces a parent's openGraph rather than merging it, so each page sets the whole thing.
import type { Metadata } from "next";

import { BRAND } from "./brand";
import { OG_SIZE, ogImage } from "./ogImages";

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
}

/** Search results cut titles at about 60 characters, so " | Liftsmith" is added only when it fits and the title
 * doesn't already name us. */
export const TITLE_MAX = 65;
const withBrand = (title: string) => !title.includes(BRAND.name) && `${title} | ${BRAND.name}`.length <= TITLE_MAX;

export function pageMeta(o: PageMetaInput): Metadata {
  const image = { url: ogImage(o.path), ...OG_SIZE, alt: o.shareTitle ?? o.title };
  const shareTitle = o.shareTitle ?? o.title;
  return {
    title: o.absoluteTitle || !withBrand(o.title) ? { absolute: o.title } : o.title,
    description: o.description,
    alternates: { canonical: o.path },
    openGraph: {
      type: o.type ?? "website",
      siteName: BRAND.name,
      title: shareTitle,
      description: o.description,
      url: o.path,
      images: [image],
      ...(o.type === "article" && o.published ? { publishedTime: o.published, modifiedTime: o.modified ?? o.published } : {}),
    },
    twitter: { card: "summary_large_image", title: shareTitle, description: o.description, images: [image.url] },
  };
}
