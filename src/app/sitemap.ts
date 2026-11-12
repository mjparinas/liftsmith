import type { MetadataRoute } from "next";

import { absolute, siteRoutes } from "@/lib/seo";

export const dynamic = "force-static";

// Every public page, from the one route list in src/lib/seo.ts. The app, dashboard, share and admin pages
// are left out (and disallowed in robots.ts). A page in every site language lists them all (hreflang).
export default function sitemap(): MetadataRoute.Sitemap {
  return siteRoutes().map((r) => ({
    url: absolute(r.path),
    priority: r.priority,
    ...(r.date ? { lastModified: r.date } : {}),
    ...(r.languages
      ? { alternates: { languages: Object.fromEntries(Object.entries(r.languages).map(([l, p]) => [l, absolute(p)])) } }
      : {}),
  }));
}
