// GET /routines/ and /routines/<slug>-<id>/ (rewritten here, with ?r= for the second): the public routine library on
// the website, plain HTML with no scripts under the share pages' strict CSP (src/server/libraryPage.ts). A routine
// that isn't public answers 404 with the list; an old or changed slug redirects to the routine's own address.
import { SITE_URL } from "@/lib/site";
import { GYM_GONE_HEADERS, GYM_PAGE_HEADERS, pageLang } from "@/server/gymPage";
import { libraryIdOf, libraryIndexHtml, libraryPath, publicRoutine, publicRoutines, routineHtml } from "@/server/libraryPage";

export const dynamic = "force-dynamic";

const HEADERS = { ...GYM_PAGE_HEADERS, "Cache-Control": "public, max-age=300, s-maxage=600" };

export async function GET(req: Request) {
  const lang = pageLang(req);
  const slug = new URL(req.url).searchParams.get("r");
  try {
    if (slug !== null) {
      const id = libraryIdOf(slug);
      const found = id ? await publicRoutine(id) : null;
      if (found) {
        const path = libraryPath(found.routine);
        if (`/routines/${slug}/` !== path) return Response.redirect(`${SITE_URL}${path}`, 301);
        return new Response(routineHtml(lang, found.routine, found.more), { headers: HEADERS });
      }
      return new Response(libraryIndexHtml(lang, await publicRoutines()), { status: 404, headers: GYM_GONE_HEADERS });
    }
    return new Response(libraryIndexHtml(lang, await publicRoutines()), { headers: HEADERS });
  } catch {
    return new Response(libraryIndexHtml(lang, []), { status: 404, headers: GYM_GONE_HEADERS });
  }
}
