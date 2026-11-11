import { describe, expect, it } from "vitest";

import { siteRoutes } from "@/lib/seo";

import { COMPETITORS } from "./compare";
import { landingPath, LANDINGS } from "./landings";

const text = (l: (typeof LANDINGS)[number]) => JSON.stringify(l);
const paths = new Set(siteRoutes().map((r) => r.path));

describe("app and feature pages", () => {
  it("have unique slugs and titles", () => {
    expect(new Set(LANDINGS.map(landingPath)).size).toBe(LANDINGS.length);
    expect(new Set(LANDINGS.map((l) => l.title)).size).toBe(LANDINGS.length);
    expect(new Set(LANDINGS.map((l) => l.description)).size).toBe(LANDINGS.length);
  });

  it("keep titles and descriptions to search-result length", () => {
    for (const l of LANDINGS) {
      expect(l.title.length, l.slug).toBeLessThanOrEqual(60);
      expect(l.description.length, l.slug).toBeGreaterThanOrEqual(70);
      expect(l.description.length, l.slug).toBeLessThanOrEqual(160);
    }
  });

  it("link only to pages that exist", () => {
    for (const l of LANDINGS) {
      const inline = [...text(l).matchAll(/\]\((\/[^)#]*)/g)].map((m) => m[1]!);
      for (const href of [...l.links.map((x) => x.href), ...inline]) {
        if (href.startsWith("/app/") || href === "/me/") continue;
        expect(paths.has(href), `${l.slug} links to ${href}`).toBe(true);
      }
    }
  });

  it("never name another app", () => {
    for (const l of LANDINGS)
      for (const c of COMPETITORS) expect(new RegExp(`\\b${c.name}\\b`).test(text(l)), `${l.slug} names ${c.name}`).toBe(false);
  });

  it("never use a trademarked program name", () => {
    for (const l of LANDINGS) expect(/stronglifts|starting strength|5\/3\/1|wendler/i.test(text(l)), l.slug).toBe(false);
  });

  it("use Canadian spelling for common words", () => {
    for (const l of LANDINGS) expect(/\b(color|favorite|center|meter|leveled|canceled|gray)s?\b/i.test(text(l)), l.slug).toBe(false);
  });

  it("each have at least two sections and three questions", () => {
    for (const l of LANDINGS) {
      expect(l.sections.length, l.slug).toBeGreaterThanOrEqual(2);
      expect(l.faq.length, l.slug).toBeGreaterThanOrEqual(3);
    }
  });
});
