// @vitest-environment jsdom
// Muscle pages (docs/decisions/public-pages-and-seo.md "Best exercises for each muscle"): a ranking that puts staples
// first and says why, the best lift for each setup, every language's words, and every page in the sitemap with hreflang.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { bestBySetup, bestFor } from "@/lib/bestFor";
import { ogFile } from "@/lib/ogImages";
import { siteRoutes } from "@/lib/seo";
import { localPath, SITE_LANGS } from "@/lib/siteLang";
import { MUSCLES } from "@/lib/types";
import { MUSCLE_TEXT } from "@/locales/site/muscle";

import { musclePath, MusclesIndexView, MuscleView, pageMuscles, reasons } from "./MuscleView";

afterEach(cleanup);

// {Muscle} is {muscle} at the start of a sentence, so a language may use either.
const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!.replace(/^Muscle$/, "muscle")).sort();
const strings = (o: unknown, path = ""): [string, string][] =>
  typeof o === "string"
    ? [[path, o]]
    : o && typeof o === "object"
      ? Object.entries(o).flatMap(([k, v]) => strings(v, path ? `${path}.${k}` : k))
      : [];

describe("best exercises for each muscle", () => {
  it("ranks staples first, only lifts that work the muscle as a main mover, in an order that never shifts", () => {
    const chest = bestFor("chest");
    expect(chest.length).toBeGreaterThan(10);
    expect(chest[0]!.popularity).toBe("staple");
    expect(chest.every((p) => p.e.primary.includes("chest") && !p.e.cardio)).toBe(true);
    for (let i = 1; i < chest.length; i++) expect(chest[i - 1]!.score).toBeGreaterThanOrEqual(chest[i]!.score);
    expect(bestFor("chest").map((p) => p.e.id)).toEqual(chest.map((p) => p.e.id));
  });

  it("picks a lift for each setup that fits it", () => {
    const setups = new Map(bestBySetup("quads").map((x) => [x.setup, x.pick.e]));
    expect(setups.get("none")?.needs).toEqual([]);
    expect(setups.get("barbell")?.needs).toContain("barbell");
    const db = setups.get("dumbbells");
    expect(db?.needs).toContain("dumbbells");
    expect(db?.needs.every((n) => ["dumbbells", "bench", "inclineBench"].includes(n))).toBe(true);
  });

  it("says why each pick ranks, from the numbers that ranked it", () => {
    const top = bestFor("chest")[0]!;
    const lines = reasons("en", "chest", top);
    expect(lines[0]).toBe("A staple most gyms can do");
    expect(lines.length).toBeGreaterThanOrEqual(3);
    for (const lang of SITE_LANGS) for (const l of reasons(lang, "chest", top)) expect(l).not.toMatch(/\{\w+\}/);
  });

  it("has every line in every language, with English's placeholders", () => {
    const en = new Map(strings(MUSCLE_TEXT.en));
    for (const lang of SITE_LANGS) {
      const local = new Map(strings(MUSCLE_TEXT[lang]));
      expect([...local.keys()].sort(), lang).toEqual([...en.keys()].sort());
      for (const [k, v] of local) {
        if (k !== "englishLinks") expect(v.trim(), `${lang} ${k}`).not.toBe("");
        expect(holes(v), `${lang} ${k}`).toEqual(holes(en.get(k)!));
      }
    }
  });

  it("puts every copy in the sitemap with all six languages, and gives each its card", () => {
    const routes = new Map(siteRoutes().map((r) => [r.path, r]));
    for (const path of ["/muscles/", ...pageMuscles().map(musclePath)])
      for (const lang of SITE_LANGS) {
        const r = routes.get(localPath(lang, path));
        expect(r && Object.keys(r.languages ?? {}).length, `${lang} ${path}`).toBe(7);
      }
    expect(ogFile("/ja/muscles/chest/")).toBe(ogFile("/muscles/chest/"));
    expect(pageMuscles().length).toBe(MUSCLES.filter((m) => bestFor(m).length).length);
  });

  it("draws a page with the top picks, the best lift by setup and the reasons", () => {
    render(<MuscleView lang="en" slug="chest" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("The best chest exercises");
    expect(screen.getByRole("heading", { name: "Top picks" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "The best one for your setup" })).toBeTruthy();
    expect(screen.getAllByText("A staple most gyms can do").length).toBeGreaterThan(0);
  });

  it("draws every muscle in every language without a missing line", () => {
    for (const lang of SITE_LANGS)
      for (const m of pageMuscles()) {
        const { container } = render(<MuscleView lang={lang} slug={musclePath(m).split("/")[2]!} />);
        expect(container.textContent, `${lang} ${m}`).not.toMatch(/\{\w+\}|undefined/);
        cleanup();
      }
    render(<MusclesIndexView lang="it" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(MUSCLE_TEXT.it.index.h1);
  });
});
