import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import { CSP, EMBED_HEADERS, NOT_EMBED, SECURITY_HEADERS } from "./securityHeaders";

// The matcher next.config.ts headers go through, so the test checks the very pattern Next will use.
const { pathToRegexp } = createRequire(import.meta.url)("next/dist/compiled/path-to-regexp") as { pathToRegexp: (p: string) => RegExp };

describe("security headers", () => {
  const h = Object.fromEntries(SECURITY_HEADERS.map((x) => [x.key, x.value]));
  it("stops other sites framing the panel or the app, and keeps the browser strict", () => {
    expect(CSP).toContain("frame-ancestors 'self'");
    expect(CSP).toContain("object-src 'none'");
    expect(h["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Strict-Transport-Security"]).toMatch(/max-age=\d{8}/);
  });
  it("leaves the camera and Bluetooth the web app uses", () => {
    expect(h["Permissions-Policy"]).toContain("camera=(self)");
    expect(h["Permissions-Policy"]).toContain("bluetooth=(self)");
  });
  it("lets other sites frame only the embeddable calculators", () => {
    const e = Object.fromEntries(EMBED_HEADERS.map((x) => [x.key, x.value]));
    expect(e["X-Frame-Options"]).toBeUndefined();
    expect(e["Content-Security-Policy"]).toContain("frame-ancestors https:");
    expect(e["Content-Security-Policy"]).toContain("object-src 'none'");
    expect(e["Strict-Transport-Security"]).toBe(h["Strict-Transport-Security"]);
    const rest = pathToRegexp(NOT_EMBED);
    for (const p of ["/", "/tools/plate-calculator/", "/app/", "/admin/", "/api/sync/"]) expect(rest.test(p)).toBe(true);
    expect(rest.test("/embed/plate-calculator/")).toBe(false);
  });
});
