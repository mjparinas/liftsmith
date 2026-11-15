import { describe, expect, it } from "vitest";

import { framePage } from "./siteFrame";

// No two cards touch (Melvin, 2026-11-15). The pages the server draws (gyms, trainers, profiles, standards) stack
// their section cards in the page's own flow, so the shared frame gives each card after another a gap.
// scripts/e2e-gaps.mjs checks the app and the static site in a browser.
describe("the server pages' shared frame", () => {
  it("puts a gap between cards stacked one after another", () => {
    const html = framePage("en", "Title", "", '<main class="page"><section class="card"></section><section class="card"></section></main>');
    expect(html).toContain(".page>.card+.card{margin-top:16px}");
  });
});
