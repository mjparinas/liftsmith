// Adds a script Content-Security-Policy to every prerendered page of the website build (AGENTS.md "Security").
// Next writes a few inline scripts into each page (its bootstrap and the page data), and they differ per page
// and per build, so the policy can't be a fixed header: this runs after `next build`, hashes each page's own
// inline scripts and puts the policy in a <meta> at the top of <head>. Scripts then run only if they come from
// our origin, are one of those exact inline scripts, or are Google's or Apple's sign-in library. Pages rendered per
// request (none of the public pages) keep only the header policy from securityHeaders.ts.
// Usage: node scripts/csp.mjs [dir]   (default .next/server/app)
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Sources allowed besides each page's own inline scripts: 'wasm-unsafe-eval' for camera rep counting, and the
 *  Google and Apple sign-in libraries (src/lib/auth.ts), which their makers serve only from their own hosts. */
export const SCRIPT_SOURCES = ["'self'", "'wasm-unsafe-eval'", "https://accounts.google.com", "https://appleid.cdn-apple.com"];
const MARK = 'http-equiv="Content-Security-Policy"';

/** Inline scripts the browser would run: no src, and no type or a JavaScript one (JSON-LD is data). */
export function inlineScripts(html) {
  const out = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1]?.toLowerCase();
    if (type && !["text/javascript", "module", "application/javascript"].includes(type)) continue;
    out.push(m[2]);
  }
  return out;
}

export function policyFor(html) {
  const hashes = [...new Set(inlineScripts(html).map((s) => `'sha256-${createHash("sha256").update(s, "utf8").digest("base64")}'`))];
  return `script-src ${[...SCRIPT_SOURCES, ...hashes].join(" ")}`;
}

/** The page with its policy at the top of <head>, before any script. Running it twice changes nothing. */
export function withPolicy(html) {
  if (html.includes(MARK)) return html;
  // After <head> and its charset tag, which must stay in the first 1,024 bytes.
  const head = /<head\b[^>]*>(\s*<meta charset=[^>]*>)?/i.exec(html);
  if (!head) return html;
  const at = head.index + head[0].length;
  return `${html.slice(0, at)}<meta ${MARK} content="${policyFor(html)}"/>${html.slice(at)}`;
}

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (name.endsWith(".html")) yield p;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2] ?? join(".next", "server", "app");
  let n = 0;
  for (const file of htmlFiles(dir)) {
    const html = readFileSync(file, "utf8");
    const next = withPolicy(html);
    if (next !== html) {
      writeFileSync(file, next);
      n++;
    }
  }
  console.log(`Script policy added to ${n} pages in ${dir}`);
}
