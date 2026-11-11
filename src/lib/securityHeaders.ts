// Security headers for every page and API route the website serves (server build only; the native shells
// load the static export from the device, where these don't apply). AGENTS.md "Security".
// The CSP here holds what can't break the app: no framing by other sites, no plugins, no <base> or form
// hijacking. The script policy is per page (each page's own inline script hashes), so scripts/csp.mjs adds it
// to the prerendered pages after the build as a <meta>; the browser enforces both.
export const CSP = ["frame-ancestors 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"].join("; ");

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The web app uses the camera (rep counting), Web Bluetooth (heart rate) and nothing else from this list.
  {
    key: "Permissions-Policy",
    value: "camera=(self), bluetooth=(self), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Content-Security-Policy", value: CSP },
];

/**
 * Public share link pages and their images (/w/<id>/, docs/decisions/sharing.md): plain HTML with no scripts at
 * all, so they get a policy that allows none, instead of the per-page script hashes. Later header rules in
 * next.config.ts win, so this replaces the CSP above on those paths.
 */
export const SHARE_PAGE_CSP =
  "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
