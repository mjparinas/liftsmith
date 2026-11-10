// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { siteRoutes } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/site";

import DeleteAccount from "./delete-account/page";

// Play's Data safety form links here: the page must name the app, give the steps, and say what's deleted and kept.
describe("delete account page", () => {
  afterEach(cleanup);

  it("names the app and gives the in-app and email steps", () => {
    render(<DeleteAccount />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Delete your Liftsmith account");
    expect(document.body.textContent).toContain("Tap Account and sync");
    const mail = screen.getAllByRole("link", { name: CONTACT_EMAIL })[0]!;
    expect(mail.getAttribute("href")).toMatch(new RegExp(`^mailto:${CONTACT_EMAIL}\\?subject=`));
  });

  it("says what's deleted, what's kept and for how long", () => {
    render(<DeleteAccount />);
    for (const h of ["What's deleted", "What's kept, and for how long", "Delete some data and keep your account"])
      expect(screen.getByRole("heading", { name: h })).toBeTruthy();
    expect(document.body.textContent).toContain("within 30 days");
  });

  it("is in the sitemap", () => {
    expect(siteRoutes().some((r) => r.path === "/delete-account/")).toBe(true);
  });
});
