import type { MetadataRoute } from "next";

import { absolute, siteRoutes } from "@/lib/seo";

export const dynamic = "force-static";

// Every public page, from the one route list in src/lib/seo.ts. The app, dashboard, share and admin pages
// are left out (and disallowed in robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  return siteRoutes().map((r) => ({ url: absolute(r.path), priority: r.priority, ...(r.date ? { lastModified: r.date } : {}) }));
}
