// GET /sitemap-gyms.xml (rewritten here): the gym sitemap's index (src/server/gymSitemap.ts). Server build only.
import { gymSitemap } from "@/server/gymSitemap";

export const dynamic = "force-dynamic";

export const GET = () => gymSitemap(null);
