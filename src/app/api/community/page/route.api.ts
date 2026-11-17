// GET /community/, /community/roadmap/, /community/changelog/ and /community/<slug>-<id>/ (rewritten here with ?view=
// or ?p=): the Liftsmith community on the website, plain HTML with no scripts under the share pages' strict CSP
// (src/server/communityPage.ts). A post that isn't public answers a noindex 404; a merged one redirects to the post it
// went into; an old or changed slug redirects to the post's own address. Server build only.
import { postPath } from "@/lib/community";
import { SITE_URL } from "@/lib/site";
import {
  changelogHtml,
  communityIndexHtml,
  goneHtml,
  postHtml,
  postIdOf,
  publicBoard,
  publicThread,
  roadmapHtml,
} from "@/server/communityPage";
import { GYM_GONE_HEADERS, GYM_PAGE_HEADERS, pageLang } from "@/server/gymPage";

export const dynamic = "force-dynamic";

const HEADERS = { ...GYM_PAGE_HEADERS, "Cache-Control": "public, max-age=120, s-maxage=300" };

export async function GET(req: Request) {
  const lang = pageLang(req);
  const q = new URL(req.url).searchParams;
  const slug = q.get("p");
  try {
    if (slug !== null) {
      const id = postIdOf(slug);
      const t = id ? await publicThread(id) : null;
      if (!t) return new Response(goneHtml(lang), { status: 404, headers: GYM_GONE_HEADERS });
      if (t.post.status === "merged" && t.merged) return Response.redirect(`${SITE_URL}${postPath(t.merged)}`, 301);
      const path = postPath(t.post);
      if (`/community/${slug}/` !== path) return Response.redirect(`${SITE_URL}${path}`, 301);
      return new Response(postHtml(lang, t.post, t.comments, t.updates), { headers: HEADERS });
    }
    const { posts, shipped } = await publicBoard();
    const view = q.get("view");
    const html =
      view === "roadmap"
        ? roadmapHtml(lang, posts, shipped)
        : view === "changelog"
          ? changelogHtml(lang, shipped)
          : communityIndexHtml(lang, posts, shipped);
    return new Response(html, { headers: HEADERS });
  } catch {
    return new Response(goneHtml(lang), { status: 404, headers: GYM_GONE_HEADERS });
  }
}
