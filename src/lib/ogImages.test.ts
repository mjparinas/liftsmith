import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { EXERCISES } from "./exercises";
import { ogCards, ogFile, ogImage } from "./ogImages";
import { pageMeta } from "./pageMeta";
import { equipmentLabel, siteRoutes } from "./seo";

const pub = (p: string) => path.join(process.cwd(), "public", p);

describe("social preview images", () => {
  it("has a drawn card for every page in the sitemap (run scripts/og-images.mjs after adding pages)", () => {
    const missing = siteRoutes()
      .map((r) => ogFile(r.path))
      .filter((f) => !fs.existsSync(pub(`og/${f}`)));
    expect([...new Set(missing)]).toEqual([]);
  });

  it("lists a card for every page that maps to its own file, and no two cards share a file", () => {
    const files = ogCards().map((c) => c.file);
    expect(new Set(files).size).toBe(files.length);
    for (const r of siteRoutes()) expect(files).toContain(ogFile(r.path));
  });

  it("has a still of the 3D figure for every exercise page", () => {
    expect(EXERCISES.filter((e) => !fs.existsSync(pub(`stills/${e.id}.webp`))).map((e) => e.id)).toEqual([]);
  });

  it("shares a card between an exercise and its alternatives, and between a muscle and its equipment pages", () => {
    expect(ogFile("/exercises/back-squat/alternatives/")).toBe("exercises/back-squat.jpg");
    expect(ogFile("/muscles/chest/dumbbells/")).toBe("muscles/chest.jpg");
    expect(ogFile("/pricing/")).toBe("default.jpg");
  });

  it("gives every page Open Graph and a large X card with its own image and address", () => {
    const m = pageMeta({ title: "Back squat", description: "How to squat.", path: "/exercises/back-squat/" });
    expect(m.alternates?.canonical).toBe("/exercises/back-squat/");
    expect(JSON.stringify(m.openGraph)).toContain(ogImage("/exercises/back-squat/"));
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("adds the brand to a title only when it fits and isn't there already", () => {
    expect(pageMeta({ title: "Back squat", description: "", path: "/x/" }).title).toBe("Back squat");
    const long = "Barbell bench press: form, muscles worked and alternatives";
    expect(pageMeta({ title: long, description: "", path: "/x/" }).title).toEqual({ absolute: long });
    expect(pageMeta({ title: "Liftsmith pricing", description: "", path: "/x/" }).title).toEqual({ absolute: "Liftsmith pricing" });
  });

  it("names equipment in the singular before 'exercises'", () => {
    expect(equipmentLabel("kettlebells")).toBe("Kettlebell");
    expect(equipmentLabel("barbell")).toBe("Barbell");
  });
});
