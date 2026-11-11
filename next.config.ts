import { execSync } from "node:child_process";
import type { NextConfig } from "next";

import { SECURITY_HEADERS, SHARE_PAGE_CSP } from "./src/lib/securityHeaders";

// Two builds from one codebase:
// - STATIC_EXPORT=1 (npm run build:static): a static export to out/ for the Capacitor shells and the
//   browser tests. The app is one offline page with hash routes.
// - Default (Vercel): the same pages, plus server routes named route.api.ts (in-app feedback, later sync).
// The static build doesn't count `.api.ts` as a page extension, so those routes are left out of it.
const isStatic = process.env.STATIC_EXPORT === "1";

// The commit this build is made from, shown in Settings, the admin header and the site footer (src/lib/build.ts).
// Vercel and GitHub Actions say it themselves (the Android and iOS release builds bundle the web build made in
// release.yml, so they carry its commit); elsewhere ask git. COMMIT_SHA overrides both.
function commitSha(): string {
  const fromEnv = process.env.COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA;
  if (fromEnv) return fromEnv;
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  ...(isStatic ? { output: "export" as const } : {}),
  trailingSlash: true,
  images: { unoptimized: true },
  pageExtensions: isStatic ? ["tsx", "ts"] : ["api.tsx", "api.ts", "tsx", "ts"],
  // Creator links (www.getliftsmith.com/c/<code>/) all open the one /c/ page, which reads the code from the address.
  // Public share links (www.getliftsmith.com/w/<id>/ and its card image) are drawn by API routes (src/server/shareLinks.ts).
  ...(isStatic
    ? {}
    : {
        rewrites: async () => [
          { source: "/c/:code/", destination: "/c/" },
          { source: "/w/:id/card.jpg", destination: "/api/share/image/?id=:id" },
          { source: "/w/:id/", destination: "/api/share/page/?id=:id" },
        ],
      }),
  // Security headers on every response from the website (AGENTS.md "Security"). Not in the static export.
  ...(isStatic
    ? {}
    : {
        headers: async () => [
          { source: "/:path*", headers: SECURITY_HEADERS },
          { source: "/w/:path*", headers: [{ key: "Content-Security-Policy", value: SHARE_PAGE_CSP }] },
        ],
      }),
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? "dev",
    NEXT_PUBLIC_COMMIT_SHA: commitSha(),
    NEXT_PUBLIC_STATIC: isStatic ? "1" : "",
  },
};

export default nextConfig;
