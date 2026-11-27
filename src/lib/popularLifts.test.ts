import { describe, expect, it } from "vitest";

import { EXERCISE_GUIDES } from "@/content/exerciseGuides";
import { GUIDE_LANGS, LOCAL_GUIDES } from "@/content/exerciseGuides/i18n";
import { exerciseNames } from "@/locales/site/fromApp";

import { POPULAR_LIFT_NAMES, POPULAR_LIFTS, popularLiftLinks } from "./popularLifts";
import { siteRoutes } from "./seo";
import { SITE_LANGS } from "./siteLang";

describe("popular lifts in the footer", () => {
  it("each have a full guide in every site language, so every link lands on a real page", () => {
    const paths = new Set(siteRoutes().map((r) => r.path));
    for (const id of POPULAR_LIFTS) {
      expect(id in EXERCISE_GUIDES, id).toBe(true);
      for (const lang of GUIDE_LANGS) expect(LOCAL_GUIDES[lang][id], `${lang} ${id}`).toBeDefined();
    }
    for (const lang of SITE_LANGS) for (const [href] of popularLiftLinks(lang)) expect(paths.has(href), href).toBe(true);
  });

  it("carry the app's own names for the lifts in every language", () => {
    for (const lang of SITE_LANGS) expect(POPULAR_LIFT_NAMES[lang], lang).toEqual(exerciseNames(lang, POPULAR_LIFTS));
  });
});
