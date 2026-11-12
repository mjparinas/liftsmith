import { CONNECTION_GROUPS, FEATURE_GROUPS, SUPPORT_LABEL, TIER_LABEL, WHERE_LABEL } from "@/content/features";

import type { FeaturesText } from "./types";

// English is the source: the features, groups and connections come straight from src/content/features.ts, so only the
// page's own lines are written here.

export const en: FeaturesText = {
  chrome: {
    title: "{name} features and what it works with",
    description:
      "Every {name} feature, which are free, the newest ones, and a table of the watches, health apps, scales and services it works with on Android, iPhone and the web.",
    crumb: "Features",
    h1: "Every {name} feature",
    intro:
      "All {count} features, which are free, what works with what, and what's new. Most of it is free; see {pricing} for what Pro adds.",
    pricing: "pricing",
    onThisPage: "On this page",
    newestNav: "Newest",
    worksWithNav: "Works with",
    newestH: "Newest features",
    newestIntro: "Added lately, by category. Every change, fixes included, is on {whatsNew}.",
    whatsNew: "What's new",
    midTitle: "See it for yourself",
    midBody: "Free, with no account. Your first workout is planned in under a minute.",
    midButton: "Start free",
    worksH: "What {name} works with",
    worksIntro:
      "Apps, watches and devices, and where each one works. “Through Health” means it reaches {name} through Health Connect on Android or Apple Health on iPhone. “Chrome” means the web app in Chrome, which has Web Bluetooth.",
    tableLabel: "Compatibility table",
    cols: { connection: "Connection", does: "What it does", android: "Android", iphone: "iPhone", web: "Web", plan: "Plan" },
    footnote:
      "“Coming soon” means it's built and waiting on its store listing. “Investigating” means we're working on it but can't promise it yet, because it depends on the other company's approval. Fitness services connect through a free {name} account. Labs are experiments in Pro you switch on in Settings › Labs. Product names are trademarks of their owners.",
    endTitle: "Start free, no account",
    endBody: "Your first workout is planned in under a minute. No ads, ever.",
  },
  tiers: TIER_LABEL,
  where: WHERE_LABEL,
  support: SUPPORT_LABEL,
  groups: Object.fromEntries(FEATURE_GROUPS.map((g) => [g.id, { title: g.title, intro: g.intro }])),
  features: Object.fromEntries(
    FEATURE_GROUPS.flatMap((g) => g.features).map((f) => [
      f.id,
      {
        name: f.name,
        body: f.body,
        ...(f.proPart ? { proPart: f.proPart } : {}),
        ...(f.note ? { note: f.note } : {}),
      },
    ]),
  ),
  connectionGroups: Object.fromEntries(CONNECTION_GROUPS.map((g) => [g.id, g.title])),
  connections: Object.fromEntries(
    CONNECTION_GROUPS.flatMap((g) => g.rows).map((c) => [c.id, { name: c.name, does: c.does, ...(c.link ? { link: c.link.label } : {}) }]),
  ),
};
