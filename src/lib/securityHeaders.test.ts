import { describe, expect, it } from "vitest";
import { CSP, SECURITY_HEADERS } from "./securityHeaders";

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
});
