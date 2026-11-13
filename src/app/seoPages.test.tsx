// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ArticleView, relatedTo } from "@/components/site/ArticleView";
import { SitePage } from "@/components/site/SiteChrome";
import { ARTICLES } from "@/content/articles";
import { LANDINGS } from "@/content/landings";

import AppAlternativesPage from "./alternatives/[slug]/page";
import AppLandingPage from "./apps/[slug]/page";
import BlogIndex from "./blog/page";
import ComparePage from "./compare/[slug]/page";
import BestApps from "./compare/best-workout-apps/page";
import CompareIndex from "./compare/page";
import EquipmentPage from "./equipment/[slug]/page";
import AlternativesPage from "./exercises/[slug]/alternatives/page";
import ExercisePage from "./exercises/[slug]/page";
import ExercisesIndex from "./exercises/page";
import FeaturePage from "./features/[slug]/page";
import FeaturesIndex from "./features/page";
import ImportPage from "./import/[slug]/page";
import PairPage from "./muscles/[muscle]/[equipment]/page";
import MusclePage from "./muscles/[muscle]/page";
import BodyFatPage from "./tools/body-fat-calculator/page";
import DotsPage from "./tools/dots-calculator/page";
import FfmiPage from "./tools/ffmi-calculator/page";
import HrZonesPage from "./tools/heart-rate-zone-calculator/page";
import IntervalPage from "./tools/interval-timer/page";
import MacroPage from "./tools/macro-calculator/page";
import OneRmPage from "./tools/one-rep-max-calculator/page";
import PlatePage from "./tools/plate-calculator/page";
import RpePage from "./tools/rpe-chart/page";
import StrengthStandardsPage from "./tools/strength-standards/page";
import TrainingMaxPage from "./tools/training-max-calculator/page";
import WarmupPage from "./tools/warm-up-calculator/page";
import WilksPage from "./tools/wilks-calculator/page";

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
      render(
        <SitePage kind={a.kind}>
          <ArticleView a={a} related={relatedTo(a, ARTICLES)} />
        </SitePage>,
      );
      const names = ctas();
      expect(names, a.slug).toEqual(
        expect.arrayContaining([`${a.kind}-top`, `${a.kind}-mid`, `${a.kind}-end`, `sticky-${a.kind}`, "header"]),
      );
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
    for (const P of [
      BlogIndex,
      ExercisesIndex,
      PlatePage,
      OneRmPage,
      WarmupPage,
      RpePage,
      StrengthStandardsPage,
      DotsPage,
      WilksPage,
      MacroPage,
      BodyFatPage,
      FfmiPage,
      HrZonesPage,
      IntervalPage,
      TrainingMaxPage,
    ]) {
      render(<P />);
      expectCtas();
      cleanup();
    }
  });

  it("renders the switch-from pages with their steps, calls to action and the trademark line", async () => {
    for (const slug of ["strong", "hevy"]) {
      render(await ImportPage({ params: Promise.resolve({ slug }) }));
      expectCtas();
      expect(screen.getByText(/Import from another app \(CSV\)/)).toBeTruthy();
      expect(screen.getByText(/trademarks of their owners/)).toBeTruthy();
      cleanup();
    }
  });

  it("renders every app and feature page with its calls to action and questions", async () => {
    for (const l of LANDINGS) {
      const Page = l.group === "apps" ? AppLandingPage : FeaturePage;
      render(await Page({ params: Promise.resolve({ slug: l.slug }) }));
      expectCtas();
      expect(screen.getByRole("heading", { level: 1, name: l.h1 })).toBeTruthy();
      expect(screen.getByText("Questions")).toBeTruthy();
      cleanup();
    }
    render(<FeaturesIndex />);
    expect(screen.getAllByRole("link", { name: /Lock-screen rest timer/ }).length).toBeGreaterThan(0);
    cleanup();
  });

  it("renders the comparison pages with sources, the trademark line and calls to action", async () => {
    for (const slug of ["fitbod", "hevy", "strong", "gymverse"]) {
      render(await ComparePage({ params: Promise.resolve({ slug }) }));
      expectCtas();
      expect(screen.getAllByText(/checked Nov 9, 2026/).length).toBeGreaterThan(3);
      expect(screen.getByText(/trademarks of their owners/)).toBeInTheDocument();
      cleanup();
    }
    for (const slug of ["stronglifts", "jefit", "alpha-progression", "boostcamp"]) {
      render(await ComparePage({ params: Promise.resolve({ slug }) }));
      expectCtas();
      expect(screen.getAllByText(/checked Nov 11, 2026/).length).toBeGreaterThan(3);
      cleanup();
    }
    for (const P of [CompareIndex, BestApps]) {
      render(<P />);
      expectCtas();
      expect(screen.getByText(/trademarks of their owners/)).toBeInTheDocument();
      cleanup();
    }
    for (const slug of ["fitbod", "hevy", "strong", "stronglifts"]) {
      render(await AppAlternativesPage({ params: Promise.resolve({ slug }) }));
      expectCtas();
      expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/alternatives$/);
      cleanup();
    }
  });

  it("loads a barbell on the plate calculator", () => {
    render(<PlatePage />);
    expect(screen.getByText(/Each side: 25 \+ 15$/)).toBeInTheDocument();
  });
});
