import { describe, expect, it } from "vitest";

import { EXERCISE_GUIDES } from "@/content/exerciseGuides";

import { EXERCISE_BY_ID, EXERCISES } from "./exercises";
import { alternativesTo, exercisesFor, indexAlternatives, siteRoutes } from "./seo";
import { exercisePagePath, SITE_EXERCISES, WEB_TWIN } from "./webTwins";

describe("exercises with the same name", () => {
  it("have one page for search: every name used twice has its twin listed", () => {
    const byName = new Map<string, string[]>();
    for (const e of EXERCISES) byName.set(e.name.toLowerCase(), [...(byName.get(e.name.toLowerCase()) ?? []), e.id]);
    for (const [name, ids] of byName) {
      if (ids.length < 2) continue;
      const kept = ids.filter((id) => !(id in WEB_TWIN));
      expect(kept, `${name}: ${ids.join(", ")}`).toHaveLength(1);
      for (const id of ids) if (id in WEB_TWIN) expect(WEB_TWIN[id], id).toBe(kept[0]);
    }
  });

  it("point at a real page of the same name that isn't a twin itself", () => {
    for (const [twin, page] of Object.entries(WEB_TWIN)) {
      expect(EXERCISE_BY_ID.has(twin), twin).toBe(true);
      expect(EXERCISE_BY_ID.get(page)?.name, twin).toBe(EXERCISE_BY_ID.get(twin)?.name);
      expect(page in WEB_TWIN, page).toBe(false);
      expect(twin in EXERCISE_GUIDES, twin).toBe(false);
      expect(exercisePagePath(twin)).toBe(`/exercises/${page}/`);
    }
  });

  it("leave the twins out of the sitemap, the lists that link to exercises and the guides", () => {
    const paths = new Set(siteRoutes().map((r) => r.path));
    const guides = JSON.stringify(EXERCISE_GUIDES);
    for (const twin of Object.keys(WEB_TWIN)) {
      expect(paths.has(`/exercises/${twin}/`), twin).toBe(false);
      expect(indexAlternatives(twin), twin).toBe(false);
      expect(SITE_EXERCISES.some((e) => e.id === twin)).toBe(false);
      expect(guides.includes(`"${twin}"`), twin).toBe(false);
      const e = EXERCISE_BY_ID.get(twin)!;
      expect(exercisesFor(e.primary[0]!).some((x) => x.id === twin)).toBe(false);
    }
    for (const e of SITE_EXERCISES.slice(0, 200))
      for (const a of alternativesTo(e.id)) expect(a.id in WEB_TWIN, `${e.id} → ${a.id}`).toBe(false);
    expect(alternativesTo("straight-arm-pulldown").some((a) => a.id === "cable-pullover")).toBe(false);
  });
});
