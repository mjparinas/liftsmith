// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ARTICLES } from "@/content/articles";
import { ArticleView, relatedTo } from "@/components/site/ArticleView";
import { SitePage } from "@/components/site/SiteChrome";
import BlogIndex from "./blog/page";
import ExercisesIndex from "./exercises/page";
import ExercisePage from "./exercises/[slug]/page";
import AlternativesPage from "./exercises/[slug]/alternatives/page";
import MusclePage from "./muscles/[muscle]/page";
import PairPage from "./muscles/[muscle]/[equipment]/page";
import EquipmentPage from "./equipment/[slug]/page";
import PlatePage from "./tools/plate-calculator/page";
import OneRmPage from "./tools/one-rep-max-calculator/page";

// The pages exist to send readers into the app (Melvin, 2026-11-09: "emphasis on the call to actions").
const ctas = () => [...document.querySelectorAll("[data-cta]")].map((a) => a.getAttribute("data-cta")!);
const intoApp = () => [...document.querySelectorAll("a[data-cta]")].filter((a) => /^\/app\/?$/.test(a.getAttribute("href") ?? ""));

function expectCtas() {
  const names = ctas();
  expect(names).toContain("header");
  expect(names.some((n) => n.startsWith("sticky-"))).toBe(true);
  expect(names.some((n) => n.endsWith("-end"))).toBe(true);
  expect(intoApp().length).toBeGreaterThanOrEqual(4);
}

describe("SEO pages", () => {
  afterEach(cleanup);

  it("gives every article a top, mid and end call to action into the app", () => {
    for (const a of ARTICLES) {
      render(<SitePage kind={a.kind}><ArticleView a={a} related={relatedTo(a, ARTICLES)} /></SitePage>);
      const names = ctas();
      expect(names, a.slug).toEqual(expect.arrayContaining([`${a.kind}-top`, `${a.kind}-mid`, `${a.kind}-end`, `sticky-${a.kind}`, "header"]));
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(a.title);
      cleanup();
    }
  });

  it("renders the exercise, alternatives, muscle, pair and equipment pages with their calls to action", async () => {
    const pages = [
      await ExercisePage({ params: Promise.resolve({ slug: "bench-press" }) }),
      await AlternativesPage({ params: Promise.resolve({ slug: "bench-press" }) }),
      await MusclePage({ params: Promise.resolve({ muscle: "chest" }) }),
      await PairPage({ params: Promise.resolve({ muscle: "chest", equipment: "dumbbells" }) }),
      await EquipmentPage({ params: Promise.resolve({ slug: "barbell" }) }),
    ];
    for (const p of pages) {
      render(p);
      expectCtas();
      cleanup();
    }
  });

  it("renders the indexes and the calculators", () => {
    for (const P of [BlogIndex, ExercisesIndex, PlatePage, OneRmPage]) {
      render(<P />);
      expectCtas();
      cleanup();
    }
  });

  it("loads a barbell on the plate calculator", () => {
    render(<PlatePage />);
    expect(screen.getByText(/Each side: 25 \+ 15$/)).toBeInTheDocument();
  });
});
