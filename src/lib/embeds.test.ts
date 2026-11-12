import { describe, expect, it } from "vitest";

import { embedFor, embedPath, EMBEDS, embedSnippet } from "./embeds";
import { siteRoutes, TOOL_PAGES } from "./seo";

describe("embeddable calculators", () => {
  const paths = new Set(siteRoutes().map((r) => r.path));
  it("embeds only real tool pages, and keeps the embeds out of the sitemap", () => {
    for (const e of EMBEDS) {
      expect(TOOL_PAGES.some((t) => t.path === `/tools/${e.slug}/`)).toBe(true);
      expect(paths.has(embedPath(e))).toBe(false);
      expect(embedFor(e.slug)).toBe(e);
    }
  });
  it("gives a code with the frame and a plain link to the tool page after it", () => {
    const code = embedSnippet(EMBEDS[0]!);
    expect(code).toContain('<iframe src="https://www.getliftsmith.com/embed/plate-calculator/"');
    expect(code).toContain('title="Plate calculator"');
    const [frame, credit] = code.split("\n");
    expect(frame).toMatch(/<\/iframe>$/);
    expect(credit).toContain('<a href="https://www.getliftsmith.com/tools/plate-calculator/">Plate calculator</a> by Liftsmith');
    expect(credit).not.toContain("nofollow");
  });
});
