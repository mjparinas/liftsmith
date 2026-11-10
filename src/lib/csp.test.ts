// The website's script policy (scripts/csp.mjs, AGENTS.md "Security"): each page allows only our own files,
// the Google and Apple sign-in libraries and the exact inline scripts Next wrote into it.
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { inlineScripts, policyFor, withPolicy } from "../../scripts/csp.mjs";

const sha = (s: string) => `'sha256-${createHash("sha256").update(s, "utf8").digest("base64")}'`;
const page = (body: string) => `<!DOCTYPE html><html><head><meta charSet="utf-8"/><title>x</title></head><body>${body}</body></html>`;

describe("website script policy", () => {
  it("hashes inline scripts the browser runs, and skips external files and JSON-LD", () => {
    const html = page(
      `<script src="/_next/a.js"></script><script>self.__next_f=[]</script><script type="application/ld+json">{"a":1}</script><script type="module">go()</script>`,
    );
    expect(inlineScripts(html)).toEqual(["self.__next_f=[]", "go()"]);
    expect(policyFor(html)).toBe(
      `script-src 'self' 'wasm-unsafe-eval' https://accounts.google.com https://appleid.cdn-apple.com ${sha("self.__next_f=[]")} ${sha("go()")}`,
    );
  });

  it("puts the policy right after the charset, before any script, and only once", () => {
    const html = page("<script>a()</script>");
    const out = withPolicy(html);
    expect(out).toContain(`<head><meta charSet="utf-8"/><meta http-equiv="Content-Security-Policy" content="script-src `);
    expect(out.indexOf("Content-Security-Policy")).toBeLessThan(out.indexOf("<script"));
    expect(withPolicy(out)).toBe(out);
  });

  it("never allows inline scripts in general or eval", () => {
    const policy = policyFor(page("<script>a()</script>"));
    expect(policy).not.toContain("'unsafe-inline'");
    expect(policy).not.toContain("'unsafe-eval'");
  });
});
