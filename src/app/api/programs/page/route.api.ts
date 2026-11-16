// GET /coach-programs/ and /coach-programs/<slug>-<id>/ (rewritten here, with ?p= for the second): coaches' programs on
// the website, plain HTML with no scripts under the share pages' strict CSP (src/server/programPage.ts). A program that
// isn't public answers 404 with the list; an old or changed slug redirects to the program's own address. Server build only.
import { SITE_URL } from "@/lib/site";
import { GYM_GONE_HEADERS, GYM_PAGE_HEADERS, pageLang } from "@/server/gymPage";
import { programHtml, programIdOf, programIndexHtml, programsPath, publicProgram, publicPrograms } from "@/server/programPage";

export const dynamic = "force-dynamic";

const HEADERS = { ...GYM_PAGE_HEADERS, "Cache-Control": "public, max-age=300, s-maxage=600" };

export async function GET(req: Request) {
  const lang = pageLang(req);
  const slug = new URL(req.url).searchParams.get("p");
  try {
    if (slug !== null) {
      const id = programIdOf(slug);
      const found = id ? await publicProgram(id) : null;
      if (found) {
        const path = programsPath(found.page.program);
        if (`/coach-programs/${slug}/` !== path) return Response.redirect(`${SITE_URL}${path}`, 301);
        return new Response(programHtml(lang, found.page, found.more), { headers: HEADERS });
      }
      return new Response(programIndexHtml(lang, await publicPrograms()), { status: 404, headers: GYM_GONE_HEADERS });
    }
    return new Response(programIndexHtml(lang, await publicPrograms()), { headers: HEADERS });
  } catch {
    return new Response(programIndexHtml(lang, []), { status: 404, headers: GYM_GONE_HEADERS });
  }
}
