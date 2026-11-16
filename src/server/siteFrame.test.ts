import { describe, expect, it } from "vitest";

import { framePage, withPageInvite } from "./siteFrame";

// No two cards touch (Melvin, 2026-11-15). The pages the server draws (gyms, trainers, profiles, standards) stack
// their section cards in the page's own flow, so the shared frame gives each card after another a gap.
// scripts/e2e-gaps.mjs checks the app and the static site in a browser.
describe("the server pages' shared frame", () => {
  it("puts a gap between cards stacked one after another", () => {
    const html = framePage("en", "Title", "", '<main class="page"><section class="card"></section><section class="card"></section></main>');
    expect(html).toContain(".page>.card+.card{margin-top:16px}");
  });
});

// An invite in every link (Melvin, 2026-11-15): a shared page opened from an invite keeps it on its app and store links.
describe("an invite carried through a server page", () => {
  const page =
    '<a href="/app/#/today">Open</a> <a href="/app/">App</a> <a href="https://play.google.com/store/apps/details?id=x&referrer=utm_source%3Dsite">Play</a>';
  it("adds the invite to app links and the Play referrer", () => {
    const html = withPageInvite(page, new Request("https://www.getliftsmith.com/w/abc/?invite=ABCD2345"));
    expect(html).toContain('href="/app/?invite=ABCD2345#/today"');
    expect(html).toContain('href="/app/?invite=ABCD2345"');
    expect(html).toContain("referrer=utm_source%3Dinvite%26utm_campaign%3DABCD2345");
  });
  it("leaves the page alone without a real code", () => {
    expect(withPageInvite(page, new Request("https://www.getliftsmith.com/w/abc/"))).toBe(page);
    expect(withPageInvite(page, new Request("https://www.getliftsmith.com/w/abc/?invite=%22%3E%3Cscript"))).toBe(page);
  });
});
