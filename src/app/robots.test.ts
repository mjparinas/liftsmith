import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots.txt", () => {
  it("keeps each gym's poster and report pages, always noindex, out of crawling (Search Console, 2026-11-27)", () => {
    const [rule] = [robots().rules].flat();
    expect(rule!.disallow).toEqual(expect.arrayContaining(["/gyms/*/*/poster/", "/gyms/*/*/report/"]));
    // The gym pages themselves stay open.
    expect(rule!.disallow).not.toContain("/gyms/");
  });
  it("keeps the gym widgets other sites frame out of crawling, but not the calculators' embeds", () => {
    const [rule] = [robots().rules].flat();
    expect(rule!.disallow).toContain("/embed/gym/");
    expect(rule!.disallow).not.toContain("/embed/");
  });
});
