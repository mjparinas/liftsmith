import type { Support, Tier, Where } from "@/content/features";

// The features page's words in one language (/features/, /es/features/ …). English lives in src/content/features.ts
// next to the structure; the other languages translate it here, one file each, keyed by the same ids, so a feature
// added there fails features.test.ts until every language has its line (Melvin, 2026-11-12: "Do the header and
// translations").

/** One feature's words. `proPart` and `note` are there exactly when the English one has them. */
export interface FeatureWords {
  name: string;
  body: string;
  proPart?: string;
  note?: string;
}

/** One connection's words. `name` only where the English name isn't a product name. `link` labels the row's link. */
export interface ConnectionWords {
  name?: string;
  does: string;
  link?: string;
}

/** The page's own lines. {name} is the brand, {count} the number of features, {pricing} and {whatsNew} the links. */
export interface FeaturesChrome {
  title: string;
  description: string;
  crumb: string;
  h1: string;
  intro: string;
  pricing: string;
  onThisPage: string;
  newestNav: string;
  worksWithNav: string;
  newestH: string;
  newestIntro: string;
  whatsNew: string;
  midTitle: string;
  midBody: string;
  midButton: string;
  worksH: string;
  worksIntro: string;
  tableLabel: string;
  cols: { connection: string; does: string; android: string; iphone: string; web: string; plan: string };
  footnote: string;
  endTitle: string;
  endBody: string;
}

export interface FeaturesText {
  chrome: FeaturesChrome;
  tiers: Record<Tier, string>;
  where: Record<Where, string>;
  support: Record<Support, string>;
  groups: Record<string, { title: string; intro: string }>;
  features: Record<string, FeatureWords>;
  connectionGroups: Record<string, string>;
  connections: Record<string, ConnectionWords>;
}
