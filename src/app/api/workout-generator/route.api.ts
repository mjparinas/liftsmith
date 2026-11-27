// GET /api/workout-generator/?w=<code>&lang=<lang> (or each choice on its own: eq, min, focus, goal, level, pairs,
// seed): the website's free workout generator (docs/decisions/workout-generator.md). Runs the app's own engine for a
// first-time lifter with that equipment and answers with the workout in the page's language. Nothing is stored and
// there is no database read: the same query always gives the same answer, so the CDN keeps it for a day.
import { isSiteLang, type SiteLang } from "@/lib/siteLang";
import { optionsFromQuery } from "@/lib/webWorkout";
import { genView } from "@/lib/webWorkoutView";
import { genUi } from "@/locales/site/tools/gen";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const raw = q.get("lang") ?? "en";
  const lang: SiteLang = isSiteLang(raw) ? raw : "en";
  const options = optionsFromQuery(q);
  if (!options)
    return Response.json({ error: "That workout link isn't one we know" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  return Response.json(genView(options, lang, genUi(lang)), {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
