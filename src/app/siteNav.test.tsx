// @vitest-environment jsdom
// One header on every public page (Melvin, 2026-11-11: the nav changed from the home page's links to another set on the blog).
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { NAV } from "@/components/site/SiteChrome";

import BlogIndex from "./blog/page";
import DeleteAccount from "./delete-account/page";
import Home from "./page";
import Privacy from "./privacy/page";

const navOf = () => {
  const nav = screen.getByRole("navigation", { name: "Site" });
  return within(nav)
    .getAllByRole("link")
    .map((a) => `${a.textContent} ${a.getAttribute("href")}`);
};

describe("site header", () => {
  afterEach(cleanup);

  it("shows the same links on the home page, the blog and the plain pages", () => {
    render(<Home />);
    const home = navOf();
    cleanup();
    for (const Page of [BlogIndex, Privacy, DeleteAccount]) {
      render(<Page />);
      expect(navOf()).toEqual(home);
      cleanup();
    }
  });

  it("links the home page's sections as /#… so they work from any page, and offers every link in the phone menu", () => {
    render(<BlogIndex />);
    expect(NAV.filter((n) => n.href.includes("#")).every((n) => n.href.startsWith("/#"))).toBe(true);
    const all = within(screen.getByRole("navigation", { name: "Site menu" })).getAllByRole("link");
    // Sign in joins the menu only on narrow phones, where the header has no room for it (CSS shows one or the other).
    expect(all.filter((a) => a.dataset.cta === "menu-signin").map((a) => a.getAttribute("href")?.replace("/#", "#"))).toEqual([
      "/app#/account",
    ]);
    const menu = all.filter((a) => a.dataset.cta !== "menu-signin");
    const bare = (h: string | null) => (h ?? "").replace(/\/$/, "");
    expect(menu.map((a) => bare(a.getAttribute("href")))).toEqual(NAV.map((n) => bare(n.href)));
  });
});
