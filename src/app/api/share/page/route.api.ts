// GET /w/<id>/ (rewritten here): a public share link's page, with the card as its link preview. Plain HTML with
// no scripts and its own strict CSP (shareLinks.ts). Server build only.
import { getLink, idFrom, PAGE_HEADERS, pageHtml } from "@/server/shareLinks";
import { withPageInvite } from "@/server/siteFrame";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = idFrom(req);
  const link = await getLink(id).catch(() => null);
  return new Response(withPageInvite(pageHtml(link), req), { status: link ? 200 : 404, headers: PAGE_HEADERS });
}
