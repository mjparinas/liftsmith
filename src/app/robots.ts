import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// The app, the admin panel, the API and the personal dashboard and share pages are never indexed. Public profiles
// (/u/<handle>/) are, through their own sitemap of only the profiles their owners made public (publicProfile.ts), and so
// are the gym finder's pages (/gyms/…, gymPage.ts), through theirs.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/admin/", "/api/", "/me/", "/share/"] }],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/sitemap-people.xml`, `${SITE_URL}/sitemap-gyms.xml`],
  };
}
