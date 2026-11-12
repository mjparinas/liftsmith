// The translated tools (docs/decisions/public-pages-and-seo.md "Translated tools"): every language has every line,
// the same placeholders as the English calculators, links that exist, and pages in the sitemap with hreflang.
import { describe, expect, it } from "vitest";

import { ONERM_EN } from "@/components/site/OneRmCalculator";
import { PLATE_EN } from "@/components/site/PlateCalculator";
import { WARMUP_EN } from "@/components/site/WarmupCalculator";
import { siteRoutes } from "@/lib/seo";
import { localPath } from "@/lib/siteLang";

import { LOCAL_TOOLS } from ".";
import { LOCAL_TOOL_PATHS, LOCAL_TOOL_SLUGS, type ToolUi } from "./types";

const EN: ToolUi = { "plate-calculator": PLATE_EN, "one-rep-max-calculator": ONERM_EN, "warm-up-calculator": WARMUP_EN };
const LANGS = Object.keys(LOCAL_TOOLS) as (keyof typeof LOCAL_TOOLS)[];
const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const strings = (o: unknown): string[] =>
  typeof o === "string" ? [o] : Array.isArray(o) ? o.flatMap(strings) : o && typeof o === "object" ? Object.values(o).flatMap(strings) : [];

describe("translated tools", () => {
  it("covers the five other site languages", () => {
    expect(LANGS.sort()).toEqual(["de", "es", "fr", "it", "ja"]);
  });

  for (const slug of LOCAL_TOOL_SLUGS) {
    it(`${slug}: every calculator line, with the English placeholders`, () => {
      const en = EN[slug] as unknown as Record<string, unknown>;
      for (const lang of LANGS) {
        const ui = LOCAL_TOOLS[lang][slug].ui as unknown as Record<string, unknown>;
        expect(Object.keys(ui).sort(), lang).toEqual(Object.keys(en).sort());
        for (const k of Object.keys(en)) {
          if (typeof en[k] === "string") expect(holes(ui[k] as string), `${lang} ${k}`).toEqual(holes(en[k] as string));
          else expect(Object.keys(ui[k] as object).sort(), `${lang} ${k}`).toEqual(Object.keys(en[k] as object).sort());
          for (const s of strings(ui[k])) expect(s.trim(), `${lang} ${k}`).not.toBe("");
        }
      }
    });

    it(`${slug}: the same page in every language`, () => {
      const [first, ...rest] = LANGS.map((l) => LOCAL_TOOLS[l][slug].page);
      for (const p of rest) {
        expect(p.faq.length).toBe(first!.faq.length);
        expect(p.reading.map((r) => r.href.replace(/^\/(es|fr|de|it|ja)\//, "/"))).toEqual(
          first!.reading.map((r) => r.href.replace(/^\/(es|fr|de|it|ja)\//, "/")),
        );
        expect(p.more?.paragraphs.length).toBe(first!.more?.paragraphs.length);
      }
      for (const lang of LANGS) {
        const page = LOCAL_TOOLS[lang][slug].page;
        for (const s of strings(page)) for (const h of holes(s)) expect(["app", "rest"], `${lang}: ${s}`).toContain(h);
        expect(page.mid.body + page.end.body, lang).toContain("{app}");
      }
    });
  }

  it("links only to pages that exist, in the page's language when it has one", () => {
    const paths = new Set(siteRoutes().map((r) => r.path));
    for (const lang of LANGS)
      for (const slug of LOCAL_TOOL_SLUGS)
        for (const r of LOCAL_TOOLS[lang][slug].page.reading) {
          expect(paths.has(r.href), `${lang} ${r.href}`).toBe(true);
          if (r.href.startsWith("/tools/")) throw new Error(`${lang} links to the English ${r.href}`);
          if (/^\/(es|fr|de|it|ja)\//.test(r.href)) expect(r.href.startsWith(`/${lang}/`), `${lang} ${r.href}`).toBe(true);
        }
  });

  it("puts every copy in the sitemap, each listing all six languages", () => {
    const routes = siteRoutes();
    for (const path of LOCAL_TOOL_PATHS)
      for (const lang of ["en", ...LANGS] as const) {
        const route = routes.find((r) => r.path === localPath(lang, path));
        expect(route?.languages && Object.keys(route.languages).sort(), `${lang} ${path}`).toEqual(
          ["de", "en", "es", "fr", "it", "ja", "x-default"].sort(),
        );
      }
  });

  it("frames every page in every language", () => {
    for (const lang of LANGS) {
      const f = LOCAL_TOOLS[lang].frame;
      for (const s of [f.tools, f.questions, f.more, f.englishLinks]) expect(s.trim(), lang).not.toBe("");
    }
  });
});
