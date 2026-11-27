import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/** A gym's poster and report pages (/gyms/<city>/<gym>/poster/ and …/report/). */
export const GYM_TOOL_PAGES = ["/gyms/*/*/poster/", "/gyms/*/*/report/"];

/** The website widgets gyms put on their own sites (/embed/gym/<id>/…, gymWidgets.ts): pieces of other pages, always noindex. */
export const GYM_WIDGETS = "/embed/gym/";

// The app, the admin panel, the API and the personal dashboard and share pages are never indexed. Public profiles
// (/u/<handle>/) are, through their own sitemap of only the profiles their owners made public (publicProfile.ts), and so
// are the gym finder's pages (/gyms/…, gymPage.ts) and the strength standards from real lifters
// (/strength-standards/…, standardsPage.ts), through theirs. Gym logos and photos are served from /api/gyms/photo/, so
// that one API path is allowed: the gym pages show them and name them in their structured data (`image`). Each gym's
// poster and "Report a problem" pages are tools for people, always noindex: kept out of crawling so they stop filling
// Search Console's "Excluded by noindex" and using crawl visits the gym pages need (2026-11-27), and so are the gym
// widgets, whose followed link is the one in the host page, outside the frame.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/gyms/photo/"],
        disallow: ["/app/", "/admin/", "/api/", "/me/", "/share/", ...GYM_TOOL_PAGES, GYM_WIDGETS],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-people.xml`,
      `${SITE_URL}/sitemap-gyms.xml`,
      `${SITE_URL}/sitemap-strength.xml`,
    ],
  };
}
