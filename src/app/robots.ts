import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

// The app, the admin panel and the API are never indexed.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/admin/", "/api/"] }], sitemap: `${SITE_URL}/sitemap.xml` };
}
