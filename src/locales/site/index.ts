import type { SiteLang } from "@/lib/siteLang";

import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { ja } from "./ja";
import type { SiteText } from "./types";

export type { SiteText } from "./types";

export const SITE_TEXT: Record<SiteLang, SiteText> = { en, es, fr, de, it, ja };

export const siteText = (lang: SiteLang = "en"): SiteText => SITE_TEXT[lang];
