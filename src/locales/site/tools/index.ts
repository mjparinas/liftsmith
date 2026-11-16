// The translated tool pages (/<lang>/tools/<slug>/; docs/decisions/public-pages-and-seo.md "Translated tools").
// Server only: a page hands its calculator just its own language's words, so the browser never gets the others.
import { localPath } from "@/lib/siteLang";
import type { GuideLang } from "@/locales/site/exercise";

import { DE_TOOLS } from "./de";
import { ES_TOOLS } from "./es";
import { FR_TOOLS } from "./fr";
import { IT_TOOLS } from "./it";
import { JA_TOOLS } from "./ja";
import { KO_TOOLS } from "./ko";
import { PL_TOOLS } from "./pl";
import { PT_TOOLS } from "./pt";
import { TR_TOOLS } from "./tr";
import { LOCAL_TOOL_SLUGS, type LocalTools, type LocalToolSlug } from "./types";

export const LOCAL_TOOLS: Record<GuideLang, LocalTools> = {
  es: ES_TOOLS,
  fr: FR_TOOLS,
  de: DE_TOOLS,
  it: IT_TOOLS,
  ja: JA_TOOLS,
  pt: PT_TOOLS,
  ko: KO_TOOLS,
  pl: PL_TOOLS,
  tr: TR_TOOLS,
};

export const isLocalTool = (slug: string): slug is LocalToolSlug => (LOCAL_TOOL_SLUGS as readonly string[]).includes(slug);

export const localToolPath = (lang: GuideLang, slug: LocalToolSlug) => localPath(lang, `/tools/${slug}/`);
