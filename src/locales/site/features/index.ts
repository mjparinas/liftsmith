import { CONNECTION_GROUPS, FEATURE_GROUPS, type ConnectionGroup, type FeatureGroup } from "@/content/features";
import type { SiteLang } from "@/lib/siteLang";

import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { ja } from "./ja";
import type { FeaturesText } from "./types";

export type { FeaturesText } from "./types";

export const FEATURES_TEXT: Record<SiteLang, FeaturesText> = { en, es, fr, de, it, ja };

export const featuresText = (lang: SiteLang = "en"): FeaturesText => FEATURES_TEXT[lang];

/** The feature groups with their words in `lang`; structure (tier, where, days, links) from features.ts. */
export function featureGroupsIn(lang: SiteLang): FeatureGroup[] {
  const t = FEATURES_TEXT[lang];
  return FEATURE_GROUPS.map((g) => ({
    ...g,
    ...t.groups[g.id],
    features: g.features.map((f) => {
      const w = t.features[f.id];
      return { ...f, name: w?.name ?? f.name, body: w?.body ?? f.body, proPart: w?.proPart ?? f.proPart, note: w?.note ?? f.note };
    }),
  }));
}

/** The connections table with its words in `lang`. Product names stay as they are unless a language names the row. */
export function connectionGroupsIn(lang: SiteLang): ConnectionGroup[] {
  const t = FEATURES_TEXT[lang];
  return CONNECTION_GROUPS.map((g) => ({
    ...g,
    title: t.connectionGroups[g.id] ?? g.title,
    rows: g.rows.map((c) => {
      const w = t.connections[c.id];
      return {
        ...c,
        name: w?.name ?? c.name,
        does: w?.does ?? c.does,
        ...(c.link ? { link: { ...c.link, label: w?.link ?? c.link.label } } : {}),
      };
    }),
  }));
}
