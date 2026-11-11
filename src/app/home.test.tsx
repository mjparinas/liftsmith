// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DEMO_LIFTS } from "@/components/site/DemoPicker";
import { perSide } from "@/components/site/heroPlates";
import { epley, HERO_PROGRAM, labelled, muscleAnchor } from "@/components/site/heroProgram";
import { QUOTES, visibleQuotes } from "@/content/testimonials";
import { jointsAt } from "@/lib/demo/mesh";
import { hasMotion, motionFor } from "@/lib/demo/motions";
import { BODIES } from "@/lib/demo/rig";
import { FLAGS } from "@/lib/flags";
import { PRICES } from "@/lib/trial";
import { MUSCLES } from "@/lib/types";

import Home from "./page";

describe("home page", () => {
  afterEach(cleanup);
  it("leads with a free start into the app, plus the store badges", () => {
    render(<Home />);
    const hero = screen.getByRole("heading", { level: 1 }).closest("section")!;
    const first = within(hero).getAllByRole("link")[0];
    expect(first).toHaveTextContent("Build my first workout");
    expect(first.getAttribute("href")).toMatch(/^\/app\/?$/);
    // No store listing exists yet, so the badges say so instead of linking nowhere.
    expect(within(hero).getByRole("img", { name: "Google Play: coming soon" })).toBeInTheDocument();
    expect(within(hero).getByRole("img", { name: "App Store: coming soon" })).toBeInTheDocument();
    expect(
      within(hero)
        .getByRole("link", { name: /Use it in your browser today/ })
        .getAttribute("href"),
    ).toMatch(/^\/app\/?$/);
  });

  it("has plenty of calls to action, each one counted", () => {
    render(<Home />);
    const ctas = screen.getAllByRole("link").filter((a) => /^\/app\/?$/.test(a.getAttribute("href") ?? ""));
    expect(ctas.length).toBeGreaterThanOrEqual(12);
    const counted = ctas.filter((a) => a.hasAttribute("data-cta")).map((a) => a.getAttribute("data-cta"));
    expect(new Set(counted).size).toBe(counted.length); // every placement has its own name
  });

  it("outlines every major feature with a real screenshot", () => {
    render(<Home />);
    for (const name of [
      "A plan for today, built from your last workouts",
      "Big numbers, one tap, plates already worked out",
      "Your rest timer lives on the lock screen",
      "See which muscles are ready before you train them",
      "Numbers that show you're getting stronger",
    ]) {
      const article = screen.getByRole("heading", { name }).closest("article")!;
      expect(decodeURIComponent(within(article).getByRole("img").getAttribute("src")!)).toMatch(/screens\/\w+\.webp/);
    }
  });

  it("shows the confirmed prices, the trial length from the flag, and no ads", () => {
    render(<Home />);
    const pricing = screen.getByRole("heading", { name: /Start free. Go Pro/ }).closest("section")!;
    expect(pricing.textContent).toContain(PRICES.monthly.price);
    expect(pricing.textContent).toContain(PRICES.annual.price);
    expect(pricing.textContent).toContain(`${FLAGS.trialDays.default}-day free trial`);
    expect(pricing.textContent).toContain("No ads on any plan, ever");
    expect(pricing.textContent).not.toMatch(/lifetime/i);
  });

  it("labels every sample testimonial as not a real user", () => {
    render(<Home />);
    const quotes = screen.getByRole("heading", { name: "What lifters say" }).closest("section")!;
    const shown = within(quotes).queryAllByRole("listitem");
    const samples = visibleQuotes().filter((q) => q.sample).length;
    expect(within(quotes).queryAllByText("Sample quote, not a real user")).toHaveLength(samples);
    expect(shown).toHaveLength(visibleQuotes().length);
  });

  it("answers the FAQ, also as structured data", () => {
    const { container } = render(<Home />);
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    const faq = ld.find((x: { "@type": string }) => x["@type"] === "FAQPage");
    expect(faq.mainEntity.length).toBe(container.querySelectorAll("#faq details").length);
  });
});

describe("testimonials", () => {
  it("never shows a made-up quote on the live site", () => {
    expect(QUOTES.every((q) => q.sample || q.name !== "Sample lifter")).toBe(true);
    expect(visibleQuotes({ VERCEL_ENV: "production", NODE_ENV: "production" }).some((q) => q.sample)).toBe(false);
    expect(visibleQuotes({ NODE_ENV: "production" }).some((q) => q.sample)).toBe(false); // the static export too
    expect(visibleQuotes({ VERCEL_ENV: "preview", NODE_ENV: "production" }).length).toBe(QUOTES.length);
  });
});

describe("hero lifter", () => {
  it("only uses lifts that have a 3D motion", () => {
    for (const s of HERO_PROGRAM) expect(hasMotion(s.id), s.id).toBe(true);
    for (const id of DEMO_LIFTS) expect(hasMotion(id), id).toBe(true);
    expect(new Set(HERO_PROGRAM.map((s) => s.body))).toEqual(new Set(["male", "female"]));
  });

  it("does the math it shows", () => {
    expect(epley(100, 5)).toBeCloseTo(116.67, 1);
    expect(epley(100, 0)).toBe(0);
    expect(perSide(100)).toEqual([25, 15]); // 20 kg bar + 2 × 40 kg
    for (const s of HERO_PROGRAM) expect(perSide(s.kg).reduce((a, b) => a + b, 0) * 2 + 20, s.id).toBe(s.kg);
  });

  it("labels the working muscles, primary first, and anchors every label on the body", () => {
    expect(labelled("back-squat").slice(0, 2)).toEqual(["quads", "glutes"]);
    for (const s of HERO_PROGRAM) expect(labelled(s.id).length).toBeGreaterThan(0);
    const J = jointsAt(motionFor("back-squat"), BODIES.male, 0.5);
    for (const m of MUSCLES) {
      const p = muscleAnchor(m, J);
      expect(p.every(Number.isFinite), m).toBe(true);
      // within half a metre of the hips-to-shoulders line, so a label never points into empty space
      expect(Math.hypot(p[0] - J.hipC[0], p[2] - J.hipC[2]), m).toBeLessThan(1);
    }
  });
});
