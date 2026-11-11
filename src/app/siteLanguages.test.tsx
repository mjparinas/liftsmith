// @vitest-environment jsdom
// The home and pricing pages in every site language (Melvin, 2026-11-11), with hreflang tags, the sitemap and the
// language switcher.
import { existsSync } from "node:fs";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { HERO_PROGRAM } from "@/components/site/heroProgram";
import { homeMetadata, HomeView } from "@/components/site/HomeView";
import { pricingMetadata, PricingView } from "@/components/site/PricingView";
import { motionFor } from "@/lib/demo/motions";
import { PLAN_TABLE } from "@/lib/plans";
import { siteRoutes } from "@/lib/seo";
import { fill, languageAlternates, localPath, SITE_LANGS, usd, type SiteLang } from "@/lib/siteLang";
import { SITE_TEXT } from "@/locales/site";
import { exerciseNames, muscleLabels } from "@/locales/site/fromApp";
import { siteVars } from "@/locales/site/vars";

const others = SITE_LANGS.filter((l) => l !== "en");
const holes = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

/** Every string in a value, by its path ("home.how.steps.0.title"). */
function strings(v: unknown, path = ""): [string, string][] {
  if (typeof v === "string") return [[path, v]];
  if (Array.isArray(v)) return v.flatMap((x, i) => strings(x, `${path}.${i}`));
  if (v && typeof v === "object") return Object.entries(v).flatMap(([k, x]) => strings(x, path ? `${path}.${k}` : k));
  return [];
}

describe("site text", () => {
  // The questions and plan lists come already filled in English (src/lib/faqs.ts), so their placeholders are checked
  // against the known names instead of against English.
  const own = (p: string) => !/^(faqs|billing|plans|hero\.phases)\./.test(p);
  const known = new Set(Object.keys(siteVars("en")));

  for (const lang of others) {
    it(`has every line in ${lang}, with English's placeholders`, () => {
      const en = new Map(strings(SITE_TEXT.en));
      const mine = new Map(strings(SITE_TEXT[lang]));
      for (const [path, s] of en) {
        if (!own(path)) continue;
        expect(mine.has(path), `${lang} ${path}`).toBe(true);
        expect(holes(mine.get(path)!), `${lang} ${path}`).toEqual(holes(s));
      }
      for (const [path, s] of mine) {
        expect(s.trim(), `${lang} ${path}`).not.toBe("");
        if (!own(path)) for (const h of holes(s)) expect(known.has(h), `${lang} ${path} {${h}}`).toBe(true);
      }
    });

    it(`translates every question, plan line and table row in ${lang}`, () => {
      const t = SITE_TEXT[lang];
      expect(t.faqs.length).toBe(SITE_TEXT.en.faqs.length);
      expect(t.billing.length).toBe(SITE_TEXT.en.billing.length);
      expect(t.plans.free.length).toBe(SITE_TEXT.en.plans.free.length);
      expect(t.plans.pro.length).toBe(SITE_TEXT.en.plans.pro.length);
      expect(t.plans.groups.length).toBe(PLAN_TABLE.length);
      PLAN_TABLE.forEach((g, i) => expect(t.plans.rows[i]?.length, `${lang} ${g.group}`).toBe(g.rows.length));
      expect(t.home.features.items.length).toBe(SITE_TEXT.en.home.features.items.length);
    });

    it(`names every phase of the hero's lifts in ${lang}`, () => {
      for (const s of HERO_PROGRAM)
        for (const row of motionFor(s.id).phases) expect(SITE_TEXT[lang].hero.phases[row[3]], `${lang} ${row[3]}`).toBeTruthy();
    });
  }

  it("borrows muscle and lift names from the app's catalogues", () => {
    expect(muscleLabels("es").quads).not.toBe(muscleLabels("en").quads);
    expect(exerciseNames("de", ["back-squat"])["back-squat"]).toMatch(/Kniebeuge/);
  });

  it("writes prices the way each language writes money", () => {
    expect(usd("en", 39.99)).toBe("$39.99");
    expect(usd("en", 0)).toBe("$0");
    expect(usd("fr", 39.99)).toMatch(/^39,99\s\$/);
    expect(usd("de", 6.99)).toMatch(/^6,99\s\$/);
    expect(siteVars("en").perMonth).toBe("$3.33");
    expect(fill("{days} days, {name}", { days: 14 })).toBe("14 days, {name}");
  });
});

