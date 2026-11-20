// GET /sitemap-gyms-<n>.xml (rewritten here): one part of the gym sitemap (src/server/gymSitemap.ts). Server build only.
import { gymSitemap } from "@/server/gymSitemap";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ part: string }> }) {
  return gymSitemap((await params).part);
}
