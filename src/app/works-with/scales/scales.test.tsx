// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { NEEDS_USER_SCALES, STANDARD_SCALES } from "@/content/scales";
import { siteRoutes } from "@/lib/seo";

import Scales from "./page";

describe("/works-with/scales/", () => {
  afterEach(cleanup);

  it("lists every scale in its own group, with the sitemap entry and the calls to action", () => {
    render(<Scales />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Bluetooth scales that work");
    const should = screen.getByRole("region", { name: "Scales that should work" });
    const notYet = screen.getByRole("region", { name: "Standard scales that need a user set up" });
    for (const s of STANDARD_SCALES) expect(should.textContent).toContain(s.models);
    for (const s of NEEDS_USER_SCALES) expect(notYet.textContent).toContain(s.models);
    const ctas = [...document.querySelectorAll("[data-cta]")].map((a) => a.getAttribute("data-cta"));
    expect(ctas).toEqual(expect.arrayContaining(["header", "sticky-works-with-scales", "works-with-scales-end"]));
    expect(siteRoutes().some((r) => r.path === "/works-with/scales/")).toBe(true);
  });

  it("never lists a model in two groups", () => {
    const all = [...STANDARD_SCALES, ...NEEDS_USER_SCALES].flatMap((s) => s.models.split(", ").map((m) => `${s.brand} ${m}`));
    expect(new Set(all).size).toBe(all.length);
  });
});
