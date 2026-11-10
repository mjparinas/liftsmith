// Security headers for every page and API route the website serves (server build only; the native shells
// load the static export from the device, where these don't apply). AGENTS.md "Security".
// The CSP here holds what can't break the app: no framing by other sites, no plugins, no <base> or form
// hijacking. A script policy (hashes, no 'unsafe-inline') is still to do (Open items).
export const CSP = ["frame-ancestors 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"].join("; ");

export const SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The web app uses the camera (rep counting), Web Bluetooth (heart rate) and nothing else from this list.
  { key: "Permissions-Policy", value: "camera=(self), bluetooth=(self), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Content-Security-Policy", value: CSP },
];
