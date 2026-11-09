import { describe, expect, it } from "vitest";
import { ARTICLES, CTA_COPY, readMinutes, type Block } from "@/content/articles";
import { linksIn, relatedTo } from "@/components/site/ArticleView";
import { EXERCISES, EXERCISE_BY_ID } from "./exercises";
import { absolute, alternativesTo, articlePath, equipmentBySlug, equipmentSlug, equipmentWithPages, exercisesWith, kebab, muscleBySlug, muscleSlug, PAIR_MIN, pairExercises, pairs, siteRoutes, TOOL_PAGES } from "./seo";
import sitemap from "@/app/sitemap";
import { EQUIPMENT, MUSCLES } from "./types";

const paths = new Set(siteRoutes().map((r) => r.path));
const text = (b: Block): string[] => ("p" in b ? [b.p] : "tip" in b ? [b.tip] : "ul" in b ? b.ul : "ol" in b ? b.ol : "h2" in b ? [b.h2] : []);

describe("SEO routes", () => {
  it("has one page per exercise, muscle, equipment item with exercises, pair, article and tool", () => {
    for (const e of EXERCISES) expect(paths.has(`/exercises/${e.id}/`)).toBe(true);
    for (const m of MUSCLES) expect(paths.has(`/muscles/${muscleSlug(m)}/`)).toBe(true);
    for (const eq of equipmentWithPages()) expect(paths.has(`/equipment/${equipmentSlug(eq)}/`)).toBe(true);
    for (const a of ARTICLES) expect(paths.has(articlePath(a))).toBe(true);
    for (const t of TOOL_PAGES) expect(paths.has(t.path)).toBe(true);
    expect(paths.size).toBe(siteRoutes().length);
  });

  it("only makes muscle and equipment pages with enough exercises", () => {
    expect(pairs().length).toBeGreaterThan(5);
    for (const p of pairs()) expect(pairExercises(p.muscle, p.equipment).length).toBeGreaterThanOrEqual(PAIR_MIN);
    for (const eq of EQUIPMENT) if (!exercisesWith(eq).length) expect(paths.has(`/equipment/${equipmentSlug(eq)}/`)).toBe(false);
  });

  it("round-trips slugs", () => {
    expect(kebab("frontDelts")).toBe("front-delts");
    for (const m of MUSCLES) expect(muscleBySlug(muscleSlug(m))).toBe(m);
    for (const eq of EQUIPMENT) expect(equipmentBySlug(equipmentSlug(eq))).toBe(eq);
    for (const e of EXERCISES) expect(e.id).toMatch(/^[a-z0-9-]+$/);
  });

  it("lists alternatives that share a main muscle", () => {
    const alts = alternativesTo("bench-press");
    expect(alts.length).toBeGreaterThan(3);
    for (const a of alts) expect(a.primary.some((m) => EXERCISE_BY_ID.get("bench-press")!.primary.includes(m))).toBe(true);
  });

  it("builds the sitemap on the www host with trailing slashes, and leaves private pages out", () => {
    const urls = sitemap().map((u) => u.url);
    expect(urls.length).toBe(paths.size);
    expect(urls.length).toBeGreaterThan(250);
    for (const u of urls) {
      expect(u.startsWith("https://www.getliftsmith.com/")).toBe(true);
      expect(u.endsWith("/")).toBe(true);
      expect(u).not.toMatch(/\/(app|admin|api|me|share)\//);
    }
    expect(new Set(urls).size).toBe(urls.length);
    expect(absolute("/blog/")).toBe("https://www.getliftsmith.com/blog/");
  });
});

describe("articles", () => {
  const today = new Date().toISOString().slice(0, 10);

  it("has many blog posts and the three guides", () => {
    expect(ARTICLES.filter((a) => a.kind === "blog").length).toBeGreaterThanOrEqual(20);
    expect(ARTICLES.filter((a) => a.kind === "guide").map((a) => a.slug).sort()).toEqual(["deload-week", "progressive-overload", "reps-in-reserve"]);
  });

  it("has unique slugs, short descriptions and past dates", () => {
    expect(new Set(ARTICLES.map(articlePath)).size).toBe(ARTICLES.length);
    for (const a of ARTICLES) {
      expect(a.slug).toMatch(/^[a-z0-9-]+$/);
      expect(a.description.length).toBeLessThanOrEqual(160);
      expect(a.title.length).toBeLessThanOrEqual(70);
      expect(a.date <= today).toBe(true);
      expect(CTA_COPY[a.cta]).toBeDefined();
      expect(readMinutes(a)).toBeGreaterThanOrEqual(2);
    }
  });

  it("puts a call to action inside every article, after the intro", () => {
    for (const a of ARTICLES) {
      const at = a.body.findIndex((b) => "cta" in b);
      expect(at, a.slug).toBeGreaterThan(0);
      expect("p" in a.body[0], `${a.slug} starts with a paragraph`).toBe(true);
    }
  });

  it("links only to pages that exist, and names only exercises in the library", () => {
    for (const a of ARTICLES)
      for (const b of a.body) {
        for (const t of text(b)) for (const href of linksIn(t)) expect(paths.has(href), `${a.slug} → ${href}`).toBe(true);
        if ("exercises" in b) for (const id of b.exercises) expect(EXERCISE_BY_ID.has(id), `${a.slug} → ${id}`).toBe(true);
      }
  });

  it("never names other apps or trademarked programs", () => {
    const banned = /fitbod|hevy|strong app|stronglifts|gymverse|starting strength|wendler|5\/3\/1|gzclp|madcow|#1|best app/i;
    for (const a of ARTICLES) {
      const all = [a.title, a.description, ...a.body.flatMap(text), ...(a.faq ?? []).flat()].join("\n");
      expect(all, a.slug).not.toMatch(banned);
    }
    for (const c of Object.values(CTA_COPY)) expect(`${c.title} ${c.body}`).not.toMatch(banned);
  });

  it("suggests three related articles that aren't the article itself", () => {
    for (const a of ARTICLES) {
      const r = relatedTo(a, ARTICLES);
      expect(r.length).toBe(3);
      expect(r).not.toContain(a);
    }
  });
});