describe("translated pages", () => {
  afterEach(cleanup);

  it("renders the home page in each language, wrapped in its language, with links into the app", () => {
    for (const lang of others) {
      const t = SITE_TEXT[lang];
      const { container } = render(<HomeView lang={lang} />);
      expect(container.firstElementChild?.getAttribute("lang"), lang).toBe(lang);
      expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(t.home.h1a);
      const ctas = screen.getAllByRole("link").filter((a) => /^\/app\/?$/.test(a.getAttribute("href") ?? ""));
      expect(ctas.length, lang).toBeGreaterThanOrEqual(12);
      // The header stays on this language's pages, and the switcher offers every language.
      const nav = within(screen.getByRole("navigation", { name: t.chrome.siteNav }));
      expect(nav.getAllByRole("link", { name: t.chrome.nav.pricing })[0]!.getAttribute("href")).toMatch(new RegExp(`^/${lang}/pricing/?$`));
      const switcher = within(screen.getByRole("navigation", { name: t.chrome.language }));
      expect(switcher.getAllByRole("link")).toHaveLength(SITE_LANGS.length);
      expect(switcher.getByRole("link", { current: "page" }).getAttribute("hreflang")).toBe(lang);
      cleanup();
    }
  });

  it("shows the same prices and questions in every language", () => {
    for (const lang of SITE_LANGS) {
      const { container } = render(<HomeView lang={lang} />);
      const v = siteVars(lang);
      const pricing = container.querySelector("#pricing")!;
      expect(pricing.textContent, lang).toContain(v.annual);
      expect(pricing.textContent, lang).toContain(v.monthly);
      expect(pricing.textContent, lang).not.toMatch(/\{\w+\}/);
      expect(container.querySelectorAll("#faq details").length, lang).toBe(SITE_TEXT.en.faqs.length);
      expect(container.textContent, lang).not.toMatch(/\{(name|days|n|monthly|annual|perMonth)\}/);
      cleanup();
    }
  });

  it("renders the pricing page in each language with the whole table", () => {
    const rows = PLAN_TABLE.reduce((n, g) => n + g.rows.length, 0);
    for (const lang of SITE_LANGS) {
      const { container } = render(<PricingView lang={lang} />);
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(SITE_TEXT[lang].pricing.h1);
      expect(container.querySelectorAll("tbody th[scope=row]").length, lang).toBe(rows);
      expect(container.textContent, lang).not.toMatch(/\{\w+\}/);
      cleanup();
    }
  });
});

describe("hreflang and the sitemap", () => {
  it("has a page for every translated path in every language", () => {
    // Plain folders rather than a [lang] segment, so no other one-segment path can ever match a language page.
    for (const lang of others)
      for (const p of ["page.tsx", "pricing/page.tsx"]) expect(existsSync(`src/app/${lang}/${p}`), `${lang} ${p}`).toBe(true);
  });

  it("lists every language and x-default on each translated page", () => {
    const alt = languageAlternates("/pricing/");
    expect(alt).toEqual({
      en: "/pricing/",
      es: "/es/pricing/",
      fr: "/fr/pricing/",
      de: "/de/pricing/",
      it: "/it/pricing/",
      ja: "/ja/pricing/",
      "x-default": "/pricing/",
    });
    for (const lang of SITE_LANGS) {
      for (const meta of [homeMetadata(lang), pricingMetadata(lang)]) {
        expect(meta.alternates?.languages, lang).toBeDefined();
        expect(Object.keys(meta.alternates!.languages!)).toHaveLength(SITE_LANGS.length + 1);
      }
      expect(homeMetadata(lang).alternates?.canonical).toBe(localPath(lang, "/"));
      expect(pricingMetadata(lang).alternates?.canonical).toBe(localPath(lang, "/pricing/"));
    }
  });

  it("puts every language's copy in the sitemap, each with its alternates", () => {
    const routes = siteRoutes();
    for (const lang of SITE_LANGS as readonly SiteLang[])
      for (const path of ["/", "/pricing/"]) {
        const r = routes.find((x) => x.path === localPath(lang, path));
        expect(r?.languages, `${lang} ${path}`).toEqual(languageAlternates(path));
      }
  });
});
