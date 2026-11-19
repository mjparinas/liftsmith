// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DATA_FLOWS, STAYS, TRUST_GROUPS } from "@/components/site/TrustCentre";
import { siteRoutes } from "@/lib/seo";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

import TrustPage from "./trust/page";

// The trust centre makes promises, so it stays short, links to the full policies and points to a working
// security contact. docs/decisions/trust-centre.md.
describe("trust centre", () => {
  afterEach(cleanup);

  it("shows every group, links to the privacy policy and delete page, and gives a security contact", () => {
    render(<TrustPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Trust centre");
    for (const g of TRUST_GROUPS) expect(screen.getByRole("heading", { level: 2, name: g.title })).toBeTruthy();
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    // next/link drops the trailing slash in tests; the real build keeps it (trailingSlash).
    expect(screen.getByRole("link", { name: "privacy policy" }).getAttribute("href")).toMatch(/^\/privacy\/?$/);
    expect(hrefs.filter((h) => /^\/delete-account\/?$/.test(h ?? "")).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: CONTACT_EMAIL }).getAttribute("href")).toBe(`mailto:${CONTACT_EMAIL}`);
  });

  it("keeps each line short and every title unique", () => {
    const titles = TRUST_GROUPS.flatMap((g) => g.controls.map((c) => c.title));
    expect(new Set(titles).size).toBe(titles.length);
    for (const g of TRUST_GROUPS) {
      expect(g.controls.length).toBeGreaterThan(0);
      for (const c of g.controls) expect(c.note.length, c.title).toBeLessThanOrEqual(90);
    }
  });

  // "What leaves your phone": one row per outside service, each saying what it gets and when, plus what never leaves.
  it("lists every outside service once, with what it gets and when", () => {
    render(<TrustPage />);
    expect(screen.getByRole("heading", { level: 2, name: "What leaves your phone" })).toBeTruthy();
    const names = DATA_FLOWS.map((f) => f.service);
    expect(new Set(names).size).toBe(names.length);
    for (const f of DATA_FLOWS) {
      expect(screen.getByRole("heading", { level: 3, name: f.service })).toBeTruthy();
      expect(f.gets.length, f.service).toBeLessThanOrEqual(90);
      expect(f.when.length, f.service).toBeLessThanOrEqual(90);
    }
    // the processors the privacy policy names all have a row
    for (const p of ["Turso", "Vercel", "Resend", "RevenueCat", "Stripe", "Anthropic", "Mapbox", "Strava"])
      expect(
        names.some((n) => n.includes(p)),
        p,
      ).toBe(true);
    for (const s of STAYS) expect(screen.getByText(s)).toBeTruthy();
  });

  it("is in the sitemap", () => {
    expect(siteRoutes().some((r) => r.path === "/trust/")).toBe(true);
  });

  // RFC 9116: Contact and Expires are required, and an expired file must not be trusted. This fails a year
  // after the date in the file: renew it (and re-check the trust centre) then.
  it("serves a current security.txt on the www host", () => {
    const txt = readFileSync(join(process.cwd(), "public/.well-known/security.txt"), "utf8");
    expect(txt).toContain(`Contact: mailto:${CONTACT_EMAIL}`);
    expect(txt).toContain(`Canonical: ${SITE_URL}/.well-known/security.txt`);
    const expires = Date.parse(/^Expires: (.+)$/m.exec(txt)?.[1] ?? "");
    expect(expires).toBeGreaterThan(Date.now());
    expect(expires - Date.now()).toBeLessThan(366 * 86_400_000);
  });
});
