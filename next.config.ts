import { execSync } from "node:child_process";
import type { NextConfig } from "next";

import { EMBED_HEADERS, GYMS_INDEX_CSP, NOT_EMBED, REPORT_PAGE_CSP, SECURITY_HEADERS, SHARE_PAGE_CSP } from "./src/lib/securityHeaders";

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

// Production builds load each language on its own (docs/decisions/speed.md "One language at a time"): the app's
// catalogue modules are swapped for one file per language that scripts/locales.mjs writes before the build. Dev
// (`next dev`) reads the source, so text edits show at once.
const building = process.env.NODE_ENV === "production";
const LANG_FILES = ["en", "es", "fr", "de", "it", "ja", "pt", "ko", "pl", "tr"];

const nextConfig: NextConfig = {
  ...(isStatic ? { output: "export" as const } : {}),
  ...(building
    ? { turbopack: { resolveAlias: Object.fromEntries(LANG_FILES.map((l) => [`@/locales/load/${l}`, `./src/locales/gen/${l}.json`])) } }
    : {}),
  trailingSlash: true,
  images: { unoptimized: true },
  // STILLS=1 adds the build-only /stills/ page that scripts/og-images.mjs draws preview images from.
  pageExtensions: [
    ...(process.env.STILLS === "1" ? ["stills.tsx"] : []),
    ...(isStatic ? ["tsx", "ts"] : ["api.tsx", "api.ts", "tsx", "ts"]),
  ],
  // Creator links (www.getliftsmith.com/c/<code>/) all open the one /c/ page, which reads the code from the address.
  // Public share links (www.getliftsmith.com/w/<id>/ and its card image) are drawn by API routes (src/server/shareLinks.ts).
  ...(isStatic
    ? {}
    : {
        rewrites: async () => [
          { source: "/c/:code/", destination: "/c/" },
          // Invite links (www.getliftsmith.com/invite/<code>/) go on to the app's invite screen (src/app/api/invite/).
          { source: "/invite/:code/", destination: "/api/invite/?code=:code" },
          { source: "/w/:id/card.jpg", destination: "/api/share/image/?id=:id" },
          { source: "/w/:id/", destination: "/api/share/page/?id=:id" },
          // Public profiles (www.getliftsmith.com/u/<handle>/) and the sitemap of them (src/server/publicProfile.ts).
          { source: "/u/:handle/", destination: "/api/people/page/?handle=:handle" },
          { source: "/sitemap-people.xml", destination: "/api/people/sitemap/" },
          // The gym finder's pages and their sitemap (src/server/gymPage.ts, docs/decisions/gyms.md).
          { source: "/gyms/", destination: "/api/gyms/page/" },
          { source: "/gyms/:city/", destination: "/api/gyms/page/?city=:city" },
          { source: "/gyms/:city/:gym/", destination: "/api/gyms/page/?city=:city&gym=:gym" },
          { source: "/gyms/:city/:gym/poster/", destination: "/api/gyms/page/?city=:city&gym=:gym&poster=1" },
          { source: "/gyms/:city/:gym/report/", destination: "/api/gyms/page/?city=:city&gym=:gym&report=1" },
          // Gym chains and every branch of each (src/server/gymChainPage.ts); in the gym sitemap.
          { source: "/gym-chains/", destination: "/api/gyms/chain/" },
          { source: "/gym-chains/:chain/", destination: "/api/gyms/chain/?chain=:chain" },
          { source: "/sitemap-gyms.xml", destination: "/api/gyms/sitemap/" },
          // Strength standards from real lifters (src/server/standardsPage.ts, docs/decisions/public-pages-and-seo.md).
          { source: "/strength-standards/", destination: "/api/standards/page/" },
          { source: "/strength-standards/:lift/", destination: "/api/standards/page/?lift=:lift" },
          { source: "/sitemap-strength.xml", destination: "/api/standards/sitemap/" },
          // Trainers, coaches and physios by city (src/server/trainerPage.ts); in the gym sitemap.
          { source: "/trainers/", destination: "/api/trainers/page/" },
          { source: "/trainers/:city/", destination: "/api/trainers/page/?city=:city" },
          // Coaches' programs and their ratings (src/server/programPage.ts); in the gym sitemap.
          { source: "/coach-programs/", destination: "/api/programs/page/" },
          { source: "/coach-programs/:p/", destination: "/api/programs/page/?p=:p" },
          // The public routine library (src/server/libraryPage.ts); in the gym sitemap.
          { source: "/routines/", destination: "/api/library/page/" },
          { source: "/routines/:r/", destination: "/api/library/page/?r=:r" },
          // The Liftsmith community: ideas, bugs, roadmap and changelog (src/server/communityPage.ts); in the gym sitemap.
          { source: "/community/", destination: "/api/community/page/" },
          { source: "/community/roadmap/", destination: "/api/community/page/?view=roadmap" },
          { source: "/community/changelog/", destination: "/api/community/page/?view=changelog" },
          { source: "/community/:p/", destination: "/api/community/page/?p=:p" },
        ],
      }),
  // Security headers on every response from the website (AGENTS.md "Security"). Not in the static export.
  ...(isStatic
    ? {}
    : {
        headers: async () => [
          { source: NOT_EMBED, headers: SECURITY_HEADERS },
          { source: "/embed/:path*", headers: EMBED_HEADERS },
          { source: "/w/:path*", headers: [{ key: "Content-Security-Policy", value: SHARE_PAGE_CSP }] },
          { source: "/u/:path*", headers: [{ key: "Content-Security-Policy", value: SHARE_PAGE_CSP }] },
          // /gyms/ itself runs its map script (src/server/gymsNear.ts); the pages under it run none.
          { source: "/gyms/", headers: [{ key: "Content-Security-Policy", value: GYMS_INDEX_CSP }] },
          { source: "/gyms/:path+", headers: [{ key: "Content-Security-Policy", value: SHARE_PAGE_CSP }] },
          // A gym's Report a problem page posts its one form back to this site (src/server/gymReportPage.ts).
          { source: "/gyms/:city/:gym/report/", headers: [{ key: "Content-Security-Policy", value: REPORT_PAGE_CSP }] },
          { source: "/strength-standards/:path*", headers: [{ key: "Content-Security-Policy", value: SHARE_PAGE_CSP }] },
          { source: "/gym-chains/:path*", headers: [{ key: "Content-Security-Policy", value: SHARE_PAGE_CSP }] },
          { source: "/trainers/:path*", headers: [{ key: "Content-Security-Policy", value: SHARE_PAGE_CSP }] },
          { source: "/coach-programs/:path*", headers: [{ key: "Content-Security-Policy", value: SHARE_PAGE_CSP }] },
          { source: "/routines/:path*", headers: [{ key: "Content-Security-Policy", value: SHARE_PAGE_CSP }] },
          { source: "/community/:path*", headers: [{ key: "Content-Security-Policy", value: SHARE_PAGE_CSP }] },
        ],
      }),
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version ?? "dev",
    NEXT_PUBLIC_COMMIT_SHA: commitSha(),
    NEXT_PUBLIC_STATIC: isStatic ? "1" : "",
  },
};

export default nextConfig;
