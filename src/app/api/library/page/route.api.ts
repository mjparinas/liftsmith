// GET /routines/, /routines/<slug>-<id>/ and /routines/<slug>-<id>/print/ (rewritten here, with ?r= for the last two
// and &print=1 for the printable sheet, docs/decisions/printable-plans.md): the public routine library on
// the website, plain HTML with no scripts under the share pages' strict CSP (src/server/libraryPage.ts). A routine
// that isn't public answers 404 with the list; an old or changed slug redirects to the routine's own address.
import { PRINT_PAGE_CSP } from "@/lib/securityHeaders";
import { SITE_URL } from "@/lib/site";
import { GYM_GONE_HEADERS, GYM_PAGE_HEADERS, pageLang } from "@/server/gymPage";
import {
  libraryIdOf,
  libraryIndexHtml,
  libraryPath,
  publicRoutine,
  publicRoutines,
  routineHtml,
  routinePrintHtml,
} from "@/server/libraryPage";

export const dynamic = "force-dynamic";

const HEADERS = { ...GYM_PAGE_HEADERS, "Cache-Control": "public, max-age=300, s-maxage=600" };
/** A routine's print page (printable-plans.md): its one script, and out of search. */
const PRINT_HEADERS = { ...HEADERS, "Content-Security-Policy": PRINT_PAGE_CSP, "X-Robots-Tag": "noindex" };

export async function GET(req: Request) {
  const lang = pageLang(req);
  const params = new URL(req.url).searchParams;
  const slug = params.get("r");
  const print = params.get("print") === "1";
  try {
    if (slug !== null) {
      const id = libraryIdOf(slug);
      const found = id ? await publicRoutine(id) : null;
      if (found) {
        const path = libraryPath(found.routine);
        if (`/routines/${slug}/` !== path) return Response.redirect(`${SITE_URL}${path}${print ? "print/" : ""}`, 301);
        if (print) return new Response(routinePrintHtml(lang, found.routine), { headers: PRINT_HEADERS });
        return new Response(routineHtml(lang, found.routine, found.more), { headers: HEADERS });
      }
      return new Response(libraryIndexHtml(lang, await publicRoutines()), { status: 404, headers: GYM_GONE_HEADERS });
    }
    return new Response(libraryIndexHtml(lang, await publicRoutines()), { headers: HEADERS });
  } catch {
    return new Response(libraryIndexHtml(lang, []), { status: 404, headers: GYM_GONE_HEADERS });
  }
}
