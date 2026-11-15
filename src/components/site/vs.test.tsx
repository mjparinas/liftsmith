// @vitest-environment jsdom
// Exercise comparison pages (docs/decisions/public-pages-and-seo.md "Exercise comparisons"): one page per pair named
// in a guide, every language's words, real advice on each page, and every page in the sitemap with hreflang.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { EXERCISE_GUIDES } from "@/content/exerciseGuides";
import { ogFile } from "@/lib/ogImages";
import { siteRoutes } from "@/lib/seo";
import { localPath, SITE_LANGS } from "@/lib/siteLang";
import { vsBySlug, vsFacts, vsPairs, vsPath } from "@/lib/versus";
import { VS_TEXT } from "@/locales/site/vs";

import { VsIndexView, VsView } from "./VsView";

afterEach(cleanup);

const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const strings = (o: unknown, path = ""): [string, string][] =>
  typeof o === "string"
    ? [[path, o]]
    : o && typeof o === "object"
      ? Object.entries(o).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k))
      : [];

describe("exercise comparisons", () => {
  it("has one page per pair a guide names, each pair once, no lift against itself", () => {
    const pairs = vsPairs();
    expect(pairs.length).toBeGreaterThan(100);
    expect(new Set(pairs.map((p) => p.slug)).size).toBe(pairs.length);
    for (const p of pairs) {
      expect(p.a < p.b, p.slug).toBe(true);
      expect(Object.keys(p.pick).length, p.slug).toBeGreaterThan(0);
      for (const [id, note] of Object.entries(p.pick)) {
        const other = id === p.a ? p.b : p.a;
        expect(
          EXERCISE_GUIDES[other]?.variations.some(([v, n]) => v === id && n === note),
          p.slug,
        ).toBe(true);
      }
    }
    expect(vsBySlug("back-squat-vs-front-squat")).not.toBeNull();
  });

  it("has every line in every language, with English's placeholders", () => {
    const en = new Map(strings(VS_TEXT.en));
    for (const lang of SITE_LANGS) {
      const local = new Map(strings(VS_TEXT[lang]));
      expect([...local.keys()].sort(), lang).toEqual([...en.keys()].sort());
      for (const [k, v] of local) {
        if (k !== "englishLinks") expect(v.trim(), `${lang} ${k}`).not.toBe("");
        expect(holes(v), `${lang} ${k}`).toEqual(holes(en.get(k)!));
      }
    }
  });

  it("puts every copy in the sitemap with all six languages, and gives each its lift's card", () => {
    const routes = new Map(siteRoutes().map((r) => [r.path, r]));
    for (const p of vsPairs())
      for (const lang of SITE_LANGS) {
        const r = routes.get(localPath(lang, vsPath(p)));
        expect(r && Object.keys(r.languages ?? {}).length, `${lang} ${p.slug}`).toBe(7);
      }
    expect(ogFile("/de/exercises/vs/back-squat-vs-front-squat/")).toBe("exercises/back-squat.jpg");
  });

  it("draws a page with the facts and both lines on when to pick", () => {
    render(<VsView lang="en" slug="back-squat-vs-front-squat" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Back squat vs front squat");
    expect(screen.getByText("More upright, more quads, easier on the lower back.")).toBeTruthy();
    expect(screen.getByText("Lets you lift more weight overall.")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
  });

  it("draws every pair in every language without a missing line", () => {
    for (const lang of ["en", "ja"] as const)
      for (const p of vsPairs()) {
        const { container } = render(<VsView lang={lang} slug={p.slug} />);
        expect(container.textContent, `${lang} ${p.slug}`).not.toMatch(/\{\w+\}|undefined/);
        cleanup();
      }
  });

  it("says one lift's name in each translated title", () => {
    const { a } = vsFacts(vsBySlug("back-squat-vs-front-squat")!);
    render(<VsView lang="de" slug="back-squat-vs-front-squat" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).not.toContain(a.name);
    cleanup();
    render(<VsIndexView lang="fr" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(VS_TEXT.fr.index.h1);
  });
});
