// GET /gym-chains/ and /gym-chains/<chain>/ (rewritten here, with ?chain= for the second): gym chains and every branch
// of each, plain HTML with no scripts under the share pages' strict CSP (src/server/gymChainPage.ts, docs/decisions/gyms.md
// "Gym chains"). A chain too small to show answers 404 with the list of chains. Server build only.
import { chainHtml, chainsIndexHtml } from "@/server/gymChainPage";
import { keptChainPage, keptChains } from "@/server/gymChains";
import { GYM_GONE_HEADERS, GYM_PAGE_HEADERS, pageLang } from "@/server/gymPage";

export const dynamic = "force-dynamic";

/** An hour at the edge: branches change only when an import runs. */
const HEADERS = { ...GYM_PAGE_HEADERS, "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" };

export async function GET(req: Request) {
  const lang = pageLang(req);
  const slug = new URL(req.url).searchParams.get("chain");
  try {
    if (slug !== null) {
      const page = await keptChainPage(slug);
      if (page) return new Response(chainHtml(page.chain, page.branches, lang), { headers: HEADERS });
      return new Response(chainsIndexHtml(await keptChains(), lang), { status: 404, headers: GYM_GONE_HEADERS });
    }
    return new Response(chainsIndexHtml(await keptChains(), lang), { headers: HEADERS });
  } catch {
    return new Response(chainsIndexHtml([], lang), { status: 404, headers: GYM_GONE_HEADERS });
  }
}
