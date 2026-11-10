import type { NextConfig } from "next";

import { SECURITY_HEADERS } from "./src/lib/securityHeaders";

// Two builds from one codebase:
// - STATIC_EXPORT=1 (npm run build:static): a static export to out/ for the Capacitor shells and the
//   browser tests. The app is one offline page with hash routes.
// - Default (Vercel): the same pages, plus server routes named route.api.ts (in-app feedback, later sync).
// The static build doesn't count `.api.ts` as a page extension, so those routes are left out of it.
const isStatic = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStatic ? { output: "export" as const } : {}),
  trailingSlash: true,
  images: { unoptimized: true },
  pageExtensions: isStatic ? ["tsx", "ts"] : ["api.tsx", "api.ts", "tsx", "ts"],
  // Creator links (www.getliftsmith.com/c/<code>/) all open the one /c/ page, which reads the code from the address.
  ...(isStatic ? {} : { rewrites: async () => [{ source: "/c/:code/", destination: "/c/" }] }),
  // Security headers on every response from the website (AGENTS.md "Security"). Not in the static export.
  ...(isStatic ? {} : { headers: async () => [{ source: "/:path*", headers: SECURITY_HEADERS }] }),
  env: { NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? "dev", NEXT_PUBLIC_STATIC: isStatic ? "1" : "" },
};

export default nextConfig;
