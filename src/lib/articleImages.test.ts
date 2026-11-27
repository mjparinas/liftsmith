import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ARTICLES } from "@/content/articles";

import { APP_SCREENS, articleImages, articleLifts, heroSrc, screenSrc } from "./articleImages";
import { EXERCISE_BY_ID } from "./exercises";

const file = (src: string) => path.join("public", src);

describe("pictures in guides and blog posts", () => {
  it("gives every post 3 to 6, with at least one app screen and one 3D figure, none twice", () => {
    for (const a of ARTICLES) {
      const imgs = articleImages(a);
      expect(imgs.length, a.slug).toBeGreaterThanOrEqual(3);
      expect(imgs.length, a.slug).toBeLessThanOrEqual(6);
      expect(
        imgs.some((i) => i.kind === "screen"),
        a.slug,
      ).toBe(true);
      expect(
        imgs.some((i) => i.kind === "figure"),
        a.slug,
      ).toBe(true);
      expect(new Set(imgs.map((i) => i.src)).size, a.slug).toBe(imgs.length);
    }
  });

  it("has every picture on disk (run scripts/article-screens.mjs and og-images.mjs --missing)", () => {
    const missing = new Set<string>();
    for (const a of ARTICLES) {
      if (!fs.existsSync(file(heroSrc(a)))) missing.add(heroSrc(a));
      for (const i of articleImages(a)) for (const src of [i.src, i.small]) if (src && !fs.existsSync(file(src))) missing.add(src);
    }
    expect([...missing]).toEqual([]);
  });

  it("has a screenshot of every screen in the list", () => {
    for (const s of APP_SCREENS) expect(fs.existsSync(file(screenSrc(s.id))), s.id).toBe(true);
  });

  it("describes every picture in words, and links each figure to its exercise page", () => {
    for (const a of ARTICLES)
      for (const i of articleImages(a)) {
        expect(i.alt.length, i.src).toBeGreaterThan(20);
        expect(i.caption.length, i.src).toBeGreaterThan(20);
        if (i.kind === "figure") expect(i.href).toMatch(/^\/exercises\/[a-z0-9-]+\/$/);
      }
  });

  it("shows the lifts a post names, in the order it names them", () => {
    const squat = ARTICLES.find((a) => a.slug === "how-to-squat") ?? ARTICLES.find((a) => articleLifts(a).includes("back-squat"))!;
    const lifts = articleLifts(squat);
    expect(lifts.length).toBeGreaterThan(0);
    for (const id of lifts) expect(EXERCISE_BY_ID.has(id)).toBe(true);
    const figs = articleImages(squat).filter((i) => i.kind === "figure");
    expect(figs[0]!.href).toBe(`/exercises/${lifts[0]}/`);
  });
});
